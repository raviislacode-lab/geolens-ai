from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    vision_model: str = "google/gemini-2.5-flash"
    fallback_model: str = "openai/gpt-4o-mini"
    confidence_threshold: float = 0.55


settings = Settings()
