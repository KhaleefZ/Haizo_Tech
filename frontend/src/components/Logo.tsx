export function Logo({ className, mono }: { className?: string; mono?: boolean }) {
  const ring = mono ? '#fff' : '#1D4ED8';
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="14" stroke={ring} strokeWidth="2" />
      <ellipse cx="16" cy="16" rx="6" ry="14" stroke="#3B82F6" strokeWidth="1.5" />
      <path d="M2 16h28M5 8h22M5 24h22" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
