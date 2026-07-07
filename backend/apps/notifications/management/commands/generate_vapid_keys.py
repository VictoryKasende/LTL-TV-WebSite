"""Generate a VAPID key pair for Web Push.

Usage::

    docker compose exec backend python manage.py generate_vapid_keys

Output: paste the three lines into ``backend/.env`` and restart the
backend + celery containers.
"""
import base64

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Generate a fresh VAPID key pair (ECDSA P-256).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email', default='contact@ltltv.com',
            help='Contact email used in VAPID JWT claims.',
        )

    def handle(self, *args, **opts):
        # ECDSA P-256 key pair
        private_key = ec.generate_private_key(ec.SECP256R1())

        # Private key → PEM (single-line, base64 body) for env storage
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode('ascii').strip()

        # Public key → uncompressed X9.62, then base64url without padding
        # (this is the format the browser's applicationServerKey expects)
        public_raw = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint,
        )
        public_b64 = base64.urlsafe_b64encode(public_raw).rstrip(b'=').decode('ascii')

        self.stdout.write(self.style.SUCCESS('\n=== Clés VAPID générées ===\n'))
        self.stdout.write('# Copie ces 3 lignes dans backend/.env sur le VPS :\n')
        # Encode private PEM as base64 too so it fits on one env line
        private_b64 = base64.b64encode(private_pem.encode()).decode()
        self.stdout.write(f'VAPID_PRIVATE_KEY={private_b64}')
        self.stdout.write(f'VAPID_PUBLIC_KEY={public_b64}')
        self.stdout.write(f'VAPID_EMAIL={opts["email"]}\n')
        self.stdout.write(self.style.WARNING(
            '\n⚠  Ces clés sont sensibles. Ne les commite pas dans Git.\n'
        ))
