from pydantic import BaseModel, Field
from typing import Optional

class TTSRequest(BaseModel):
    """TTS Request for Text-to-Speech Request"""
    mystery_id: str = Field(..., example="m-dsaeqwew112-1231231-aa1")
    text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        example="Plato spoke of a lost island...",
        description="Text to convert to speech (max 5000 characters)"
    )
    voice_id: Optional[str] = Field(
        default="default",
        description="Optional voice preset or speaker ID"
    )


class TTSResponse(BaseModel):
    """TTS Response for Text-to-Speech"""
    audio_url: str = Field(..., example="/static/audio/atlantis_ab123cd.wav")
    cached: bool = Field(
        ..., description="Whether the audio was reused from cache"
    )