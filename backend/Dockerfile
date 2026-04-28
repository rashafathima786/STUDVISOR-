# ──────────────────────────────────────────────────────────────────────────────
# Studvisor — Backend Dockerfile (Multi-stage Production Build)
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtualenv
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage 2: Production Runner ────────────────────────────────────────────────
FROM python:3.11-slim AS runner

WORKDIR /app

# Install runtime dependencies (libpq for psycopg2)
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtualenv from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy source code
COPY . .

# Environment variables
ENV PYTHONPATH=/app
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Security: Run as non-root user
RUN adduser --disabled-password --gecos "" studvisor_user
RUN chown -R studvisor_user:studvisor_user /app
USER studvisor_user

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
