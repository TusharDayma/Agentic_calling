"""
Centralized Configuration Proxy.
Re-exports settings and Settings class from app.configuration.
"""
from app.configuration import settings, Settings

__all__ = ["settings", "Settings"]
