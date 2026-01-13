"""
Endpoints for Text-To-Speech (TTS) service using Kokoro-82M model.

This module provides endpoints for:
- TTS audio generation with caching
- Model health checks
- Model warmup
- Available voices listing
"""
from fastapi import APIRouter
from typing import List, Dict, Any
from ..schemas.tts import TTSRequest, TTSResponse
from ..services.tts_service import generate_tts_audio
from ..services.tts_model import warmup_tts_model, is_tts_model_ready
from ..config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/tts",
    tags=["text-to-speech"]
)


@router.post(
    "",
    response_model=TTSResponse,
    summary="Generate TTS audio",
    description="Convert text to speech using Kokoro-82M model with caching support",
    responses={
        200: {
            "description": "Audio generated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "audio_url": "/static/audio/abc123def456.wav",
                        "cached": False
                    }
                }
            }
        },
        400: {
            "description": "Bad request - text too long or invalid parameters"
        },
        500: {
            "description": "Audio generation failed"
        },
        503: {
            "description": "TTS model not ready"
        }
    }
)
async def create_tts(request: TTSRequest) -> TTSResponse:
    """
    Generate TTS audio from text.

    This endpoint converts text to speech using the Kokoro-82M model.
    Generated audio is cached based on text content and voice ID.

    Args:
        request: TTS request containing mystery_id, text, and optional voice_id

    Returns:
        TTSResponse with audio URL and cache status
    """
    return await generate_tts_audio(
        mystery_id=request.mystery_id,
        text=request.text,
        voice_id=request.voice_id
    )


@router.get(
    "/health",
    summary="Check TTS service health",
    description="Check if TTS model is loaded and ready to generate audio",
    responses={
        200: {
            "description": "TTS service health status",
            "content": {
                "application/json": {
                    "example": {
                        "status": "ready",
                        "model_loaded": True,
                        "lazy_load": True
                    }
                }
            }
        }
    }
)
async def health_check() -> Dict[str, Any]:
    """
    Check TTS service health.

    Returns:
        Health status including model readiness and configuration
    """
    model_loaded = is_tts_model_ready()

    return {
        "status": "ready" if model_loaded else "not_loaded",
        "model_loaded": model_loaded,
        "lazy_load": settings.tts_lazy_load,
        "default_voice": settings.tts_default_voice,
        "sample_rate": settings.tts_sample_rate,
        "max_text_length": settings.tts_max_text_length
    }


@router.post(
    "/warmup",
    summary="Warmup TTS model",
    description="Preload the TTS model to reduce latency on first request",
    responses={
        200: {
            "description": "Model warmed up successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "warmed_up",
                        "message": "TTS model loaded successfully"
                    }
                }
            }
        },
        500: {
            "description": "Model warmup failed"
        }
    }
)
async def warmup() -> Dict[str, str]:
    """
    Warmup the TTS model.

    This endpoint preloads the Kokoro TTS model into memory,
    reducing latency for the first audio generation request.
    """
    logger.info("TTS warmup endpoint called")
    await warmup_tts_model()

    return {
        "status": "warmed_up",
        "message": "TTS model loaded successfully"
    }


@router.get(
    "/voices",
    summary="List available voices",
    description="Get list of available voice IDs for TTS generation",
    responses={
        200: {
            "description": "List of available voices",
            "content": {
                "application/json": {
                    "example": {
                        "voices": [
                            {
                                "id": "af",
                                "name": "American Female",
                                "language": "English",
                                "gender": "female"
                            },
                            {
                                "id": "am",
                                "name": "American Male",
                                "language": "English",
                                "gender": "male"
                            }
                        ],
                        "default_voice": "bm_fable"
                    }
                }
            }
        }
    }
)
async def list_voices() -> Dict[str, Any]:
    """
    List available Kokoro voices.

    Returns:
        List of available voice configurations
    """
    # Kokoro-82M available voices
    # Based on Kokoro documentation for British English (lang_code='b')
    voices = [
        {
            "id": "af",
            "name": "American Female",
            "language": "English (American)",
            "gender": "female"
        },
        {
            "id": "af_bella",
            "name": "Bella (American Female)",
            "language": "English (American)",
            "gender": "female"
        },
        {
            "id": "af_nicole",
            "name": "Nicole (American Female)",
            "language": "English (American)",
            "gender": "female"
        },
        {
            "id": "af_sarah",
            "name": "Sarah (American Female)",
            "language": "English (American)",
            "gender": "female"
        },
        {
            "id": "af_sky",
            "name": "Sky (American Female)",
            "language": "English (American)",
            "gender": "female"
        },
        {
            "id": "am",
            "name": "American Male",
            "language": "English (American)",
            "gender": "male"
        },
        {
            "id": "am_adam",
            "name": "Adam (American Male)",
            "language": "English (American)",
            "gender": "male"
        },
        {
            "id": "am_michael",
            "name": "Michael (American Male)",
            "language": "English (American)",
            "gender": "male"
        },
        {
            "id": "bf",
            "name": "British Female",
            "language": "English (British)",
            "gender": "female"
        },
        {
            "id": "bf_emma",
            "name": "Emma (British Female)",
            "language": "English (British)",
            "gender": "female"
        },
        {
            "id": "bf_isabella",
            "name": "Isabella (British Female)",
            "language": "English (British)",
            "gender": "female"
        },
        {
            "id": "bm",
            "name": "British Male",
            "language": "English (British)",
            "gender": "male"
        },
        {
            "id": "bm_fable",
            "name": "Fable (British Male)",
            "language": "English (British)",
            "gender": "male",
            "description": "Default narrator voice - suitable for storytelling"
        },
        {
            "id": "bm_george",
            "name": "George (British Male)",
            "language": "English (British)",
            "gender": "male"
        },
        {
            "id": "bm_lewis",
            "name": "Lewis (British Male)",
            "language": "English (British)",
            "gender": "male"
        }
    ]

    return {
        "voices": voices,
        "default_voice": settings.tts_default_voice,
        "total_count": len(voices)
    }