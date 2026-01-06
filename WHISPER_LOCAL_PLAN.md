# Local Whisper Implementation Plan

## Overview
Add support for running Whisper locally as an alternative to the OpenAI API, allowing offline transcription without API costs.

## Implementation Options

### Option 1: whisper.cpp via Node.js bindings (RECOMMENDED)
**Library:** `whisper-node` or `node-whisper`
- **Pros:**
  - Fast C++ implementation
  - Lower memory footprint than Python
  - Pre-built binaries available
  - Works offline
  - Multiple model sizes (tiny, base, small, medium, large)
- **Cons:**
  - Requires downloading model files (75MB - 3GB depending on size)
  - Initial setup more complex
  - May need compilation on some systems
- **Performance:** 
  - tiny model: ~1s for 30s audio (fast but less accurate)
  - base model: ~3s for 30s audio (good balance)
  - small model: ~8s for 30s audio (better accuracy)

### Option 2: Python whisper via child process
**Approach:** Call OpenAI's official `whisper` Python package
- **Pros:**
  - Official implementation
  - High accuracy
  - Easy to install if Python available
- **Cons:**
  - Requires Python environment
  - Slower than whisper.cpp
  - Higher memory usage
  - Complex packaging for standalone executable
- **Not recommended** due to Python dependency complications

### Option 3: Transformers.js
**Library:** `@xenova/transformers`
- **Pros:**
  - Pure JavaScript/WASM
  - No native dependencies
  - Easy to package
- **Cons:**
  - Slower inference
  - Higher memory usage
  - Still experimental for Whisper
  - May not work well with pkg

## Recommended Implementation Steps

### 1. Add whisper-node dependency
```bash
npm install whisper-node
```

### 2. Create LocalSpeechRecogniser class
Create `src/localSpeechRecogniser.ts`:
```typescript
import whisper from 'whisper-node';

export class LocalSpeechRecogniser {
  private modelPath: string;
  private modelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  
  constructor(modelSize: 'tiny' | 'base' | 'small' = 'base') {
    this.modelSize = modelSize;
    // Model will be downloaded to ~/.cache/whisper or specified path
  }
  
  async recognizeFromAudioData(audioData: Buffer): Promise<string> {
    // Save buffer to temp file (whisper-node requires file input)
    // Call whisper transcription
    // Return text
  }
}
```

### 3. Update config.json schema
Add configuration options:
```json
{
  "openaiApiKey": "sk-...",
  "whisperMode": "api" | "local",
  "localWhisperModel": "tiny" | "base" | "small" | "medium" | "large"
}
```

### 4. Update SpeechRecogniser interface
Create a common interface that both API and local versions implement:
```typescript
export interface ISpeechRecogniser {
  recognizeFromAudioData(audioData: Buffer): Promise<string>;
}
```

### 5. Update index.ts factory function
Modify `getSpeechRecognizer()` to return API or local version based on config:
```typescript
function getSpeechRecognizer(): ISpeechRecogniser | null {
  const mode = configManager.getWhisperMode(); // 'api' or 'local'
  
  if (mode === 'local') {
    const modelSize = configManager.getLocalWhisperModel();
    return new LocalSpeechRecogniser(modelSize);
  } else {
    const apiKey = configManager.getApiKey();
    if (!apiKey) return null;
    return new SpeechRecogniser(apiKey);
  }
}
```

### 6. Add UI controls in web interface
Update `public/index.html` and `public/app.js`:
- Radio buttons to select API vs Local mode
- Dropdown for local model size
- Button to download/verify models
- Status indicator showing which mode is active

### 7. Model management
- Auto-download models on first use
- Show download progress in web UI
- Store models in app data directory (not in node_modules)
- Add model verification/integrity check

### 8. Update packaging
- Don't include model files in pkg bundle (too large)
- Models should be downloaded to user's system on first run
- Update README with model download instructions

## Configuration Example

```json
{
  "openaiApiKey": "sk-xxx",
  "whisperMode": "local",
  "localWhisperModel": "base",
  "modelPath": "./models"
}
```

## Testing Strategy
1. Test with tiny model first (fastest)
2. Compare accuracy between API and local models
3. Measure transcription times for different audio lengths
4. Test with various accents and audio qualities
5. Verify offline functionality

## Documentation Updates
- README: Add local Whisper setup instructions
- README: Document model sizes and tradeoffs
- README: Add offline usage section
- Config: Document new configuration options

## Estimated Effort
- Core implementation: 4-6 hours
- UI updates: 2-3 hours
- Testing and refinement: 2-4 hours
- Documentation: 1-2 hours
**Total: 9-15 hours**

## Future Enhancements
- Auto-switch to local when API key missing
- Hybrid mode: use local for quick preview, API for final transcription
- Model performance benchmarking in UI
- Custom model support (fine-tuned models)
