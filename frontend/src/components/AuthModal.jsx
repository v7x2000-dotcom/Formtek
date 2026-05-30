import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Dumbbell, Mail, Lock, User, Phone, LogIn, UserPlus } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { toast } from './ui/Toast';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [errors, setErrors] = useState({});
  const { login, register, loading } = useAuthStore();

  const reset = () => { setErrors({}); setForm({ name: '', email: '', password: '', phone: '' }); };
  const handleClose = () => { onClose(); reset(); };

  const validate = () => {
    const e = {};
    if (mode === 'register') {
      if (!form.name.trim()) {
        e.name = 'الاسم مطلوب';
      } else if (form.name.trim().length < 2) {
        e.name = 'الاسم يجب أن يكون ثنائي الأحرف على الأقل';
      }
    }
    
    if (!form.email.trim()) {
      e.email = 'البريد الإلكتروني مطلوب';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        e.email = 'يرجى إدخال بريد إلكتروني صحيح';
      }
    }
    
    if (!form.password || form.password.length < 6) {
      e.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = mode === 'login'
      ? await login(form.email, form.password)
      : await register(form.name, form.email, form.password, form.phone);
    if (result.success) {
      toast.success(result.message);
      handleClose();
      // If a specific success callback was provided (e.g. redirect to /checkout), use it
      if (onSuccess) {
        onSuccess();
        return;
      }
      // Default role-based redirection
      const freshUser = useAuthStore.getState().user;
      if (freshUser?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
    } else {
      toast.error(result.message);
    }
  };

  const fieldClass = (hasErr) =>
    `w-full text-xs bg-primary/70 border ${hasErr ? 'border-accentRed/60' : 'border-white/10 focus:border-neonGreen/50'} rounded-xl px-4 py-3.5 text-white outline-none transition-all placeholder-textSecondary/50`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(5,5,7,0.92)', backdropFilter: 'blur(14px)' }}
          onClick={e => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="relative w-full max-w-md bg-secondary border border-white/8 rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.85)]"
          >
            <div className="h-[2px] bg-gradient-to-r from-transparent via-neonGreen to-transparent" />

            <div className="px-7 pt-7 pb-7 text-right">
              <button onClick={handleClose}
                className="absolute top-5 left-5 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-textSecondary hover:text-white hover:bg-white/10 transition-all">
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-end gap-3 mb-5">
                <div>
                  <h2 className="text-base font-black text-white">
                    {mode === 'login' ? 'أهلاً بعودتك للتدريب!' : 'انضم لعائلة فورمتك'}
                  </h2>
                  <p className="text-[11px] text-textSecondary mt-0.5">
                    {mode === 'login' ? 'أدخل بياناتك للوصول لحسابك' : 'إنشاء حساب مجاني في ثوانٍ'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-neonGreen/10 border border-neonGreen/20 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5 text-neonGreen" />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex bg-primary/60 rounded-xl p-1 mb-5">
                {['login', 'register'].map(m => (
                  <button key={m} onClick={() => { setMode(m); reset(); }}
                    className={`flex-1 text-xs font-bold py-2.5 rounded-lg transition-all ${mode === m ? 'bg-neonGreen text-black' : 'text-textSecondary hover:text-white'}`}>
                    {m === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                {mode === 'register' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="relative">
                      <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="الاسم الكامل" className={`${fieldClass(errors.name)} text-right pr-10`} />
                      <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textSecondary" />
                    </div>
                    {errors.name && <p className="text-[10px] text-accentRed mt-1 text-right">{errors.name}</p>}
                  </motion.div>
                )}

                <div>
                  <div className="relative">
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="البريد الإلكتروني" autoComplete="email" dir="ltr"
                      className={`${fieldClass(errors.email)} pr-10`} />
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textSecondary" />
                  </div>
                  {errors.email && <p className="text-[10px] text-accentRed mt-1 text-right">{errors.email}</p>}
                </div>

                <div>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder={mode === 'login' ? 'كلمة المرور' : 'كلمة مرور قوية (6+ أحرف)'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'} dir="ltr"
                      className={`${fieldClass(errors.password)} pr-10 pl-10`} />
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textSecondary" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textSecondary hover:text-white transition-colors">
                      {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[10px] text-accentRed mt-1 text-right">{errors.password}</p>}
                </div>

                {mode === 'register' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                    <div className="relative">
                      <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="رقم الهاتف (اختياري)" dir="ltr"
                        className="w-full text-xs bg-primary/70 border border-white/10 focus:border-neonGreen/50 rounded-xl px-4 py-3.5 text-white outline-none transition-all pr-10" />
                      <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textSecondary" />
                    </div>
                  </motion.div>
                )}

                <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
                  className="w-full bg-neonGreen hover:bg-neonGreenHover text-black font-extrabold text-sm py-4 rounded-xl flex items-center justify-center gap-2 mt-1 shadow-[0_0_20px_rgba(0,255,102,0.25)] transition-all disabled:opacity-60">
                  {loading
                    ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    : mode === 'login' ? <><LogIn className="w-4 h-4" />دخول آمن</> : <><UserPlus className="w-4 h-4" />إنشاء الحساب</>
                  }
                </motion.button>
              </form>
            </div>

            <div className="px-7 pb-5 border-t border-white/5 pt-4 text-center">
              <p className="text-[9px] text-textSecondary tracking-widest font-display uppercase">Focus • Discipline • Strength • Results</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
