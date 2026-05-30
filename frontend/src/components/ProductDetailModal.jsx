import React, { useState } from 'react';
import { X, ShoppingCart, Heart, Scale, Star, Camera, Calendar, ShieldCheck, Loader } from 'lucide-react';
import { productsAPI } from '../services/api';
import useAuthStore from '../store/useAuthStore';

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

export default function ProductDetailModal({ 
  product, 
  onClose, 
  onAddToCart, 
  onToggleFavorite, 
  isFavorite, 
  onAddToCompare,
  isInCompare 
}) {
  const { user } = useAuthStore();
  const isAvailable = product.isAvailable !== undefined ? product.isAvailable : (product.stock > 0);
  const imgSrc = (product.image?.startsWith('/uploads') ? `${IMG_BASE}${product.image}` : product.image || '')
    .replace(/^http:\/\//, 'https://');

  // Only show approved reviews from DB — no mock data
  const [reviews, setReviews] = useState(
    (product.reviews || []).filter(r => r.status === 'approved' || !r.status)
  );
  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating]         = useState(5);
  const [reviewMedia, setReviewMedia]     = useState(null);
  const [submitting, setSubmitting]       = useState(false);
  const [reviewError, setReviewError]     = useState('');

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    if (!user) {
      setReviewError('يجب تسجيل الدخول أولاً لإضافة تقييم 🔒');
      return;
    }
    setSubmitting(true);
    setReviewError('');
    try {
      const { data } = await productsAPI.addReview(product._id || product.id, {
        rating: newRating,
        comment: newReviewText
      });
      if (data.success) {
        setNewReviewText('');
        setNewRating(5);
        setReviewMedia(null);
        setReviewError('✅ تم إرسال تقييمك بنجاح وهو بانتظار موافقة الإدارة!');
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'فشل إرسال التقييم. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setReviewMedia({
        url,
        type: file.type.startsWith('video') ? 'video' : 'image'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-secondary border border-white/10 rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col md:flex-row my-4 md:my-8 md:max-h-[90vh] md:h-[750px] animate-fadeIn">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-3 left-3 z-30 w-8 h-8 rounded-lg bg-black/70 text-white flex items-center justify-center hover:bg-white/10 hover:text-neonGreen transition-colors border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Right Side in RTL (Left Column): Media & Nutrition specs */}
        <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 bg-tertiary/20 flex flex-col justify-between border-b md:border-b-0 md:border-l border-white/5 text-right md:overflow-y-auto">
          <div>
            <div className="flex items-center justify-center h-52 sm:h-72 md:h-80 rounded-xl bg-tertiary/40 p-4 relative overflow-hidden">
              <img src={imgSrc} alt={product.name} className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105" />
            </div>

            <div className="mt-6">
              <h4 className="font-extrabold text-xs text-white border-r-2 border-neonGreen pr-2 pb-0.5 mb-3">القيمة الغذائية لكل حصة:</h4>
              {product.specs && Object.keys(product.specs).length > 0 ? (
                <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px]">
                  {Object.entries(product.specs).map(([key, val]) => (
                    <div key={key} className="bg-primary/50 p-2.5 rounded-lg border border-white/5 flex justify-between items-center gap-2">
                      <span className="font-bold text-neonGreen font-mono truncate">{val || 'غير محدد'}</span>
                      <span className="text-textSecondary truncate">{key}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px]">
                  <div className="bg-primary/50 p-2.5 rounded-lg border border-white/5 flex justify-between items-center">
                    <span className="font-bold text-neonGreen font-mono">{product.weight || 'غير محدد'}</span>
                    <span className="text-textSecondary">الوزن</span>
                  </div>
                  <div className="bg-primary/50 p-2.5 rounded-lg border border-white/5 flex justify-between items-center">
                    <span className="font-bold text-neonGreen font-mono">{product.size || 'غير محدد'}</span>
                    <span className="text-textSecondary">الحجم</span>
                  </div>
                  <div className="bg-primary/50 p-2.5 rounded-lg border border-white/5 flex justify-between items-center">
                    <span className="font-bold text-neonGreen font-mono">{product.flavor || 'غير محدد'}</span>
                    <span className="text-textSecondary">النكهة</span>
                  </div>
                  <div className="bg-primary/50 p-2.5 rounded-lg border border-white/5 flex justify-between items-center">
                    <span className="font-bold text-neonGreen font-mono">غير محدد</span>
                    <span className="text-textSecondary">البروتين</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Left Side in RTL (Right Column): Main info & Reviews */}
        <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 flex flex-col justify-between text-right md:overflow-y-auto md:h-full">
          <div>
            {/* Goal, Brand & Compare */}
            <div className="flex items-center justify-between gap-4 mb-3 sm:mb-4">
              <button 
                onClick={() => onAddToCompare(product)}
                className={`text-[9px] sm:text-[10px] font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isInCompare 
                    ? 'border-neonGreen/40 bg-neonGreen/10 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.2)]'
                    : 'border-white/10 hover:border-neonGreen/30 text-textSecondary hover:text-white bg-primary/40'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{isInCompare ? '✓ قارن المنتج' : '⚖️ قارن المكمل'}</span>
              </button>
              <span className="text-[10px] font-extrabold text-neonBlue uppercase tracking-wider">{product.brand || 'FORMTEK'}</span>
            </div>

            {/* Title */}
            <h2 className="text-base sm:text-lg font-black text-white mb-1.5 leading-snug">{product.name}</h2>
            {product.nameEn && <p className="text-[9px] sm:text-[10px] text-textSecondary font-mono mb-3">{product.nameEn}</p>}

            {/* Ratings Summary */}
            <div className="flex items-center justify-end gap-1.5 text-[9px] sm:text-[10px] mb-4">
              <span className="text-textSecondary">({reviews.length} تقييم حقيقي)</span>
              <span className="font-bold text-white font-mono">{product.rating || '5.0'}</span>
              <div className="flex gap-0.5 text-accentGold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                ))}
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-textSecondary mb-5 leading-relaxed">
              {product.description}
            </p>

            {/* Buy Box */}
            <div className="bg-primary/50 border border-white/5 rounded-xl p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 mb-5">
              <div className="flex justify-between items-center">
                <div className="text-left font-mono">
                  {product.oldPrice && product.oldPrice > product.price && (
                    <span className="text-[10px] sm:text-xs text-textSecondary line-through block mb-0.5">
                      {Number(product.oldPrice).toLocaleString()} EGP
                    </span>
                  )}
                  <span className="text-lg sm:text-xl font-extrabold text-neonGreen font-display">
                    {Number(product.price).toLocaleString()} <span className="text-xs font-normal text-textSecondary">EGP</span>
                  </span>
                </div>
                <span className="text-xs text-textSecondary font-bold">السعر النهائي:</span>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button 
                  onClick={() => onToggleFavorite(product.id || product._id)}
                  className={`w-11 sm:w-12 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                    isFavorite 
                      ? 'border-accentRed/30 bg-accentRed/5 text-accentRed shadow-[0_0_8px_rgba(255,42,95,0.2)]'
                      : 'border-white/10 hover:border-accentRed/30 text-textSecondary hover:text-white bg-secondary/40'
                  }`}
                  title="المفضلة"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-accentRed text-accentRed' : ''}`} />
                </button>
                <button 
                  onClick={() => isAvailable && onAddToCart(product)}
                  disabled={!isAvailable}
                  className={`flex-1 font-extrabold text-xs py-3 rounded-lg flex items-center justify-center gap-2 transform transition-all cursor-pointer ${
                    isAvailable 
                      ? 'bg-neonGreen hover:bg-neonGreenHover text-black shadow-[0_4px_15px_rgba(0,255,102,0.2)] hover:-translate-y-0.5' 
                      : 'bg-white/5 text-textSecondary cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{isAvailable ? 'أضف إلى السلة' : 'نفذ من المخزن'}</span>
                </button>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="border-t border-white/5 pt-5">
              <h3 className="font-extrabold text-xs text-white mb-3">تقييمات مجتمع أبطال فورمتك:</h3>
              
              {/* Form */}
              <form onSubmit={handleSubmitReview} className="bg-primary/30 border border-white/5 rounded-xl p-3 sm:p-4 mb-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} 
                        type="button"
                        onClick={() => setNewRating(star)} 
                        className="transition-transform hover:scale-110"
                      >
                        <Star className={`w-3.5 h-3.5 ${star <= newRating ? 'text-accentGold fill-accentGold' : 'text-white/20'}`} />
                      </button>
                    ))}
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-textSecondary font-bold">شاركنا تقييمك الرياضي:</span>
                </div>
                
                <textarea 
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="كيف كانت تجربتك مع هذا المكمل من حيث الطعم والأداء؟..." 
                  className="w-full text-xs bg-secondary border border-white/5 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/40 resize-none h-14 text-right placeholder-textSecondary"
                />
                
                <div className="flex justify-between items-center gap-3">
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="bg-neonGreen text-black font-extrabold text-[9px] sm:text-[10px] px-3.5 py-2 rounded-lg hover:bg-neonGreenHover transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submitting ? <Loader className="w-3 h-3 animate-spin" /> : null}
                    {submitting ? 'جاري الإرسال...' : 'نشر التقييم'}
                  </button>
                  <label className="text-[9px] sm:text-[10px] text-textSecondary bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 cursor-pointer flex items-center gap-1.5 transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    <span>رفع صورة النتائج</span>
                    <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" />
                  </label>
                </div>
                {reviewError && (
                  <p className={`text-[10px] font-semibold text-right ${reviewError.startsWith('✅') ? 'text-neonGreen' : 'text-accentRed'}`}>{reviewError}</p>
                )}
              </form>

              {/* Review Entries */}
              <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pl-1">
                {reviews.length === 0 ? (
                  <p className="text-xs text-textSecondary text-center py-4 opacity-60">لا توجد تقييمات معتمدة بعد. كن أول من يقيّم هذا المنتج!</p>
                ) : (
                  reviews.map((rev, index) => (
                    <div key={rev._id || index} className="bg-primary/20 border border-white/5 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-textSecondary">
                          <Calendar className="w-3 h-3" />
                          <span>{rev.date || (rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('ar-EG') : '')}</span>
                        </div>
                        <span className="font-bold text-[10px] sm:text-[11px] text-white flex items-center gap-1">
                          {rev.name || rev.author}
                          <ShieldCheck className="w-3 h-3 text-neonGreen" />
                        </span>
                      </div>
                      <div className="flex gap-0.5 text-accentGold mb-1.5 justify-end">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-current" />
                        ))}
                      </div>
                      <p className="text-[11px] sm:text-xs text-textSecondary leading-relaxed">{rev.text || rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
