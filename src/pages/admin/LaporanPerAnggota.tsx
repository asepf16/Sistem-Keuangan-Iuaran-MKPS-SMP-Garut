import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  FileSpreadsheet,
  Printer,
  Calendar,
  CheckCircle,
  Clock,
  User,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatRupiah, formatDateIndo, BULAN_NAMES } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { exportToExcel } from '../../utils/excelExport';
import { printReport } from '../../utils/pdfExport';

export const LaporanPerAnggota: React.FC = () => {
  const { anggotaList, iuranList, settings, selectedYear } = useApp();
  const { userProfile } = useAuth();

  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    anggotaList.find((a) => a.status === 'aktif')?.id || ''
  );

  const selectedMember = useMemo(() => {
    return anggotaList.find((a) => a.id === selectedMemberId);
  }, [anggotaList, selectedMemberId]);

  // Payment status for 12 months in the selected year
  const monthlyStatus = useMemo(() => {
    if (!selectedMember) return [];

    return BULAN_NAMES.map((name, idx) => {
      const monthNum = idx + 1;
      const payment = iuranList.find(
        (i) =>
          i.anggotaId === selectedMember.id &&
          i.tahun === selectedYear &&
          i.bulan === monthNum &&
          i.status === 'lunas'
      );

      const kewajiban = settings.nominalIuran;
      const nominalDibayar = payment ? payment.nominal : 0;
      const isLunas = !!payment;

      return {
        bulan: name,
        bulanIndex: monthNum,
        tahun: selectedYear,
        kewajiban,
        nominalDibayar,
        tanggalBayar: payment ? payment.tanggalBayar : null,
        nomorTransaksi: payment ? payment.nomorTransaksi : null,
        status: isLunas ? ('lunas' as const) : ('belum_bayar' as const),
      };
    });
  }, [selectedMember, iuranList, selectedYear, settings.nominalIuran]);

  const totalKewajiban = monthlyStatus.reduce((sum, item) => sum + item.kewajiban, 0);
  const totalDibayar = monthlyStatus.reduce((sum, item) => sum + item.nominalDibayar, 0);
  const totalBelumDibayar = Math.max(0, totalKewajiban - totalDibayar);
  const bulanLunasCount = monthlyStatus.filter((item) => item.status === 'lunas').length;
  const bulanBelumLunasCount = 12 - bulanLunasCount;

  const handleExportExcel = () => {
    if (!selectedMember) return;
    const data = monthlyStatus.map((m, idx) => ({
      No: idx + 1,
      Bulan: m.bulan,
      Tahun: m.tahun,
      'Kewajiban Iuran': m.kewajiban,
      'Pembayaran Realisasi': m.nominalDibayar,
      'Tanggal Bayar': m.tanggalBayar ? formatDateIndo(m.tanggalBayar) : '-',
      'No Transaksi': m.nomorTransaksi || '-',
      Status: m.status === 'lunas' ? 'LUNAS' : 'BELUM BAYAR',
    }));

    exportToExcel(
      data,
      `Laporan_Iuran_${selectedMember.nama.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedYear}`
    );
  };

  const handlePrint = () => {
    if (!selectedMember) return;

    const rows = monthlyStatus.map((m, idx) => [
      idx + 1,
      m.bulan,
      m.tahun,
      formatRupiah(m.kewajiban),
      m.nominalDibayar > 0 ? formatRupiah(m.nominalDibayar) : '-',
      m.tanggalBayar ? formatDateIndo(m.tanggalBayar) : '-',
      m.nomorTransaksi || '-',
      m.status === 'lunas' ? 'LUNAS' : 'BELUM BAYAR',
    ]);

    printReport({
      title: 'LAPORAN REKAP PEMBAYARAN IURAN INDIVIDUAL',
      subtitle: `Nama: ${selectedMember.nama} | NIP: ${selectedMember.nip}`,
      periodText: `Tahun Anggaran ${selectedYear}`,
      settings,
      printedBy: userProfile?.nama || 'Bendahara MKPS',
      columns: ['No', 'Bulan', 'Tahun', 'Kewajiban', 'Realisasi', 'Tgl Bayar', 'No Trx', 'Status'],
      rows,
      summaryRows: [
        { label: 'Total Kewajiban (12 Bulan)', value: formatRupiah(totalKewajiban) },
        { label: 'Total Telah Dibayar', value: formatRupiah(totalDibayar) },
        { label: 'Sisa Tunggakan Belum Dibayar', value: formatRupiah(totalBelumDibayar) },
        { label: 'Status Lunas', value: `${bulanLunasCount} dari 12 Bulan` },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Laporan Iuran Per Anggota</h2>
          <p className="text-xs text-slate-500">
            Rekap histori dan status pemenuhan kewajiban iuran per masing-masing pengawas sekolah.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            disabled={!selectedMember}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Rekap</span>
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!selectedMember}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Member Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <label className="block text-xs font-bold text-slate-700 mb-2">
          Pilih Pengawas / Anggota MKPS:
        </label>
        <select
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          className="w-full sm:max-w-md px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
        >
          <option value="">-- Pilih Anggota --</option>
          {anggotaList.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nama} (NIP: {a.nip}) - Status: {a.status}
            </option>
          ))}
        </select>
      </div>

      {selectedMember && (
        <>
          {/* Member Profile and KPI Strip */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Identitas Anggota</span>
              <p className="text-sm font-bold text-slate-800 mt-1 truncate">{selectedMember.nama}</p>
              <p className="text-xs text-slate-500 font-mono">NIP. {selectedMember.nip}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Kewajiban</span>
              <p className="text-lg font-bold text-slate-800 mt-1">{formatRupiah(totalKewajiban)}</p>
              <p className="text-[11px] text-slate-500">12 Bulan x {formatRupiah(settings.nominalIuran)}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Dibayar</span>
              <p className="text-lg font-bold text-emerald-700 mt-1">{formatRupiah(totalDibayar)}</p>
              <p className="text-[11px] text-emerald-600 font-medium">{bulanLunasCount} Bulan Lunas</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-rose-500 uppercase">Sisa Belum Dibayar</span>
              <p className="text-lg font-bold text-rose-700 mt-1">{formatRupiah(totalBelumDibayar)}</p>
              <p className="text-[11px] text-rose-600 font-medium">{bulanBelumLunasCount} Bulan Tertunggak</p>
            </div>
          </div>

          {/* Table 12 Bulan */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                Rincian Kewajiban & Pembayaran ({selectedYear})
              </h3>
              <Badge status={selectedMember.status} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-3 px-4 font-bold text-center w-12">No</th>
                    <th className="py-3 px-4 font-bold">Bulan</th>
                    <th className="py-3 px-4 font-bold text-right">Kewajiban (Rp)</th>
                    <th className="py-3 px-4 font-bold text-right">Realisasi (Rp)</th>
                    <th className="py-3 px-4 font-bold">Tanggal Bayar</th>
                    <th className="py-3 px-4 font-bold">No Transaksi</th>
                    <th className="py-3 px-4 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyStatus.map((m, idx) => (
                    <tr key={m.bulan} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{m.bulan}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(m.kewajiban)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {m.nominalDibayar > 0 ? formatRupiah(m.nominalDibayar) : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {m.tanggalBayar ? formatDateIndo(m.tanggalBayar) : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {m.nomorTransaksi || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={m.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
