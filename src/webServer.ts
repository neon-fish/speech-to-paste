import express from 'express';
import cors from 'cors';
import * as path from 'path';
import { ConfigManager } from './config';
import { LocalSpeechRecogniser } from './localSpeechRecogniser';
import { DEFAULT_PORT } from './constants';
import { AudioRecorder } from './audioRecorder';

export interface TranscriptionEntry {
  timestamp: Date;
  text: string;
  duration?: number;
}

export type AppStatus = 'idle' | 'recording' | 'transcribing';

export class WebServer {
  private app: express.Application;
  private server: any;
  private port: number;
  private transcriptions: TranscriptionEntry[] = [];
  private currentStatus: AppStatus = 'idle';
  private hotkeysEnabled = true;
  private configManager: ConfigManager;
  private audioRecorder: AudioRecorder;
  private maxHistoryLimit: number;

  constructor(port: number = DEFAULT_PORT, configManager: ConfigManager, audioRecorder: AudioRecorder) {
    this.port = port;
    this.configManager = configManager;
    this.audioRecorder = audioRecorder;
    this.maxHistoryLimit = configManager.getTranscriptionHistoryLimit();
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
    
    // Serve static files from public directory
    this.app.use(express.static(path.join(__dirname, '..', 'public')));
    
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Serve status
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: this.currentStatus,
        hotkeysEnabled: this.hotkeysEnabled,
        transcriptionCount: this.transcriptions.length,
      });
    });

    // Get transcription history
    this.app.get('/api/transcriptions', (req, res) => {
      res.json(this.transcriptions);
    });

    // Toggle hotkeys
    this.app.post('/api/hotkeys/toggle', (req, res) => {
      this.hotkeysEnabled = !this.hotkeysEnabled;
      res.json({ enabled: this.hotkeysEnabled });
    });

    // Clear history
    this.app.post('/api/transcriptions/clear', (req, res) => {
      this.transcriptions = [];
      res.json({ success: true });
    });

    // Get config (without exposing full API key)
    this.app.get('/api/config', (req, res) => {
      const apiKey = this.configManager.getApiKey();
      res.json({
        hasApiKey: this.configManager.hasValidApiKey(),
        apiKeyPreview: apiKey ? apiKey.substring(0, 8) + '...' : '',
        whisperMode: this.configManager.getWhisperMode(),
        localWhisperModel: this.configManager.getLocalWhisperModel(),
        localWhisperAvailable: LocalSpeechRecogniser.isAvailable(),
        localWhisperError: LocalSpeechRecogniser.getInitError(),
        audioFeedbackEnabled: this.configManager.getAudioFeedbackEnabled(),
        autoPasteEnabled: this.configManager.getAutoPasteEnabled(),
        audioDeviceIndex: this.configManager.getAudioDeviceIndex(),
        transcriptionHistoryLimit: this.configManager.getTranscriptionHistoryLimit(),
        whisperLanguage: this.configManager.getWhisperLanguage(),
        whisperTemperature: this.configManager.getWhisperTemperature(),
        whisperPrompt: this.configManager.getWhisperPrompt(),
        webServerPort: this.configManager.getWebServerPort(),
        minimizeOnStartup: this.configManager.getMinimizeOnStartup(),
      });
    });

    // Update API key
    this.app.post('/api/config/apikey', (req, res) => {
      try {
        const { apiKey } = req.body;
        if (!apiKey || typeof apiKey !== 'string') {
          return res.status(400).json({ error: 'API key is required' });
        }
        this.configManager.updateConfig({ openaiApiKey: apiKey });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update config' });
      }
    });

    // Update Whisper mode
    this.app.post('/api/config/whisper-mode', (req, res) => {
      try {
        const { mode } = req.body;
        if (!mode || (mode !== 'api' && mode !== 'local')) {
          return res.status(400).json({ error: 'Invalid mode. Must be "api" or "local"' });
        }
        this.configManager.updateConfig({ whisperMode: mode });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update config' });
      }
    });

    // Update local Whisper model size
    this.app.post('/api/config/whisper-model', (req, res) => {
      try {
        const { model } = req.body;
        const validModels = ['tiny', 'base', 'small', 'medium', 'large'];
        if (!model || !validModels.includes(model)) {
          return res.status(400).json({ error: 'Invalid model. Must be one of: tiny, base, small, medium, large' });
        }
        this.configManager.updateConfig({ localWhisperModel: model });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update config' });
      }
    });

    // Toggle audio feedback
    this.app.post('/api/config/audio-feedback', (req, res) => {
      try {
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
          return res.status(400).json({ error: 'enabled must be a boolean' });
        }
        this.configManager.updateConfig({ audioFeedbackEnabled: enabled });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update config' });
      }
    });

    // Toggle auto-paste
    this.app.post('/api/config/auto-paste', (req, res) => {
      try {
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
          return res.status(400).json({ error: 'enabled must be a boolean' });
        }
        this.configManager.updateConfig({ autoPasteEnabled: enabled });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update config' });
      }
    });

    // Get available audio devices
    this.app.get('/api/devices', (req, res) => {
      try {
        const devices = this.audioRecorder.getAvailableDevices();
        res.json({ devices });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get audio devices' });
      }
    });

    // Set audio device
    this.app.post('/api/config/audio-device', (req, res) => {
      try {
        const { deviceIndex } = req.body;
        if (typeof deviceIndex !== 'number') {
          return res.status(400).json({ error: 'deviceIndex must be a number' });
        }
        this.configManager.updateConfig({ audioDeviceIndex: deviceIndex });
        this.audioRecorder.setDevice(deviceIndex);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update audio device' });
      }
    });

    // Set transcription history limit
    this.app.post('/api/config/history-limit', (req, res) => {
      try {
        const { limit } = req.body;
        if (typeof limit !== 'number' || limit < 1 || limit > 1000) {
          return res.status(400).json({ error: 'limit must be a number between 1 and 1000' });
        }
        this.configManager.updateConfig({ transcriptionHistoryLimit: limit });
        this.maxHistoryLimit = limit;
        // Trim existing history if needed
        if (this.transcriptions.length > limit) {
          this.transcriptions = this.transcriptions.slice(-limit);
        }
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update history limit' });
      }
    });

    // Set Whisper language
    this.app.post('/api/config/whisper-language', (req, res) => {
      try {
        const { language } = req.body;
        if (typeof language !== 'string') {
          return res.status(400).json({ error: 'language must be a string' });
        }
        this.configManager.updateConfig({ whisperLanguage: language });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update language' });
      }
    });

    // Set Whisper temperature
    this.app.post('/api/config/whisper-temperature', (req, res) => {
      try {
        const { temperature } = req.body;
        if (typeof temperature !== 'number' || temperature < 0 || temperature > 1) {
          return res.status(400).json({ error: 'temperature must be a number between 0 and 1' });
        }
        this.configManager.updateConfig({ whisperTemperature: temperature });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update temperature' });
      }
    });

    // Set Whisper prompt
    this.app.post('/api/config/whisper-prompt', (req, res) => {
      try {
        const { prompt } = req.body;
        if (typeof prompt !== 'string') {
          return res.status(400).json({ error: 'prompt must be a string' });
        }
        this.configManager.updateConfig({ whisperPrompt: prompt });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update prompt' });
      }
    });

    // Export configuration
    this.app.get('/api/config/export', (req, res) => {
      try {
        const configJson = this.configManager.exportConfig();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="speech-to-paste-config.json"');
        res.send(configJson);
      } catch (error) {
        res.status(500).json({ error: 'Failed to export configuration' });
      }
    });

    // Import configuration
    this.app.post('/api/config/import', (req, res) => {
      try {
        const { config } = req.body;
        if (!config || typeof config !== 'object') {
          return res.status(400).json({ error: 'Invalid configuration data' });
        }
        this.configManager.importConfig(JSON.stringify(config));
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to import configuration: ' + (error as Error).message });
      }
    });

    // Set web server port
    this.app.post('/api/config/web-server-port', (req, res) => {
      try {
        const { port } = req.body;
        if (typeof port !== 'number' || port < 1024 || port > 65535) {
          return res.status(400).json({ error: 'port must be a number between 1024 and 65535' });
        }
        this.configManager.updateConfig({ webServerPort: port });
        res.json({ success: true, requiresRestart: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update port' });
      }
    });

    // Toggle minimize on startup
    this.app.post('/api/config/minimize-on-startup', (req, res) => {
      try {
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
          return res.status(400).json({ error: 'enabled must be a boolean' });
        }
        this.configManager.updateConfig({ minimizeOnStartup: enabled });
        res.json({ success: true, requiresRestart: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update minimize on startup' });
      }
    });
  }

  start(): void {
    this.server = this.app.listen(this.port, () => {
      console.log(`Web interface available at http://localhost:${this.port}`);
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
    }
  }

  addTranscription(text: string, duration?: number): void {
    this.transcriptions.push({
      timestamp: new Date(),
      text,
      duration,
    });
    
    // Trim history to max limit (keep most recent)
    if (this.transcriptions.length > this.maxHistoryLimit) {
      this.transcriptions = this.transcriptions.slice(-this.maxHistoryLimit);
    }
  }

  setStatus(status: AppStatus): void {
    this.currentStatus = status;
  }

  isHotkeysEnabled(): boolean {
    return this.hotkeysEnabled;
  }
}
