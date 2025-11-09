import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Union } from '../App';

interface DocumentUploadProps {
  onUpload: (financialData: Union['financial_data']) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  category: 'balance_sheet' | 'profit_loss' | 'cash_flow' | 'other';
  file: File;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUpload }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [financialData, setFinancialData] = useState({
    annualRevenue: 0,
    totalAssets: 0,
    memberCount: 0,
    governmentSupport: false
  });
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const acceptedFileTypes = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'text/csv': '.csv'
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => 
      Object.keys(acceptedFileTypes).includes(file.type)
    );

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      category: 'other',
      file,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const updateFileCategory = (fileId: string, category: UploadedFile['category']) => {
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === fileId ? { ...file, category } : file
      )
    );
  };

  const processDocuments = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append('files', file.file);
        formData.append('categories', file.category);
      });

      // 1. ارسال فایل‌ها به Webhook در n8n
      const n8nResponse = await fetch('https://kamyar0010k.app.n8n.cloud/webhook-test/8197cced-b0c5-4071-9f89-34868f13aab5', {
        method: 'POST',
        body: formData,
      });

      if (!n8nResponse.ok) throw new Error('خطا در ارسال فایل‌ها به n8n');

      
      const n8nData1 = await n8nResponse.json();
      const n8nData = JSON.parse(n8nData1.output); 
      console.log('niga',n8nData.totalRevenue);
      console.log('Server n8n text:', n8nData); // لاگ برای دیباگ
      if (n8nData) {
      console.log('n8nData.annualRevenue:', n8nData.annualRevenue); // لاگ برای دیباگ
        setFinancialData({
          annualRevenue: n8nData.annualRevenue || 0, // مقدار annualRevenue از n8n
          totalAssets: n8nData.totalRevenue || 0, // اگر totalAssets وجود نداشت، 0 بذار
          memberCount: n8nData.memberCount || 0, // مقدار memberCount از n8n
          governmentSupport: true, // حفظ مقدار قبلی governmentSupport
        });
        setShowManualEntry(true);
        setIsProcessing(false);
      } else {
        throw new Error('داده‌های مالی از n8n دریافت نشد');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در پردازش اسناد';
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

    // await new Promise(resolve => setTimeout(resolve, 3000));
    // const extractedData = {
    //   annualRevenue: Math.floor(Math.random() * 10000000000), // Random between 0-10B
    //   totalAssets: Math.floor(Math.random() * 8000000000), // Random between 0-8B
    //   memberCount: Math.floor(Math.random() * 1000), // Random between 0-1000
    //   governmentSupport: Math.random() > 0.7 // 30% chance
    // };

  //   setFinancialData(extractedData);
  //   setIsProcessing(false); 
  //   setShowManualEntry(true);
  // };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      setError('لطفاً حداقل یک فایل آپلود کنید');
      return;
    }

    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('financial_data', JSON.stringify(financialData));
    uploadedFiles.forEach(file => {
      formData.append('files', file.file);
      formData.append('categories', file.category);
    });

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
      const res = await fetch('http://api.zer0team.ir/requests/create/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await res.json();
      setSuccess('فایل‌ها و اطلاعات مالی با موفقیت آپلود شدند');
      onUpload(financialData);
      setUploadedFiles([]);
      setShowManualEntry(false);
    } catch (err: unknown) {
      // Type guard برای اطمینان از اینکه err از نوع Error هست
      const errorMessage = err instanceof Error ? err.message : 'خطا در آپلود فایل‌ها';
      setError(errorMessage);
      setSuccess(null);
      console.error('Upload error:', err);
    }
  };


  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryName = (category: UploadedFile['category']) => {
    const names = {
      balance_sheet: 'ترازنامه',
      profit_loss: 'سود و زیان',
      cash_flow: 'جریان نقدی',
      other: 'سایر'
    };
    return names[category];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Upload className="h-6 w-6 ml-2" />
          بارگذاری اسناد مالی
        </h2>
        <p className="text-gray-600 mb-6">
          لطفاً اسناد مالی اتحادیه شامل ترازنامه، سود و زیان، و سایر گزارش‌های مالی را بارگذاری کنید.
        </p>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver 
              ? 'border-blue-400 bg-blue-50/50 backdrop-blur-sm' 
              : 'border-white/40 hover:border-white/60 bg-white/10 backdrop-blur-sm'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            فایل‌ها را اینجا بکشید یا کلیک کنید
          </p>
          <p className="text-sm text-gray-500 mb-4">
                        فرمت پشتیبانی شده: Excel (.xlsx)

          </p>
          <input
            type="file"
            multiple
            accept={Object.values(acceptedFileTypes).join(',')}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 cursor-pointer transition-all duration-300 shadow-xl backdrop-blur-sm"
          >
            انتخاب فایل‌ها
          </label>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">فایل‌های بارگذاری شده</h3>
            <div className="space-y-3">
              {uploadedFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between p-4 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl shadow-lg">
                  <div className="flex items-center space-x-reverse space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-reverse space-x-3">
                    
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={processDocuments}
                disabled={isProcessing}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl backdrop-blur-sm font-medium"
              >
                {isProcessing ? 'در حال پردازش...' : 'تجزیه و تحلیل اسناد'}
              </button>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {isProcessing && (
          <div className="mt-6 bg-blue-50/80 backdrop-blur-xl border border-blue-200/50 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 ml-3"></div>
              <p className="text-blue-700">در حال استخراج اطلاعات مالی از اسناد...</p>
            </div>
          </div>
        )}

        {/* Manual Data Entry */}
        {showManualEntry && (
          <div className="mt-6 bg-white/30 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
              بررسی و تأیید اطلاعات استخراج شده
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  درآمد سالانه (ریال)
                </label>
                <input
                  type="number"
                  value={financialData.annualRevenue}
                  onChange={(e) => setFinancialData(prev => ({
                    ...prev,
                    annualRevenue: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
                />
                <p className="text-xs text-gray-500 mt-1">
                  حد آستانه: ۵ میلیارد ریال
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  کل دارایی‌ها (ریال)
                </label>
                <input
                  type="number"
                  value={financialData.totalAssets}
                  onChange={(e) => setFinancialData(prev => ({
                    ...prev,
                    totalAssets: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
                />
                <p className="text-xs text-gray-500 mt-1">
                  حد آستانه: ۳ میلیارد ریال
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تعداد اعضای اتحادیه
                </label>
                <input
                  type="number"
                  value={financialData.memberCount}
                  onChange={(e) => setFinancialData(prev => ({
                    ...prev,
                    memberCount: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800"
                />
                <p className="text-xs text-gray-500 mt-1">
                  حد آستانه: ۵۰۰ نفر
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  حمایت مالی دولت
                </label>
                <div className="flex items-center space-x-reverse space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="governmentSupport"
                      checked={financialData.governmentSupport}
                      onChange={() => setFinancialData(prev => ({ ...prev, governmentSupport: true }))}
                      className="ml-2"
                    />
                    دارد
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="governmentSupport"
                      checked={!financialData.governmentSupport}
                      onChange={() => setFinancialData(prev => ({ ...prev, governmentSupport: false }))}
                      className="ml-2"
                    />
                    ندارد
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-xl backdrop-blur-sm font-medium"
              >
                ارزیابی نهایی و مشاهده نتایج
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;