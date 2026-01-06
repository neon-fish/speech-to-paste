import * as robot from 'robotjs';
import * as clipboardy from 'clipboardy';

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
  
  insertText(text: string): void {
    console.log(`Inserting text: "${text}"`);
    
    // Copy text to clipboard
    clipboardy.writeSync(text);
    
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
