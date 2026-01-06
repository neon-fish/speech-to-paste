import * as fs from 'fs';
import * as path from 'path';
import { WhisperMode, WhisperModelSize } from './ISpeechRecogniser';

export interface Config {
  openaiApiKey: string;
  whisperMode: WhisperMode;
  localWhisperModel: WhisperModelSize;
  audioFeedbackEnabled: boolean;
  autoPasteEnabled: boolean;
  audioDeviceIndex: number;
  transcriptionHistoryLimit: number;
  whisperLanguage: string;
  whisperTemperature: number;
  whisperPrompt: string;
}

export class ConfigManager {
  private configPath: string;
  private config: Config;

  constructor() {
    // Config file should be next to the executable
    this.configPath = path.join(process.cwd(), 'config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    if (fs.existsSync(this.configPath)) {
      try {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        return JSON.parse(data);
      } catch (error) {
        console.error('Error reading config.json:', error);
        return this.createDefaultConfig();
      }
    } else {
      return this.createDefaultConfig();
    }
  }

  private createDefaultConfig(): Config {
    const defaultConfig: Config = {
      openaiApiKey: '',
      whisperMode: 'api',
      localWhisperModel: 'base',
      audioFeedbackEnabled: true,
      autoPasteEnabled: true,
      audioDeviceIndex: -1,
      transcriptionHistoryLimit: 50,
      whisperLanguage: '',
      whisperTemperature: 0,
      whisperPrompt: '',
    };

    // Write default config with helpful comments
    const configWithComments = {
      "_comment": "Speech-to-Text Configuration",
      "_instructions": "Get your OpenAI API key from https://platform.openai.com/api-keys",
      "openaiApiKey": "",
      "_whisperModeOptions": "Use 'api' for OpenAI Whisper API or 'local' for offline transcription",
      "whisperMode": "api",
      "_localModelOptions": "Available models: tiny, base, small, medium, large (larger = more accurate but slower)",
      "localWhisperModel": "base",
      "_audioFeedbackOptions": "Enable or disable audio feedback sounds when recording starts/stops",
      "audioFeedbackEnabled": true,
      "_autoPasteOptions": "Enable to automatically paste transcribed text, disable to copy to clipboard only",
      "autoPasteEnabled": true,
      "_audioDeviceOptions": "Audio input device index (-1 for default device, use web UI to see available devices)",
      "audioDeviceIndex": -1,
      "_historyLimitOptions": "Maximum number of transcriptions to keep in history (1-1000)",
      "transcriptionHistoryLimit": 50,
      "_languageOptions": "Language code for transcription (e.g., 'en', 'es', 'fr') or empty for auto-detect",
      "whisperLanguage": "",
      "_temperatureOptions": "Temperature for transcription (0.0-1.0). Lower = more consistent, higher = more creative. Default: 0",
      "whisperTemperature": 0,
      "_promptOptions": "Optional prompt to guide transcription. Useful for context, terminology, or fixing common errors.",
      "whisperPrompt": ""
    };

    try {
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(configWithComments, null, 2),
        'utf-8'
      );
      console.log(`Created default config file at: ${this.configPath}`);
    } catch (error) {
      console.error('Error creating config.json:', error);
    }

    return defaultConfig;
  }

  getConfig(): Config {
    return this.config;
  }

  updateConfig(updates: Partial<Config>): void {
    this.config = { ...this.config, ...updates };
    
    // Save with comments
    const configWithComments = {
      "_comment": "Speech-to-Text Configuration",
      "_instructions": "Get your OpenAI API key from https://platform.openai.com/api-keys",
      "_whisperModeOptions": "Use 'api' for OpenAI Whisper API or 'local' for offline transcription",
      "_localModelOptions": "Available models: tiny, base, small, medium, large (larger = more accurate but slower)",
      "_audioFeedbackOptions": "Enable or disable audio feedback sounds when recording starts/stops",
      "_autoPasteOptions": "Enable to automatically paste transcribed text, disable to copy to clipboard only",
      "_audioDeviceOptions": "Audio input device index (-1 for default device, use web UI to see available devices)",
      "_historyLimitOptions": "Maximum number of transcriptions to keep in history (1-1000)",
      "_languageOptions": "Language code for transcription (e.g., 'en', 'es', 'fr') or empty for auto-detect",
      "_temperatureOptions": "Temperature for transcription (0.0-1.0). Lower = more consistent, higher = more creative. Default: 0",
      "_promptOptions": "Optional prompt to guide transcription. Useful for context, terminology, or fixing common errors.",
      ...this.config
    };

    try {
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(configWithComments, null, 2),
        'utf-8'
      );
      console.log('Config updated successfully');
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  getApiKey(): string {
    return this.config.openaiApiKey;
  }

  hasValidApiKey(): boolean {
    return !!this.config.openaiApiKey && this.config.openaiApiKey.trim().length > 0;
  }

  getWhisperMode(): WhisperMode {
    return this.config.whisperMode || 'api';
  }

  getLocalWhisperModel(): WhisperModelSize {
    return this.config.localWhisperModel || 'base';
  }

  getAudioFeedbackEnabled(): boolean {
    return this.config.audioFeedbackEnabled !== false; // default to true if not set
  }

  getAutoPasteEnabled(): boolean {
    return this.config.autoPasteEnabled !== false; // default to true if not set
  }

  getAudioDeviceIndex(): number {
    return this.config.audioDeviceIndex ?? -1; // default to -1 (auto) if not set
  }

  getTranscriptionHistoryLimit(): number {
    const limit = this.config.transcriptionHistoryLimit ?? 50;
    return Math.max(1, Math.min(1000, limit)); // clamp between 1 and 1000
  }

  getWhisperLanguage(): string {
    return this.config.whisperLanguage || ''; // empty string = auto-detect
  }

  getWhisperTemperature(): number {
    const temp = this.config.whisperTemperature ?? 0;
    return Math.max(0, Math.min(1, temp)); // clamp between 0 and 1
  }

  getWhisperPrompt(): string {
    return this.config.whisperPrompt || '';
  }
}
