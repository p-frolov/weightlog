from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
# from django.http import HttpResponse


# https://docs.djangoproject.com/en/1.11/topics/auth/default/
# The login_required decorator does NOT check the is_active flag on a user
@login_required(login_url='login')
def index(request):
    return render(request, 'wglog_html/index.html')
