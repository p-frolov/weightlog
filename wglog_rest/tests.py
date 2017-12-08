from django.test import TestCase
from django.core.urlresolvers import reverse

from rest_framework import status

from wglog.tests import AuthTestCaseMixin, AssertTestCaseMixin


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

# https://docs.djangoproject.com/en/1.11/topics/testing/tools/#fixture-loading


class RestTestCase(AuthTestCaseMixin, AssertTestCaseMixin, TestCase):
    fixtures = ['testdata']

    def setUp(self):
        err_msg = 'Cannot login by user from fixture'
        assert self.client.login(username='testuser', password='user12345'), err_msg

    def test_trainings_get(self):
        resp = self.client.get(reverse('training-list'))
        self.assertStatusCode(resp, status.HTTP_200_OK)
        json_list = resp.json()
        self.assertEqual(len(json_list), 5, 'Must be 5 trainings by default')
        self.assertEqual(len(json_list[0]['sets']), 12, 'Must be 12 sets in first training in fixtures')
        user = self.current_user
        self.assertAllEqualsByField(json_list, user.id, lookup_field='user_id',
                                    msg='Trainings must be belong to user.')

    def test_training_details_get(self):
        id_ = 36
        resp = self.client.get(reverse('training-detail', kwargs={'pk': id_}))
        self.assertStatusCode(resp, status.HTTP_200_OK)
        json_detail = resp.json()
        self.assertSetContainsSet(
            set(json_detail.keys()),
            {'id', 'date', 'name', 'sets'},
            'Training keys.'
        )
        self.assertEqual(json_detail['id'], id_)

    def test_sets_get(self):
        training_id = 36
        resp = self.client.get(
            reverse('set-list-bytraining', kwargs={'training_id': training_id})
        )
        self.assertStatusCode(resp, status.HTTP_200_OK)
        json_list = resp.json()
        self.assertEqual(len(json_list), 12, 'Count of sets for 36 must be 12 in fixtures')
        self.assertAllEqualsByField(json_list, training_id, lookup_field='training_id',
                                    msg='Sets must be belong to training.')

    def test_set_detail_get(self):
        set_id = 520
        resp = self.client.get(
            reverse('set-detail', kwargs={'pk': set_id})
        )
        self.assertStatusCode(resp, status.HTTP_200_OK)
        json_detail = resp.json()
        self.assertSetContainsSet(
            set(json_detail.keys()),
            {'id', 'weight', 'reps', 'created_at'},
            'Set keys.'
        )
        self.assertEqual(json_detail['id'], set_id)
