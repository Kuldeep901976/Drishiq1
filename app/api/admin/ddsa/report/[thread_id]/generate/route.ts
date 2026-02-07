// app/api/admin/ddsa/report/[thread_id]/generate/route.ts
// POST /api/admin/ddsa/report/[thread_id]/generate
// Trigger PDF generation stage and update ddsa_final_plan.pdf_path

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import audit from '@/lib/audit-db';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to load dds_state
async function loadDdsState(threadId: string): Promise<any> {
  const { data, error } = await supabase
    .from('dds_state')
    .select('state_data')
    .eq('thread_id', threadId)
    .maybeSingle();

  if (error) {
    console.error('[generate-report] Error loading dds_state:', error);
    return null;
  }

  return data?.state_data || {};
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ thread_id: string }> | { thread_id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const threadId = resolvedParams.thread_id;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // Check if ddsa_final_plan exists
    const { data: finalPlan, error: planError } = await supabase
      .from('ddsa_final_plan')
      .select('*')
      .eq('thread_id', threadId)
      .maybeSingle();

    if (planError && planError.code !== 'PGRST116') {
      await audit.log('REPORT_GENERATE.ERROR', {
        thread_id: threadId,
        error: planError.message
      });
      return NextResponse.json(
        { error: 'Failed to check final plan', details: planError.message },
        { status: 500 }
      );
    }

    // Load dds_state to get enriched_plan
    const ddsState = await loadDdsState(threadId);
    
    if (!ddsState || !ddsState.enriched_plan) {
      return NextResponse.json(
        { error: 'No enriched plan found. Generate plan first.' },
        { status: 404 }
      );
    }

    // Check if PDF already exists
    if (finalPlan?.pdf_path) {
      await audit.log('REPORT_GENERATE.ALREADY_EXISTS', {
        thread_id: threadId,
        pdf_path: finalPlan.pdf_path
      });
      
      return NextResponse.json({
        success: true,
        message: 'PDF already generated',
        pdf_path: finalPlan.pdf_path,
        existing: true
      });
    }

    // Trigger PDF generation via internal API
    const internalSecret = process.env.DDSA_INTERNAL_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Call the PDF generation endpoint (or trigger the pdf stage)
    // For now, we'll use the enriched-plan/pdf endpoint
    try {
      const pdfResponse = await fetch(`${baseUrl}/api/enriched-plan/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': internalSecret || '',
          'Authorization': internalSecret ? `Bearer ${internalSecret}` : ''
        },
        body: JSON.stringify({
          threadId,
          userId: request.headers.get('x-user-id') || 'admin'
        })
      });

      if (!pdfResponse.ok) {
        const errorData = await pdfResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'PDF generation failed');
      }

      // Get PDF buffer from response
      const pdfBuffer = await pdfResponse.arrayBuffer();
      
      // Store PDF in Supabase Storage (or use file system path)
      // For now, we'll create a simple path pattern: reports/{thread_id}.pdf
      const pdfPath = `reports/${threadId}-${Date.now()}.pdf`;
      
      // Upload to Supabase Storage bucket (if configured)
      // Otherwise, just store the path and assume file will be served from filesystem
      const { error: storageError } = await supabase.storage
        .from('reports')
        .upload(pdfPath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      let finalPdfPath = pdfPath;
      
      if (storageError) {
        // If storage fails, log but continue with path (assuming file system)
        console.warn('[generate-report] Storage upload failed:', storageError);
        // Use a URL pattern instead
        finalPdfPath = `/api/admin/ddsa/report/${threadId}/download`;
      } else {
        // Get public URL if storage bucket is public
        const { data: publicUrlData } = supabase.storage
          .from('reports')
          .getPublicUrl(pdfPath);
        finalPdfPath = publicUrlData?.publicUrl || pdfPath;
      }

      // Upsert ddsa_final_plan with pdf_path
      const { data: updatedPlan, error: updateError } = await supabase
        .from('ddsa_final_plan')
        .upsert({
          thread_id: threadId,
          plan_data: finalPlan?.plan_data || ddsState.enriched_plan || {},
          pdf_path: finalPdfPath,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'thread_id'
        })
        .select()
        .single();

      if (updateError) {
        await audit.log('REPORT_GENERATE.UPDATE_FAILED', {
          thread_id: threadId,
          error: updateError.message
        });
        return NextResponse.json(
          { error: 'Failed to update final plan with PDF path', details: updateError.message },
          { status: 500 }
        );
      }

      // Record progress for PDF stage
      if (internalSecret) {
        try {
          await fetch(`${baseUrl}/api/internal/ddsa/stage/pdf/progress`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-key': internalSecret,
              'x-agent-id': 'C2'
            },
            body: JSON.stringify({
              thread_id: threadId,
              status: 'completed',
              output_data: {
                pdf_path: finalPdfPath,
                generated_at: new Date().toISOString()
              }
            })
          });
        } catch (progressError) {
          // Log but don't fail the request
          console.warn('[generate-report] Failed to record progress:', progressError);
        }
      }

      await audit.log('REPORT_GENERATE.SUCCESS', {
        thread_id: threadId,
        pdf_path: finalPdfPath
      });

      return NextResponse.json({
        success: true,
        pdf_path: finalPdfPath,
        message: 'PDF generated successfully'
      });

    } catch (pdfError: any) {
      await audit.log('REPORT_GENERATE.PDF_FAILED', {
        thread_id: threadId,
        error: pdfError.message
      });
      
      return NextResponse.json(
        { error: 'PDF generation failed', details: pdfError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    await audit.log('REPORT_GENERATE.ERROR', {
      error: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}









