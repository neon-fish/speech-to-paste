import express from 'express';
import cors from 'cors';
import * as path from 'path';

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
    
    // Serve static files from public directory
    this.app.use(express.static(path.join(__dirname, '..', 'public')));
    
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
