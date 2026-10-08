import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Anggota,
  Iuran,
  Pemasukan,
  Pengeluaran,
  Pengaturan,
  ActivityLog,
  BukuKasEntry,
} from '../types';
import {
  fetchPengaturan,
  updatePengaturan as savePengaturanService,
  fetchAnggota,
  createAnggota as createAnggotaService,
  updateAnggota as updateAnggotaService,
  deleteAnggota as deleteAnggotaService,
  fetchIuran,
  createPembayaranIuran as createIuranService,
  cancelIuran as cancelIuranService,
  fetchPemasukan,
  createPemasukan as createPemasukanService,
  cancelPemasukan as cancelPemasukanService,
  fetchPengeluaran,
  createPengeluaran as createPengeluaranService,
  cancelPengeluaran as cancelPengeluaranService,
  fetchActivityLogs,
  seedInitialDemoData,
  clearAllData as clearAllDataService,
} from '../services/db';
import { useAuth } from './AuthContext';

interface AppContextType {
  settings: Pengaturan;
  anggotaList: Anggota[];
  iuranList: Iuran[];
  pemasukanList: Pemasukan[];
  pengeluaranList: Pengeluaran[];
  activityLogs: ActivityLog[];
  loading: boolean;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  // Computed balances & stats
  totalPemasukan: number;
  totalPengeluaran: number;
  saldoBerjalan: number;
  bukuKas: BukuKasEntry[];
  anggotaAktifCount: number;
  // Actions
  refreshAll: () => Promise<void>;
  addAnggota: (anggota: Omit<Anggota, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Anggota>;
  editAnggota: (id: string, data: Partial<Anggota>) => Promise<void>;
  hapusAnggota: (id: string, nama: string) => Promise<void>;
  catatIuran: (payload: {
    anggotaId: string;
    namaAnggota: string;
    nip: string;
    bulan: number;
    tahun: number;
    nominal: number;
    tanggalBayar: string;
    keterangan?: string;
  }) => Promise<Iuran>;
  batalkanIuran: (id: string, alasan: string) => Promise<void>;
  catatPemasukan: (payload: {
    tanggal: string;
    kategori: string;
    sumber: string;
    nominal: number;
    keterangan?: string;
  }) => Promise<Pemasukan>;
  batalkanPemasukan: (id: string, alasan: string) => Promise<void>;
  catatPengeluaran: (payload: {
    tanggal: string;
    kategori: string;
    penerima: string;
    nominal: number;
    keterangan?: string;
    buktiUrl?: string;
  }) => Promise<Pengeluaran>;
  batalkanPengeluaran: (id: string, alasan: string) => Promise<void>;
  updateSettings: (data: Partial<Pengaturan>) => Promise<void>;
  triggerSeedData: () => Promise<void>;
  clearDatabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, role } = useAuth();
  const [settings, setSettings] = useState<Pengaturan>({
    namaOrganisasi: 'MKPS SMP KABUPATEN GARUT',
    namaAplikasi: 'Sistem Keuangan Iuran MKPS SMP Garut',
    nominalIuran: 100000,
    tahunAktif: 2026,
    logo: '',
    alamat: 'Jl. Pembangunan No. 123, Tarogong Kidul, Garut, Jawa Barat',
    kontak: 'mkps.smp.garut@gmail.com / 0812-3456-7890',
    namaKetua: 'Drs. H. Asep Saepudin, M.Pd.',
    namaBendahara: 'Imas Komariah, S.Pd., M.M.Pd.',
  });

  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [iuranList, setIuranList] = useState<Iuran[]>([]);
  const [pemasukanList, setPemasukanList] = useState<Pemasukan[]>([]);
  const [pengeluaranList, setPengeluaranList] = useState<Pengeluaran[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const loadData = async () => {
    try {
      const sett = await fetchPengaturan();
      setSettings(sett);
      if (sett.tahunAktif) {
        setSelectedYear(sett.tahunAktif);
      }

      // One-time purge to fulfill user request to start completely fresh
      const resetFlag = 'mkps_database_fresh_start_v1';
      if (!localStorage.getItem(resetFlag)) {
        try {
          await clearAllDataService(userProfile?.uid || 'admin', userProfile?.nama || 'Admin');
        } catch (e) {
          console.warn('Initial purge notice:', e);
        }
        localStorage.setItem(resetFlag, 'true');
      }

      const [members, dues, inc, exp, logs] = await Promise.all([
        fetchAnggota(),
        fetchIuran(),
        fetchPemasukan(),
        fetchPengeluaran(),
        fetchActivityLogs(100),
      ]);

      setAnggotaList(members);
      setIuranList(dues);
      setPemasukanList(inc);
      setPengeluaranList(exp);
      setActivityLogs(logs);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userProfile?.uid]);

  const refreshAll = async () => {
    setLoading(true);
    await loadData();
  };

  // Safe Financial Calculations (Prioritas 1 & 2):
  // Saldo = Total Pemasukan Valid (Pemasukan + Iuran Lunas) - Total Pengeluaran Valid
  const totalPemasukan = useMemo(() => {
    const fromPemasukan = pemasukanList
      .filter((p) => p.status === 'aktif')
      .reduce((sum, item) => sum + (item.nominal || 0), 0);

    const fromIuran = iuranList
      .filter((i) => i.status === 'lunas')
      .reduce((sum, item) => sum + (item.nominal || 0), 0);

    return fromPemasukan + fromIuran;
  }, [pemasukanList, iuranList]);

  const totalPengeluaran = useMemo(() => {
    return pengeluaranList
      .filter((p) => p.status === 'aktif')
      .reduce((sum, item) => sum + (item.nominal || 0), 0);
  }, [pengeluaranList]);

  const saldoBerjalan = useMemo(() => {
    return totalPemasukan - totalPengeluaran;
  }, [totalPemasukan, totalPengeluaran]);

  // Buku Kas with sequential running balance:
  // Must be sorted by tanggal ASC, then createdAt ASC
  const bukuKas: BukuKasEntry[] = useMemo(() => {
    interface RawEntry {
      id: string;
      tanggal: string;
      nomorTransaksi: string;
      keterangan: string;
      jenis: 'masuk' | 'keluar';
      kategori: string;
      nominalMasuk: number;
      nominalKeluar: number;
      status: 'aktif' | 'dibatalkan';
      timestamp: number;
    }

    const raw: RawEntry[] = [];

    // 1. Pemasukan
    for (const p of pemasukanList) {
      const time = p.createdAt ? new Date(p.createdAt).getTime() : new Date(p.tanggal).getTime();
      raw.push({
        id: p.id,
        tanggal: p.tanggal,
        nomorTransaksi: p.nomorTransaksi,
        keterangan: `${p.kategori} - ${p.sumber}${p.keterangan ? ' (' + p.keterangan + ')' : ''}`,
        jenis: 'masuk',
        kategori: p.kategori,
        nominalMasuk: p.nominal,
        nominalKeluar: 0,
        status: p.status,
        timestamp: time,
      });
    }

    // 2. Iuran
    for (const i of iuranList) {
      const time = i.createdAt ? new Date(i.createdAt).getTime() : new Date(i.tanggalBayar).getTime();
      raw.push({
        id: i.id,
        tanggal: i.tanggalBayar,
        nomorTransaksi: i.nomorTransaksi,
        keterangan: `Iuran ${i.namaAnggota} (${i.bulan}/${i.tahun})${i.keterangan ? ' - ' + i.keterangan : ''}`,
        jenis: 'masuk',
        kategori: 'Iuran Bulanan',
        nominalMasuk: i.nominal,
        nominalKeluar: 0,
        status: i.status === 'lunas' ? 'aktif' : 'dibatalkan',
        timestamp: time,
      });
    }

    // 3. Pengeluaran
    for (const k of pengeluaranList) {
      const time = k.createdAt ? new Date(k.createdAt).getTime() : new Date(k.tanggal).getTime();
      raw.push({
        id: k.id,
        tanggal: k.tanggal,
        nomorTransaksi: k.nomorTransaksi,
        keterangan: `${k.kategori} - ${k.penerima}${k.keterangan ? ' (' + k.keterangan + ')' : ''}`,
        jenis: 'keluar',
        kategori: k.kategori,
        nominalMasuk: 0,
        nominalKeluar: k.nominal,
        status: k.status,
        timestamp: time,
      });
    }

    // Sort ascending by Date, then timestamp
    raw.sort((a, b) => {
      const dateDiff = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.timestamp - b.timestamp;
    });

    let currentBalance = 0;
    const entries: BukuKasEntry[] = [];

    for (const r of raw) {
      if (r.status === 'aktif') {
        if (r.jenis === 'masuk') {
          currentBalance += r.nominalMasuk;
        } else {
          currentBalance -= r.nominalKeluar;
        }
      }

      entries.push({
        id: r.id,
        tanggal: r.tanggal,
        nomorTransaksi: r.nomorTransaksi,
        keterangan: r.keterangan,
        jenis: r.jenis,
        kategori: r.kategori,
        nominalMasuk: r.nominalMasuk,
        nominalKeluar: r.nominalKeluar,
        saldo: currentBalance,
        status: r.status,
        createdAtTimestamp: r.timestamp,
      });
    }

    return entries;
  }, [pemasukanList, iuranList, pengeluaranList]);

  const anggotaAktifCount = useMemo(() => {
    return anggotaList.filter((a) => a.status === 'aktif').length;
  }, [anggotaList]);

  // Actions
  const addAnggota = async (anggotaData: Omit<Anggota, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await createAnggotaService(
      anggotaData,
      userProfile?.uid || 'admin',
      userProfile?.nama || 'Admin'
    );
    setAnggotaList((prev) => [...prev, created].sort((a, b) => a.nama.localeCompare(b.nama)));
    return created;
  };

  const editAnggota = async (id: string, data: Partial<Anggota>) => {
    await updateAnggotaService(id, data, userProfile?.uid || 'admin', userProfile?.nama || 'Admin');
    setAnggotaList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a))
    );
  };

  const hapusAnggota = async (id: string, nama: string) => {
    await deleteAnggotaService(id, nama, userProfile?.uid || 'admin', userProfile?.nama || 'Admin');
    setAnggotaList((prev) => prev.filter((a) => a.id !== id));
  };

  const catatIuran = async (payload: {
    anggotaId: string;
    namaAnggota: string;
    nip: string;
    bulan: number;
    tahun: number;
    nominal: number;
    tanggalBayar: string;
    keterangan?: string;
  }) => {
    const created = await createIuranService(
      payload,
      userProfile?.uid || 'admin',
      userProfile?.nama || 'Admin',
      iuranList.length
    );
    setIuranList((prev) => [created, ...prev]);
    return created;
  };

  const batalkanIuran = async (id: string, alasan: string) => {
    await cancelIuranService(id, alasan, userProfile?.uid || 'admin', userProfile?.nama || 'Admin');
    setIuranList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'dibatalkan',
              keterangan: `Dibatalkan: ${alasan}`,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const catatPemasukan = async (payload: {
    tanggal: string;
    kategori: string;
    sumber: string;
    nominal: number;
    keterangan?: string;
  }) => {
    const created = await createPemasukanService(
      payload,
      userProfile?.uid || 'admin',
      userProfile?.nama || 'Admin',
      pemasukanList.length
    );
    setPemasukanList((prev) => [created, ...prev]);
    return created;
  };

  const batalkanPemasukan = async (id: string, alasan: string) => {
    await cancelPemasukanService(id, alasan, userProfile?.uid || 'admin', userProfile?.nama || 'Admin');
    setPemasukanList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'dibatalkan',
              keterangan: `Dibatalkan: ${alasan}`,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const catatPengeluaran = async (payload: {
    tanggal: string;
    kategori: string;
    penerima: string;
    nominal: number;
    keterangan?: string;
    buktiUrl?: string;
  }) => {
    const created = await createPengeluaranService(
      payload,
      userProfile?.uid || 'admin',
      userProfile?.nama || 'Admin',
      pengeluaranList.length
    );
    setPengeluaranList((prev) => [created, ...prev]);
    return created;
  };

  const batalkanPengeluaran = async (id: string, alasan: string) => {
    await cancelPengeluaranService(id, alasan, userProfile?.uid || 'admin', userProfile?.nama || 'Admin');
    setPengeluaranList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'dibatalkan',
              keterangan: `Dibatalkan: ${alasan}`,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const updateSettings = async (data: Partial<Pengaturan>) => {
    await savePengaturanService(data, userProfile?.uid || 'admin', userProfile?.nama || 'Admin');
    setSettings((prev) => ({ ...prev, ...data }));
    if (data.tahunAktif) setSelectedYear(data.tahunAktif);
  };

  const triggerSeedData = async () => {
    setLoading(true);
    await seedInitialDemoData(userProfile?.uid || 'admin', userProfile?.nama || 'Admin');
    await refreshAll();
  };

  const clearDatabase = async () => {
    setLoading(true);
    await clearAllDataService(userProfile?.uid || 'admin', userProfile?.nama || 'Admin');
    setAnggotaList([]);
    setIuranList([]);
    setPemasukanList([]);
    setPengeluaranList([]);
    const refreshedLogs = await fetchActivityLogs(100);
    setActivityLogs(refreshedLogs);
    setLoading(false);
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        anggotaList,
        iuranList,
        pemasukanList,
        pengeluaranList,
        activityLogs,
        loading,
        selectedYear,
        setSelectedYear,
        totalPemasukan,
        totalPengeluaran,
        saldoBerjalan,
        bukuKas,
        anggotaAktifCount,
        refreshAll,
        addAnggota,
        editAnggota,
        hapusAnggota,
        catatIuran,
        batalkanIuran,
        catatPemasukan,
        batalkanPemasukan,
        catatPengeluaran,
        batalkanPengeluaran,
        updateSettings,
        triggerSeedData,
        clearDatabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
