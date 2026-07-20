'use client';

import dynamic from 'next/dynamic';

/**
 * Loads the support widget as its own client-only chunk AFTER hydration, so its
 * bundle (and socket.io-client) never lands on the server render or the critical
 * path — it can't touch LCP.
 */
const SupportWidget = dynamic(() => import('./SupportWidget'), { ssr: false });

export function SupportWidgetMount() {
  return <SupportWidget />;
}
