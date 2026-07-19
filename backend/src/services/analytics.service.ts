/**
 * First-party analytics. Raw PageViews stream in from the marketing site; a
 * nightly (and on-read) rollup collapses them into MetricDaily so the dashboard
 * reads a tiny per-day table rather than the full event log.
 */
import type { AnalyticsSummary, RecordPageView } from '@haizo/types';
import { analyticsRepository } from '../repositories/analytics.repository.js';
import { logger } from '../lib/logger.js';

const WINDOW_DAYS = 14;

/** Midnight UTC for a given instant, as a date-only value. */
function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const analyticsService = {
  async recordPageView(input: RecordPageView): Promise<void> {
    await analyticsRepository.createPageView({ path: input.path, referrer: input.referrer ?? null });
  },

  /** Recompute one day's MetricDaily from its raw PageViews. */
  async rollup(day: Date): Promise<void> {
    const start = utcDayStart(day);
    const views = await analyticsRepository.countViewsBetween(start, addDays(start, 1));
    await analyticsRepository.upsertDaily(start, views);
  },

  async getAnalytics(): Promise<AnalyticsSummary> {
    const today = utcDayStart(new Date());
    // Keep today fresh without depending on the nightly cron having run.
    await this.rollup(today);

    const since = addDays(today, -(WINDOW_DAYS - 1));
    const rows = await analyticsRepository.dailySince(since);
    const byDay = new Map(rows.map((r) => [ymd(r.date), r.views]));

    const daily = Array.from({ length: WINDOW_DAYS }, (_, i) => {
      const date = ymd(addDays(since, i));
      return { date, views: byDay.get(date) ?? 0 };
    });

    const totalViews = daily.reduce((sum, d) => sum + d.views, 0);
    const top = await analyticsRepository.topPathsSince(since, 5);
    const topPaths = top.map((t) => ({ path: t.path, views: t._count.path }));

    return { totalViews, daily, topPaths };
  },

  /** Nightly: finalise yesterday and refresh today. */
  async nightlyRollup(): Promise<void> {
    const today = utcDayStart(new Date());
    try {
      await this.rollup(addDays(today, -1));
      await this.rollup(today);
      logger.info('analytics rollup complete');
    } catch (err) {
      logger.error({ err }, 'analytics rollup failed');
    }
  },
};
