from django.test import TestCase
from django.contrib import auth

from .models import User


class AuthTestCaseMixin:
    """ Requires django.contrib.auth, integrates to django.test.TestCase"""
    __slots__ = ()

    @property
    def current_user(self):
        assert isinstance(self, TestCase)
        return auth.get_user(self.client)

    def create_user(self, username, password):
        """Returns created test user"""
        # todo: extract flags
        user = User.objects.create_user(username=username,
                                        password=password, is_active=True)
        user.profile.email_confirmed = True
        user.save()
        return user


class AssertTestCaseMixin:
    """Additional asserts"""
    __slots__ = ()

    def assertStatusCode(self, response, expected_code):
        assert isinstance(self, TestCase)
        err_msg = 'Wrong status for: "{}", body: {}'.format(
            response.request.get('PATH_INFO', "key error: request['PATH_INFO']"),
            response.data
        )
        self.assertEqual(response.status_code, expected_code, err_msg)

    def assertAllEqualsByField(self, list_: list, value, lookup_field='id', msg=''):
        """All fields in list of dictionary equals value"""
        assert isinstance(self, TestCase)
        if list_:
            self.assertTrue(lookup_field in list_[0].keys(),
                            'No "{}" in dicts of list'.format(lookup_field))
        self.assertTrue(
            all(item[lookup_field] == value for item in list_),
            '{}All {} must be {}, difference list({})'.format(
                msg + ' ' if msg else '',
                lookup_field,
                value,
                [item[lookup_field] for item in list_ if item[lookup_field] != value]
            )
        )
