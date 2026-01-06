import * as robot from 'robotjs';

/**
 * Text insertion module
 * 
 * Current: robotjs
 * Alternatives:
 * - nut-js (@nut-tree/nut-js) - more modern, better maintained
 * - node-key-sender
 * - nircmd (Windows CLI wrapper)
 * - AutoHotkey via ahk.exe wrapper (Windows)
 * - xdotool wrapper (Linux)
 * - clipboard + Ctrl+V approach (less direct but more reliable)
 */

export class TextInserter {
  
  insertText(text: string): void {
    console.log(`Inserting text: "${text}"`);
    
    // Small delay to ensure focus is ready
    robot.setKeyboardDelay(2);
    
    // Type the text
    robot.typeString(text);
  }

  insertTextViaClipboard(text: string): void {
    // Alternative approach: copy to clipboard then paste
    // More reliable but overwrites clipboard
    // Would need a clipboard library like 'clipboardy'
    console.log('Clipboard insertion not yet implemented');
  }
}
