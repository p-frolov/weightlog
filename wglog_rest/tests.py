import json

from django.test import TestCase
from django.core.urlresolvers import reverse

from rest_framework import status

from wglog.models import User
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


class RestGetTestCase(AuthTestCaseMixin, AssertTestCaseMixin, TestCase):
    fixtures = ['testdata']

    # todo: check permissions

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


class RestChangesTestCase(AuthTestCaseMixin, AssertTestCaseMixin, TestCase):

    def setUp(self):
        credentials = dict(username='testchanges', password='user12345')
        # todo: extract flags
        user = User.objects.create_user(**credentials, is_active=True)
        user.profile.email_confirmed = True
        user.save()
        self._user = user
        assert self.client.login(**credentials), 'Cannot login'

    def test_training(self):
        """training: create, update, delete"""
        training_name = 'gym'

        # CREATE

        create_resp = self.client.post(
            reverse('training-list'),
            data={'name': training_name}
        )
        self.assertStatusCode(create_resp, status.HTTP_201_CREATED)

        # check from creation response
        created_json = create_resp.json()
        self.assertEqual(created_json['name'], training_name)
        training_id = created_json['id']

        # check from list resopnse
        trainings = self._get_trainings_json()
        self.assertEqual(len(trainings), 1, 'Trainings count')
        self.assertEqual(trainings[0]['id'], training_id)
        self.assertEqual(trainings[0]['name'], training_name)

        # UPDATE

        training_name2 = 'gymchanged'
        update_resp = self.client.put(
            reverse('training-detail', kwargs={'pk': training_id}),
            data=json.dumps({'name': training_name2}),
            content_type='application/json'
        )
        self.assertStatusCode(update_resp, status.HTTP_200_OK)

        # check from changing response
        updated_json = update_resp.json()
        self.assertEqual(updated_json['name'], training_name2)

        # check from list response
        self.assertEqual(self._get_trainings_json()[0]['name'], training_name2)

        # DELETE

        delete_resp = self.client.delete(reverse('training-detail', kwargs={'pk': training_id}))
        self.assertStatusCode(delete_resp, status.HTTP_204_NO_CONTENT)

        self.assertEqual(len(self._get_trainings_json()), 0, 'Trainings must be empty')

    def test_set(self):
        """Sets: create, update, delete"""

        # test training
        training_resp = self.client.post(
            reverse('training-list'),
            data={'name': 'testgym'}
        )
        self.assertStatusCode(training_resp, status.HTTP_201_CREATED)

        training_id = training_resp.json()['id']
        self.assertEqual(
            len(self._get_sets_json(training_id)),
            0,
            'Sets must be empty'
        )

        # CREATE

        create_resp = self.client.post(
            reverse('set-list-bytraining', kwargs={'training_id': training_id}),
            data={'weight': 35, 'reps': 10}
        )
        self.assertStatusCode(create_resp, status.HTTP_201_CREATED)
        created_json = create_resp.json()
        self.assertEqual(created_json['weight'], 35)
        self.assertEqual(created_json['reps'], 10)

        sets = self._get_sets_json(training_id)
        self.assertEqual(len(sets), 1)
        self.assertEqual(sets[0]['weight'], 35)
        self.assertEqual(sets[0]['reps'], 10)

        set_id = sets[0]['id']

        # UPDATE

        update_resp = self.client.put(
            reverse('set-detail', kwargs={'pk': set_id}),
            data=json.dumps({'weight': 55, 'reps': 7}),
            content_type='application/json'
        )
        self.assertStatusCode(update_resp, status.HTTP_200_OK)

        # check from update response
        updated_json = update_resp.json()
        self.assertEqual(updated_json['weight'], 55)
        self.assertEqual(updated_json['reps'], 7)

        # check from list
        sets_updated = self._get_sets_json(training_id)
        self.assertEqual(len(sets_updated), 1)
        self.assertEqual(sets_updated[0]['weight'], 55)
        self.assertEqual(sets_updated[0]['reps'], 7)

        # DELETE

        delete_resp = self.client.delete(
            reverse('set-detail', kwargs={'pk': set_id})
        )
        self.assertStatusCode(delete_resp, status.HTTP_204_NO_CONTENT)

        sets_deleted = self._get_sets_json(training_id)
        self.assertEqual(len(sets_deleted), 0, "Sets must be empty after deleting")

    def _get_trainings_json(self):
        # todo: check status
        return self.client.get(reverse('training-list')).json()

    def _get_sets_json(self, training_id):
        # todo: check status
        return self.client.get(
            reverse('set-list-bytraining', kwargs={'training_id': training_id})
        ).json()
