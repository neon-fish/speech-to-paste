import { uIOhook, UiohookKey } from 'uiohook-napi';
import { HotkeyConfig } from './config';

/**
 * Global hotkey manager
 * 
 * Current: uiohook-napi (modern fork of iohook, better maintained)
 * Alternatives:
 * - node-global-key-listener
 * - iohook (original, but deprecated)
 * - globalkey
 * - nativeKeymap
 * - electron's globalShortcut (if using Electron)
 * 
 * Note: Global hotkeys work across applications but may need elevated
 * permissions on some systems.
 */

type HotkeyCallback = () => void;

export class HotkeyManager {
  private isPushToTalkPressed = false;
  private onPushToTalkPress: HotkeyCallback | null = null;
  private onPushToTalkRelease: HotkeyCallback | null = null;
  private onTogglePress: HotkeyCallback | null = null;
  
  private shiftPressed = false;
  private ctrlPressed = false;
  private altPressed = false;
  private isToggleListening = false;
  
  private pushToTalkHotkey: HotkeyConfig = { keyCode: 3653 }; // Default: Pause/Break
  private toggleListenHotkey: HotkeyConfig = { keyCode: 3653, shift: true }; // Default: Shift+Pause
  
  constructor(pushToTalkHotkey?: HotkeyConfig, toggleListenHotkey?: HotkeyConfig) {
    if (pushToTalkHotkey) {
      this.pushToTalkHotkey = pushToTalkHotkey;
    }
    if (toggleListenHotkey) {
      this.toggleListenHotkey = toggleListenHotkey;
    }
    
    uIOhook.on('keydown', (event) => this.handleKeyDown(event));
    uIOhook.on('keyup', (event) => this.handleKeyUp(event));
  }

  start(): void {
    console.log('Starting hotkey manager...');
    console.log(`Push-to-talk: ${this.hotkeyToString(this.pushToTalkHotkey)} (hold)`);
    console.log(`Toggle listen on: ${this.hotkeyToString(this.toggleListenHotkey)}`);
    console.log(`Toggle listen off: ${this.hotkeyToString(this.pushToTalkHotkey)} (single press) or ${this.hotkeyToString(this.toggleListenHotkey)}`);
    uIOhook.start();
  }

  stop(): void {
    uIOhook.stop();
  }

  registerPushToTalk(onPress: HotkeyCallback, onRelease: HotkeyCallback): void {
    this.onPushToTalkPress = onPress;
    this.onPushToTalkRelease = onRelease;
  }

  registerToggle(onPress: HotkeyCallback): void {
    this.onTogglePress = onPress;
  }

  setToggleListening(enabled: boolean): void {
    this.isToggleListening = enabled;
  }

  private hotkeyToString(hotkey: HotkeyConfig): string {
    const parts: string[] = [];
    if (hotkey.ctrl) parts.push('Ctrl');
    if (hotkey.shift) parts.push('Shift');
    if (hotkey.alt) parts.push('Alt');
    parts.push(this.keyCodeToName(hotkey.keyCode));
    return parts.join('+');
  }

  private keyCodeToName(keyCode: number): string {
    // Common key codes
    const keyNames: { [key: number]: string } = {
      3653: 'Pause/Break',
      8: 'Backspace',
      9: 'Tab',
      13: 'Enter',
      27: 'Escape',
      32: 'Space',
      112: 'F1', 113: 'F2', 114: 'F3', 115: 'F4',
      116: 'F5', 117: 'F6', 118: 'F7', 119: 'F8',
      120: 'F9', 121: 'F10', 122: 'F11', 123: 'F12',
    };
    
    if (keyNames[keyCode]) {
      return keyNames[keyCode];
    }
    
    // For letter keys (A-Z are typically 65-90)
    if (keyCode >= 65 && keyCode <= 90) {
      return String.fromCharCode(keyCode);
    }
    
    return `Key${keyCode}`;
  }

  private matchesHotkey(keyCode: number, hotkey: HotkeyConfig): boolean {
    if (keyCode !== hotkey.keyCode) return false;
    if (hotkey.shift && !this.shiftPressed) return false;
    if (!hotkey.shift && this.shiftPressed) return false;
    if (hotkey.ctrl && !this.ctrlPressed) return false;
    if (!hotkey.ctrl && this.ctrlPressed) return false;
    if (hotkey.alt && !this.altPressed) return false;
    if (!hotkey.alt && this.altPressed) return false;
    return true;
  }

  private handleKeyDown(event: { keycode: number }): void {
    const keycode = event.keycode;
    
    // Track modifier keys
    if (keycode === UiohookKey.Shift || keycode === UiohookKey.ShiftRight) {
      this.shiftPressed = true;
    }
    if (keycode === UiohookKey.Ctrl || keycode === UiohookKey.CtrlRight) {
      this.ctrlPressed = true;
    }
    if (keycode === UiohookKey.Alt || keycode === UiohookKey.AltRight) {
      this.altPressed = true;
    }
    
    // Check for toggle hotkey
    if (this.matchesHotkey(keycode, this.toggleListenHotkey)) {
      if (this.onTogglePress) {
        this.onTogglePress();
      }
      return;
    }
    
    // Check for push-to-talk hotkey
    if (this.matchesHotkey(keycode, this.pushToTalkHotkey)) {
      // If toggle listening is on, this key should stop it
      if (this.isToggleListening) {
        if (this.onTogglePress) {
          this.onTogglePress();
        }
      } else {
        // Otherwise, it's push-to-talk
        if (!this.isPushToTalkPressed) {
          this.isPushToTalkPressed = true;
          if (this.onPushToTalkPress) {
            this.onPushToTalkPress();
          }
        }
      }
    }
  }

  private handleKeyUp(event: { keycode: number }): void {
    const keycode = event.keycode;
    
    // Track modifier keys
    if (keycode === UiohookKey.Shift || keycode === UiohookKey.ShiftRight) {
      this.shiftPressed = false;
    }
    if (keycode === UiohookKey.Ctrl || keycode === UiohookKey.CtrlRight) {
      this.ctrlPressed = false;
    }
    if (keycode === UiohookKey.Alt || keycode === UiohookKey.AltRight) {
      this.altPressed = false;
    }
    
    // Check for push-to-talk hotkey release
    if (keycode === this.pushToTalkHotkey.keyCode && this.isPushToTalkPressed) {
      this.isPushToTalkPressed = false;
      if (this.onPushToTalkRelease) {
        this.onPushToTalkRelease();
      }
    }
  }
}
