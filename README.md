# Speech-to-Paste

A Windows desktop application that captures audio from your microphone, transcribes speech using OpenAI's Whisper API, and automatically types the result into any focused text field.

## Features

- **System Tray Integration**: Runs in the background with visual status indicators
  - Gray icon: Idle
  - Red icon: Recording
  - Orange icon: Transcribing
- **Global Hotkeys**: Works across all applications
  - `Pause/Break`: Push-to-talk (hold to record, release to transcribe)
  - `Shift+Pause/Break`: Toggle continuous listening mode (on/off)
- **Web Interface**: Configure and monitor the application at http://localhost:5933
  - Set your OpenAI API key
  - View transcription history
  - Toggle hotkeys on/off
  - Monitor application status
- **Modular Design**: Swappable components for audio recording, speech recognition, text insertion, and hotkey management

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

   **Note**: On Windows, `robotjs` requires Visual C++ build tools. See the [robotjs documentation](https://github.com/octalmage/robotjs) for details.

2. Build the project:
   ```bash
   npm run build
   ```

3. Run the application:
   ```bash
   npm start
   ```

4. Configure your OpenAI API key:
   - Open http://localhost:5933 in your browser
   - Enter your API key (get one at https://platform.openai.com/api-keys)
   - Or create a `config.json` file next to the executable with:
     ```json
     {
       "openaiApiKey": "your_api_key_here"
     }
     ```

## Usage

1. The application starts in the system tray (look for the gray circular icon)
2. Press and hold `Pause/Break` to record audio
3. Release to automatically transcribe and paste the text
4. Or press `Shift+Pause/Break` to toggle continuous listening mode

## Packaging

To create a standalone executable:

```bash
npm run package
```

The executable will be created in the `bin/` directory and includes all necessary dependencies.

## Requirements

- **Windows 10/11**
- **Node.js 20+** (for development)
- **OpenAI API key** ([get one here](https://platform.openai.com/api-keys))
- **Microphone access**
- **Visual C++ build tools** (for robotjs compilation)

## Architecture

The application is built with modularity in mind. See the source files for alternatives:
- [`audioRecorder.ts`](src/audioRecorder.ts) - Audio capture using PvRecorder
- [`speechRecogniser.ts`](src/speechRecogniser.ts) - OpenAI Whisper API integration  
- [`textInserter.ts`](src/textInserter.ts) - Text insertion via robotjs
- [`hotkeyManager.ts`](src/hotkeyManager.ts) - Global hotkeys using uiohook-napi
- [`systemTray.ts`](src/systemTray.ts) - System tray with status icons
- [`webServer.ts`](src/webServer.ts) - Express-based web interface

## Known Limitations

- Windows only (due to robotjs and system tray dependencies)
- Requires Visual C++ build tools for robotjs compilation
- Cloud API calls add latency and cost per transcription
- Cannot verify if a text input field is actually focused before pasting
- ~~**Local Whisper mode** requires native compilation (not currently functional on Windows - see [LOCAL_WHISPER_SETUP.md](LOCAL_WHISPER_SETUP.md))~~ - requires testing

## TODO / Future Features

- [x] Add listening/stopped listening audio files
- [x] Enable/disable audio feedback in web GUI
- [x] Toggle auto-paste (automatically paste vs copy to clipboard only)
- [ ] Audio input device selection
- [ ] Whisper language selection (currently auto-detects)
- [ ] **Local Whisper support** - framework in place but needs alternative implementation (see [LOCAL_WHISPER_SETUP.md](LOCAL_WHISPER_SETUP.md))
- [ ] Customizable hotkeys in settings
- [ ] Adjustable transcription history limit
- [ ] Export/import configuration
- [ ] Whisper API parameters (temperature, prompt, etc.)
- [ ] Web server port configuration in GUI
- [ ] Minimize to tray on startup option
