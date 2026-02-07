import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { success: false, error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    // Try LibreTranslate first
    try {
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: targetLang,
          format: 'text'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.translatedText && result.translatedText !== text) {
          return NextResponse.json({
            success: true,
            translatedText: result.translatedText,
            source: 'libretranslate'
          });
        }
      }
    } catch (error) {
      console.log('LibreTranslate failed:', error);
    }

    // Try MyMemory API as fallback
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.responseData && result.responseData.translatedText && result.responseData.translatedText !== text) {
          return NextResponse.json({
            success: true,
            translatedText: result.responseData.translatedText,
            source: 'mymemory'
          });
        }
      }
    } catch (error) {
      console.log('MyMemory failed:', error);
    }

    // Try Google Translate as last resort
    try {
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result[0] && result[0][0] && result[0][0][0] && result[0][0][0] !== text) {
          return NextResponse.json({
            success: true,
            translatedText: result[0][0][0],
            source: 'google'
          });
        }
      }
    } catch (error) {
      console.log('Google Translate failed:', error);
    }

    // If all APIs fail, return original text
    return NextResponse.json({
      success: false,
      error: 'All translation APIs failed',
      translatedText: text
    });

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

