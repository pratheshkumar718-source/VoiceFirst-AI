import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "VoiceFirst AI"
    VERSION: str = "1.0.0"
    
    # Gemini API Settings
    GEMINI_API_KEY: str = ""
    GEMINI_LIVE_MODEL: str = "models/gemini-3.5-flash"
    GEMINI_VISION_MODEL: str = "gemini-3.5-flash"
    GEMINI_EXTRACTION_MODEL: str = "gemini-3.5-flash"
    
    # Supabase Settings
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_DOCUMENTS_BUCKET: str = "documents"
    SUPABASE_PDFS_BUCKET: str = "generated-pdfs"
    
    # Storage Dirs
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    TEMPLATE_DIR: Path = BASE_DIR / "app" / "templates"
    OUTPUT_DIR: Path = BASE_DIR / "generated_pdfs"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:10000",
        "*"
    ]

    class Config:
        env_file = (str(BASE_DIR / ".env"), str(BASE_DIR.parent / ".env"), ".env")
        extra = "ignore"

settings = Settings()

# Ensure runtime directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.TEMPLATE_DIR.mkdir(parents=True, exist_ok=True)
settings.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

