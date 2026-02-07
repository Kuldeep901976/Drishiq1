// lib/testimonial-auto-translate.ts
// Utility function to trigger auto-translation when testimonial is published

export async function triggerTestimonialAutoTranslate(testimonialId: number) {
  try {
    const response = await fetch('/api/testimonials/auto-translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ testimonial_id: testimonialId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Auto-translation failed:', errorData);
      return { success: false, error: errorData };
    }

    const result = await response.json();
    console.log('Testimonial auto-translated successfully:', result);
    return { success: true, result };

  } catch (error) {
    console.error('Error triggering auto-translation:', error);
    return { success: false, error: error };
  }
}

// Call this function after a testimonial is successfully published
export async function onTestimonialPublished(testimonialId: number) {
  // Trigger auto-translation
  await triggerTestimonialAutoTranslate(testimonialId);
  
  // You can add other post-publication actions here
  // e.g., send notifications, update analytics, etc.
}

