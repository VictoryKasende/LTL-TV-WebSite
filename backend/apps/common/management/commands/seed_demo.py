"""Seed the database with realistic demo content across every app so
the frontend has real data (text + images) to render against.

Idempotent — keyed by natural fields (slug/title) via ``get_or_create``.
Images are only downloaded and attached when the field is still empty,
so re-running the command is cheap and safe.

    python manage.py seed_demo
"""
from __future__ import annotations

import urllib.request
from datetime import time, timedelta

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.about.models import AboutPage, CoreValue, TeamMember
from apps.articles.models import Article
from apps.articles.models import Category as ArticleCategory
from apps.banners.models import Banner, BannerImage
from apps.emissions.models import Category as EmissionCategory
from apps.emissions.models import Episode, Series, Show
from apps.programmes.models import ProgramType, WeeklyProgram
from apps.temoignages.models import Testimonial

User = get_user_model()

YOUTUBE_ID = 'dQw4w9WgXcQ'


def fetch_image(seed: str, width: int, height: int) -> ContentFile | None:
    """Download a deterministic placeholder photo. Returns ``None`` on
    any network failure so seeding never hard-fails offline."""
    url = f'https://picsum.photos/seed/{seed}/{width}/{height}'
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = resp.read()
        return ContentFile(data, name=f'{seed}.jpg')
    except Exception:
        return None


def attach_if_empty(instance, field_name: str, seed: str, width: int, height: int) -> None:
    field = getattr(instance, field_name)
    if field:
        return
    img = fetch_image(seed, width, height)
    if img:
        field.save(img.name, img, save=True)


class Command(BaseCommand):
    help = 'Seed realistic demo content across all apps (idempotent).'

    def handle(self, *args, **options):
        author = self._seed_author()

        self.stdout.write('— Émissions : catégories, séries, épisodes —')
        self._seed_emissions()

        self.stdout.write('— Programmes hebdomadaires —')
        self._seed_programmes()

        self.stdout.write('— Témoignages —')
        self._seed_testimonials()

        self.stdout.write('— Bannières —')
        self._seed_banners()

        self.stdout.write('— Articles —')
        self._seed_articles(author)

        self.stdout.write('— À propos : mission, valeurs, équipe —')
        self._seed_about()

        self.stdout.write(self.style.SUCCESS('Données de démonstration prêtes.'))

    # ------------------------------------------------------------------
    def _seed_author(self):
        user, _ = User.objects.get_or_create(
            username='redaction',
            defaults={
                'email': 'redaction@ltltv.com',
                'first_name': 'Rédaction',
                'last_name': 'LTL·TV',
                'is_staff': True,
            },
        )
        return user

    # ------------------------------------------------------------------
    def _seed_emissions(self):
        categories = {}
        for name, color in [
            ('Enseignement', '#212870'),
            ('Louange', '#3D53EA'),
            ('Témoignage', '#F5C24E'),
            ('Prière', '#E85521'),
            ('Actualités', '#3D803D'),
        ]:
            cat, _ = EmissionCategory.objects.get_or_create(
                name=name, defaults={'color': color},
            )
            categories[name] = cat

        now = timezone.now()

        show_extra = {
            'prends-courage': dict(
                host='Pasteur Élie Mbaya',
                description=(
                    "Chaque matin, Prends Courage vous propose une méditation "
                    "courte et vivifiante pour ancrer votre journée dans la Parole. "
                    "Dix minutes pour respirer, prier et repartir avec espérance."
                ),
            ),
            'dans-les-profondeurs': dict(
                host='Grâce Ilunga',
                description=(
                    "Un enseignement approfondi, verset par verset, pour celles "
                    "et ceux qui veulent aller plus loin dans leur compréhension "
                    "des Écritures. Exégèse rigoureuse, application concrète."
                ),
            ),
            'rafraichissement': dict(
                host='Chorale LTL',
                description=(
                    "Louange, prière et Parole pour bien démarrer le dimanche. "
                    "Une matinée conviviale animée par la chorale et l'équipe "
                    "pastorale de LTL·TV."
                ),
            ),
        }
        shows = {}
        for slug, extra in show_extra.items():
            show = Show.objects.filter(slug=slug).first()
            if not show:
                continue
            changed = False
            for field, value in extra.items():
                if not getattr(show, field):
                    setattr(show, field, value)
                    changed = True
            if changed:
                show.save()
            attach_if_empty(show, 'cover', f'show-{slug}', 1280, 720)
            shows[slug] = show

        # --- Series ----------------------------------------------------
        series_specs = [
            dict(
                show_slug='prends-courage',
                title='La foi qui déplace les montagnes',
                theme='Un mois pour ancrer sa foi dans les promesses de Dieu.',
                starts_on=(now - timedelta(days=20)).date(),
                ends_on=(now + timedelta(days=10)).date(),
                episodes=[
                    'Qu\'est-ce que la vraie foi ?',
                    'Douter sans perdre pied',
                    'La foi qui agit',
                    'Tenir bon jusqu\'à la promesse',
                ],
            ),
            dict(
                show_slug='dans-les-profondeurs',
                title='Comprendre la grâce',
                theme='Une plongée dans l\'épître aux Romains, chapitre par chapitre.',
                starts_on=(now - timedelta(days=35)).date(),
                ends_on=(now - timedelta(days=7)).date(),
                episodes=[
                    'La grâce, un cadeau immérité',
                    'Grâce et obéissance',
                    'Vivre libre sous la grâce',
                ],
            ),
        ]

        aired_cursor = now - timedelta(days=45)
        for spec in series_specs:
            show = shows.get(spec['show_slug'])
            if not show:
                continue
            series, _ = Series.objects.get_or_create(
                show=show, title=spec['title'],
                defaults={
                    'theme': spec['theme'],
                    'starts_on': spec['starts_on'],
                    'ends_on': spec['ends_on'],
                    'status': Series.Status.PUBLISHED,
                    'published_at': now,
                },
            )
            attach_if_empty(series, 'cover', f'series-{series.slug}', 1280, 720)
            for i, ep_title in enumerate(spec['episodes'], start=1):
                aired_cursor += timedelta(days=3)
                ep, created = Episode.objects.get_or_create(
                    show=show, title=ep_title,
                    defaults={
                        'series': series,
                        'episode_number': i,
                        'speaker': show.host,
                        'excerpt': spec['theme'],
                        'youtube_url': f'https://youtu.be/{YOUTUBE_ID}',
                        'aired_at': aired_cursor,
                        'status': Episode.Status.PUBLISHED,
                        'published_at': aired_cursor,
                    },
                )
                if created:
                    ep.categories.add(categories['Enseignement'])
                attach_if_empty(ep, 'cover', f'episode-{ep.slug}', 960, 540)

        # --- Standalone / featured episodes -----------------------------
        standalone = [
            dict(
                show_slug='rafraichissement',
                title='Dieu veut Te Guérir / Restaurer / Délivrer',
                speaker='Dr Jonathan Odia',
                excerpt='LIVE Zoom mensuel de délivrance, guérison et restauration.',
                is_featured=True,
                days_ago=2,
                category='Prière',
            ),
            dict(
                show_slug='prends-courage',
                title='Restauration du couple selon les Écritures',
                speaker='Pasteur Élie Mbaya',
                excerpt='Ce que la Bible dit vraiment sur l\'unité conjugale.',
                is_featured=False,
                days_ago=4,
                category='Enseignement',
            ),
            dict(
                show_slug='dans-les-profondeurs',
                title='La prière quotidienne : arme du croyant',
                speaker='Grâce Ilunga',
                excerpt='Pourquoi et comment construire une vie de prière solide.',
                is_featured=False,
                days_ago=7,
                category='Prière',
            ),
            dict(
                show_slug='rafraichissement',
                title='Jeunes et appel de Dieu — trouver sa mission',
                speaker='Chorale LTL',
                excerpt='Accompagner la jeunesse dans la découverte de sa vocation.',
                is_featured=False,
                days_ago=9,
                category='Témoignage',
            ),
            dict(
                show_slug='prends-courage',
                title='Louer Dieu en toute saison',
                speaker='Pasteur Élie Mbaya',
                excerpt='La louange comme discipline, même dans l\'épreuve.',
                is_featured=False,
                days_ago=12,
                category='Louange',
            ),
        ]
        for spec in standalone:
            show = shows.get(spec['show_slug'])
            if not show:
                continue
            aired_at = now - timedelta(days=spec['days_ago'])
            ep, created = Episode.objects.get_or_create(
                show=show, title=spec['title'],
                defaults={
                    'speaker': spec['speaker'],
                    'excerpt': spec['excerpt'],
                    'youtube_url': f'https://youtu.be/{YOUTUBE_ID}',
                    'aired_at': aired_at,
                    'is_featured': spec['is_featured'],
                    'status': Episode.Status.PUBLISHED,
                    'published_at': aired_at,
                },
            )
            if created:
                ep.categories.add(categories[spec['category']])
            attach_if_empty(ep, 'cover', f'episode-{ep.slug}', 960, 540)

    # ------------------------------------------------------------------
    def _seed_programmes(self):
        types = {}
        for name, color, icon in [
            ('Culte', '#212870', 'church'),
            ('Formation', '#3D53EA', 'book-open'),
            ('Jeunesse', '#E85521', 'users'),
            ('Louange', '#F5C24E', 'mic'),
        ]:
            pt, _ = ProgramType.objects.get_or_create(
                name=name, defaults={'color': color, 'icon': icon},
            )
            types[name] = pt

        monday = (timezone.now() - timedelta(days=timezone.now().weekday())).date()
        week_specs = [
            dict(day=0, title='Culte du lundi — Prière collective', type='Culte',
                 start=time(19, 0), end=time(20, 30), mode=WeeklyProgram.Mode.HYBRID,
                 location='Kinshasa — Bandal', responsable='Pasteur Élie Mbaya'),
            dict(day=2, title='Formation des disciples', type='Formation',
                 start=time(18, 0), end=time(19, 30), mode=WeeklyProgram.Mode.ONLINE,
                 location='En ligne — Zoom', responsable='Grâce Ilunga'),
            dict(day=4, title='Soirée Jeunesse en action', type='Jeunesse',
                 start=time(19, 0), end=time(21, 0), mode=WeeklyProgram.Mode.IN_PERSON,
                 location='Kinshasa — Bandal', responsable='Émilie Nsamba'),
            dict(day=5, title='LIVE Zoom Guérison & Restauration', type='Culte',
                 start=time(18, 0), end=time(20, 0), mode=WeeklyProgram.Mode.HYBRID,
                 location='Kinshasa — Bandal', responsable='Dr Jonathan Odia'),
            dict(day=6, title='Matinées de Rafraîchissement', type='Louange',
                 start=time(7, 0), end=time(9, 0), mode=WeeklyProgram.Mode.IN_PERSON,
                 location='Kinshasa — Bandal', responsable='Chorale LTL'),
        ]
        now = timezone.now()
        for spec in week_specs:
            date = monday + timedelta(days=spec['day'])
            wp, created = WeeklyProgram.objects.get_or_create(
                title=spec['title'], date=date,
                defaults={
                    'program_type': types[spec['type']],
                    'start_time': spec['start'],
                    'end_time': spec['end'],
                    'mode': spec['mode'],
                    'location': spec['location'],
                    'responsable': spec['responsable'],
                    'status': WeeklyProgram.Status.PUBLISHED,
                    'published_at': now,
                    'is_featured': spec['type'] == 'Culte',
                },
            )
            attach_if_empty(wp, 'image', f'programme-{wp.slug}', 1280, 720)

    # ------------------------------------------------------------------
    def _seed_testimonials(self):
        now = timezone.now()
        specs = [
            ('Sarah M.', 'Kinshasa', 'RDC',
             "J'ai découvert LTL·TV un dimanche matin, et depuis, chaque émission "
             "est devenue pour moi une source de paix. Ma vie de prière a été transformée."),
            ('Emmanuel K.', 'Lubumbashi', 'RDC',
             "Les témoignages diffusés m'ont donné le courage de partager le mien. "
             "Une famille bienveillante qui m'a accueilli sans jugement."),
            ('Marie-Claire N.', 'Goma', 'RDC',
             "Après une période très difficile, j'ai retrouvé espoir en écoutant "
             "Rafraîchissement Matinée chaque dimanche avec mes enfants."),
            ('David M.', 'Bukavu', 'RDC',
             "Merci pour la qualité des programmes. Chaque semaine, quelque chose "
             "me touche et me fait réfléchir profondément."),
            ('Esther W.', 'Kinshasa', 'RDC',
             "Les Live Zoom du Dr Odia sont une bénédiction pour moi et ma famille. "
             "Nous ne manquons jamais un rendez-vous."),
            ('Patrick B.', 'Matadi', 'RDC',
             "La chorale du dimanche m'a réconcilié avec la louange après des "
             "années d'éloignement. Gloire à Dieu."),
            ('Josée L.', 'Bruxelles', 'Belgique',
             "Depuis l'Europe, LTL·TV me garde connectée à ma foi et à ma culture. "
             "Un vrai pont entre deux mondes."),
            ('Fabrice T.', 'Paris', 'France',
             "Prends Courage rythme mes matins depuis deux ans. Dix minutes qui "
             "changent la trajectoire de toute une journée."),
        ]
        for i, (name, city, country, story) in enumerate(specs):
            t, created = Testimonial.objects.get_or_create(
                author_name=name, city=city,
                defaults={
                    'country': country,
                    'story': story,
                    'status': Testimonial.Status.APPROVED,
                    'is_photo_public': True,
                    'is_featured': i < 2,
                    'moderated_at': now,
                },
            )
            attach_if_empty(t, 'photo', f'testimonial-{t.slug}', 400, 400)

    # ------------------------------------------------------------------
    def _seed_banners(self):
        specs = [
            dict(
                title='LIVE Zoom Guérison & Restauration',
                alt_text='Bannière LIVE Zoom Guérison et Restauration avec Dr Jonathan Odia',
                link_url='/programmes/rafraichissement',
                order=1,
            ),
            dict(
                title='Prends Courage — chaque matin avec vous',
                alt_text='Bannière Prends Courage',
                link_url='/programmes/prends-courage',
                order=2,
            ),
            dict(
                title='Partagez votre témoignage',
                alt_text='Bannière invitation à partager son témoignage',
                link_url='/temoignages',
                order=3,
            ),
        ]
        for spec in specs:
            banner, _ = Banner.objects.get_or_create(
                title=spec['title'],
                defaults={
                    'alt_text': spec['alt_text'],
                    'link_url': spec['link_url'],
                    'is_active': True,
                    'order': spec['order'],
                },
            )
            seed_key = f'banner-{banner.pk}'
            for variant, w, h in [('desktop', 1600, 600), ('mobile', 750, 1000)]:
                bi, created = BannerImage.objects.get_or_create(
                    banner=banner, variant=variant,
                )
                if not bi.image:
                    img = fetch_image(f'{seed_key}-{variant}', w, h)
                    if img:
                        bi.image.save(img.name, img, save=True)

    # ------------------------------------------------------------------
    def _seed_articles(self, author):
        cats = {}
        for name in ['Spiritualité', 'Société', 'Réflexion', 'Musique', 'Famille']:
            cat, _ = ArticleCategory.objects.get_or_create(name=name)
            cats[name] = cat

        now = timezone.now()
        specs = [
            ('La prière au quotidien : trouver le temps de s\'arrêter', 'Spiritualité',
             "Dans un monde qui court, apprendre à faire une pause change tout.\n\n"
             "## Pourquoi la prière quotidienne compte\n\nLa régularité change la texture "
             "de notre relation à Dieu. Ce n'est pas une question de durée mais de "
             "constance.\n\n## Trois habitudes simples\n\n- Un carnet de prière\n"
             "- Cinq minutes au réveil\n- Une gratitude par jour", 20),
            ('Jeunesse et espérance : ce que nous apprend cette génération', 'Société',
             "Portrait d'une nouvelle génération qui cherche du sens.\n\n"
             "Loin des clichés, la jeunesse d'aujourd'hui pose des questions "
             "profondes sur le sens de la vie et de l'engagement.", 17),
            ('Construire la paix commence chez soi', 'Réflexion',
             "De la famille au quartier, un chemin patient.\n\nLa paix n'est pas "
             "l'absence de conflit mais la capacité à le traverser ensemble.", 14),
            ('La louange, une école de libération intérieure', 'Musique',
             "Ce que la musique dit de nous.\n\nChanter ensemble transforme "
             "profondément notre rapport à la souffrance et à la joie.", 11),
            ('Famille recomposée : construire ensemble sans effacer', 'Famille',
             "Inventer une nouvelle unité familiale.\n\nChaque famille recomposée "
             "porte son histoire propre — et c'est une richesse, pas un obstacle.", 8),
            ('Le silence, cet allié négligé', 'Réflexion',
             "Redécouvrir la puissance des moments où l'on ne dit rien.\n\n"
             "Le silence n'est pas un vide à combler mais un espace à habiter.", 5),
            ('Servir sans s\'épuiser : prévenir le burn-out ministériel', 'Spiritualité',
             "Le service chrétien ne doit pas consumer ceux qui le portent.\n\n"
             "Quelques repères pour servir dans la durée, avec joie.", 3),
            ('Ce que la Bible dit vraiment du pardon', 'Réflexion',
             "Le pardon biblique n'est ni l'oubli ni la minimisation.\n\n"
             "C'est un acte de foi qui libère d'abord celui qui pardonne.", 1),
        ]
        for title, cat_name, content_md, days_ago in specs:
            art, created = Article.objects.get_or_create(
                title=title,
                defaults={
                    'category': cats[cat_name],
                    'author': author,
                    'content_md': content_md,
                    'status': Article.Status.PUBLISHED,
                    'published_at': now - timedelta(days=days_ago),
                    'is_featured': days_ago == 1,
                },
            )
            attach_if_empty(art, 'cover', f'article-{art.slug}', 1200, 800)

    # ------------------------------------------------------------------
    def _seed_about(self):
        page = AboutPage.load()
        if not page.mission:
            page.mission = (
                "LTL·TV est une chaîne chrétienne focalisée à annoncer l'Évangile "
                "par les médias. Nous offrons des émissions chaque semaine et des "
                "programmes LIVE Zoom et YouTube pour toucher chaque foyer, où qu'il soit."
            )
        if not page.vision:
            page.vision = (
                "Voir chaque famille francophone d'Afrique et de la diaspora "
                "connectée à l'Évangile par des médias de qualité, produits avec "
                "excellence et diffusés sans frontières."
            )
        if not page.history_text:
            page.history_text = (
                "LTL·TV est née d'une conviction simple : la télévision et le "
                "numérique peuvent porter la Bonne Nouvelle plus loin que jamais. "
                "Depuis nos débuts, une petite équipe de passionnés produit chaque "
                "semaine des émissions qui allient enseignement biblique, louange "
                "et accompagnement pastoral — d'abord en présentiel à Kinshasa, "
                "puis en LIVE Zoom et YouTube pour rejoindre la diaspora."
            )
        if not page.founded_year:
            page.founded_year = 2020
        page.save()
        attach_if_empty(page, 'cover', 'about-cover', 1600, 600)

        for title, description, icon, order in [
            ('Excellence', 'Servir Dieu et notre audience avec le meilleur de nous-mêmes.', 'award', 1),
            ('Amour', 'Accueillir chacun sans jugement, comme le Christ nous accueille.', 'heart', 2),
            ('Intégrité', 'Dire la vérité avec grâce, sur et en dehors de l\'antenne.', 'shield-check', 3),
            ('Service', 'Mettre nos talents et nos médias au service des autres.', 'hand-heart', 4),
        ]:
            CoreValue.objects.get_or_create(
                title=title, defaults={'description': description, 'icon': icon, 'order': order},
            )

        team = [
            ('Dr Jonathan Odia', 'Fondateur & Directeur général', TeamMember.Category.DIRECTION,
             "Fondateur de LTL·TV, le Dr Jonathan Odia porte la vision de la chaîne "
             "depuis sa création et anime les LIVE Zoom de guérison et restauration."),
            ('Franck K.', 'Responsable communication', TeamMember.Category.COMMUNICATION,
             "Franck orchestre la présence de LTL·TV sur les réseaux sociaux et "
             "la stratégie de communication de la chaîne."),
            ('Israel K.', 'Responsable technique', TeamMember.Category.TECHNIQUE,
             "Israel veille au bon fonctionnement de la diffusion, du studio "
             "jusqu'aux plateformes de streaming."),
            ('Nicole F.', 'Coordinatrice des programmes', TeamMember.Category.COORDINATION,
             "Nicole planifie la grille hebdomadaire et coordonne les équipes "
             "d'animateurs et d'invités."),
            ('Bernis M.', 'Responsable production', TeamMember.Category.PRODUCTION,
             "Bernis supervise le tournage et le montage de toutes les émissions "
             "et épisodes de LTL·TV."),
            ('Grâce Ilunga', 'Enseignante biblique', TeamMember.Category.PASTORALE,
             "Grâce anime « Dans Les Profondeurs » et accompagne l'équipe pastorale "
             "dans le suivi des membres de la communauté."),
        ]
        for i, (name, role, category, bio) in enumerate(team, start=1):
            member, _ = TeamMember.objects.get_or_create(
                full_name=name,
                defaults={'role': role, 'category': category, 'bio': bio, 'order': i},
            )
            attach_if_empty(member, 'photo', f'team-{member.pk}', 400, 400)
