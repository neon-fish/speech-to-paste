import { Leopard } from '@picovoice/leopard-node';
import { ISpeechRecogniser } from './ISpeechRecogniser';

/**
 * Picovoice Leopard Speech Recognition
 * 
 * On-device speech-to-text using Picovoice Leopard engine
 * - Runs locally (no cloud costs)
 * - Private (no data sent to cloud)
 * - Fast (no network latency)
 * - Accurate (comparable to cloud APIs)
 * - Cross-platform (Windows, macOS, Linux)
 * 
 * Requires Picovoice access key from https://console.picovoice.ai/
 */

export class LeopardRecogniser implements ISpeechRecogniser {
  private leopard: Leopard | null = null;
  private accessKey: string;
  private enableAutomaticPunctuation: boolean = true;

  constructor(accessKey: string, enableAutomaticPunctuation: boolean = true) {
    this.accessKey = accessKey;
    this.enableAutomaticPunctuation = enableAutomaticPunctuation;
  }

  private ensureInitialized(): void {
    if (!this.leopard) {
      console.log('Initializing Picovoice Leopard...');
      this.leopard = new Leopard(this.accessKey, {
        enableAutomaticPunctuation: this.enableAutomaticPunctuation,
      });
      console.log(`Leopard initialized (version ${this.leopard.version}, sample rate: ${this.leopard.sampleRate}Hz)`);
    }
  }

  async recognizeFromAudioData(audioData: Buffer | Int16Array): Promise<string> {
    this.ensureInitialized();

    // Convert Buffer to Int16Array if needed
    let audioArray: Int16Array;
    if (audioData instanceof Buffer) {
      audioArray = new Int16Array(audioData.buffer, audioData.byteOffset, audioData.byteLength / 2);
    } else if (audioData instanceof Int16Array) {
      audioArray = audioData;
    } else {
      throw new Error('Invalid audio data type');
    }

    try {
      console.log('Transcribing audio with Leopard...');
      
      // Convert Int16Array to regular number array for Leopard
      const pcmArray: number[] = Array.from(audioArray);
      
      // Process audio (cast due to incorrect type definitions)
      const result = this.leopard!.process(pcmArray as any);
      
      console.log('Transcription received from Leopard.');
      
      // Log word metadata if available
      if (result.words && result.words.length > 0) {
        console.log(`Word count: ${result.words.length}`);
        const avgConfidence = result.words.reduce((sum: number, w: any) => sum + w.confidence, 0) / result.words.length;
        console.log(`Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
      }
      
      return result.transcript;
    } catch (error) {
      console.error('Leopard transcription error:', error);
      throw error;
    }
  }

  /**
   * Release Leopard resources
   * Should be called when done using the recogniser
   */
  release(): void {
    if (this.leopard) {
      console.log('Releasing Leopard resources...');
      this.leopard.release();
      this.leopard = null;
    }
  }
}
