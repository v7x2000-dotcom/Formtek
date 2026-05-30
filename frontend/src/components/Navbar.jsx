import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Heart, User, LogOut, Menu, X, Sparkles, Home, ShoppingBag, ChevronDown } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';

// Runtime API base (same logic as api.js — works from both file:// and localhost)
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

export default function Navbar({ currentPage, onNavigate, onOpenCart, onOpenAuth, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [favCount, setFavCount] = useState(() =>
    JSON.parse(localStorage.getItem('formtek_favorites') || '[]').length
  );
  const dropRef = useRef(null);
  const { user } = useAuthStore();
  const getCount = useCartStore(s => s.getCount);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sync favCount when localStorage changes (e.g. from another tab or component)
  useEffect(() => {
    const syncFav = () => setFavCount(
      JSON.parse(localStorage.getItem('formtek_favorites') || '[]').length
    );
    window.addEventListener('storage', syncFav);
    // Also sync on any custom event dispatched when favorites change
    window.addEventListener('formtek_favorites_updated', syncFav);
    return () => {
      window.removeEventListener('storage', syncFav);
      window.removeEventListener('formtek_favorites_updated', syncFav);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { key: 'home', label: 'الرئيسية', icon: Home },
    { key: 'products', label: 'المنتجات', icon: ShoppingBag },
  ];

  const cartCount = getCount();

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-primary/95 backdrop-blur-xl border-b border-white/8 shadow-[0_4px_30px_rgba(0,0,0,0.6)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-[5%] h-20 flex items-center justify-between">

        {/* Logo */}
        <motion.div
          onClick={() => onNavigate('home')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-neonGreen to-emerald-900 border border-neonGreen/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.25)]">
            <svg className="w-6 h-6 text-black" viewBox="0 0 100 100">
              <path d="M25 15 H80 V32 H45 V48 H72 V64 H45 V85 H25 Z" fill="currentColor"/>
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neonGreen rounded-full border-2 border-primary animate-ping" />
          </div>
          <div className="flex flex-col text-right leading-none">
            <span className="font-display font-black text-[17px] tracking-widest text-white">
              FORM<span className="text-neonGreen" style={{ textShadow: '0 0 12px rgba(0,255,102,0.6)' }}>TEK</span>
            </span>
            <span className="text-[8px] text-textSecondary font-semibold tracking-[0.2em] uppercase mt-0.5">Sports Supplements</span>
          </div>
        </motion.div>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <button
              key={link.key}
              onClick={() => onNavigate(link.key)}
              className={`relative text-xs font-bold uppercase tracking-wider py-1 transition-colors duration-200 ${
                currentPage === link.key ? 'text-neonGreen' : 'text-textSecondary hover:text-white'
              }`}
            >
              {link.label}
              {currentPage === link.key && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-neonGreen rounded-full"
                  style={{ boxShadow: '0 0 8px rgba(0,255,102,0.8)' }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Search bar (desktop) */}
          <div className="relative hidden lg:block">
            <input
              type="text"
              value={searchVal}
              onChange={e => { setSearchVal(e.target.value); onNavigate('products', { search: e.target.value }); }}
              placeholder="ابحث عن مكملاتك..."
              className="w-56 bg-white/5 border border-white/10 rounded-full py-2 pl-4 pr-9 text-[11px] text-white outline-none focus:border-neonGreen/50 focus:w-72 transition-all duration-300 text-right placeholder-textSecondary/60"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textSecondary" />
          </div>

          {/* Wishlist */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onNavigate('favorites')}
            className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-textSecondary hover:text-accentRed hover:border-accentRed/30 transition-all">
            <Heart className={`w-4 h-4 ${favCount > 0 ? 'fill-accentRed text-accentRed' : ''}`} />
            {favCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accentRed text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {favCount}
              </span>
            )}
          </motion.button>

          {/* Cart */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={onOpenCart}
            className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-textSecondary hover:text-neonGreen hover:border-neonGreen/30 transition-all">
            <ShoppingCart className="w-4 h-4" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-neonGreen text-black text-[9px] font-black rounded-full flex items-center justify-center"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* User dropdown / login */}
          {user ? (
            <div className="relative" ref={dropRef}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-white/5 border border-white/8 hover:border-neonGreen/30 transition-all"
              >
                <ChevronDown className={`w-3 h-3 text-textSecondary transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                <span className="text-[11px] font-bold text-white hidden sm:block max-w-[80px] truncate">{user.name}</span>
                {user.avatar ? (() => {
                  const avatarSrc = (user.avatar.startsWith('/uploads')
                    ? `${getApiBase()}${user.avatar}`
                    : user.avatar).replace(/^http:\/\//, 'https://');
                  return (
                    <img
                      src={avatarSrc}
                      alt=""
                      className="w-6 h-6 rounded-lg object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.insertAdjacentHTML('beforeend',
                          `<div class="w-6 h-6 rounded-lg bg-neonGreen/20 border border-neonGreen/30 flex items-center justify-center text-[10px] font-black text-neonGreen">${(user.name||'U').charAt(0).toUpperCase()}</div>`
                        );
                      }}
                    />
                  );
                })() : (
                  <div className="w-6 h-6 rounded-lg bg-neonGreen/20 border border-neonGreen/30 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-neonGreen" />
                  </div>
                )}
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-52 bg-secondary border border-white/10 rounded-2xl py-2 shadow-2xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-xs font-bold text-white">{user.name}</p>
                      <p className="text-[10px] text-textSecondary mt-0.5 truncate">{user.email}</p>
                    </div>
                    <button onClick={() => { onNavigate('profile'); setDropdownOpen(false); }}
                      className="w-full text-right px-4 py-2.5 text-xs text-textSecondary hover:text-white hover:bg-white/5 flex items-center justify-end gap-2 transition-colors">
                      <span>حسابي الرياضي</span><User className="w-3.5 h-3.5" />
                    </button>
                    <div className="border-t border-white/5 mt-1 pt-1">
                      <button onClick={() => { onLogout(); setDropdownOpen(false); }}
                        className="w-full text-right px-4 py-2.5 text-xs text-accentRed hover:bg-accentRed/5 flex items-center justify-end gap-2 transition-colors">
                        <span>تسجيل خروج</span><LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onOpenAuth}
              className="bg-neonGreen hover:bg-neonGreenHover text-black text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,102,0.2)] hover:shadow-[0_0_25px_rgba(0,255,102,0.4)] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">دخول / تسجيل</span>
            </motion.button>
          )}

          {/* Hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-textSecondary hover:text-white transition-all">
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-primary/98 border-t border-white/5 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {navLinks.map(link => (
                <button key={link.key} onClick={() => { onNavigate(link.key); setMobileOpen(false); }}
                  className={`text-right py-3 border-b border-white/5 text-sm font-bold flex items-center justify-end gap-2 ${currentPage === link.key ? 'text-neonGreen' : 'text-textSecondary'}`}>
                  <span>{link.label}</span><link.icon className="w-4 h-4" />
                </button>
              ))}
              {user ? (
                <>
                  <button onClick={() => { onNavigate('profile'); setMobileOpen(false); }}
                    className="text-right py-3 border-b border-white/5 text-sm font-bold text-textSecondary flex items-center justify-end gap-2">
                    <span>حسابي</span><User className="w-4 h-4" />
                  </button>
                  <button onClick={() => { onLogout(); setMobileOpen(false); }}
                    className="text-right py-3 text-sm font-bold text-accentRed flex items-center justify-end gap-2">
                    <span>تسجيل خروج</span><LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button onClick={() => { onOpenAuth(); setMobileOpen(false); }}
                  className="mt-2 bg-neonGreen text-black font-extrabold py-3 rounded-xl text-sm text-center">
                  دخول / تسجيل
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
