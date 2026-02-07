import { NextResponse } from 'next/server';
import { healthcheck } from '@/lib/healthcheck';

export function GET() {
  return NextResponse.json({ status: healthcheck() });
}
