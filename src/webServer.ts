import express from 'express';
import cors from 'cors';

export interface TranscriptionEntry {
  timestamp: Date;
  text: string;
  duration?: number;
}

export type AppStatus = 'idle' | 'recording' | 'transcribing';

export class WebServer {
  private app: express.Application;
  private server: any;
  private port: number;
  private transcriptions: TranscriptionEntry[] = [];
  private currentStatus: AppStatus = 'idle';
  private hotkeysEnabled = true;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Serve status
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: this.currentStatus,
        hotkeysEnabled: this.hotkeysEnabled,
        transcriptionCount: this.transcriptions.length,
      });
    });

    // Get transcription history
    this.app.get('/api/transcriptions', (req, res) => {
      res.json(this.transcriptions);
    });

    // Toggle hotkeys
    this.app.post('/api/hotkeys/toggle', (req, res) => {
      this.hotkeysEnabled = !this.hotkeysEnabled;
      res.json({ enabled: this.hotkeysEnabled });
    });

    // Clear history
    this.app.post('/api/transcriptions/clear', (req, res) => {
      this.transcriptions = [];
      res.json({ success: true });
    });

    // Serve simple HTML interface
    this.app.get('/', (req, res) => {
      res.send(this.getHtmlPage());
    });
  }

  private getHtmlPage(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Speech-to-Text Monitor</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1e1e1e;
      color: #e0e0e0;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #333;
    }
    h1 { font-size: 24px; }
    .status {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .status-idle { background: #666; }
    .status-recording { background: #e74c3c; }
    .status-transcribing { background: #f39c12; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .controls {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    button {
      padding: 10px 20px;
      background: #007acc;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    button:hover { background: #005a9e; }
    button:disabled {
      background: #555;
      cursor: not-allowed;
    }
    .transcriptions {
      background: #252526;
      border-radius: 8px;
      padding: 20px;
    }
    .transcription-item {
      background: #2d2d30;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 4px;
      border-left: 3px solid #007acc;
    }
    .transcription-time {
      color: #858585;
      font-size: 12px;
      margin-bottom: 5px;
    }
    .transcription-text {
      font-size: 14px;
      line-height: 1.5;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #858585;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Speech-to-Text Monitor</h1>
      <div class="status">
        <span>Status:</span>
        <div class="status-indicator status-idle" id="statusIndicator"></div>
        <span id="statusText">Idle</span>
      </div>
    </div>

    <div class="controls">
      <button id="toggleHotkeys">Disable Hotkeys</button>
      <button id="clearHistory">Clear History</button>
      <button onclick="location.reload()">Refresh</button>
    </div>

    <div class="transcriptions" id="transcriptions">
      <div class="empty-state">No transcriptions yet</div>
    </div>
  </div>

  <script>
    let hotkeysEnabled = true;

    async function updateStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        
        const indicator = document.getElementById('statusIndicator');
        const text = document.getElementById('statusText');
        
        indicator.className = 'status-indicator status-' + data.status;
        text.textContent = data.status.charAt(0).toUpperCase() + data.status.slice(1);
        
        hotkeysEnabled = data.hotkeysEnabled;
        document.getElementById('toggleHotkeys').textContent = 
          hotkeysEnabled ? 'Disable Hotkeys' : 'Enable Hotkeys';
      } catch (err) {
        console.error('Failed to update status:', err);
      }
    }

    async function updateTranscriptions() {
      try {
        const res = await fetch('/api/transcriptions');
        const data = await res.json();
        
        const container = document.getElementById('transcriptions');
        
        if (data.length === 0) {
          container.innerHTML = '<div class="empty-state">No transcriptions yet</div>';
          return;
        }
        
        container.innerHTML = data.map(t => {
          const time = new Date(t.timestamp).toLocaleTimeString();
          return \`
            <div class="transcription-item">
              <div class="transcription-time">\${time}</div>
              <div class="transcription-text">\${t.text}</div>
            </div>
          \`;
        }).reverse().join('');
      } catch (err) {
        console.error('Failed to update transcriptions:', err);
      }
    }

    document.getElementById('toggleHotkeys').addEventListener('click', async () => {
      try {
        const res = await fetch('/api/hotkeys/toggle', { method: 'POST' });
        const data = await res.json();
        await updateStatus();
      } catch (err) {
        console.error('Failed to toggle hotkeys:', err);
      }
    });

    document.getElementById('clearHistory').addEventListener('click', async () => {
      if (confirm('Clear all transcription history?')) {
        try {
          await fetch('/api/transcriptions/clear', { method: 'POST' });
          await updateTranscriptions();
        } catch (err) {
          console.error('Failed to clear history:', err);
        }
      }
    });

    // Update every second
    setInterval(() => {
      updateStatus();
      updateTranscriptions();
    }, 1000);

    // Initial update
    updateStatus();
    updateTranscriptions();
  </script>
</body>
</html>
    `;
  }

  start(): void {
    this.server = this.app.listen(this.port, () => {
      console.log(`Web interface available at http://localhost:${this.port}`);
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
    }
  }

  addTranscription(text: string, duration?: number): void {
    this.transcriptions.push({
      timestamp: new Date(),
      text,
      duration,
    });
  }

  setStatus(status: AppStatus): void {
    this.currentStatus = status;
  }

  isHotkeysEnabled(): boolean {
    return this.hotkeysEnabled;
  }
}
