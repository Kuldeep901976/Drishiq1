import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { jsPDF } from 'jspdf';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { threadId, userId } = await request.json();

    if (!threadId || !userId) {
      return NextResponse.json(
        { error: 'Thread ID and User ID are required' },
        { status: 400 }
      );
    }

    // Get thread information
    const { data: thread, error: threadError } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('id', threadId)
      .eq('user_id', userId)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Get all messages for the thread
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Get user responses
    const { data: responses, error: responsesError } = await supabase
      .from('chat_user_responses')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    // Create PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    const lineHeight = 7;
    const margin = 20;

    // Helper function to add text with word wrap
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * lineHeight);
    };

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    yPosition = addText('DrishiQ Chat Conversation', margin, yPosition, pageWidth - 2 * margin, 20);
    yPosition += 10;

    // Thread information
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    yPosition = addText(`Domain: ${thread.domain_of_life}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addText(`Stage: ${thread.stage}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addText(`Language: ${thread.language}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addText(`Created: ${new Date(thread.created_at).toLocaleString()}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addText(`Last Updated: ${new Date(thread.updated_at).toLocaleString()}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 15;

    // Add separator line
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Messages
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    yPosition = addText('Conversation History', margin, yPosition, pageWidth - 2 * margin, 14);
    yPosition += 10;

    messages.forEach((message, index) => {
      checkNewPage(30);

      // Message header
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      const timestamp = new Date(message.created_at).toLocaleString();
      const roleText = message.role === 'user' ? 'You' : 'DrishiQ';
      yPosition = addText(`${roleText} - ${timestamp}`, margin, yPosition, pageWidth - 2 * margin, 10);
      
      // Message content
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const content = message.content.replace(/\n/g, ' ').trim();
      yPosition = addText(content, margin, yPosition, pageWidth - 2 * margin, 11);
      
      yPosition += 10;
    });

    // User responses section
    if (responses && responses.length > 0) {
      checkNewPage(30);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      yPosition = addText('Your Responses', margin, yPosition, pageWidth - 2 * margin, 14);
      yPosition += 10;

      responses.forEach((response, index) => {
        checkNewPage(20);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        const timestamp = new Date(response.created_at).toLocaleString();
        yPosition = addText(`Response ${index + 1} - ${timestamp}`, margin, yPosition, pageWidth - 2 * margin, 10);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        // Response value
        if (response.response_value) {
          const responseText = JSON.stringify(response.response_value, null, 2);
          yPosition = addText(`Selected: ${responseText}`, margin, yPosition, pageWidth - 2 * margin, 11);
        }
        
        // Additional text
        if (response.response_text) {
          yPosition = addText(`Additional thoughts: ${response.response_text}`, margin, yPosition, pageWidth - 2 * margin, 11);
        }
        
        yPosition += 10;
      });
    }

    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Page ${i} of ${totalPages} - Generated by DrishiQ`,
        margin,
        pageHeight - 10
      );
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="drishiq-chat-${threadId.slice(0, 8)}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}




