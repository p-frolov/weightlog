from django.contrib import admin

from .models import Training, Set


# @admin.register(Set)
# class SetAdmin(admin.ModelAdmin):
#     list_display = ('weight', 'reps')


class SetInline(admin.TabularInline):
    model = Set
    ordering = ['created_at', 'id']


@admin.register(Training)
class TrainingAdmin(admin.ModelAdmin):
    list_display = ('date', 'name', 'user')
    readonly_fields = ('date',)
    inlines = [SetInline]
    ordering = ['-date']
