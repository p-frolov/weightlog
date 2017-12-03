"""
# testuser must be in db

python manage.py shell
from wglog.fixtures.import_txt import import_txt
import_txt('/home/pavel/Projects/Kochka', 'testuser')

to dump fixtures:
python manage.py dumpdata --indent=4 wglog -o wglog/fixtures/testdata.json

apply fixtures
python manage.py loaddata testdata.json
# todo: problem with password
"""

import sys
import os
from datetime import datetime

from wglog.models import *


def import_txt(kochka_lib_path, username):

    sys.path.insert(0, kochka_lib_path)
    import kochkalib

    parser = kochkalib.ExerciseTxtParser(os.path.join(kochka_lib_path, 'data.txt'))

    user = User.objects.get(username=username)

    for e in parser:
        t = Training.objects.create(date=datetime.strptime(e.date, '%Y.%m.%d').date(), name=e.name, user=user)
        for s in e.sets:
            for i in range(s.set_count):
                Set.objects.create(weight=s.weight, reps=s.count, training=t)
