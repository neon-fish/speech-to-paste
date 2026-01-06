import * as dotenv from 'dotenv';
import { AudioRecorder } from './audioRecorder';
import { SpeechRecogniser } from './speechRecogniser';
import { TextInserter } from './textInserter';
import { HotkeyManager } from './hotkeyManager';
import { WebServer } from './webServer';
import { ConfigManager } from './config';

// Load environment variables (fallback)
dotenv.config();

// Initialize config manager
const configManager = new ConfigManager();

// Get API key from config or environment variable
const apiKey = configManager.getApiKey() || process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Error: OpenAI API key not configured');
  console.error('Please configure your API key via the web interface at http://localhost:3000');
  console.error('Or set it in config.json next to the executable');
  console.error('You can get an API key from: https://platform.openai.com/api-keys');
  // Don't exit, let the web server start so user can configure it
}

// Initialize components
const audioRecorder = new AudioRecorder();
const textInserter = new TextInserter();
const hotkeyManager = new HotkeyManager();
const webServer = new WebServer(3000, configManager);

let isToggleListening = false;

// Get or create speech recognizer with current API key
function getSpeechRecognizer(): SpeechRecogniser | null {
  const apiKey = configManager.getApiKey();
  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }
  return new SpeechRecogniser(apiKey);
}

// Push-to-talk handler
hotkeyManager.registerPushToTalk(
  // On press
  () => {
    if (!audioRecorder.isRecording() && webServer.isHotkeysEnabled()) {
      webServer.setStatus('recording');
      audioRecorder.startRecording();
    }
  },
  // On release
  async () => {
    if (audioRecorder.isRecording()) {
      const audioData = audioRecorder.stopRecording();
      
      // Get speech recognizer with current API key
      const speechRecognizer = getSpeechRecognizer();
      if (!speechRecognizer) {
        console.error('Cannot transcribe: OpenAI API key not configured');
        webServer.setStatus('idle');
        return;
      }
      
      try {
        webServer.setStatus('transcribing');
        console.log('Transcribing audio...');
        const text = await speechRecognizer.recognizeFromAudioData(audioData);
        console.log(`Recognized: "${text}"`);
        
        if (text) {
          textInserter.insertText(text);
          webServer.addTranscription(text);
        }
        webServer.setStatus('idle');
      } catch (error) {
        console.error('Error during transcription:', error);
        webServer.setStatus('idle');
      }
    }
  }
);

// Toggle listener handler
hotkeyManager.registerToggle(async () => {
  if (!webServer.isHotkeysEnabled()) {
    return;
  }
  
  isToggleListening = !isToggleListening;
  
  if (isToggleListening) {
    console.log('Toggle: Started listening');
    webServer.setStatus('recording');
    audioRecorder.startRecording();
  } else {
    console.log('Toggle: Stopped listening');
    const audioData = audioRecorder.stopRecording();
    
    // Get speech recognizer with current API key
    const speechRecognizer = getSpeechRecognizer();
    if (!speechRecognizer) {
      console.error('Cannot transcribe: OpenAI API key not configured');
      webServer.setStatus('idle');
      return;
    }
    
    try {
      webServer.setStatus('transcribing');
      console.log('Transcribing audio...');
      const text = await speechRecognizer.recognizeFromAudioData(audioData);
      console.log(`Recognized: "${text}"`);
      
      if (text) {
        textInserter.insertText(text);
        webServer.addTranscription(text);
      }
      webServer.setStatus('idle');
    } catch (error) {
      console.error('Error during transcription:', error);
      webServer.setStatus('idle');
    }
  }
});

// Start the application
console.log('Speech-to-text script starting...');
console.log('Hotkeys:');
console.log('  Pause/Break: Push-to-talk (hold to record)');
console.log('  Shift+Pause/Break: Toggle listening on/off');
console.log('\nPress Ctrl+C to exit');

hotkeyManager.start();
webServer.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  hotkeyManager.stop();
  webServer.stop();
  if (audioRecorder.isRecording()) {
    audioRecorder.stopRecording();
  }
  process.exit(0);
});
