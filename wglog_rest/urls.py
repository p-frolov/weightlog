from django.conf import settings
from django.urls import path, re_path, include

from . import views


rest_api_patterns = [

    path('appsettings/', views.AppSettingsDetail.as_view(), name='app-settings'),

    re_path(r'^users/(?P<pk>([0-9]+|me))/$', views.UserDetail.as_view(), name='user-detail'),
    path('settings/', views.SettingsDetail.as_view(), name='user-settings'),

    path('trainings/', views.TrainingsList.as_view(), name='training-list'),
    re_path(r'^trainings/(?P<pk>[0-9]+)/$', views.TrainingDetail.as_view(), name='training-detail'),
    re_path(r'^trainings/(?P<training_id>[0-9]+)/sets/$', views.TrainingSetsList.as_view(), name='training-set-list'),

    path('trainingnames/', views.TrainingNamesList.as_view(), name='training-name-list'),

    path('sets/', views.SetsList.as_view(), name='set-list'),
    re_path(r'^sets/(?P<pk>[0-9]+)/$', views.SetDetail.as_view(), name='set-detail'),
]

if settings.DEBUG:
    rest_api_patterns += [
        re_path(r'^$', views.api_root),
    ]

urlpatterns = [
    re_path(r'^rest/', include(rest_api_patterns))
]

if settings.DEBUG:
    urlpatterns += [
        re_path(r'^auth/', include('rest_framework.urls', namespace='rest_framework'))
    ]
