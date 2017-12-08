from django.contrib import auth


class AuthTestCaseMixin:
    """ Requires django.contrib.auth, integrates to django.test.TestCase"""
    __slots__ = ()

    @property
    def current_user(self):
        return auth.get_user(self.client)


class AssertTestCaseMixin:
    """Additional asserts"""
    __slots__ = ()

    def assertStatusCode(self, response, expected_code):
        err_msg = 'Wrong status for: "{}"'.format(
            response.request.get('PATH_INFO', "key error: request['PATH_INFO']")
        )
        self.assertEqual(response.status_code, expected_code, err_msg)

    def assertAllEqualsByField(self, list_: list, value, lookup_field='id', msg=''):
        """All fields in list of dictionary equals value"""
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

    def assertSetContainsSet(self, set_: set, expected: set, msg=""):
        self.assertTrue(expected <= set_, '{}Missed: ({})'.format(
            msg + ' ' if msg else '',
            expected - set_
        ))
