import React, { useState } from 'react';
import { toast } from './ui/Toast';
import { uploadAPI } from '../services/api';
import { 
  User, 
  MapPin, 
  CreditCard, 
  Package, 
  Bell, 
  Heart, 
  Camera, 
  Plus, 
  Trash2, 
  Settings, 
  CheckCircle, 
  Clock, 
  Truck, 
  ArrowLeft,
  ChevronLeft,
  LogOut
} from 'lucide-react';

// Runtime API base — works from both file:// and http://localhost:5000
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('github.io')) {
      return 'https://formtek-production.up.railway.app';
    }
    if (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
  }
  return window.location.origin;
};

export default function UserProfile({ 
  user, 
  onUpdateUser, 
  orders, 
  favorites, 
  products, 
  onToggleFavorite, 
  onAddToCart, 
  onNavigateToAdmin,
  onNavigateToHome,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState("info");
  
  // Local edit states
  const [personalInfo, setPersonalInfo] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    avatar: user?.avatar || ""
  });

  const [addresses, setAddresses] = useState(() => {
    return user?.addresses || [];
  });
  const [newAddress, setNewAddress] = useState({ title: "", city: "", details: "" });
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState(() => {
    return user?.paymentMethods || [];
  });
  const [newPayment, setNewPayment] = useState({ type: "Vodafone Cash", details: "" });
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: 1, title: "أهلاً بك في متجر فورمتك!", message: "تم تفعيل حسابك الرياضي بنجاح. تصفح أفضل المكملات الآن.", date: "اليوم" },
    { id: 2, title: "عرض التخفيض الحار", message: "خصم 10% فوري باستخدام كوبون FORMTEK10 على الواي بروتين.", date: "أمس" }
  ]);

  const handleUpdateInfo = (e) => {
    e.preventDefault();
    onUpdateUser({ ...personalInfo, addresses, paymentMethods });
    toast.success("تم حفظ البيانات الشخصية بنجاح! ✅");
  };

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const getAvatarSrc = () => {
    if (!personalInfo.avatar) {
      return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop";
    }
    let src = personalInfo.avatar.startsWith('/uploads')
      ? `${getApiBase()}${personalInfo.avatar}`
      : personalInfo.avatar;
    // Force HTTPS to prevent Mixed Content blocks on secure pages
    return src.replace(/^http:\/\//, 'https://');
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ─── Auto-compress image using Canvas API ───────────────────────────────
    // Works for any size image from any phone — compresses to under 1MB automatically
    const compressImage = (inputFile) => new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(inputFile);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX_DIM = 800; // Max 800px width or height for avatar
        let w = img.width;
        let h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) { h = Math.round((h / w) * MAX_DIM); w = MAX_DIM; }
          else       { w = Math.round((w / h) * MAX_DIM); h = MAX_DIM; }
        }
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(inputFile); };
      img.src = url;
    });

    const useBase64AvatarFallback = (blob) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPersonalInfo(prev => ({ ...prev, avatar: event.target.result }));
        toast.success("تم تحديث الصورة الشخصية محلياً! انقر على حفظ التغييرات لحفظها. 📸");
      };
      reader.readAsDataURL(blob);
    };

    try {
      setUploadingAvatar(true);
      toast.info("جاري ضغط الصورة ورفعها... ⏳");

      const compressed = await compressImage(file);
      const compressedFile = new File([compressed], 'avatar.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('avatar', compressedFile);

      const { data } = await uploadAPI.avatar(formData);
      if (data.success && data.url) {
        setPersonalInfo(prev => ({ ...prev, avatar: data.url.replace(/^http:\/\//, 'https://') }));
        toast.success("تم رفع الصورة الشخصية بنجاح! انقر على حفظ التغييرات لحفظها. 📸");
      } else {
        useBase64AvatarFallback(compressed);
      }
    } catch (err) {
      console.warn("Server avatar upload failed, falling back to Base64:", err);
      try {
        const compressed = await compressImage(file);
        useBase64AvatarFallback(compressed);
      } catch { useBase64AvatarFallback(file); }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddress.title || !newAddress.city || !newAddress.details) return;
    const updated = [...addresses, { id: Date.now(), ...newAddress }];
    setAddresses(updated);
    onUpdateUser({ addresses: updated });
    setNewAddress({ title: "", city: "", details: "" });
    setShowAddressForm(false);
    toast.success("تم إضافة العنوان وحفظه بنجاح! ✅");
  };

  const handleDeleteAddress = (id) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    onUpdateUser({ addresses: updated });
    toast.info("تم حذف العنوان! 🗑️");
  };

  const handleAddPayment = (e) => {
    e.preventDefault();
    if (!newPayment.details) return;
    const updated = [...paymentMethods, { id: Date.now(), ...newPayment }];
    setPaymentMethods(updated);
    onUpdateUser({ paymentMethods: updated });
    setNewPayment({ type: "Vodafone Cash", details: "" });
    setShowPaymentForm(false);
    toast.success("تم إضافة وسيلة الدفع وحفظها بنجاح! ✅");
  };

  const handleDeletePayment = (id) => {
    const updated = paymentMethods.filter(p => p.id !== id);
    setPaymentMethods(updated);
    onUpdateUser({ paymentMethods: updated });
    toast.info("تم حذف وسيلة الدفع! 🗑️");
  };

  return (
    <section className="py-24 px-[5%] max-w-6xl mx-auto text-right">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/5 pb-4">
        <button 
          onClick={onNavigateToHome}
          className="text-xs text-textSecondary hover:text-neonGreen border border-white/10 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>العودة للتسوق</span>
        </button>
        <div>
          <h2 className="text-xl font-black text-white">الملف الشخصي للرياضي</h2>
          <p className="text-xs text-textSecondary mt-1">إدارة معلوماتك، تتبع الطلبات، وتعديل العناوين ووسائل الدفع.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 bg-secondary/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 h-fit flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
          <button 
            onClick={() => setActiveTab("info")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "info" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>بيانات الحساب</span>
            <User className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab("orders")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "orders" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>طلباتي السابقة تتبعها</span>
            <Package className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab("addresses")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "addresses" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>إدارة العناوين</span>
            <MapPin className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab("payments")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "payments" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>طرق الدفع المفضلة</span>
            <CreditCard className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab("wishlist")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "wishlist" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>المنتجات المفضلة ({favorites.length})</span>
            <Heart className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab("notifications")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "notifications" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>التنبيهات والإشعارات ({notifications.length})</span>
            <Bell className="w-4 h-4" />
          </button>

          {/* Admin panel trigger */}
          {user?.role === 'admin' && (
            <button 
              onClick={onNavigateToAdmin}
              className="mt-6 text-right text-xs font-extrabold text-accentRed border border-accentRed/35 bg-accentRed/5 px-4 py-3.5 rounded-xl hover:bg-accentRed hover:text-white transition-all whitespace-nowrap flex items-center justify-end gap-2"
            >
              <span>لوحة الإدارة والمبيعات</span>
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Logout Button */}
          <button 
            onClick={() => { if(onLogout) onLogout(); }}
            className="mt-2 text-right text-xs font-extrabold text-red-400 border border-red-500/25 bg-red-500/5 px-4 py-3.5 rounded-xl hover:bg-red-500 hover:text-white transition-all whitespace-nowrap flex items-center justify-end gap-2 cursor-pointer"
          >
            <span>تسجيل الخروج</span>
            <LogOut className="w-4 h-4" />
          </button>
        </aside>

        {/* Content Box */}
        <div className="flex-grow bg-secondary/40 border border-white/5 p-6 md:p-8 rounded-2xl shadow-lg">
          
          {/* Tab 1: Personal Info */}
          {activeTab === "info" && (
            <form onSubmit={handleUpdateInfo} className="flex flex-col gap-6 animate-fadeIn">
              <h3 className="text-sm font-extrabold text-white border-r-2 border-neonGreen pr-2.5">تعديل بيانات الحساب الرياضي</h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-white/5 pb-6">
                <div className="relative w-24 h-24 rounded-full border-2 border-neonGreen overflow-hidden flex items-center justify-center bg-primary">
                  {uploadingAvatar ? (
                    <span className="w-6 h-6 border-2 border-neonGreen/30 border-t-neonGreen rounded-full animate-spin" />
                  ) : (
                    <img src={getAvatarSrc()} alt="User Avatar" className="w-full h-full object-cover" />
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                    <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar} className="hidden" />
                  </label>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-white text-sm">{personalInfo.name}</h4>
                  <p className="text-[11px] text-textSecondary mt-0.5">{personalInfo.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-textSecondary">الاسم الكامل</label>
                  <input 
                    type="text" 
                    value={personalInfo.name}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                    className="text-xs bg-primary/60 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-neonGreen/45"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-textSecondary">رقم الجوال</label>
                  <input 
                    type="tel" 
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                    className="text-xs bg-primary/60 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-neonGreen/45 font-mono"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="bg-neonGreen text-black font-extrabold text-xs py-3 rounded-lg hover:bg-neonGreenHover transition-colors mt-2 cursor-pointer"
              >
                حفظ التغييرات
              </button>
            </form>
          )}

          {/* Tab 2: Orders Tracking & History */}
          {activeTab === "orders" && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <h3 className="text-sm font-extrabold text-white border-r-2 border-neonGreen pr-2.5">سجل وتتبع شحناتك الرياضية</h3>
              
              {orders.length === 0 ? (
                <div className="text-center py-12 text-textSecondary text-xs">
                  لا توجد طلبات سابقة مسجلة لحسابك حتى الآن.
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {orders.map((o) => {
                    const statusSteps = {
                      "Pending": 1,
                      "Paid": 2,
                      "Shipped": 3,
                      "Delivered": 4
                    };
                    const currentStep = statusSteps[o.status] || 1;

                    return (
                      <div key={o.id} className="bg-primary/45 border border-white/5 p-5 rounded-xl flex flex-col gap-4">
                        <div className="flex justify-between items-start border-b border-white/5 pb-3">
                          <div>
                            <span className="text-[10px] text-textSecondary font-mono block">رقم الفاتورة: {o.id}</span>
                            <span className="text-xs font-bold text-white mt-1 block">القيمة الإجمالية: {o.total.toLocaleString()} EGP</span>
                          </div>
                          <span className={`inline-block px-3 py-1 rounded-md border text-[10px] font-bold ${
                            o.status === "Pending" ? 'bg-accentGold/10 border-accentGold/30 text-accentGold' :
                            o.status === "Paid" ? 'bg-neonGreen/10 border-neonGreen/30 text-neonGreen' :
                            'bg-neonBlue/10 border-neonBlue/30 text-neonBlue'
                          }`}>
                            {o.status}
                          </span>
                        </div>

                        {/* Order Items list */}
                        <div className="flex flex-col gap-2 text-xs">
                          {o.cartItems?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-textSecondary">
                              <span>{(item.price * item.quantity).toLocaleString()} EGP</span>
                              <span>{item.name} <span className="text-white font-mono font-bold">x{item.quantity}</span></span>
                            </div>
                          ))}
                        </div>

                        {/* Stepper visual tracker */}
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <h4 className="text-[10px] text-textSecondary font-bold mb-3">مراحل الشحن والتسليم المباشر:</h4>
                          <div className="grid grid-cols-4 gap-2 text-center text-[9px] text-textSecondary relative">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${currentStep >= 1 ? 'bg-neonGreen text-black' : 'bg-white/5'}`}>✓</span>
                              <span className={currentStep >= 1 ? 'text-white font-bold' : ''}>طلب مسجل</span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${currentStep >= 2 ? 'bg-neonGreen text-black' : 'bg-white/5'}`}>
                                {currentStep >= 2 ? "✓" : "2"}
                              </span>
                              <span className={currentStep >= 2 ? 'text-white font-bold' : ''}>تم الدفع</span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${currentStep >= 3 ? 'bg-neonGreen text-black' : 'bg-white/5'}`}>
                                {currentStep >= 3 ? "✓" : "3"}
                              </span>
                              <span className={currentStep >= 3 ? 'text-white font-bold' : ''}>قيد الشحن</span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${currentStep >= 4 ? 'bg-neonGreen text-black' : 'bg-white/5'}`}>
                                {currentStep >= 4 ? "✓" : "4"}
                              </span>
                              <span className={currentStep >= 4 ? 'text-white font-bold' : ''}>تم التسليم</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Address Manager */}
          {activeTab === "addresses" && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <button 
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="bg-neonGreen text-black font-extrabold text-[10px] px-3 py-1.5 rounded-lg hover:bg-neonGreenHover flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-black" />
                  <span>أضف عنوان جديد</span>
                </button>
                <h3 className="text-sm font-extrabold text-white">عناوين الشحن المسجلة</h3>
              </div>

              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="bg-primary/50 border border-white/15 p-4 rounded-xl flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      placeholder="عنوان المسمى (مثال: العمل)" 
                      value={newAddress.title}
                      onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
                      className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45"
                    />
                    <input 
                      type="text" 
                      placeholder="المحافظة / المدينة" 
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45"
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="التفاصيل بالكامل (الشارع والمنزل)" 
                    value={newAddress.details}
                    onChange={(e) => setNewAddress({ ...newAddress, details: e.target.value })}
                    className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45"
                  />
                  <button 
                    type="submit"
                    className="bg-neonGreen text-black font-extrabold text-xs py-2 rounded-lg"
                  >
                    حفظ العنوان
                  </button>
                </form>
              )}

              <div className="flex flex-col gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="bg-primary/30 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                    <button 
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-textSecondary hover:text-accentRed transition-colors animate-pulse cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-right">
                      <span className="bg-white/5 border border-white/10 text-[9px] text-white px-2 py-0.5 rounded font-bold">{addr.title}</span>
                      <h4 className="text-xs font-bold text-white mt-1.5">{addr.city}</h4>
                      <p className="text-[11px] text-textSecondary mt-0.5">{addr.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Payments Settings */}
          {activeTab === "payments" && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <button 
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                  className="bg-neonGreen text-black font-extrabold text-[10px] px-3 py-1.5 rounded-lg hover:bg-neonGreenHover flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-black" />
                  <span>إضافة وسيلة دفع</span>
                </button>
                <h3 className="text-sm font-extrabold text-white">وسائل الدفع المحفوظة</h3>
              </div>

              {showPaymentForm && (
                <form onSubmit={handleAddPayment} className="bg-primary/50 border border-white/15 p-4 rounded-xl flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <select 
                      value={newPayment.type}
                      onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value })}
                      className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45"
                    >
                      <option value="Vodafone Cash">فودافون كاش</option>
                      <option value="InstaPay">إنستا باي</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="رقم المحفظة أو الاسم" 
                      value={newPayment.details}
                      onChange={(e) => setNewPayment({ ...newPayment, details: e.target.value })}
                      className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="bg-neonGreen text-black font-extrabold text-xs py-2 rounded-lg"
                  >
                    حفظ وسيلة الدفع
                  </button>
                </form>
              )}

              <div className="flex flex-col gap-4">
                {paymentMethods.map((pay) => (
                  <div key={pay.id} className="bg-primary/30 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                    <button 
                      onClick={() => handleDeletePayment(pay.id)}
                      className="text-textSecondary hover:text-accentRed transition-colors animate-pulse cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-right">
                      <span className="bg-white/5 border border-white/10 text-[9px] text-white px-2 py-0.5 rounded font-bold">{pay.type}</span>
                      <h4 className="text-xs font-bold text-white mt-1.5 font-mono">{pay.details}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Wishlist */}
          {activeTab === "wishlist" && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <h3 className="text-sm font-extrabold text-white border-r-2 border-neonGreen pr-2.5">قائمة المكملات المفضلة</h3>
              
              {favorites.length === 0 ? (
                <div className="text-center py-12 text-textSecondary text-xs">
                  لم تقم بحفظ أي منتجات للمفضلة حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.filter(p => {
                    const pid = p._id || p.id;
                    return favorites.includes(pid);
                  }).map(prod => {
                    const pid = prod._id || prod.id;
                    return (
                      <div key={pid} className="bg-primary/30 border border-white/5 p-4 rounded-xl flex gap-3.5 items-center justify-between">
                        <button 
                          onClick={() => onToggleFavorite(pid)}
                          className="text-accentRed hover:text-red-400"
                          title="إزالة من المفضلة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex-grow text-right">
                          <h4 className="font-bold text-xs text-white line-clamp-1 leading-normal mb-1">{prod.name}</h4>
                          <div className="text-[11px] text-neonGreen font-mono font-bold">{prod.price.toLocaleString()} EGP</div>
                        </div>
                        <div className="w-14 h-14 bg-tertiary flex items-center justify-center p-1 rounded-lg shrink-0">
                          <img src={prod.image} alt={prod.name} className="max-h-full max-w-full object-contain" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 6: Notifications */}
          {activeTab === "notifications" && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h3 className="text-sm font-extrabold text-white border-r-2 border-neonGreen pr-2.5">الإشعارات والتنبيهات المباشرة</h3>
              
              <div className="flex flex-col gap-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className="bg-primary/30 border border-white/5 p-4 rounded-xl text-right">
                    <div className="flex justify-between items-center text-[10px] text-textSecondary mb-1.5">
                      <span>{notif.date}</span>
                      <span className="font-bold text-white">{notif.title}</span>
                    </div>
                    <p className="text-xs text-textSecondary leading-relaxed">{notif.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
