/**
 * The running strip of what we do. Server-rendered — no client JS needed, the
 * loop is pure CSS. The track is duplicated once and travels exactly 50%, and
 * the copy is aria-hidden so each item is announced only once.
 */
export function Marquee({ items }: { items: string[] }) {
  if (!items.length) return null;
  const track = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-border bg-bg py-4" role="region" aria-label="What we do">
      <div className="flex w-max animate-[marquee_34s_linear_infinite] items-center gap-10 hover:[animation-play-state:paused]">
        {track.map((item, i) => (
          <span
            key={`${item}-${i}`}
            aria-hidden={i >= items.length}
            className="flex items-center gap-2.5 whitespace-nowrap font-display text-lg font-semibold text-text-strong"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-sky" aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
