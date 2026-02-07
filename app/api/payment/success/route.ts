import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      payment_id, 
      amount_contributed, 
      currency, 
      support_level, 
      user_email,
      status = 'completed' 
    } = body;

    if (!payment_id || !amount_contributed || !user_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update the credits table with payment details
    const { error: updateError } = await supabase
      .from('credits')
      .update({
        amount_contributed: amount_contributed,
        payment_id: payment_id,
        payment_status: status,
        funded_at: new Date().toISOString(),
        status: status === 'completed' ? 'funded' : 'pending'
      })
      .eq('email', user_email)
      .eq('payment_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (updateError) {
      console.error('Error updating credits table:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment status updated successfully' 
    });

  } catch (error) {
    console.error('Payment success callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
