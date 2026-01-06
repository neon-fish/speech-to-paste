import SysTray from 'systray2';
import * as path from 'path';
import { exec } from 'child_process';

export type TrayStatus = 'idle' | 'recording' | 'transcribing';

interface TrayCallbacks {
  onToggleHotkeys?: () => void;
  onOpenSettings?: () => void;
  onExit?: () => void;
}

export class SystemTray {
  private systray: any;
  private callbacks: TrayCallbacks;
  private hotkeysEnabled: boolean = true;

  constructor(callbacks: TrayCallbacks) {
    this.callbacks = callbacks;
    
    // Create simple base64 icons (minimal SVG icons)
    const icons = {
      idle: this.createIcon('#666666'),      // Gray
      recording: this.createIcon('#e74c3c'), // Red
      transcribing: this.createIcon('#f39c12'), // Orange
    };

    this.systray = new SysTray({
      menu: {
        icon: icons.idle,
        title: 'Speech-to-Text',
        tooltip: 'Speech-to-Text (Idle)',
        items: [
          {
            title: 'Disable Hotkeys',
            tooltip: 'Toggle hotkey listening',
            checked: false,
            enabled: true,
          },
          {
            title: '---',
            tooltip: '',
          },
          {
            title: 'Open Settings',
            tooltip: 'Open web interface',
            enabled: true,
          },
          {
            title: '---',
            tooltip: '',
          },
          {
            title: 'Exit',
            tooltip: 'Exit application',
            enabled: true,
          },
        ],
      },
      debug: false,
      copyDir: true,
    });

    this.setupClickHandlers();
  }

  private createIcon(color: string): string {
    // Simple circular icon in base64
    const svg = `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" fill="${color}"/>
    </svg>`;
    return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
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
    const icons = {
      idle: this.createIcon('#666666'),
      recording: this.createIcon('#e74c3c'),
      transcribing: this.createIcon('#f39c12'),
    };

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
    const icons = {
      idle: this.createIcon('#666666'),
      recording: this.createIcon('#e74c3c'),
      transcribing: this.createIcon('#f39c12'),
    };

    const tooltips = {
      idle: 'Speech-to-Text (Idle)',
      recording: 'Speech-to-Text (Recording...)',
      transcribing: 'Speech-to-Text (Transcribing...)',
    };

    this.systray.sendAction({
      type: 'update-icon',
      icon: icons[status],
    });

    this.systray.sendAction({
      type: 'update-tooltip',
      tooltip: tooltips[status],
    });
  }

  kill(): void {
    if (this.systray) {
      this.systray.kill();
    }
  }
}
