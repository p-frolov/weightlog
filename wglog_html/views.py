from django.views.decorators.http import require_http_methods
from django.shortcuts import render, redirect

from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, authenticate

from wglog.forms import UserCreationForm


# https://docs.djangoproject.com/en/1.11/topics/auth/default/
# The login_required decorator does NOT check the is_active flag on a user


@login_required(login_url='login')
def index(request):
    return render(request, 'wglog_html/index.html')


@require_http_methods(['GET', 'POST'])
def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get('username')
            raw_password = form.cleaned_data.get('password1')
            user = authenticate(username=username, password=raw_password)
            login(request, user)
            return redirect('index')
    else:
        form = UserCreationForm()
    return render(request, 'wglog_html/auth/register_form.html', {'form': form})
