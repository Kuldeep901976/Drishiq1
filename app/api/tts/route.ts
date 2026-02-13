import { NextResponse } from 'next/server';

// Helper to split text into chunks under 5000 bytes (Google TTS limit)
function chunkText(text: string, maxBytes: number = 4500): string[] {
  if (!text || !text.trim()) return [];
  const chunks: string[] = [];

  // Split by sentence boundaries: Latin (.!?), Devanagari/Bengali (। ॥), Tamil (௷), and newlines
  const re = /[^.!?।॥\u0BF4\n]+[.!?।॥\u0BF4]*|\n+/g;
  const segments: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const seg = m[0].trim();
    if (seg) segments.push(seg);
  }
  if (segments.length === 0) segments.push(text.trim());

  let currentChunk = '';
  const encoder = new TextEncoder();

  for (const segment of segments) {
    const testChunk = currentChunk ? currentChunk + ' ' + segment : segment;
    const testBytes = encoder.encode(testChunk).length;

    if (testBytes > maxBytes) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      // If this single segment is still too long, force-split by byte count (safe for UTF-8)
      if (encoder.encode(segment).length > maxBytes) {
        let pos = 0;
        while (pos < segment.length) {
          // Start with a safe character count (UTF-8 can be up to 4 bytes per char)
          let end = Math.min(pos + maxBytes, segment.length);
          while (end > pos && encoder.encode(segment.slice(pos, end)).length > maxBytes) {
            end--;
          }
          if (end > pos) {
            chunks.push(segment.slice(pos, end).trim());
            pos = end;
          } else {
            chunks.push(segment.slice(pos, pos + 1));
            pos++;
          }
        }
      } else {
        currentChunk = segment;
      }
    } else {
      currentChunk = testChunk;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text.trim().slice(0, maxBytes)];
}

export async function POST(request: Request) {
  try {
    const { text, language = 'en', chunkIndex = 0 } = await request.json();
    const langKey = String(language || 'en').toLowerCase().split(/[-_]/)[0];

    const voiceNames: Record<string, string> = {
      en: 'en-US-Neural2-J',
      hi: 'hi-IN-Neural2-A',
      bn: 'bn-IN-Standard-A',
      ta: 'ta-IN-Standard-A',
      te: 'te-IN-Standard-A',
      mr: 'mr-IN-Standard-A',
      gu: 'gu-IN-Standard-A',
      kn: 'kn-IN-Standard-A',
      ml: 'ml-IN-Standard-A',
      es: 'es-ES-Neural2-A',
      fr: 'fr-FR-Neural2-A',
      de: 'de-DE-Neural2-A',
      ar: 'ar-XA-Standard-A',
      zh: 'zh-CN-Standard-A',
      ja: 'ja-JP-Standard-A',
      ru: 'ru-RU-Standard-A',
      pt: 'pt-BR-Standard-A',
      it: 'it-IT-Standard-A',
      ko: 'ko-KR-Standard-A',
      nl: 'nl-NL-Standard-A',
      pl: 'pl-PL-Standard-A',
      tr: 'tr-TR-Standard-A',
      vi: 'vi-VN-Standard-A',
      th: 'th-TH-Standard-A',
      id: 'id-ID-Standard-A',
    };

    const voiceName = voiceNames[langKey] || 'en-US-Neural2-J';
    const languageCode = voiceName.split('-').slice(0, 2).join('-');
    console.log('[TTS API] Google Cloud TTS', { langKey, voiceName, languageCode, chunkIndex: chunkIndex + 1 });

    const apiKey =
      process.env.GOOGLE_TTS_API_KEY?.trim() ||
      process.env.GOOGLE_CLOUD_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim();
    const keySource = process.env.GOOGLE_TTS_API_KEY ? 'GOOGLE_TTS_API_KEY' : process.env.GOOGLE_CLOUD_API_KEY ? 'GOOGLE_CLOUD_API_KEY' : process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : 'none';
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TTS not configured. Set GOOGLE_TTS_API_KEY in .env.local and enable Cloud Text-to-Speech API in Google Cloud Console.' },
        { status: 500 }
      );
    }
    if (chunkIndex === 0) {
      console.log('[TTS API] Using key from', keySource, '(key length:', apiKey.length, ')');
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
      const errorBody = await response.text();
      console.error('[TTS API] Google TTS request failed', { langKey, voiceName, languageCode, status: response.status, errorBody: errorBody.slice(0, 500) });
      let userMessage: string;
      if (response.status === 403) {
        userMessage =
          'Google returned 403 Forbidden. (1) Enable Cloud Text-to-Speech API: https://console.cloud.google.com/apis/library/texttospeech.googleapis.com — (2) If the API key has restrictions, allow "Cloud Text-to-Speech API" and use "None" for application restriction or add your server IP. (3) Ensure billing is enabled for the project if required.';
      } else if (response.status === 400) {
        userMessage =
          'Invalid request to Google TTS. Check that GOOGLE_TTS_API_KEY is correct and Cloud Text-to-Speech API is enabled for your project.';
      } else {
        userMessage = `TTS request failed (${response.status}). Check server logs for details.`;
      }
      return NextResponse.json({ error: userMessage, chunks: chunks.length }, { status: response.status });
    }

    const data = await response.json();
    const audioBuffer = Buffer.from(data.audioContent, 'base64');
    console.log('[TTS API] Google TTS OK', { langKey, voiceName, chunkIndex: chunkIndex + 1, totalChunks: chunks.length });

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