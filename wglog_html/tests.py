import re
from urllib.parse import urlparse

from django.test import TestCase, override_settings
from django.core.urlresolvers import reverse, resolve
from django.core import mail

from django.contrib import auth
from django.contrib.auth.models import AnonymousUser
from rest_framework import status

from wglog.models import User


class SmokeTestCase(TestCase):
    """Tests all urls work"""

    def test_index(self):
        self.assertRedirects(
            self.client.get(reverse('index')),
            reverse('login') + '?next=/'
        )
    # 'Cannot open "index" page'

    def test_auth(self):

        page2status = [
            ('login', status.HTTP_200_OK),
            ('logout', status.HTTP_302_FOUND),
            ('register', status.HTTP_200_OK),
            ('register_activation_sent', status.HTTP_200_OK),
            ('password_change', status.HTTP_302_FOUND),
            ('password_change_done', status.HTTP_302_FOUND),
            ('password_reset', status.HTTP_200_OK),
            ('password_reset_done', status.HTTP_200_OK),
            ('password_reset_complete', status.HTTP_200_OK),
        ]
        for page, status_code in page2status:
            # https://docs.python.org/3/library/unittest.html#distinguishing-test-iterations-using-subtests
            self.assertEqual(self.client.get(reverse(page)).status_code,
                             status_code, 'Cannot open "{}" page'.format(page))

        self.assertEqual(

            self.client.get(
                reverse('register_activate', kwargs={'uidb64': 'OQ', 'token': '4rp-dc7925512b622c9fd389'})
            ).status_code,

            status.HTTP_200_OK,

            'Cannot open "register_activate" page'
        )

        self.assertEqual(

            self.client.get(
                reverse('password_reset_confirm', kwargs={'uidb64': 'OQ', 'token': '4rp-dc7925512b622c9fd389'})
            ).status_code,

            status.HTTP_200_OK,

            'Cannot open "register_activate" page'
        )


class CurrentUserTestCaseMixin:
    """ Requires django.contrib.auth, integrates to django.test.TestCase"""
    @property
    def _current_user(self):
        return auth.get_user(self.client)


class LoginTestCase(CurrentUserTestCaseMixin, TestCase):

    @property
    def _current_user(self):
        return auth.get_user(self.client)

    def setUp(self):
        self._testuser = User.objects.create_user(
            username='testuser',
            email='testuser@local.local',
            password='user12345'
        )

    def test_login_logout(self):
        no_user_resp = self.client.post(reverse('login'), {
            'username': 'nouser',
            'password': 'user12345',
            'next': '/'
        })
        self.assertEqual(no_user_resp.status_code,
                         status.HTTP_200_OK, 'Non-existent user login')

        self.assertIsInstance(self._current_user,
                              AnonymousUser, 'Not anonymous after bad login')

        testuser_resp = self.client.post(reverse('login'), {
            'username': 'testuser',
            'password': 'user12345',
            'next': '/'
        })
        self.assertEqual(testuser_resp.status_code,
                         status.HTTP_302_FOUND, 'Login does not work')

        self.assertEqual(self._current_user.pk,
                         self._testuser.pk, 'Test user and current user does not much')

        logout_resp = self.client.get(reverse('logout'))
        self.assertEqual(logout_resp.status_code,
                         status.HTTP_302_FOUND, 'Cannot logout')
        self.assertIsInstance(self._current_user,
                              AnonymousUser, 'Not anonymous after logout')


class RegistrationTestCase(CurrentUserTestCaseMixin, TestCase):

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_registration(self):
        test_username = 'registeruser'
        register_resp = self.client.post(reverse('register'), {
            'username': test_username,
            'email': 'registeruser@local.local',
            'password1': 'user12345',
            'password2': 'user12345',
        })
        self.assertRedirects(
            register_resp,
            reverse('register_activation_sent')
        )

        user = User.objects.select_related('profile').get(username=test_username)
        self.assertFalse(user.is_active, 'User can be inactive')
        self.assertFalse(user.profile.email_confirmed, 'User must not be confirmed by email')

        self.assertEqual(len(mail.outbox), 1, 'Registration email is expected')

        body = mail.outbox[0].body
        activate_link_pattern = re.compile(r'(?P<url>https?://[^\s]+register/activate/[^\s]+)')
        self.assertRegex(body, activate_link_pattern,
                         'Cannot find activation link of registraion in email')

        url = re.search(activate_link_pattern, body).group('url')
        _, _, kwargs = resolve(urlparse(url).path)
        self.assertIn('uidb64', kwargs, 'Cannot find uidb64 parameter in activation link of registration')
        self.assertIn('token', kwargs, 'Cannot find token parameter in activation link of registration')

        activate_resp = self.client.get(reverse('register_activate', kwargs=kwargs))
        self.assertRedirects(activate_resp, reverse('index'))

        user.refresh_from_db()
        user.profile.refresh_from_db()  # todo: refresh with user automatically
        self.assertTrue(user.is_active, 'User can be active')
        self.assertTrue(user.profile.email_confirmed, 'User must be confirmed by email')

        self.assertEqual(self._current_user.pk,
                         user.pk, 'Registered user and current user does not much')
