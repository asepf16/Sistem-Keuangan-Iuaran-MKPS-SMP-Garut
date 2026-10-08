import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Wallet,
  UserCheck,
  Calendar,
  CalendarRange,
  BarChart3,
  PieChart,
  History,
  Settings,
  Database,
  User,
  LogOut,
  X,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { role, logout, userProfile, anggotaProfile } = useAuth();
  const { settings } = useApp();

  const handleNav = (tabId: string) => {
    onSelectTab(tabId);
    onCloseMobile();
  };

  const adminMenuGroups = [
    {
      title: 'UTAMA',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'KEANGGOTAAN',
      items: [{ id: 'anggota', label: 'Data Anggota', icon: Users }],
    },
    {
      title: 'KEUANGAN',
      items: [
        { id: 'iuran', label: 'Iuran Bulanan', icon: CreditCard },
        { id: 'pemasukan', label: 'Pemasukan', icon: TrendingUp },
        { id: 'pengeluaran', label: 'Pengeluaran', icon: TrendingDown },
        { id: 'bukukas', label: 'Buku Kas', icon: BookOpen },
        { id: 'saldo', label: 'Saldo Berjalan', icon: Wallet },
      ],
    },
    {
      title: 'LAPORAN',
      items: [
        { id: 'laporan-anggota', label: 'Per Anggota', icon: UserCheck },
        { id: 'laporan-bulanan', label: 'Bulanan', icon: Calendar },
        { id: 'rekap-matriks', label: 'Rekap Seluruh Bulan', icon: CalendarRange },
        { id: 'laporan-tahunan', label: 'Tahunan', icon: BarChart3 },
        { id: 'laporan-rekap', label: 'Rekap Keuangan', icon: PieChart },
      ],
    },
    {
      title: 'SISTEM',
      items: [
        { id: 'activity-log', label: 'Activity Log', icon: History },
        { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
        { id: 'backup', label: 'Backup & Export', icon: Database },
      ],
    },
  ];

  const anggotaMenu = [
    { id: 'anggota-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'anggota-profil', label: 'Profil Saya', icon: User },
    { id: 'anggota-iuran', label: 'Iuran Saya', icon: CreditCard },
    { id: 'anggota-riwayat', label: 'Riwayat Pembayaran', icon: History },
    { id: 'anggota-laporan', label: 'Laporan Saya', icon: BookOpen },
    { id: 'anggota-password', label: 'Ubah Password', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-white shadow-md shrink-0">
              MK
            </div>
            <div className="truncate">
              <h1 className="text-sm font-bold text-white tracking-wide truncate">
                {settings.namaOrganisasi || 'MKPS SMP GARUT'}
              </h1>
              <p className="text-[10px] text-emerald-400 font-medium">Sistem Keuangan Iuran</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card info */}
        <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
            {role === 'admin' ? 'ADM' : 'AG'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {role === 'admin'
                ? userProfile?.nama && !userProfile.nama.toLowerCase().includes('asep')
                  ? userProfile.nama
                  : 'Imas Komariah'
                : anggotaProfile?.nama || userProfile?.nama || 'Anggota'}
            </p>
            <p className="text-[11px] text-slate-400 flex items-center">
              <span
                className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                  role === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              {role === 'admin' ? 'Administrator' : `NIP: ${anggotaProfile?.nip || '-'}`}
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {role === 'admin' ? (
            adminMenuGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                MENU ANGGOTA
              </p>
              {anggotaMenu.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom profile and logout actions */}
        <div className="p-3 border-t border-slate-800 space-y-1 bg-slate-950/40">
          {role === 'admin' && (
            <button
              onClick={() => handleNav('profil-admin')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                currentTab === 'profil-admin'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Profil Admin</span>
            </button>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
};
