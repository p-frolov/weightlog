from rest_framework import serializers

from wglog.models import Training, Set


class TrainingSerializer(serializers.ModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='training-detail', read_only=True)
    sets_url = serializers.HyperlinkedIdentityField(
        view_name='set-list-bytraining',
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
