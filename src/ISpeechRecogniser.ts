/**
 * Common interface for speech recognition implementations
 * Allows switching between API-based and local Whisper transcription
 */

export interface ISpeechRecogniser {
  /**
   * Transcribe audio data to text
   * @param audioData Raw audio buffer (WAV format) or Int16Array PCM data
   * @returns Transcribed text
   */
  recognizeFromAudioData(audioData: Buffer | Int16Array): Promise<string>;
}

export type WhisperMode = 'api' | 'local' | 'leopard';
export type WhisperModelSize = 'tiny' | 'base' | 'small' | 'medium' | 'large';
