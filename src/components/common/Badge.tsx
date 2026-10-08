import React from 'react';

interface BadgeProps {
  status: 'lunas' | 'belum_bayar' | 'dibatalkan' | 'aktif' | 'nonaktif' | 'masuk' | 'keluar' | string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;

  switch (status) {
    case 'lunas':
      colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Lunas';
      break;
    case 'belum_bayar':
      colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Belum Bayar';
      break;
    case 'dibatalkan':
      colorStyles = 'bg-slate-100 text-slate-500 border-slate-300 line-through';
      label = 'Dibatalkan';
      break;
    case 'aktif':
      colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Aktif';
      break;
    case 'nonaktif':
      colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Nonaktif';
      break;
    case 'masuk':
      colorStyles = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'Masuk';
      break;
    case 'keluar':
      colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Keluar';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorStyles} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </span>
  );
};
