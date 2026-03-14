"""
config.py — Load all environment variables via pydantic-settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # Blockchain
    rpc_url:            str = "http://127.0.0.1:8545"     # Local Hardhat node
    contract_address:   str = ""
    private_key:        str = ""
    admin_address:      str = ""

    # Paths
    tesseract_cmd:      str = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache()
def get_settings() -> Settings:
    return Settings()
