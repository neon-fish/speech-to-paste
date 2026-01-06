import { uIOhook, UiohookKey } from 'uiohook-napi';

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
  private isToggleListening = false;
  
  constructor() {
    uIOhook.on('keydown', (event) => this.handleKeyDown(event));
    uIOhook.on('keyup', (event) => this.handleKeyUp(event));
  }

  start(): void {
    console.log('Starting hotkey manager...');
    console.log('Push-to-talk: Pause/Break (hold)');
    console.log('Toggle listen on: Shift+Pause/Break');
    console.log('Toggle listen off: Pause/Break (single press) or Shift+Pause/Break');
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

  private handleKeyDown(event: { keycode: number }): void {
    const keycode = event.keycode;
    
    // Track shift key
    if (keycode === UiohookKey.Shift || keycode === UiohookKey.ShiftRight) {
      this.shiftPressed = true;
    }
    
    // Pause key code is 3653 (0xE45 in hex)
    
    // Check for Shift+Pause (always toggle)
    if (keycode === 3653 && this.shiftPressed) {
      if (this.onTogglePress) {
        this.onTogglePress();
      }
      return;
    }
    
    // Check for Pause alone
    if (keycode === 3653 && !this.shiftPressed) {
      // If toggle listening is on, pressing Pause should stop it
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
    
    // Track shift key
    if (keycode === UiohookKey.Shift || keycode === UiohookKey.ShiftRight) {
      this.shiftPressed = false;
    }
    
    // Check for Pause release (push-to-talk)
    if (keycode === 3653 && this.isPushToTalkPressed) {
      this.isPushToTalkPressed = false;
      if (this.onPushToTalkRelease) {
        this.onPushToTalkRelease();
      }
    }
  }
}
