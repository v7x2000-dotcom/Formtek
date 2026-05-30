import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShoppingCart, Heart, Eye, Zap } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import { toast } from './ui/Toast';

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

export default function ProductCard({ product, onViewDetails, favorites, onToggleFavorite }) {
  const addItem = useCartStore(s => s.addItem);
  const [adding, setAdding] = useState(false);

  const id = product._id || product.id;
  const isFav = favorites?.includes(id);
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
  const imgSrc = product.image?.startsWith('/uploads') ? `${IMG_BASE}${product.image}` : product.image;
  const isAvailable = product.isAvailable !== undefined ? product.isAvailable : (product.stock > 0);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    setAdding(true);
    addItem(product);
    toast.success(`تمت إضافة ${product.name.substring(0, 25)}... للسلة`);
    setTimeout(() => setAdding(false), 700);
  };

  const handleFav = (e) => {
    e.stopPropagation();
    onToggleFavorite(id);
    if (!isFav) toast.success('تمت الإضافة إلى المفضلة ❤️');
    else toast.info('تمت الإزالة من المفضلة');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      onClick={() => onViewDetails(product)}
      className="group relative bg-secondary/50 border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-neonGreen/40 hover:shadow-[0_8px_30px_rgba(0,255,102,0.1)] transition-all duration-300 flex flex-col"
    >
      {/* Badges */}
      <div className="absolute top-3 inset-x-3 flex justify-between items-center z-10">
        <div className="flex flex-col gap-1.5 items-start">
          {discount > 0 && (
            <span className="bg-accentRed text-white text-[9px] font-black px-2.5 py-1 rounded-lg shadow-[0_0_10px_rgba(255,42,95,0.4)] uppercase tracking-wider">
              -{discount}%
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-accentGold/90 text-black text-[9px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> مميز
            </span>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleFav}
          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
            isFav ? 'bg-accentRed/15 border-accentRed/40 text-accentRed' : 'bg-primary/60 border-white/8 text-textSecondary hover:text-accentRed hover:border-accentRed/30'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-accentRed' : ''}`} />
        </motion.button>
      </div>

      {/* Image */}
      <div className="relative h-52 bg-gradient-to-b from-tertiary/30 to-tertiary/60 flex items-center justify-center p-6 overflow-hidden">
        <motion.img
          src={imgSrc}
          alt={product.name}
          className="max-h-full max-w-full object-contain"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.4 }}
        />
        {/* Quick view overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[11px] text-white font-semibold">
            <Eye className="w-3.5 h-3.5" />
            <span>عرض سريع</span>
          </div>
        </div>
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="text-white font-bold text-xs bg-accentRed/80 px-4 py-2 rounded-xl">نفذ من المخزن</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4 flex-grow flex flex-col justify-between gap-3 text-right">
        <div>
          <div className="flex justify-between items-center text-[9px] mb-2">
            <span className="text-neonBlue font-bold uppercase tracking-wide font-display">{product.brand}</span>
            <span className="bg-neonGreen/8 text-neonGreen px-2 py-0.5 rounded-full border border-neonGreen/15 text-[9px] font-bold">{product.categoryAr || product.goalAr}</span>
          </div>
          <h3 className="font-bold text-xs text-white line-clamp-2 leading-snug">{product.name}</h3>

          <div className="flex items-center justify-end gap-1 mt-2">
            <span className="text-[10px] text-textSecondary">({product.reviewsCount})</span>
            <span className="text-[11px] font-bold text-white font-mono">{product.rating?.toFixed(1)}</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-2.5 h-2.5 ${i < Math.round(product.rating) ? 'text-accentGold fill-accentGold' : 'text-white/15'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Price + Add button */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <motion.button
            onClick={handleAddToCart}
            whileTap={{ scale: 0.9 }}
            disabled={!isAvailable || adding}
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black transition-all ${
              isAvailable
                ? 'bg-neonGreen hover:bg-neonGreenHover text-black shadow-[0_0_12px_rgba(0,255,102,0.2)]'
                : 'bg-white/5 text-textSecondary cursor-not-allowed'
            }`}
          >
            {adding
              ? <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              : <ShoppingCart className="w-3.5 h-3.5" />
            }
          </motion.button>

          <div className="text-right">
            {product.oldPrice && (
              <span className="text-[10px] text-textSecondary line-through block font-mono">{product.oldPrice.toLocaleString()} EGP</span>
            )}
            <span className="text-sm font-extrabold text-neonGreen font-display">
              {product.price.toLocaleString()} <span className="text-[9px] font-normal text-textSecondary">EGP</span>
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
