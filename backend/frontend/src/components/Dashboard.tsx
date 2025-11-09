import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  User, 
  MapPin, 
  FileText, 
  Calendar, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Upload,
  Eye
} from 'lucide-react';

interface Union {
  id: number;
  user: number | string;
  phone_number: string;
  name: string;
  headOfUnion: string;
  region: string;
  code: string;
  economicCode: string;
  registration_status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  rejected_at?: string;
  rejection_reason?: string;
  audit_status?: 'pending' | 'required' | 'not_required' | 'completed';
  fiscalYear?: string; // اختیاری، چون ممکنه همیشه نباشه
  financial_data?: {
    annualRevenue: number;
    totalAssets: number;
    memberCount: number;
    governmentSupport: boolean;
  };
}

interface DashboardProps {
  union: Union;
  onNavigateToUpload: () => void;
  onNavigateToResults: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToUpload, onNavigateToResults }) => {
  const [union, setUnion] = useState<Union | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchUnionData = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('access_token='))
          ?.split('=')[1];

        if (!token) throw new Error('توکن احراز هویت یافت نشد.');

        const response = await fetch('http://api.zer0team.ir/unions/my-union/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'خطا در دریافت اطلاعات');
        }

        const data = await response.json();
        setUnion(data);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'خطای ناشناخته';
      setError(errorMessage);
        setLoading(false);
      }
    };

    fetchUnionData();
  }, []);

  if (loading) return <p>در حال بارگذاری...</p>;
  if (error) return <p>خطا: {error}</p>;
  if (!union) return <p>اطلاعاتی یافت نشد.</p>;

  // Check if union is approved
  if (union.registration_status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50/80 backdrop-blur-xl border border-yellow-200/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500 ml-3" />
            <div>
              <h2 className="text-xl font-bold text-yellow-800">در انتظار تأیید ادمین</h2>
              <p className="text-yellow-700 mt-2">
                درخواست ثبت‌نام اتحادیه شما در حال بررسی توسط ادمین سیستم است. لطفاً صبر کنید تا درخواست شما بررسی و تأیید شود.
              </p>
              <p className="text-sm text-yellow-600 mt-2">
                تاریخ ارسال درخواست: {new Date(union.submitted_at).toLocaleDateString('fa-IR')}
              </p>
              <div className="mt-4 p-3 bg-yellow-100 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>توجه:</strong> پس از تأیید درخواست توسط ادمین، می‌توانید به تمام امکانات سامانه دسترسی داشته باشید.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">اطلاعات ارسال شده</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">نام اتحادیه</p>
              <p className="font-medium text-gray-900">{union.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">رئیس اتحادیه</p>
              <p className="font-medium text-gray-900">{union.headOfUnion}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">منطقه</p>
              <p className="font-medium text-gray-900">{union.region}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">کد اتحادیه</p>
              <p className="font-medium text-gray-900">{union.code}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (union.registration_status === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50/80 backdrop-blur-xl border border-red-200/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-500 ml-3" />
            <div>
              <h2 className="text-xl font-bold text-red-800">درخواست رد شده</h2>
              <p className="text-red-700 mt-2">
                متأسفانه درخواست ثبت‌نام اتحادیه شما رد شده است.
              </p>
              {union.rejection_reason && (
                <div className="mt-3 p-3 bg-red-100 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>دلیل رد:</strong> {union.rejection_reason}
                  </p>
                </div>
              )}
              <p className="text-sm text-red-600 mt-2">
                تاریخ رد: {union.rejected_at ? new Date(union.rejected_at).toLocaleDateString('fa-IR') : ''}
              </p>
              <div className="mt-4 p-3 bg-red-100 rounded-md">
                <p className="text-sm text-red-800">
                  <strong>راهنمایی:</strong> برای رفع مشکلات مطرح شده، لطفاً با ادمین سیستم تماس بگیرید یا مدارک مورد نیاز را تکمیل کرده و مجدداً درخواست دهید.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: Union['audit_status']) => {
    switch (status) {
      case 'required':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'not_required':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: Union['audit_status']) => {
    switch (status) {
      case 'required':
        return 'نیازمند حسابرسی رسمی';
      case 'not_required':
        return 'نیازی به حسابرسی نیست';
      case 'completed':
        return 'حسابرسی انجام شده';
      default:
        return 'در انتظار بررسی';
    }
  };

  const getStatusColor = (status: Union['audit_status']) => {
    switch (status) {
      case 'required':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'not_required':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">خوش آمدید</h1>
          <p className="text-gray-600 mt-1">داشبورد اتحادیه {union.name}</p>
        </div>
      </div>

      {/* Union Information */}
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Building2 className="h-5 w-5 ml-2" />
          اطلاعات اتحادیه
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-center space-x-reverse space-x-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">رئیس اتحادیه</p>
              <p className="font-medium text-gray-900">{union.headOfUnion}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-reverse space-x-3">
            <MapPin className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">منطقه</p>
              <p className="font-medium text-gray-900">{union.region}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-reverse space-x-3">
            <FileText className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">کد اقتصادی</p>
              <p className="font-medium text-gray-900">{union.economicCode}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-reverse space-x-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">سال مالی</p>
              <p className="font-medium text-gray-900">{union.fiscalYear}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-reverse space-x-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">تماس</p>
              <p className="font-medium text-gray-900">{union.phone_number}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-reverse space-x-3">
            <Building2 className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">کد اتحادیه</p>
              <p className="font-medium text-gray-900">{union.code}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Data */}
      {union.financial_data && (
        <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">اطلاعات مالی</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl p-4 shadow-lg">
              <p className="text-sm text-gray-500 mb-1">درآمد سالانه</p>
              <p className="text-lg font-semibold text-gray-900">
                {union.financial_data.annualRevenue.toLocaleString('fa-IR')} ریال
              </p>
            </div>
            
            <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl p-4 shadow-lg">
              <p className="text-sm text-gray-500 mb-1">کل دارایی‌ها</p>
              <p className="text-lg font-semibold text-gray-900">
                {union.financial_data.totalAssets.toLocaleString('fa-IR')} ریال
              </p>
            </div>
            
            <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl p-4 shadow-lg">
              <p className="text-sm text-gray-500 mb-1">تعداد اعضا</p>
              <p className="text-lg font-semibold text-gray-900">
                {union.financial_data.memberCount.toLocaleString('fa-IR')} نفر
              </p>
            </div>
            
            <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl p-4 shadow-lg">
              <p className="text-sm text-gray-500 mb-1">حمایت دولتی</p>
              <p className="text-lg font-semibold text-gray-900">
              {union.financial_data.governmentSupport !== undefined ? (union.financial_data.governmentSupport ? 'دارد' : 'ندارد') : 'نامشخص'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">عملیات</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {union.registration_status === 'approved' && (
            <button
              onClick={onNavigateToUpload}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-xl backdrop-blur-sm"
            >
              <Upload className="h-5 w-5 ml-2" />
              بارگذاری اسناد مالی
            </button>
          )}
          
          {union.audit_status !== 'pending' && union.registration_status === 'approved' && (
            <button
              onClick={onNavigateToResults}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-xl backdrop-blur-sm"
            >
              <Eye className="h-5 w-5 ml-2" />
              مشاهده نتایج ارزیابی
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;