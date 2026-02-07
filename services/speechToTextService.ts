// Speech-to-Text Service using OpenAI Whisper API
export class SpeechToTextService {
  private static instance: SpeechToTextService;

  private constructor() {}

  static getInstance(): SpeechToTextService {
    if (!SpeechToTextService.instance) {
      SpeechToTextService.instance = new SpeechToTextService();
    }
    return SpeechToTextService.instance;
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      console.log('🎤 Starting Whisper transcription...');
      
      // Create FormData for the API request
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Call our Whisper API endpoint
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Whisper transcription successful');
      
      return result.transcription || 'No transcription available';

    } catch (error) {
      console.error('❌ Whisper transcription error:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async transcribeWithWhisper(audioBlob: Blob): Promise<string> {
    // This is now the main method
    return this.transcribeAudio(audioBlob);
  }

  isSpeechRecognitionSupported(): boolean {
    // Check if MediaRecorder is supported (for audio capture)
    return typeof MediaRecorder !== 'undefined';
  }

  getSupportedLanguages(): string[] {
    return [
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
      'ar', 'hi', 'th', 'vi', 'nl', 'sv', 'da', 'no', 'fi', 'pl',
      'tr', 'el', 'he', 'id', 'ms', 'tl', 'uk', 'cs', 'hu', 'ro'
    ];
  }

  getSupportedAudioFormats(): string[] {
    return [
      'audio/webm',
      'audio/mp4',
      'audio/wav',
      'audio/mpeg',
      'audio/ogg'
    ];
  }
}
