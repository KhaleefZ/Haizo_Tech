import type { Industry } from '@haizo/types';
import { Reveal } from './Reveal';

const ART: Record<string, string> = {
  healthcare: '/img/industry-healthcare.svg',
  fintech: '/img/industry-fintech.svg',
  education: '/img/industry-education.svg',
  hospitality: '/img/industry-hospitality.svg',
  logistics: '/img/industry-logistics.svg',
  'cloud-internal-tooling': '/img/industry-cloud.svg',
};

/**
 * One sliding band of industry cards. Pure CSS loop, no client JS.
 *
 * The track is duplicated once and travels exactly 50%. Trailing padding makes
 * the track width an exact multiple of card+gap — without it the loop lands a
 * gap short and visibly jumps every cycle.
 */
export function IndustryBand({ industries }: { industries: Industry[] }) {
  if (!industries.length) return null;
  const track = [...industries, ...industries];

  return (
    <section className="bg-bg-tint py-24" id="industries">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-overline uppercase text-brand-blue">Industries we build for</p>
          <h2 className="mt-3 text-h2">Domain knowledge, not just delivery</h2>
          <p className="mt-3 max-w-[60ch] text-body-lg text-text-muted">
            Sectors we&rsquo;ve shipped into. We know where each one&rsquo;s systems usually break.
          </p>
        </Reveal>
      </div>

      <div className="mt-10 overflow-hidden" role="region" aria-label="Industries we build for">
        <div className="flex w-max animate-[slide_44s_linear_infinite] gap-4 pr-4 hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
          {track.map((ind, i) => (
            <article
              key={`${ind.id}-${i}`}
              aria-hidden={i >= industries.length}
              className="group relative flex h-[230px] w-[300px] flex-none flex-col justify-end overflow-hidden rounded-2xl border border-border bg-bg-tint shadow-card transition-[translate,transform,box-shadow] duration-300 ease-out-soft hover:-translate-y-2 hover:border-brand-blue hover:shadow-lift"
            >
              <span
                className="absolute inset-0 bg-cover bg-center opacity-[0.94] transition-[opacity,translate,transform] duration-500 ease-out-soft group-hover:scale-105 group-hover:opacity-100"
                style={{ backgroundImage: `url('${ART[ind.slug] ?? ART.healthcare}')` }}
                aria-hidden="true"
              />
              {/* Scrim: text must never sit directly on the artwork. */}
              <span
                className="absolute inset-0 bg-gradient-to-b from-brand-navy/0 via-brand-navy/40 to-brand-navy/90"
                aria-hidden="true"
              />
              <div className="relative p-4">
                <h3 className="font-display text-xl font-semibold text-white transition-colors group-hover:text-brand-sky">
                  {ind.name}
                </h3>
                <p className="mt-1 text-sm text-white/85">{ind.capability}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
