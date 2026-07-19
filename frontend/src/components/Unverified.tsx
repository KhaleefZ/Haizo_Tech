/**
 * Anti-fabrication markers, carried across from the approved mockups.
 *
 * This project exists because invented claims shipped to production once. The
 * mockups mark every unconfirmed figure with `.unverified` and carry a warning
 * banner; both survive the port rather than being quietly promoted to fact.
 *
 * A marked figure must keep its marker until someone confirms it with the
 * client and deletes the wrapper deliberately. Nothing here is decorative.
 */

/** An unconfirmed figure. `reason` explains what still needs checking. */
export function Unverified({ children, reason }: { children: React.ReactNode; reason: string }) {
  return (
    <span
      title={`Unverified — ${reason}`}
      className="cursor-help rounded-[3px] border-b-2 border-dotted border-warning bg-warning/[0.13] px-[3px]"
    >
      {children}
    </span>
  );
}

/** Page-level banner stating that unverified copy is present. */
export function UnverifiedBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-4">
      <div
        role="note"
        className="rounded-r-lg border-l-[3px] border-warning bg-warning/[0.10] px-4 py-3 text-sm text-text"
      >
        <strong className="text-text-strong">Unverified copy on this page.</strong>{' '}
        {children}
      </div>
    </div>
  );
}
