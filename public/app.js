let hotkeysEnabled = true;

async function updateConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    
    // Update API key status
    const statusSpan = document.getElementById('apiKeyStatus');
    if (data.hasApiKey) {
      statusSpan.textContent = `✓ Configured (${data.apiKeyPreview})`;
      statusSpan.className = 'success';
    } else {
      statusSpan.textContent = '⚠ Not configured';
      statusSpan.className = 'error';
    }

    // Update Whisper mode radio buttons
    const mode = data.whisperMode || 'api';
    document.getElementById('modeApi').checked = (mode === 'api');
    document.getElementById('modeLocal').checked = (mode === 'local');
    
    // Show/hide relevant sections based on mode
    document.getElementById('apiKeySection').style.display = (mode === 'api') ? 'block' : 'none';
    document.getElementById('modelSection').style.display = (mode === 'local') ? 'block' : 'none';
    
    // Update model selection
    document.getElementById('whisperModel').value = data.localWhisperModel || 'base';
    
    // Update audio feedback checkbox
    document.getElementById('audioFeedbackEnabled').checked = data.audioFeedbackEnabled !== false;
    
    // Show warning if local mode is selected but not available
    const localWarning = document.getElementById('localWarning');
    if (mode === 'local' && !data.localWhisperAvailable) {
      if (localWarning) {
        localWarning.style.display = 'block';
        if (data.localWhisperError) {
          localWarning.querySelector('.warning-message').textContent = 
            'Local Whisper is not available: ' + data.localWhisperError;
        }
      }
    } else if (localWarning) {
      localWarning.style.display = 'none';
    }
  } catch (err) {
    console.error('Failed to update config:', err);
  }
}

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
      return `
        <div class="transcription-item">
          <div class="transcription-time">${time}</div>
          <div class="transcription-text">${t.text}</div>
        </div>
      `;
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

document.getElementById('saveApiKey').addEventListener('click', async () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  
  if (!apiKey) {
    alert('Please enter an API key');
    return;
  }
  
  try {
    const res = await fetch('/api/config/apikey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    
    if (res.ok) {
      document.getElementById('apiKey').value = '';
      await updateConfig();
      alert('API key saved successfully!');
    } else {
      alert('Failed to save API key');
    }
  } catch (err) {
    console.error('Failed to save API key:', err);
    alert('Error saving API key');
  }
});

// Whisper mode change handlers
document.getElementById('modeApi').addEventListener('change', async (e) => {
  if (e.target.checked) {
    try {
      const res = await fetch('/api/config/whisper-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'api' })
      });
      if (res.ok) {
        await updateConfig();
      }
    } catch (err) {
      console.error('Failed to update whisper mode:', err);
    }
  }
});

document.getElementById('modeLocal').addEventListener('change', async (e) => {
  if (e.target.checked) {
    try {
      const res = await fetch('/api/config/whisper-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'local' })
      });
      if (res.ok) {
        await updateConfig();
        alert('Local mode enabled. Model will download on first use.');
      }
    } catch (err) {
      console.error('Failed to update whisper mode:', err);
    }
  }
});

document.getElementById('saveModel').addEventListener('click', async () => {
  const model = document.getElementById('whisperModel').value;
  
  try {
    const res = await fetch('/api/config/whisper-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model })
    });
    
    if (res.ok) {
      await updateConfig();
      alert('Model size saved! Model will download on first use if not already available.');
    } else {
      alert('Failed to save model size');
    }
  } catch (err) {
    console.error('Failed to save model size:', err);
    alert('Error saving model size');
  }
});

// Audio feedback toggle
document.getElementById('audioFeedbackEnabled').addEventListener('change', async (e) => {
  try {
    const res = await fetch('/api/config/audio-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: e.target.checked })
    });
    if (res.ok) {
      console.log('Audio feedback updated:', e.target.checked);
    } else {
      alert('Failed to update audio feedback setting');
      e.target.checked = !e.target.checked; // revert
    }
  } catch (err) {
    console.error('Failed to update audio feedback:', err);
    alert('Error updating audio feedback setting');
    e.target.checked = !e.target.checked; // revert
  }
});

// Update every second
setInterval(() => {
  updateStatus();
  updateTranscriptions();
}, 1000);

// Initial update
updateConfig();
updateStatus();
updateTranscriptions();
