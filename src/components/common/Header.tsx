import React from 'react';
import { Menu, Wallet, Calendar, Bell, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { formatRupiah } from '../../utils/formatters';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  pageTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, pageTitle }) => {
  const { role, userProfile } = useAuth();
  const { saldoBerjalan, selectedYear, setSelectedYear, refreshAll, loading } = useApp();

  const availableYears = [2024, 2025, 2026, 2027, 2028];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left side: Hamburger & Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">{pageTitle}</h2>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Musyawarah Kerja Pengawas Sekolah SMP Garut
          </p>
        </div>
      </div>

      {/* Right side: Year filter, Running balance, and user state */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Year Selector */}
        <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1 mr-1" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden pr-2 cursor-pointer"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>
        </div>

        {/* Quick balance badge (Admin only or summary) */}
        {role === 'admin' && (
          <div className="hidden md:flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-800 leading-none">Saldo Kas</p>
              <p className="text-xs font-bold text-emerald-700 leading-tight">
                {formatRupiah(saldoBerjalan)}
              </p>
            </div>
          </div>
        )}

        {/* Refresh button */}
        <button
          onClick={refreshAll}
          disabled={loading}
          title="Segarkan Data"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>
    </header>
  );
};
