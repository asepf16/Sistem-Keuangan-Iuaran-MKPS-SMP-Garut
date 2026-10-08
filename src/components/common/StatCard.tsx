import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'blue' | 'amber' | 'rose' | 'indigo' | 'slate';
  trend?: {
    text: string;
    positive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'indigo',
  trend,
}) => {
  const variantStyles = {
    emerald: {
      bg: 'bg-emerald-500/10 text-emerald-600',
      border: 'border-emerald-100',
      valueColor: 'text-emerald-700',
    },
    blue: {
      bg: 'bg-blue-500/10 text-blue-600',
      border: 'border-blue-100',
      valueColor: 'text-blue-700',
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-600',
      border: 'border-amber-100',
      valueColor: 'text-amber-700',
    },
    rose: {
      bg: 'bg-rose-500/10 text-rose-600',
      border: 'border-rose-100',
      valueColor: 'text-rose-700',
    },
    indigo: {
      bg: 'bg-indigo-500/10 text-indigo-600',
      border: 'border-indigo-100',
      valueColor: 'text-indigo-900',
    },
    slate: {
      bg: 'bg-slate-500/10 text-slate-600',
      border: 'border-slate-100',
      valueColor: 'text-slate-800',
    },
  }[variant];

  return (
    <div className={`bg-white rounded-xl border p-5 shadow-sm transition hover:shadow-md ${variantStyles.border}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className={`text-2xl font-bold tracking-tight ${variantStyles.valueColor}`}>{value}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${variantStyles.bg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs">
          <span className={`font-semibold mr-1.5 ${trend.positive ? 'text-emerald-600' : 'text-slate-500'}`}>
            {trend.text}
          </span>
        </div>
      )}
    </div>
  );
};
