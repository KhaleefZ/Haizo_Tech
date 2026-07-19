'use client';

import { Avatar, type AvatarProps } from '@haizo/ui';
import { useIsOnline } from '../../lib/presence';

/**
 * An Avatar whose presence dot tracks live socket presence. Pass the `userId` to
 * light it; omit it (e.g. for a channel avatar) and no dot shows.
 */
export function PresenceAvatar({
  userId,
  ...props
}: { userId?: string } & Omit<AvatarProps, 'presence'>) {
  const online = useIsOnline(userId);
  return <Avatar {...props} presence={userId ? (online ? 'online' : 'offline') : undefined} />;
}
