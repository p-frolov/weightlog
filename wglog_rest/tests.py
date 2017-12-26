import json
from dateutil import parser as dt_parser

from django.test import TestCase
from django.urls import reverse

from rest_framework import status

from wglog.tests import AuthTestCaseMixin, AssertTestCaseMixin
from wglog.models import UserSettings


class RestAppTestCaseMixin:
    __slots__ = ()

    def get_trainings_json(self):
        assert isinstance(self, TestCase)
        resp = self.client.get(reverse('training-list'))
        assert resp.status_code == status.HTTP_200_OK, 'Cannot get trainings'
        return resp.json()

    def get_sets_json(self, training_id):
        assert isinstance(self, TestCase)
        resp = self.client.get(
            reverse('training-set-list', kwargs={'training_id': training_id})
        )
        assert resp.status_code == status.HTTP_200_OK, 'Cannot get sets'
        return resp.json()

    def get_training_names_json(self):
        assert isinstance(self, TestCase)
        resp = self.client.get(reverse('training-name-list'))
        assert resp.status_code == status.HTTP_200_OK, 'Cannot get training names'
        return resp.json()

    def get_user_settings_json(self):
        assert isinstance(self, TestCase)
        resp = self.client.get(reverse('user-settings'))
        assert resp.status_code == status.HTTP_200_OK, 'Cannot get user settings'
        return resp.json()

    def create_test_training(self, **kwargs):
        """kwargs - training fields"""
        assert isinstance(self, TestCase)
        training_resp = self.client.post(
            reverse('training-list'),
            data=kwargs
        )
        assert training_resp.status_code == status.HTTP_201_CREATED, "Cannot create test training"
        return training_resp.json()


class SmokeTestCase(AssertTestCaseMixin, TestCase):

    def test_trainings(self):
        self.assertEqual(self.client.get('/api/rest/trainings/').status_code,
                         status.HTTP_403_FORBIDDEN, 'Cannot open "training-list" url')

        self.assertEqual(
            self.client.get('/api/rest/trainings/1/').status_code,
            status.HTTP_403_FORBIDDEN,
            'Cannot open "training-detail" url'
        )

    def test_training_names(self):
        self.assertStatusCode(
            self.client.get('/api/rest/trainingnames/'),
            status.HTTP_403_FORBIDDEN
        )

    def test_sets(self):
        self.assertEqual(
            self.client.get('/api/rest/trainings/1/sets/').status_code,
            status.HTTP_403_FORBIDDEN,
            'Cannot open "training-set-list" url'
        )

        self.assertEqual(
            self.client.get('/api/rest/sets/1/').status_code,
            status.HTTP_403_FORBIDDEN,
            'Cannot open "set-detail" url'
        )

    def test_user(self):
        self.assertStatusCode(
            self.client.get('/api/rest/users/me/'),
            status.HTTP_403_FORBIDDEN
        )

        self.assertStatusCode(
            self.client.get('/api/rest/users/123/'),
            status.HTTP_403_FORBIDDEN
        )

        self.assertStatusCode(
            self.client.put(
                '/api/rest/users/123/',
                data=json.dumps({'username': 'name'}),
                content_type='application/json'
            ),
            status.HTTP_403_FORBIDDEN
        )

        self.assertStatusCode(
            self.client.delete('/api/rest/users/123/'),
            status.HTTP_403_FORBIDDEN
        )

        self.assertStatusCode(
            self.client.get('/api/rest/settings/'),
            status.HTTP_403_FORBIDDEN
        )


class RestGetTestCase(AuthTestCaseMixin, AssertTestCaseMixin, TestCase):

    fixtures = ['testdata']

    def setUp(self):
        err_msg = 'Cannot login by user from fixture'
        assert self.client.login(username='testuser', password='user12345'), err_msg

    def test_trainings_get(self):
        resp = self.client.get(reverse('training-list'))
        self.assertStatusOk(resp)
        json_list = resp.json()
        self.assertEqual(len(json_list), 36, 'Must be 36 trainings in fixtures')
        self.assertEqual(len(json_list[0]['sets']), 12, 'Must be 12 sets in first training in fixtures')

    def test_training_names(self):
        resp = self.client.get(reverse('training-name-list'))
        self.assertStatusOk(resp)
        json_list = resp.json()
        self.assertEquals(len(json_list), 3, 'Training names count')
        self.assertEquals(
            set(json_list),
            {'присед', 'тяга', 'жим'}
        )

    def test_trainings_statuses(self):
        resp_started = self.client.get(
            reverse('training-list'),
            {'status': 'st'}
        )
        self.assertStatusOk(resp_started)
        self.assertEquals(len(resp_started.json()), 1, 'Must be 1 started training')

        resp_finished = self.client.get(
            reverse('training-list'),
            {'status': 'fn'}
        )
        self.assertStatusOk(resp_finished)
        self.assertEquals(len(resp_finished.json()), 35, 'Must be 35 finished trainings')

        resp_finished = self.client.get(
            reverse('training-list'),
            {'status': 'nonexistent'}
        )
        self.assertStatusCode(resp_finished, status.HTTP_400_BAD_REQUEST)


    def test_training_details_get(self):
        id_ = 36
        resp = self.client.get(reverse('training-detail', kwargs={'pk': id_}))
        self.assertStatusOk(resp)
        json_detail = resp.json()
        self.assertGreaterEqual(
            set(json_detail.keys()),
            {'id', 'date', 'name', 'sets'},
            'Training: missed fields'
        )
        self.assertEqual(json_detail['id'], id_)

    def test_training_sets_get(self):
        training_id = 36
        resp = self.client.get(
            reverse('training-set-list', kwargs={'training_id': training_id})
        )
        self.assertStatusOk(resp)
        json_list = resp.json()
        self.assertEqual(len(json_list), 12, 'Count of sets for 36 must be 12 in fixtures')
        self.assertAllEqualsByField(json_list, training_id, lookup_field='training',
                                    msg='Sets must be belong to training.')

    def test_set_detail_get(self):
        set_id = 520
        resp = self.client.get(
            reverse('set-detail', kwargs={'pk': set_id})
        )
        self.assertStatusOk(resp)
        json_detail = resp.json()
        self.assertGreaterEqual(
            set(json_detail.keys()),
            {'id', 'training', 'weight', 'reps', 'started_at', 'stopped_at'},
            'Set: missed fields'
        )
        self.assertEqual(json_detail['id'], set_id)

    def test_user_get(self):
        current_user_resp = self.client.get(
            reverse('user-detail', kwargs={'pk': 'me'})
        )
        self.assertStatusOk(current_user_resp)
        json_detail = current_user_resp.json()
        self.assertEquals(
            set(json_detail.keys()),
            {'id', 'username', 'first_name', 'last_name', 'email'},
            'Users fields does not much.'
        )

        me_id = json_detail['id']
        self.assertStatusCode(
            self.client.put(
                reverse('user-detail', kwargs={'pk': me_id}),
                data=json.dumps({'username': 'name'}),
                content_type='application/json'
            ),
            status.HTTP_405_METHOD_NOT_ALLOWED
        )

        self.assertStatusCode(
            self.client.delete(reverse('user-detail', kwargs={'pk': me_id})),
            status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def test_settings_get(self):
        user_settings_resp = self.client.get(
            reverse('user-settings')
        )
        self.assertStatusOk(user_settings_resp)
        json_settings = user_settings_resp.json()
        self.assertEquals(
            set(json_settings.keys()),
            {'lang', 'set_type', 'set_weight', 'set_reps'},
            'User settings keys'
        )
        self.assertEquals(
            json_settings,
            UserSettings.default(),
            'User default settings'
        )


class RestPermissionsTestCase(RestAppTestCaseMixin, AuthTestCaseMixin, AssertTestCaseMixin, TestCase):

    fixtures = ['testdata']

    def setUp(self):
        self._fixtures_cred = dict(username='testuser', password='user12345')
        self._new_cred = dict(username='testperm', password='user54321')
        self._user = self.create_user(**self._new_cred)

    def test(self):

        self.assertTrue(
            self.client.login(**self._fixtures_cred),
            'Cannot login by fixture user'
        )
        trainings = self.get_trainings_json()
        self.assertTrue(len(trainings), 'Empty trainings list from fixtures')
        training = trainings[0]
        sets = self.get_sets_json(training['id'])
        self.assertTrue(len(sets), 'Empty sets list from fixtures')
        set_ = sets[0]

        self.assertTrue(
            self.client.login(**self._new_cred),
            'Cannot login by new user'
        )

        # TRAININGS

        self.assertFalse(
            len(self.get_trainings_json()),
            'Trainings list must be empty for new user'
        )
        self.assertStatusCode(
            self.client.get(reverse('training-detail', kwargs={'pk': training['id']})),
            status.HTTP_404_NOT_FOUND
        )
        self.assertStatusCode(
            self.client.put(
                reverse('training-detail', kwargs={'pk': training['id']}),
                data=json.dumps({'name': 'name'}),
                content_type='application/json'
            ),
            status.HTTP_404_NOT_FOUND
        )
        self.assertStatusCode(
            self.client.delete(reverse('training-detail', kwargs={'pk': training['id']})),
            status.HTTP_404_NOT_FOUND
        )

        # TRAINING NAMES

        self.assertEquals(len(self.get_training_names_json()), 0,
                          'Names must be empty for new user')

        # SETS
        self.assertStatusCode(
            self.client.get(reverse('training-set-list', kwargs={'training_id': training['id']})),
            status.HTTP_404_NOT_FOUND
        )
        self.assertStatusCode(
            self.client.post(
                reverse('set-list'),
                data={'weight': 35, 'reps': 10, 'training': training['id']}
            ),
            status.HTTP_404_NOT_FOUND
        )
        self.assertStatusCode(
            self.client.get(reverse('set-detail', kwargs={'pk': set_['id']})),
            status.HTTP_404_NOT_FOUND
        )
        self.assertStatusCode(
            self.client.put(
                reverse('set-detail', kwargs={'pk': set_['id']}),
                data=json.dumps({'weight': 55, 'reps': 7}),
                content_type='application/json'
            ),
            status.HTTP_404_NOT_FOUND
        )
        self.assertStatusCode(
            self.client.delete(reverse('set-detail', kwargs={'pk': set_['id']})),
            status.HTTP_404_NOT_FOUND
        )


class RestTrainingAndSettingsChangesTestCase(RestAppTestCaseMixin, AuthTestCaseMixin, AssertTestCaseMixin, TestCase):

    def setUp(self):
        credentials = dict(username='testchanges', password='user12345')
        self._user = self.create_user(**credentials)
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
        trainings = self.get_trainings_json()
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
        self.assertStatusOk(update_resp)

        # check from changing response
        updated_json = update_resp.json()
        self.assertEqual(updated_json['name'], training_name2)

        # check from list response
        self.assertEqual(self.get_trainings_json()[0]['name'], training_name2)

        # DELETE

        delete_resp = self.client.delete(reverse('training-detail', kwargs={'pk': training_id}))
        self.assertStatusCode(delete_resp, status.HTTP_204_NO_CONTENT)

        self.assertEqual(len(self.get_trainings_json()), 0, 'Trainings must be empty')

    def test_user_settings(self):
        default_settings = self.get_user_settings_json()
        new_settings = {
            'lang': 'en',
            'set_type': 'by_start',
            'set_weight': 100,
            'set_reps': 100
        }
        self.assertStatusOk(self.client.put(
            reverse('user-settings'),
            data=json.dumps(new_settings),
            content_type='application/json'
        ))
        self.assertEquals(
            self.get_user_settings_json(),
            new_settings,
            'Settings batch updating'
        )
        invalid_settings = {
            'lang': 'nonlang',
            'set_type': 'nonesettype',
            'set_weight': -10,
            'set_reps': -10
        }
        bad_update_resp = self.client.put(
            reverse('user-settings'),
            data=json.dumps(invalid_settings),
            content_type='application/json'
        )
        self.assertStatusCode(bad_update_resp, status.HTTP_400_BAD_REQUEST)
        self.assertEquals(
            bad_update_resp.json().keys(),
            invalid_settings.keys(),
            'Bad request error keys does not match keys of invalid settings'
        )
        self.assertEquals(
            self.get_user_settings_json(),
            new_settings,
            'Settings is broken after invalid updating'
        )

        actual_settings = dict(new_settings)
        for k, v in default_settings.items():
            with self.subTest(setting_key=k, setting_value=v):
                actual_settings[k] = v
                self.assertStatusOk(self.client.put(
                    reverse('user-settings'),
                    data=json.dumps({k: v}),
                    content_type='application/json'
                ))
                self.assertEquals(
                    self.get_user_settings_json(),
                    actual_settings,
                    'Update single setting'
                )


class RestSetChangesTestCase(RestAppTestCaseMixin, AuthTestCaseMixin, AssertTestCaseMixin, TestCase):

    def setUp(self):
        credentials = dict(username='testchanges', password='user12345')
        self._user = self.create_user(**credentials)
        assert self.client.login(**credentials), 'Cannot login'
        self._training = self.create_test_training(name='testgym')

    def test_set(self):
        """Sets: create, update, delete"""

        training_id = self._training['id']

        started_on_create_str = '2017-12-20T17:11:45Z'
        stopped_on_create_str = '2017-12-20T17:17:28Z'

        # CREATE

        create_resp = self.client.post(
            reverse('set-list'),
            data={
                'weight': 35,
                'reps': 10,
                'training': training_id,
                'started_at': started_on_create_str,
                'stopped_at': stopped_on_create_str
            }
        )
        self.assertStatusCode(create_resp, status.HTTP_201_CREATED)
        created_json = create_resp.json()
        self.assertEqual(created_json['weight'], 35)
        self.assertEqual(created_json['reps'], 10)
        self.assertEquals(
            dt_parser.parse(created_json['started_at']),
            dt_parser.parse(started_on_create_str)
        )
        self.assertEquals(
            dt_parser.parse(created_json['stopped_at']),
            dt_parser.parse(stopped_on_create_str)
        )


        sets = self.get_sets_json(training_id)
        self.assertEqual(len(sets), 1)
        self.assertEqual(sets[0]['weight'], 35)
        self.assertEqual(sets[0]['reps'], 10)
        self.assertEquals(
            dt_parser.parse(sets[0]['started_at']),
            dt_parser.parse(started_on_create_str)
        )
        self.assertEquals(
            dt_parser.parse(sets[0]['stopped_at']),
            dt_parser.parse(stopped_on_create_str)
        )

        set_id = sets[0]['id']

        # UPDATE

        started_on_update_str = '2017-11-10T20:20:20Z'
        stopped_on_update_str = '2017-11-10T20:25:20Z'

        update_resp = self.client.put(
            reverse('set-detail', kwargs={'pk': set_id}),
            data=json.dumps({
                'weight': 55,
                'reps': 7,
                'started_at': started_on_update_str,
                'stopped_at': stopped_on_update_str
            }),
            content_type='application/json'
        )
        self.assertStatusOk(update_resp)

        # check from update response
        updated_json = update_resp.json()
        self.assertEqual(updated_json['weight'], 55)
        self.assertEqual(updated_json['reps'], 7)
        self.assertEquals(
            dt_parser.parse(updated_json['started_at']),
            dt_parser.parse(started_on_update_str)
        )
        self.assertEquals(
            dt_parser.parse(updated_json['stopped_at']),
            dt_parser.parse(stopped_on_update_str)
        )

        # check from list
        sets_updated = self.get_sets_json(training_id)
        self.assertEqual(len(sets_updated), 1)
        self.assertEqual(sets_updated[0]['weight'], 55)
        self.assertEqual(sets_updated[0]['reps'], 7)
        self.assertEquals(
            dt_parser.parse(sets_updated[0]['started_at']),
            dt_parser.parse(started_on_update_str)
        )
        self.assertEquals(
            dt_parser.parse(sets_updated[0]['stopped_at']),
            dt_parser.parse(stopped_on_update_str)
        )

        # DELETE

        delete_resp = self.client.delete(
            reverse('set-detail', kwargs={'pk': set_id})
        )
        self.assertStatusCode(delete_resp, status.HTTP_204_NO_CONTENT)

        sets_deleted = self.get_sets_json(training_id)
        self.assertEqual(len(sets_deleted), 0, "Sets must be empty after deleting")

    def test_set_by_stop(self):
        training_id = self._training['id']
        set_resp = self.client.post(
            reverse('set-list'),
            data={'weight': 45, 'reps': 11, 'training': training_id}
        )
        self.assertStatusCode(set_resp, status.HTTP_201_CREATED)
        set_ = set_resp.json()

        self.assertIsNone(set_['started_at'])
        self.assertIsNotNone(set_['stopped_at'])

    def test_set_by_interval_at_once(self):
        training_id = self._training['id']
        started_str = '2017-12-20T16:33:15Z'
        stopped_str = '2017-12-20T16:38:25Z'

        set_resp = self.client.post(
            reverse('set-list'),
            data={
                'weight': 45,
                'reps': 11,
                'training': training_id,
                'started_at': started_str,
                'stopped_at': stopped_str
            }
        )
        self.assertStatusCode(set_resp, status.HTTP_201_CREATED)

        set_ = set_resp.json()
        self.assertEquals(
            dt_parser.parse(set_['started_at']),
            dt_parser.parse(started_str)
        )
        self.assertEquals(
            dt_parser.parse(set_['stopped_at']),
            dt_parser.parse(stopped_str)
        )

    def test_set_by_interval_2step(self):
        training_id = self._training['id']
        started_str = '2017-12-20T17:11:45Z'
        stopped_str = '2017-12-20T17:17:28Z'

        set1_resp = self.client.post(
            reverse('set-list'),
            data={
                'weight': 65,
                'reps': 10,
                'training': training_id,
                'started_at': started_str,
            }
        )
        self.assertStatusCode(set1_resp, status.HTTP_201_CREATED)

        set1 = set1_resp.json()
        self.assertEquals(
            dt_parser.parse(set1['started_at']),
            dt_parser.parse(started_str)
        )

        set2_resp = self.client.put(
            reverse('set-detail', kwargs={'pk': set1['id']}),
            # todo: fix for change: {'weight': ['This field is required.']}
            data=json.dumps({'weight': set1['weight'], 'reps': 7, 'stopped_at': stopped_str}),
            content_type='application/json'
        )
        self.assertStatusOk(set2_resp)

        set2 = set2_resp.json()

        self.assertEquals(
            dt_parser.parse(set2['started_at']),
            dt_parser.parse(started_str)
        )
        self.assertEquals(
            dt_parser.parse(set2['stopped_at']),
            dt_parser.parse(stopped_str)
        )
