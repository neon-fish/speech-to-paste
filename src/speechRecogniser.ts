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

  async recognizeFromStream(audioStream: Readable): Promise<string> {
    // Whisper API requires a file, so we buffer to temp file
    const tempFile = path.join(process.cwd(), 'temp_audio.wav');
    
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(tempFile);
      
      audioStream.pipe(writeStream);
      
      writeStream.on('finish', async () => {
        try {
          const transcription = await this.openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFile),
            model: 'whisper-1',
          });
          
          // Cleanup temp file
          fs.unlinkSync(tempFile);
          
          resolve(transcription.text);
        } catch (error) {
          reject(error);
        }
      });
      
      writeStream.on('error', reject);
    });
  }
}
