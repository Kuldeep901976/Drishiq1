// app/api/admin/ddsa/report/[thread_id]/download/route.ts
// GET /api/admin/ddsa/report/[thread_id]/download
// Download PDF report for a thread

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
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

    // Get final plan with pdf_path
    const { data: finalPlan, error: planError } = await supabase
      .from('ddsa_final_plan')
      .select('pdf_path')
      .eq('thread_id', threadId)
      .maybeSingle();

    if (planError) {
      return NextResponse.json(
        { error: 'Failed to fetch final plan', details: planError.message },
        { status: 500 }
      );
    }

    if (!finalPlan || !finalPlan.pdf_path) {
      return NextResponse.json(
        { error: 'PDF not generated yet. Generate report first.' },
        { status: 404 }
      );
    }

    const pdfPath = finalPlan.pdf_path;

    // Try to download from Supabase Storage first
    if (pdfPath.startsWith('reports/') || !pdfPath.startsWith('http') && !pdfPath.startsWith('/')) {
      // Assume it's a storage path
      const pathParts = pdfPath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const storagePath = pdfPath.startsWith('reports/') ? pdfPath : `reports/${pdfPath}`;

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('reports')
        .download(storagePath);

      if (!downloadError && fileData) {
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="DrishiQ-Report-${threadId.substring(0, 8)}.pdf"`
          }
        });
      }
    }

    // If it's a public URL, redirect to it
    if (pdfPath.startsWith('http')) {
      return NextResponse.redirect(pdfPath);
    }

    // If it's a relative path, try to generate PDF on-the-fly
    // This fallback generates the PDF if storage fails
    try {
      const internalSecret = process.env.DDSA_INTERNAL_SECRET;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      const pdfResponse = await fetch(`${baseUrl}/api/enriched-plan/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': internalSecret || '',
          'Authorization': internalSecret ? `Bearer ${internalSecret}` : ''
        },
        body: JSON.stringify({
          threadId,
          userId: 'admin'
        })
      });

      if (pdfResponse.ok) {
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const buffer = Buffer.from(pdfBuffer);

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="DrishiQ-Report-${threadId.substring(0, 8)}.pdf"`
          }
        });
      }
    } catch (generateError) {
      console.error('[download-report] Failed to generate PDF on-the-fly:', generateError);
    }

    return NextResponse.json(
      { error: 'PDF file not found' },
      { status: 404 }
    );

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}









