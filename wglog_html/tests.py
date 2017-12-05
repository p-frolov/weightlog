from django.test import TestCase
from django.core.urlresolvers import reverse

from django.contrib import auth
from django.contrib.auth.models import AnonymousUser
from rest_framework import status

from wglog.models import User


class SmokeTestCase(TestCase):

    def test_index(self):
        resp = self.client.get(reverse('index'))
        self.assertEqual(resp.status_code,
                         status.HTTP_302_FOUND, 'Cannot open "index" page')

        self.assertRedirects(resp, reverse('login') + '?next=/')


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


class LoginTestCase(TestCase):

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
