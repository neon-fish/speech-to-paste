import * as robot from 'robotjs';
import * as clipboardy from 'clipboardy';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

/**
 * Text insertion module
 * 
 * Current: clipboardy + robotjs (clipboard paste - fast and reliable)
 * Alternatives:
 * - robotjs typeString (character-by-character, slow)
 * - nut-js (@nut-tree/nut-js) - more modern, better maintained
 * - node-key-sender
 * - nircmd (Windows CLI wrapper)
 * - AutoHotkey via ahk.exe wrapper (Windows)
 * - xdotool wrapper (Linux)
 */

export class TextInserter {
  private clipboardExePath: string | null = null;

  constructor() {
    // When running in pkg, extract the clipboard executable
    if ((process as any).pkg) {
      this.extractClipboardExecutable();
    }
  }

  private extractClipboardExecutable(): void {
    try {
      const exeName = process.arch === 'x64' ? 'clipboard_x86_64.exe' : 'clipboard_i686.exe';
      const sourcePath = path.join(
        __dirname,
        '..',
        'node_modules',
        'clipboardy',
        'fallbacks',
        'windows',
        exeName
      );

      if (fs.existsSync(sourcePath)) {
        // Extract to temp directory
        const tempDir = path.join(os.tmpdir(), 'speech-script-clipboard');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        this.clipboardExePath = path.join(tempDir, exeName);
        
        // Copy if not already there or if different
        if (!fs.existsSync(this.clipboardExePath)) {
          fs.copyFileSync(sourcePath, this.clipboardExePath);
          console.log(`Extracted clipboard executable to: ${this.clipboardExePath}`);
        }
      }
    } catch (error) {
      console.error('Failed to extract clipboard executable:', error);
    }
  }
  
  insertText(text: string): void {
    console.log(`Inserting text: "${text}"`);
    
    try {
      // If running in pkg and we have extracted exe, use it directly
      if ((process as any).pkg && this.clipboardExePath && fs.existsSync(this.clipboardExePath)) {
        // Write text to stdin of clipboard executable
        execSync(`"${this.clipboardExePath}" --copy`, {
          input: text,
          encoding: 'utf-8'
        });
      } else {
        // Normal clipboardy usage
        clipboardy.writeSync(text);
      }
    } catch (error) {
      console.error('Clipboard write failed, falling back to character-by-character typing:', error);
      this.insertTextCharByChar(text);
      return;
    }
    
    // Small delay to ensure clipboard is ready and modifiers are released
    robot.setKeyboardDelay(50);
    
    // Paste using Ctrl+V
    robot.keyTap('v', ['control']);
  }

  insertTextCharByChar(text: string): void {
    // Fallback: character-by-character typing (slow but doesn't use clipboard)
    console.log(`Typing text character-by-character: "${text}"`);
    robot.setKeyboardDelay(2);
    robot.typeString(text);
  }
}
