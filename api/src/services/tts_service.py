"""
TTS service layer for audio generation using Kokoro-82M model.

This service handles text-to-speech audio generation with caching support.
"""
import asyncio
import hashlib
import logging
from pathlib import Path
from typing import Optional

import numpy as np
import soundfile as sf

from ..config import settings
from ..schemas.tts import TTSResponse
from ..exceptions import TTSGenerationError, TextTooLongError
from .tts_model import get_tts_pipeline

logger = logging.getLogger(__name__)


def _generate_cache_key(text: str, voice_id: str) -> str:
    """
    Generate a unique cache key for the given text and voice.

    Args:
        text: The text to convert to speech
        voice_id: The voice ID to use

    Returns:
        SHA256 hash as hex string
    """
    cache_string = f"{text}:{voice_id}"
    return hashlib.sha256(cache_string.encode('utf-8')).hexdigest()


async def _check_cache(cache_key: str) -> Optional[Path]:
    """
    Check if audio file exists in cache.

    Args:
        cache_key: The cache key to look up

    Returns:
        Path to cached file if exists, None otherwise
    """
    cache_dir = Path(settings.tts_cache_dir)
    cache_file = cache_dir / f"{cache_key}.wav"

    if cache_file.exists():
        logger.info(f"Cache hit for key: {cache_key}")
        return cache_file

    logger.info(f"Cache miss for key: {cache_key}")
    return None


async def _generate_audio_sync(text: str, voice_id: str, cache_path: Path):
    """
    Generate audio using Kokoro pipeline (CPU-bound operation).

    This function runs in a thread pool executor to avoid blocking
    the async event loop during audio generation.

    Args:
        text: The text to convert to speech
        voice_id: The voice ID to use
        cache_path: Path where to save the generated audio

    Raises:
        TTSGenerationError: If audio generation fails
    """
    try:
        pipeline = await get_tts_pipeline()

        logger.info(f"Generating audio for text (length: {len(text)}) with voice: {voice_id}")

        # Run generation in executor to avoid blocking
        loop = asyncio.get_event_loop()

        def generate():
            try:
                # Generate audio chunks
                generator = pipeline(text, voice=voice_id)
                audio_chunks = []

                for gs, ps, audio in generator:
                    audio_chunks.append(audio)

                if not audio_chunks:
                    raise TTSGenerationError(
                        message="No audio chunks generated",
                        details={"text_length": len(text), "voice_id": voice_id}
                    )

                # Combine all audio chunks
                combined_audio = np.concatenate(audio_chunks)

                # Save to file
                sf.write(
                    str(cache_path),
                    combined_audio,
                    settings.tts_sample_rate
                )

                logger.info(f"Audio generated and saved to: {cache_path}")

            except Exception as e:
                logger.error(f"Failed to generate audio: {e}")
                raise TTSGenerationError(
                    message=f"Audio generation failed: {str(e)}",
                    details={
                        "error_type": type(e).__name__,
                        "text_length": len(text),
                        "voice_id": voice_id
                    }
                )

        await loop.run_in_executor(None, generate)

    except TTSGenerationError:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in audio generation: {e}")
        raise TTSGenerationError(
            message=f"Unexpected error during audio generation: {str(e)}",
            details={"error_type": type(e).__name__}
        )


async def generate_tts_audio(
    mystery_id: str,
    text: str,
    voice_id: str = "default"
) -> TTSResponse:
    """
    Generate TTS audio from text with caching support.

    This function implements a cache-first strategy:
    1. Generate cache key from text and voice_id
    2. Check if audio file exists in cache
    3. If cache hit: return URL with cached=True
    4. If cache miss: generate audio, save to cache, return URL with cached=False

    Args:
        mystery_id: Mystery ID from neo4j graph database (for logging/tracking)
        text: Text to convert to audio
        voice_id: Voice ID (persona) to use for generation. Defaults to "default".

    Returns:
        TTSResponse with audio_url and cached flag

    Raises:
        TextTooLongError: If text exceeds maximum allowed length
        TTSGenerationError: If audio generation fails
    """
    # Validate text length
    if len(text) > settings.tts_max_text_length:
        logger.warning(f"Text too long: {len(text)} > {settings.tts_max_text_length}")
        raise TextTooLongError(
            text_length=len(text),
            max_length=settings.tts_max_text_length
        )

    # Use default voice if not specified or set to "default"
    if not voice_id or voice_id == "default":
        voice_id = settings.tts_default_voice

    logger.info(f"TTS request for mystery_id={mystery_id}, voice={voice_id}, text_length={len(text)}")

    # Generate cache key
    cache_key = _generate_cache_key(text, voice_id)

    # Ensure cache directory exists
    cache_dir = Path(settings.tts_cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)

    # Check cache first
    cached_file = await _check_cache(cache_key)

    if cached_file:
        # Cache hit - return existing file
        audio_url = f"{settings.static_audio_url_prefix}/{cached_file.name}"
        return TTSResponse(audio_url=audio_url, cached=True)

    # Cache miss - generate new audio
    cache_path = cache_dir / f"{cache_key}.wav"

    try:
        await _generate_audio_sync(text, voice_id, cache_path)

        audio_url = f"{settings.static_audio_url_prefix}/{cache_path.name}"
        return TTSResponse(audio_url=audio_url, cached=False)

    except Exception as e:
        # Clean up partial file if it exists
        if cache_path.exists():
            try:
                cache_path.unlink()
                logger.info(f"Cleaned up partial cache file: {cache_path}")
            except Exception as cleanup_error:
                logger.error(f"Failed to clean up partial file: {cleanup_error}")

        # Re-raise the original exception
        raise