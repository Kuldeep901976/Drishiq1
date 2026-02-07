// Simple test endpoint to verify API communication
export async function GET() {
  try {
    const testResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (testResponse.ok) {
      return Response.json({ 
        status: 'success', 
        message: 'OpenAI API connection working',
        apiKeyPresent: !!process.env.OPENAI_API_KEY
      });
    } else {
      return Response.json({ 
        status: 'error', 
        message: 'OpenAI API connection failed',
        statusCode: testResponse.status
      }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ 
      status: 'error', 
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

