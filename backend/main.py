"""
UniFit FastAPI Application.

Serves the Python Inclusive Adaptive Fitness Engine over REST API
for the React Native Expo frontend.
"""

from __future__ import annotations

import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.routes.health import router as health_router
from backend.routes.profile import router as profile_router
from backend.routes.fitness import router as fitness_router
from backend.routes.workout import router as workout_router
from backend.routes.nutrition import router as nutrition_router
from backend.routes.meals import router as meals_router
from backend.routes.completion import router as completion_router
from backend.routes.progress import router as progress_router, session_router

# Initialize FastAPI application
app = FastAPI(
    title="UniFit Fitness Engine API",
    description="Adaptive, accessible fitness, nutrition, and portion-scaled meal planning API.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for local development and Expo Web
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env:
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
else:
    allowed_origins = [
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
        "http://127.0.0.1:8081",
        "http://localhost:8082",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Centralized error handlers ensuring structured errors without stack trace leaks
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        errors.append(f"{loc}: {err.get('msg')}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error_type": "validation_error",
            "message": "Invalid request payload parameters.",
            "details": errors,
        },
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error_type": "engine_error",
            "message": str(exc),
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error_type": "server_error",
            "message": "An internal server error occurred while processing the fitness request.",
        },
    )


# Mount versioned API routes under /api/v1
API_PREFIX = "/api/v1"
app.include_router(health_router, prefix=API_PREFIX)
app.include_router(profile_router, prefix=API_PREFIX)
app.include_router(fitness_router, prefix=API_PREFIX)
app.include_router(workout_router, prefix=API_PREFIX)
app.include_router(nutrition_router, prefix=API_PREFIX)
app.include_router(meals_router, prefix=API_PREFIX)
app.include_router(completion_router, prefix=API_PREFIX)
app.include_router(progress_router, prefix=API_PREFIX)
app.include_router(session_router, prefix=API_PREFIX)


@app.get("/")
def root():
    return {
        "message": "UniFit Fitness Engine API is running.",
        "documentation": "/docs",
        "api_v1": "/api/v1",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
