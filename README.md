# Speech-to-Paste

A Windows desktop application that captures audio from your microphone, transcribes speech using OpenAI's Whisper API, and automatically types the result into any focused text field.

## Features

- **System Tray Integration**: Runs in the background with visual status indicators
  - Gray icon: Idle
  - Red icon: Recording
  - Orange icon: Transcribing
- **Customizable Global Hotkeys**: Works across all applications (configurable via web interface)
  - Default: `Pause/Break` for push-to-talk (hold to record, release to transcribe)
  - Default: `Shift+Pause/Break` for toggle continuous listening mode (on/off)
- **Web Interface**: Configure and monitor the application at http://localhost:5933 (port configurable)
  - OpenAI API key and Whisper settings (language, temperature, prompt)
  - Audio device selection and feedback settings
  - Customizable hotkeys (manual key code entry with reference table)
  - Export/import configuration
  - Transcription history with adjustable limit
  - Toggle hotkeys on/off
  - Minimize to tray on startup option
- **Recording Limits**: Automatically stops at 25MB (~13 minutes) to comply with Whisper API limits
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
2. Press and hold your configured push-to-talk hotkey (default: `Pause/Break`) to record audio
3. Release to automatically transcribe and paste the text
4. Or use your toggle hotkey (default: `Shift+Pause/Break`) to enable continuous listening mode
5. Configure settings, customize hotkeys, and view history at http://localhost:5933

## Packaging

To create a standalone executable:

```bash
npm run package
```

The executable will be created in the `bin/` directory and includes all necessary dependencies.

## Requirements

- **Operating System**: Windows 10/11 (macOS/Linux support in development)
- **Node.js 20+** (for development)
- **OpenAI API key** ([get one here](https://platform.openai.com/api-keys))
- **Microphone access**
- **Build tools**: Visual C++ (Windows), Xcode Command Line Tools (macOS), or build-essential (Linux) - required for robotjs compilation

## Architecture

The application is built with modularity in mind. See the source files for alternatives:
- [`audioRecorder.ts`](src/audioRecorder.ts) - Audio capture using PvRecorder
- [`speechRecogniser.ts`](src/speechRecogniser.ts) - OpenAI Whisper API integration  
- [`textInserter.ts`](src/textInserter.ts) - Text insertion via robotjs
- [`hotkeyManager.ts`](src/hotkeyManager.ts) - Global hotkeys using uiohook-napi
- [`systemTray.ts`](src/systemTray.ts) - System tray with status icons
- [`webServer.ts`](src/webServer.ts) - Express-based web interface

## Known Limitations

- **Platform support**: Currently Windows-only for text insertion (robotjs dependency). Cross-platform support in progress - system tray and hotkeys already compatible with macOS/Linux
- Requires platform-specific build tools for robotjs compilation (Visual C++ on Windows, Xcode on macOS, build-essential on Linux)
- Cloud API calls add latency and cost per transcription
- Cannot verify if a text input field is actually focused before pasting
- Recording limited to 25MB (~13 minutes at 16kHz) per the Whisper API constraints
- Hotkey customization requires manual entry of key codes (use the reference table in web interface)
- macOS/Linux will require appropriate permissions for microphone access and keyboard automation
- ~~**Local Whisper mode** requires native compilation (not currently functional on Windows - see [LOCAL_WHISPER_SETUP.md](LOCAL_WHISPER_SETUP.md))~~ - requires testing

## Configuration Options

All settings can be configured via the web interface at http://localhost:5933:

- **API Settings**: OpenAI API key, language, temperature (0-1), and prompt text
- **Audio**: Device selection and feedback sounds (enable/disable)
- **Behavior**: Auto-paste toggle, transcription history limit, minimize on startup
- **Hotkeys**: Customizable key codes with modifiers (Shift, Ctrl, Alt)
- **Server**: Configurable web server port (requires restart)
- **Backup**: Export/import configuration as JSON

## TODO / Future Features

- [ ] **Cross-platform support** (Linux/macOS):
  - [x] System tray icons - use .png format on non-Windows platforms
  - [ ] Platform-specific text insertion (replace robotjs Ctrl+V with OS-specific paste commands)
  - [ ] Platform-specific minimize on startup handling
  - [ ] Multi-platform packaging configuration
  - [ ] Platform guards for robotjs permissions and compatibility
  - [ ] Test on macOS and Linux environments
  - [ ] Document platform-specific permission requirements
- [ ] **Local Whisper support** - framework in place but needs alternative implementation (see [LOCAL_WHISPER_SETUP.md](LOCAL_WHISPER_SETUP.md))
