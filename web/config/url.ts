export const API_URL = (() => {
  const url = process.env.API_URL;
  if (!url) {
    throw new Error('API_URL not provided');
  }
  return url;
})();

// Audio CDN URL for production (pre-generated audio files)
// In development, audio is served through /api/audio proxy
// In production, this should point to GitHub Pages or CDN URL
export const AUDIO_BASE_URL =
  process.env.NEXT_PUBLIC_AUDIO_BASE_URL || '/api/audio';

export const API_KEY = process.env.API_KEY || '';
