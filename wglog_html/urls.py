from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, re_path, include

from django.contrib.auth import views as auth_views

from . import views


auth_patterns = [
    path(
        'login/',
        auth_views.LoginView.as_view(template_name='wglog_html/auth/login.html'),
        name='login'
    ),
    path(
        'logout/',
        auth_views.LogoutView.as_view(
            template_name='wglog_html/auth/logged_out.html',
            next_page='login'
        ),
        name='logout'
    ),

    path('register/', views.register, name='register'),
    path(
        'register/activation_sent/',
        views.register_activation_sent,
        name='register_activation_sent'
    ),
    re_path(
        r'^register/activate/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/$',
        views.register_activate,
        name='register_activate'
    ),

    path(
        'password_change/',
        auth_views.PasswordChangeView.as_view(template_name='wglog_html/auth/password_change_form.html'),
        name='password_change'
    ),
    path(
        'password_change/done/',
        auth_views.PasswordChangeDoneView.as_view(template_name='wglog_html/auth/password_change_done.html'),
        name='password_change_done'
    ),

    path(
        'password_reset/',
        auth_views.PasswordResetView.as_view(
            template_name='wglog_html/auth/password_reset_form.html',
            email_template_name='wglog_html/auth/password_reset_email.html',
            subject_template_name='wglog_html/auth/password_reset_subject.txt'
        ),
        name='password_reset'
    ),
    path(
        'password_reset/done/',
        auth_views.PasswordResetDoneView.as_view(template_name='wglog_html/auth/password_reset_done.html'),
        name='password_reset_done'
    ),

    re_path(
        r'^reset/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/$',
        auth_views.PasswordResetConfirmView.as_view(template_name='wglog_html/auth/password_reset_confirm.html'),
        name='password_reset_confirm'
    ),

    path(
        'reset/done/',
        auth_views.PasswordResetCompleteView.as_view(template_name='wglog_html/auth/password_reset_complete.html'),
        name='password_reset_complete'
    )
]

urlpatterns = [
    re_path(r'^$', views.index, name='index'),
    re_path('^trainings/$', views.training_list, name='training_list'),
    re_path(r'^accounts/', include(auth_patterns)),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        re_path(r'^__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
