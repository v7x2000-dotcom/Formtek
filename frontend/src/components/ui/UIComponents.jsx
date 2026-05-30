import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Primary button with motion
export const Button = ({
  children, onClick, type = 'button', variant = 'primary',
  size = 'md', loading = false, disabled = false, className = '', icon: Icon
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-extrabold rounded-xl transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = {
    sm:  'text-[11px] px-4 py-2',
    md:  'text-xs px-6 py-3',
    lg:  'text-sm px-8 py-4',
    xl:  'text-base px-10 py-5',
  };
  const variants = {
    primary:   'bg-neonGreen text-black hover:bg-neonGreenHover shadow-[0_0_20px_rgba(0,255,102,0.2)] hover:shadow-[0_0_30px_rgba(0,255,102,0.4)]',
    secondary: 'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20',
    danger:    'bg-accentRed/10 border border-accentRed/30 text-accentRed hover:bg-accentRed hover:text-white',
    ghost:     'text-textSecondary hover:text-white hover:bg-white/5',
    outline:   'border border-neonGreen/40 text-neonGreen hover:bg-neonGreen/10',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.96 }}
      whileHover={{ translateY: -1 }}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4" />}
      {children}
    </motion.button>
  );
};

// Input Field
export const Input = ({
  label, type = 'text', value, onChange, placeholder, required, error,
  className = '', hint, autoComplete, readOnly
}) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-[11px] font-semibold text-textSecondary flex items-center justify-end gap-1">
        {required && <span className="text-accentRed">*</span>}
        {label}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      autoComplete={autoComplete}
      readOnly={readOnly}
      className={`w-full text-xs bg-primary/70 border ${
        error ? 'border-accentRed/50 focus:border-accentRed' : 'border-white/10 focus:border-neonGreen/50'
      } rounded-xl p-3.5 text-white outline-none transition-all duration-200 text-right placeholder-textSecondary/60
      focus:shadow-[0_0_12px_rgba(0,255,102,0.08)] ${readOnly ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    />
    {error && <p className="text-[10px] text-accentRed text-right">{error}</p>}
    {hint && !error && <p className="text-[10px] text-textSecondary text-right">{hint}</p>}
  </div>
);

// Select Dropdown
export const Select = ({ label, value, onChange, options, className = '' }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-[11px] font-semibold text-textSecondary text-right">{label}</label>}
    <select
      value={value}
      onChange={onChange}
      className={`w-full text-xs bg-primary/70 border border-white/10 rounded-xl p-3.5 text-white outline-none transition-all focus:border-neonGreen/50 ${className}`}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

// Card
export const Card = ({ children, className = '', glow = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`bg-secondary/50 backdrop-blur-md border border-white/5 rounded-2xl ${
      glow ? 'hover:border-neonGreen/30 hover:shadow-[0_0_25px_rgba(0,255,102,0.08)]' : ''
    } transition-all duration-300 ${className}`}
  >
    {children}
  </motion.div>
);

// Badge
export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-white/5 border-white/10 text-textSecondary',
    green:   'bg-neonGreen/10 border-neonGreen/20 text-neonGreen',
    red:     'bg-accentRed/10 border-accentRed/20 text-accentRed',
    gold:    'bg-accentGold/10 border-accentGold/20 text-accentGold',
    blue:    'bg-neonBlue/10 border-neonBlue/20 text-neonBlue',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[9px] font-extrabold uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Section Header
export const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
    {action}
    <div className="text-right">
      <h2 className="text-xl md:text-2xl font-black text-white">{title}</h2>
      {subtitle && <p className="text-xs text-textSecondary mt-1">{subtitle}</p>}
    </div>
  </div>
);

// Loading Spinner
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizes[size]} text-neonGreen animate-spin`} />
    </div>
  );
};

// Empty State
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon className="w-8 h-8 text-textSecondary" />
      </div>
    )}
    <div>
      <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
      {description && <p className="text-xs text-textSecondary max-w-xs">{description}</p>}
    </div>
    {action}
  </div>
);

// Status Badge for orders
export const StatusBadge = ({ status }) => {
  const config = {
    Pending:    { label: 'بانتظار التأكيد', variant: 'gold' },
    Paid:       { label: 'تم الدفع',        variant: 'green' },
    Processing: { label: 'قيد التجهيز',    variant: 'blue' },
    Shipped:    { label: 'قيد الشحن',       variant: 'blue' },
    Delivered:  { label: 'تم التسليم',      variant: 'green' },
    Cancelled:  { label: 'ملغي',            variant: 'red' },
    Refunded:   { label: 'مسترد',           variant: 'red' },
  };
  const { label, variant } = config[status] || { label: status, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
};

// Polished, modern Loading Skeleton component
export const Skeleton = ({ className = '', variant = 'rect' }) => {
  const base = 'animate-pulse bg-white/5';
  const variants = {
    rect: 'rounded-xl',
    circle: 'rounded-full',
    text: 'h-3.5 rounded w-3/4',
  };
  return <div className={`${base} ${variants[variant]} ${className}`} />;
};
