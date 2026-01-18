from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    origin_url: str = "http://localhost:3000"
    neo4j_uri: str = "neo4j://localhost:7687"
    neo4j_username: str = "neo4j"
    neo4j_password: str  # No default - must be set explicitly
    neo4j_database: str = "neo4j"
    debug: bool = False

    # API Keys
    api_key: str = ""
    api_key_required: bool = False

    # TTS Configuration
    tts_enabled: bool = True  # Set to False in production to disable TTS generation
    tts_lang_code: str = "b"  # British English for bm_fable
    tts_default_voice: str = "bm_fable"
    tts_cache_dir: str = "./audio_cache"
    tts_sample_rate: int = 24000
    tts_max_text_length: int = 5000
    tts_lazy_load: bool = True
    static_audio_url_prefix: str = "/static/audio"
    tts_cache_ttl_hours: int = 168  # 7 days
    tts_cache_max_size_mb: int = 1024  # 1GB max cache size
    tts_max_workers: int = 4  # Max concurrent TTS generation threads

    # Audio CDN Configuration (for production with pre-generated audio)
    audio_base_url: str = "/static/audio"  # Override with GitHub Pages URL in production

    # Rate Limiting Configuration
    rate_limit_tts: str = "10/minute"
    rate_limit_search: str = "60/minute"
    rate_limit_default: str = "100/minute"

    model_config = SettingsConfigDict(
        env_file=[".env.local", ".env"],
        env_file_encoding="utf-8"
    )

    def model_post_init(self, __context) -> None:
        """Validate configuration after initialization."""
        # Security validation: Ensure API key is not empty when required
        if self.api_key_required and not self.api_key:
            raise ValueError(
                "API_KEY_REQUIRED is set to True, but API_KEY is empty or not set. "
                "Either set a valid API_KEY or disable API_KEY_REQUIRED."
            )

settings = Settings()
