# TTS (Text-to-Speech) Implementation Guide

## Overview

This implementation uses the **Kokoro-82M** model for text-to-speech generation. The system is designed for a MacBook M1 Air (CPU-only) with efficient caching and lazy loading.

## Features

- **Lightweight Model**: Kokoro-82M optimized for CPU inference
- **Caching**: SHA256-based caching to avoid regenerating identical audio
- **Lazy Loading**: Model loads on first request (configurable)
- **Multiple Voices**: 15+ voice options (American & British English)
- **Async Support**: Non-blocking audio generation using thread pools
- **Static File Serving**: Audio files served via FastAPI StaticFiles

## Installation

1. Install dependencies:
```bash
cd api
pip install -e .
```

This will install:
- `kokoro>=0.9.2` - TTS model
- `soundfile>=0.12.0` - Audio file I/O
- `aiofiles>=23.0.0` - Async file operations

2. Configure environment variables (copy from `.env.example`):
```bash
cp .env.example .env
```

## Configuration

Add these settings to your `.env` file:

```bash
# TTS Configuration
TTS_LANG_CODE=b                      # b=British, a=American
TTS_DEFAULT_VOICE=bm_fable          # Default narrator voice
TTS_CACHE_DIR=./audio_cache         # Cache directory
TTS_SAMPLE_RATE=24000               # Audio sample rate (Hz)
TTS_MAX_TEXT_LENGTH=5000            # Max characters per request
TTS_LAZY_LOAD=True                  # Load model on first request
STATIC_AUDIO_URL_PREFIX=/static/audio
```

## API Endpoints

### 1. Generate TTS Audio
```http
POST /api/tts
Content-Type: application/json

{
  "mystery_id": "atlantis_001",
  "text": "Plato spoke of a lost island civilization...",
  "voice_id": "bm_fable"  // Optional, defaults to bm_fable
}
```

**Response:**
```json
{
  "audio_url": "/static/audio/abc123def456.wav",
  "cached": false
}
```

### 2. Health Check
```http
GET /api/tts/health
```

**Response:**
```json
{
  "status": "ready",
  "model_loaded": true,
  "lazy_load": true,
  "default_voice": "bm_fable",
  "sample_rate": 24000,
  "max_text_length": 5000
}
```

### 3. Warmup Model
```http
POST /api/tts/warmup
```

Preloads the model to reduce latency on first request.

**Response:**
```json
{
  "status": "warmed_up",
  "message": "TTS model loaded successfully"
}
```

### 4. List Available Voices
```http
GET /api/tts/voices
```

**Response:**
```json
{
  "voices": [
    {
      "id": "bm_fable",
      "name": "Fable (British Male)",
      "language": "English (British)",
      "gender": "male",
      "description": "Default narrator voice - suitable for storytelling"
    },
    {
      "id": "af_bella",
      "name": "Bella (American Female)",
      "language": "English (American)",
      "gender": "female"
    }
    // ... more voices
  ],
  "default_voice": "bm_fable",
  "total_count": 15
}
```

## Available Voices

### British English (lang_code='b')
- `bf` - British Female
- `bf_emma` - Emma (British Female)
- `bf_isabella` - Isabella (British Female)
- `bm` - British Male
- **`bm_fable`** - Fable (British Male) - **DEFAULT**
- `bm_george` - George (British Male)
- `bm_lewis` - Lewis (British Male)

### American English
- `af` - American Female
- `af_bella` - Bella (American Female)
- `af_nicole` - Nicole (American Female)
- `af_sarah` - Sarah (American Female)
- `af_sky` - Sky (American Female)
- `am` - American Male
- `am_adam` - Adam (American Male)
- `am_michael` - Michael (American Male)

## Architecture

### Components

1. **`tts_model.py`** - Model Manager
   - Singleton pattern for model instance
   - Lazy loading with async lock
   - Thread-safe initialization
   - Cleanup on shutdown

2. **`tts_service.py`** - Business Logic
   - Cache key generation (SHA256)
   - Cache hit/miss handling
   - Audio generation orchestration
   - Error handling & cleanup

3. **`tts.py`** - API Routes
   - POST `/api/tts` - Generate audio
   - GET `/api/tts/health` - Health check
   - POST `/api/tts/warmup` - Preload model
   - GET `/api/tts/voices` - List voices

4. **`main.py`** - Static File Serving
   - Mounts `audio_cache/` directory
   - Serves audio at `/static/audio/`

### Data Flow

```
Client Request
    ↓
POST /api/tts
    ↓
generate_tts_audio()
    ↓
Check Cache (SHA256 hash)
    ↓
Cache Hit? → Return cached URL
    ↓
Cache Miss → Generate Audio
    ↓
get_tts_pipeline() [Lazy Load]
    ↓
Kokoro Generation (Thread Pool)
    ↓
Save to Cache (WAV format)
    ↓
Return Audio URL
```

## Error Handling

### Custom Exceptions

- **`TTSGenerationError`** (500) - Audio generation failed
- **`TTSModelNotReadyError`** (503) - Model not loaded
- **`TextTooLongError`** (400) - Text exceeds max length

All exceptions inherit from `WhiteRabbitException` and are handled by global exception handlers.

## Performance Considerations

### MacBook M1 Air Optimization

1. **CPU-Only Inference**: Kokoro-82M runs efficiently on Apple Silicon
2. **Lazy Loading**: Model loads only when needed (saves memory)
3. **Thread Pool**: CPU-bound operations don't block async event loop
4. **Caching**: Identical text+voice combinations reuse cached audio

### Expected Performance

- **First Request**: ~2-5 seconds (includes model loading)
- **Subsequent Requests**: ~1-3 seconds for new text
- **Cache Hits**: <100ms (file serving only)

### Cache Strategy

Cache key = `SHA256(text + voice_id)`

Example:
```python
text = "Plato spoke of Atlantis"
voice_id = "bm_fable"
cache_key = SHA256("Plato spoke of Atlantis:bm_fable")
# → abc123def456...
# → Saved as: audio_cache/abc123def456.wav
```

## Testing

### Manual Testing with curl

1. **Health Check:**
```bash
curl http://localhost:8000/api/tts/health
```

2. **List Voices:**
```bash
curl http://localhost:8000/api/tts/voices
```

3. **Generate Audio:**
```bash
curl -X POST http://localhost:8000/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "mystery_id": "test_001",
    "text": "This is a test of the text to speech system.",
    "voice_id": "bm_fable"
  }'
```

4. **Download Audio:**
```bash
# Use audio_url from previous response
curl http://localhost:8000/static/audio/abc123def456.wav -o test.wav
```

### Testing Cache Behavior

```bash
# First request (cache miss)
curl -X POST http://localhost:8000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"mystery_id": "test", "text": "Hello world", "voice_id": "bm_fable"}'
# Response: {"audio_url": "...", "cached": false}

# Second request (cache hit)
curl -X POST http://localhost:8000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"mystery_id": "test", "text": "Hello world", "voice_id": "bm_fable"}'
# Response: {"audio_url": "...", "cached": true}
```

## Troubleshooting

### Issue: Model fails to load

**Error:** `TTSModelNotReadyError`

**Solution:**
1. Check if `kokoro` is installed: `pip show kokoro`
2. Try manual warmup: `POST /api/tts/warmup`
3. Check logs for detailed error messages

### Issue: Audio files not served

**Error:** 404 when accessing `/static/audio/...`

**Solution:**
1. Verify `audio_cache/` directory exists
2. Check file permissions
3. Ensure `TTS_CACHE_DIR` matches mount point

### Issue: Text too long error

**Error:** `TextTooLongError`

**Solution:**
- Default limit is 5000 characters
- Increase `TTS_MAX_TEXT_LENGTH` in `.env`
- Split text into multiple requests

## File Structure

```
api/
├── src/
│   ├── config.py              # TTS settings added
│   ├── exceptions.py          # TTS exceptions added
│   ├── main.py               # Static files + lifecycle
│   ├── routers/
│   │   └── tts.py            # TTS endpoints
│   ├── services/
│   │   ├── tts_model.py      # Model manager (NEW)
│   │   └── tts_service.py    # TTS business logic
│   └── schemas/
│       └── tts.py            # Request/response models
├── audio_cache/              # Generated audio files (git-ignored)
├── .env.example              # TTS config examples
└── pyproject.toml            # Dependencies added
```

## Integration Example

### Frontend Integration (React/Next.js)

```typescript
// Generate and play TTS audio
async function playMysteryNarration(mysteryId: string, text: string) {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mystery_id: mysteryId,
      text: text,
      voice_id: 'bm_fable'
    })
  });

  const { audio_url, cached } = await response.json();

  const audio = new Audio(audio_url);
  await audio.play();

  console.log(cached ? 'Playing from cache' : 'Newly generated');
}
```

## Future Enhancements

1. **Cache Management**: Add endpoint to clear old cache files
2. **Batch Generation**: Support multiple texts in one request
3. **Voice Samples**: Provide sample audio for each voice
4. **Progress Updates**: WebSocket for long text generation
5. **Format Options**: Support MP3/OGG in addition to WAV

## References

- [Kokoro TTS Documentation](https://github.com/hexgrad/kokoro)
- [FastAPI Static Files](https://fastapi.tiangolo.com/tutorial/static-files/)
- [Neo4j Mystery Schema](/api/docs) (Swagger UI)
