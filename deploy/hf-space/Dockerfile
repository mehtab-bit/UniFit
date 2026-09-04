# UniFit Fitness Engine API — Hugging Face Spaces (Docker SDK)
#
# Deployment copies this directory together with backend/, engine/ and data/
# from the repo root into the Space, mirroring the repository layout so the
# engine's path patching (backend/services/engine_service.py) resolves
# data/workouts and data/processed relative to /app.

FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    VIJUL_ENGINE_PATH=/app

WORKDIR /app

COPY requirements.txt /app/requirements.txt
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir \
    -r /app/requirements.txt \
    -r /app/backend/requirements.txt

COPY backend /app/backend
COPY engine /app/engine
COPY data /app/data
COPY deploy/hf-space/README.md /app/README.md

EXPOSE 7860

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
