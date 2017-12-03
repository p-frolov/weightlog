from django.conf import settings
from django.conf.urls import url, include
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views

from . import views


auth_patterns = [
    url(
        r'^login/$',
        auth_views.LoginView.as_view(template_name='wglog_html/auth/login.html'),
        name='login'
    ),
    url(
        r'^logout/$',
        auth_views.LogoutView.as_view(
            template_name='wglog_html/auth/logged_out.html',
            next_page='login'
        ),
        name='logout'
    ),

    url(r'^register/$', views.register, name='register'),

    url(
        r'^password_change/$',
        auth_views.PasswordChangeView.as_view(template_name='wglog_html/auth/password_change_form.html'),
        name='password_change'
    ),
    url(
        r'^password_change/done/$',
        auth_views.PasswordChangeDoneView.as_view(template_name='wglog_html/auth/password_change_done.html'),
        name='password_change_done'
    ),

    url(
        r'^password_reset/$',
        auth_views.PasswordResetView.as_view(
            template_name='wglog_html/auth/password_reset_form.html',
            email_template_name='wglog_html/auth/password_reset_email.html',
            subject_template_name='wglog_html/auth/password_reset_subject.txt'
        ),
        name='password_reset'
    ),
    url(
        r'^password_reset/done/$',
        auth_views.PasswordResetDoneView.as_view(template_name='wglog_html/auth/password_reset_done.html'),
        name='password_reset_done'
    ),

    url(
        r'^reset/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/$',
        auth_views.PasswordResetConfirmView.as_view(template_name='wglog_html/auth/password_reset_confirm.html'),
        name='password_reset_confirm'
    ),

    url(
        r'^reset/done/$',
        auth_views.PasswordResetCompleteView.as_view(template_name='wglog_html/auth/password_reset_complete.html'),
        name='password_reset_complete'
    )
]

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^accounts/', include(auth_patterns)),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        url(r'^__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
