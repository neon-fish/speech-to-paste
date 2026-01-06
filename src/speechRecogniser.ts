import OpenAI from 'openai';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

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

export class SpeechRecogniser {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async recognizeFromAudioData(audioData: Int16Array): Promise<string> {
    // Whisper API requires a file, so we save to temp WAV file
    const tempFile = path.join(process.cwd(), 'temp_audio.wav');
    
    // Write WAV file
    console.log('Saving audio data to temporary WAV file...');
    this.saveAsWav(audioData, tempFile);
    
    try {
      console.log('Sending audio to Whisper API for transcription...');
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-1',
      });
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
