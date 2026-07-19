'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

/**
 * First-party page-view beacon. Fires once per client-side route change to the
 * API's public analytics endpoint. No cookies, no PII — just the path and the
 * referrer. Failures are swallowed so analytics can never affect the page.
 */
export function Analytics() {
  const pathname = usePathname();

  React.useEffect(() => {
    if (!pathname) return;
    fetch(`${API}/v1/analytics/pageview`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer: document.referrer || null }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
