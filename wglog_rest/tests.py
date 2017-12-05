from django.test import TestCase
from django.core.urlresolvers import reverse

class SmokeTestCase(TestCase):

    def test_trainings(self):
        self.assertEqual(self.client.get(reverse('training-list')).status_code,
                         403, 'Cannot open "training-list" url')

        self.assertEqual(
            self.client.get(reverse('training-detail', kwargs={'pk': '1'})).status_code,
            403,
            'Cannot open "training-detail" url'
        )

    def test_sets(self):
        self.assertEqual(
            self.client.get(reverse('set-list-bytraining', kwargs={'training_id': '1'})).status_code,
            403,
            'Cannot open "set-list-bytraining" url'
        )

        self.assertEqual(
            self.client.get(reverse('set-detail', kwargs={'pk': '1'})).status_code,
            403,
            'Cannot open "set-detail" url'
        )
