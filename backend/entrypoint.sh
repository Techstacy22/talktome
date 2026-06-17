#!/bin/sh
set -e

echo "=== Environment check ==="
echo "DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo YES || echo NO)"
echo "SECRET_KEY set: $([ -n "$SECRET_KEY" ] && echo YES || echo NO)"
echo "PORT: ${PORT:-not set}"
echo "========================="

echo "Running database migrations..."
alembic upgrade head

echo "Starting server..."
exec gunicorn app.main:app \
  --workers "${WORKERS:-2}" \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind "0.0.0.0:${PORT:-8000}" \
  --timeout 120 \
  --keep-alive 5 \
  --access-logfile - \
  --error-logfile -
