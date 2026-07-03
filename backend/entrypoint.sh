#!/bin/sh
set -e

# First boot: auto-generate the initial migrations for our local apps
# (safe / idempotent — does nothing when migrations already exist).
python manage.py makemigrations accounts programmes temoignages articles contacts --noinput

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec "$@"
