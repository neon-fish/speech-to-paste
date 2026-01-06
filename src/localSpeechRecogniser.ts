import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ISpeechRecogniser, WhisperModelSize } from './ISpeechRecogniser';

let whisper: any = null;
let whisperInitError: string | null = null;

try {
  // Commented out for now as whisper-node is not yet set up
  // whisper = require('whisper-node');
} catch (error: any) {
  whisperInitError = `Failed to load whisper-node: ${error.message}`;
  console.error('[LocalWhisper] Warning:', whisperInitError);
}

/**
 * Local Whisper speech recognition using whisper.cpp
 * Provides offline transcription without API costs
 * 
 * Model sizes and performance (approximate):
 * - tiny: ~75MB, ~1s for 30s audio (fast but less accurate)
 * - base: ~140MB, ~3s for 30s audio (good balance) [DEFAULT]
 * - small: ~460MB, ~8s for 30s audio (better accuracy)
 * - medium: ~1.5GB, ~20s for 30s audio (high accuracy)
 * - large: ~3GB, ~40s for 30s audio (highest accuracy)
 */

export class LocalSpeechRecogniser implements ISpeechRecogniser {
  private modelSize: WhisperModelSize;
  private modelPath: string | undefined;
  private language: string = '';

  constructor(modelSize: WhisperModelSize = 'base', language?: string, modelPath?: string) {
    this.modelSize = modelSize;
    this.language = language || '';
    this.modelPath = modelPath;
  }

  setLanguage(language: string): void {
    this.language = language;
  }

  async recognizeFromAudioData(audioData: Buffer | Int16Array): Promise<string> {
    // Check if whisper is available
    if (!whisper || whisperInitError) {
      throw new Error(
        'Local Whisper is not available. ' +
        'whisper-node requires native compilation which is not yet set up. ' +
        'Please use API mode or see README for local setup instructions. ' +
        (whisperInitError ? `Error: ${whisperInitError}` : '')
      );
    }
    
    const tempWavFile = path.join(os.tmpdir(), `whisper_${Date.now()}.wav`);
    
    try {
      // Convert Int16Array to WAV file if needed
      let wavBuffer: Buffer;
      if (audioData instanceof Int16Array) {
        wavBuffer = this.int16ArrayToWav(audioData);
      } else {
        wavBuffer = audioData;
      }
      
      // Write WAV buffer to temp file
      fs.writeFileSync(tempWavFile, wavBuffer);
      
      console.log(`Transcribing with local Whisper (${this.modelSize} model)...`);
      
      // Configure whisper options
      const options: any = {
        modelName: this.language ? `${this.modelSize}` : `${this.modelSize}.en`, // Use language-specific or English model
        audioFile: tempWavFile,
      };
      
      if (this.modelPath) {
        options.modelPath = this.modelPath;
      }
      
      if (this.language) {
        options.language = this.language;
        console.log(`Language set to: ${this.language}`);
      } else {
        console.log('Using English-specific model');
      }
      
      // Transcribe using whisper-node
      const transcript = await whisper(options);
      
      // Cleanup temp file
      fs.unlinkSync(tempWavFile);
      
      // whisper-node returns an array of segments, extract just the text
      if (Array.isArray(transcript) && transcript.length > 0) {
        return transcript.map((segment: any) => segment.speech).join(' ').trim();
      }
      
      return '';
    } catch (error) {
      // Cleanup on error
      if (fs.existsSync(tempWavFile)) {
        fs.unlinkSync(tempWavFile);
      }
      
      console.error('Error during local transcription:', error);
      throw error;
    }
  }

  /**
   * Check if local Whisper is available and properly initialized
   */
  static isAvailable(): boolean {
    return whisper !== null && whisperInitError === null;
  }

  /**
   * Get initialization error if any
   */
  static getInitError(): string | null {
    return whisperInitError;
  }

  /**
   * Get the estimated model file size
   */
  static getModelSize(modelSize: WhisperModelSize): string {
    const sizes: Record<WhisperModelSize, string> = {
      tiny: '~75MB',
      base: '~140MB',
      small: '~460MB',
      medium: '~1.5GB',
      large: '~3GB',
    };
    return sizes[modelSize];
  }

  /**
   * Check if a model is downloaded and available
   */
  static async isModelAvailable(modelSize: WhisperModelSize): Promise<boolean> {
    try {
      // whisper-node will download models to ~/.whisper/ by default
      const homeDir = os.homedir();
      const modelDir = path.join(homeDir, '.whisper');
      const modelFile = path.join(modelDir, `ggml-${modelSize}.en.bin`);
      
      return fs.existsSync(modelFile);
    } catch {
      return false;
    }
  }

  /**
   * Convert Int16Array PCM audio to WAV format Buffer
   */
  private int16ArrayToWav(audioData: Int16Array): Buffer {
    const sampleRate = 16000; // PvRecorder uses 16kHz
    const numChannels = 1; // Mono
    const bitsPerSample = 16;
    
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = audioData.length * 2; // 2 bytes per sample
    
    // Create WAV header
    const header = Buffer.alloc(44);
    
    // "RIFF" chunk descriptor
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4); // File size - 8
    header.write('WAVE', 8);
    
    // "fmt " sub-chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk size
    header.writeUInt16LE(1, 20); // Audio format (1 = PCM)
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    
    // "data" sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);
    
    // Convert Int16Array to Buffer
    const audioBuffer = Buffer.from(audioData.buffer, audioData.byteOffset, audioData.byteLength);
    
    // Combine header and audio data
    return Buffer.concat([header, audioBuffer]);
  }
}
