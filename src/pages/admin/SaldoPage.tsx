import React, { useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  CreditCard,
  Building,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { formatRupiah, BULAN_NAMES } from '../../utils/formatters';

export const SaldoPage: React.FC = () => {
  const {
    iuranList,
    pemasukanList,
    pengeluaranList,
    saldoBerjalan,
    totalPemasukan,
    totalPengeluaran,
    selectedYear,
    settings,
  } = useApp();

  // Breakdown pemasukan
  const totalIuranLunas = useMemo(() => {
    return iuranList
      .filter((i) => i.status === 'lunas')
      .reduce((sum, item) => sum + item.nominal, 0);
  }, [iuranList]);

  const totalPemasukanLain = useMemo(() => {
    return pemasukanList
      .filter((p) => p.status === 'aktif')
      .reduce((sum, item) => sum + item.nominal, 0);
  }, [pemasukanList]);

  // Monthly balance trend for the selected year
  const monthlyBalanceTrend = useMemo(() => {
    let runningCumulative = 0;
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

      const netMonth = iur + mas - kel;
      runningCumulative += netMonth;

      return {
        month: name,
        short: name.slice(0, 3),
        masuk: iur + mas,
        keluar: kel,
        net: netMonth,
        saldoAkhirBulan: runningCumulative,
      };
    });
  }, [selectedYear, iuranList, pemasukanList, pengeluaranList]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wide border border-emerald-500/30">
          Akuntansi & Saldo Riil
        </span>
        <h1 className="text-2xl font-extrabold mt-2">Saldo Berjalan Kas MKPS</h1>
        <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl">
          Saldo dihitung murni secara matematis dari agregasi transaksi kas valid (Pemasukan + Iuran Lunas - Pengeluaran Aktif). Tidak ada saldo manual yang dapat dimanipulasi.
        </p>
        <div className="mt-6 pt-5 border-t border-emerald-800/60 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
              Posisi Kas Riil Saat Ini
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              {formatRupiah(saldoBerjalan)}
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-950/60 px-4 py-2.5 rounded-xl border border-emerald-700/50">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs text-emerald-200 font-medium">
              Data Terverifikasi & Konsisten
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Penerimaan Iuran</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-blue-700">{formatRupiah(totalIuranLunas)}</h3>
          <p className="text-xs text-slate-500">
            Akumulasi iuran bulanan dari seluruh anggota yang berstatus lunas.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Pemasukan Lain</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-700">{formatRupiah(totalPemasukanLain)}</h3>
          <p className="text-xs text-slate-500">
            Donasi, saldo awal tahun sebelumnya, bunga bank, dan pendapatan kegiatan.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Pengeluaran</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-rose-700">{formatRupiah(totalPengeluaran)}</h3>
          <p className="text-xs text-slate-500">
            Realisasi belanja operasional, konsumsi rapat, ATK, dan keperluan dinas.
          </p>
        </div>
      </div>

      {/* Saldo Formula & Verification Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-2">
          Rekonsiliasi & Formula Saldo Berjalan (Tahun {selectedYear})
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Sesuai aturan akuntansi organisasi nirlaba dan prinsip konsistensi saldo Section AP.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-bold">Bulan</th>
                <th className="py-3 px-4 font-bold text-right">Pemasukan (Rp)</th>
                <th className="py-3 px-4 font-bold text-right">Pengeluaran (Rp)</th>
                <th className="py-3 px-4 font-bold text-right">Surplus / Defisit (Rp)</th>
                <th className="py-3 px-4 font-bold text-right bg-slate-100/60">Saldo Kumulatif (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyBalanceTrend.map((m) => (
                <tr key={m.month} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-semibold text-slate-800">{m.month}</td>
                  <td className="py-3 px-4 text-right font-medium text-emerald-600">
                    {formatRupiah(m.masuk)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-rose-600">
                    {formatRupiah(m.keluar)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-bold ${
                      m.net >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {m.net >= 0 ? '+' : ''} {formatRupiah(m.net)}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-900 bg-slate-50/40">
                    {formatRupiah(m.saldoAkhirBulan)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
