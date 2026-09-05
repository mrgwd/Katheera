export const CONFIDENCE_THRESHOLD = 0.9; //0.9
export const MIN_CONFIDENCE_SEED = 0.4; // predictions must beat this before the user threshold applies
export const COOLDOWN_MS = 1500; // 1500
export const SAME_ZIKR_COOLDOWN_MS = 500; // Cooldown to block the EXACT same word from firing in overlapping windows
export const TARGET_SAMPLE_RATE = 16000;
export const TARGET_RMS = 0.15; // Target loudness, tune this (0.05–0.2 is reasonable)
export const MIN_RMS = 0.0001; // 0.0001 Below this = silence, skip
