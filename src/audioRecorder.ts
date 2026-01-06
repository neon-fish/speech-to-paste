// @ts-ignore - no type definitions available
import * as recorder from 'node-record-lpcm16';
import { Readable } from 'stream';

/**
 * Audio recording module
 * 
 * Current: node-record-lpcm16
 * Alternatives:
 * - mic (npm package)
 * - node-microphone (cross-platform)
 * - sox-audio (requires SoX installation)
 * - portaudio bindings (node-portaudio)
 */

export class AudioRecorder {
  private recording: any = null;
  private audioStream: Readable | null = null;

  startRecording(): Readable {
    console.log('Starting recording...');
    
    this.recording = recorder.record({
      sampleRate: 16000,
      channels: 1,
      compress: false,
      threshold: 0,
      silence: '10.0',
    });

    this.audioStream = this.recording.stream();
    if (!this.audioStream) {
      throw new Error('Failed to start audio stream');
    }
    return this.audioStream;
  }

  stopRecording(): void {
    console.log('Stopping recording...');
    if (this.recording) {
      this.recording.stop();
      this.recording = null;
      this.audioStream = null;
    }
  }

  isRecording(): boolean {
    return this.recording !== null;
  }
}
