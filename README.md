# LTL TV — Site officiel

Site web de la chaîne **LTL TV** (ltltv.com).

- **Frontend :** Next.js 14 (App Router) + Tailwind CSS
- **Backend :** Django 5 + Django REST Framework + JWT (SimpleJWT)
- **Base de données :** PostgreSQL 16
- **Cache / broker :** Redis 7 (utilisé aussi par Celery)
- **Reverse proxy :** Nginx
- **Média :** Cloudinary (fallback filesystem local)
- **CI / CD :** GitHub Actions → déploiement SSH sur VPS Hostinger (Ubuntu 22.04)

---

## Arborescence

```
ltltv/
├── frontend/            # Next.js 14 (App Router)
│   ├── app/             # Routes (layout, page…)
│   ├── components/      # Composants React (Navbar, Footer…)
│   ├── styles/          # CSS global + Tailwind
│   └── public/
├── backend/             # Django 5 + DRF
│   ├── apps/
│   │   ├── accounts/    # User custom, JWT, register, /me
│   │   ├── programmes/  # Grille de programmes TV
│   │   ├── temoignages/ # Témoignages modérés
│   │   ├── articles/    # Blog / actualités + catégories
│   │   └── contacts/    # Formulaire de contact
│   ├── config/          # settings.py, urls.py, wsgi, asgi, celery
│   └── requirements.txt
├── nginx/nginx.conf     # Reverse proxy → frontend:3000, backend:8000
├── docker-compose.yml   # db, redis, backend, frontend, nginx
├── .env.example         # Variables d'environnement de référence
└── .github/workflows/deploy.yml
```

---

## 1. Démarrage rapide en local (Docker)

Prérequis : **Docker Desktop** ou **Docker Engine + Compose plugin**.

```bash
# 1. Cloner
git clone https://github.com/<votre-org>/ltltv.git
cd ltltv

# 2. Copier les .env
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Générer une SECRET_KEY Django et l'écrire dans backend/.env
docker run --rm python:3.12-slim python -c \
  "import secrets; print(secrets.token_urlsafe(50))"

# 4. Démarrer la stack
docker compose up --build

# 5. Créer un super-utilisateur (dans un autre terminal)
docker compose exec backend python manage.py createsuperuser
```

- Frontend Next.js : http://localhost (via nginx) ou http://localhost:3000 (direct via `npm run dev`)
- API Django : http://localhost/api/v1/
- Admin Django : http://localhost/admin/

### Lancer sans Docker (mode dev pur)

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Linux/Mac
# .venv\Scripts\activate                                # Windows PowerShell
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 2. Endpoints API principaux

Base : `/api/v1/`

| Méthode | Endpoint                       | Description                       |
|---------|--------------------------------|-----------------------------------|
| POST    | `/auth/token/`                 | Obtenir un access + refresh JWT   |
| POST    | `/auth/token/refresh/`         | Rafraîchir un access token        |
| POST    | `/accounts/register/`          | Créer un compte                   |
| GET/PUT | `/accounts/me/`                | Profil de l'utilisateur courant   |
| GET     | `/programmes/`                 | Lister les programmes publiés     |
| GET     | `/programmes/<slug>/`          | Détail d'un programme             |
| GET     | `/temoignages/`                | Témoignages approuvés             |
| POST    | `/temoignages/`                | Soumettre un témoignage           |
| GET     | `/articles/`                   | Articles publiés                  |
| GET     | `/articles/<slug>/`            | Détail d'un article               |
| GET     | `/articles/categories/`        | Catégories                        |
| POST    | `/contacts/`                   | Envoyer un message de contact     |

---

## 3. Déploiement en production (VPS Hostinger Ubuntu 22.04)

### 3.1 Préparation du serveur (une seule fois)

```bash
# Depuis votre poste, en SSH root@<ip-vps>
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg git ufw

# Docker + Compose plugin
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) \
  signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu jammy stable" \
  > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Pare-feu
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### 3.2 Récupérer le code et configurer

```bash
mkdir -p /opt/ltltv && cd /opt/ltltv
git clone https://github.com/<votre-org>/ltltv.git .
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Éditer les 3 fichiers .env avec des valeurs de production
docker compose up -d --build
docker compose exec backend python manage.py migrate --noinput
docker compose exec backend python manage.py collectstatic --noinput
docker compose exec backend python manage.py createsuperuser
```

### 3.3 SSL avec Let's Encrypt (à activer une fois le DNS pointé)

> Non inclus dans la configuration par défaut, à ajouter dès que le domaine
> ltltv.com pointe vers l'IP du VPS.

```bash
apt install -y certbot python3-certbot-nginx
# Arrêter temporairement nginx conteneurisé, ou utiliser --webroot / certbot
# dans un service dédié.
certbot certonly --standalone -d ltltv.com -d www.ltltv.com
# Puis monter /etc/letsencrypt dans le conteneur nginx et ajouter un bloc
# `server { listen 443 ssl; ... }` dans nginx/nginx.conf.
```

### 3.4 Déploiement automatique via GitHub Actions

Le workflow `.github/workflows/deploy.yml` :

1. teste le backend Django (Postgres + Redis fournis en services)
2. lint et build le frontend Next.js
3. sur `main`, se connecte en SSH au VPS et exécute :
   `git pull` → `docker compose build` → `up -d` → `migrate` → `collectstatic`

Secrets GitHub à définir dans **Settings → Secrets and variables → Actions** :

| Secret        | Description                                       |
|---------------|---------------------------------------------------|
| `VPS_HOST`    | IP ou hostname du VPS                             |
| `VPS_USER`    | Utilisateur SSH (`root` ou compte dédié)          |
| `VPS_SSH_KEY` | Clé privée SSH (format OpenSSH)                   |
| `VPS_PORT`    | Port SSH (optionnel, défaut 22)                   |

---

## 4. Variables d'environnement

Trois fichiers `.env` sont utilisés :

- `./.env` — passé à `docker compose` (base de données, hôtes…)
- `./backend/.env` — chargé par Django via `python-decouple`
- `./frontend/.env` — chargé par Next.js (`NEXT_PUBLIC_*` exposé au client)

Voir `.env.example` (racine, backend, frontend) pour la liste complète.

Variables sensibles à ne **jamais** committer : `SECRET_KEY`, `POSTGRES_PASSWORD`,
`CLOUDINARY_URL`, `VPS_SSH_KEY`.

---

## 5. Commandes utiles

```bash
# Logs en direct
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx

# Shell Django
docker compose exec backend python manage.py shell

# Migrations
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate

# Rebuild propre
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 6. Licence

© LTL TV. Tous droits réservés.
