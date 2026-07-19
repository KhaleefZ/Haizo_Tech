/**
 * The design's `.panel-art` — a tinted, framed surface standing in for a
 * screenshot. Deliberately abstract rather than stock photography.
 *
 * Either renders one of the existing `/img/*.svg` illustrations (`src`) or a
 * line glyph passed as `children`. Both are decorative: the caption carries
 * whatever meaning the panel has, so the art itself is hidden from assistive
 * technology.
 */
export function PanelArt({
  src,
  caption,
  children,
}: {
  src?: string;
  caption: string;
  children?: React.ReactNode;
}) {
  return (
    <figure className="group relative grid aspect-[4/3] place-items-center overflow-hidden rounded-token border border-border bg-bg-tint shadow-card transition-[translate,transform,box-shadow] duration-300 ease-out-soft hover:-translate-y-1 hover:shadow-lift">
      {src ? (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.035]"
        />
      ) : (
        <span className="text-brand-sky opacity-85" aria-hidden="true">
          {children}
        </span>
      )}
      <figcaption className="absolute inset-x-0 bottom-0 border-t border-border bg-card/95 px-4 py-3 text-sm text-text-muted">
        {caption}
      </figcaption>
    </figure>
  );
}
