from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from .config import settings
from .database import init_db
from .routes import auth, boards, steps, dashboard, users

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    init_db()
    # Create upload directory if it doesn't exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield
    # Shutdown
    print("Shutting down...")

# Create FastAPI app
app = FastAPI(
    title="PCB Manufacturing Tracker API",
    description="API for tracking PCB boards through manufacturing process",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploaded images
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(boards.router)
app.include_router(steps.router)
app.include_router(dashboard.router)
app.include_router(users.router)  # <-- ADDED THIS LINE

@app.get("/")
async def root():
    return {
        "message": "PCB Manufacturing Tracker API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}