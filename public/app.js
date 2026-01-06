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

// Update every second
setInterval(() => {
  updateStatus();
  updateTranscriptions();
}, 1000);

// Initial update
updateStatus();
updateTranscriptions();
