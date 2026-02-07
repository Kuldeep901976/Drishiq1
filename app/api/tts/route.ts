import { NextResponse } from 'next/server';

// Helper to split text into chunks under 5000 bytes
function chunkText(text: string, maxBytes: number = 4500): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  for (const sentence of sentences) {
    const testChunk = currentChunk + sentence;
    
    // Check byte length (UTF-8)
    if (new TextEncoder().encode(testChunk).length > maxBytes) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        // Single sentence is too long, force split
        chunks.push(sentence.trim());
      }
    } else {
      currentChunk = testChunk;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

export async function POST(request: Request) {
  try {
    const { text, language = 'en', chunkIndex = 0 } = await request.json();
    
    const voiceNames: Record<string, string> = {
      'en': 'en-US-Neural2-J',
      'hi': 'hi-IN-Neural2-A',
      'bn': 'bn-IN-Standard-A',
      'ta': 'ta-IN-Standard-A',
      'te': 'te-IN-Standard-A',
      'mr': 'mr-IN-Standard-A',
      'es': 'es-ES-Neural2-A',
      'fr': 'fr-FR-Neural2-A',
      'de': 'de-DE-Neural2-A',
      'ar': 'ar-XA-Standard-A',
    };
    
    const voiceName = voiceNames[language] || 'en-US-Neural2-J';
    const languageCode = voiceName.split('-').slice(0, 2).join('-');
    
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    // Split text into chunks if needed
    const chunks = chunkText(text);
    console.log(`Total chunks: ${chunks.length}, processing chunk ${chunkIndex + 1}`);
    
    // Get the requested chunk
    const textChunk = chunks[chunkIndex] || text;
    
    // Check byte size
    const byteSize = new TextEncoder().encode(textChunk).length;
    console.log(`Chunk ${chunkIndex + 1} byte size: ${byteSize}`);
    
    if (byteSize > 5000) {
      return NextResponse.json({ 
        error: 'Text chunk still too long', 
        byteSize 
      }, { status: 400 });
    }

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: textChunk },
          voice: { languageCode, name: voiceName },
          audioConfig: { 
            audioEncoding: 'MP3',
            speakingRate: 0.9,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Google TTS error:', error);
      return NextResponse.json({ error, chunks: chunks.length }, { status: response.status });
    }

    const data = await response.json();
    const audioBuffer = Buffer.from(data.audioContent, 'base64');

    return new NextResponse(audioBuffer, {
      headers: { 
        'Content-Type': 'audio/mpeg',
        'X-Total-Chunks': chunks.length.toString(),
        'X-Current-Chunk': (chunkIndex + 1).toString(),
      },
    });
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}