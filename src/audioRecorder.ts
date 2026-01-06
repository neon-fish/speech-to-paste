import { PvRecorder } from '@picovoice/pvrecorder-node';
import { Readable, PassThrough } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { MAX_RECORDING_SIZE_BYTES, BYTES_PER_SAMPLE } from './constants';

/**
 * Audio recording module
 * 
 * Current: @picovoice/pvrecorder-node (cross-platform, no external deps)
 * Alternatives:
 * - node-record-lpcm16 (requires SoX)
 * - mic (requires SoX or native)
 * - node-microphone
 * - sox-audio (requires SoX installation)
 * - portaudio bindings (node-portaudio)
 */

export class AudioRecorder {
  private recorder: PvRecorder | null = null;
  private audioBuffer: Int16Array[] = [];
  private recording = false;
  private recordingInterval: NodeJS.Timeout | null = null;
  private sizeExceededCallback: (() => void) | null = null;
  private deviceIndex: number = -1;
  private currentSizeBytes: number = 0;

  /**
   * Get list of available audio input devices
   */
  getAvailableDevices(): string[] {
    return PvRecorder.getAvailableDevices();
  }

  /**
   * Set the audio input device to use
   * @param deviceIndex Device index (-1 for default device)
   */
  setDevice(deviceIndex: number): void {
    this.deviceIndex = deviceIndex;
  }

  startRecording(onSizeExceeded?: () => void): void {
    console.log('Starting recording...');
    
    // Get default audio device
    const devices = PvRecorder.getAvailableDevices();
    console.log('Available audio devices:', devices);
    if (this.deviceIndex >= 0 && this.deviceIndex < devices.length) {
      console.log(`Using device ${this.deviceIndex}: ${devices[this.deviceIndex]}`);
    } else {
      console.log('Using default audio device');
    }
    
    // Create recorder with 16kHz sample rate, 512 frame length
    this.recorder = new PvRecorder(512, this.deviceIndex);
    this.recorder.start();
    
    this.recording = true;
    this.audioBuffer = [];
    this.currentSizeBytes = 0;
    this.sizeExceededCallback = onSizeExceeded || null;
    
    // Read audio frames continuously
    this.recordingInterval = setInterval(async () => {
      if (this.recorder && this.recording) {
        try {
          const frame = await this.recorder.read();
          if (this.recording) { // Double-check we're still recording
            this.audioBuffer.push(frame);
            this.currentSizeBytes += frame.length * BYTES_PER_SAMPLE;
            
            // Check if we've exceeded the size limit
            if (this.currentSizeBytes >= MAX_RECORDING_SIZE_BYTES) {
              console.log(`Recording size limit reached (${this.currentSizeBytes} bytes)`);
              if (this.sizeExceededCallback) {
                this.sizeExceededCallback();
              }
            }
          }
        } catch (error) {
          // Ignore errors when stopping
          if (this.recording) {
            console.error('Error reading audio frame:', error);
          }
        }
      }
    }, 10); // Read every 10ms
  }

  stopRecording(): Int16Array {
    console.log('Stopping recording...');
    
    // Set flag first to stop new reads
    this.recording = false;
    
    // Clear callback
    this.sizeExceededCallback = null;
    
    // Clear interval
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
    
    // Stop and release recorder
    if (this.recorder) {
      try {
        this.recorder.stop();
        this.recorder.release();
      } catch (error) {
        console.error('Error stopping recorder:', error);
      }
      this.recorder = null;
    }
    
    // Combine all buffers into one
    const totalLength = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
    const combined = new Int16Array(totalLength);
    let offset = 0;
    for (const buf of this.audioBuffer) {
      combined.set(buf, offset);
      offset += buf.length;
    }
    
    this.audioBuffer = [];
    this.currentSizeBytes = 0;
    return combined;
  }
  
  /**
   * Get the current recording size in bytes
   */
  getCurrentSizeBytes(): number {
    return this.currentSizeBytes;
  }
  
  /**
   * Get the maximum recording size in bytes
   */
  getMaxSizeBytes(): number {
    return MAX_RECORDING_SIZE_BYTES;
  }

  isRecording(): boolean {
    return this.recording;
  }

  // Helper to save audio data as WAV file
  saveAsWav(audioData: Int16Array, filePath: string): void {
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
