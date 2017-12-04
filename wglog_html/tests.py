from django.test import TestCase
from django.core.urlresolvers import reverse


class SmokeTestCase(TestCase):

    def test_index(self):
        self.assertEqual(self.client.get(reverse('index')).status_code,
                         302, 'Cannot open "index" page')

    def test_auth(self):

        data = [
            ('login', 200),
            ('logout', 302),
            ('register', 200),
            ('register_activation_sent', 200),
            ('password_change', 302),
            ('password_change_done', 302),
            ('password_reset', 200),
            ('password_reset_done', 200),
            ('password_reset_complete', 200),
        ]
        for page, status in data:
            self.assertEqual(self.client.get(reverse(page)).status_code,
                             status, 'Cannot open "{}" page'.format(page))

        self.assertEqual(

            self.client.get(
                reverse('register_activate', kwargs={'uidb64': 'OQ', 'token': '4rp-dc7925512b622c9fd389'})
            ).status_code,

            200,

            'Cannot open "register_activate" page'
        )

        self.assertEqual(

            self.client.get(
                reverse('password_reset_confirm', kwargs={'uidb64': 'OQ', 'token': '4rp-dc7925512b622c9fd389'})
            ).status_code,

            200,

            'Cannot open "register_activate" page'
        )
