// Speech Recognition Debug Test
// Copy and paste this into your browser console to test speech recognition

console.log('🎤 Testing Speech Recognition...');

// Check browser support
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
  console.error('❌ Speech Recognition not supported in this browser');
  console.log('Supported browsers: Chrome, Edge, Safari');
} else {
  console.log('✅ Speech Recognition API available');
}

// Check microphone permissions
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => {
    console.log('✅ Microphone permission granted');
    
    // Test speech recognition
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
    };
    
    recognition.onresult = (event) => {
      console.log('📝 Speech result:', event);
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const isFinal = event.results[i].isFinal;
        console.log(`${isFinal ? '✅ Final' : '⏳ Interim'}: "${transcript}"`);
      }
    };
    
    recognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error);
      console.log('Error details:', event);
    };
    
    recognition.onend = () => {
      console.log('🏁 Speech recognition ended');
    };
    
    // Start recognition
    try {
      recognition.start();
      console.log('🚀 Starting speech recognition...');
    } catch (error) {
      console.error('❌ Failed to start speech recognition:', error);
    }
    
  })
  .catch((error) => {
    console.error('❌ Microphone permission denied:', error);
    console.log('Please allow microphone access in your browser');
  });





