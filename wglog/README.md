# Overview

core application of WeightLog project

# Installation

todo: .venv

# Setup

``` sh
python manage.py migrate
python manage.py createsuperuser
```

# Run

``` sh
python manage.py runserver
http://127.0.0.1:8000/api/rest/
```

# Fixtures (test data)

``` sh
python manage.py loaddata testdata.json
python manage.py runserver
http://127.0.0.1:8000/api/rest/
Login testuser:user12345
```

# Deploy

todo: