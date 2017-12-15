# -*- coding: utf-8 -*-
# Generated by Django 1.11.7 on 2017-12-15 08:13
from __future__ import unicode_literals

from django.db import migrations, models

def make_all_trainings_finished(apps, shema_editor):
    Training = apps.get_model('wglog', 'Training')
    Training.objects.all().update(status='fn')

class Migration(migrations.Migration):

    dependencies = [
        ('wglog', '0002_profile'),
    ]

    operations = [
        migrations.AddField(
            model_name='training',
            name='status',
            field=models.CharField(choices=[('st', 'Started'), ('fn', 'Finished')], default='st', max_length=2),
        ),
        migrations.RunPython(make_all_trainings_finished, lambda *a, **k: None)
    ]