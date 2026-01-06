import * as dotenv from 'dotenv';
import { AudioRecorder } from './audioRecorder';
import { SpeechRecogniser } from './speechRecogniser';
import { LocalSpeechRecogniser } from './localSpeechRecogniser';
import { ISpeechRecogniser } from './ISpeechRecogniser';
import { TextInserter } from './textInserter';
import { HotkeyManager } from './hotkeyManager';
import { WebServer } from './webServer';
import { ConfigManager } from './config';
import { SystemTray } from './systemTray';
import { AudioFeedback } from './audioFeedback';
import { DEFAULT_PORT } from './constants';
import { exec } from 'child_process';

// Load environment variables (fallback)
dotenv.config();

// Initialize config manager
const configManager = new ConfigManager();

// Get API key from config or environment variable
const apiKey = configManager.getApiKey() || process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Error: OpenAI API key not configured');
  console.error(`Please configure your API key via the web interface at http://localhost:${DEFAULT_PORT}`);
  console.error('Or set it in config.json next to the executable');
  console.error('You can get an API key from: https://platform.openai.com/api-keys');
  // Don't exit, let the web server start so user can configure it
}

// Initialize components
const audioRecorder = new AudioRecorder();
const textInserter = new TextInserter();
const hotkeyManager = new HotkeyManager();
const webServer = new WebServer(DEFAULT_PORT, configManager, audioRecorder);
const audioFeedback = new AudioFeedback();

// Apply settings from config
audioFeedback.setEnabled(configManager.getAudioFeedbackEnabled());
textInserter.setAutoPaste(configManager.getAutoPasteEnabled());
audioRecorder.setDevice(configManager.getAudioDeviceIndex());

let isToggleListening = false;

// Helper function to process transcription
async function processTranscription(audioData: Int16Array): Promise<void> {
  // Get speech recognizer with current API key
  const speechRecognizer = getSpeechRecognizer();
  if (!speechRecognizer) {
    console.error('Cannot transcribe: OpenAI API key not configured');
    webServer.setStatus('idle');
    systemTray.setStatus('idle');
    return;
  }
  
  try {
    webServer.setStatus('transcribing');
    systemTray.setStatus('transcribing');
    console.log('Transcribing audio...');
    const text = await speechRecognizer.recognizeFromAudioData(audioData);
    console.log(`Recognized: "${text}"`);
    
    if (text) {
      textInserter.insertText(text);
      webServer.addTranscription(text);
      audioFeedback.playStopSound();
    }
    webServer.setStatus('idle');
    systemTray.setStatus('idle');
  } catch (error) {
    console.error('Error during transcription:', error);
    webServer.setStatus('idle');
    systemTray.setStatus('idle');
  }
}

// Get or create speech recognizer based on configured mode
function getSpeechRecognizer(): ISpeechRecogniser | null {
  const mode = configManager.getWhisperMode();
  const language = configManager.getWhisperLanguage();
  
  if (mode === 'local') {
    const modelSize = configManager.getLocalWhisperModel();
    
    // Check if local Whisper is available
    if (!LocalSpeechRecogniser.isAvailable()) {
      const error = LocalSpeechRecogniser.getInitError();
      console.error('Local Whisper mode selected but not available:');
      console.error(error || 'whisper-node not properly initialized');
      console.error('');
      console.error('Local Whisper requires native compilation of whisper.cpp.');
      console.error(`Please switch to API mode via the web interface at http://localhost:${DEFAULT_PORT}`);
      console.error('or see the README for local setup instructions.');
      return null;
    }
    
    console.log(`Using local Whisper (${modelSize} model)`);
    return new LocalSpeechRecogniser(modelSize, language);
  } else {
    // API mode
    const apiKey = configManager.getApiKey();
    if (!apiKey || apiKey.trim().length === 0) {
      console.log('API mode selected but no API key configured');
      return null;
    }
    console.log('Using OpenAI Whisper API');
    return new SpeechRecogniser(apiKey, language);
  }
}

// Push-to-talk handler
hotkeyManager.registerPushToTalk(
  // On press
  () => {
    if (!audioRecorder.isRecording() && webServer.isHotkeysEnabled()) {
      audioFeedback.playStartSound();
      webServer.setStatus('recording');
      systemTray.setStatus('recording');
      
      // Set 29-second timeout for API mode (Whisper API has 30s limit)
      const mode = configManager.getWhisperMode();
      if (mode === 'api') {
        audioRecorder.startRecording(29000, async () => {
          console.log('API timeout: Auto-stopping recording at 29 seconds');
          if (audioRecorder.isRecording()) {
            const audioData = audioRecorder.stopRecording();
            await processTranscription(audioData);
          }
        });
      } else {
        audioRecorder.startRecording();
      }
    }
  },
  // On release
  async () => {
    if (audioRecorder.isRecording()) {
      const audioData = audioRecorder.stopRecording();
      await processTranscription(audioData);
    }
  }
);

// Toggle listener handler
hotkeyManager.registerToggle(async () => {
  if (!webServer.isHotkeysEnabled()) {
    return;
  }
  
  isToggleListening = !isToggleListening;
  hotkeyManager.setToggleListening(isToggleListening);
  
  if (isToggleListening) {
    console.log('Toggle: Started listening');
    audioFeedback.playStartSound();
    webServer.setStatus('recording');
    systemTray.setStatus('recording');
    
    // Set 29-second timeout for API mode (Whisper API has 30s limit)
    const mode = configManager.getWhisperMode();
    if (mode === 'api') {
      audioRecorder.startRecording(29000, async () => {
        console.log('API timeout: Auto-stopping recording at 29 seconds');
        if (audioRecorder.isRecording()) {
          isToggleListening = false;
          hotkeyManager.setToggleListening(false);
          const audioData = audioRecorder.stopRecording();
          await processTranscription(audioData);
        }
      });
    } else {
      audioRecorder.startRecording();
    }
  } else {
    console.log('Toggle: Stopped listening');
    const audioData = audioRecorder.stopRecording();
    await processTranscription(audioData);
  }
});

// Start the application
console.log('Speech-to-Paste starting...');
console.log('Hotkeys:');
console.log('  Pause/Break: Push-to-talk (hold to record)');
console.log('  Shift+Pause/Break: Toggle listening on/off');
console.log('\nPress Ctrl+C to exit');

hotkeyManager.start();
webServer.start();

// Initialize system tray
const systemTray = new SystemTray({
  onToggleHotkeys: () => {
    // Web server already tracks this via its API
    console.log('Hotkeys toggled via system tray');
  },
  onOpenSettings: () => {
    // Open browser to web interface
    const url = `http://localhost:${DEFAULT_PORT}`;
    exec(`start ${url}`);
  },
  onExit: () => {
    console.log('\nExiting via system tray...');
    cleanup();
  },
});

// Cleanup function
function cleanup() {
  hotkeyManager.stop();
  webServer.stop();
  systemTray.kill();
  if (audioRecorder.isRecording()) {
    audioRecorder.stopRecording();
  }
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', cleanup);
