from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Support both SQLite and PostgreSQL via DATABASE_URL env var
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all database tables."""
    # Import models so Base knows about them
    from app.models import (  # noqa: F401
        cryptocurrency,
        price_history,
        scrape_log,
        price_alert,
        watchlist,
        portfolio_holding,
        user,
    )
    Base.metadata.create_all(bind=engine)
