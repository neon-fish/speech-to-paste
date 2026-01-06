import * as dotenv from 'dotenv';
import { AudioRecorder } from './audioRecorder';
import { SpeechRecogniser } from './speechRecogniser';
import { TextInserter } from './textInserter';
import { HotkeyManager } from './hotkeyManager';
import { WebServer } from './webServer';

// Load environment variables
dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Error: OPENAI_API_KEY not found in .env file');
  process.exit(1);
}

// Initialize components
const audioRecorder = new AudioRecorder();
const speechRecognizer = new SpeechRecogniser(apiKey);
const textInserter = new TextInserter();
const hotkeyManager = new HotkeyManager();
const webServer = new WebServer(3000);

let isToggleListening = false;

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
