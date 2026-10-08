import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  PlusCircle,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  X,
  Ban,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { Pemasukan } from '../../types';
import { formatRupiah, formatDateIndo, getTodayDateString } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { exportToExcel } from '../../utils/excelExport';
import { printReport } from '../../utils/pdfExport';

export const PemasukanPage: React.FC = () => {
  const {
    pemasukanList,
    catatPemasukan,
    batalkanPemasukan,
    settings,
    selectedYear,
  } = useApp();
  const { userProfile } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [cancelingItem, setCancelingItem] = useState<Pemasukan | null>(null);

  // Form Fields
  const [formTanggal, setFormTanggal] = useState(getTodayDateString());
  const [formKategori, setFormKategori] = useState('Donasi / Sukarela');
  const [formSumber, setFormSumber] = useState('');
  const [formNominal, setFormNominal] = useState<number>(0);
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const kategoriOptions = [
    'Donasi / Sukarela',
    'Iuran Khusus',
    'Saldo Awal Tahun',
    'Jasa Giro / Bunga Bank',
    'Pendapatan Lainnya',
  ];

  // Filtering
  const filteredList = useMemo(() => {
    return pemasukanList.filter((p) => {
      const pYear = new Date(p.tanggal).getFullYear();
      const matchYear = pYear === selectedYear;
      const matchKategori = kategoriFilter === 'all' || p.kategori === kategoriFilter;
      const matchSearch =
        p.nomorTransaksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.keterangan && p.keterangan.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchYear && matchKategori && matchSearch;
    });
  }, [pemasukanList, selectedYear, kategoriFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage]);

  const handleOpenAdd = () => {
    setFormTanggal(getTodayDateString());
    setFormKategori('Donasi / Sukarela');
    setFormSumber('');
    setFormNominal(0);
    setFormKeterangan('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSumber.trim()) {
      setFormError('Sumber atau pihak pemberi pemasukan wajib diisi');
      return;
    }
    if (formNominal <= 0) {
      setFormError('Nominal harus lebih besar dari 0');
      return;
    }

    setFormSubmitting(true);
    try {
      await catatPemasukan({
        tanggal: formTanggal,
        kategori: formKategori,
        sumber: formSumber.trim(),
        nominal: formNominal,
        keterangan: formKeterangan.trim(),
      });
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan transaksi pemasukan');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmCancel = async (alasan?: string) => {
    if (!cancelingItem) return;
    try {
      await batalkanPemasukan(cancelingItem.id, alasan || 'Dibatalkan oleh admin');
      setCancelingItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    const data = filteredList.map((p, idx) => ({
      No: idx + 1,
      'No Transaksi': p.nomorTransaksi,
      Tanggal: formatDateIndo(p.tanggal),
      Kategori: p.kategori,
      Sumber: p.sumber,
      Nominal: p.nominal,
      Status: p.status.toUpperCase(),
      Keterangan: p.keterangan || '-',
    }));
    exportToExcel(data, `Pemasukan_Kas_${selectedYear}_${new Date().toISOString().slice(0, 10)}`);
  };

  const handlePrint = () => {
    const total = filteredList
      .filter((p) => p.status === 'aktif')
      .reduce((sum, item) => sum + item.nominal, 0);

    const rows = filteredList.map((p, idx) => [
      idx + 1,
      p.nomorTransaksi,
      formatDateIndo(p.tanggal),
      p.kategori,
      p.sumber,
      formatRupiah(p.nominal),
      p.status === 'aktif' ? 'AKTIF' : 'DIBATALKAN',
      p.keterangan || '-',
    ]);

    printReport({
      title: 'LAPORAN PENERIMAAN / PEMASUKAN KAS MKPS',
      subtitle: `Musyawarah Kerja Pengawas Sekolah (MKPS) SMP Kabupaten Garut`,
      periodText: `Tahun Anggaran ${selectedYear}`,
      settings,
      printedBy: userProfile?.nama || 'Bendahara MKPS',
      columns: ['No', 'No Trx', 'Tanggal', 'Kategori', 'Sumber', 'Nominal', 'Status', 'Keterangan'],
      rows,
      summaryRows: [
        { label: 'Jumlah Transaksi Aktif', value: `${filteredList.filter((p) => p.status === 'aktif').length} Transaksi` },
        { label: 'Total Penerimaan Kas', value: formatRupiah(total) },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Pemasukan Kas Non-Iuran</h2>
          <p className="text-xs text-slate-500">
            Pencatatan kas masuk selain iuran bulanan reguler (donasi, saldo awal, pendapatan kegiatan).
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
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Pemasukan</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari berdasarkan No Transaksi, Sumber, atau Keterangan..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={kategoriFilter}
            onChange={(e) => {
              setKategoriFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Kategori Pemasukan</option>
            {kategoriOptions.map((kat) => (
              <option key={kat} value={kat}>
                {kat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-bold text-center w-12">No</th>
                <th className="py-3 px-4 font-bold">No Transaksi</th>
                <th className="py-3 px-4 font-bold">Tanggal</th>
                <th className="py-3 px-4 font-bold">Kategori</th>
                <th className="py-3 px-4 font-bold">Sumber</th>
                <th className="py-3 px-4 font-bold text-right">Nominal</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
                <th className="py-3 px-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Belum ada data pemasukan kas pada filter ini.
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, idx) => {
                  const num = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-center font-medium text-slate-500">{num}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {item.nomorTransaksi}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatDateIndo(item.tanggal)}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{item.kategori}</span>
                        {item.keterangan && (
                          <span className="block text-[11px] text-slate-400 truncate max-w-xs">
                            {item.keterangan}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{item.sumber}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        + {formatRupiah(item.nominal)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={item.status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.status === 'aktif' ? (
                          <button
                            onClick={() => setCancelingItem(item)}
                            title="Batalkan Transaksi"
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Dibatalkan</span>
                        )}
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
              {Math.min(currentPage * itemsPerPage, filteredList.length)} dari {filteredList.length} data
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

      {/* Modal Add Pemasukan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Tambah Penerimaan Kas</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Penerimaan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    {kategoriOptions.map((kat) => (
                      <option key={kat} value={kat}>
                        {kat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sumber / Dari Pihak <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formSumber}
                  onChange={(e) => setFormSumber(e.target.value)}
                  placeholder="Contoh: Donatur Peduli Pendidikan / Sisa Kas 2025"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Penerimaan (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1000}
                  required
                  value={formNominal || ''}
                  onChange={(e) => setFormNominal(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Rincian peruntukan atau nomor kuitansi manual..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50"
                >
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Penerimaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal Cancel */}
      <ConfirmModal
        isOpen={!!cancelingItem}
        title="Batalkan Penerimaan Kas?"
        message={`Apakah Anda yakin ingin membatalkan transaksi penerimaan ${cancelingItem?.nomorTransaksi} sebesar ${formatRupiah(cancelingItem?.nominal)} dari "${cancelingItem?.sumber}"?`}
        confirmText="Ya, Batalkan Transaksi"
        requireReason={true}
        reasonPlaceholder="Tuliskan alasan pembatalan transaksi..."
        isDanger={true}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelingItem(null)}
      />
    </div>
  );
};
