import * as fs from 'fs';
import * as path from 'path';
import { WhisperMode, WhisperModelSize } from './ISpeechRecogniser';

export interface Config {
  openaiApiKey: string;
  whisperMode: WhisperMode;
  localWhisperModel: WhisperModelSize;
  audioFeedbackEnabled: boolean;
  autoPasteEnabled: boolean;
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
      "autoPasteEnabled": true
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
}
