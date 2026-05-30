import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  Upload, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import useCartStore from '../store/useCartStore';
import { uploadAPI } from '../services/api';

export default function Checkout({ onConfirmOrder, onBackToCart }) {
  // Read cart from Zustand store
  const { items: cartItems, coupon } = useCartStore();
  const discountPercent = useCartStore(s => s.discountPercent) || 0;

  const [shippingInfo, setShippingInfo] = useState({ name: '', phone: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState('Vodafone Cash');
  const [paymentDetail, setPaymentDetail] = useState('');
  const [screenshotUploaded, setScreenshotUploaded] = useState(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountVal = Math.round(subtotal * (discountPercent / 100));
  const finalTotal = subtotal - discountVal;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      setError("حجم الصورة كبير جداً! الحد الأقصى هو 5 ميجابايت.");
      return;
    }

    try {
      setUploading(true);
      setError('');
      const formData = new FormData();
      formData.append('proof', file);

      const { data } = await uploadAPI.paymentProof(formData);
      if (data.success && data.url) {
        setPaymentProofUrl(data.url);
        setScreenshotUploaded(true);
      } else {
        setError("فشل رفع لقطة الشاشة");
      }
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ أثناء رفع صورة التحويل");
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      setError("برجاء ملء جميع حقول الشحن الإجبارية *");
      return;
    }
    if (shippingInfo.phone.length < 11) {
      setError("برجاء إدخال رقم هاتف صحيح مكون من 11 رقم");
      return;
    }
    if (!paymentDetail) {
      setError(paymentMethod === "Vodafone Cash" ? "برجاء إدخال رقم فودافون كاش الذي تم التحويل منه" : "برجاء إدخال اسمك المسجل في إنستاباي");
      return;
    }
    if (!screenshotUploaded) {
      setError("برجاء رفع صورة لقطة شاشة التحويل لتأكيد دفع طلبك");
      return;
    }

    setError("");
    onConfirmOrder({
      shippingInfo,
      paymentMethod,
      paymentDetail,
      paymentProof: paymentProofUrl,
      total: finalTotal
    });
  };

  return (
    <section className="py-24 px-[5%] max-w-5xl mx-auto text-right">
      <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
        <button 
          onClick={onBackToCart}
          className="text-xs text-textSecondary hover:text-neonGreen border border-white/10 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة لتعديل السلة</span>
        </button>
        <h2 className="text-xl font-black text-white">تفاصيل الشحن والدفع الآمن</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Forms */}
        <form onSubmit={handleFormSubmit} className="lg:col-span-2 flex flex-col gap-6 bg-secondary/40 backdrop-blur-md border border-white/5 p-6 md:p-8 rounded-2xl shadow-lg">
          {error && (
            <div className="bg-accentRed/10 border border-accentRed/30 text-accentRed text-xs font-bold p-4 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          {/* Shipping */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-white border-r-2 border-neonGreen pr-2.5">بيانات المستلم والتوصيل</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-textSecondary flex items-center justify-end gap-1.5">
                  <span>الاسم الكامل للمستلم *</span>
                  <User className="w-3 h-3 text-textSecondary" />
                </label>
                <input 
                  type="text" 
                  value={shippingInfo.name}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                  placeholder="مثال: أحمد عبد الله" 
                  className="text-xs bg-primary/60 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-neonGreen/40 text-right"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-textSecondary flex items-center justify-end gap-1.5">
                  <span>رقم الهاتف (الواتساب لإرسال الفاتورة) *</span>
                  <Phone className="w-3 h-3 text-textSecondary" />
                </label>
                <input 
                  type="tel" 
                  value={shippingInfo.phone}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                  placeholder="مثال: 01020304050" 
                  className="text-xs bg-primary/60 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-neonGreen/40 text-left font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-textSecondary flex items-center justify-end gap-1.5">
                <span>العنوان بالتفصيل والمحافظة *</span>
                <MapPin className="w-3 h-3 text-textSecondary" />
              </label>
              <input 
                type="text" 
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                placeholder="المحافظة - المدينة - الشارع - رقم المنزل" 
                className="text-xs bg-primary/60 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-neonGreen/40 text-right"
              />
            </div>
          </div>

          {/* Payment */}
          <div className="flex flex-col gap-4 mt-4">
            <h3 className="text-sm font-extrabold text-white border-r-2 border-neonGreen pr-2.5">اختر وسيلة التحويل والدفع</h3>

            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => { setPaymentMethod("Vodafone Cash"); setPaymentDetail(""); }}
                className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${
                  paymentMethod === "Vodafone Cash" 
                    ? 'border-neonGreen bg-neonGreen/5 shadow-[0_0_15px_rgba(0,255,102,0.1)]' 
                    : 'border-white/5 bg-primary/45 hover:border-white/10'
                }`}
              >
                <span className="text-2xl block mb-2">📱</span>
                <span className="text-xs font-bold text-white">فودافون كاش</span>
              </div>

              <div 
                onClick={() => { setPaymentMethod("InstaPay"); setPaymentDetail(""); }}
                className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${
                  paymentMethod === "InstaPay" 
                    ? 'border-neonGreen bg-neonGreen/5 shadow-[0_0_15px_rgba(0,255,102,0.1)]' 
                    : 'border-white/5 bg-primary/45 hover:border-white/10'
                }`}
              >
                <span className="text-2xl block mb-2">⚡</span>
                <span className="text-xs font-bold text-white">إنستا باي (InstaPay)</span>
              </div>
            </div>

            {/* Instruction Panel */}
            <div className="bg-primary/50 border border-white/5 rounded-xl p-5 mt-2 flex flex-col gap-4">
              {paymentMethod === "Vodafone Cash" ? (
                <>
                  <p className="text-xs text-textSecondary leading-relaxed">
                    قم بتحويل المبلغ الإجمالي للطلب إلى رقم محفظة فودافون كاش الرسمية للمتجر:
                  </p>
                  <div className="bg-secondary border border-white/5 p-3 rounded-lg text-center font-display font-extrabold text-lg text-neonGreen shadow-[inset_0_0_10px_rgba(0,255,102,0.05)] font-mono">
                    01020988478
                  </div>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[10px] text-textSecondary">رقم فودافون كاش الذي قمت بالتحويل منه *</label>
                    <input 
                      type="text" 
                      value={paymentDetail}
                      onChange={(e) => setPaymentDetail(e.target.value)}
                      placeholder="مثال: 010XXXXXXXX" 
                      className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/30 text-left font-mono"
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-textSecondary leading-relaxed">
                    قم بالتحويل الفوري عبر تطبيق InstaPay إلى العنوان الرياضي التالي:
                  </p>
                  <div className="bg-secondary border border-white/5 p-3 rounded-lg text-center font-display font-extrabold text-xs text-neonGreen shadow-[inset_0_0_10px_rgba(0,255,102,0.05)] font-mono">
                    aymanahmed@instapay
                  </div>
                  
                  {/* QR code */}
                  <div className="flex flex-col items-center gap-2 py-4">
                    <div className="w-32 h-32 bg-white p-2 rounded-lg shadow-lg">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <rect width="100" height="100" fill="#fff"/>
                        <rect x="10" y="10" width="25" height="25" fill="#000"/>
                        <rect x="15" y="15" width="15" height="15" fill="#fff"/>
                        <rect x="65" y="10" width="25" height="25" fill="#000"/>
                        <rect x="70" y="15" width="15" height="15" fill="#fff"/>
                        <rect x="10" y="65" width="25" height="25" fill="#000"/>
                        <rect x="15" y="70" width="15" height="15" fill="#fff"/>
                        <rect x="45" y="45" width="10" height="10" fill="#000"/>
                        <rect x="70" y="70" width="20" height="20" fill="#000"/>
                      </svg>
                    </div>
                    <span className="text-[9px] text-textSecondary">امسح الرمز ضوئياً للتحويل المباشر</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-textSecondary">اسم المرسل بالكامل في إنستا باي *</label>
                    <input 
                      type="text" 
                      value={paymentDetail}
                      onChange={(e) => setPaymentDetail(e.target.value)}
                      placeholder="اسمك المسجل في تطبيق InstaPay" 
                      className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/30"
                    />
                  </div>
                </>
              )}

              {/* Upload screenshot */}
              <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-white/5">
                <label className="text-[11px] text-textSecondary">إرفاق لقطة شاشة التحويل لإثبات الدفع *</label>
                <label className="bg-secondary hover:bg-secondary/80 border border-dashed border-white/10 hover:border-neonGreen/30 rounded-xl p-5 text-center cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors">
                  {uploading ? (
                    <span className="w-5 h-5 border-2 border-neonGreen/30 border-t-neonGreen rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-textSecondary" />
                  )}
                  <span className="text-[10px] text-textSecondary font-bold">
                    {uploading ? "جاري الرفع..." : screenshotUploaded ? "✅ تم رفع الصورة بنجاح!" : "اضغط لرفع لقطة الشاشة للتحويل"}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    disabled={uploading}
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-neonGreen hover:bg-neonGreenHover text-black font-black text-xs py-4 rounded-lg flex items-center justify-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-[0_4px_15px_rgba(0,255,102,0.2)] mt-4 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-black" />
            <span>تأكيد وإتمام الطلب وتوليد الفاتورة</span>
          </button>
        </form>

        {/* Sidebar Summary */}
        <div className="bg-secondary/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl h-fit flex flex-col gap-5 shadow-lg">
          <h3 className="font-extrabold text-xs text-white border-b border-white/5 pb-2">ملخص السلة</h3>
          
          <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center gap-3">
                <span className="text-xs font-bold text-neonGreen font-mono shrink-0">{(item.price * item.quantity).toLocaleString()} EGP</span>
                <span className="text-xs text-textSecondary line-clamp-1 flex-grow text-right">{item.name} <span className="font-bold text-white font-mono">x{item.quantity}</span></span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-4 flex flex-col gap-2.5 text-xs text-textSecondary">
            <div className="flex justify-between">
              <span className="font-mono text-white">{subtotal.toLocaleString()} EGP</span>
              <span>المجموع الفرعي:</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-accentRed font-bold">
                <span className="font-mono">-{discountVal.toLocaleString()} EGP</span>
                <span>الخصم المطبق:</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-neonGreen">شحن مجاني 🚚</span>
              <span>مصاريف الشحن:</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-white border-t border-white/5 pt-3 mt-1">
              <span className="text-neonGreen font-display">{finalTotal.toLocaleString()} EGP</span>
              <span>الإجمالي المستحق:</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
