from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

api_v1_patterns = [
    path('auth/token/',         TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(),    name='token_refresh'),
    path('auth/token/verify/',  TokenVerifyView.as_view(),     name='token_verify'),
    path('accounts/',    include('apps.accounts.urls')),
    path('emissions/',   include('apps.emissions.urls')),
    path('banners/',     include('apps.banners.urls')),
    path('programmes/',  include('apps.programmes.urls')),
    path('temoignages/', include('apps.temoignages.urls')),
    path('articles/',    include('apps.articles.urls')),
    path('contacts/',    include('apps.contacts.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(api_v1_patterns)),

    # OpenAPI schema + interactive docs
    path('api/schema/',        SpectacularAPIView.as_view(),                          name='schema'),
    path('api/docs/',          SpectacularSwaggerView.as_view(url_name='schema'),     name='swagger-ui'),
    path('api/redoc/',         SpectacularRedocView.as_view(url_name='schema'),       name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
