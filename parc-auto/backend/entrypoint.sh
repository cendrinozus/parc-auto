#!/bin/sh
set -e

export FLASK_APP=run

echo "Applying database migrations..."
flask db upgrade

echo "Seeding database..."
flask seed 2>/dev/null || echo "Seed already done or skipped."

echo "Starting gunicorn..."
exec gunicorn --bind 0.0.0.0:5000 --workers 4 run:app
