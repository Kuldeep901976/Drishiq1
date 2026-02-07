// Reliable Voice Recording Hook
import { useState, useRef, useCallback } from 'react';

interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  duration: number;
  error: string | null;
}

export const useVoiceRecording = () => {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    audioBlob: null,
    audioUrl: null,
    duration: 0,
    error: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSoundTimeRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null, isProcessing: true }));

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Set up audio analysis for silence detection
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      lastSoundTimeRef.current = Date.now();

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      
      // Silence detection function
      const checkSilence = () => {
        if (!analyserRef.current || !isRecordingRef.current) {
          return;
        }
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        const threshold = 10; // Lower threshold to be less sensitive (0-255)
        
        if (average > threshold) {
          // Sound detected
          lastSoundTimeRef.current = Date.now();
        } else {
          // Check if silence has been going on for more than 10 seconds (increased from 5)
          // This gives users more time to speak
          const silenceDuration = (Date.now() - lastSoundTimeRef.current) / 1000;
          if (silenceDuration >= 10 && isRecordingRef.current) {
            console.log('🔇 Silence detected for 10+ seconds, stopping recording automatically');
            // Stop recording - this will trigger onstop handler which creates audioBlob
            isRecordingRef.current = false;
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current);
              silenceTimeoutRef.current = null;
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop(); // This triggers onstop which creates audioBlob
            }
            return;
          }
        }
        
        // Continue checking if still recording
        if (isRecordingRef.current) {
          silenceTimeoutRef.current = setTimeout(checkSilence, 500); // Check every 500ms
        }
      };

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        isRecordingRef.current = false; // Ensure ref is updated
        
        // Only create blob if we have audio chunks
        if (audioChunksRef.current.length === 0) {
          console.warn('⚠️ No audio chunks recorded, skipping blob creation');
          setState(prev => ({
            ...prev,
            isRecording: false,
            audioBlob: null,
            audioUrl: null,
            isProcessing: false
          }));
        } else {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log('✅ Recording stopped, audio blob created:', {
            size: audioBlob.size,
            type: audioBlob.type,
            chunksCount: audioChunksRef.current.length
          });
          
          setState(prev => ({
            ...prev,
            isRecording: false, // Ensure state is updated
            audioBlob,
            audioUrl: null, // Don't create URL to avoid memory leaks
            isProcessing: false
          }));
        }

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Clear duration interval
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        
        // Clear silence detection timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      startTimeRef.current = Date.now();
      lastSoundTimeRef.current = Date.now();

      // Update duration every second
      durationIntervalRef.current = setInterval(() => {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState(prev => ({ ...prev, duration }));
      }, 1000);

      isRecordingRef.current = true;
      setState(prev => ({
        ...prev,
        isRecording: true,
        isProcessing: false,
        duration: 0
      }));

      // Start silence detection
      setTimeout(checkSilence, 1000); // Start checking after 1 second

      console.log('🎤 Voice recording started with silence detection');

    } catch (error) {
      console.error('❌ Error starting voice recording:', error);
      setState(prev => ({
        ...prev,
        error: `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isProcessing: false
      }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    console.log('🛑 Manual stop requested');
    isRecordingRef.current = false;
    
    // Clear silence detection timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    
    if (mediaRecorderRef.current) {
      const isCurrentlyRecording = mediaRecorderRef.current.state === 'recording';
      if (isCurrentlyRecording) {
        console.log('🛑 Stopping MediaRecorder...');
        mediaRecorderRef.current.stop(); // This will trigger onstop handler
        setState(prev => ({ ...prev, isRecording: false }));
        console.log('✅ Voice recording stopped manually');
      } else {
        console.log('ℹ️ Stop called but MediaRecorder not recording, state:', mediaRecorderRef.current.state);
        setState(prev => ({ ...prev, isRecording: false }));
      }
    } else {
      console.log('ℹ️ Stop called but no MediaRecorder instance');
      setState(prev => ({ ...prev, isRecording: false }));
    }
  }, []);

  const clearRecording = useCallback(() => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    
    setState({
      isRecording: false,
      isProcessing: false,
      audioBlob: null,
      audioUrl: null,
      duration: 0,
      error: null
    });

    audioChunksRef.current = [];
    console.log('🗑️ Voice recording cleared');
  }, [state.audioUrl]);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup function to prevent memory leaks
  const cleanup = useCallback(() => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, [state.audioUrl]);

  return {
    ...state,
    startRecording,
    stopRecording,
    clearRecording,
    formatDuration,
    cleanup
  };
};





