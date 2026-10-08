import React, { useMemo } from 'react';
import { FileText, Printer, FileSpreadsheet, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { formatRupiah, formatDateIndo, BULAN_NAMES } from '../../utils/formatters';
import { exportToExcel } from '../../utils/excelExport';
import { printReport } from '../../utils/pdfExport';
import { Badge } from '../../components/common/Badge';

export const AnggotaLaporan: React.FC = () => {
  const { anggotaProfile, userProfile } = useAuth();
  const { iuranList, settings, selectedYear } = useApp();

  const monthlyReport = useMemo(() => {
    if (!anggotaProfile) return [];

    return BULAN_NAMES.map((name, idx) => {
      const monthNum = idx + 1;
      const payment = iuranList.find(
        (i) =>
          i.anggotaId === anggotaProfile.id &&
          i.tahun === selectedYear &&
          i.bulan === monthNum &&
          i.status === 'lunas'
      );

      return {
        bulan: name,
        bulanIndex: monthNum,
        tahun: selectedYear,
        kewajiban: settings.nominalIuran,
        nominal: payment ? payment.nominal : 0,
        tanggalBayar: payment ? payment.tanggalBayar : null,
        nomorTransaksi: payment ? payment.nomorTransaksi : null,
        status: payment ? ('lunas' as const) : ('belum_bayar' as const),
      };
    });
  }, [anggotaProfile, iuranList, selectedYear, settings.nominalIuran]);

  const totalKewajiban = monthlyReport.reduce((sum, item) => sum + item.kewajiban, 0);
  const totalDibayar = monthlyReport.reduce((sum, item) => sum + item.nominal, 0);
  const totalBelumDibayar = Math.max(0, totalKewajiban - totalDibayar);
  const bulanLunasCount = monthlyReport.filter((m) => m.status === 'lunas').length;

  const handleExportExcel = () => {
    if (!anggotaProfile) return;
    const data = monthlyReport.map((m, idx) => ({
      No: idx + 1,
      Bulan: m.bulan,
      Tahun: m.tahun,
      'Kewajiban Iuran': m.kewajiban,
      'Pembayaran Realisasi': m.nominal,
      'Tanggal Bayar': m.tanggalBayar ? formatDateIndo(m.tanggalBayar) : '-',
      'No Transaksi': m.nomorTransaksi || '-',
      Status: m.status === 'lunas' ? 'LUNAS' : 'BELUM BAYAR',
    }));

    exportToExcel(
      data,
      `Kuitansi_Laporan_${anggotaProfile.nama.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedYear}`
    );
  };

  const handlePrint = () => {
    if (!anggotaProfile) return;

    const rows = monthlyReport.map((m, idx) => [
      idx + 1,
      m.bulan,
      m.tahun,
      formatRupiah(m.kewajiban),
      m.nominal > 0 ? formatRupiah(m.nominal) : '-',
      m.tanggalBayar ? formatDateIndo(m.tanggalBayar) : '-',
      m.nomorTransaksi || '-',
      m.status === 'lunas' ? 'LUNAS' : 'BELUM BAYAR',
    ]);

    printReport({
      title: 'BUKTI REKAPITULASI IURAN ANGGOTA PENGAWAS',
      subtitle: `Nama: ${anggotaProfile.nama} | NIP: ${anggotaProfile.nip}`,
      periodText: `Tahun Anggaran ${selectedYear}`,
      settings,
      printedBy: anggotaProfile.nama,
      columns: ['No', 'Bulan', 'Tahun', 'Kewajiban', 'Realisasi', 'Tgl Bayar', 'No Kuitansi', 'Status'],
      rows,
      summaryRows: [
        { label: 'Total Kewajiban (12 Bulan)', value: formatRupiah(totalKewajiban) },
        { label: 'Total Telah Dilunasi', value: formatRupiah(totalDibayar) },
        { label: 'Sisa Belum Dibayar', value: formatRupiah(totalBelumDibayar) },
        { label: 'Status Lunas', value: `${bulanLunasCount} dari 12 Bulan` },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Laporan & Kuitansi Saya</h2>
          <p className="text-xs text-slate-500">
            Cetak bukti sah pembayaran iuran resmi MKPS SMP Kabupaten Garut untuk keperluan arsip pribadi.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Bukti Sah</span>
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Kewajiban 1 Tahun</span>
          <p className="text-lg font-bold text-slate-800 mt-1">{formatRupiah(totalKewajiban)}</p>
          <p className="text-[11px] text-slate-500">12 Bulan x {formatRupiah(settings.nominalIuran)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Telah Dibayar</span>
          <p className="text-lg font-bold text-emerald-700 mt-1">{formatRupiah(totalDibayar)}</p>
          <p className="text-[11px] text-emerald-600 font-medium">{bulanLunasCount} Bulan Lunas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-rose-500 uppercase">Sisa Tunggakan</span>
          <p className="text-lg font-bold text-rose-700 mt-1">{formatRupiah(totalBelumDibayar)}</p>
          <p className="text-[11px] text-rose-600 font-medium">{12 - bulanLunasCount} Bulan Belum Bayar</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Rekap Pembayaran Iuran ({selectedYear})
          </h3>
          <span className="text-xs text-slate-500 font-mono font-bold">
            {anggotaProfile?.nama} ({anggotaProfile?.nip})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-bold text-center w-12">No</th>
                <th className="py-3 px-4 font-bold">Bulan</th>
                <th className="py-3 px-4 font-bold text-right">Kewajiban</th>
                <th className="py-3 px-4 font-bold text-right">Realisasi</th>
                <th className="py-3 px-4 font-bold">Tanggal Bayar</th>
                <th className="py-3 px-4 font-bold">No Kuitansi</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyReport.map((m, idx) => (
                <tr key={m.bulan} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{m.bulan}</td>
                  <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(m.kewajiban)}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">
                    {m.nominal > 0 ? formatRupiah(m.nominal) : '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {m.tanggalBayar ? formatDateIndo(m.tanggalBayar) : '-'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{m.nomorTransaksi || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge status={m.status} />
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
