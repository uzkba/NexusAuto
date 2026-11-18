from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

    database_url: str
    jwt_secret: str = ""
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    frontend_origin: str = "http://localhost:5173"

    s3_endpoint_url: str = ""
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_bucket: str = ""

    resend_api_key: str = ""
    email_from: str = ""


settings = Settings()