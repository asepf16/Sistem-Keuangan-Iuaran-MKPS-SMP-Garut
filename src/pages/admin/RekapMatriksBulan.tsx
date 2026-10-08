import React, { useState, useMemo } from 'react';
import {
  CalendarRange,
  Users,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  CreditCard,
  PlusCircle,
  X,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Table as TableIcon,
  ListFilter,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  formatRupiah,
  formatDateIndo,
  BULAN_NAMES,
  BULAN_SHORT,
  getTodayDateString,
} from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { exportToExcel } from '../../utils/excelExport';
import { printReport } from '../../utils/pdfExport';

export const RekapMatriksBulan: React.FC = () => {
  const {
    anggotaList,
    iuranList,
    settings,
    selectedYear,
    setSelectedYear,
    catatIuran,
  } = useApp();
  const { userProfile } = useAuth();

  // Mode: 'matriks' | 'per_bulan'
  const [viewMode, setViewMode] = useState<'matriks' | 'per_bulan'>('matriks');
  const [selectedMonthTab, setSelectedMonthTab] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompliance, setFilterCompliance] = useState<'all' | 'tunggakan' | 'lunas_penuh'>('all');

  // Quick Pay Modal from "Belum Bayar" list
  const [quickPayMember, setQuickPayMember] = useState<{
    anggotaId: string;
    nama: string;
    nip: string;
    bulan: number;
    tahun: number;
  } | null>(null);

  const [formNominal, setFormNominal] = useState<number>(settings.nominalIuran || 100000);
  const [formTanggalBayar, setFormTanggalBayar] = useState(getTodayDateString());
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const activeMembers = useMemo(() => {
    return anggotaList.filter((a) => a.status === 'aktif');
  }, [anggotaList]);

  // Lookup map: `${anggotaId}-${tahun}-${bulan}` => Iuran object
  const duesMap = useMemo(() => {
    const map = new Map<string, (typeof iuranList)[0]>();
    for (const item of iuranList) {
      if (item.status === 'lunas') {
        map.set(`${item.anggotaId}-${item.tahun}-${item.bulan}`, item);
      }
    }
    return map;
  }, [iuranList]);

  // Matrix data for each member across 12 months
  const matrixData = useMemo(() => {
    return activeMembers.map((member) => {
      const months = BULAN_SHORT.map((short, idx) => {
        const monthNum = idx + 1;
        const record = duesMap.get(`${member.id}-${selectedYear}-${monthNum}`);
        return {
          monthNum,
          short,
          full: BULAN_NAMES[idx],
          isPaid: !!record,
          nominal: record ? record.nominal : 0,
          tanggalBayar: record ? record.tanggalBayar : null,
          nomorTransaksi: record ? record.nomorTransaksi : null,
        };
      });

      const lunasCount = months.filter((m) => m.isPaid).length;
      const belumLunasCount = 12 - lunasCount;
      const totalPaid = months.reduce((sum, m) => sum + m.nominal, 0);
      const totalKewajiban = 12 * settings.nominalIuran;
      const sisaTunggakan = Math.max(0, totalKewajiban - totalPaid);

      return {
        member,
        months,
        lunasCount,
        belumLunasCount,
        totalPaid,
        totalKewajiban,
        sisaTunggakan,
        isFullyPaid: lunasCount === 12,
        hasArrears: belumLunasCount > 0,
      };
    });
  }, [activeMembers, duesMap, selectedYear, settings.nominalIuran]);

  // Filtered Matrix Data
  const filteredMatrix = useMemo(() => {
    return matrixData.filter((row) => {
      const matchSearch =
        row.member.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.member.nip.includes(searchTerm);

      let matchCompliance = true;
      if (filterCompliance === 'tunggakan') matchCompliance = row.hasArrears;
      if (filterCompliance === 'lunas_penuh') matchCompliance = row.isFullyPaid;

      return matchSearch && matchCompliance;
    });
  }, [matrixData, searchTerm, filterCompliance]);

  // Month Detail: Paid vs Unpaid for selectedMonthTab
  const monthDetailData = useMemo(() => {
    const paidList: Array<{
      member: (typeof activeMembers)[0];
      record: (typeof iuranList)[0];
    }> = [];

    const unpaidList: Array<{
      member: (typeof activeMembers)[0];
      kewajiban: number;
    }> = [];

    for (const member of activeMembers) {
      const record = duesMap.get(`${member.id}-${selectedYear}-${selectedMonthTab}`);
      if (record) {
        paidList.push({ member, record });
      } else {
        unpaidList.push({ member, kewajiban: settings.nominalIuran });
      }
    }

    return { paidList, unpaidList };
  }, [activeMembers, duesMap, selectedYear, selectedMonthTab, settings.nominalIuran]);

  // Grand KPIs for the year
  const totalTargetYear = activeMembers.length * 12 * settings.nominalIuran;
  const totalRealisasiYear = matrixData.reduce((sum, row) => sum + row.totalPaid, 0);
  const totalTunggakanYear = Math.max(0, totalTargetYear - totalRealisasiYear);
  const fullyPaidMemberCount = matrixData.filter((row) => row.isFullyPaid).length;

  const handleOpenQuickPay = (member: (typeof activeMembers)[0], bulan: number) => {
    setQuickPayMember({
      anggotaId: member.id,
      nama: member.nama,
      nip: member.nip,
      bulan,
      tahun: selectedYear,
    });
    setFormNominal(settings.nominalIuran || 100000);
    setFormTanggalBayar(getTodayDateString());
    setFormKeterangan('');
    setFormError('');
  };

  const handleSaveQuickPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayMember) return;

    setFormSubmitting(true);
    try {
      await catatIuran({
        anggotaId: quickPayMember.anggotaId,
        namaAnggota: quickPayMember.nama,
        nip: quickPayMember.nip,
        bulan: quickPayMember.bulan,
        tahun: quickPayMember.tahun,
        nominal: formNominal,
        tanggalBayar: formTanggalBayar,
        keterangan: formKeterangan.trim(),
      });
      setQuickPayMember(null);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan pembayaran');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    const data = filteredMatrix.map((row, idx) => {
      const rowObj: Record<string, any> = {
        No: idx + 1,
        'Nama Pengawas': row.member.nama,
        NIP: row.member.nip,
      };

      // Add each month column
      row.months.forEach((m) => {
        rowObj[m.short] = m.isPaid ? 'LUNAS' : 'BELUM';
      });

      rowObj['Bulan Lunas'] = `${row.lunasCount}/12`;
      rowObj['Total Dibayar'] = row.totalPaid;
      rowObj['Sisa Tunggakan'] = row.sisaTunggakan;

      return rowObj;
    });

    exportToExcel(data, `Rekap_Matriks_12_Bulan_MKPS_${selectedYear}`);
  };

  const handlePrint = () => {
    const columns = [
      'No',
      'Nama Pengawas',
      'NIP',
      ...BULAN_SHORT,
      'Lunas',
      'Realisasi',
      'Tunggakan',
    ];

    const rows = filteredMatrix.map((row, idx) => [
      idx + 1,
      row.member.nama,
      row.member.nip,
      ...row.months.map((m) => (m.isPaid ? '✓' : '✕')),
      `${row.lunasCount}/12`,
      formatRupiah(row.totalPaid),
      formatRupiah(row.sisaTunggakan),
    ]);

    printReport({
      title: 'MATRIKS REKAPITULASI IURAN SELURUH BULAN (JAN - DES)',
      subtitle: `Musyawarah Kerja Pengawas Sekolah (MKPS) SMP Kabupaten Garut`,
      periodText: `Tahun Anggaran ${selectedYear}`,
      settings,
      printedBy: userProfile?.nama || 'Bendahara MKPS',
      columns,
      rows,
      summaryRows: [
        { label: 'Total Anggota Terdata', value: `${activeMembers.length} Orang` },
        { label: 'Total Anggota Lunas 100%', value: `${fullyPaidMemberCount} Orang` },
        { label: 'Total Realisasi Terhimpun', value: formatRupiah(totalRealisasiYear) },
        { label: 'Total Sisa Tunggakan', value: formatRupiah(totalTunggakanYear) },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              Tahun Anggaran {selectedYear}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-800 mt-1">
            Rekap Status Iuran Seluruh Bulan (Januari - Desember)
          </h2>
          <p className="text-xs text-slate-500">
            Pantau transparansi pelunasan dan daftar pengawas yang sudah lunas vs belum lunas tiap bulannya.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Matriks</span>
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
          <span className="text-[10px] font-bold text-slate-400 uppercase">Target 12 Bulan</span>
          <p className="text-lg font-bold text-slate-800 mt-1">{formatRupiah(totalTargetYear)}</p>
          <p className="text-[11px] text-slate-500">
            {activeMembers.length} Anggota x 12 Bulan x {formatRupiah(settings.nominalIuran)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Terhimpun</span>
          <p className="text-lg font-bold text-emerald-700 mt-1">
            {formatRupiah(totalRealisasiYear)}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">
            {totalTargetYear > 0
              ? Math.round((totalRealisasiYear / totalTargetYear) * 100)
              : 0}
            % Tercapai
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-rose-500 uppercase">Total Sisa Tunggakan</span>
          <p className="text-lg font-bold text-rose-700 mt-1">{formatRupiah(totalTunggakanYear)}</p>
          <p className="text-[11px] text-rose-600 font-medium">
            Belum disetorkan ke kas MKPS
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase">Kepatuhan 100%</span>
          <p className="text-lg font-bold text-blue-700 mt-1">
            {fullyPaidMemberCount} / {activeMembers.length} Anggota
          </p>
          <p className="text-[11px] text-slate-500">Lunas 12 bulan penuh tanpa tunggakan</p>
        </div>
      </div>

      {/* View Switcher: Matriks 12 Bulan vs Rincian Sudah/Belum per Bulan */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setViewMode('matriks')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              viewMode === 'matriks'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-4 h-4 text-emerald-600" />
            <span>Matriks Tabel 12 Bulan (Seluruh Anggota)</span>
          </button>
          <button
            onClick={() => setViewMode('per_bulan')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              viewMode === 'per_bulan'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-4 h-4 text-emerald-600" />
            <span>Rincian Siapa Sudah vs Belum Bayar (Bulan ke Bulan)</span>
          </button>
        </div>

        {/* Year dropdown */}
        <div className="flex items-center space-x-2 px-2">
          <span className="text-xs text-slate-500 font-semibold">Tahun:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MODE 1: MATRIKS 12 BULAN GRID */}
      {viewMode === 'matriks' && (
        <div className="space-y-4">
          {/* Search and Compliance Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari Nama Pengawas atau NIP..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <select
                value={filterCompliance}
                onChange={(e) => setFilterCompliance(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Status Kepatuhan</option>
                <option value="tunggakan">Hanya Yang Memiliki Tunggakan</option>
                <option value="lunas_penuh">Hanya Yang Sudah Lunas Penuh (12 Bln)</option>
              </select>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Matriks Pelunasan Iuran Jan - Des {selectedYear}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Arahkan kursor pada tanda centang hijau untuk melihat rincian tanggal dan bukti pembayaran.
                </p>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center text-emerald-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 mr-1.5" />
                  Lunas (✓)
                </span>
                <span className="flex items-center text-rose-600 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-300 mr-1.5" />
                  Belum (✕)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="py-3 px-3 font-bold text-center w-10">No</th>
                    <th className="py-3 px-3 font-bold min-w-[200px]">Nama Pengawas</th>
                    <th className="py-3 px-3 font-bold font-mono">NIP</th>
                    {BULAN_SHORT.map((b) => (
                      <th key={b} className="py-3 px-2 font-bold text-center w-10">
                        {b}
                      </th>
                    ))}
                    <th className="py-3 px-3 font-bold text-center">Lunas</th>
                    <th className="py-3 px-3 font-bold text-right text-emerald-700">
                      Realisasi (Rp)
                    </th>
                    <th className="py-3 px-3 font-bold text-right text-rose-700">Tunggakan (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={18} className="py-12 text-center text-slate-500">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        Tidak ada data anggota sesuai kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMatrix.map((row, idx) => (
                      <tr key={row.member.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800 block truncate">
                            {row.member.nama}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {row.member.nip}
                        </td>

                        {/* 12 Months Cells */}
                        {row.months.map((m) => (
                          <td key={m.monthNum} className="py-3 px-1 text-center">
                            {m.isPaid ? (
                              <div
                                title={`${m.full} ${selectedYear}: LUNAS (${formatRupiah(
                                  m.nominal
                                )}) pada ${formatDateIndo(m.tanggalBayar)} [${m.nomorTransaksi}]`}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-emerald-100 text-emerald-800 font-extrabold cursor-help hover:bg-emerald-200 transition text-[11px]"
                              >
                                ✓
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenQuickPay(row.member, m.monthNum)}
                                title={`Klik untuk catat pembayaran ${m.full} ${selectedYear}`}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-rose-50 text-rose-500 font-extrabold hover:bg-rose-200 hover:text-rose-800 transition text-[11px]"
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        ))}

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              row.isFullyPaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {row.lunasCount}/12
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                          {formatRupiah(row.totalPaid)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-rose-700 whitespace-nowrap">
                          {row.sisaTunggakan > 0 ? formatRupiah(row.sisaTunggakan) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: RINCIAN BULAN KE BULAN (SUDAH VS BELUM LUNAS) */}
      {viewMode === 'per_bulan' && (
        <div className="space-y-6">
          {/* Month Pills Tabs */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-1.5 overflow-x-auto custom-scrollbar">
            {BULAN_NAMES.map((name, idx) => {
              const monthNum = idx + 1;
              const isSelected = selectedMonthTab === monthNum;
              const paidInThisMonth = activeMembers.filter((m) =>
                duesMap.has(`${m.id}-${selectedYear}-${monthNum}`)
              ).length;
              const isAllPaid = paidInThisMonth === activeMembers.length && activeMembers.length > 0;

              return (
                <button
                  key={name}
                  onClick={() => setSelectedMonthTab(monthNum)}
                  className={`flex flex-col items-center px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{name}</span>
                  <span
                    className={`text-[10px] mt-0.5 ${
                      isSelected
                        ? 'text-emerald-100'
                        : isAllPaid
                        ? 'text-emerald-600 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {paidInThisMonth}/{activeMembers.length} Lunas
                  </span>
                </button>
              );
            })}
          </div>

          {/* Month KPI Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">
                Status Pelunasan Bulan:
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                {BULAN_NAMES[selectedMonthTab - 1]} {selectedYear}
              </h3>
              <p className="text-xs text-slate-500">
                Tarif Wajib: {formatRupiah(settings.nominalIuran)} per anggota
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Realisasi Kas
                </span>
                <span className="text-base font-bold text-emerald-700">
                  {formatRupiah(monthDetailData.paidList.length * settings.nominalIuran)}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Tunggakan Belum Masuk
                </span>
                <span className="text-base font-bold text-rose-700">
                  {formatRupiah(monthDetailData.unpaidList.length * settings.nominalIuran)}
                </span>
              </div>
            </div>
          </div>

          {/* Two Columns: Sudah Lunas vs Belum Lunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kolom 1: SUDAH LUNAS */}
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs overflow-hidden flex flex-col">
              <div className="bg-emerald-50/70 p-4 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-sm font-bold text-emerald-950">
                    Anggota Sudah Lunas ({monthDetailData.paidList.length})
                  </h4>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                  {formatRupiah(monthDetailData.paidList.length * settings.nominalIuran)}
                </span>
              </div>

              <div className="p-4 flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-100">
                {monthDetailData.paidList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Belum ada anggota yang melunasi iuran bulan ini.
                  </div>
                ) : (
                  monthDetailData.paidList.map(({ member, record }, idx) => (
                    <div
                      key={member.id}
                      className="py-3 flex items-center justify-between hover:bg-emerald-50/30 transition px-2 rounded-lg"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{member.nama}</p>
                        <p className="text-[11px] text-slate-500 font-mono">NIP. {member.nip}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Tgl: {formatDateIndo(record.tanggalBayar)} | No: {record.nomorTransaksi}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-emerald-700 block">
                          {formatRupiah(record.nominal)}
                        </span>
                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                          LUNAS
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Kolom 2: BELUM LUNAS */}
            <div className="bg-white rounded-2xl border border-rose-200 shadow-xs overflow-hidden flex flex-col">
              <div className="bg-rose-50/70 p-4 border-b border-rose-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <h4 className="text-sm font-bold text-rose-950">
                    Anggota Belum Bayar ({monthDetailData.unpaidList.length})
                  </h4>
                </div>
                <span className="text-xs font-bold text-rose-700 bg-white px-2.5 py-1 rounded-full border border-rose-200 shadow-2xs">
                  {formatRupiah(monthDetailData.unpaidList.length * settings.nominalIuran)}
                </span>
              </div>

              <div className="p-4 flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-100">
                {monthDetailData.unpaidList.length === 0 ? (
                  <div className="py-12 text-center text-emerald-600 text-xs font-semibold">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    Luar biasa! Seluruh anggota telah melunasi iuran bulan ini.
                  </div>
                ) : (
                  monthDetailData.unpaidList.map(({ member, kewajiban }, idx) => (
                    <div
                      key={member.id}
                      className="py-3 flex items-center justify-between hover:bg-rose-50/30 transition px-2 rounded-lg"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{member.nama}</p>
                        <p className="text-[11px] text-slate-500 font-mono">NIP. {member.nip}</p>
                        <p className="text-[10px] text-rose-500 font-semibold mt-0.5">
                          Tunggakan: {formatRupiah(kewajiban)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <button
                          onClick={() => handleOpenQuickPay(member, selectedMonthTab)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Bayar</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quick Catat Pembayaran */}
      {quickPayMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Catat Pembayaran Iuran</h3>
              <button
                onClick={() => setQuickPayMember(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuickPayment} className="mt-4 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Anggota</span>
                <p className="text-sm font-bold text-slate-800">{quickPayMember.nama}</p>
                <p className="text-xs text-slate-500 font-mono">NIP: {quickPayMember.nip}</p>
                <p className="text-xs text-emerald-700 font-semibold mt-1">
                  Periode: {BULAN_NAMES[quickPayMember.bulan - 1]} {quickPayMember.tahun}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nominal (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formNominal}
                    onChange={(e) => setFormNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Bayar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formTanggalBayar}
                    onChange={(e) => setFormTanggalBayar(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Tunai / Transfer Bank bjb"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setQuickPayMember(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50"
                >
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
