import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { providerId, apiKey, envVarName } = await request.json();

    if (!providerId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Provider ID is required' 
        },
        { status: 400 }
      );
    }

    // Check if API key is provided or if we should check environment variable
    let actualApiKey = apiKey;
    
    if (!apiKey || apiKey === '••••••••••••••••' || apiKey.length < 10) {
      // Try to get from environment variable
      if (envVarName) {
        actualApiKey = process.env[envVarName];
        if (!actualApiKey) {
          return NextResponse.json(
            { 
              success: false,
              error: `API key not found in environment variable ${envVarName}. Please add it to your .env.local file.` 
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            success: false,
            error: 'Please enter a valid API key or configure it in .env.local' 
          },
          { status: 400 }
        );
      }
    }

    // Simple test - just validate the API key format
    let isValid = false;
    let providerName = '';
    
    if (providerId.includes('openai')) {
      // OpenAI API key format: sk-...
      isValid = actualApiKey.startsWith('sk-') && actualApiKey.length > 20;
      providerName = 'OpenAI';
    } else if (providerId.includes('anthropic')) {
      // Anthropic API key format: sk-ant-...
      isValid = actualApiKey.startsWith('sk-ant-') && actualApiKey.length > 20;
      providerName = 'Anthropic';
    } else if (providerId.includes('grok')) {
      // Grok API key format: gsk_...
      isValid = actualApiKey.startsWith('gsk_') && actualApiKey.length > 20;
      providerName = 'Grok';
    }

    if (isValid) {
      return NextResponse.json({ 
        success: true, 
        message: `${providerName} API key format is valid${envVarName ? ' (loaded from environment)' : ''}` 
      });
    } else {
      return NextResponse.json({ 
        success: false,
        error: `Invalid ${providerName} API key format. Expected: ${providerName === 'OpenAI' ? 'sk-...' : providerName === 'Anthropic' ? 'sk-ant-...' : 'gsk_...'}`
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error testing provider:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

