import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Download, 
  ExternalLink,
  TrendingUp,
  Building,
  Users,
  DollarSign
} from 'lucide-react';

interface FinancialData {
  annualRevenue: number;
  totalAssets: number;
  memberCount: number;
  governmentSupport: boolean;
}

interface Union {
  name: string;
  code: string;
  headOfUnion: string;
  audit_status: 'required' | 'not_required' | 'completed' | 'Pending';
  financial_data: FinancialData | null;
}

const AuditResults: React.FC<{ unionCode: string }> = ({ unionCode }) => {
  const [union, setUnion] = useState<Union | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnion = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
        const res = await fetch(`http://api.zer0team.ir/request/my-request/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });
        if (!res.ok) throw new Error('خطا در دریافت اطلاعات اتحادیه');
        const data: Union = await res.json();
        setUnion(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUnion();
  }, [unionCode]);

  if (loading) return <p className="text-center py-8">در حال بارگذاری...</p>;
  if (error) return <p className="text-center py-8 text-red-600">{error}</p>;
  if (!union) return <p className="text-center py-8 text-gray-500">اطلاعاتی موجود نیست</p>;

  const isAuditRequired = union.audit_status === 'required';
  const financialData = union.financial_data;

  if (!financialData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">اطلاعات مالی در دسترس نیست</p>
      </div>
    );
  }

  const criteria = [
    {
      name: 'درآمد سالانه',
      value: financialData.annualRevenue,
      threshold: 5000000000,
      unit: 'ریال',
      icon: TrendingUp,
      met: financialData.annualRevenue > 5000000000
    },
    {
      name: 'کل دارایی‌ها',
      value: financialData.totalAssets,
      threshold: 3000000000,
      unit: 'ریال',
      icon: Building,
      met: financialData.totalAssets > 3000000000
    },
    {
      name: 'تعداد اعضا',
      value: financialData.memberCount,
      threshold: 500,
      unit: 'نفر',
      icon: Users,
      met: financialData.memberCount > 500
    },
    {
      name: 'حمایت مالی دولت',
      value: financialData.governmentSupport ? 'دارد' : 'ندارد',
      threshold: 'دارد',
      unit: '',
      icon: DollarSign,
      met: financialData.governmentSupport
    }
  ];

  const handleDownloadReport = () => {
    const reportContent = `
گزارش ارزیابی تعهد حسابرسی رسمی
اتحادیه: ${union.name}
کد اتحادیه: ${union.code}
رئیس اتحادیه: ${union.headOfUnion}

نتیجه ارزیابی: ${isAuditRequired ? 'نیازمند حسابرسی رسمی' : 'نیازی به حسابرسی نیست'}

جزئیات ارزیابی:
- درآمد سالانه: ${financialData.annualRevenue.toLocaleString('fa-IR')} ریال
- کل دارایی‌ها: ${financialData.totalAssets.toLocaleString('fa-IR')} ریال
- تعداد اعضا: ${financialData.memberCount.toLocaleString('fa-IR')} نفر
- حمایت مالی دولت: ${financialData.governmentSupport ? 'دارد' : 'ندارد'}

تاریخ تولید گزارش: ${new Date().toLocaleDateString('fa-IR')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-report-${union.code}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleJAMRedirect = () => {
    window.open('https://jam.iacpa.ir', '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* نتیجه ارزیابی */}
      <div className={`rounded-lg p-6 ${
        isAuditRequired 
          ? 'bg-red-50/80 backdrop-blur-xl border border-red-200/50 shadow-2xl' 
          : 'bg-green-50/80 backdrop-blur-xl border border-green-200/50 shadow-2xl'
      }`}>
        <div className="flex items-center">
          {isAuditRequired ? (
            <AlertCircle className="h-8 w-8 text-red-500 ml-3" />
          ) : (
            <CheckCircle className="h-8 w-8 text-green-500 ml-3" />
          )}
          <div>
            <h1 className={`text-2xl font-bold ${isAuditRequired ? 'text-red-700' : 'text-green-700'}`}>
              {isAuditRequired ? 'اتحادیه شما نیازمند حسابرسی رسمی است' : 'اتحادیه شما نیازی به حسابرسی ندارد'}
            </h1>
            <p className={`mt-2 ${isAuditRequired ? 'text-red-600' : 'text-green-600'}`}>
              {isAuditRequired 
                ? 'بر اساس مقررات، اتحادیه شما باید تحت حسابرسی رسمی قرار گیرد.'
                : 'اتحادیه شما شرایط لازم برای حسابرسی اجباری را ندارد.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* معیارها */}
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">تجزیه و تحلیل معیارها</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {criteria.map((criterion, index) => (
            <div key={index} className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <criterion.icon className="h-5 w-5 text-gray-600 ml-2" />
                  <h3 className="font-medium text-gray-900">{criterion.name}</h3>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  criterion.met 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {criterion.met ? 'شرط برقرار' : 'شرط برقرار نیست'}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  مقدار فعلی: <span className="font-medium">
                    {typeof criterion.value === 'number' ? criterion.value.toLocaleString('fa-IR') : criterion.value} {criterion.unit}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  حد آستانه: <span className="font-medium">
                    {typeof criterion.threshold === 'number' ? criterion.threshold.toLocaleString('fa-IR') : criterion.threshold} {criterion.unit}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* اقدامات بعدی */}
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">اقدامات بعدی</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleDownloadReport}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-xl backdrop-blur-sm"
          >
            <Download className="h-5 w-5 ml-2" />
            دانلود گزارش کامل
          </button>
          {isAuditRequired && (
            <button
              onClick={handleJAMRedirect}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-xl backdrop-blur-sm"
            >
              <ExternalLink className="h-5 w-5 ml-2" />
              ورود به سامانه JAM
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditResults;
