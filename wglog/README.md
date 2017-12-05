# Weight Log Core

## Overview

core application of WeightLog project

## Installation

todo: .venv

## Setup

```bash
python manage.py migrate
python manage.py createsuperuser
```

## Run

```bash
python manage.py runserver
```
- http://localhost:8000/admin/
- http://localhost:8000/
- http://localhost:8000/api/rest/

## Tests

```bash
python manage.py test wglog wglog_html wglog_rest
```

## Fixtures (test data)

```bash
python manage.py loaddata testdata.json
python manage.py runserver
```

- http://127.0.0.1:8000/api/rest/
- Login testuser:user12345

## Deploy

todo: