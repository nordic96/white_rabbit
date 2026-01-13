from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    origin_url: str = "http://localhost:3000"
    neo4j_uri: str = "neo4j://localhost:7687"
    neo4j_username: str = "neo4j"
    neo4j_password: str  # No default - must be set explicitly
    neo4j_database: str = "neo4j"
    debug: bool = False

    # TTS Configuration
    tts_lang_code: str = "b"  # British English for bm_fable
    tts_default_voice: str = "bm_fable"
    tts_cache_dir: str = "./audio_cache"
    tts_sample_rate: int = 24000
    tts_max_text_length: int = 5000
    tts_lazy_load: bool = True
    static_audio_url_prefix: str = "/static/audio"

    model_config = SettingsConfigDict(
        env_file=[".env.local", ".env"],
        env_file_encoding="utf-8"
    )

settings = Settings()
