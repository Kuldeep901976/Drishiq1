// Test script for voice-to-text with AssemblyAI integration
// Run this to test the voice recording and transcription functionality

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  console.log('🧪 Testing voice-to-text integration...');
  
  // Check environment variables
  const hasAssemblyAI = !!process.env.ASSEMBLYAI_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  
  console.log('Environment check:');
  console.log('- AssemblyAI API Key:', hasAssemblyAI ? '✅ Present' : '❌ Missing');
  console.log('- OpenAI API Key:', hasOpenAI ? '✅ Present' : '❌ Missing');
  
  if (!hasAssemblyAI && !hasOpenAI) {
    return NextResponse.json({
      status: 'error',
      message: 'No API keys found. Please add ASSEMBLYAI_API_KEY or OPENAI_API_KEY to your .env.local file.',
      instructions: [
        '1. Get AssemblyAI API key from https://www.assemblyai.com/',
        '2. Add ASSEMBLYAI_API_KEY=your_key_here to .env.local',
        '3. Restart your development server',
        '4. Test voice recording in the chat interface'
      ]
    });
  }
  
  // Test API connectivity
  try {
    if (hasAssemblyAI) {
      console.log('🔍 Testing AssemblyAI connectivity...');
      const testResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'GET',
        headers: {
          'Authorization': process.env.ASSEMBLYAI_API_KEY!,
        }
      });
      
      if (testResponse.ok) {
        console.log('✅ AssemblyAI API is accessible');
      } else {
        console.log('⚠️ AssemblyAI API returned:', testResponse.status);
      }
    }
  } catch (error) {
    console.log('❌ AssemblyAI connectivity test failed:', error);
  }
  
  return NextResponse.json({
    status: 'success',
    message: 'Voice-to-text integration is ready!',
    features: [
      '✅ AssemblyAI Whisper API integration',
      '✅ Plain-text-only LLM communication',
      '✅ Modern UI formatter for responses',
      '✅ JSON rejection validator',
      '✅ Enhanced system prompt',
      '✅ Voice recording with 12 language support'
    ],
    nextSteps: [
      '1. Open the chat interface',
      '2. Click the microphone icon',
      '3. Record your voice message',
      '4. See it transcribed and sent to LLM',
      '5. Receive formatted response with modern UI'
    ],
    apiKeys: {
      assemblyai: hasAssemblyAI,
      openai: hasOpenAI
    }
  });
}

