/**
 * Parse debug flags from request (query or headers).
 */

import { NextRequest } from 'next/server';

export function parseDebugFlags(request: NextRequest): Record<string, boolean | string> {
  const debug: Record<string, boolean | string> = {};
  const url = request.nextUrl;
  url.searchParams.forEach((value, key) => {
    if (key.startsWith('debug') || key.startsWith('dbg')) {
      debug[key] = value === 'true' ? true : value === 'false' ? false : value;
    }
  });
  return debug;
}
