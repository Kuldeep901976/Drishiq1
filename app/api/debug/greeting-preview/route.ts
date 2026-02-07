/**
 * Debug endpoint for greeting preview template
 * Dev-only endpoint to test the new greeting template without affecting production
 */

import { buildGreetingPreview, GreetingInputs } from '@/lib/ddsa/greeting/template';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const inputs: GreetingInputs = {
      brand: body.brand,
      name: body.name,
      city: body.city,
      timezone: body.timezone,
      role: body.role,
      lastGoal: body.lastGoal,
      astro: body.astro,
    };

    const text = buildGreetingPreview(inputs);

    return NextResponse.json(
      {
        greeting: text,
        inputs,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate greeting preview',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'Greeting Preview API',
      usage: 'POST with { brand?, name?, city?, timezone?, role?, lastGoal?, astro?: { sun?, moon? } }',
    },
    { status: 200 }
  );
}







