from django.db import models
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
from django.db.models.signals import post_save
from django.dispatch import receiver

from django.contrib.postgres import fields as pgfields
from django.contrib.auth.models import User

# about user
# https://docs.djangoproject.com/en/1.11/topics/auth/customizing/#using-a-custom-user-model-when-starting-a-project
# https://simpleisbetterthancomplex.com/tutorial/2017/02/18/how-to-create-user-sign-up-view.html


class AppSettings:
    """Settings for whole applicaion"""

    LANGS = {
        'ru': 'Русский',
        'en': 'English'
    }

    SET_TYPES = {
        'by_stop': _('By finish'),
        'by_start': _('By start')
    }

    @staticmethod
    def get():
        return dict(
            min_weight=Set.MIN_WEIGHT,
            max_weight=Set.MAX_WEIGHT,
            min_reps=Set.MIN_REPS,
            max_reps=Set.MAX_REPS,
            langs=AppSettings.LANGS,
            set_types=AppSettings.SET_TYPES
        )

class UserSettings:
    """User settings are stored in profile"""

    # https://docs.djangoproject.com/en/2.0/ref/contrib/postgres/fields/#django.contrib.postgres.fields.JSONField
    # default must be callable
    @staticmethod
    def default():
        return dict(
            lang='ru',
            set_type='by_stop',
            set_weight=20,
            set_reps=10
        )


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    email_confirmed = models.BooleanField(default=False)
    settings = pgfields.JSONField(default=UserSettings.default)


# todo: investigate
# http://www.django-rest-framework.org/api-guide/serializers/#handling-saving-related-instances-in-model-manager-classes
@receiver(post_save, sender=User)
def update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    instance.profile.save()


class TrainingName(models.Model):
    """Название тренировки, общий, дополняемый список, для всех"""
    text = models.CharField(_('name'), max_length=250, unique=True)


class Training(models.Model):
    """Тренировка"""

    STARTED = 'st'
    FINISHED = 'fn'

    STATUSES = (
        (STARTED, _('Started')),
        (FINISHED, _('Finished'))
    )

    date = models.DateTimeField(_('date'), default=timezone.now)

    status = models.CharField(
        max_length=2,
        choices=STATUSES,
        default=STARTED
    )

    name = models.ForeignKey(
        TrainingName,
        on_delete=models.PROTECT,
        verbose_name=_('name')
    )

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

    MIN_WEIGHT = 1
    MAX_WEIGHT = 600
    MIN_REPS = 1
    MAX_REPS = 999

    weight = models.PositiveIntegerField(_('weight'))
    reps = models.PositiveIntegerField(_('repetitions'))

    started_at = models.DateTimeField(_('started at'), null=True)
    """Start time of set, value - if set is started manually, null if set is filled by end fact"""

    # todo: validate no less than started (? and training date)
    stopped_at = models.DateTimeField(_('stopped at'), default=timezone.now)
    """Stop time of set"""

    training = models.ForeignKey(
        Training,
        on_delete=models.CASCADE,
        related_name='sets',
        verbose_name=_('training')
    )

    def __str__(self):
        return '{} x{}'.format(self.weight, self.reps)
