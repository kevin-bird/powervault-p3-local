from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = "postgresql+asyncpg://pv3monitor:pv3monitor_dev_password@db:5432/pv3monitor"

    # MQTT
    mqtt_host: str = "mosquitto"
    mqtt_port: int = 1883

    # P3 Device
    p3_device_id: str = "PV001001DEV"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
