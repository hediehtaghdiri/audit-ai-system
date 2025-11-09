import React, { useState, useEffect } from 'react';
import { Building2, Smartphone, Shield, RefreshCw, Send, LogIn, ArrowLeft } from 'lucide-react';
import { User as UserType } from '../App';

interface AuthPageProps {
  onLogin: (phoneNumber: string, nationalId: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [nationalId, setNationalId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsCodeInput, setSmsCodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'initial' | 'sms_sent'>('initial');
  const [countdown, setCountdown] = useState(0);

  // Generate random captcha
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Validate Iranian national ID
  const validateNationalId = (id: string): boolean => {
    if (!/^\d{10}$/.test(id)) return false;

    const digits = id.split('').map(Number);
    const checkDigit = digits[9];

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i);
    }

    const remainder = sum % 11;
    return (remainder < 2 && checkDigit === remainder) ||
           (remainder >= 2 && checkDigit === 11 - remainder);
  };

  // Validate Iranian mobile number
  const validatePhoneNumber = (phone: string): boolean => {
    return /^09\d{9}$/.test(phone);
  };

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (!validateNationalId(nationalId)) {
      setError('کد ملی وارد شده معتبر نیست');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('شماره موبایل باید به فرمت ۰۹XXXXXXXXX باشد');
      return;
    }

    if (captchaInput.toUpperCase() !== captcha.toUpperCase()) {
      setError('کپچا اشتباه است');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }

    setIsSendingSms(true);

    try {
    const response = await fetch('/api/send-sms/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, nationalId }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.message || 'خطا در ارسال پیامک');
      setIsSendingSms(false);
      return;
    }

    const data = await response.json();

    setSmsCode(data.debug_code);

    setStep('sms_sent');
    setCountdown(120); // 2 minutes countdown

    } catch (err) {
    setError('خطا در برقراری ارتباط با سرور');
    }
    setIsSendingSms(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
    const response = await fetch('/api/verify-sms/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, nationalId, smsCode: smsCodeInput }),
    });

    const data = await response.json(); // اینو باید قبل از استفاده داشته باشی

    if (!response.ok) {
      setError(data.message || 'کد پیامک اشتباه است');
      setIsLoading(false);
      return;
    }

    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);

    // setIsAuthenticated(true); // اگر context یا state auth داری
    // Show success toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // Pass phone number and national ID to parent for user lookup
    onLogin(phoneNumber, nationalId);
    } catch (err) {
    setError('خطا در برقراری ارتباط با سرور');
  }

    setIsLoading(false);
  };

  const handleResendSms = () => {
    if (countdown === 0) {
      generateCaptcha();
      setCaptchaInput('');
      setStep('initial');
      setSmsCodeInput('');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" dir="rtl">
      {/* Animated Background with Floating Shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100">
        {/* Large floating circles */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-80 h-80 bg-gradient-to-br from-blue-300/25 to-blue-500/15 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-blue-100/40 to-blue-300/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        
        {/* Medium floating circles */}
        <div className="absolute top-1/4 left-20 w-32 h-32 bg-gradient-to-br from-blue-200/40 to-blue-400/25 rounded-full blur-lg animate-bounce"></div>
        <div className="absolute bottom-1/4 right-32 w-24 h-24 bg-gradient-to-br from-blue-300/35 to-blue-500/20 rounded-full blur-md animate-bounce delay-500"></div>
        <div className="absolute top-3/4 left-1/2 w-20 h-20 bg-gradient-to-br from-blue-100/50 to-blue-300/30 rounded-full blur-sm animate-bounce delay-1000"></div>
        
        {/* Small floating circles */}
        <div className="absolute top-16 left-1/4 w-12 h-12 bg-gradient-to-br from-blue-400/40 to-blue-600/25 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-1/4 w-8 h-8 bg-gradient-to-br from-blue-300/50 to-blue-500/30 rounded-full animate-float delay-700"></div>
        <div className="absolute top-1/3 right-16 w-6 h-6 bg-gradient-to-br from-blue-200/60 to-blue-400/40 rounded-full animate-float delay-1400"></div>
        
        {/* Glassmorphism overlay shapes */}
        <div className="absolute top-40 right-40 w-72 h-72 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full shadow-xl"></div>
        <div className="absolute bottom-40 left-40 w-56 h-56 bg-blue-100/15 backdrop-blur-sm border border-blue-200/30 rounded-full shadow-lg"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Glassmorphism Login Card */}
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
            {/* Card background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-blue-100/10 rounded-3xl"></div>
            
            {/* Header */}
            <div className="relative z-10 text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
                  <Building2 className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">ورود</h1>
              <p className="text-gray-600 text-sm">سامانه اتحادیه‌های صنفی</p>
            </div>

            {step === 'initial' ? (
              <form className="relative z-10 space-y-6" onSubmit={handleSendSms}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-2">
                      کد ملی
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <Shield className="h-5 w-5 text-blue-400" />
                      </div>
                      <input
                        id="nationalId"
                        name="nationalId"
                        type="text"
                        required
                        maxLength={10}
                        value={nationalId}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setNationalId(value);
                        }}
                        className="block w-full pr-12 pl-4 py-4 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
                        placeholder="کد ملی ۱۰ رقمی"
                      />
                    </div>
                    {nationalId && !validateNationalId(nationalId) && (
                      <p className="text-xs text-red-500 mt-2 bg-red-50/80 backdrop-blur-sm px-3 py-1 rounded-lg">کد ملی معتبر نیست</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      شماره موبایل
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <Smartphone className="h-5 w-5 text-blue-400" />
                      </div>
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        required
                        maxLength={11}
                        value={phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 11) {
                            setPhoneNumber(value);
                          }
                        }}
                        className="block w-full pr-12 pl-4 py-4 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
                        placeholder="۰۹XXXXXXXXX"
                      />
                    </div>
                    {phoneNumber && !validatePhoneNumber(phoneNumber) && (
                      <p className="text-xs text-red-500 mt-2 bg-red-50/80 backdrop-blur-sm px-3 py-1 rounded-lg">شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="captcha" className="block text-sm font-medium text-gray-700 mb-2">
                      کد امنیتی
                    </label>
                    <div className="flex space-x-reverse space-x-3">
                      <div className="flex-1">
                        <input
                          id="captcha"
                          name="captcha"
                          type="text"
                          required
                          maxLength={4}
                          value={captchaInput}
                          onChange={(e) => setCaptchaInput(e.target.value)}
                          className="block w-full px-4 py-4 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
                          placeholder="کد امنیتی را وارد کنید"
                        />
                      </div>
                      <div className="flex items-center space-x-reverse space-x-2">
                        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl px-4 py-3 font-mono text-lg font-bold text-gray-700 select-none shadow-lg">
                          {captcha}
                        </div>
                        <button
                          type="button"
                          onClick={generateCaptcha}
                          className="p-3 text-blue-500 hover:text-blue-700 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300"
                        >
                          <RefreshCw className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-100/80 backdrop-blur-sm border border-red-200/50 rounded-2xl p-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSendingSms || !validateNationalId(nationalId) || !validatePhoneNumber(phoneNumber)}
                  className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 hover:shadow-2xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl backdrop-blur-sm transform"
                >
                  <Send className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                  {isSendingSms ? 'در حال ارسال...' : 'ارسال کد پیامک'}
                </button>
              </form>
            ) : (
              <form className="relative z-10 space-y-6" onSubmit={handleLogin}>
                <div className="bg-green-100/80 backdrop-blur-sm border border-green-200/50 rounded-2xl p-4">
                  <p className="text-sm text-green-700">
                    کد پیامک به شماره {phoneNumber} ارسال شد
                  </p>
                </div>

                <div>
                  <label htmlFor="smsCode" className="block text-sm font-medium text-gray-700 mb-2">
                    کد پیامک
                  </label>
                  <input
                    id="smsCode"
                    name="smsCode"
                    type="text"
                    required
                    maxLength={6}
                    value={smsCodeInput}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setSmsCodeInput(value);
                    }}
                    className="block w-full px-4 py-4 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-center text-lg font-mono transition-all duration-300 text-gray-800"
                    style={{ fontVariantNumeric: 'lining-nums' }}
                    dir="ltr"
                    placeholder="کد را وارد کنید"
                  />
                  
                </div>

                {error && (
                  <div className="bg-red-100/80 backdrop-blur-sm border border-red-200/50 rounded-2xl p-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || smsCodeInput.length !== 6}
                  className="group relative w-full flex justify-center items-center py-5 px-8 border border-transparent text-xl font-black rounded-2xl text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 hover:shadow-[0_20px_40px_rgba(59,130,246,0.4)] hover:-translate-y-1 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_15px_30px_rgba(59,130,246,0.3)] backdrop-blur-sm transform"
                >
                  <ArrowLeft className="h-7 w-7 ml-4 group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300" />
                  {isLoading ? 'در حال ورود...' : 'ورود به سامانه'}
                </button>

                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-600 bg-gray-100/60 backdrop-blur-sm px-4 py-2 rounded-xl">
                      ارسال مجدد کد پس از {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendSms}
                      className="text-sm text-blue-600 hover:text-blue-800 bg-blue-50/60 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-blue-100/60 transition-all duration-300"
                    >
                      ارسال مجدد کد پیامک
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-green-500/90 backdrop-blur-xl border border-green-400/50 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-reverse space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-lg">شما با موفقیت وارد سامانه شدید</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes fade-in {
          0% { 
            opacity: 0; 
            transform: translateX(-50%) translateY(-20px); 
          }
          100% { 
            opacity: 1; 
            transform: translateX(-50%) translateY(0px); 
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AuthPage;