import SysTray, { MenuItem } from 'systray2';
import * as path from 'path';
import { exec } from 'child_process';

export type TrayStatus = 'idle' | 'recording' | 'transcribing';

interface TrayCallbacks {
  onToggleHotkeys?: () => void;
  onOpenSettings?: () => void;
  onExit?: () => void;
}

export class SystemTray {
  private systray: SysTray;
  private callbacks: TrayCallbacks;
  private hotkeysEnabled: boolean = true;
  private iconPaths: {
    idle: string;
    recording: string;
    transcribing: string;
  };

  constructor(callbacks: TrayCallbacks) {
    this.callbacks = callbacks;
    
    // Set up icon paths - use .ico on Windows, .png elsewhere
    const iconsDir = path.join(__dirname, '..', 'icons');
    const iconExtension = process.platform === 'win32' ? 'ico' : 'png';
    this.iconPaths = {
      idle: path.join(iconsDir, `idle.${iconExtension}`),
      recording: path.join(iconsDir, `recording.${iconExtension}`),
      transcribing: path.join(iconsDir, `transcribing.${iconExtension}`),
    };

    this.systray = new SysTray({
      menu: {
        icon: this.iconPaths.idle,
        title: 'Speech-to-Paste',
        tooltip: 'Speech-to-Paste (Idle)',
        items: this.getItems(),
      },
      debug: false,
      copyDir: true,
    });

    this.setupClickHandlers();
  }

  private getItems(): MenuItem[] {
    return [
      {
        title: this.hotkeysEnabled ? 'Disable Hotkeys' : 'Enable Hotkeys',
        tooltip: 'Toggle hotkey listening',
        checked: !this.hotkeysEnabled,
        enabled: true,
      },
      SysTray.separator,
      {
        title: 'Open web interface',
        tooltip: 'Edit settings & view transcriptions',
        enabled: true,
      },
      SysTray.separator,
      {
        title: 'Exit',
        tooltip: 'Exit application',
        enabled: true,
      },
    ];
  }

  private setupClickHandlers(): void {
    this.systray.onClick((action: any) => {
      if (action.seq_id === 0) {
        // Toggle Hotkeys
        this.hotkeysEnabled = !this.hotkeysEnabled;
        this.updateMenu();
        if (this.callbacks.onToggleHotkeys) {
          this.callbacks.onToggleHotkeys();
        }
      } else if (action.seq_id === 2) {
        // Open Settings
        if (this.callbacks.onOpenSettings) {
          this.callbacks.onOpenSettings();
        }
      } else if (action.seq_id === 4) {
        // Exit
        if (this.callbacks.onExit) {
          this.callbacks.onExit();
        }
      }
    });
  }

  private updateMenu(): void {
    this.systray.sendAction({
      type: 'update-item',
      item: {
        title: this.hotkeysEnabled ? 'Disable Hotkeys' : 'Enable Hotkeys',
        tooltip: 'Toggle hotkey listening',
        checked: !this.hotkeysEnabled,
        enabled: true,
      },
      seq_id: 0,
    });
  }

  setStatus(status: TrayStatus): void {

    const tooltips = {
      idle: 'Speech-to-Paste (Idle)',
      recording: 'Speech-to-Paste (Recording...)',
      transcribing: 'Speech-to-Paste (Transcribing...)',
    };

    this.systray.sendAction({
      type: 'update-menu',
      menu: {
        icon: this.iconPaths[status],
        title: 'Speech-to-Paste',
        tooltip: tooltips[status],
        items: this.getItems(),
      }
    });

  }

  kill(): void {
    if (this.systray) {
      this.systray.kill();
    }
  }

}
