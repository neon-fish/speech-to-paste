export const DEFAULT_PORT = 5933;

// Whisper API has a 25MB file size limit for audio uploads
// At 16kHz mono 16-bit: 16000 samples/sec * 2 bytes = 32000 bytes/sec
// 25MB = 26,214,400 bytes / 32,000 bytes/sec = ~819 seconds (~13.6 minutes)
// We'll use 24MB as the max to leave headroom for WAV headers and safety margin
export const MAX_RECORDING_SIZE_BYTES = 24 * 1024 * 1024; // 24MB
export const BYTES_PER_SAMPLE = 2; // 16-bit audio
export const SAMPLE_RATE = 16000; // Hz
