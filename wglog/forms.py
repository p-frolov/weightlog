import django.contrib.auth.forms as auth_form
from .models import User

class UserCreationForm(auth_form.UserCreationForm):

    class Meta(auth_form.UserCreationForm.Meta):
        model = User
        fields = auth_form.UserCreationForm.Meta.fields + ('email',)
