import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { FileCheck, Users, Building2, Shield, Download, ExternalLink, Home, User, FileText, Settings } from 'lucide-react';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Registration from './components/Registration';
import DocumentUpload from './components/DocumentUpload';
import AuditResults from './components/AuditResults';
import AdminDashboard from './components/AdminDashboard';

export interface Union {
  id: number;
  user: number | string;
  name: string;
  headOfUnion: string;
  region: string;
  economicCode: string;
  fiscalYear: string;
  phone_number: string;
  code: string;
  audit_status: 'pending' | 'required' | 'not_required' | 'completed';
  registration_status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  financial_data?: {
    annualRevenue: number;
    totalAssets: number;
    memberCount: number;
    governmentSupport: boolean;
  };
}

export interface User {
  id: string;
  phoneNumber: string;
  role: 'union' | 'admin';
  union?: Union;
}


const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://api.zer0team.ir/';  // تغییر: تنظیم پیش‌فرض API_BASE برای لوکال

function getAuthHeaders() {
  const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];  // تغییر: دریافت توکن از کوکی (که در VerifySMSView ذخیره می‌شه)
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',  // تغییر: اضافه کردن Content-Type برای POSTها
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function fetchMyUnion(): Promise<Union | null> {
  const res = await fetch(`http://api.zer0team.ir/unions/my-union/`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include', // برای سشن کوکی دیجانگو
  });

  // 200: اتحادیه موجود است
  if (res.ok) {
    const data = await res.json();
    return { ...data, id: Number(data.id) } as Union;
  }

  // 404: اتحادیه ثبت نشده
  if (res.status === 404) {
    return null;
  }

  // سایر خطاها
  const text = await res.text();
  throw new Error(`Union fetch failed: ${res.status} ${text}`);
}


function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null); // اضافه کن به App.tsx
  const [currentPage, setCurrentPage] = useState<'auth' | 'registration' | 'dashboard' | 'upload' | 'results' | 'admin'>('auth');
  const navigate = useNavigate();
  // تغییر: حذف state unions و registeredUsers - حالا داده‌ها از API لود می‌شن

  const handleLogin = async (phoneNumber: string, nationalId: string) => {
    // Check for admin login
    if (nationalId === '0000000000' && phoneNumber === '09000000000') {
      const adminUser: User = {
        id: 'admin',
        phoneNumber: phoneNumber,
        role: 'admin'
      };
      setCurrentUser(adminUser);
      setCurrentPage('admin');
      return;
    }

    try {
      const union =  await fetchMyUnion();

      const loggedInUser: User = {
        id: nationalId,
        phoneNumber,
        role: 'union',
        ...(union ? { union } : {})
      };

      // تغییر: حذف ذخیره در registeredUsers - فقط currentUser رو بروز می‌کنم
      setCurrentUser(loggedInUser);

      if (union) {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('registration');
      }
    } catch (err) {
      console.error('Union check error:', err);
      const newUser: User = {
        id: nationalId,
        phoneNumber,
        role: 'union'
      };
      setCurrentUser(newUser);
      setCurrentPage('registration');
    }
  };

  // تغییر: handleRegistration حالا به API ارسال می‌کنه و state محلی رو تغییر نمی‌ده - بعد از ثبت موفق، به داشبورد می‌ره و union از API لود می‌شه
  const handleRegistration = async (unionData: Omit<Union, 'id' | 'auditStatus'>) => {
    setError(null);
    try {
      const res = await fetch(`http://api.zer0team.ir/unions/register/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(unionData),
        credentials: 'include',
      });


      
      if (!res.ok) {
        const errorText = await res.text(); // دلیل سرور رو بگیر
        console.log('Server error text:', errorText); // لاگ برای دیباگ
        throw new Error(`Registration failed: ${res.status} - ${errorText}`);
      }

      const newUnion = await res.json();

      if (currentUser) {
        setCurrentUser({ ...currentUser, union: newUnion });
      }
      setCurrentPage('dashboard');
      navigate("dashboard");
    } catch (err:any) {
      console.error('Registration error:', err);
      setError(err.message); // نمایش ارور به کاربر
    }
  };

  // تغییر: handleApproveUnion حالا به API ApproveUnionView ارسال می‌کنه - state محلی نداره، ادمین داشبورد خودش رفرش می‌کنه
  const handleApproveUnion = async (unionId: number) => {
    try {
      const res = await fetch(`http://api.zer0team.ir/unions/${unionId}/approve/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'approve' }),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Approval failed');
      }


      if (currentUser?.union?.id === unionId) {
        const updatedUnion = await fetchMyUnion();
        setCurrentUser({ ...currentUser, union: updatedUnion! });
      }
    } catch (err) {
      console.error('Approval error:', err);
    }
  };


  const handleRejectUnion = async (unionId: number, reason: string) => {
    try {
      const res = await fetch(`http://api.zer0team.ir/unions/${unionId}/approve/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'reject', comment: reason }),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Rejection failed');
      }

      
      if (currentUser?.union?.id === unionId) {
        const updatedUnion = await fetchMyUnion();
        setCurrentUser({ ...currentUser, union: updatedUnion! });
      }
    } catch (err) {
      console.error('Rejection error:', err);
    }
  };

  // تغییر: handleDocumentUpload حالا به API UpdateFinancialDataView ارسال می‌کنه و union رو از API بروز می‌کنه
  const handleDocumentUpload = async (financialData: Union['financial_data']) => {
    if (currentUser?.union && financialData) {
      try {
        const res = await fetch(`http://api.zer0team.ir/requests/create/`, {  // فرض: url به UpdateFinancialDataView مپ شده
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ financial_data: financialData }),
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Document upload failed');
        }

        const updatedUnion = await res.json();
        setCurrentUser({ ...currentUser, union: updatedUnion });
        setCurrentPage('results');
      } catch (err) {
        console.error('Document upload error:', err);
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('auth');
  };

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const renderNavigation = () => (
    <nav className="bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-reverse space-x-4">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">
              {currentUser.role === 'admin' ? 'پنل مدیریت' : 'سامانه اتحادیه صنفی'}
            </h1>
          </div>
          
          {currentUser.role === 'union' && (
            <div className="flex space-x-reverse space-x-4">
              {currentUser.union && (
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === 'dashboard' 
                      ? 'bg-white/30 backdrop-blur-sm text-blue-700 border border-white/40' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  <Home className="ml-2 h-4 w-4" />
                  داشبورد
                </button>
              )}
              {currentUser.union?.registration_status === 'approved' && (
                <button
                  onClick={() => setCurrentPage('upload')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === 'upload' 
                      ? 'bg-white/30 backdrop-blur-sm text-blue-700 border border-white/40' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  <FileText className="ml-2 h-4 w-4" />
                  بارگذاری اسناد
                </button>
              )}
              {currentUser.union?.audit_status !== 'pending' && currentUser.union?.registration_status === 'approved' && (
                <button
                  onClick={() => setCurrentPage('results')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === 'results' 
                      ? 'bg-white/30 backdrop-blur-sm text-blue-700 border border-white/40' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  <FileCheck className="ml-2 h-4 w-4" />
                  نتایج ارزیابی
                </button>
              )}
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white/20 backdrop-blur-sm rounded-md transition-all duration-300"
          >
            <User className="ml-2 h-4 w-4" />
            خروج
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen relative overflow-hidden" dir="rtl">
      {/* Animated Background with Floating Shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100">
        {/* ... (بدون تغییر) */}
      </div>

      {renderNavigation()}
      
      <main className="relative z-10 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {currentPage === 'registration' && !currentUser.union && (
          <Registration onSubmit={handleRegistration} />
        )}
        
        
        {currentPage === 'dashboard' && currentUser.union && (
          <Dashboard 
            union={currentUser.union} 
            onNavigateToUpload={() => setCurrentPage('upload')}
            onNavigateToResults={() => setCurrentPage('results')}
          />
        )}
        
        {currentPage === 'upload' && (
          <DocumentUpload onUpload={handleDocumentUpload} />
        )}
        
        {currentPage === 'results' && currentUser.union && currentUser.union.registration_status === 'approved' && (
          <AuditResults unionCode={currentUser.union.code} />
        )}
        
        {currentPage === 'admin' && currentUser.role === 'admin' && (
          <AdminDashboard 
            unions={[]}  // تغییر: unions رو خالی می‌فرستیم - داخل AdminDashboard خودش از API لود می‌کنه
            onApproveUnion={handleApproveUnion}
            onRejectUnion={handleRejectUnion}
          />
        )}
      </main>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default App;