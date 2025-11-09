# urls.py (جدید: برای مپ کردن APIهای views.py به URLها - فرض کنید در اپ unions قرار داره)

from django.urls import path
from .views import (
    SendSMSView,
    VerifySMSView,
    AdminLoginView,
    RegisterUnionView,
    CreateRequestView,
    ApproveUnionView,
    UpdateFinancialDataView,
    UserUnionDetailView,
    AllUnionsView,
    UserAuditDetailView
)

urlpatterns = [
    path('send-sms/', SendSMSView.as_view(), name='send-sms'),
    path('verify-sms/', VerifySMSView.as_view(), name='verify-sms'),
    path('admin-login/', AdminLoginView.as_view(), name='admin-login'),
    path('unions/register/', RegisterUnionView.as_view(), name='register-union'),
    path('requests/create/', CreateRequestView.as_view(), name='create-request'),
    path('unions/<int:union_id>/approve/', ApproveUnionView.as_view(), name='approve-union'),  # تغییر: url برای approve/reject (از union_id استفاده می‌کنه)
    path('financial-data/', UpdateFinancialDataView.as_view(), name='update-financial-data'),
    path('unions/my-union/', UserUnionDetailView.as_view(), name='my-union'),
    path('request/my-request/', UserAuditDetailView.as_view(), name='my-request'),
    path('unions/', AllUnionsView.as_view(), name='all-unions'),  # تغییر: url جدید برای لیست تمام اتحادیه‌ها
]