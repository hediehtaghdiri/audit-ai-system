from django.contrib import admin
from .models import UserProfile, Union, Request, VerificationCode

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'national_id', 'is_verified')

@admin.register(Union)
class UnionAdmin(admin.ModelAdmin):
    list_display = ('name', 'headOfUnion')
    actions = ['approve_unions']

    def approve_unions(self, request, queryset):
        queryset.update(is_approved=True)
    approve_unions.short_description = "Approve selected unions"

@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    list_display = ('union','is_approved','financial_data')
    actions = ['approve_requests']

    def approve_requests(self, request, queryset):
        queryset.update(is_approved=True)
    approve_requests.short_description = "Approve selected requests"
