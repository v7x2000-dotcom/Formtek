import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, ShieldCheck, Truck, ArrowLeft, Zap, Star, Package } from 'lucide-react';
import { statsAPI } from '../services/api';

/* ── Animated Counter ─────────────────────────── */
function Counter({ end, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      let start = 0;
      const step = Math.ceil(end / 60);
      const timer = setInterval(() => {
        start += step;
        if (start >= end) { setCount(end); clearInterval(timer); }
        else setCount(start);
      }, 20);
      obs.disconnect();
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const DEFAULT_SLIDES = [
  {
    badge: 'بروتين • كرياتين • أمينو أسيد',
    title: 'ابنِ قوتك مع',
    titleHl: 'فورمتك',
    titleSub: 'العالمية',
    sub: 'مكملات أصلية 100% بمستوى عالمي — بروتينات، كرياتين، أحماض أمينية، وفيتامينات لأقصى أداء رياضي.',
    cta: 'تسوق المكملات الغذائية',
    ctaPage: 'supplements',
    accent: '#00ff66',
    img: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?q=80&w=900&auto=format&fit=crop',
  },
  {
    badge: 'أدوات • معدات • إكسسوارات',
    title: 'جهّز نفسك',
    titleHl: 'بأفضل',
    titleSub: 'الأدوات الرياضية',
    sub: 'شاكرز، أحزمة رفع، وإكسسوارات رياضية عالية الجودة لتكتمل رحلتك نحو القوة.',
    cta: 'تسوق الأدوات الرياضية',
    ctaPage: 'equipment',
    accent: '#00b4ff',
    img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=900&auto=format&fit=crop',
  },
  {
    badge: 'عروض • خصومات • كوبونات',
    title: 'أفضل الأسعار',
    titleHl: 'عروض',
    titleSub: 'حصرية اليوم فقط',
    sub: 'لا تفوّت أقوى العروض والتخفيضات على أشهر المكملات الرياضية العالمية.',
    cta: 'تسوق العروض الآن',
    ctaPage: 'deals',
    accent: '#ff6b35',
    img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=900&auto=format&fit=crop',
  },
];

const DEFAULT_STATS = [
  { icon: Package, label: 'منتج أصيل',       value: 8,   suffix: '+' },
  { icon: Star,    label: 'تقييم عملائنا',   value: 4.9, suffix: '⭐', isFloat: true },
  { icon: Truck,   label: 'طلب تم توصيله',   value: 0,   suffix: '+' },
];

const TRUSTS = [
  { icon: ShieldCheck, text: 'منتجات أصلية 100%' },
  { icon: Truck,       text: 'توصيل سريع مجاني' },
  { icon: Zap,         text: 'دفع فوري آمن' },
  { icon: Dumbbell,    text: 'جودة رياضية عالمية' },
];

export default function Hero({ onNavigate, slides: slidesProp }) {
  const [idx, setIdx] = useState(0);
  const [liveStats, setLiveStats] = useState(DEFAULT_STATS);

  // Use API-provided slides if available, otherwise fall back to defaults
  const slides = (slidesProp && slidesProp.length > 0) ? slidesProp : DEFAULT_SLIDES;
  const slide = slides[idx] || slides[0];

  // Fetch live stats from backend
  useEffect(() => {
    statsAPI.getPublic().then(({ data }) => {
      if (data.success && data.stats) {
        const { totalProducts, deliveredOrders, avgRating } = data.stats;
        setLiveStats([
          { icon: Package, label: 'منتج أصيل',       value: totalProducts,    suffix: '+' },
          { icon: Star,    label: 'تقييم عملائنا',   value: avgRating,       suffix: '⭐', isFloat: true },
          { icon: Truck,   label: 'طلب تم توصيله',   value: deliveredOrders, suffix: '+' },
        ]);
      }
    }).catch(() => {
      // Keep defaults on error
    });
  }, []);

  // Auto-advance slides
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#050507]" dir="rtl">

      {/* ── Background layers ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")' }}
        />
        {/* Radial glow 1 */}
        <motion.div
          key={idx + '-g1'}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full blur-[140px]"
          style={{ background: `radial-gradient(circle, ${slide.accent}18 0%, transparent 70%)` }}
        />
        {/* Radial glow 2 */}
        <div className="absolute bottom-0 left-[-5%] w-[500px] h-[500px] rounded-full bg-[#00b4ff]/5 blur-[120px]" />
        {/* Grid */}
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </div>

      {/* ── Floating particles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: i % 3 === 0 ? '#00ff66' : i % 3 === 1 ? '#00b4ff' : '#ff6b35',
              left: `${(i * 8.3) % 100}%`,
              top: `${(i * 13 + 5) % 90}%`,
              opacity: 0.3 + (i % 4) * 0.1,
            }}
            animate={{ y: [-12, 12, -12], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>

      {/* ── Main hero content ── */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-between max-w-[1400px] mx-auto w-full px-6 md:px-[5%] pt-28 pb-8 gap-12">

        {/* Text column */}
        <div className="flex-1 flex flex-col items-end text-right max-w-[680px]">

          {/* Slide dots */}
          <div className="flex gap-2 mb-6 self-end">
            {slides.map((s, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className="transition-all duration-300 rounded-full cursor-pointer"
                style={{
                  width: i === idx ? 28 : 8, height: 8,
                  background: i === idx ? s.accent : 'rgba(255,255,255,0.2)'
                }}
              />
            ))}
          </div>

          {/* Badge */}
          <motion.div
            key={idx + '-badge'}
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 border text-xs font-bold tracking-widest px-4 py-2 rounded-full mb-5"
            style={{ borderColor: slide.accent + '50', color: slide.accent, background: slide.accent + '12' }}
          >
            <Zap className="w-3.5 h-3.5" />
            {slide.badge}
          </motion.div>

          {/* Headline */}
          <motion.h1
            key={idx + '-h1'}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
            className="text-4xl md:text-[3.5rem] lg:text-[4rem] font-black leading-[1.15] text-white mb-6 tracking-tight"
          >
            {slide.title}{' '}
            <span style={{ color: slide.accent, textShadow: `0 0 30px ${slide.accent}60` }}>
              {slide.titleHl}
            </span>
            <br />
            <span className="text-white/70 font-extrabold">{slide.titleSub}</span>
          </motion.h1>

          {/* Sub text */}
          <motion.p
            key={idx + '-p'}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-sm md:text-base text-white/50 mb-8 leading-relaxed"
          >
            {slide.sub}
          </motion.p>

          {/* CTAs */}
          <motion.div
            key={idx + '-cta'}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap gap-4 justify-end"
          >
            <button
              onClick={() => onNavigate('products', { group: slide.ctaPage })}
              className="flex items-center gap-2.5 font-black text-sm px-7 py-3.5 rounded-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              style={{
                background: slide.accent,
                color: '#050507',
                boxShadow: `0 0 25px ${slide.accent}40`
              }}
            >
              <Dumbbell className="w-4 h-4" />
              {slide.cta}
            </button>
            <button
              onClick={() => onNavigate('products')}
              className="flex items-center gap-2.5 font-semibold text-sm px-7 py-3.5 rounded-xl border border-white/10 hover:border-white/25 text-white/70 hover:text-white bg-white/4 hover:bg-white/8 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              تصفح كل المنتجات
            </button>
          </motion.div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 mt-10 pt-8 border-t border-white/5 w-full justify-end">
            {TRUSTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-[11px] text-white/40">
                <span>{text}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: slide.accent }} />
              </div>
            ))}
          </div>
        </div>

        {/* Image + stats column */}
        <div className="flex-shrink-0 flex flex-col gap-4 w-full lg:w-[380px]">
          {/* Hero image card */}
          <motion.div
            key={idx + '-img'}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative rounded-2xl overflow-hidden border border-white/5 shadow-2xl"
            style={{ height: 280, boxShadow: `0 30px 80px ${slide.accent}20` }}
          >
            <img src={slide.img} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #050507 0%, transparent 50%)' }} />
            {/* Accent corner */}
            <div className="absolute top-3 right-3 text-[10px] font-black px-3 py-1 rounded-full"
              style={{ background: slide.accent, color: '#050507' }}>
              أصلي 100%
            </div>
          </motion.div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {liveStats.map(({ icon: Icon, label, value, suffix, isFloat }) => (
              <div key={label}
                className="bg-white/3 border border-white/5 rounded-xl p-3 text-center hover:border-white/10 transition-colors">
                <Icon className="w-4 h-4 mx-auto mb-2" style={{ color: slide.accent }} />
                <p className="text-lg font-black text-white font-mono leading-none">
                  {isFloat ? value + suffix : <Counter end={value} suffix={suffix} />}
                </p>
                <p className="text-[9px] text-white/35 mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scrolling ticker ── */}
      <div className="relative z-10 border-t border-white/5 py-3 bg-white/2 overflow-hidden">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="flex gap-16 whitespace-nowrap text-[10px] font-black tracking-[0.2em] text-white/20 uppercase"
        >
          {[...Array(6)].map((_, i) => (
            <span key={i} className="flex gap-16">
              <span>FOCUS</span><span style={{ color: slide.accent + '80' }}>✦</span>
              <span>DISCIPLINE</span><span style={{ color: slide.accent + '80' }}>✦</span>
              <span>STRENGTH</span><span style={{ color: slide.accent + '80' }}>✦</span>
              <span>RESULTS</span><span style={{ color: slide.accent + '80' }}>✦</span>
              <span>FORMTEK</span><span style={{ color: slide.accent + '80' }}>✦</span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
