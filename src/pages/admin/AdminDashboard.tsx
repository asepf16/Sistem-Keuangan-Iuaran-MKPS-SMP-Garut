import React, { useMemo } from 'react';
import {
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { formatRupiah, BULAN_NAMES, formatDateIndo } from '../../utils/formatters';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenQuickPayment?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onOpenQuickPayment }) => {
  const {
    settings,
    anggotaList,
    iuranList,
    pemasukanList,
    pengeluaranList,
    saldoBerjalan,
    selectedYear,
    anggotaAktifCount,
  } = useApp();

  const currentMonthIndex = new Date().getMonth() + 1; // 1-12
  const currentMonthName = BULAN_NAMES[currentMonthIndex - 1];

  // 1. Iuran bulan ini
  const iuranBulanIni = useMemo(() => {
    return iuranList
      .filter(
        (i) =>
          i.tahun === selectedYear &&
          i.bulan === currentMonthIndex &&
          i.status === 'lunas'
      )
      .reduce((sum, item) => sum + item.nominal, 0);
  }, [iuranList, selectedYear, currentMonthIndex]);

  // 2. Pemasukan bulan ini (termasuk iuran)
  const pemasukanBulanIni = useMemo(() => {
    const inc = pemasukanList
      .filter((p) => {
        if (p.status !== 'aktif') return false;
        const d = new Date(p.tanggal);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === currentMonthIndex;
      })
      .reduce((sum, item) => sum + item.nominal, 0);
    return inc + iuranBulanIni;
  }, [pemasukanList, iuranBulanIni, selectedYear, currentMonthIndex]);

  // 3. Pengeluaran bulan ini
  const pengeluaranBulanIni = useMemo(() => {
    return pengeluaranList
      .filter((k) => {
        if (k.status !== 'aktif') return false;
        const d = new Date(k.tanggal);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === currentMonthIndex;
      })
      .reduce((sum, item) => sum + item.nominal, 0);
  }, [pengeluaranList, selectedYear, currentMonthIndex]);

  // 4. Statistik Pembayaran Iuran Bulan Ini
  const targetAnggota = anggotaList.filter((a) => a.status === 'aktif');
  const paidMemberIds = useMemo(() => {
    return new Set(
      iuranList
        .filter(
          (i) =>
            i.tahun === selectedYear &&
            i.bulan === currentMonthIndex &&
            i.status === 'lunas'
        )
        .map((i) => i.anggotaId)
    );
  }, [iuranList, selectedYear, currentMonthIndex]);

  const jumlahSudahBayar = paidMemberIds.size;
  const jumlahBelumBayar = Math.max(0, targetAnggota.length - jumlahSudahBayar);
  const persentaseBayar =
    targetAnggota.length > 0 ? Math.round((jumlahSudahBayar / targetAnggota.length) * 100) : 0;

  // Daftar anggota yang belum bayar bulan ini
  const anggotaBelumBayar = useMemo(() => {
    return targetAnggota.filter((m) => !paidMemberIds.has(m.id));
  }, [targetAnggota, paidMemberIds]);

  // 5. Monthly breakdown for visual bar comparison (Jan - Des)
  const monthlyBreakdown = useMemo(() => {
    return BULAN_NAMES.map((name, idx) => {
      const monthNum = idx + 1;
      const iur = iuranList
        .filter((i) => i.tahun === selectedYear && i.bulan === monthNum && i.status === 'lunas')
        .reduce((sum, i) => sum + i.nominal, 0);

      const mas = pemasukanList
        .filter((p) => {
          if (p.status !== 'aktif') return false;
          const d = new Date(p.tanggal);
          return d.getFullYear() === selectedYear && d.getMonth() + 1 === monthNum;
        })
        .reduce((sum, p) => sum + p.nominal, 0);

      const kel = pengeluaranList
        .filter((k) => {
          if (k.status !== 'aktif') return false;
          const d = new Date(k.tanggal);
          return d.getFullYear() === selectedYear && d.getMonth() + 1 === monthNum;
        })
        .reduce((sum, k) => sum + k.nominal, 0);

      const totalMas = iur + mas;
      return {
        month: name.slice(0, 3),
        fullName: name,
        masuk: totalMas,
        keluar: kel,
        selisih: totalMas - kel,
      };
    });
  }, [selectedYear, iuranList, pemasukanList, pengeluaranList]);

  // 6. Recent 10 transactions
  const recentTransactions = useMemo(() => {
    const list: Array<{
      id: string;
      tanggal: string;
      nomor: string;
      kategori: string;
      keterangan: string;
      nominal: number;
      tipe: 'masuk' | 'keluar';
      createdAt: string;
    }> = [];

    // Iuran
    for (const i of iuranList) {
      if (i.status === 'lunas') {
        list.push({
          id: i.id,
          tanggal: i.tanggalBayar,
          nomor: i.nomorTransaksi,
          kategori: 'Iuran Bulanan',
          keterangan: `${i.namaAnggota} (${BULAN_NAMES[i.bulan - 1]} ${i.tahun})`,
          nominal: i.nominal,
          tipe: 'masuk',
          createdAt: i.createdAt || i.tanggalBayar,
        });
      }
    }

    // Pemasukan
    for (const p of pemasukanList) {
      if (p.status === 'aktif') {
        list.push({
          id: p.id,
          tanggal: p.tanggal,
          nomor: p.nomorTransaksi,
          kategori: p.kategori,
          keterangan: `${p.sumber} - ${p.keterangan || ''}`,
          nominal: p.nominal,
          tipe: 'masuk',
          createdAt: p.createdAt || p.tanggal,
        });
      }
    }

    // Pengeluaran
    for (const k of pengeluaranList) {
      if (k.status === 'aktif') {
        list.push({
          id: k.id,
          tanggal: k.tanggal,
          nomor: k.nomorTransaksi,
          kategori: k.kategori,
          keterangan: `${k.penerima} - ${k.keterangan || ''}`,
          nominal: k.nominal,
          tipe: 'keluar',
          createdAt: k.createdAt || k.tanggal,
        });
      }
    }

    list.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    return list.slice(0, 10);
  }, [iuranList, pemasukanList, pengeluaranList]);

  // Max value for bar chart height scaling
  const maxMonthValue = useMemo(() => {
    let max = 1;
    for (const m of monthlyBreakdown) {
      if (m.masuk > max) max = m.masuk;
      if (m.keluar > max) max = m.keluar;
    }
    return max;
  }, [monthlyBreakdown]);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wide border border-emerald-500/30">
            Tahun Anggaran {selectedYear}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold mt-2">
            Dashboard Keuangan MKPS SMP Garut
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Pantau arus kas, realisasi iuran pengawas, dan kesehatan saldo organisasi secara akurat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('iuran')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Iuran</span>
          </button>
          <button
            onClick={() => onNavigate('pemasukan')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <span>Pemasukan</span>
          </button>
          <button
            onClick={() => onNavigate('pengeluaran')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
            <span>Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Top 5 Metric Cards as specified in Section O */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Anggota"
          value={anggotaAktifCount}
          subtitle={`${anggotaList.length} Terdaftar di Sistem`}
          icon={Users}
          variant="indigo"
        />
        <StatCard
          title={`Iuran ${currentMonthName}`}
          value={formatRupiah(iuranBulanIni)}
          subtitle={`Target: ${formatRupiah(targetAnggota.length * settings.nominalIuran)}`}
          icon={CreditCard}
          variant="blue"
        />
        <StatCard
          title={`Pemasukan ${currentMonthName}`}
          value={formatRupiah(pemasukanBulanIni)}
          subtitle="Termasuk iuran & donasi"
          icon={TrendingUp}
          variant="emerald"
        />
        <StatCard
          title={`Pengeluaran ${currentMonthName}`}
          value={formatRupiah(pengeluaranBulanIni)}
          subtitle="Operasional & rapat"
          icon={TrendingDown}
          variant="rose"
        />
        <StatCard
          title="Saldo Berjalan"
          value={formatRupiah(saldoBerjalan)}
          subtitle="Total Kas Riil Tersedia"
          icon={Wallet}
          variant="emerald"
        />
      </div>

      {/* Payment progress and statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                Statistik Iuran ({currentMonthName} {selectedYear})
              </h3>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                Tarif {formatRupiah(settings.nominalIuran)}/bln
              </span>
            </div>

            <div className="my-5 flex items-center justify-center">
              <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-8 border-slate-100 bg-slate-50">
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-slate-800">{persentaseBayar}%</span>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Lunas</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Sudah Bayar
                </span>
                <span className="font-bold text-emerald-700">
                  {jumlahSudahBayar} Anggota ({formatRupiah(jumlahSudahBayar * settings.nominalIuran)})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center text-slate-600">
                  <Clock className="w-4 h-4 text-rose-500 mr-2" />
                  Belum Bayar
                </span>
                <span className="font-bold text-rose-700">
                  {jumlahBelumBayar} Anggota ({formatRupiah(jumlahBelumBayar * settings.nominalIuran)})
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('iuran')}
              className="w-full py-2 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition text-center"
            >
              Kelola & Cetak Rekap Iuran Bulanan
            </button>
          </div>
        </div>

        {/* Financial Flow Graph / Visual Chart per Month */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Perbandingan Pemasukan & Pengeluaran ({selectedYear})
                </h3>
                <p className="text-xs text-slate-500">
                  Grafik arus kas bulanan berdasarkan data transaksi aktual
                </p>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500 mr-1.5" />
                  Pemasukan
                </span>
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-xs bg-rose-400 mr-1.5" />
                  Pengeluaran
                </span>
              </div>
            </div>

            {/* Custom SVG/Bar Chart */}
            <div className="mt-6 h-56 flex items-end justify-between gap-1 sm:gap-2 px-2 pb-6 border-b border-slate-200">
              {monthlyBreakdown.map((m, idx) => {
                const heightInPercent = maxMonthValue > 0 ? (m.masuk / maxMonthValue) * 100 : 0;
                const heightOutPercent = maxMonthValue > 0 ? (m.keluar / maxMonthValue) * 100 : 0;
                const isCurrent = idx + 1 === currentMonthIndex;

                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-12 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] p-1.5 rounded-md shadow-lg pointer-events-none z-20 whitespace-nowrap">
                      <span>{m.fullName}</span>
                      <span className="text-emerald-400">Masuk: {formatRupiah(m.masuk)}</span>
                      <span className="text-rose-400">Keluar: {formatRupiah(m.keluar)}</span>
                    </div>

                    <div className="w-full flex items-end justify-center space-x-0.5 sm:space-x-1 h-full">
                      {/* Masuk Bar */}
                      <div
                        style={{ height: `${Math.max(4, heightInPercent)}%` }}
                        className="w-1/2 bg-emerald-500 rounded-t-sm transition-all hover:bg-emerald-600"
                      />
                      {/* Keluar Bar */}
                      <div
                        style={{ height: `${Math.max(4, heightOutPercent)}%` }}
                        className="w-1/2 bg-rose-400 rounded-t-sm transition-all hover:bg-rose-500"
                      />
                    </div>
                    <span
                      className={`text-[10px] mt-2 font-medium ${
                        isCurrent ? 'text-emerald-600 font-bold underline' : 'text-slate-500'
                      }`}
                    >
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Data disinkronkan secara real-time dari Firestore</span>
            <button
              onClick={() => onNavigate('laporan-tahunan')}
              className="text-emerald-700 hover:text-emerald-900 font-semibold"
            >
              Lihat Laporan Tahunan Lengkap →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom 2 tables: Anggota Belum Bayar & 10 Transaksi Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anggota Belum Bayar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Anggota Belum Bayar ({currentMonthName} {selectedYear})
              </h3>
              <p className="text-xs text-slate-500">
                {anggotaBelumBayar.length} pengawas yang belum menyelesaikan iuran bulan ini
              </p>
            </div>
            <button
              onClick={() => onNavigate('iuran')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
            >
              Catat Pembayaran
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            {anggotaBelumBayar.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Semua anggota telah melunasi iuran bulan ini!
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 font-semibold">Nama Anggota</th>
                    <th className="pb-2 font-semibold">NIP</th>
                    <th className="pb-2 font-semibold text-right">Kewajiban</th>
                    <th className="pb-2 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {anggotaBelumBayar.slice(0, 5).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 font-medium text-slate-800">{m.nama}</td>
                      <td className="py-2.5 text-slate-500 font-mono text-[11px]">{m.nip}</td>
                      <td className="py-2.5 text-right font-bold text-slate-700">
                        {formatRupiah(settings.nominalIuran)}
                      </td>
                      <td className="py-2.5 text-center">
                        <Badge status="belum_bayar" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {anggotaBelumBayar.length > 5 && (
            <div className="mt-3 pt-2 border-t border-slate-100 text-center">
              <span className="text-[11px] text-slate-400">
                dan {anggotaBelumBayar.length - 5} anggota lainnya.
              </span>
            </div>
          )}
        </div>

        {/* 10 Transaksi Terbaru */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">10 Transaksi Kas Terbaru</h3>
              <p className="text-xs text-slate-500">Aktivitas keuangan paling mutakhir</p>
            </div>
            <button
              onClick={() => onNavigate('bukukas')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
            >
              Lihat Buku Kas
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Belum ada transaksi pada periode ini.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 font-semibold">Tgl & No</th>
                    <th className="pb-2 font-semibold">Keterangan</th>
                    <th className="pb-2 font-semibold text-right">Nominal</th>
                    <th className="pb-2 font-semibold text-center">Jenis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5">
                        <div className="font-semibold text-slate-800">{formatDateIndo(trx.tanggal)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{trx.nomor}</div>
                      </td>
                      <td className="py-2.5 max-w-[160px] truncate">
                        <span className="font-medium text-slate-800 truncate block">
                          {trx.keterangan}
                        </span>
                        <span className="text-[10px] text-slate-400">{trx.kategori}</span>
                      </td>
                      <td
                        className={`py-2.5 text-right font-bold ${
                          trx.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {trx.tipe === 'masuk' ? '+' : '-'} {formatRupiah(trx.nominal)}
                      </td>
                      <td className="py-2.5 text-center">
                        <Badge status={trx.tipe} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
