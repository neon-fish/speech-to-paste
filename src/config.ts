import * as fs from 'fs';
import * as path from 'path';
import { WhisperMode, WhisperModelSize } from './ISpeechRecogniser';

export interface HotkeyConfig {
  keyCode: number;
  shift?: boolean;
  ctrl?: boolean;
  alt?: boolean;
}

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
  webServerPort: number;
  minimizeOnStartup: boolean;
  pushToTalkHotkey: HotkeyConfig;
  toggleListenHotkey: HotkeyConfig;
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
      webServerPort: 5933,
      minimizeOnStartup: false,
      pushToTalkHotkey: { keyCode: 3653 }, // Pause/Break key
      toggleListenHotkey: { keyCode: 3653, shift: true }, // Shift+Pause/Break
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
      "whisperPrompt": "",
      "_webServerPortOptions": "Port for the web interface (default: 5933). Requires restart to take effect.",
      "webServerPort": 5933,
      "_minimizeOnStartupOptions": "Start minimized to system tray without showing console window (Windows only)",
      "minimizeOnStartup": false,
      "_pushToTalkHotkeyOptions": "Push-to-talk hotkey. Default: Pause/Break (keyCode: 3653)",
      "pushToTalkHotkey": { "keyCode": 3653 },
      "_toggleListenHotkeyOptions": "Toggle listening hotkey. Default: Shift+Pause/Break (keyCode: 3653 with shift)",
      "toggleListenHotkey": { "keyCode": 3653, "shift": true }
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
      "_webServerPortOptions": "Port for the web interface (default: 5933). Requires restart to take effect.",
      "_minimizeOnStartupOptions": "Start minimized to system tray without showing console window (Windows only)",
      "_pushToTalkHotkeyOptions": "Push-to-talk hotkey. Default: Pause/Break (keyCode: 3653)",
      "_toggleListenHotkeyOptions": "Toggle listening hotkey. Default: Shift+Pause/Break (keyCode: 3653 with shift)",
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

  getWebServerPort(): number {
    const port = this.config.webServerPort ?? 5933;
    return Math.max(1024, Math.min(65535, port)); // clamp between 1024 and 65535
  }

  getMinimizeOnStartup(): boolean {
    return this.config.minimizeOnStartup === true; // default to false if not set
  }

  getPushToTalkHotkey(): HotkeyConfig {
    return this.config.pushToTalkHotkey || { keyCode: 3653 }; // default to Pause/Break
  }

  getToggleListenHotkey(): HotkeyConfig {
    return this.config.toggleListenHotkey || { keyCode: 3653, shift: true }; // default to Shift+Pause
  }

  /**
   * Export configuration as JSON string (without comments)
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  importConfig(jsonString: string): void {
    try {
      const importedConfig = JSON.parse(jsonString);
      
      // Validate that it's a valid config object
      if (typeof importedConfig !== 'object' || importedConfig === null) {
        throw new Error('Invalid configuration format');
      }

      // Update with imported values
      this.updateConfig(importedConfig);
    } catch (error) {
      console.error('Error importing config:', error);
      throw new Error('Failed to import configuration: ' + (error as Error).message);
    }
  }
}
