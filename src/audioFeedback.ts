import { existsSync } from 'fs';
import * as path from 'path';
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

  constructor() {
    this.soundsDir = path.join(__dirname, '..', 'assets/sounds');
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
    const mpg123Path = path.join(__dirname, '..', 'lib', 'mpg123', 'mpg123.exe');
    exec(`"${mpg123Path}" -q "${soundPath}"`, { windowsHide: true });
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
