from rest_framework import serializers
from .models import UserProfile, Union, Request, Document
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import transaction
import json
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        return token

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone_number', 'national_id', 'is_verified', 'is_admin']

class UnionSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)
    class Meta:
        model = Union
        fields = [
            'id', 'user','name', 'headOfUnion', 'region', 'economicCode', 'fiscalYear', 'code',
            'audit_status', 'registration_status', 'submitted_at',
            'approved_at', 'rejected_at', 'rejection_reason', 'financial_data','phone_number'
        ]
        extra_kwargs = {
            'user': {'required': False}
        }

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'file', 'category', 'uploaded_at']

class RequestSerializer(serializers.ModelSerializer):
    documents = DocumentSerializer(many=True, read_only=True)
    uploaded_files = serializers.ListField(
        child=serializers.FileField(max_length=100000, allow_empty_file=False),
        write_only=True,
        required=True
    )
    categories = serializers.ListField(
        child=serializers.ChoiceField(choices=Document.CATEGORY_CHOICES),
        write_only=True,
        required=True
    )

    class Meta:
        model = Request
        fields = [
            'id', 'union', 'financial_data', 'is_approved',
            'approval_comment', 'created_at', 'documents',
            'uploaded_files', 'categories'
        ]

    def validate(self, data):
        if len(data['uploaded_files']) != len(data['categories']):
            raise serializers.ValidationError("Number of files must match number of categories")
        return data

    def _parse_financial_data(self, value):
        # value ممکنه dict یا رشته JSON باشه
        if value is None:
            return None
        if isinstance(value, dict):
            return value
        if isinstance(value, str) and value.strip():
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError({"financial_data": "Invalid JSON format"})
        return None

    @transaction.atomic
    def create(self, validated_data):
        uploaded_files = validated_data.pop('uploaded_files', [])
        categories = validated_data.pop('categories', [])

        # اگه از فرانت رشته JSON میاد، تبدیلش کن به dict
        validated_data['financial_data'] = self._parse_financial_data(
            validated_data.get('financial_data')
        )

        req = Request.objects.create(**validated_data)

        user = None
        request_obj = self.context.get('request')
        if request_obj and hasattr(request_obj, 'user'):
            user = request_obj.user

        for file_obj, cat in zip(uploaded_files, categories):
            Document.objects.create(
                request=req,
                file=file_obj,
                category=cat,
                uploaded_by=user if getattr(user, 'is_authenticated', False) else None
            )

        return req