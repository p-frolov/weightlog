from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.decorators import api_view

from wglog.models import Training, Set
from .serializers import TrainingSerializer, SetSerializer


@api_view(['GET'])
def api_root(request, format=None):
    return Response({
        'trainings': reverse('training-list', request=request, format=format),
    })


class GetByUserMixin():
    """
    Helper to get objects by user.
    Dependent on APIView.request
    """
    def get_training_or_404(self, id):
        """Returns training by user and id, raises 404 if not found"""
        return get_object_or_404(
            Training.objects.filter(user=self.request.user),
            pk=id
        )


class TrainingsList(APIView):
    """
    List trainings or create new training.
    List limited by 5 by default
    """
    def get(self, request, format=None):

        trainings = Training.objects.prefetch_related('sets'
        ).filter(
            user=request.user
        ).order_by(
            '-date'
        )[:5]

        serializer = TrainingSerializer(trainings, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, format=None):
        serializer = TrainingSerializer(data=request.data, context={'request': request})

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save(user_id=request.user.id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TrainingDetail(GetByUserMixin, APIView):
    """Retrieve, update or delete"""

    def get(self, request, pk, format=None):
        serializer = TrainingSerializer(
            self.get_training_or_404(pk),
            context={'request': request}
        )
        return Response(serializer.data)

    def put(self, request, pk, format=None):

        serializer = TrainingSerializer(
            self.get_training_or_404(pk),
            data=request.data,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk, format=None):
        self.get_training_or_404(pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SetsList(GetByUserMixin, APIView):
    """
    List sets or create new set.
    """
    def get(self, request, training_id, format=None):
        training = self.get_training_or_404(training_id)

        serializer = SetSerializer(
            training.sets.order_by('id'),
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)

    def post(self, request, training_id, format=None):
        serializer = SetSerializer(data=request.data, context={'request': request})

        training = get_object_or_404(
            Training.objects.filter(user=request.user),
            pk=training_id
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save(training_id=training.id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SetDetail(APIView):
    """Retrieve, update or delete"""

    def _get_set(self, request, id):
        return get_object_or_404(
            Set.objects.filter(training__user=request.user),
            pk=id
        )

    def get(self, request, pk, format=None):
        serializer = SetSerializer(
            self._get_set(request, pk),
            context={'request': request}
        )
        return Response(serializer.data)

    def put(self, request, pk, format=None):
        serializer = SetSerializer(
            self._get_set(request, pk),
            data=request.data,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk, format=None):
        self._get_set(request, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)