'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './lib/cn';

export type Presence = 'online' | 'away' | 'offline';

const avatarVariants = cva(
  'relative grid shrink-0 place-items-center rounded-full bg-bg-tint-2 font-semibold text-brand-blue overflow-visible',
  {
    variants: {
      size: {
        xs: 'size-[26px] text-[0.6875rem]',
        sm: 'size-10 text-sm',
        lg: 'size-14 text-base',
      },
    },
    defaultVariants: { size: 'sm' },
  },
);

const presenceColor: Record<Presence, string> = {
  online: 'bg-success',
  away: 'bg-warning',
  offline: 'bg-text-muted',
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatarVariants> {
  /** Used for the initials fallback and as the image's alt text. */
  name: string;
  src?: string;
  presence?: Presence;
}

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { className, size, name, src, presence, ...props },
  ref,
) {
  const [failed, setFailed] = React.useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span ref={ref} className={cn(avatarVariants({ size }), className)} {...props}>
      {showImage ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          className="size-full rounded-full object-cover"
        />
      ) : (
        <span aria-hidden>{initialsFrom(name)}</span>
      )}

      {presence ? (
        <span
          role="img"
          aria-label={`${name} is ${presence}`}
          className={cn(
            'absolute -bottom-px -right-px size-[11px] rounded-full border-2 border-bg',
            presenceColor[presence],
          )}
        />
      ) : null}
    </span>
  );
});
