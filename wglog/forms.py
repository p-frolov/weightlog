from django import forms
import django.contrib.auth.forms as auth_form

from .models import User

class UserCreationForm(auth_form.UserCreationForm):
    email = forms.EmailField(max_length=254, help_text='Required. Inform a valid email address.')

    class Meta(auth_form.UserCreationForm.Meta):
        model = User
        fields = auth_form.UserCreationForm.Meta.fields + ('email',)
