from django.core.exceptions import ObjectDoesNotExist
from django.utils.encoding import smart_text

from rest_framework import serializers

from wglog.models import Training, Set, User, TrainingName


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
    url = serializers.HyperlinkedIdentityField(view_name='training-detail', read_only=True)
    sets_url = serializers.HyperlinkedIdentityField(
        view_name='training-set-list',
        lookup_field='id',
        lookup_url_kwarg='training_id',
        read_only=True
    )

    class Meta:
        model = Training
        fields = ('id', 'date', 'name', 'sets',
                  'user_id',  # for saving
                  'url', 'sets_url')
        read_only_fields = ('date', 'sets')
        depth = 1  # show sets as objects instead of identifiers


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
        fields = ('id', 'weight', 'reps', 'created_at',
                  'training_id',  # training_id for saving
                  'url', 'training_url')
        read_only_fields = ('created_at',)


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email')
        read_only_fields = ('username', 'email')
