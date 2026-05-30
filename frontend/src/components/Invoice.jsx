import React from 'react';
import { 
  Printer, 
  CheckCircle, 
  Home, 
  MapPin, 
  CreditCard, 
  Calendar 
} from 'lucide-react';

export default function Invoice({ order, onGoHome }) {
  const invoiceId = order.id || `FTK-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  const textMessage = `كابتن أيمن، لقد قمت بطلب مكملات من متجر فورمتك.
- رقم الطلب: ${invoiceId}
- العميل: ${order.shippingInfo.name}
- الهاتف: ${order.shippingInfo.phone}
- العنوان: ${order.shippingInfo.address}
- طريقة الدفع: ${order.paymentMethod}
- الإجمالي: ${order.total.toLocaleString()} EGP`;

  const encodedMsg = encodeURIComponent(textMessage);
  const whatsappUrl = `https://wa.me/201020988478?text=${encodedMsg}`;

  return (
    <section className="py-24 px-[5%] max-w-4xl mx-auto text-right">
      
      {/* Alert Header */}
      <div className="bg-neonGreen/10 border border-neonGreen/30 rounded-2xl p-6 text-center flex flex-col items-center gap-3 mb-8 shadow-[0_0_20px_rgba(0,255,102,0.1)] animate-pulse">
        <CheckCircle className="w-12 h-12 text-neonGreen" />
        <h2 className="text-lg font-black text-white">تم تأكيد طلبك بنجاح!</h2>
        <p className="text-xs text-textSecondary max-w-lg leading-relaxed">
          تم إنشاء فاتورتك الرقمية بنجاح. يرجى الضغط على زر الإرسال لإخطار إدارة المتجر عبر الواتساب لتجهيز طلبك على الفور، أو حفظ الفاتورة كملف PDF.
        </p>
      </div>

      {/* Printable Invoice */}
      <div id="printable-invoice" className="bg-secondary border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl relative mb-8">
        <div className="absolute top-0 inset-x-0 h-1 bg-neonGreen"></div>

        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-white/5 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 justify-end sm:justify-start">
              <h1 className="text-lg font-black font-display tracking-widest text-white">FORM<span className="text-neonGreen">TEK</span></h1>
              <svg className="w-7 h-7 text-neonGreen" viewBox="0 0 100 100">
                <path d="M25 15 H80 V32 H45 V48 H72 V64 H45 V85 H25 Z" fill="currentColor"/>
              </svg>
            </div>
            <p className="text-[10px] text-textSecondary">القنطرة شرق - الإسماعيلية، جمهورية مصر العربية</p>
            <p className="text-[10px] text-textSecondary">دعم العملاء: 01020988478</p>
          </div>

          <div className="text-right">
            <h2 className="text-lg font-black text-white mb-2">فاتورة شراء رقمية</h2>
            <div className="flex flex-col gap-1 text-[11px] text-textSecondary font-mono">
              <div>رقم الفاتورة: <span className="text-white font-bold">{invoiceId}</span></div>
              <div>تاريخ الطلب: <span className="text-white">{orderDate}</span></div>
              <div>حالة الدفع: <span className="text-neonGreen bg-neonGreen/5 px-2 py-0.5 rounded border border-neonGreen/10 font-sans font-bold">قيد المراجعة</span></div>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-xs leading-relaxed">
          <div className="bg-primary/45 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
            <h3 className="font-extrabold text-white border-r-2 border-neonGreen pr-2 flex items-center justify-end gap-1.5 mb-1.5">
              <span>بيانات الشحن والتسليم</span>
              <MapPin className="w-3.5 h-3.5 text-neonGreen" />
            </h3>
            <div className="flex flex-col gap-1.5 text-textSecondary">
              <div>كابتن المستلم: <span className="text-white font-bold">{order.shippingInfo.name}</span></div>
              <div>رقم الهاتف: <span className="text-white font-bold font-mono">{order.shippingInfo.phone}</span></div>
              <div>موقع التوصيل: <span className="text-white font-bold">{order.shippingInfo.address}</span></div>
            </div>
          </div>

          <div className="bg-primary/45 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
            <h3 className="font-extrabold text-white border-r-2 border-neonGreen pr-2 flex items-center justify-end gap-1.5 mb-1.5">
              <span>تفاصيل الدفع المحول</span>
              <CreditCard className="w-3.5 h-3.5 text-neonGreen" />
            </h3>
            <div className="flex flex-col gap-1.5 text-textSecondary">
              <div>طريقة التحويل: <span className="text-white font-bold">{order.paymentMethod}</span></div>
              <div>حساب المرسل منه: <span className="text-white font-bold font-mono">{order.paymentDetail}</span></div>
              <div>حالة تأكيد الدفع: <span className="text-accentGold font-bold">انتظار المراجعة (Pending)</span></div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border border-white/5 rounded-xl overflow-hidden mb-8">
          <table className="w-full text-right text-xs">
            <thead className="bg-primary/70 text-textSecondary border-b border-white/5 font-bold">
              <tr>
                <th className="p-3">المنتج والمكمل الغذائي</th>
                <th className="p-3 text-center">الكمية</th>
                <th className="p-3 text-left">السعر الفردي</th>
                <th className="p-3 text-left">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {order.cartItems.map((item, index) => (
                <tr key={index} className="hover:bg-primary/20 transition-colors">
                  <td className="p-3 text-white font-bold">{item.name}</td>
                  <td className="p-3 text-center font-mono text-white">{item.quantity}</td>
                  <td className="p-3 text-left font-mono text-textSecondary">{item.price.toLocaleString()} EGP</td>
                  <td className="p-3 text-left font-mono font-bold text-neonGreen">{(item.price * item.quantity).toLocaleString()} EGP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-white/5 pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white p-1 rounded shadow flex-shrink-0">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="#fff"/>
                <rect x="5" y="5" width="30" height="30" fill="#000"/>
                <rect x="10" y="10" width="20" height="20" fill="#fff"/>
                <rect x="65" y="5" width="30" height="30" fill="#000"/>
                <rect x="70" y="10" width="20" height="20" fill="#fff"/>
                <rect x="5" y="65" width="30" height="30" fill="#000"/>
                <rect x="10" y="70" width="20" height="20" fill="#fff"/>
                <rect x="40" y="40" width="20" height="20" fill="#000"/>
              </svg>
            </div>
            <div className="text-right">
              <h4 className="text-xs font-bold text-white mb-1">رمز التحقق الذكي QR</h4>
              <p className="text-[10px] text-textSecondary leading-relaxed">امسح الكود ضوئياً لتتبع حالة شحنتك لحظة بلحظة عبر النظام.</p>
            </div>
          </div>

          <div className="w-full sm:w-64 text-xs flex flex-col gap-2">
            <div className="flex justify-between text-textSecondary">
              <span className="font-mono text-white">{order.total.toLocaleString()} EGP</span>
              <span>المجموع الكلي للمشتريات:</span>
            </div>
            <div className="flex justify-between text-textSecondary">
              <span className="text-neonGreen">مجاني 🚚</span>
              <span>الشحن والتوصيل:</span>
            </div>
            <div className="flex justify-between text-sm font-black text-white border-t border-white/5 pt-3 mt-1">
              <span className="text-neonGreen font-display text-base font-mono">{order.total.toLocaleString()} EGP</span>
              <span>الإجمالي المستحق:</span>
            </div>
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button 
          onClick={handlePrint}
          className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white font-semibold py-3 px-6 rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer text-xs"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة الفاتورة أو حفظ كـ PDF</span>
        </button>

        <a 
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20ba5a] text-white font-black py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 text-xs"
        >
          💬 إرسال الفاتورة للمالك لتأكيد الشحن
        </a>

        <button 
          onClick={onGoHome}
          className="w-full sm:w-auto bg-neonGreen hover:bg-neonGreenHover text-black font-extrabold py-3 px-8 rounded-xl transition-all transform hover:-translate-y-0.5 shadow-md cursor-pointer text-xs flex items-center justify-center gap-1.5"
        >
          <Home className="w-4 h-4 text-black" />
          <span>العودة للرئيسية</span>
        </button>
      </div>

    </section>
  );
}
