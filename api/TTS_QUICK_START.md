# TTS Quick Start Guide

## Installation (5 minutes)

```bash
# 1. Navigate to API directory
cd /Users/gihunko/projects/white_rabbit/api

# 2. Install dependencies
pip install -e .

# 3. Start the server
uvicorn src.main:app --reload
```

## Basic Usage

### 1. Generate Speech
```bash
curl -X POST http://localhost:8000/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "mystery_id": "test_001",
    "text": "In the year 1912, the Titanic sank on its maiden voyage.",
    "voice_id": "bm_fable"
  }'
```

**Response:**
```json
{
  "audio_url": "/static/audio/a1b2c3d4e5f6.wav",
  "cached": false
}
```

### 2. Play the Audio
Open in browser:
```
http://localhost:8000/static/audio/a1b2c3d4e5f6.wav
```

Or download:
```bash
curl http://localhost:8000/static/audio/a1b2c3d4e5f6.wav -o mystery.wav
open mystery.wav
```

## Popular Voices

| Voice ID | Description | Use Case |
|----------|-------------|----------|
| `bm_fable` | British Male (Narrator) | **DEFAULT** - Best for mysteries |
| `bf_emma` | British Female | Alternative narrator |
| `am_adam` | American Male | American mysteries |
| `af_bella` | American Female | Soft narration |

## Common Commands

```bash
# List all available voices
curl http://localhost:8000/api/tts/voices

# Check service health
curl http://localhost:8000/api/tts/health

# Warmup model (optional, reduces first-request latency)
curl -X POST http://localhost:8000/api/tts/warmup

# View API documentation
open http://localhost:8000/docs
```

## Frontend Integration

### React/Next.js Example

```typescript
async function generateAndPlayAudio(text: string, mysteryId: string) {
  // Generate audio
  const response = await fetch('http://localhost:8000/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mystery_id: mysteryId,
      text: text,
      voice_id: 'bm_fable'
    })
  });

  const { audio_url, cached } = await response.json();

  // Play audio
  const audio = new Audio(`http://localhost:8000${audio_url}`);
  await audio.play();

  console.log(cached ? '🎵 Playing from cache' : '🎙️ Newly generated');
}
```

### Usage
```typescript
// Generate narration for a mystery
generateAndPlayAudio(
  "The Bermuda Triangle has claimed countless ships and aircraft...",
  "bermuda_triangle_001"
);
```

## Performance Tips

1. **First request is slow**: Model loads on first request (~3-5 seconds)
2. **Use warmup**: Call `/api/tts/warmup` after server starts
3. **Cache is automatic**: Identical text+voice will reuse cached audio
4. **Keep text under 5000 chars**: Longer text will be rejected

## Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
# Recommended settings for MacBook M1 Air
TTS_LANG_CODE=b                    # British English
TTS_DEFAULT_VOICE=bm_fable        # Best narrator voice
TTS_CACHE_DIR=./audio_cache       # Local cache
TTS_LAZY_LOAD=True                # Load on first request
TTS_MAX_TEXT_LENGTH=5000          # Max 5000 characters
```

## Troubleshooting

**Problem**: Model takes long to load
- **Solution**: Use `/api/tts/warmup` endpoint to preload

**Problem**: Audio file not found (404)
- **Solution**: Check `audio_cache/` directory exists

**Problem**: Text too long error
- **Solution**: Split text into smaller chunks (<5000 chars)

**Problem**: Slow generation
- **Solution**: First request is always slower. Subsequent requests use cache.

## Testing Different Voices

```bash
# British Male (Default)
curl -X POST http://localhost:8000/api/tts -H "Content-Type: application/json" \
  -d '{"mystery_id":"test","text":"The mystery deepens","voice_id":"bm_fable"}'

# British Female
curl -X POST http://localhost:8000/api/tts -H "Content-Type: application/json" \
  -d '{"mystery_id":"test","text":"The mystery deepens","voice_id":"bf_emma"}'

# American Male
curl -X POST http://localhost:8000/api/tts -H "Content-Type: application/json" \
  -d '{"mystery_id":"test","text":"The mystery deepens","voice_id":"am_adam"}'

# American Female
curl -X POST http://localhost:8000/api/tts -H "Content-Type: application/json" \
  -d '{"mystery_id":"test","text":"The mystery deepens","voice_id":"af_bella"}'
```

## Project Structure

```
api/
├── src/
│   ├── services/
│   │   ├── tts_model.py      # Model manager
│   │   └── tts_service.py    # Business logic
│   └── routers/
│       └── tts.py            # API endpoints
└── audio_cache/              # Generated audio files
    ├── a1b2c3d4e5f6.wav
    ├── f7e8d9c0b1a2.wav
    └── ...
```

## Next Steps

1. ✅ Test basic audio generation
2. ✅ Try different voices
3. ✅ Integrate with frontend
4. 📖 Read full documentation: `TTS_IMPLEMENTATION.md`

## Support

For detailed documentation, see:
- `TTS_IMPLEMENTATION.md` - Full implementation guide
- `IMPLEMENTATION_SUMMARY.md` - Changes summary
- `http://localhost:8000/docs` - API documentation (Swagger)

---

**Quick Links**:
- API: http://localhost:8000/api/tts
- Health: http://localhost:8000/api/tts/health
- Voices: http://localhost:8000/api/tts/voices
- Docs: http://localhost:8000/docs
