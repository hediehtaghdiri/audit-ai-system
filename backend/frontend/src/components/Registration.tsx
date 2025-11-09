import React, { useState, useEffect } from 'react';
import { Building2, User, MapPin, FileText, Calendar } from 'lucide-react';
import { Union } from '../App';

import { useNavigate } from "react-router-dom";

interface RegistrationProps {
  onSubmit: (union: Omit<Union, 'id' | 'auditStatus'>) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onSubmit }) => {
  interface FormData {
    name: string;
    headOfUnion: string;
    region: string;
    economicCode: string;
    fiscalYear: string;
    code: string;
    
  }
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    headOfUnion: '',
    region: '',
    economicCode: '',
    fiscalYear: '1404',
    code: ''
  });
  

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const iranProvinces = [
    'تهران', 'اصفهان', 'فارس', 'خراسان رضوی', 'آذربایجان شرقی', 'کرمان',
    'خوزستان', 'مازندران', 'گیلان', 'آذربایجان غربی', 'کرمانشاه', 'لرستان',
    'سیستان و بلوچستان', 'هرمزگان', 'یزد', 'اردبیل', 'مرکزی', 'ایلام',
    'کردستان', 'همدان', 'گلستان', 'زنجان', 'قم', 'قزوین', 'چهارمحال و بختیاری',
    'کهگیلویه و بویراحمد', 'بوشهر', 'سمنان', 'البرز'
  ];

  const unionTypes = [
    'اتحادیه صنف آرایشگران',
    'اتحادیه صنف خیاطان',
    'اتحادیه صنف کفاشان',
    'اتحادیه صنف طلا و جواهرسازان',
    'اتحادیه صنف نانوایان',
    'اتحادیه صنف قصابان',
    'اتحادیه صنف میوه فروشان',
    'اتحادیه صنف بقالان',
    'اتحادیه صنف رستوران داران',
    'اتحادیه صنف کافه داران',
    'اتحادیه صنف تاکسیرانان',
    'اتحادیه صنف اتوبوسرانان',
    'اتحادیه صنف تعمیرکاران خودرو',
    'اتحادیه صنف لوازم یدکی خودرو',
    'اتحادیه صنف فروشندگان موبایل',
    'اتحادیه صنف تعمیرکاران موبایل',
    'اتحادیه صنف کامپیوتر و لپ تاپ',
    'اتحادیه صنف لوازم خانگی',
    'اتحادیه صنف فرش فروشان',
    'اتحادیه صنف مبل سازان',
    'اتحادیه صنف ساختمان سازان',
    'اتحادیه صنف نقاشان ساختمان',
    'اتحادیه صنف برقکاران',
    'اتحادیه صنف لوله کشان',
    'اتحادیه صنف کاشی کاران',
    'اتحادیه صنف آهنگران',
    'اتحادیه صنف جوشکاران',
    'اتحادیه صنف نجاران',
    'اتحادیه صنف شیشه بران',
    'اتحادیه صنف عکاسان',
    'اتحادیه صنف چاپخانه داران',
    'اتحادیه صنف کتاب فروشان',
    'اتحادیه صنف لوازم التحریر',
    'اتحادیه صنف داروخانه داران',
    'اتحادیه صنف عینک سازان',
    'اتحادیه صنف دندانسازان',
    'اتحادیه صنف ورزشی',
    'اتحادیه صنف اسباب بازی',
    'اتحادیه صنف پوشاک',
    'اتحادیه صنف کیف و کفش',
    'اتحادیه صنف لباس زیر',
    'اتحادیه صنف عطاری',
    'اتحادیه صنف گل فروشان',
    'اتحادیه صنف حمل و نقل',
    'اتحادیه صنف باربری',
    'اتحادیه صنف املاک',
    'اتحادیه صنف بیمه',
    'اتحادیه صنف مسافربری',
    'اتحادیه صنف هتل داری',
    'اتحادیه صنف آژانس مسافرتی',
    'سایر'
  ];
  const getToken = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('access_token='))
      ?.split('=')[1] || null;

    
  };

  useEffect(() => {
    
  getToken()

  }, []);


  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    

    if (!formData.economicCode || formData.economicCode.length !== 10) {
      setError('کد اقتصادی باید 10 رقم باشد.');
      setIsLoading(false);
      return;
    }

    const payload = {
      name: formData.name,
      headOfUnion: formData.headOfUnion,
      region: formData.region,
      economicCode: formData.economicCode,
      fiscalYear: formData.fiscalYear,
      code: formData.code
    };
    
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];
      if (!token) throw new Error('توکن احراز هویت یافت نشد.');
  

      const response = await fetch('http://api.zer0team.ir/unions/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // ارسال توکن توی هدر
        },
        credentials: 'include', // برای ارسال کوکی‌ها
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در ثبت اتحادیه');
      }
      const newUnion = await response.json();
      onSubmit(newUnion);  // تغییر: onSubmit رو با داده از API فراخوانی می‌کنم
      setIsLoading(false);
      navigate("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : 'خطای ناشناخته');
      navigate("/dashboard"); // حتی اگر خطا رخ داد، وارد داشبورد بشه
    } finally {
      setIsLoading(false);
    }
  };
      console.log("📌 Form submitted"); // مرحله 1

      

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        <div className="flex items-center">
          <Building2 className="h-6 w-6 text-white ml-3" />
          <h2 className="text-xl font-bold text-white">ثبت‌نام اتحادیه صنفی</h2>
        </div>
        <p className="text-blue-100 mt-2">لطفاً اطلاعات اتحادیه خود را کامل وارد کنید</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="inline h-4 w-4 ml-1" />
              نام اتحادیه
            </label>
            <select
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
            >
              <option value="">نوع اتحادیه را انتخاب کنید</option>
              {unionTypes.map(unionType => (
                <option key={unionType} value={unionType}>{unionType}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 ml-1" />
              رئیس اتحادیه
            </label>
            <input
              type="text"
              name="headOfUnion"
              required
              value={formData.headOfUnion}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
              placeholder="نام و نام خانوادگی"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 ml-1" />
              استان/منطقه
            </label>
            <select
              name="region"
              required
              value={formData.region}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
            >
              <option value="">استان را انتخاب کنید</option>
              {iranProvinces.map(province => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline h-4 w-4 ml-1" />
              کد اقتصادی
            </label>
            <input
              type="text"
              name="economicCode"
              required
              value={formData.economicCode}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
              placeholder="کد اقتصادی ۱۰ رقمی"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 ml-1" />
              سال مالی
            </label>
            <select
              name="fiscalYear"
              required
              value={formData.fiscalYear}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
            >
              <option value="1400">1400</option>
              <option value="1401">1401</option>
              <option value="1402">1402</option>
              <option value="1403">1403</option>
              <option value="1404">1404</option>
            </select>
          </div>

        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            کد یکتای اتحادیه
          </label>
          <input
            type="text"
            name="code"
            required
            value={formData.code}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
            placeholder="مثال: TEH001"
          />
          <p className="text-sm text-gray-500 mt-1">
            این کد برای ورود به سامانه استفاده خواهد شد
          </p>
        </div>

        <div className="flex justify-end space-x-reverse space-x-4 pt-4 border-t">
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl backdrop-blur-sm font-medium"
          >
            {isLoading ? 'در حال ثبت...' : 'ثبت اتحادیه'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Registration;