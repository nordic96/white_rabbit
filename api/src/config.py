from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    origin_url: str = "http://localhost:3000"
    neo4j_uri: str = "neo4j://localhost:7687"
    neo4j_username: str = "neo4j"
    neo4j_password: str  # No default - must be set explicitly
    neo4j_database: str = "neo4j"

    model_config = SettingsConfigDict(
        env_file=[".env.local", ".env"],
        env_file_encoding="utf-8"
    )

settings = Settings()
