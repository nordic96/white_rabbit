"""
Endpoints for Text-To-Speech (TTS) service
"""
from fastapi import APIRouter, HTTPException
from ..schemas.tts import TTSRequest, TTSResponse
from ..services.tts_service import generate_tts_audio

router = APIRouter(
    prefix="/api/tts",
    tags=["text-to-speech"]
)

@router.post(
    "", 
    response_model=TTSResponse,
    responses={
        200: {"description": ""}
    }
)
async def create_tts(request: TTSRequest):
    return await generate_tts_audio(
            mystery_id=request.mystery_id,
            text=request.text,
            voice_id=request.voice_id
    )