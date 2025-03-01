from pydantic import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Expense Tracker Backend"
    SUPABASE_URL: str
    SUPABASE_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()