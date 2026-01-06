# Speech-to-Text Script

A simple Node.js/TypeScript script that captures audio from your microphone, recognizes speech using OpenAI's Whisper API, and types the result into the currently focused text field.

## Features

- **Global Hotkeys**: Works even when other applications are focused
  - `Ctrl+Shift+F9`: Push-to-talk (hold to record, release to transcribe)
  - `Ctrl+Shift+F10`: Toggle listening mode (on/off)
- **Modular Design**: Easy to swap out components:
  - Audio recording (currently: node-record-lpcm16)
  - Speech recognition (currently: OpenAI Whisper API)
  - Text insertion (currently: robotjs)
  - Hotkey management (currently: uiohook-napi)

## Setup

1. Copy `.env.example` to `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run:
   ```bash
   npm start
   ```

## Requirements

- Node.js 18+ 
- OpenAI API key (get one at https://platform.openai.com/)
- Microphone access
- On Windows: May require running as administrator for global hotkeys

## Component Alternatives

See comments in each module for alternative libraries you can swap in:
- `src/audioRecorder.ts` - Audio capture alternatives
- `src/speechRecognizer.ts` - Speech recognition alternatives
- `src/textInserter.ts` - Text insertion alternatives
- `src/hotkeyManager.ts` - Hotkey library alternatives

## Known Limitations

- robotjs may be tricky to build on some systems (requires Python/build tools)
- Text insertion can't verify if a textbox is actually selected
- Cloud API calls have latency and cost per use
