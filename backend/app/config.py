from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    openai_api_key: str = ""
    openai_model: str = "llama-3.3-70b-versatile"
    ai_base_url: str = "https://api.groq.com/openai/v1"
    cors_origins: list[str] = ["http://localhost:5173"]
    environment: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
