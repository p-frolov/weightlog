from django.conf.urls import url, include
from django.conf import settings

from . import views


rest_api_patterns = [
    url(r'^trainings/$', views.TrainingsList.as_view(), name='training-list'),
    url(r'^trainings/(?P<pk>[0-9]+)/$', views.TrainingDetail.as_view(), name='training-detail'),

    url(r'^sets/training/(?P<training_id>[0-9]+)/$', views.SetsList.as_view(), name='set-list-bytraining'),
    url(r'^sets/(?P<pk>[0-9]+)$', views.SetDetail.as_view(), name='set-detail'),
]

if settings.DEBUG:
    rest_api_patterns += [
        url(r'^$', views.api_root),
    ]

urlpatterns = [
    url(r'^rest/', include(rest_api_patterns))
]

if settings.DEBUG:
    urlpatterns += [
        url(r'^auth/', include('rest_framework.urls', namespace='rest_framework'))
    ]
