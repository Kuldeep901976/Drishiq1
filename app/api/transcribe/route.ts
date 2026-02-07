import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🎤 Speech-to-text transcription request received');
    console.log('🔑 API Key check:', {
      hasKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
      keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) || 'none'
    });

    // Get the form data
    const formData = await request.formData();
    
    // Debug: Log all form data keys
    console.log('📋 FormData keys:', Array.from(formData.keys()));
    
    const audioFile = formData.get('audio') as File | Blob | null;
    const optionsString = formData.get('options') as string | null;
    
    // Enhanced validation and logging
    if (!audioFile) {
      console.error('❌ No audio file in FormData');
      console.error('📋 Available keys:', Array.from(formData.keys()));
      return NextResponse.json(
        { error: 'No audio file provided. Please ensure the audio blob is being sent correctly.' },
        { status: 400 }
      );
    }
    
    // Check if it's a File or Blob
    // In Node.js, Blob might not be available as global, so check differently
    const isFile = audioFile instanceof File;
    const isBlob = typeof Blob !== 'undefined' && audioFile instanceof Blob;
    const hasBlobLikeProperties = audioFile && typeof audioFile === 'object' && 'size' in audioFile && 'type' in audioFile;
    
    if (!isFile && !isBlob && !hasBlobLikeProperties) {
      console.error('❌ Audio is not a File or Blob:', {
        type: typeof audioFile,
        isFile,
        isBlob,
        hasBlobLikeProperties,
        audioFileKeys: audioFile ? Object.keys(audioFile) : 'null',
        audioFileConstructor: audioFile?.constructor?.name
      });
      return NextResponse.json(
        { error: 'Invalid audio file format' },
        { status: 400 }
      );
    }
    
    // Convert Blob to File if needed
    let fileToProcess: File;
    if (isBlob && !isFile) {
      console.log('📝 Converting Blob to File');
      const blob = audioFile as Blob;
      fileToProcess = new File([blob], 'voice-message.webm', { type: blob.type || 'audio/webm' });
    } else if (hasBlobLikeProperties && !isFile) {
      // Handle blob-like object (from FormData in Node.js)
      console.log('📝 Converting blob-like object to File');
      const blobLike = audioFile as any;
      fileToProcess = new File([blobLike], 'voice-message.webm', { type: blobLike.type || 'audio/webm' });
    } else {
      fileToProcess = audioFile as File;
    }

    // Parse options
    let options = {
      language: 'en',
      model: 'whisper-1',
      responseFormat: 'verbose_json',
      temperature: 0.0,
      enablePunctuation: true
    };

    if (optionsString) {
      try {
        const parsedOptions = JSON.parse(optionsString);
        options = { ...options, ...parsedOptions };
      } catch (error) {
        console.warn('⚠️ Failed to parse options, using defaults');
      }
    }

    console.log('📁 Audio file details:', {
      name: fileToProcess.name,
      size: fileToProcess.size,
      type: fileToProcess.type,
      constructor: fileToProcess.constructor?.name,
      isFile: fileToProcess instanceof File,
      hasArrayBuffer: typeof fileToProcess.arrayBuffer === 'function'
    });
    
    // Validate file size (should be > 0)
    if (fileToProcess.size === 0) {
      console.error('❌ Audio file is empty (size: 0)');
      return NextResponse.json(
        { error: 'Audio file is empty. Please record audio before transcribing.' },
        { status: 400 }
      );
    }
    
    // Validate that we can read the file
    try {
      const testBuffer = await fileToProcess.arrayBuffer();
      console.log('✅ File is readable, buffer size:', testBuffer.byteLength);
    } catch (readError) {
      console.error('❌ Cannot read file:', readError);
      return NextResponse.json(
        { error: 'Cannot read audio file. File may be corrupted.' },
        { status: 400 }
      );
    }

    console.log('⚙️ Transcription options:', options);

    // Check for available transcription services - prioritize OpenAI Whisper
    if (process.env.OPENAI_API_KEY) {
      console.log('✅ Using OpenAI Whisper API');
      return await transcribeWithWhisper(fileToProcess, options);
    }
    
    // Fallback if no API keys available
    console.log('❌ No OpenAI API key found - transcription unavailable');
    return NextResponse.json(
      { error: 'OpenAI API key required for voice transcription. Please add OPENAI_API_KEY to your environment variables.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Transcription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function transcribeWithWhisper(audioFile: File, options: any) {
  // Convert File to Buffer for OpenAI API
  const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
  
  console.log('📤 Preparing OpenAI Whisper request:', {
    bufferSize: audioBuffer.length,
    fileName: audioFile.name,
    fileType: audioFile.type,
    model: options.model,
    hasApiKey: !!process.env.OPENAI_API_KEY
  });

  // Validate API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is not set in environment variables');
    return NextResponse.json(
      { error: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env.local file.' },
      { status: 400 }
    );
  }

  // Prepare OpenAI API request body
  // In Node.js, we need to use a compatible approach for FormData
  // OpenAI API expects multipart/form-data with a file
  const openaiFormData = new FormData();
  
  // Create a Blob from the buffer (Blob works better in Node.js FormData)
  // Then create a File from the Blob for proper multipart encoding
  const audioBlob = new Blob([audioBuffer], { type: audioFile.type || 'audio/webm' });
  const fileForOpenAI = new File([audioBlob], audioFile.name || 'audio.webm', { 
    type: audioFile.type || 'audio/webm',
    lastModified: Date.now()
  });
  
  console.log('📤 Preparing FormData for OpenAI:', {
    fileName: fileForOpenAI.name,
    fileSize: fileForOpenAI.size,
    fileType: fileForOpenAI.type,
    bufferSize: audioBuffer.length
  });
  
  // Append the file to FormData
  openaiFormData.append('file', fileForOpenAI);
  openaiFormData.append('model', options.model);
  
  // Add language if specified
  if (options.language) {
    openaiFormData.append('language', options.language);
  }
  
  // Add response format
  openaiFormData.append('response_format', options.responseFormat);
  
  // Add temperature
  if (options.temperature !== undefined) {
    openaiFormData.append('temperature', options.temperature.toString());
  }

  console.log('📤 Sending request to OpenAI Whisper API...', {
    hasApiKey: !!process.env.OPENAI_API_KEY,
    apiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) || 'none'
  });

  // Call OpenAI Whisper API
  const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      // Don't set Content-Type - let fetch set it with boundary for multipart/form-data
    },
    body: openaiFormData
  });

  if (!openaiResponse.ok) {
    const errorText = await openaiResponse.text();
    console.error('❌ OpenAI Whisper API error:', {
      status: openaiResponse.status,
      statusText: openaiResponse.statusText,
      error: errorText,
      hasApiKey: !!process.env.OPENAI_API_KEY,
      apiKeyLength: process.env.OPENAI_API_KEY?.length || 0
    });
    
    // Provide more helpful error messages
    let userFriendlyError = `OpenAI API error: ${openaiResponse.status}`;
    if (openaiResponse.status === 401) {
      userFriendlyError = 'Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env.local';
    } else if (openaiResponse.status === 400) {
      userFriendlyError = `Invalid request: ${errorText}`;
    } else {
      userFriendlyError = `OpenAI API error: ${errorText}`;
    }
    
    return NextResponse.json(
      { error: userFriendlyError },
      { status: openaiResponse.status }
    );
  }

  const result = await openaiResponse.json();
  
  console.log('✅ Whisper transcription successful');

  // Process the result based on response format
  let transcription = '';
  let metadata = null;

  if (options.responseFormat === 'verbose_json') {
    transcription = result.text || '';
    metadata = {
      language: result.language,
      duration: result.duration,
      words: result.words?.map((word: any) => ({
        word: word.word,
        start: word.start,
        end: word.end,
        confidence: word.probability
      })),
      segments: result.segments?.map((segment: any) => ({
        id: segment.id,
        start: segment.start,
        end: segment.end,
        text: segment.text
      }))
    };
  } else if (options.responseFormat === 'json') {
    transcription = result.text || '';
    metadata = {
      language: result.language,
      duration: result.duration
    };
  } else {
    // Plain text response
    transcription = result;
  }

  return NextResponse.json({
    transcription: transcription.trim(),
    metadata,
    model: options.model,
    language: metadata?.language || options.language,
    responseFormat: options.responseFormat,
    provider: 'whisper'
  });
}

async function transcribeWithAssemblyAI(audioFile: File, options: any) {
  try {
    console.log('🎤 Starting AssemblyAI transcription...');
    
    // Step 1: Upload audio file to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLYAI_API_KEY!,
      },
      body: audioFile
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ AssemblyAI upload error:', uploadResponse.status, errorText);
      throw new Error(`AssemblyAI upload failed: ${uploadResponse.status} ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    const audioUrl = uploadResult.upload_url;
    console.log('✅ Audio uploaded to AssemblyAI:', audioUrl);

    // Step 2: Start transcription with enhanced options
    const transcriptionResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLYAI_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: options.language || 'en_us',
        punctuate: true,
        format_text: true,
        auto_highlights: false,
        sentiment_analysis: false,
        entity_detection: false,
        iab_categories: false,
        auto_chapters: false,
        speaker_labels: false,
        dual_channel: false,
        webhook_url: null
      })
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('❌ AssemblyAI transcription error:', transcriptionResponse.status, errorText);
      throw new Error(`AssemblyAI transcription failed: ${transcriptionResponse.status} ${errorText}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcriptId = transcriptionResult.id;
    console.log('✅ Transcription started, ID:', transcriptId);

    // Step 3: Poll for completion with better error handling
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout for longer audio
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': process.env.ASSEMBLYAI_API_KEY!,
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check transcription status: ${statusResponse.status}`);
      }

      const statusResult = await statusResponse.json();
      console.log(`🔄 Transcription status: ${statusResult.status} (attempt ${attempts + 1})`);

      if (statusResult.status === 'completed') {
        console.log('✅ AssemblyAI transcription completed');
        
        return NextResponse.json({
          text: statusResult.text?.trim() || '', // Keep 'text' for compatibility
          transcription: statusResult.text?.trim() || '',
          metadata: {
            language: statusResult.language_code,
            duration: statusResult.audio_duration,
            confidence: statusResult.confidence,
            words: statusResult.words?.map((word: any) => ({
              word: word.text,
              start: word.start,
              end: word.end,
              confidence: word.confidence
            })),
            provider: 'assemblyai'
          },
          model: 'assemblyai',
          language: statusResult.language_code || options.language,
          responseFormat: options.responseFormat,
          provider: 'assemblyai'
        });
      } else if (statusResult.status === 'error') {
        throw new Error(`Transcription failed: ${statusResult.error}`);
      }
      
      attempts++;
    }
    
    throw new Error('Transcription timeout - took too long to complete');
    
  } catch (error) {
    console.error('❌ AssemblyAI error:', error);
    throw error;
  }
}

async function transcribeWithFallback(audioFile: File, options: any) {
  // Simulate transcription processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return a placeholder transcription
  const transcription = 'This is a placeholder transcription. Please add OPENAI_API_KEY or ASSEMBLYAI_API_KEY to your .env.local file for real transcription.';
  
  console.log('⚠️ Fallback transcription used');
  
  return NextResponse.json({
    text: transcription.trim(),  // Original working code looks for 'text'
    transcription: transcription.trim(),
    metadata: {
      language: options.language,
      duration: 0,
      provider: 'fallback'
    },
    model: 'fallback',
    language: options.language,
    responseFormat: options.responseFormat,
    provider: 'fallback'
  });
}
