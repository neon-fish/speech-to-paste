import * as dotenv from 'dotenv';
import { AudioRecorder } from './audioRecorder';
import { SpeechRecogniser } from './speechRecogniser';
import { TextInserter } from './textInserter';
import { HotkeyManager } from './hotkeyManager';

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

let isToggleListening = false;

// Push-to-talk handler
hotkeyManager.registerPushToTalk(
  // On press
  () => {
    if (!audioRecorder.isRecording()) {
      audioRecorder.startRecording();
    }
  },
  // On release
  async () => {
    if (audioRecorder.isRecording()) {
      const audioData = audioRecorder.stopRecording();
      
      try {
        console.log('Transcribing audio...');
        const text = await speechRecognizer.recognizeFromAudioData(audioData);
        console.log(`Recognized: "${text}"`);
        
        if (text) {
          textInserter.insertText(text);
        }
      } catch (error) {
        console.error('Error during transcription:', error);
      }
    }
  }
);

// Toggle listener handler
hotkeyManager.registerToggle(async () => {
  isToggleListening = !isToggleListening;
  
  if (isToggleListening) {
    console.log('Toggle: Started listening');
    audioRecorder.startRecording();
  } else {
    console.log('Toggle: Stopped listening');
    const audioData = audioRecorder.stopRecording();
    
    try {
      console.log('Transcribing audio...');
      const text = await speechRecognizer.recognizeFromAudioData(audioData);
      console.log(`Recognized: "${text}"`);
      
      if (text) {
        textInserter.insertText(text);
      }
    } catch (error) {
      console.error('Error during transcription:', error);
    }
  }
});

// Start the application
console.log('Speech-to-text script starting...');
console.log('Hotkeys:');
console.log('  Ctrl+Shift+F9: Push-to-talk (hold to record)');
console.log('  Ctrl+Shift+F10: Toggle listening on/off');
console.log('\nPress Ctrl+C to exit');

hotkeyManager.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  hotkeyManager.stop();
  if (audioRecorder.isRecording()) {
    audioRecorder.stopRecording();
  }
  process.exit(0);
});
