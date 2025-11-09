import React, { useState, useEffect } from 'react';  // تغییر: اضافه کردن useEffect برای لود API
import { 
  Building2, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  MapPin,
  Check,
  X,
  Calendar,
  Phone,
  FileText,
  User
} from 'lucide-react';

interface Union {
  id: number;
  user: number;
  phone_number: string;
  name: string;
  headOfUnion: string;
  region: string;
  code: string;
  economicCode: string;
  registration_status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  rejected_at?: string;
  approved_at?: string;
  rejection_reason?: string;
  audit_status?: 'pending' | 'required' | 'not_required' | 'completed';
  fiscalYear?: string;
  financial_data?: {
    annualRevenue: number;
    totalAssets: number;
    memberCount: number;
    governmentSupport: boolean;
  };
}

interface AdminDashboardProps {
  unions: Union[];
  onApproveUnion: (unionId: number) => void;
  onRejectUnion: (unionId: number, reason: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onApproveUnion, onRejectUnion }) => {
  const [unions, setUnions] = useState<Union[]>([]);  // تغییر: اضافه کردن state محلی برای unions که از API لود می‌شه
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Union['audit_status'] | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [registrationFilter, setRegistrationFilter] = useState<Union['registration_status'] | 'all'>('all');
  const [selectedUnion, setSelectedUnion] = useState<Union | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations'>('overview');

  useEffect(() => {
    const fetchUnions = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
        const res = await fetch('http://api.zer0team.ir/unions/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Fetch unions failed');
        }

        const data: Union[] = await res.json();
        setUnions(data);
      } catch (err) {
        console.error('Fetch unions error:', err);
      }
    };

    fetchUnions();
  }, []);

  const pendingRegistrations = unions.filter(u => u.registration_status === 'pending');

  const stats = {
    total: unions.length,
    auditRequired: unions.filter(u => u.audit_status === 'required').length,
    auditNotRequired: unions.filter(u => u.audit_status === 'not_required').length,
    pending: unions.filter(u => u.audit_status === 'pending').length,
    pendingApproval: unions.filter(u => u.registration_status === 'pending').length,
    approved: unions.filter(u => u.registration_status === 'approved').length,
    rejected: unions.filter(u => u.registration_status === 'rejected').length
  };

  const filteredUnions = unions.filter(union => {
    const matchesSearch = union.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         union.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || union.audit_status === statusFilter;
    const matchesRegion = regionFilter === 'all' || union.region === regionFilter;
    const matchesRegistration = registrationFilter === 'all' || union.registration_status === registrationFilter;
    
    return matchesSearch && matchesStatus && matchesRegion && matchesRegistration;
  });

  const regions = [...new Set(unions.map(u => u.region))];

  const getStatusIcon = (status: Union['audit_status']) => {
    switch (status) {
      case 'required':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'not_required':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: Union['audit_status']) => {
    switch (status) {
      case 'required':
        return 'نیازمند حسابرسی';
      case 'not_required':
        return 'نیازی به حسابرسی نیست';
      case 'completed':
        return 'حسابرسی انجام شده';
      default:
        return 'در انتظار بررسی';
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['نام اتحادیه', 'کد', 'رئیس اتحادیه', 'منطقه', 'وضعیت حسابرسی', 'وضعیت ثبت‌نام', 'درآمد سالانه', 'کل دارایی‌ها', 'تعداد اعضا'].join(','),
      ...filteredUnions.map(union => [
        union.name,
        union.code,
        union.headOfUnion,
        union.region,
        getStatusText(union.audit_status),
        getRegistrationStatusText(union.registration_status),
        union.financial_data?.annualRevenue || 0,
        union.financial_data?.totalAssets || 0,
        union.financial_data?.memberCount || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unions-report-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // const handleApprove = (union: Union) => {
  //   onApproveUnion(union.id);
  // };

  const handleReject = (union: Union) => {
    setSelectedUnion(union);
    setShowRejectModal(true);
  };
  const handleApprove = async (union: Union) => {
    try {
      await onApproveUnion(union.id); // درخواست به بک‌اند
      setUnions(prev =>
        prev.map(u =>
          u.id === union.id ? { ...u, registration_status: "approved" } : u
        )
      );
    } catch (err) {
      console.error("خطا در تایید اتحادیه", err);
    }
  };
  
  const confirmReject = async () => {
    if (selectedUnion && rejectionReason.trim()) {
      try {
        await onRejectUnion(selectedUnion.id, rejectionReason);
        setUnions(prev =>
          prev.map(u =>
            u.id === selectedUnion.id
              ? {
                  ...u,
                  registration_status: "rejected",
                  rejection_reason: rejectionReason,
                }
              : u
          )
        );
        setShowRejectModal(false);
        setSelectedUnion(null);
        setRejectionReason("");
      } catch (err) {
        console.error("خطا در رد اتحادیه", err);
      }
    }
  };

  // const confirmReject = () => {
  //   if (selectedUnion && rejectionReason.trim()) {
  //     onRejectUnion(selectedUnion.id, rejectionReason);
  //     setShowRejectModal(false);
  //     setSelectedUnion(null);
  //     setRejectionReason('');
  //   }
  // };

  const showDetails = (union: Union) => {
    setSelectedUnion(union);
    setShowDetailsModal(true);
  };

  const getRegistrationStatusIcon = (status: Union['registration_status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getRegistrationStatusText = (status: Union['registration_status']) => {
    switch (status) {
      case 'approved':
        return 'تایید شده';
      case 'rejected':
        return 'رد شده';
      default:
        return 'در انتظار تایید';
    }
  };

  const getRegistrationStatusColor = (status: Union['registration_status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">پنل مدیریت اتحادیه‌ها</h1>
            <p className="text-gray-600 mt-1">وزارت صنعت، معدن و تجارت</p>
          </div>
          <div className="flex space-x-reverse space-x-4">
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-xl backdrop-blur-sm"
            >
              <Download className="h-4 w-4 ml-2" />
              خروجی Excel
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-reverse space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              نمای کلی
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
                activeTab === 'registrations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              درخواست‌های ثبت‌نام
              {stats.pendingApproval > 0 && (
                <span className="absolute -top-1 -left-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {stats.pendingApproval}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center">
                    <Building2 className="h-8 w-8 text-blue-500" />
                    <div className="mr-4">
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                      <p className="text-gray-600">کل اتحادیه‌ها</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <div className="mr-4">
                      <p className="text-2xl font-bold text-gray-900">{stats.auditRequired}</p>
                      <p className="text-gray-600">نیازمند حسابرسی</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div className="mr-4">
                      <p className="text-2xl font-bold text-gray-900">{stats.auditNotRequired}</p>
                      <p className="text-gray-600">نیازی به حسابرسی نیست</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-500" />
                    <div className="mr-4">
                      <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                      <p className="text-gray-600">در انتظار بررسی</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-2xl p-4 mb-6 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">جستجو</label>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="نام یا کد اتحادیه..."
                        className="w-full pr-10 pl-3 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت حسابرسی</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as Union['audit_status'] | 'all')}
                      className="w-full px-3 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
                    >
                      <option value="all">همه</option>
                      <option value="pending">در انتظار بررسی</option>
                      <option value="required">نیازمند حسابرسی</option>
                      <option value="not_required">نیازی به حسابرسی نیست</option>
                      <option value="completed">حسابرسی انجام شده</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">منطقه</label>
                    <select
                      value={regionFilter}
                      onChange={(e) => setRegionFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
                    >
                      <option value="all">همه مناطق</option>
                      {regions.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت ثبت‌نام</label>
                    <select
                      value={registrationFilter}
                      onChange={(e) => setRegistrationFilter(e.target.value as Union['registration_status'] | 'all')}
                      className="w-full px-3 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
                    >
                      <option value="all">همه</option>
                      <option value="pending">در انتظار تایید</option>
                      <option value="approved">تایید شده</option>
                      <option value="rejected">رد شده</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Unions Table */}
              <div className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-2xl overflow-hidden shadow-2xl">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    لیست اتحادیه‌ها ({filteredUnions.length})
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white/20 backdrop-blur-sm">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          اتحادیه
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          رئیس اتحادیه
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          منطقه
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          وضعیت ثبت‌نام
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          وضعیت حسابرسی
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          عملیات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/10 backdrop-blur-sm divide-y divide-gray-200">
                      {filteredUnions.map((union) => (
                        <tr key={union.id} className="hover:bg-white/20 backdrop-blur-sm transition-all duration-300">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {union.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                کد: {union.code}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {union.headOfUnion}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <MapPin className="h-4 w-4 ml-1 text-gray-400" />
                              {union.region}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRegistrationStatusColor(union.registration_status)}`}>
                              {getRegistrationStatusIcon(union.registration_status)}
                              <span className="mr-1">{getRegistrationStatusText(union.registration_status)}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(union.audit_status)}
                              <span className="mr-2 text-sm text-gray-900">
                                {getStatusText(union.audit_status)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => showDetails(union)}
                              className="text-blue-600 hover:text-blue-900 flex items-center px-3 py-1 rounded-xl hover:bg-white/20 backdrop-blur-sm transition-all duration-300"
                            >
                              <Eye className="h-4 w-4 ml-1" />
                              جزئیات
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredUnions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">هیچ اتحادیه‌ای یافت نشد</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'registrations' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  درخواست‌های ثبت‌نام ({pendingRegistrations.length})
                </h2>
                <p className="text-gray-600">
                  درخواست‌های ثبت‌نام اتحادیه‌ها که نیاز به بررسی و تصمیم‌گیری دارند
                </p>
              </div>

              {pendingRegistrations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    درخواست جدیدی وجود ندارد
                  </h3>
                  <p className="text-gray-500">
                    تمام درخواست‌های ثبت‌نام بررسی شده‌اند
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRegistrations.map((union) => (
                    <div key={union.id} className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-2xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <Building2 className="h-5 w-5 text-gray-400 ml-2" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              {union.name}
                            </h3>
                            <span className="mr-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 ml-1" />
                              در انتظار تایید
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <User className="h-4 w-4 ml-2 text-gray-400" />
                              <span>رئیس اتحادیه: {union.headOfUnion}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 ml-2 text-gray-400" />
                              <span>منطقه: {union.region}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <FileText className="h-4 w-4 ml-2 text-gray-400" />
                              <span>کد اقتصادی: {union.economicCode}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 ml-2 text-gray-400" />
                              <span>سال مالی: {union.fiscalYear}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 ml-2 text-gray-400" />
                              <span>تماس: {union.phone_number}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Building2 className="h-4 w-4 ml-2 text-gray-400" />
                              <span>کد اتحادیه: {union.code}</span>
                            </div>
                          </div>

                          <div className="text-sm text-gray-500">
                            تاریخ ارسال درخواست: {new Date(union.submitted_at).toLocaleDateString('fa-IR')}
                          </div>
                        </div>

                        <div className="flex space-x-reverse space-x-3 mr-4">
                          <button
                            onClick={() => showDetails(union)}
                            className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50/80 backdrop-blur-sm rounded-2xl hover:bg-blue-100/80 transition-all duration-300 border border-blue-200/50"
                          >
                            <Eye className="h-4 w-4 ml-1" />
                            جزئیات
                          </button>
                          <button
                            onClick={() => handleApprove(union)}
                            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg backdrop-blur-sm"
                          >
                            <Check className="h-4 w-4 ml-1" />
                            تایید
                          </button>
                          <button
                            onClick={() => {setSelectedUnion(union);
                                            setShowRejectModal(true);}}
                            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg backdrop-blur-sm"
                          >
                            <X className="h-4 w-4 ml-1" />
                            رد
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedUnion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  جزئیات اتحادیه {selectedUnion.name}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">اطلاعات پایه</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">نام اتحادیه</p>
                    <p className="font-medium text-gray-900">{selectedUnion.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">رئیس اتحادیه</p>
                    <p className="font-medium text-gray-900">{selectedUnion.headOfUnion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">منطقه</p>
                    <p className="font-medium text-gray-900">{selectedUnion.region}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">کد اقتصادی</p>
                    <p className="font-medium text-gray-900">{selectedUnion.economicCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">سال مالی</p>
                    <p className="font-medium text-gray-900">{selectedUnion.fiscalYear}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">کد اتحادیه</p>
                    <p className="font-medium text-gray-900">{selectedUnion.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">اطلاعات تماس</p>
                    <p className="font-medium text-gray-900">{selectedUnion.phone_number}</p>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">وضعیت</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">وضعیت ثبت‌نام</p>
                    <div className="flex items-center mt-1">
                      {getRegistrationStatusIcon(selectedUnion.registration_status)}
                      <span className="mr-2 font-medium text-gray-900">
                        {getRegistrationStatusText(selectedUnion.registration_status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">وضعیت حسابرسی</p>
                    <div className="flex items-center mt-1">
                      {getStatusIcon(selectedUnion.audit_status)}
                      <span className="mr-2 font-medium text-gray-900">
                        {getStatusText(selectedUnion.audit_status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Data */}
              {selectedUnion.financial_data && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">اطلاعات مالی</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">درآمد سالانه</p>
                      <p className="font-medium text-gray-900">
                        {selectedUnion.financial_data.annualRevenue.toLocaleString('fa-IR')} ریال
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">کل دارایی‌ها</p>
                      <p className="font-medium text-gray-900">
                        {selectedUnion.financial_data.totalAssets.toLocaleString('fa-IR')} ریال
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">تعداد اعضا</p>
                      <p className="font-medium text-gray-900">
                        {selectedUnion.financial_data.memberCount.toLocaleString('fa-IR')} نفر
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">حمایت دولتی</p>
                      <p className="font-medium text-gray-900">
                        {selectedUnion.financial_data.governmentSupport ? 'دارد' : 'ندارد'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">تاریخچه</h4>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-3"></div>
                    <span className="text-gray-600">
                      درخواست ثبت‌نام: {new Date(selectedUnion.submitted_at).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                  {selectedUnion.approved_at && (
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full ml-3"></div>
                      <span className="text-gray-600">
                        تایید شده: {new Date(selectedUnion.approved_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  )}
                  {selectedUnion.rejected_at && (
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full ml-3"></div>
                      <span className="text-gray-600">
                        رد شده: {new Date(selectedUnion.rejected_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Reason */}
              {selectedUnion.rejection_reason && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">دلیل رد</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{selectedUnion.rejection_reason}</p>
                  </div>
                </div>
              )}

              {/* Actions for pending registrations */}
              {selectedUnion.registration_status === 'pending' && (
                <div className="flex justify-end space-x-reverse space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      handleApprove(selectedUnion);
                      setShowDetailsModal(false);
                    }}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg backdrop-blur-sm"
                  >
                    <Check className="h-4 w-4 ml-1" />
                    تایید درخواست
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleReject(selectedUnion);
                    }}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg backdrop-blur-sm"
                  >
                    <X className="h-4 w-4 ml-1" />
                    رد درخواست
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedUnion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              رد درخواست اتحادیه {selectedUnion.name}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                دلیل رد درخواست
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
                placeholder="لطفاً دلیل رد درخواست را وارد کنید..."
              />
            </div>
            
            <div className="flex justify-end space-x-reverse space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedUnion(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl hover:bg-white/40 transition-all duration-300"
              >
                انصراف
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg backdrop-blur-sm"
              >
                تایید رد درخواست
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;