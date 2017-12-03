from django.db import models
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _

from django.contrib.auth.models import User


class Training(models.Model):
    """Тренировка"""

    date = models.DateTimeField(_('date'), default=timezone.now)
    name = models.CharField(_('name'), max_length=250)

    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='trainings',
        verbose_name=_('user')
    )

    def __str__(self):
        return self.name


class Set(models.Model):
    """Подходы (вес, повторения, время)"""

    weight = models.PositiveIntegerField(_('weight'))
    reps = models.PositiveIntegerField(_('repetitions'))
    created_at = models.DateTimeField(_('updated'), auto_now_add=True)

    training = models.ForeignKey(
        Training,
        on_delete=models.PROTECT,
        related_name='sets',
        verbose_name=_('training')
    )

    def __str__(self):
        return '{} x{}'.format(self.weight, self.reps)
