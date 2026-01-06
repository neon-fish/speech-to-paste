import OpenAI from 'openai';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { ISpeechRecogniser } from './ISpeechRecogniser';

/**
 * Speech recognition module
 * 
 * Current: OpenAI Whisper API
 * Alternatives:
 * - Google Cloud Speech-to-Text (@google-cloud/speech)
 * - Azure Speech Services (microsoft-cognitiveservices-speech-sdk)
 * - AWS Transcribe (@aws-sdk/client-transcribe)
 * - Whisper.cpp local (whisper-node, node-whisper)
 * - Mozilla DeepSpeech (local, but archived)
 * - Vosk (offline, lightweight)
 */

export class SpeechRecogniser implements ISpeechRecogniser {
  private openai: OpenAI;
  private language: string = '';
  private temperature: number = 0;
  private prompt: string = '';

  constructor(apiKey: string, language?: string, temperature?: number, prompt?: string) {
    this.openai = new OpenAI({ apiKey });
    this.language = language || '';
    this.temperature = temperature ?? 0;
    this.prompt = prompt || '';
  }

  setLanguage(language: string): void {
    this.language = language;
  }

  setTemperature(temperature: number): void {
    this.temperature = Math.max(0, Math.min(1, temperature));
  }

  setPrompt(prompt: string): void {
    this.prompt = prompt;
  }

  async recognizeFromAudioData(audioData: Buffer | Int16Array): Promise<string> {
    // Convert Buffer to Int16Array if needed
    let audioArray: Int16Array;
    if (audioData instanceof Buffer) {
      audioArray = new Int16Array(audioData.buffer, audioData.byteOffset, audioData.byteLength / 2);
    } else if (audioData instanceof Int16Array) {
      audioArray = audioData;
    } else {
      throw new Error('Invalid audio data type');
    }
    
    // Whisper API requires a file, so we save to temp WAV file
    const tempFile = path.join(process.cwd(), 'temp_audio.wav');
    
    // Write WAV file
    console.log('Saving audio data to temporary WAV file...');
    this.saveAsWav(audioArray, tempFile);
    
    try {
      console.log('Sending audio to Whisper API for transcription...');
      const params: any = {
        file: await this.createFileFromPath(tempFile),
        model: 'whisper-1',
      };
      
      // Add language if specified (empty = auto-detect)
      if (this.language) {
        params.language = this.language;
        console.log(`Language set to: ${this.language}`);
      } else {
        console.log('Language: auto-detect');
      }
      
      // Add temperature if not default
      if (this.temperature !== 0) {
        params.temperature = this.temperature;
        console.log(`Temperature: ${this.temperature}`);
      }
      
      // Add prompt if specified
      if (this.prompt) {
        params.prompt = this.prompt;
        console.log(`Prompt: ${this.prompt.substring(0, 50)}${this.prompt.length > 50 ? '...' : ''}`);
      }
      
      const transcription = await this.openai.audio.transcriptions.create(params);
      console.log('Transcription received.');
      
      // Cleanup temp file
      fs.unlinkSync(tempFile);
      
      return transcription.text;
    } catch (error) {
      // Cleanup on error too
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      throw error;
    }
  }

  private async createFileFromPath(filePath: string): Promise<File> {
    const buffer = fs.readFileSync(filePath);
    const blob = new Blob([buffer], { type: 'audio/wav' });
    return new File([blob], path.basename(filePath), { type: 'audio/wav' });
  }

  private saveAsWav(audioData: Int16Array, filePath: string): void {
    const sampleRate = 16000;
    const numChannels = 1;
    const bitsPerSample = 16;
    
    const dataSize = audioData.length * 2; // 2 bytes per sample
    const buffer = Buffer.alloc(44 + dataSize);
    
    // WAV header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // fmt chunk size
    buffer.writeUInt16LE(1, 20); // audio format (PCM)
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * numChannels * bitsPerSample / 8, 28); // byte rate
    buffer.writeUInt16LE(numChannels * bitsPerSample / 8, 32); // block align
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    
    // Audio data
    for (let i = 0; i < audioData.length; i++) {
      buffer.writeInt16LE(audioData[i], 44 + i * 2);
    }
    
    fs.writeFileSync(filePath, buffer);
  }
}
