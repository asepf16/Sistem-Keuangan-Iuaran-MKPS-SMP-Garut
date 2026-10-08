import React, { useMemo } from 'react';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileSpreadsheet,
  Printer,
  CreditCard,
  Building,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatRupiah } from '../../utils/formatters';
import { exportToExcel } from '../../utils/excelExport';
import { printReport } from '../../utils/pdfExport';

export const RekapKeuangan: React.FC = () => {
  const {
    totalPemasukan,
    totalPengeluaran,
    saldoBerjalan,
    iuranList,
    pemasukanList,
    pengeluaranList,
    selectedYear,
    settings,
  } = useApp();
  const { userProfile } = useAuth();

  // Income category breakdown
  const incomeCategories = useMemo(() => {
    const map = new Map<string, number>();

    // Iuran
    const iurTotal = iuranList
      .filter((i) => i.status === 'lunas' && i.tahun === selectedYear)
      .reduce((sum, item) => sum + item.nominal, 0);
    if (iurTotal > 0) map.set('Iuran Bulanan Pengawas', iurTotal);

    // Other Incomes
    pemasukanList
      .filter((p) => {
        if (p.status !== 'aktif') return false;
        return new Date(p.tanggal).getFullYear() === selectedYear;
      })
      .forEach((p) => {
        const prev = map.get(p.kategori) || 0;
        map.set(p.kategori, prev + p.nominal);
      });

    return Array.from(map.entries()).map(([kategori, total]) => ({
      kategori,
      total,
      persentase: totalPemasukan > 0 ? Math.round((total / totalPemasukan) * 100) : 0,
    }));
  }, [iuranList, pemasukanList, selectedYear, totalPemasukan]);

  // Expense category breakdown
  const expenseCategories = useMemo(() => {
    const map = new Map<string, number>();

    pengeluaranList
      .filter((k) => {
        if (k.status !== 'aktif') return false;
        return new Date(k.tanggal).getFullYear() === selectedYear;
      })
      .forEach((k) => {
        const prev = map.get(k.kategori) || 0;
        map.set(k.kategori, prev + k.nominal);
      });

    return Array.from(map.entries()).map(([kategori, total]) => ({
      kategori,
      total,
      persentase: totalPengeluaran > 0 ? Math.round((total / totalPengeluaran) * 100) : 0,
    }));
  }, [pengeluaranList, selectedYear, totalPengeluaran]);

  const handleExportExcel = () => {
    const dataPemasukan = incomeCategories.map((c, i) => ({
      No: i + 1,
      Jenis: 'PEMASUKAN',
      Kategori: c.kategori,
      Total: c.total,
      Persentase: `${c.persentase}%`,
    }));

    const dataPengeluaran = expenseCategories.map((c, i) => ({
      No: i + 1,
      Jenis: 'PENGELUARAN',
      Kategori: c.kategori,
      Total: c.total,
      Persentase: `${c.persentase}%`,
    }));

    exportToExcel([...dataPemasukan, ...dataPengeluaran], `Rekap_Keuangan_MKPS_${selectedYear}`);
  };

  const handlePrint = () => {
    const rows = [
      ...incomeCategories.map((c, i) => [
        i + 1,
        'PEMASUKAN',
        c.kategori,
        formatRupiah(c.total),
        `${c.persentase}%`,
      ]),
      ...expenseCategories.map((c, i) => [
        i + 1,
        'PENGELUARAN',
        c.kategori,
        formatRupiah(c.total),
        `${c.persentase}%`,
      ]),
    ];

    printReport({
      title: 'REKAPITULASI KEUANGAN & KOMPOSISI ANGGARAN',
      subtitle: `Musyawarah Kerja Pengawas Sekolah (MKPS) SMP Kabupaten Garut`,
      periodText: `Tahun Anggaran ${selectedYear}`,
      settings,
      printedBy: userProfile?.nama || 'Bendahara MKPS',
      columns: ['No', 'Tipe Kas', 'Nama Pos Anggaran', 'Realisasi Nominal', 'Persentase'],
      rows,
      summaryRows: [
        { label: 'Total Pemasukan Kas', value: formatRupiah(totalPemasukan) },
        { label: 'Total Pengeluaran Kas', value: formatRupiah(totalPengeluaran) },
        { label: 'Sisa Saldo Kas Riil', value: formatRupiah(saldoBerjalan) },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Rekapitulasi Keuangan & Arus Kas</h2>
          <p className="text-xs text-slate-500">
            Perbandingan komprehensif total penerimaan, belanja, dan komposisi alokasi dana MKPS.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Rekap</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* 3 Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Pemasukan</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-700 mt-2">{formatRupiah(totalPemasukan)}</h3>
          <p className="text-xs text-slate-500 mt-1">100% dari seluruh sumber penerimaan kas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Pengeluaran</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-rose-700 mt-2">{formatRupiah(totalPengeluaran)}</h3>
          <p className="text-xs text-slate-500 mt-1">
            {totalPemasukan > 0 ? Math.round((totalPengeluaran / totalPemasukan) * 100) : 0}% dari
            penerimaan
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-teal-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Saldo Kas Berjalan</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-teal-800 mt-2">{formatRupiah(saldoBerjalan)}</h3>
          <p className="text-xs text-slate-500 mt-1">Kas bersih siap digunakan untuk kegiatan</p>
        </div>
      </div>

      {/* Visual Composition breakdown: Pemasukan vs Pengeluaran */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pemasukan breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Komposisi Sumber Pemasukan</h3>
            <span className="text-xs font-bold text-emerald-700">{formatRupiah(totalPemasukan)}</span>
          </div>

          <div className="mt-4 space-y-3">
            {incomeCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada data pemasukan</p>
            ) : (
              incomeCategories.map((item) => (
                <div key={item.kategori} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.kategori}</span>
                    <span className="font-bold text-emerald-700">
                      {formatRupiah(item.total)} ({item.persentase}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(3, item.persentase))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pengeluaran breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Komposisi Alokasi Pengeluaran</h3>
            <span className="text-xs font-bold text-rose-700">{formatRupiah(totalPengeluaran)}</span>
          </div>

          <div className="mt-4 space-y-3">
            {expenseCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada data pengeluaran</p>
            ) : (
              expenseCategories.map((item) => (
                <div key={item.kategori} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.kategori}</span>
                    <span className="font-bold text-rose-700">
                      {formatRupiah(item.total)} ({item.persentase}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(3, item.persentase))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
