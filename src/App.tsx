import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { Login } from './pages/Login';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DataAnggota } from './pages/admin/DataAnggota';
import { IuranBulanan } from './pages/admin/IuranBulanan';
import { PemasukanPage } from './pages/admin/PemasukanPage';
import { PengeluaranPage } from './pages/admin/PengeluaranPage';
import { BukuKasPage } from './pages/admin/BukuKasPage';
import { SaldoPage } from './pages/admin/SaldoPage';
import { LaporanPerAnggota } from './pages/admin/LaporanPerAnggota';
import { LaporanBulanan } from './pages/admin/LaporanBulanan';
import { RekapMatriksBulan } from './pages/admin/RekapMatriksBulan';
import { LaporanTahunan } from './pages/admin/LaporanTahunan';
import { RekapKeuangan } from './pages/admin/RekapKeuangan';
import { ActivityLogPage } from './pages/admin/ActivityLogPage';
import { PengaturanPage } from './pages/admin/PengaturanPage';
import { BackupDataPage } from './pages/admin/BackupDataPage';
import { ProfilAdmin } from './pages/admin/ProfilAdmin';

// Anggota Pages
import { AnggotaDashboard } from './pages/anggota/AnggotaDashboard';
import { AnggotaProfil } from './pages/anggota/AnggotaProfil';
import { AnggotaIuran } from './pages/anggota/AnggotaIuran';
import { AnggotaRiwayat } from './pages/anggota/AnggotaRiwayat';
import { AnggotaLaporan } from './pages/anggota/AnggotaLaporan';
import { AnggotaUbahPassword } from './pages/anggota/AnggotaUbahPassword';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard Utama',
  anggota: 'Data Master Anggota',
  iuran: 'Iuran Bulanan',
  pemasukan: 'Penerimaan Kas (Pemasukan)',
  pengeluaran: 'Pengeluaran & Belanja Kas',
  bukukas: 'Buku Kas Umum (BKU)',
  saldo: 'Saldo Kas Berjalan',
  'laporan-anggota': 'Laporan Iuran Per Anggota',
  'laporan-bulanan': 'Laporan Keuangan Bulanan',
  'rekap-matriks': 'Rekap Iuran Seluruh Bulan (Matriks)',
  'laporan-tahunan': 'Laporan Keuangan Tahunan',
  'laporan-rekap': 'Rekapitulasi Keuangan',
  'activity-log': 'Activity Log & Jejak Audit',
  pengaturan: 'Pengaturan Sistem',
  backup: 'Backup & Pemulihan Data',
  'profil-admin': 'Profil Administrator',
  'anggota-dashboard': 'Dashboard Anggota',
  'anggota-profil': 'Profil Saya',
  'anggota-iuran': 'Status Iuran Saya',
  'anggota-riwayat': 'Riwayat Pembayaran Saya',
  'anggota-laporan': 'Laporan & Kuitansi Saya',
  'anggota-password': 'Ubah Password',
};

const MainAppContent: React.FC = () => {
  const { userProfile, currentUser, role, loading: authLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>(
    role === 'admin' ? 'dashboard' : 'anggota-dashboard'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync initial tab when role changes
  React.useEffect(() => {
    if (role === 'admin' && currentTab.startsWith('anggota-')) {
      setCurrentTab('dashboard');
    } else if (role === 'anggota' && !currentTab.startsWith('anggota-')) {
      setCurrentTab('anggota-dashboard');
    }
  }, [role]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-white text-xs font-semibold tracking-wide">
          Memuat Sistem Keuangan MKPS SMP Garut...
        </p>
      </div>
    );
  }

  // Not logged in -> Show Login
  if (!currentUser && !userProfile) {
    return <Login />;
  }

  const renderActivePage = () => {
    switch (currentTab) {
      // Admin
      case 'dashboard':
        return <AdminDashboard onNavigate={setCurrentTab} />;
      case 'anggota':
        return <DataAnggota />;
      case 'iuran':
        return <IuranBulanan />;
      case 'pemasukan':
        return <PemasukanPage />;
      case 'pengeluaran':
        return <PengeluaranPage />;
      case 'bukukas':
        return <BukuKasPage />;
      case 'saldo':
        return <SaldoPage />;
      case 'laporan-anggota':
        return <LaporanPerAnggota />;
      case 'laporan-bulanan':
        return <LaporanBulanan />;
      case 'rekap-matriks':
        return <RekapMatriksBulan />;
      case 'laporan-tahunan':
        return <LaporanTahunan />;
      case 'laporan-rekap':
        return <RekapKeuangan />;
      case 'activity-log':
        return <ActivityLogPage />;
      case 'pengaturan':
        return <PengaturanPage />;
      case 'backup':
        return <BackupDataPage />;
      case 'profil-admin':
        return <ProfilAdmin />;

      // Anggota
      case 'anggota-dashboard':
        return <AnggotaDashboard onNavigate={setCurrentTab} />;
      case 'anggota-profil':
        return <AnggotaProfil />;
      case 'anggota-iuran':
        return <AnggotaIuran />;
      case 'anggota-riwayat':
        return <AnggotaRiwayat />;
      case 'anggota-laporan':
        return <AnggotaLaporan />;
      case 'anggota-password':
        return <AnggotaUbahPassword />;

      default:
        return role === 'admin' ? (
          <AdminDashboard onNavigate={setCurrentTab} />
        ) : (
          <AnggotaDashboard onNavigate={setCurrentTab} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          pageTitle={pageTitles[currentTab] || 'Dashboard'}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </AuthProvider>
  );
}
