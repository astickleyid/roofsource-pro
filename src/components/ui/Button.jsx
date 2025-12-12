import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon, fullWidth = false, size='md' }) => {
  const baseStyles = "rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border";
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-4 py-2.5 text-sm" };
  const variants = {
    primary: "bg-blue-600 text-white border-transparent hover:bg-blue-700 shadow-sm disabled:opacity-50",
    secondary: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 shadow-sm disabled:opacity-50",
    outline: "bg-transparent border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50",
    danger: "bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300",
    ghost: "border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900",
    dark: "bg-slate-800 text-white border-transparent hover:bg-slate-900"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};
