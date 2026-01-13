from typing import Tuple

async def generate_tts_audio(
    mysetery_id: str,
    text: str,
    voice_id: str = "default"
) -> Tuple[str, bool]:
    """_summary_
    Returns audio_url from the text given, it will check if cached exists first

    Args:
        mysetery_id (str): mysetery id from neo4j graph database
        text (str): text that wish to convert to audio
        voice_id (str, optional): Voice ID (personna) that user wishes to generate. Defaults to "default".

    Returns:
        Tuple[str, bool]: Returns the voice mp3 URL
    """