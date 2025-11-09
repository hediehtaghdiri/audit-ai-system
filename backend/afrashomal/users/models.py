from django.db import models
from django.contrib.auth.models import User
import json

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    phone_number = models.CharField(max_length=11, unique=True)
    national_id = models.CharField(max_length=10, unique=True)
    role = models.CharField(max_length=20, choices=[('union', 'Union'), ('admin', 'Admin')], default='union')
    is_verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.phone_number

class Union(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='unions')
    name = models.CharField(max_length=200)
    headOfUnion = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    economicCode = models.CharField(max_length=50, unique=True)
    fiscalYear = models.CharField(max_length=4)
    code = models.CharField(max_length=50, unique=True)
    audit_status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('required', 'Required'), ('not_required', 'Not Required'), ('completed', 'Completed')],
        default='completed'
    )
    registration_status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
        default='pending'
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    financial_data = models.JSONField(null=True, blank=True)  # برای ذخیره annualRevenue, totalAssets و غیره
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Document(models.Model):
    CATEGORY_CHOICES = [
        ('balance_sheet', 'ترازنامه'),
        ('profit_loss', 'سود و زیان'),
        ('cash_flow', 'جریان نقدی'),
        ('other', 'سایر'),
    ]

    request = models.ForeignKey('Request', on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='requests/%Y/%m/%d/')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.get_category_display()} - {self.request.union.name}"

class Request(models.Model):
    union = models.ForeignKey(Union, on_delete=models.CASCADE, related_name='requests')
    financial_data = models.JSONField(null=True, blank=True)  # برای ذخیره annualRevenue, totalAssets, ...
    is_approved = models.BooleanField(default=False)
    approval_comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)


        if self.financial_data:
            fd = self.financial_data
            audit_required = (
                fd.get('annualRevenue', 0) > 5000000000 or
                fd.get('totalAssets', 0) > 3000000000 or
                fd.get('governmentSupport', False) or
                fd.get('memberCount', 0) > 500
            )
            self.union.audit_status = 'required' if audit_required else 'not_required'
            self.union.financial_data = fd
            self.union.save()

    def __str__(self):
        return f"Request for {self.union.name}"

class VerificationCode(models.Model):
    phone_number = models.CharField(max_length=11)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"Code for {self.phone_number}"