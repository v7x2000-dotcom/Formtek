import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Zap, Tag, ArrowLeft, Flame, ShieldCheck, Package } from 'lucide-react';

const IMG_BASE = window.location.protocol === 'file:'
  ? 'http://localhost:5000'
  : window.location.origin;

const SECTION_CONFIG = {
  supplements: {
    icon: Zap,
    iconColor: '#00ff66',
    label: 'المكملات الغذائية',
    labelEn: 'SUPPLEMENTS',
    desc: 'بروتينات عالية الجودة، كرياتين، أحماض أمينية وفيتامينات لأقصى أداء رياضي',
    gradient: 'from-[#00ff66]/10 via-transparent to-transparent',
    border: 'border-[#00ff66]/20',
    badge: 'bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]/25',
  },
  equipment: {
    icon: Dumbbell,
    iconColor: '#00b4ff',
    label: 'الأدوات الرياضية',
    labelEn: 'EQUIPMENT',
    desc: 'شاكرز، أحزمة رفع، وإكسسوارات رياضية عالمية الجودة لتكتمل رحلتك',
    gradient: 'from-[#00b4ff]/10 via-transparent to-transparent',
    border: 'border-[#00b4ff]/20',
    badge: 'bg-[#00b4ff]/10 text-[#00b4ff] border-[#00b4ff]/25',
  },
  deals: {
    icon: Flame,
    iconColor: '#ff6b35',
    label: 'العروض والتخفيضات',
    labelEn: 'DEALS',
    desc: 'أقوى العروض الحصرية والتخفيضات اليومية على أشهر المكملات والأدوات الرياضية',
    gradient: 'from-[#ff6b35]/10 via-transparent to-transparent',
    border: 'border-[#ff6b35]/20',
    badge: 'bg-[#ff6b35]/10 text-[#ff6b35] border-[#ff6b35]/25',
  },
};

/* ── Section Header ─────────────────────────────── */
function SectionHeader({ type, onNavigate, count }) {
  const cfg = SECTION_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <div className="flex items-center justify-between mb-8">
      <button
        onClick={() => onNavigate('products', { group: type })}
        className="group flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white/80 transition-colors cursor-pointer"
      >
        <span>عرض الكل ({count})</span>
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className="flex items-center gap-3 text-right">
        <div>
          <div className="flex items-center gap-2 justify-end">
            <h2 className="text-xl md:text-2xl font-black text-white">{cfg.label}</h2>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border tracking-widest ${cfg.badge}`}>
              {cfg.labelEn}
            </span>
          </div>
          <p className="text-xs text-white/40 mt-1 text-right">{cfg.desc}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: cfg.iconColor + '15', border: `1px solid ${cfg.iconColor}30` }}>
          <Icon className="w-5 h-5" style={{ color: cfg.iconColor }} />
        </div>
      </div>
    </div>
  );
}

/* ── Mini Product Card ────────────────────────── */
function MiniCard({ product, onAddToCart, onViewDetails, onToggleFavorite, isFavorite, accentColor }) {
  const isAvailable = product.isAvailable ?? (product.stock > 0);
  const isOnSale = product.isOnSale || (product.oldPrice && product.oldPrice > product.price);
  const imgSrc = product.image?.startsWith('/uploads') ? `${IMG_BASE}${product.image}` : product.image;

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: `0 8px 30px ${accentColor}15` }}
      onClick={() => onViewDetails(product)}
      className="group relative bg-[#0d0d12] border border-white/5 hover:border-white/12 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col"
      style={{ boxShadow: `0 0 0 0 ${accentColor}00` }}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-[#080810]">
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?q=80&w=400'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {isOnSale && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#ff6b35] text-white">
              خصم {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
            </span>
          )}
          {!isAvailable && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/10 text-white/60">نفذ</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-[10px] text-white/35 font-semibold">{product.brand}</p>
        <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug text-right">{product.name}</h3>

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
          <button
            onClick={e => { e.stopPropagation(); if (isAvailable) onAddToCart(product); }}
            disabled={!isAvailable}
            className="text-[10px] font-black px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: accentColor + '20', color: accentColor, border: `1px solid ${accentColor}30` }}
          >
            {isAvailable ? '+ أضف للسلة' : 'نفذ المخزون'}
          </button>
          <div className="text-right">
            {product.oldPrice && (
              <p className="text-[9px] text-white/30 line-through font-mono">{product.oldPrice.toLocaleString()} EGP</p>
            )}
            <p className="text-xs font-black font-mono" style={{ color: accentColor }}>
              {product.price?.toLocaleString()} EGP
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Product Section ────────────────────────────── */
export function ProductSection({ type, products, onAddToCart, onViewDetails, onNavigate, onToggleFavorite, favorites = [] }) {
  const cfg = SECTION_CONFIG[type];
  const filtered = products.filter(p => {
    if (type === 'supplements') return ['protein', 'creatine', 'vitamins', 'fat-burners', 'mass-gainer', 'amino-acids'].includes(p.category);
    if (type === 'equipment') return ['shakers', 'lifting-belts', 'accessories'].includes(p.category);
    if (type === 'deals') return p.isOnSale || (p.oldPrice && p.oldPrice > p.price);
    return true;
  }).slice(0, 4);

  if (filtered.length === 0) return null;

  return (
    <section className={`relative py-14 px-[5%] bg-gradient-to-r ${cfg.gradient} border-b border-white/4`} dir="rtl">
      <div className="max-w-[1400px] mx-auto">
        <SectionHeader type={type} onNavigate={onNavigate} count={filtered.length} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map(p => (
            <MiniCard
              key={p._id || p.id}
              product={p}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favorites.includes(p._id || p.id)}
              accentColor={cfg.iconColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ Section ────────────────────────────────── */
const DEFAULT_FAQS = [
  { id: 1, q: 'هل المنتجات أصلية 100%؟', a: 'نعم، جميع منتجاتنا مستوردة مباشرة من الموزعين الرسميين المعتمدين ومصحوبة بشهادات الأصالة.' },
  { id: 2, q: 'كيف يتم الدفع والشحن؟', a: 'نقبل الدفع عبر فودافون كاش وإنستاباي. يتم التوصيل خلال 2-5 أيام عمل لجميع محافظات مصر.' },
  { id: 3, q: 'هل يمكن إرجاع المنتجات؟', a: 'نعم، سياسة الإرجاع تصل إلى 14 يوم من تاريخ الاستلام بشرط أن يكون المنتج سليماً وغير مفتوح.' },
  { id: 4, q: 'ما هي أفضل مكملات للمبتدئين؟', a: 'نوصي ببروتين واي أساسي + كرياتين مونوهيدرات + فيتامين D. تواصل مع فريقنا للحصول على مشورة مجانية.' },
];

export function FAQSection({ faqs: faqsProp }) {
  const [open, setOpen] = useState(null);
  // Use API-provided FAQs if available, otherwise fall back to defaults
  const faqs = (faqsProp && faqsProp.length > 0) ? faqsProp : DEFAULT_FAQS;

  return (
    <section className="py-16 px-[5%] bg-[#080810]" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-[10px] font-black text-[#00ff66]/70 tracking-widest uppercase border border-[#00ff66]/20 px-3 py-1 rounded-full">الأسئلة الشائعة</span>
          <h2 className="text-2xl font-black text-white mt-4">كل ما تريد معرفته</h2>
        </div>
        <div className="flex flex-col gap-3">
          {faqs.map((f, i) => (
            <div key={f.id || i} className="border border-white/6 rounded-xl overflow-hidden hover:border-white/12 transition-colors">
              <button
                className="w-full flex items-center justify-between p-4 text-right cursor-pointer"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <motion.span
                  animate={{ rotate: open === i ? 45 : 0 }}
                  className="text-[#00ff66] text-lg font-black leading-none shrink-0"
                >+</motion.span>
                <span className="text-sm font-bold text-white">{f.q}</span>
              </button>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  className="px-4 pb-4 text-xs text-white/50 leading-relaxed text-right border-t border-white/5 pt-3"
                >
                  {f.a}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
