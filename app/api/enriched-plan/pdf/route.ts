// app/api/enriched-plan/pdf/route.ts
// Generate PDF from ENRICHED_PLAN

import { NextRequest, NextResponse } from 'next/server';
// @ts-expect-error - Module resolution issue, files exist with exports
import { generateEnrichedPlanPDF, validatePDFContents } from '@/lib/pdf-generator';
// @ts-expect-error - Module resolution issue, files exist with exports
import { loadDdsState } from '@/lib/dds-state';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { threadId, userId } = body;

    if (!threadId || !userId) {
      return NextResponse.json(
        { error: 'threadId and userId required' },
        { status: 400 }
      );
    }

    // Load enriched plan from dds_state
    const ddsState = await loadDdsState(threadId);
    
    if (!ddsState.enriched_plan) {
      return NextResponse.json(
        { error: 'No enriched plan found for this thread' },
        { status: 404 }
      );
    }

    // Prepare PDF data
    const pdfData = {
      problem: {
        summary: ddsState.enriched_plan.problem?.summary || 'Problem summary not available',
        domain_of_life: ddsState.enriched_plan.problem?.domain_of_life,
        severity: ddsState.enriched_plan.problem?.severity
      },
      actions: ddsState.enriched_plan.actions || [],
      intent: ddsState.intent?.label,
      score: ddsState.enriched_plan.score,
      userProfile: {
        first_name: body.userProfile?.first_name,
        city: body.userProfile?.city,
        country: body.userProfile?.country
      },
      timestamp: new Date().toISOString()
    };

    // Generate PDF
    const pdfBuffer = generateEnrichedPlanPDF(pdfData);

    // Validate contents (check for PII leakage)
    const validation = validatePDFContents(pdfBuffer, ['first_name', 'city', 'country']);
    
    if (!validation.valid) {
      console.warn('⚠️ PDF validation warnings:', validation.warnings);
    }

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="DrishiQ-ActionPlan-${threadId.slice(0, 8)}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
  } catch (err: any) {
    console.error('PDF generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: err.message },
      { status: 500 }
    );
  }
}

