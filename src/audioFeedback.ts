import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';

/**
 * Audio feedback player for user interactions
 * Plays sound effects for recording start/stop events
 * 
 * Sound files should be placed in the 'sounds' directory:
 * - start.wav or start.mp3: Played when recording starts
 * - stop.wav or stop.mp3: Played when recording stops
 */

export class AudioFeedback {
  private soundsDir: string;
  private enabled: boolean = true;
  private mpg123Path: string = '';
  private extractedDir: string = '';

  constructor() {
    // Use process.cwd() for pkg compatibility - assets are relative to executable
    const baseDir = (process as any).pkg ? process.cwd() : path.join(__dirname, '..');
    this.soundsDir = path.join(baseDir, 'assets', 'sounds');
    
    // Extract files if running from pkg
    if ((process as any).pkg) {
      this.extractAssets();
    } else {
      this.mpg123Path = path.join(baseDir, 'lib', 'mpg123', 'mpg123.exe');
    }
  }

  /**
   * Extract mpg123.exe and sound files from pkg to temp directory
   */
  private extractAssets(): void {
    try {
      // Create temp directory for extracted files
      this.extractedDir = path.join(os.tmpdir(), 'speech-to-paste-' + process.pid);
      mkdirSync(this.extractedDir, { recursive: true });
      
      // Extract mpg123.exe
      const mpg123Source = path.join(__dirname, '..', 'lib', 'mpg123', 'mpg123.exe');
      this.mpg123Path = path.join(this.extractedDir, 'mpg123.exe');
      if (existsSync(mpg123Source)) {
        const mpg123Data = readFileSync(mpg123Source);
        writeFileSync(this.mpg123Path, mpg123Data);
      }
      
      // Extract sound files
      const soundsExtracted = path.join(this.extractedDir, 'sounds');
      mkdirSync(soundsExtracted, { recursive: true });
      
      const soundFiles = ['start.mp3', 'stop.mp3'];
      for (const file of soundFiles) {
        const source = path.join(__dirname, '..', 'assets', 'sounds', file);
        const dest = path.join(soundsExtracted, file);
        if (existsSync(source)) {
          const data = readFileSync(source);
          writeFileSync(dest, data);
        }
      }
      
      this.soundsDir = soundsExtracted;
      
      console.log('[AudioFeedback] Assets extracted to:', this.extractedDir);
    } catch (error) {
      console.error('[AudioFeedback] Failed to extract assets:', error);
    }
  }

  /**
   * Enable or disable audio feedback
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Play sound file using mpg123
   */
  private playSound(soundPath: string): void {
    if (!this.mpg123Path || !existsSync(this.mpg123Path)) {
      console.error('[AudioFeedback] mpg123 not available');
      return;
    }
    exec(`"${this.mpg123Path}" -q "${soundPath}"`, { windowsHide: true });
  }

  /**
   * Play sound when recording starts
   * Expected sound: short "da-ding" ascending tone
   */
  playStartSound(): void {
    if (!this.enabled) return;
    
    const startSound = path.join(this.soundsDir, 'start.mp3');
    if (existsSync(startSound)) {
      this.playSound(startSound);
    } else {
      console.log('[AudioFeedback] Start sound file not found:', startSound);
    }
  }

  /**
   * Play sound when recording stops
   * Expected sound: short "di-dum" descending tone
   */
  playStopSound(): void {
    if (!this.enabled) return;
    
    const stopSound = path.join(this.soundsDir, 'stop.mp3');
    if (existsSync(stopSound)) {
      this.playSound(stopSound);
    } else {
      console.log('[AudioFeedback] Stop sound file not found:', stopSound);
    }
  }
}
