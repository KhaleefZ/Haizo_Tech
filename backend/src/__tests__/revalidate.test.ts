import { describe, expect, it } from 'vitest';
import { REPLAY_WINDOW_MS, sign, verify } from '../lib/revalidate.js';

const SECRET = 'test-revalidate-secret';

describe('revalidation signature', () => {
  it('verifies a signature it produced', () => {
    const ts = 1_700_000_000_000;
    const body = JSON.stringify({ event: 'blog.published', tags: ['blogs'] });
    expect(verify(SECRET, ts, body, sign(SECRET, ts, body))).toBe(true);
  });

  it('rejects a tampered body', () => {
    const ts = 1_700_000_000_000;
    const sig = sign(SECRET, ts, '{"tags":["blogs"]}');
    expect(verify(SECRET, ts, '{"tags":["everything"]}', sig)).toBe(false);
  });

  it('rejects a replayed timestamp', () => {
    // The signature binds the timestamp, so reusing a signature under a new
    // timestamp fails even before the freshness window is consulted.
    const body = '{"tags":["blogs"]}';
    const sig = sign(SECRET, 1_700_000_000_000, body);
    expect(verify(SECRET, 1_700_000_060_000, body, sig)).toBe(false);
  });

  it('rejects a signature made with a different secret', () => {
    const ts = 1_700_000_000_000;
    const body = '{"tags":["blogs"]}';
    expect(verify(SECRET, ts, body, sign('other-secret', ts, body))).toBe(false);
  });

  it('rejects a malformed signature without throwing', () => {
    expect(verify(SECRET, Date.now(), '{}', 'not-a-signature')).toBe(false);
  });

  it('closes the replay window at five minutes', () => {
    expect(REPLAY_WINDOW_MS).toBe(300_000);
  });
});
