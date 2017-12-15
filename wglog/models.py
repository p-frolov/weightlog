from django.db import models
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
from django.db.models.signals import post_save
from django.dispatch import receiver

from django.contrib.auth.models import User

# about user
# https://docs.djangoproject.com/en/1.11/topics/auth/customizing/#using-a-custom-user-model-when-starting-a-project
# https://simpleisbetterthancomplex.com/tutorial/2017/02/18/how-to-create-user-sign-up-view.html


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    email_confirmed = models.BooleanField(default=False)


@receiver(post_save, sender=User)
def update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    instance.profile.save()


class Training(models.Model):
    """Тренировка"""

    STARTED = 'ST'
    FINISHED = 'FN'

    STATUSES = (
        (STARTED, _('Started')),
        (FINISHED, _('Finished'))
    )

    date = models.DateTimeField(_('date'), default=timezone.now)
    name = models.CharField(_('name'), max_length=250)
    status = models.CharField(
        max_length=2,
        choices=STATUSES,
        default=STARTED
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
