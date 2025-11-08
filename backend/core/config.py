"""
Application configuration using Pydantic Settings.
"""
from typing import List, Optional, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Nova"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "AI-Powered Educational Content Platform with Professor Framework Integration"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database
    DATABASE_URL: str = "sqlite:///./content.db"  # Default to SQLite for development
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10

    # Security
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_USE_OPENSSL_RAND_HEX_32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Paths
    KNOWLEDGE_BASE_PATH: str = "../reference/hmh-knowledge"
    CURRICULUM_CONFIG_PATH: str = "../config/curriculum"
    CONTENT_PATH: str = "../"

    # Search Configuration
    SEARCH_INDEX_PATH: str = "./search_index"
    SEARCH_MAX_RESULTS: int = 50

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_ENABLED: bool = True

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    # Admin
    FIRST_SUPERUSER_EMAIL: str = "admin@nova.ai"
    FIRST_SUPERUSER_PASSWORD: str = "changeme"

    # Professor Framework Integration
    PROFESSOR_ENABLED: bool = False
    PROFESSOR_API_URL: Optional[str] = None
    PROFESSOR_API_KEY: Optional[str] = None

    # Claude AI API Integration
    ANTHROPIC_API_KEY: Optional[str] = None

    # Git Integration
    GIT_ENABLED: bool = True
    GIT_AUTO_COMMIT: bool = False
    GIT_COMMIT_USER_NAME: str = "Nova"
    GIT_COMMIT_USER_EMAIL: str = "system@nova.ai"

    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_FILE_EXTENSIONS: List[str] = [
        ".md", ".json", ".pdf", ".docx",
        ".png", ".jpg", ".jpeg", ".svg"
    ]

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
