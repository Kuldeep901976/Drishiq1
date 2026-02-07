// app/api/webhooks/payment/route.ts
// Webhook handler for payment events to attribute conversions

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { attributePurchase } from '@/lib/affiliate-integration';
import crypto from 'crypto';

/**
 * Verify webhook signature (example for Stripe/Razorpay)
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // This is a generic example - adjust based on your payment provider
  // For Stripe: use stripe.webhooks.constructEvent()
  // For Razorpay: use razorpay.webhooks.verify()
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * POST /api/webhooks/payment
 * Handle payment completed events for affiliate attribution
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-webhook-signature') || 
                     req.headers.get('x-razorpay-signature') ||
                     req.headers.get('stripe-signature') || '';
    
    // Verify webhook signature
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (webhookSecret && !verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    const event = JSON.parse(body);
    const supabase = createServiceClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }
    
    // Handle different event types
    // Adjust based on your payment provider's event structure
    if (event.type === 'payment.completed' || event.event === 'payment.captured') {
      const paymentData = event.data?.object || event.payload;
      const userId = paymentData.metadata?.user_id || paymentData.notes?.user_id;
      const orderId = paymentData.id || paymentData.order_id;
      const amount = paymentData.amount / 100; // Convert from cents/paise to currency unit
      const currency = paymentData.currency || 'INR';
      
      if (!userId || !orderId) {
        console.warn('Missing userId or orderId in payment event');
        return NextResponse.json({ success: false, message: 'Missing required data' });
      }
      
      // Use integration helper for purchase attribution
      const attribution = await attributePurchase(
        userId,
        orderId,
        amount,
        currency,
        {
          payment_provider: event.provider || 'unknown',
          payment_id: orderId,
          event_type: event.type || event.event
        }
      );
      
      if (!attribution.success) {
        // Log but don't fail webhook - attribution is not critical
        console.warn('Affiliate attribution failed:', attribution.error);
        return NextResponse.json({
          success: true,
          message: attribution.error || 'No affiliate attribution'
        });
      }
      
      return NextResponse.json({
        success: true,
        data: {
          affiliateId: attribution.affiliateId,
          earningsId: attribution.earningsId
        }
      });
    }
    
    // Handle refund events
    if (event.type === 'payment.refunded' || event.event === 'payment.refunded') {
      const refundData = event.data?.object || event.payload;
      const orderId = refundData.payment_id || refundData.order_id;
      
      if (!orderId) {
        return NextResponse.json({ success: false, message: 'Missing order ID' });
      }
      
      // Find and update earnings
      const { data: earnings } = await supabase
        .from('affiliate_earnings')
        .select('*')
        .eq('order_id', orderId)
        .eq('event_type', 'purchase')
        .eq('payout_status', 'pending');
      
      if (earnings && earnings.length > 0) {
        // Update earnings to refund status
        await supabase
          .from('affiliate_earnings')
          .update({
            event_type: 'refund',
            payout_status: 'cancelled'
          })
          .eq('order_id', orderId)
          .eq('event_type', 'purchase');
        
        // Create refund earnings record
        await supabase
          .from('affiliate_earnings')
          .insert(
            earnings.map((e: any) => ({
              affiliate_id: e.affiliate_id,
              user_id: e.user_id,
              event_type: 'refund',
              amount: -e.amount, // Negative amount for refund
              currency: e.currency,
              order_id: orderId,
              payout_status: 'cancelled',
              metadata: { original_earning_id: e.id }
            }))
          );
      }
      
      return NextResponse.json({ success: true, message: 'Refund processed' });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Event type not handled' 
    });
    
  } catch (error: any) {
    console.error('Error in payment webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

