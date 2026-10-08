export type UserRole = 'admin' | 'anggota';

export interface UserProfile {
  uid: string;
  nama: string;
  email: string;
  role: UserRole;
  anggotaId?: string;
  status: 'aktif' | 'nonaktif';
  createdAt?: string;
  updatedAt?: string;
}

export interface Anggota {
  id: string;
  nama: string;
  nip: string;
  email?: string;
  userId?: string;
  tanggalBergabung: string;
  status: 'aktif' | 'nonaktif';
  createdAt?: string;
  updatedAt?: string;
}

export type IuranStatus = 'lunas' | 'belum_bayar' | 'dibatalkan';

export interface Iuran {
  id: string;
  nomorTransaksi: string;
  anggotaId: string;
  namaAnggota: string;
  nip: string;
  bulan: number; // 1-12
  tahun: number; // e.g. 2026
  periode: string; // "2026-01"
  nominal: number; // Rupiah integer
  tanggalBayar: string; // YYYY-MM-DD or DD/MM/YYYY
  status: IuranStatus;
  keterangan?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PemasukanStatus = 'aktif' | 'dibatalkan';

export interface Pemasukan {
  id: string;
  nomorTransaksi: string;
  tanggal: string; // YYYY-MM-DD
  kategori: string; // e.g. "Iuran Bulanan", "Iuran Khusus", "Donasi", "Pendapatan Lainnya"
  sumber: string;
  nominal: number;
  keterangan?: string;
  status: PemasukanStatus;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PengeluaranStatus = 'aktif' | 'dibatalkan';

export interface Pengeluaran {
  id: string;
  nomorTransaksi: string;
  tanggal: string; // YYYY-MM-DD
  kategori: string;
  penerima: string;
  nominal: number;
  keterangan?: string;
  buktiUrl?: string;
  status: PengeluaranStatus;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pengaturan {
  namaOrganisasi: string;
  namaAplikasi: string;
  nominalIuran: number;
  tahunAktif: number;
  logo?: string;
  alamat?: string;
  kontak?: string;
  namaKetua?: string;
  namaBendahara?: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  namaUser: string;
  role: string;
  aktivitas: string;
  modul: string;
  recordId?: string;
  detail?: string;
  timestamp: string;
}

export interface BukuKasEntry {
  id: string;
  tanggal: string;
  nomorTransaksi: string;
  keterangan: string;
  jenis: 'masuk' | 'keluar' | 'saldo_awal';
  kategori: string;
  nominalMasuk: number;
  nominalKeluar: number;
  saldo: number;
  status: 'aktif' | 'dibatalkan';
  createdAtTimestamp: number;
}
