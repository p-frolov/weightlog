from django.views.decorators.http import require_http_methods
from django.shortcuts import render, redirect
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_text
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from django.contrib.sites.shortcuts import get_current_site

from wglog.models import User
from wglog.forms import UserCreationForm
from wglog.tokens import account_activation_token


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
            user = form.save(commit=False)
            user.is_active = False
            form.save()
            current_site = get_current_site(request)
            subject = 'Activate Your WeightLog Account'
            message = render_to_string('wglog_html/auth/register_activation_email.html', {
                'user': user,
                'domain': current_site.domain,
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                'token': account_activation_token.make_token(user)
            })
            user.email_user(subject, message)
            return redirect('register_activation_sent')
    else:
        form = UserCreationForm()
    return render(request, 'wglog_html/auth/register_form.html', {'form': form})


@require_http_methods(['GET'])
def register_activation_sent(request):
    # todo: check before render
    return render(request, 'wglog_html/auth/register_activation_sent.html')


@require_http_methods(['GET'])
def register_activate(request, uidb64, token):
    try:
        uid = force_text(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and account_activation_token.check_token(user, token):
        user.is_active = True
        user.profile.email_confirmed = True
        user.save()
        login(request, user)
        # todo: activation success page
        return redirect('index')

    return render(request, 'wglog_html/auth/register_activation_invalid.html')
