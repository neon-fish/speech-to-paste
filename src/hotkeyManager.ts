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
  
  private modifiers = new Set<number>();
  
  constructor() {
    uIOhook.on('keydown', (event) => this.handleKeyDown(event));
    uIOhook.on('keyup', (event) => this.handleKeyUp(event));
  }

  start(): void {
    console.log('Starting hotkey manager...');
    console.log('Push-to-talk: Ctrl+Shift+F9 (hold)');
    console.log('Toggle listen: Ctrl+Shift+F10');
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

  private handleKeyDown(event: { keycode: number }): void {
    const keycode = event.keycode;
    
    // Track modifier keys
    if (this.isModifier(keycode)) {
      this.modifiers.add(keycode);
    }
    
    // Check for Ctrl+Shift+F9 (push-to-talk)
    if (keycode === UiohookKey.F9 && this.hasCtrlShift() && !this.isPushToTalkPressed) {
      this.isPushToTalkPressed = true;
      if (this.onPushToTalkPress) {
        this.onPushToTalkPress();
      }
    }
    
    // Check for Ctrl+Shift+F10 (toggle)
    if (keycode === UiohookKey.F10 && this.hasCtrlShift()) {
      if (this.onTogglePress) {
        this.onTogglePress();
      }
    }
  }

  private handleKeyUp(event: { keycode: number }): void {
    const keycode = event.keycode;
    
    // Remove modifier keys
    if (this.isModifier(keycode)) {
      this.modifiers.delete(keycode);
    }
    
    // Check for F9 release (push-to-talk)
    if (keycode === UiohookKey.F9 && this.isPushToTalkPressed) {
      this.isPushToTalkPressed = false;
      if (this.onPushToTalkRelease) {
        this.onPushToTalkRelease();
      }
    }
  }

  private isModifier(keycode: number): boolean {
    return keycode === UiohookKey.Ctrl || 
           keycode === UiohookKey.CtrlRight || 
           keycode === UiohookKey.Shift || 
           keycode === UiohookKey.ShiftRight;
  }

  private hasCtrlShift(): boolean {
    const hasCtrl = this.modifiers.has(UiohookKey.Ctrl) || this.modifiers.has(UiohookKey.CtrlRight);
    const hasShift = this.modifiers.has(UiohookKey.Shift) || this.modifiers.has(UiohookKey.ShiftRight);
    return hasCtrl && hasShift;
  }
}
