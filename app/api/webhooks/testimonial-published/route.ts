// app/api/webhooks/testimonial-published/route.ts
// This webhook is called when a testimonial is published

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { testimonial_id } = await request.json();
    
    if (!testimonial_id) {
      return NextResponse.json({ error: 'Testimonial ID is required' }, { status: 400 });
    }

    // Call the auto-translate API
    const translateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/testimonials/auto-translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ testimonial_id }),
    });

    if (!translateResponse.ok) {
      const errorData = await translateResponse.json();
      console.error('Auto-translation failed:', errorData);
      return NextResponse.json({ error: 'Auto-translation failed' }, { status: 500 });
    }

    const result = await translateResponse.json();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Testimonial auto-translated successfully',
      testimonial_id: testimonial_id,
      translation_result: result
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

