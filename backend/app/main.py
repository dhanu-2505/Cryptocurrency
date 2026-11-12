"""
CryptoTrack FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db, SessionLocal
from app.services.seed_data import seed_initial_data_if_empty
from app.routes import (
    coins,
    scrape,
    export,
    intelligence,
    alerts,
    watchlist,
    portfolio,
    replay,
    system,
    auth,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle handler."""
    logger.info("CryptoTrack API starting up...")
    init_db()
    # Seed initial data if database is fresh
    db = SessionLocal()
    try:
        seed_initial_data_if_empty(db)
    finally:
        db.close()
    logger.info("Database initialized successfully")
    yield
    logger.info("CryptoTrack API shutting down...")


app = FastAPI(
    title="CryptoTrack API",
    description="Real-time cryptocurrency price tracking API powered by Selenium",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(coins.router)
app.include_router(scrape.router)
app.include_router(export.router)
app.include_router(intelligence.router)
app.include_router(alerts.router)
app.include_router(watchlist.router)
app.include_router(portfolio.router)
app.include_router(replay.router)
app.include_router(system.router)
app.include_router(auth.router)


@app.get("/")
def root():
    return {
        "message": "CryptoTrack API is running",
        "docs": "/docs",
        "health": "/api/health",
    }
