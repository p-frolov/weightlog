from django.core.exceptions import ObjectDoesNotExist
from django.utils.encoding import smart_text

from rest_framework import serializers

from wglog.models import Training, Set, User, TrainingName, AppSettings


# https://stackoverflow.com/questions/28009829/creating-and-saving-foreign-key-objects-using-a-slugrelatedfield
class CreatableSlugRelatedField(serializers.SlugRelatedField):
    def to_internal_value(self, data):
        try:
            return self.get_queryset().get_or_create(**{self.slug_field: data})[0]
        except ObjectDoesNotExist:
            self.fail('does_not_exist', slug_name=self.slug_field, value=smart_text(data))
        except (TypeError, ValueError):
            self.fail('invalid')


class TrainingSerializer(serializers.ModelSerializer):
    name = CreatableSlugRelatedField(
        slug_field='text',
        queryset=TrainingName.objects.all()
    )
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )
    url = serializers.HyperlinkedIdentityField(view_name='training-detail', read_only=True)
    sets_url = serializers.HyperlinkedIdentityField(
        view_name='training-set-list',
        lookup_field='id',
        lookup_url_kwarg='training_id',
        read_only=True
    )

    class Meta:
        model = Training
        fields = ('id', 'date', 'name', 'status', 'sets',
                  'url', 'sets_url', 'user')
        read_only_fields = ('date', 'sets')
        depth = 1  # show sets as objects instead of identifiers


# todo: validate stopped: no less than started (? and training date)
# http://www.django-rest-framework.org/api-guide/serializers/#validation
# todo: partial update
# http://www.django-rest-framework.org/api-guide/serializers/#partial-updates
class SetSerializer(serializers.ModelSerializer):
    url = serializers.HyperlinkedIdentityField(
        view_name='set-detail',
        read_only=True
    )
    training_url = serializers.HyperlinkedIdentityField(
        view_name='training-detail',
        lookup_field='training_id',
        lookup_url_kwarg='pk',
        read_only = True
    )

    class Meta:
        model = Set
        fields = ('id', 'training', 'weight', 'reps', 'started_at', 'stopped_at',
                  'url', 'training_url')
        read_only_fields = ('training',)


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email')
        read_only_fields = ('username', 'email')


class SettingsSerializer(serializers.Serializer):

    lang = serializers.ChoiceField(
        list(AppSettings.LANGS.items())
    )
    set_type = serializers.ChoiceField(
        list(AppSettings.SET_TYPES.items())
    )
    set_weight = serializers.IntegerField(
        min_value=Set.MIN_WEIGHT,
        max_value=Set.MAX_WEIGHT
    )
    set_reps = serializers.IntegerField(
        min_value=Set.MIN_WEIGHT,
        max_value=Set.MAX_REPS
    )

    def save(self, user: User):
        profile = user.profile
        for k, v in self.validated_data.items():
            profile.settings[k] = v
        profile.save()
