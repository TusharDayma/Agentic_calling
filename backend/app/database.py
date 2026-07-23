import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Determine if we're using SQLite or PostgreSQL
# Note: To use PostgreSQL instead of SQLite, update the DATABASE_URL in your .env file:
# DATABASE_URL="postgresql://user:password@localhost/dbname"
# Base.metadata.create_all() will safely create missing tables (like User) without dropping existing ones.
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

connect_args = {}
if is_sqlite:
    connect_args["check_same_thread"] = False

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args
)

# Sesion factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Declarative base
Base = declarative_base()

# Dependency to check database session lifecycle
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
