import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import {
  Anggota,
  Iuran,
  Pemasukan,
  Pengeluaran,
  Pengaturan,
  ActivityLog,
  UserProfile,
} from '../types';
import { generateTrxCode, getTodayDateString } from '../utils/formatters';

const DEFAULT_SETTINGS: Pengaturan = {
  namaOrganisasi: 'MKPS SMP KABUPATEN GARUT',
  namaAplikasi: 'Sistem Keuangan Iuran MKPS SMP Garut',
  nominalIuran: 100000,
  tahunAktif: 2026,
  logo: '',
  alamat: 'Jl. Pembangunan No. 123, Tarogong Kidul, Garut, Jawa Barat',
  kontak: 'mkps.smp.garut@gmail.com / 0812-3456-7890',
  namaKetua: 'Drs. H. Asep Saepudin, M.Pd.',
  namaBendahara: 'Imas Komariah, S.Pd., M.M.Pd.',
};

export async function fetchPengaturan(): Promise<Pengaturan> {
  const path = 'pengaturan/app';
  try {
    const snap = await getDoc(doc(db, 'pengaturan', 'app'));
    if (snap.exists()) {
      const data = snap.data() as Pengaturan;
      // Auto-update Bendahara if still referencing old name
      if (
        !data.namaBendahara ||
        data.namaBendahara.includes('Euis') ||
        data.namaBendahara.includes('Asep')
      ) {
        data.namaBendahara = 'Imas Komariah, S.Pd., M.M.Pd.';
        setDoc(doc(db, 'pengaturan', 'app'), { ...data, updatedAt: new Date().toISOString() }).catch(
          () => {}
        );
      }
      return data;
    } else {
      // Initialize with default
      await setDoc(doc(db, 'pengaturan', 'app'), {
        ...DEFAULT_SETTINGS,
        updatedAt: new Date().toISOString(),
      });
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updatePengaturan(data: Partial<Pengaturan>, adminUid: string, adminNama: string): Promise<void> {
  const path = 'pengaturan/app';
  try {
    await updateDoc(doc(db, 'pengaturan', 'app'), {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    await logActivity({
      userId: adminUid,
      namaUser: adminNama,
      role: 'admin',
      aktivitas: 'Perubahan Pengaturan Aplikasi',
      modul: 'Pengaturan',
      detail: `Memperbarui konfigurasi aplikasi (Nominal: ${data.nominalIuran}, Tahun: ${data.tahunAktif})`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchAnggota(): Promise<Anggota[]> {
  const path = 'anggota';
  try {
    const q = query(collection(db, path), orderBy('nama', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Anggota));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createAnggota(
  anggotaData: Omit<Anggota, 'id' | 'createdAt' | 'updatedAt'>,
  adminUid: string,
  adminNama: string
): Promise<Anggota> {
  const path = 'anggota';
  try {
    const newId = doc(collection(db, path)).id;
    const now = new Date().toISOString();
    const anggota: Anggota = {
      ...anggotaData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, path, newId), anggota);

    await logActivity({
      userId: adminUid,
      namaUser: adminNama,
      role: 'admin',
      aktivitas: 'Tambah Anggota Baru',
      modul: 'Data Anggota',
      recordId: newId,
      detail: `Menambahkan anggota: ${anggota.nama} (NIP: ${anggota.nip})`,
    });

    return anggota;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAnggota(
  id: string,
  data: Partial<Anggota>,
  adminUid: string,
  adminNama: string
): Promise<void> {
  const path = `anggota/${id}`;
  try {
    await updateDoc(doc(db, 'anggota', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    await logActivity({
      userId: adminUid,
      namaUser: adminNama,
      role: 'admin',
      aktivitas: 'Ubah Data Anggota',
      modul: 'Data Anggota',
      recordId: id,
      detail: `Memperbarui data anggota: ${data.nama || id}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAnggota(
  id: string,
  nama: string,
  adminUid: string,
  adminNama: string
): Promise<void> {
  const path = `anggota/${id}`;
  try {
    await deleteDoc(doc(db, 'anggota', id));

    await logActivity({
      userId: adminUid,
      namaUser: adminNama,
      role: 'admin',
      aktivitas: 'Hapus Data Anggota',
      modul: 'Data Anggota',
      recordId: id,
      detail: `Menghapus data anggota: ${nama} (ID: ${id})`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchIuran(): Promise<Iuran[]> {
  const path = 'iuran';
  try {
    const q = query(collection(db, path), orderBy('tahun', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Iuran));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createPembayaranIuran(
  payload: {
    anggotaId: string;
    namaAnggota: string;
    nip: string;
    bulan: number;
    tahun: number;
    nominal: number;
    tanggalBayar: string;
    keterangan?: string;
  },
  adminUid: string,
  adminNama: string,
  currentCount: number
): Promise<Iuran> {
  const path = 'iuran';
  try {
    const newId = doc(collection(db, path)).id;
    const now = new Date().toISOString();
    const nomorTransaksi = generateTrxCode('IUR', payload.tahun, currentCount + 1);
    const periode = `${payload.tahun}-${String(payload.bulan).padStart(2, '0')}`;

    const newIuran: Iuran = {
      id: newId,
      nomorTransaksi,
      anggotaId: payload.anggotaId,
      namaAnggota: payload.namaAnggota,
      nip: payload.nip,
      bulan: payload.bulan,
      tahun: payload.tahun,
      periode,
      nominal: payload.nominal,
      tanggalBayar: payload.tanggalBayar,
      status: 'lunas',
      keterangan: payload.keterangan || '',
      createdBy: adminUid,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, path, newId), newIuran);

    await logActivity({
      userId: adminUid,
      namaUser: adminNama,
      role: 'admin',
      aktivitas: 'Catat Pembayaran Iuran',
      modul: 'Iuran Bulanan',
      recordId: newId,
      detail: `Iuran ${payload.namaAnggota} (${payload.bulan}/${payload.tahun}) sebesar Rp ${payload.nominal.toLocaleString('id-ID')} [${nomorTransaksi}]`,
    });

    return newIuran;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function cancelIuran(
  id: string,
  alasan: string,
  adminUid: string,
  adminNama: string
): Promise<void> {
  const path = `iuran/${id}`;
  try {
    await updateDoc(doc(db, 'iuran', id), {
      status: 'dibatalkan',
      keterangan: `Dibatalkan: ${alasan}`,
      updatedAt: new Date().toISOString(),
    });

    await logActivity({
      userId: adminUid,
      namaUser: adminNama,
      role: 'admin',
      aktivitas: 'Batalkan Transaksi Iuran',
      modul: 'Iuran Bulanan',
      recordId: id,
      detail: `Membatalkan iuran (ID: ${id}) dengan alasan: ${alasan}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchPemasukan(): Promise<Pemasukan[]> {
  const path = 'pemasukan';
  try {
    const q = query(collection(db, path), orderBy('tanggal', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pemasukan));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createPemasukan(
  payload: {
    tanggal: string;
    kategori: string;
    sumber: string;
    nominal: number;
    keterangan?: string;
  },
  adminUid: string,
  adminNama: string,
  currentCount: number
): Promise<Pemasukan> {
  const path = 'pemasukan';
  try {
    const newId = doc(collection(db, path)).id;
    const now = new Date().toISOString();
    const year = new Date(payload.tanggal).getFullYear() || 2026;
    const nomorTransaksi = generateTrxCode('MAS', year, currentCount + 1);

    const newPemasukan: Pemasukan = {
      id: newId,
      nomorTransaksi,
      tanggal: payload.tanggal,
      kategori: payload.kategori,
      sumber: payload.sumber,
      nominal: payload.nominal,
      keterangan: payload.keterangan || '',
      status: 'aktif',
      createdBy: adminUid,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, path, newId), newPemasukan);

    await logActivity({
      userId: adminUid,
      namaUser: adminNama,
      role: 'admin',
      aktivitas: 'Tambah Pemasukan Kas',
      modul: 'Pemasukan',
      recordId: newId,
      detail: `Pemasukan [${nomorTransaksi}]: ${payload.kategori} - ${payload.sumber} Rp ${payload.nominal.toLocaleString('id-ID')}`,
    });

    return newPemasukan;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function cancelPemasukan(
  id: string,
  alasan: string,
  adminUid: string,
  adminNama: string
): Promise<void> {
  const path = `pemasukan/${id}`;
  try {
    await updateDoc(doc(db, 'pemasukan', id), {
      status: 'dibatalkan',
      keterangan: `Dibatalkan: ${alasan}`,
      updatedAt: new Date().toISOString(),
    });

    await logActivity({
      userId: adminUid,
      namaUser: adminNama,
      role: 'admin',
      aktivitas: 'Batalkan Pemasukan',
      modul: 'Pemasukan',
      recordId: id,
      detail: `Membatalkan transaksi pemasukan (ID: ${id}): ${alasan}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchPengeluaran(): Promise<Pengeluaran[]> {
  const path = 'pengeluaran';
  try {
    const q = query(collection(db, path), orderBy('tanggal', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pengeluaran));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createPengeluaran(
  payload: {
    tanggal: string;
    kategori: string;
    penerima: string;
    nominal: number;
    keterangan?: string;
    buktiUrl?: string;
  },
  adminUid: string,
  adminNama: string,
  currentCount: number
): Promise<Pengeluaran> {
  const path = 'pengeluaran';
  try {
    const newId = doc(collection(db, path)).id;
    const now = new Date().toISOString();
    const year = new Date(payload.tanggal).getFullYear() || 2026;
    const nomorTransaksi = generateTrxCode('KEL', year, currentCount + 1);

    const newPengeluaran: Pengeluaran = {
      id: newId,
      nomorTransaksi,
      tanggal: payload.tanggal,
      kategori: payload.kategori,
      penerima: payload.penerima,
      nominal: payload.nominal,
      keterangan: payload.keterangan || '',
      buktiUrl: payload.buktiUrl || '',
      status: 'aktif',
      createdBy: adminUid,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, path, newId), newPengeluaran);

    await logActivity({
      userId: adminUid,
      namaUser: adminNama,
      role: 'admin',
      aktivitas: 'Tambah Pengeluaran Kas',
      modul: 'Pengeluaran',
      recordId: newId,
      detail: `Pengeluaran [${nomorTransaksi}]: ${payload.kategori} - ${payload.penerima} Rp ${payload.nominal.toLocaleString('id-ID')}`,
    });

    return newPengeluaran;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function cancelPengeluaran(
  id: string,
  alasan: string,
  adminUid: string,
  adminNama: string
): Promise<void> {
  const path = `pengeluaran/${id}`;
  try {
    await updateDoc(doc(db, 'pengeluaran', id), {
      status: 'dibatalkan',
      keterangan: `Dibatalkan: ${alasan}`,
      updatedAt: new Date().toISOString(),
    });

    await logActivity({
      userId: adminUid,
      namaUser: adminNama,
      role: 'admin',
      aktivitas: 'Batalkan Pengeluaran',
      modul: 'Pengeluaran',
      recordId: id,
      detail: `Membatalkan transaksi pengeluaran (ID: ${id}): ${alasan}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchActivityLogs(maxRecords = 100): Promise<ActivityLog[]> {
  const path = 'activity_logs';
  try {
    const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(maxRecords));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLog));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function logActivity(logData: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
  const path = 'activity_logs';
  try {
    const logId = doc(collection(db, path)).id;
    const activity: ActivityLog = {
      ...logData,
      id: logId,
      timestamp: new Date().toISOString(),
    };
    await setDoc(doc(db, path, logId), activity);
  } catch (error) {
    console.warn('Logging activity failed (non-fatal):', error);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, 'users', profile.uid), {
      ...profile,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Seed initial sample MKPS data if Firestore is empty
 */
export async function seedInitialDemoData(adminUid: string, adminNama: string): Promise<void> {
  const now = new Date().toISOString();
  const today = getTodayDateString();

  // 1. Initial Members (Pengawas SMP Garut)
  const sampleMembers = [
    { nama: 'Drs. H. Dedi Suryadi, M.Pd.', nip: '196803151994121002', email: 'dedi.suryadi@mkps-garut.id', tanggalBergabung: '2020-01-01', status: 'aktif' as const },
    { nama: 'Hj. Nenden Hernawati, S.Pd., M.M.Pd.', nip: '197108221997022001', email: 'nenden.hernawati@mkps-garut.id', tanggalBergabung: '2021-03-10', status: 'aktif' as const },
    { nama: 'Drs. Ahmad Hidayat, M.Si.', nip: '196511141991031004', email: 'ahmad.hidayat@mkps-garut.id', tanggalBergabung: '2019-07-01', status: 'aktif' as const },
    { nama: 'Dra. Hj. Rina Marlina, M.Pd.', nip: '197305091998022003', email: 'rina.marlina@mkps-garut.id', tanggalBergabung: '2022-02-15', status: 'aktif' as const },
    { nama: 'H. Tatang Supriatna, S.Pd., M.Pd.', nip: '196912041995121001', email: 'tatang.supriatna@mkps-garut.id', tanggalBergabung: '2020-06-01', status: 'aktif' as const },
    { nama: 'Dr. Yudi Kristiadi, M.Pd.', nip: '197604182000031002', email: 'yudi.kristiadi@mkps-garut.id', tanggalBergabung: '2023-01-10', status: 'aktif' as const },
    { nama: 'Hj. Elis Rohayati, S.Pd., M.Si.', nip: '197207191996012001', email: 'elis.rohayati@mkps-garut.id', tanggalBergabung: '2021-08-01', status: 'aktif' as const },
    { nama: 'Drs. Iwan Setiawan, M.M.Pd.', nip: '196709231993031003', email: 'iwan.setiawan@mkps-garut.id', tanggalBergabung: '2018-01-15', status: 'aktif' as const },
  ];

  const createdAnggotaList: Anggota[] = [];
  for (const m of sampleMembers) {
    const id = doc(collection(db, 'anggota')).id;
    const item: Anggota = {
      ...m,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'anggota', id), item);
    createdAnggotaList.push(item);
  }

  // 2. Initial Dues for January & February 2026
  let iurSeq = 1;
  const bulanList = [1, 2];
  for (const bulan of bulanList) {
    // 6 members have paid, 2 have not yet paid for Jan/Feb
    for (let i = 0; i < 6; i++) {
      const member = createdAnggotaList[i];
      const iurId = doc(collection(db, 'iuran')).id;
      const tgl = bulan === 1 ? '2026-01-05' : '2026-02-06';
      const item: Iuran = {
        id: iurId,
        nomorTransaksi: generateTrxCode('IUR', 2026, iurSeq++),
        anggotaId: member.id,
        namaAnggota: member.nama,
        nip: member.nip,
        bulan,
        tahun: 2026,
        periode: `2026-${String(bulan).padStart(2, '0')}`,
        nominal: 100000,
        tanggalBayar: tgl,
        status: 'lunas',
        keterangan: `Iuran Bulan ${bulan === 1 ? 'Januari' : 'Februari'} 2026`,
        createdBy: adminUid,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, 'iuran', iurId), item);
    }
  }

  // 3. Initial Income (Donasi / Kas Awal)
  const p1Id = doc(collection(db, 'pemasukan')).id;
  await setDoc(doc(db, 'pemasukan', p1Id), {
    id: p1Id,
    nomorTransaksi: generateTrxCode('MAS', 2026, 1),
    tanggal: '2026-01-02',
    kategori: 'Saldo Awal Tahun',
    sumber: 'Sisa Saldo Kas MKPS Tahun 2025',
    nominal: 5000000,
    keterangan: 'Penerimaan saldo kas awal tahun 2026',
    status: 'aktif',
    createdBy: adminUid,
    createdAt: now,
    updatedAt: now,
  } as Pemasukan);

  // 4. Initial Expense (Konsumsi & Operasional)
  const k1Id = doc(collection(db, 'pengeluaran')).id;
  await setDoc(doc(db, 'pengeluaran', k1Id), {
    id: k1Id,
    nomorTransaksi: generateTrxCode('KEL', 2026, 1),
    tanggal: '2026-01-10',
    kategori: 'Konsumsi Rapat',
    penerima: 'RM Sambel Cibiuk Garut',
    nominal: 750000,
    keterangan: 'Konsumsi rapat koordinasi awal semester genap pengawas SMP',
    buktiUrl: '',
    status: 'aktif',
    createdBy: adminUid,
    createdAt: now,
    updatedAt: now,
  } as Pengeluaran);

  const k2Id = doc(collection(db, 'pengeluaran')).id;
  await setDoc(doc(db, 'pengeluaran', k2Id), {
    id: k2Id,
    nomorTransaksi: generateTrxCode('KEL', 2026, 2),
    tanggal: '2026-01-25',
    kategori: 'ATK & Fotokopi',
    penerima: 'Fotokopi Sinar Garut',
    nominal: 250000,
    keterangan: 'Penggandaan instrumen supervisi manajerial sekolah',
    buktiUrl: '',
    status: 'aktif',
    createdBy: adminUid,
    createdAt: now,
    updatedAt: now,
  } as Pengeluaran);

  // 5. Activity Log
  await logActivity({
    userId: adminUid,
    namaUser: adminNama,
    role: 'admin',
    aktivitas: 'Inisialisasi Data Awal Sistem',
    modul: 'Sistem',
    detail: 'Menyiapkan data master anggota dan transaksi awal MKPS SMP Garut',
  });
}

/**
 * Purge all members and transactions to start completely fresh
 */
export async function clearAllData(adminUid: string, adminNama: string): Promise<void> {
  const collectionsToClear = ['anggota', 'iuran', 'pemasukan', 'pengeluaran'];

  for (const colName of collectionsToClear) {
    try {
      const snap = await getDocs(collection(db, colName));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, colName, d.id));
      }
    } catch (err) {
      console.error(`Gagal membersihkan collection ${colName}:`, err);
    }
  }

  // Clean demo members in 'users' collection
  try {
    const userSnap = await getDocs(collection(db, 'users'));
    for (const d of userSnap.docs) {
      const uData = d.data();
      if (uData.email && uData.email === 'asepf16@guru.smp.belajar.id') {
        continue;
      }
      if (d.id.startsWith('user-') || d.id === 'anggota-demo-mkps') {
        await deleteDoc(doc(db, 'users', d.id));
      }
    }
  } catch (err) {
    console.error('Error cleaning demo users:', err);
  }

  await logActivity({
    userId: adminUid,
    namaUser: adminNama,
    role: 'admin',
    aktivitas: 'Pembersihan Seluruh Data Transaksi & Anggota',
    modul: 'Sistem',
    detail: 'Membersihkan seluruh data master nama anggota dan transaksi keuangan untuk memulai pembukuan dari awal.',
  });
}
