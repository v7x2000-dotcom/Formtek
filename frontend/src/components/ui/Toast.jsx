import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Singleton toast manager
let toastQueue = [];
let setToastsExternal = null;

const icons = {
  success: <CheckCircle className="w-4.5 h-4.5 text-neonGreen shrink-0" />,
  error:   <XCircle    className="w-4.5 h-4.5 text-accentRed shrink-0" />,
  warning: <AlertTriangle className="w-4.5 h-4.5 text-accentGold shrink-0" />,
  info:    <Info       className="w-4.5 h-4.5 text-neonBlue shrink-0" />,
};

const styles = {
  success: 'border-neonGreen/30 shadow-[0_0_20px_rgba(0,255,102,0.12)]',
  error:   'border-accentRed/30 shadow-[0_0_20px_rgba(255,42,95,0.12)]',
  warning: 'border-accentGold/30 shadow-[0_0_20px_rgba(255,183,0,0.12)]',
  info:    'border-neonBlue/30 shadow-[0_0_20px_rgba(0,240,255,0.12)]',
};

// Public API to show toasts from anywhere
export const toast = {
  success: (msg, opts = {}) => addToast(msg, 'success', opts),
  error:   (msg, opts = {}) => addToast(msg, 'error',   opts),
  warning: (msg, opts = {}) => addToast(msg, 'warning', opts),
  info:    (msg, opts = {}) => addToast(msg, 'info',    opts),
};

function addToast(message, type = 'info', { duration = 4000 } = {}) {
  const id = Date.now() + Math.random();
  const entry = { id, message, type, duration };
  if (setToastsExternal) {
    setToastsExternal(prev => [...prev.slice(-4), entry]); // max 5 at a time
  } else {
    toastQueue.push(entry);
  }
  return id;
}

// Single Toast item
const ToastItem = ({ toast: t, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(t.id), t.duration);
    return () => clearTimeout(timer);
  }, [t.id, t.duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.85 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex items-start gap-3 bg-secondary/95 backdrop-blur-xl border rounded-xl p-4 pr-3 min-w-[280px] max-w-[360px] ${styles[t.type]}`}
    >
      {icons[t.type]}
      <p className="text-xs text-white font-medium leading-relaxed flex-grow text-right">{t.message}</p>
      <button
        onClick={() => onRemove(t.id)}
        className="text-textSecondary hover:text-white transition-colors ml-1 shrink-0 mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      {/* Progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-[2px] rounded-b-xl ${
          t.type === 'success' ? 'bg-neonGreen' :
          t.type === 'error'   ? 'bg-accentRed' :
          t.type === 'warning' ? 'bg-accentGold' : 'bg-neonBlue'
        }`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: t.duration / 1000, ease: 'linear' }}
        style={{ position: 'absolute', bottom: 0, left: 0 }}
      />
    </motion.div>
  );
};

// Toast Container (render once in App.jsx)
export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setToastsExternal = setToasts;
    // Flush queued toasts
    if (toastQueue.length) {
      setToasts(toastQueue);
      toastQueue = [];
    }
    return () => { setToastsExternal = null; };
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto relative overflow-hidden">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
