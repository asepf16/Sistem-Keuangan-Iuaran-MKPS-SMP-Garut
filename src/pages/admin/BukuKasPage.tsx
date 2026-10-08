import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Filter,
  Search,
  FileSpreadsheet,
  Printer,
  Calendar,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
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

export const BukuKasPage: React.FC = () => {
  const { bukuKas, settings, selectedYear } = useApp();
  const { userProfile } = useAuth();

  const [filterMonth, setFilterMonth] = useState<number>(0); // 0 = Semua bulan
  const [filterJenis, setFilterJenis] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [filterStatus, setFilterStatus] = useState<'aktif' | 'all'>('aktif');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filter Buku Kas entries
  const filteredEntries = useMemo(() => {
    return bukuKas.filter((entry) => {
      const entryDate = new Date(entry.tanggal);
      const entryYear = entryDate.getFullYear();
      const entryMonth = entryDate.getMonth() + 1;

      const matchYear = entryYear === selectedYear;
      const matchMonth = filterMonth === 0 || entryMonth === filterMonth;
      const matchJenis = filterJenis === 'all' || entry.jenis === filterJenis;
      const matchStatus = filterStatus === 'all' || entry.status === filterStatus;
      const matchSearch =
        entry.nomorTransaksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.kategori.toLowerCase().includes(searchTerm.toLowerCase());

      return matchYear && matchMonth && matchJenis && matchStatus && matchSearch;
    });
  }, [bukuKas, selectedYear, filterMonth, filterJenis, filterStatus, searchTerm]);

  // Totals for filtered period
  const totalMasukPeriode = useMemo(() => {
    return filteredEntries
      .filter((e) => e.status === 'aktif')
      .reduce((sum, item) => sum + item.nominalMasuk, 0);
  }, [filteredEntries]);

  const totalKeluarPeriode = useMemo(() => {
    return filteredEntries
      .filter((e) => e.status === 'aktif')
      .reduce((sum, item) => sum + item.nominalKeluar, 0);
  }, [filteredEntries]);

  // Current balance at latest filtered entry
  const saldoAkhirPeriode = totalMasukPeriode - totalKeluarPeriode;

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage) || 1;
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEntries.slice(start, start + itemsPerPage);
  }, [filteredEntries, currentPage]);

  const handleExportExcel = () => {
    const data = filteredEntries.map((e, idx) => ({
      No: idx + 1,
      Tanggal: formatDateIndo(e.tanggal),
      'No Transaksi': e.nomorTransaksi,
      Kategori: e.kategori,
      Keterangan: e.keterangan,
      Pemasukan: e.nominalMasuk > 0 ? e.nominalMasuk : 0,
      Pengeluaran: e.nominalKeluar > 0 ? e.nominalKeluar : 0,
      'Saldo Berjalan': e.saldo,
      Status: e.status.toUpperCase(),
    }));
    exportToExcel(data, `Buku_Kas_MKPS_${selectedYear}_${new Date().toISOString().slice(0, 10)}`);
  };

  const handlePrint = () => {
    const rows = filteredEntries.map((e, idx) => [
      idx + 1,
      formatDateIndo(e.tanggal),
      e.nomorTransaksi,
      e.keterangan,
      e.nominalMasuk > 0 ? formatRupiah(e.nominalMasuk) : '-',
      e.nominalKeluar > 0 ? formatRupiah(e.nominalKeluar) : '-',
      formatRupiah(e.saldo),
      e.status === 'aktif' ? 'AKTIF' : 'BATAL',
    ]);

    printReport({
      title: 'BUKU KAS UMUM (BKU) MKPS SMP KABUPATEN GARUT',
      subtitle: `Laporan Saldo Berjalan & Rekap Arus Kas Transaksional`,
      periodText: `${filterMonth > 0 ? BULAN_NAMES[filterMonth - 1] + ' ' : ''}${selectedYear}`,
      settings,
      printedBy: userProfile?.nama || 'Bendahara MKPS',
      columns: ['No', 'Tanggal', 'No Trx', 'Uraian Transaksi', 'Penerimaan', 'Pengeluaran', 'Saldo Kas', 'Status'],
      rows,
      summaryRows: [
        { label: 'Total Penerimaan Kas', value: formatRupiah(totalMasukPeriode) },
        { label: 'Total Pengeluaran Kas', value: formatRupiah(totalKeluarPeriode) },
        { label: 'Saldo Kas Berjalan', value: formatRupiah(saldoAkhirPeriode) },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Buku Kas Umum (BKU)</h2>
          <p className="text-xs text-slate-500">
            Jurnal pembukuan kas kronologis dengan kalkulasi saldo berjalan otomatis setiap mutasi transaksi.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak BKU</span>
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

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Pemasukan</span>
            <p className="text-base font-bold text-emerald-700">{formatRupiah(totalMasukPeriode)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center space-x-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Pengeluaran</span>
            <p className="text-base font-bold text-rose-700">{formatRupiah(totalKeluarPeriode)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center space-x-3">
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Saldo Berjalan Kas</span>
            <p className="text-base font-bold text-teal-800">{formatRupiah(saldoAkhirPeriode)}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari Uraian Transaksi atau No Transaksi..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={filterMonth}
            onChange={(e) => {
              setFilterMonth(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
          >
            <option value={0}>Semua Bulan ({selectedYear})</option>
            {BULAN_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterJenis}
            onChange={(e) => {
              setFilterJenis(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Jenis Kas</option>
            <option value="masuk">Hanya Kas Masuk</option>
            <option value="keluar">Hanya Kas Keluar</option>
          </select>
        </div>
      </div>

      {/* Buku Kas Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-bold text-center w-12">No</th>
                <th className="py-3 px-4 font-bold">Tanggal</th>
                <th className="py-3 px-4 font-bold">No Transaksi</th>
                <th className="py-3 px-4 font-bold">Uraian / Keterangan</th>
                <th className="py-3 px-4 font-bold text-right text-emerald-700">Masuk (+)</th>
                <th className="py-3 px-4 font-bold text-right text-rose-700">Keluar (-)</th>
                <th className="py-3 px-4 font-bold text-right text-slate-900 bg-slate-100/60">
                  Saldo Berjalan
                </th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Belum ada transaksi pada Buku Kas untuk filter ini.
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((entry, idx) => {
                  const num = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr
                      key={entry.id + '-' + idx}
                      className={`hover:bg-slate-50/80 transition ${
                        entry.status === 'dibatalkan' ? 'opacity-50 line-through bg-slate-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-medium text-slate-500">{num}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                        {formatDateIndo(entry.tanggal)}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {entry.nomorTransaksi}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-semibold text-slate-800 block truncate">
                          {entry.keterangan}
                        </span>
                        <span className="text-[10px] text-slate-400">{entry.kategori}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                        {entry.nominalMasuk > 0 ? formatRupiah(entry.nominalMasuk) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600 whitespace-nowrap">
                        {entry.nominalKeluar > 0 ? formatRupiah(entry.nominalKeluar) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 bg-slate-50/40 whitespace-nowrap">
                        {formatRupiah(entry.saldo)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={entry.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredEntries.length)} dari {filteredEntries.length} mutasi
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <span className="px-2 py-1 font-semibold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
