import React, { useMemo } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatRupiah, BULAN_NAMES } from '../../utils/formatters';
import { exportToExcel } from '../../utils/excelExport';
import { printReport } from '../../utils/pdfExport';

export const LaporanTahunan: React.FC = () => {
  const {
    anggotaList,
    iuranList,
    pemasukanList,
    pengeluaranList,
    settings,
    selectedYear,
    setSelectedYear,
  } = useApp();
  const { userProfile } = useAuth();

  const targetAnggotaAktif = anggotaList.filter((a) => a.status === 'aktif');
  const targetPerBulan = targetAnggotaAktif.length * settings.nominalIuran;

  // 12 Months row breakdown
  const yearlyRows = useMemo(() => {
    let runningCumulativeBalance = 0;

    return BULAN_NAMES.map((name, idx) => {
      const monthNum = idx + 1;

      // Realisasi iuran
      const realisasiIur = iuranList
        .filter((i) => i.tahun === selectedYear && i.bulan === monthNum && i.status === 'lunas')
        .reduce((sum, item) => sum + item.nominal, 0);

      // Pemasukan lain
      const masLain = pemasukanList
        .filter((p) => {
          if (p.status !== 'aktif') return false;
          const d = new Date(p.tanggal);
          return d.getFullYear() === selectedYear && d.getMonth() + 1 === monthNum;
        })
        .reduce((sum, item) => sum + item.nominal, 0);

      const totalPemasukan = realisasiIur + masLain;

      // Pengeluaran
      const pengeluaranBulan = pengeluaranList
        .filter((k) => {
          if (k.status !== 'aktif') return false;
          const d = new Date(k.tanggal);
          return d.getFullYear() === selectedYear && d.getMonth() + 1 === monthNum;
        })
        .reduce((sum, item) => sum + item.nominal, 0);

      const netMonth = totalPemasukan - pengeluaranBulan;
      runningCumulativeBalance += netMonth;

      return {
        bulan: name,
        bulanIndex: monthNum,
        targetIuran: targetPerBulan,
        realisasiIuran: realisasiIur,
        pemasukanLain: masLain,
        totalPemasukan,
        pengeluaran: pengeluaranBulan,
        saldoBulan: netMonth,
        saldoKumulatif: runningCumulativeBalance,
      };
    });
  }, [selectedYear, iuranList, pemasukanList, pengeluaranList, targetPerBulan]);

  // Grand Totals for the Year
  const grandTargetIuran = targetPerBulan * 12;
  const grandRealisasiIuran = yearlyRows.reduce((sum, r) => sum + r.realisasiIuran, 0);
  const grandPemasukanLain = yearlyRows.reduce((sum, r) => sum + r.pemasukanLain, 0);
  const grandTotalPemasukan = yearlyRows.reduce((sum, r) => sum + r.totalPemasukan, 0);
  const grandTotalPengeluaran = yearlyRows.reduce((sum, r) => sum + r.pengeluaran, 0);
  const grandSaldoTahun = grandTotalPemasukan - grandTotalPengeluaran;

  const handleExportExcel = () => {
    const data = yearlyRows.map((r, idx) => ({
      No: idx + 1,
      Bulan: r.bulan,
      'Target Iuran': r.targetIuran,
      'Realisasi Iuran': r.realisasiIuran,
      'Pemasukan Lain': r.pemasukanLain,
      'Total Pemasukan': r.totalPemasukan,
      'Pengeluaran Kas': r.pengeluaran,
      'Surplus / Defisit': r.saldoBulan,
      'Saldo Kumulatif': r.saldoKumulatif,
    }));

    exportToExcel(data, `Laporan_Tahunan_MKPS_${selectedYear}`);
  };

  const handlePrint = () => {
    const rows = yearlyRows.map((r, idx) => [
      idx + 1,
      r.bulan,
      formatRupiah(r.targetIuran),
      formatRupiah(r.realisasiIuran),
      formatRupiah(r.pemasukanLain),
      formatRupiah(r.totalPemasukan),
      formatRupiah(r.pengeluaran),
      formatRupiah(r.saldoKumulatif),
    ]);

    printReport({
      title: 'LAPORAN REKAPITULASI KEUANGAN TAHUNAN MKPS',
      subtitle: `Musyawarah Kerja Pengawas Sekolah (MKPS) SMP Kabupaten Garut`,
      periodText: `Tahun Anggaran ${selectedYear}`,
      settings,
      printedBy: userProfile?.nama || 'Bendahara MKPS',
      columns: [
        'No',
        'Bulan',
        'Target Iuran',
        'Realisasi Iuran',
        'Pemasukan Lain',
        'Total Masuk',
        'Pengeluaran',
        'Saldo Kumulatif',
      ],
      rows,
      summaryRows: [
        { label: 'Total Realisasi Iuran 1 Tahun', value: formatRupiah(grandRealisasiIuran) },
        { label: 'Total Penerimaan Kas Lainnya', value: formatRupiah(grandPemasukanLain) },
        { label: 'Grand Total Pemasukan Kas', value: formatRupiah(grandTotalPemasukan) },
        { label: 'Grand Total Pengeluaran Kas', value: formatRupiah(grandTotalPengeluaran) },
        { label: 'Sisa Saldo Kas Tahun Berjalan', value: formatRupiah(grandSaldoTahun) },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Laporan Keuangan Tahunan</h2>
          <p className="text-xs text-slate-500">
            Kompilasi arus kas 12 bulan dari Januari hingga Desember pada tahun anggaran yang dipilih.
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

      {/* KPI 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Target Iuran 1 Tahun</span>
          <p className="text-lg font-bold text-slate-800 mt-1">{formatRupiah(grandTargetIuran)}</p>
          <p className="text-[11px] text-slate-500">
            {targetAnggotaAktif.length} Anggota x 12 Bulan
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Realisasi Iuran</span>
          <p className="text-lg font-bold text-emerald-700 mt-1">{formatRupiah(grandRealisasiIuran)}</p>
          <p className="text-[11px] text-emerald-600 font-medium">
            {grandTargetIuran > 0
              ? Math.round((grandRealisasiIuran / grandTargetIuran) * 100)
              : 0}
            % Terkumpul
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase">Grand Total Pemasukan</span>
          <p className="text-lg font-bold text-blue-700 mt-1">{formatRupiah(grandTotalPemasukan)}</p>
          <p className="text-[11px] text-slate-500">Iuran + Penerimaan Lain</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-rose-600 uppercase">Grand Total Pengeluaran</span>
          <p className="text-lg font-bold text-rose-700 mt-1">{formatRupiah(grandTotalPengeluaran)}</p>
          <p className="text-[11px] font-bold text-slate-700">Saldo: {formatRupiah(grandSaldoTahun)}</p>
        </div>
      </div>

      {/* Yearly Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Tabel Rekapitulasi Arus Kas 12 Bulan ({selectedYear})
          </h3>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            MKPS SMP Kabupaten Garut
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-bold text-center w-12">No</th>
                <th className="py-3 px-4 font-bold">Bulan</th>
                <th className="py-3 px-4 font-bold text-right">Target Iuran</th>
                <th className="py-3 px-4 font-bold text-right text-emerald-700">Realisasi Iuran</th>
                <th className="py-3 px-4 font-bold text-right text-teal-700">Pemasukan Lain</th>
                <th className="py-3 px-4 font-bold text-right text-blue-700">Total Masuk</th>
                <th className="py-3 px-4 font-bold text-right text-rose-700">Pengeluaran</th>
                <th className="py-3 px-4 font-bold text-right bg-slate-100/60 text-slate-900">
                  Saldo Kumulatif
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {yearlyRows.map((r, idx) => (
                <tr key={r.bulan} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{r.bulan}</td>
                  <td className="py-3 px-4 text-right text-slate-500">{formatRupiah(r.targetIuran)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                    {formatRupiah(r.realisasiIuran)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-teal-700">
                    {formatRupiah(r.pemasukanLain)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-blue-700">
                    {formatRupiah(r.totalPemasukan)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-rose-600">
                    {formatRupiah(r.pengeluaran)}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-900 bg-slate-50/40">
                    {formatRupiah(r.saldoKumulatif)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td colSpan={2} className="py-3 px-4 text-center uppercase">
                  Total {selectedYear}
                </td>
                <td className="py-3 px-4 text-right">{formatRupiah(grandTargetIuran)}</td>
                <td className="py-3 px-4 text-right text-emerald-700">
                  {formatRupiah(grandRealisasiIuran)}
                </td>
                <td className="py-3 px-4 text-right text-teal-700">
                  {formatRupiah(grandPemasukanLain)}
                </td>
                <td className="py-3 px-4 text-right text-blue-800">
                  {formatRupiah(grandTotalPemasukan)}
                </td>
                <td className="py-3 px-4 text-right text-rose-700">
                  {formatRupiah(grandTotalPengeluaran)}
                </td>
                <td className="py-3 px-4 text-right text-slate-950 bg-slate-200/80">
                  {formatRupiah(grandSaldoTahun)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
