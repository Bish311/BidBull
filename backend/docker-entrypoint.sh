#!/bin/sh
set -e

echo "Applying database schema migrations..."
alembic upgrade head

exec "$@"
