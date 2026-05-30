import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Trash2, Ticket, ArrowLeft, Plus, Minus, Tag } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import { toast } from './ui/Toast';

export default function Cart({ isOpen, onClose, onCheckout, onBrowseProducts }) {
  const { items, removeItem, updateQty, clearCart, applyCoupon, removeCoupon, coupon, discountPercent, getSubtotal, getDiscount, getTotal } = useCartStore();
  const [couponInput, setCouponInput] = useState('');

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotal();

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    const result = applyCoupon(couponInput);
    if (result.success) toast.success(`🎉 تم تطبيق الكوبون! خصم ${result.percent}%`);
    else toast.error('كود الخصم غير صحيح أو منتهي الصلاحية');
    setCouponInput('');
  };

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
  const IMG_BASE = getApiBase();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'rgba(5,5,7,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="absolute inset-0" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="relative w-full max-w-md bg-secondary border-l border-white/8 h-full flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.7)] z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-textSecondary hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm text-white">سلة المشتريات</h2>
                <div className="w-7 h-7 bg-neonGreen/10 border border-neonGreen/20 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-3.5 h-3.5 text-neonGreen" />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-textSecondary">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-textSecondary/50" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white mb-1">السلة فارغة</p>
                    <p className="text-xs text-textSecondary">أضف بعض المكملات لبناء قوتك!</p>
                  </div>
                  <button onClick={onBrowseProducts || onClose} className="bg-neonGreen text-black font-extrabold text-xs px-6 py-2.5 rounded-xl hover:bg-neonGreenHover transition-all">
                    تصفح المنتجات
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map(item => {
                    const id = item._id || item.id;
                    const imgSrc = item.image?.startsWith('/uploads') ? `${IMG_BASE}${item.image}` : item.image;
                    return (
                      <motion.div key={id}
                        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30, height: 0 }}
                        layout className="bg-primary/60 border border-white/5 p-3.5 rounded-2xl flex gap-3 items-start"
                      >
                        <div className="w-16 h-16 rounded-xl bg-tertiary/60 flex items-center justify-center p-2 shrink-0">
                          <img src={imgSrc} alt={item.name} className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="flex-grow text-right">
                          <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug mb-1">{item.name}</h4>
                          <p className="text-[11px] text-neonGreen font-mono font-bold">{item.price.toLocaleString()} EGP</p>
                          <div className="flex items-center justify-between mt-2">
                            <button onClick={() => removeItem(id)} className="text-textSecondary hover:text-accentRed transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateQty(id, item.quantity + 1)}
                                className="w-6 h-6 rounded-lg bg-neonGreen/10 border border-neonGreen/20 flex items-center justify-center text-neonGreen hover:bg-neonGreen hover:text-black transition-all">
                                <Plus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold font-mono text-white w-5 text-center">{item.quantity}</span>
                              <button onClick={() => updateQty(id, item.quantity - 1)}
                                className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-textSecondary hover:bg-white/10 transition-all">
                                <Minus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-white/5 bg-primary/40 flex flex-col gap-4 shrink-0">
                {/* Coupon */}
                <div className="flex gap-2">
                  {coupon ? (
                    <div className="flex items-center gap-2 flex-grow bg-neonGreen/5 border border-neonGreen/20 px-3 py-2 rounded-xl">
                      <button onClick={removeCoupon} className="text-accentRed hover:text-red-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <Tag className="w-3.5 h-3.5 text-neonGreen" />
                      <span className="text-xs text-neonGreen font-bold flex-grow text-right">{coupon} — خصم {discountPercent}%</span>
                    </div>
                  ) : (
                    <>
                      <button onClick={handleApplyCoupon}
                        className="bg-neonGreen text-black font-extrabold text-[11px] px-4 py-2 rounded-xl hover:bg-neonGreenHover transition-all shrink-0">
                        تطبيق
                      </button>
                      <div className="relative flex-grow">
                        <input type="text" value={couponInput} onChange={e => setCouponInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder="كود الخصم..."
                          className="w-full text-xs bg-primary/70 border border-white/10 rounded-xl py-2 pl-3 pr-9 text-white outline-none focus:border-neonGreen/40 text-right placeholder-textSecondary/50" />
                        <Ticket className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textSecondary" />
                      </div>
                    </>
                  )}
                </div>

                {/* Price summary */}
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between text-textSecondary">
                    <span className="font-mono">{subtotal.toLocaleString()} EGP</span>
                    <span>المجموع الفرعي</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-accentRed font-bold">
                      <span className="font-mono">-{discount.toLocaleString()} EGP</span>
                      <span>الخصم ({discountPercent}%)</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neonGreen text-[11px]">
                    <span>مجاني</span>
                    <span>الشحن</span>
                  </div>
                  <div className="flex justify-between text-white font-extrabold text-sm border-t border-white/5 pt-2 mt-1">
                    <span className="font-display text-neonGreen font-mono">{total.toLocaleString()} EGP</span>
                    <span>الإجمالي</span>
                  </div>
                </div>

                {/* CTA */}
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => { onClose(); onCheckout(); }}
                  className="w-full bg-neonGreen hover:bg-neonGreenHover text-black font-extrabold text-sm py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,102,0.25)] transition-all">
                  <span>تأكيد الطلب والدفع</span>
                  <ArrowLeft className="w-4 h-4" />
                </motion.button>

                <button onClick={clearCart} className="text-[10px] text-textSecondary hover:text-accentRed transition-colors text-center">
                  إفراغ السلة بالكامل
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
