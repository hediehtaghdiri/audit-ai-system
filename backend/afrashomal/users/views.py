# views.py (کامل با تغییرات قبلی - بدون تغییر اضافی، فقط API جدید و اصلاح ApproveUnionView)

import stat
from django.utils.formats import number_format
from rest_framework.utils import serializer_helpers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile, Union, Request, VerificationCode
from .serializers import UserProfileSerializer, UnionSerializer, RequestSerializer
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import random
import logging
import string
try:
        import json
except ImportError:
        import simplejson as json
from datetime import datetime, timedelta, timezone
from django.http import JsonResponse
import requests
from rest_framework import status
from django.utils import timezone

logger = logging.getLogger(__name__)


def send_sms(phone_number, code):
    
    api_key = '69447532697341394D794D35547944657253543432776748336B626F30544A53785A3432764E31653555493D'  # جایگزین با کلید API خود
    sender = '1000596446' 
    receptor = phone_number  
    message = f"کد ورود به سامانه اتحادیه صنفی \n{code}"  

    url = 'https://api.kavenegar.com/v1/{}/sms/send.json'.format(api_key)
    data = {
        'receptor': receptor,
        'message': message,
        'sender': sender
    }

    response = requests.post(url, data=data)
    return JsonResponse(response.json())


@method_decorator(csrf_exempt, name='dispatch')
class SendSMSView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request):

        data = request.data
        print(data)
        phone_number = data.get('phoneNumber')
        national_id = data.get('nationalId')
        print(f"شماره تلفن: {phone_number}, کد ملی: {national_id}")

        user, created = UserProfile.objects.get_or_create(
            phone_number=phone_number,
            defaults={'national_id': national_id}
        )


        code = ''.join(random.choices(string.digits, k=6))
        print(f"کد تولید شده: {code}")
        VerificationCode.objects.create(
            phone_number=phone_number,
            code=code,
            expires_at=datetime.now() + timedelta(minutes=5)
        )
        print(code)
        code1 = int(code)


        try:
            send_sms(phone_number, code1)
            logger.info(f"SMS به {phone_number} ارسال شد")
            print(f"SMS به {phone_number} ارسال شد")
        except Exception as e:
            logger.error(f"خطا در ارسال SMS: {str(e)}")
            print(f"خطا در ارسال SMS: {str(e)}")
            print("User in request:", request.user)
            print("Is authenticated:", request.user.is_authenticated)

        return Response({
                        'message': 'SMS sent',
                         'debug_code': code
                         }, status=status.HTTP_200_OK)

@method_decorator(csrf_exempt, name='dispatch')
class VerifySMSView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request):

        data =request.data
        print('verify-sms:',data)

        phone_number = data.get('phoneNumber')
        national_id = data.get('nationalId')
        sms_code = data.get('smsCode')

        try:
            verification = VerificationCode.objects.get(
                phone_number=phone_number,
                code=sms_code,
                expires_at__gt=timezone.now()
            )
            user_profile, created = UserProfile.objects.get_or_create(
                phone_number=phone_number,
                defaults={'national_id': request.data.get('nationalId', ''), 'is_verified': True}
            )




            if not user_profile.user:
                django_user, _ = User.objects.get_or_create(username=phone_number)
                user_profile.user = django_user
                user_profile.save()
            refresh = RefreshToken.for_user(user_profile.user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            response = Response({
                'message': 'ورود موفق',
                'access': access_token,
                'refresh': refresh_token}, status=status.HTTP_200_OK)
            response.set_cookie(
                key='access_token',
                value=access_token,
                httponly=False,
                secure=False,  # توی لوکال‌هاست false، توی پروداکشن true
                samesite='Lax',
                max_age=3600  
            )
            response.set_cookie(
                key='refresh_token',
                value=refresh_token,
                httponly=False,
                secure=False,
                samesite='Lax',
                max_age=86400  
            )
            print("✅ Tokens set in cookies.")
            return response

        except VerificationCode.DoesNotExist:
            return Response({'error': 'Invalid or expired code'}, status=status.HTTP_400_BAD_REQUEST)


class AdminLoginView(APIView):
    def post(self, request):

        phone_number = request.data.get('phone_number')
        national_id = request.data.get('national_id')

        if phone_number == '09000000000' and national_id == '0000000000':
            user, _ = UserProfile.objects.get_or_create(
                phone_number=phone_number,
                national_id=national_id,
                defaults={'role': 'admin', 'is_verified': True}
            )
            refresh = RefreshToken.for_user(user.user if user.user else user)
            return Response({
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid admin credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class RegisterUnionView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # فقط کاربران لاگین شده بتونن ثبت کنن

    def post(self, request, *args, **kwargs):
        # کد بدون تغییر
        print("Incoming headers:", request.headers)
        print('register-data:',request.data)
        logger.info("درخواست ثبت اتحادیه دریافت شد")
        logger.info(f"کاربر درخواست: {request.user}, پروفایل: {getattr(request.user, 'userprofile', None)}")
        logger.info(f"داده‌های درخواست: {request.data}")
        try:
            user_profile = request.user.userprofile
        except AttributeError:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)

        if Union.objects.filter(user=user_profile).exists():
            return Response({'error': 'You have already registered a union.'},
                            status=status.HTTP_200_OK)

        serializer = UnionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=user_profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_200_OK)


class CreateRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            user_profile = request.user.userprofile
            union = user_profile.unions.first()
            if not union or union.registration_status != 'approved':
                return Response({'error': 'Union not found or not approved'}, status=status.HTTP_403_FORBIDDEN)

            data = {
                'union': union.id,
                'financial_data': request.data.get('financial_data'),
                'uploaded_files': request.FILES.getlist('files'),
                'categories': request.data.getlist('categories'),
            }

            serializer = RequestSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except AttributeError:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)

class ApproveUnionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, union_id):
        try:
            union = Union.objects.get(id=union_id)
            action = request.data.get('action')
            comment = request.data.get('comment', '')
            if action == 'approve':
                union.registration_status = 'approved'
                union.approved_at = timezone.now()
            elif action == 'reject':
                union.registration_status = 'rejected'
                union.rejected_at = timezone.now()
                union.rejection_reason = comment
            union.save()
            return Response({'message': 'Union updated'}, status=status.HTTP_200_OK)
        except Union.DoesNotExist:
            return Response({'error': 'Union not found'}, status=status.HTTP_404_NOT_FOUND)


class UpdateFinancialDataView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            user_profile = request.user.userprofile
            union = user_profile.unions.first()
            if not union:
                return Response({'error': 'Union not found'}, status=status.HTTP_404_NOT_FOUND)

            financial_data = request.data.get('financial_data')
            if not financial_data:
                return Response({'error': 'Financial data required'}, status=status.HTTP_400_BAD_REQUEST)

            union.financial_data = financial_data
            audit_required = (
                financial_data.get('annualRevenue', 0) > 5000000000 or
                financial_data.get('totalAssets', 0) > 3000000000 or
                financial_data.get('governmentSupport', False) or
                financial_data.get('memberCount', 0) > 500
            )
            union.audit_status = 'required' if audit_required else 'not_required'
            union.save()

            serializer = UnionSerializer(union)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except AttributeError:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)



class UserUnionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        logger.info(f"درخواست GET برای UserUnionDetailView توسط کاربر {request.user.username}")
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            
            try:
                union = Union.objects.get(user=user_profile)
                serializer = UnionSerializer(union)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Union.DoesNotExist:
                return Response({'message': 'این کاربر هنوز اتحادیه‌ای ثبت نکرده است.'}, status=status.HTTP_404_NOT_FOUND)
        except UserProfile.DoesNotExist:
            return Response({'error': 'پروفایل کاربر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"خطای غیرمنتظره: {str(e)}")
            return Response({'error': 'خطای سرور'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AllUnionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        unions = Union.objects.all()
        serializer = UnionSerializer(unions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



class UserAuditDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        logger.info(f"درخواست GET برای UserAuditDetailView توسط کاربر {request.user.username}")
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            

            union = Union.objects.filter(user=user_profile).first()
            if not union:
                return Response({'message': 'هیچ اتحادی برای این کاربر ثبت نشده است.'}, status=status.HTTP_404_NOT_FOUND)
            

            audit = Request.objects.filter(union=union).order_by('-created_at').first()
            if not audit:
                return Response({'message': 'این اتحادی هنوز سندی ثبت نکرده است.'}, status=status.HTTP_404_NOT_FOUND)
            
            response_data = {
                "name": union.name,
                "code": union.code,
                "headOfUnion": union.headOfUnion,
                "audit_status": union.audit_status,
                "financial_data": audit.financial_data or union.financial_data
                }
            return Response(response_data, status=status.HTTP_200_OK)

        except UserProfile.DoesNotExist:
            return Response({'error': 'پروفایل کاربر یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"خطای غیرمنتظره: {str(e)}")
            return Response({'error': 'خطای سرور'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

