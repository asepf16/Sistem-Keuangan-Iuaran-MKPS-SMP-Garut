import React, { useState, useMemo } from 'react';
import {
  Calendar,
  FileSpreadsheet,
  Printer,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  formatRupiah,
  formatDateIndo,
  BULAN_NAMES,
} from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { exportToExcel } from '../../utils/excelExport';
import { printReport } from '../../utils/pdfExport';

export const LaporanBulanan: React.FC = () => {
  const {
    anggotaList,
    iuranList,
    pemasukanList,
    pengeluaranList,
    settings,
    selectedYear,
  } = useApp();
  const { userProfile } = useAuth();

  const [selectedBulan, setSelectedBulan] = useState<number>(new Date().getMonth() + 1);

  const namaBulan = BULAN_NAMES[selectedBulan - 1];

  // Members calculation
  const targetAnggota = useMemo(() => {
    return anggotaList.filter((a) => a.status === 'aktif');
  }, [anggotaList]);

  // Dues for this specific month
  const duesThisMonth = useMemo(() => {
    return iuranList.filter(
      (i) => i.tahun === selectedYear && i.bulan === selectedBulan && i.status === 'lunas'
    );
  }, [iuranList, selectedYear, selectedBulan]);

  const paidMemberMap = useMemo(() => {
    const map = new Map<string, (typeof duesThisMonth)[0]>();
    duesThisMonth.forEach((d) => map.set(d.anggotaId, d));
    return map;
  }, [duesThisMonth]);

  const jumlahSudahBayar = duesThisMonth.length;
  const jumlahBelumBayar = Math.max(0, targetAnggota.length - jumlahSudahBayar);

  const targetIuran = targetAnggota.length * settings.nominalIuran;
  const realisasiIuran = duesThisMonth.reduce((sum, item) => sum + item.nominal, 0);

  // Other income in this month
  const pemasukanLain = useMemo(() => {
    return pemasukanList
      .filter((p) => {
        if (p.status !== 'aktif') return false;
        const d = new Date(p.tanggal);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedBulan;
      })
      .reduce((sum, item) => sum + item.nominal, 0);
  }, [pemasukanList, selectedYear, selectedBulan]);

  const totalPemasukanBulan = realisasiIuran + pemasukanLain;

  // Expense in this month
  const totalPengeluaranBulan = useMemo(() => {
    return pengeluaranList
      .filter((k) => {
        if (k.status !== 'aktif') return false;
        const d = new Date(k.tanggal);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedBulan;
      })
      .reduce((sum, item) => sum + item.nominal, 0);
  }, [pengeluaranList, selectedYear, selectedBulan]);

  const selisihBulan = totalPemasukanBulan - totalPengeluaranBulan;

  // Member Rows
  const memberReportRows = useMemo(() => {
    return targetAnggota.map((m) => {
      const payment = paidMemberMap.get(m.id);
      return {
        id: m.id,
        nama: m.nama,
        nip: m.nip,
        nominal: payment ? payment.nominal : settings.nominalIuran,
        status: payment ? ('lunas' as const) : ('belum_bayar' as const),
        tanggalBayar: payment ? payment.tanggalBayar : null,
        nomorTransaksi: payment ? payment.nomorTransaksi : null,
      };
    });
  }, [targetAnggota, paidMemberMap, settings.nominalIuran]);

  const handleExportExcel = () => {
    const data = memberReportRows.map((m, idx) => ({
      No: idx + 1,
      Nama: m.nama,
      NIP: m.nip,
      'Bulan / Tahun': `${namaBulan} ${selectedYear}`,
      Nominal: m.nominal,
      Status: m.status === 'lunas' ? 'LUNAS' : 'BELUM BAYAR',
      'Tanggal Bayar': m.tanggalBayar ? formatDateIndo(m.tanggalBayar) : '-',
      'No Transaksi': m.nomorTransaksi || '-',
    }));

    exportToExcel(data, `Laporan_Bulanan_${namaBulan}_${selectedYear}`);
  };

  const handlePrint = () => {
    const rows = memberReportRows.map((m, idx) => [
      idx + 1,
      m.nama,
      m.nip,
      formatRupiah(m.nominal),
      m.status === 'lunas' ? 'LUNAS' : 'BELUM BAYAR',
      m.tanggalBayar ? formatDateIndo(m.tanggalBayar) : '-',
      m.nomorTransaksi || '-',
    ]);

    printReport({
      title: 'LAPORAN REKAP KEUANGAN & IURAN BULANAN',
      subtitle: `Musyawarah Kerja Pengawas Sekolah (MKPS) SMP Kabupaten Garut`,
      periodText: `${namaBulan} ${selectedYear}`,
      settings,
      printedBy: userProfile?.nama || 'Bendahara MKPS',
      columns: ['No', 'Nama Pengawas', 'NIP', 'Nominal', 'Status', 'Tgl Bayar', 'No Trx'],
      rows,
      summaryRows: [
        { label: 'Target Iuran Anggota', value: formatRupiah(targetIuran) },
        { label: 'Realisasi Iuran Terkumpul', value: formatRupiah(realisasiIuran) },
        { label: 'Penerimaan Kas Lainnya', value: formatRupiah(pemasukanLain) },
        { label: 'Total Penerimaan Kas', value: formatRupiah(totalPemasukanBulan) },
        { label: 'Total Pengeluaran Kas', value: formatRupiah(totalPengeluaranBulan) },
        { label: 'Surplus / Defisit Kas Bulan Ini', value: formatRupiah(selisihBulan) },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Laporan Keuangan Keseluruhan Bulanan</h2>
          <p className="text-xs text-slate-500">
            Rekap target versus realisasi iuran anggota serta mutasi kas untuk bulan yang dipilih.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Laporan</span>
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

      {/* Month Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <label className="text-xs font-bold text-slate-700 shrink-0">Pilih Bulan Laporan:</label>
        <select
          value={selectedBulan}
          onChange={(e) => setSelectedBulan(Number(e.target.value))}
          className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
        >
          {BULAN_NAMES.map((name, idx) => (
            <option key={name} value={idx + 1}>
              {name} ({selectedYear})
            </option>
          ))}
        </select>
      </div>

      {/* 4 Cards Summary as specified in Section Y */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Partisipasi Anggota</span>
          <p className="text-lg font-bold text-slate-800 mt-1">
            {jumlahSudahBayar} / {targetAnggota.length} Lunas
          </p>
          <p className="text-[11px] text-rose-600 font-medium">{jumlahBelumBayar} Belum Membayar</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Realisasi Iuran</span>
          <p className="text-lg font-bold text-emerald-700 mt-1">{formatRupiah(realisasiIuran)}</p>
          <p className="text-[11px] text-slate-500">Target: {formatRupiah(targetIuran)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase">Total Pemasukan Kas</span>
          <p className="text-lg font-bold text-blue-700 mt-1">{formatRupiah(totalPemasukanBulan)}</p>
          <p className="text-[11px] text-slate-500">Iuran + Lainnya ({formatRupiah(pemasukanLain)})</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-rose-600 uppercase">Total Pengeluaran Kas</span>
          <p className="text-lg font-bold text-rose-700 mt-1">{formatRupiah(totalPengeluaranBulan)}</p>
          <p className={`text-[11px] font-bold ${selisihBulan >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            Surplus/Defisit: {formatRupiah(selisihBulan)}
          </p>
        </div>
      </div>

      {/* Member Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Daftar Status Iuran Seluruh Anggota ({namaBulan} {selectedYear})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Tarif: {formatRupiah(settings.nominalIuran)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-bold text-center w-12">No</th>
                <th className="py-3 px-4 font-bold">Nama Pengawas</th>
                <th className="py-3 px-4 font-bold">NIP</th>
                <th className="py-3 px-4 font-bold text-right">Nominal</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
                <th className="py-3 px-4 font-bold">Tanggal Bayar</th>
                <th className="py-3 px-4 font-bold">No Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {memberReportRows.map((m, idx) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{m.nama}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{m.nip}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800">
                    {formatRupiah(m.nominal)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge status={m.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {m.tanggalBayar ? formatDateIndo(m.tanggalBayar) : '-'}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {m.nomorTransaksi || '-'}
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
