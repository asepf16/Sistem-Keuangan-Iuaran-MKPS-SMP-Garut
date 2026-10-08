import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  PlusCircle,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  X,
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { Iuran } from '../../types';
import {
  formatRupiah,
  formatDateIndo,
  BULAN_NAMES,
  getTodayDateString,
} from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { exportToExcel } from '../../utils/excelExport';
import { printReport } from '../../utils/pdfExport';

export const IuranBulanan: React.FC = () => {
  const {
    settings,
    anggotaList,
    iuranList,
    catatIuran,
    batalkanIuran,
    selectedYear,
    setSelectedYear,
  } = useApp();
  const { userProfile } = useAuth();

  const [selectedBulan, setSelectedBulan] = useState<number>(0); // 0 = Semua bulan
  const [statusFilter, setStatusFilter] = useState<'all' | 'lunas' | 'dibatalkan'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [cancelingIuran, setCancelingIuran] = useState<Iuran | null>(null);

  // Form State
  const [formAnggotaId, setFormAnggotaId] = useState('');
  const [formBulan, setFormBulan] = useState<number>(new Date().getMonth() + 1);
  const [formTahun, setFormTahun] = useState<number>(selectedYear);
  const [formNominal, setFormNominal] = useState<number>(settings.nominalIuran || 100000);
  const [formTanggalBayar, setFormTanggalBayar] = useState(getTodayDateString());
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Filtered Iuran List
  const filteredList = useMemo(() => {
    return iuranList.filter((item) => {
      const matchYear = item.tahun === selectedYear;
      const matchMonth = selectedBulan === 0 || item.bulan === selectedBulan;
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchSearch =
        item.namaAnggota.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nip.includes(searchTerm) ||
        item.nomorTransaksi.toLowerCase().includes(searchTerm.toLowerCase());

      return matchYear && matchMonth && matchStatus && matchSearch;
    });
  }, [iuranList, selectedYear, selectedBulan, statusFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage]);

  const handleOpenPayModal = () => {
    setFormAnggotaId(anggotaList.find((a) => a.status === 'aktif')?.id || '');
    setFormBulan(new Date().getMonth() + 1);
    setFormTahun(selectedYear);
    setFormNominal(settings.nominalIuran || 100000);
    setFormTanggalBayar(getTodayDateString());
    setFormKeterangan('');
    setFormError('');
    setIsPayModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAnggotaId) {
      setFormError('Pilih anggota terlebih dahulu');
      return;
    }

    const member = anggotaList.find((a) => a.id === formAnggotaId);
    if (!member) {
      setFormError('Data anggota tidak valid');
      return;
    }

    // Constraint: 1 anggota tidak memiliki 2 transaksi aktif untuk anggotaId + bulan + tahun (Section I)
    const existingPayment = iuranList.find(
      (i) =>
        i.anggotaId === formAnggotaId &&
        i.bulan === formBulan &&
        i.tahun === formTahun &&
        i.status === 'lunas'
    );

    if (existingPayment) {
      setFormError(
        `PERINGATAN: ${member.nama} sudah memiliki transaksi iuran lunas untuk ${BULAN_NAMES[formBulan - 1]} ${formTahun} [${existingPayment.nomorTransaksi}].`
      );
      return;
    }

    setFormSubmitting(true);
    try {
      await catatIuran({
        anggotaId: member.id,
        namaAnggota: member.nama,
        nip: member.nip,
        bulan: formBulan,
        tahun: formTahun,
        nominal: formNominal,
        tanggalBayar: formTanggalBayar,
        keterangan: formKeterangan.trim(),
      });
      setIsPayModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan pembayaran iuran');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmCancel = async (alasan?: string) => {
    if (!cancelingIuran) return;
    try {
      await batalkanIuran(cancelingIuran.id, alasan || 'Dibatalkan oleh admin');
      setCancelingIuran(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    const data = filteredList.map((i, idx) => ({
      No: idx + 1,
      'No Transaksi': i.nomorTransaksi,
      'Nama Anggota': i.namaAnggota,
      NIP: i.nip,
      Bulan: BULAN_NAMES[i.bulan - 1],
      Tahun: i.tahun,
      Nominal: i.nominal,
      'Tanggal Bayar': formatDateIndo(i.tanggalBayar),
      Status: i.status.toUpperCase(),
      Keterangan: i.keterangan || '-',
    }));
    exportToExcel(data, `Iuran_Bulanan_${selectedYear}_${new Date().toISOString().slice(0, 10)}`);
  };

  const handlePrint = () => {
    const total = filteredList
      .filter((i) => i.status === 'lunas')
      .reduce((sum, item) => sum + item.nominal, 0);

    const rows = filteredList.map((i, idx) => [
      idx + 1,
      i.nomorTransaksi,
      i.namaAnggota,
      i.nip,
      `${BULAN_NAMES[i.bulan - 1]} ${i.tahun}`,
      formatRupiah(i.nominal),
      formatDateIndo(i.tanggalBayar),
      i.status === 'lunas' ? 'LUNAS' : 'DIBATALKAN',
    ]);

    printReport({
      title: 'LAPORAN REKAP IURAN BULANAN ANGGOTA',
      subtitle: `Musyawarah Kerja Pengawas Sekolah (MKPS) SMP Kabupaten Garut`,
      periodText: `${selectedBulan > 0 ? BULAN_NAMES[selectedBulan - 1] + ' ' : ''}${selectedYear}`,
      settings,
      printedBy: userProfile?.nama || 'Bendahara MKPS',
      columns: ['No', 'No Trx', 'Nama Pengawas', 'NIP', 'Periode', 'Nominal', 'Tgl Bayar', 'Status'],
      rows,
      summaryRows: [
        { label: 'Total Transaksi Lunas', value: `${filteredList.filter((i) => i.status === 'lunas').length} Transaksi` },
        { label: 'Total Realisasi Kas Iuran', value: formatRupiah(total) },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Pengelolaan Iuran Bulanan</h2>
          <p className="text-xs text-slate-500">
            Pencatatan realisasi pembayaran iuran pengawas, kontrol status lunas/tunggakan, dan cetak kuitansi.
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
            onClick={handleOpenPayModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Pembayaran</span>
          </button>
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
            placeholder="Cari Nama Anggota, NIP, atau No Transaksi..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={selectedBulan}
            onChange={(e) => {
              setSelectedBulan(Number(e.target.value));
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="lunas">Hanya Lunas</option>
            <option value="dibatalkan">Dibatalkan</option>
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
                <th className="py-3 px-4 font-bold">Nama Anggota</th>
                <th className="py-3 px-4 font-bold">NIP</th>
                <th className="py-3 px-4 font-bold">Periode</th>
                <th className="py-3 px-4 font-bold text-right">Nominal</th>
                <th className="py-3 px-4 font-bold">Tgl Bayar</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
                <th className="py-3 px-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Belum ada riwayat transaksi iuran pada filter ini.
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
                      <td className="py-3 px-4 font-bold text-slate-800">{item.namaAnggota}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{item.nip}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {BULAN_NAMES[item.bulan - 1]} {item.tahun}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatDateIndo(item.tanggalBayar)}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={item.status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.status === 'lunas' ? (
                          <button
                            onClick={() => setCancelingIuran(item)}
                            title="Batalkan Transaksi"
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Nonaktif</span>
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

      {/* Modal Catat Pembayaran */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Catat Pembayaran Iuran</h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
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

            <form onSubmit={handleSavePayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Anggota Pengawas <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formAnggotaId}
                  onChange={(e) => setFormAnggotaId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="">-- Pilih Nama Anggota --</option>
                  {anggotaList
                    .filter((a) => a.status === 'aktif')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nama} (NIP: {a.nip})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bulan Iuran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formBulan}
                    onChange={(e) => setFormBulan(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    {BULAN_NAMES.map((name, idx) => (
                      <option key={name} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formTahun}
                    onChange={(e) => setFormTahun(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nominal Iuran (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formNominal}
                    onChange={(e) => setFormNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  {formNominal !== settings.nominalIuran && (
                    <p className="text-[10px] text-amber-600 mt-1">
                      Nominal berbeda dengan standar ({formatRupiah(settings.nominalIuran)})
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Pembayaran <span className="text-rose-500">*</span>
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
                  Keterangan / Catatan Transaksi (Opsional)
                </label>
                <input
                  type="text"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Contoh: Transfer Bank bjb / Tunai via Bendahara"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
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

      {/* Confirmation Modal Cancel Transaction */}
      <ConfirmModal
        isOpen={!!cancelingIuran}
        title="Batalkan Transaksi Iuran?"
        message={`Apakah Anda yakin ingin membatalkan transaksi ${cancelingIuran?.nomorTransaksi} atas nama "${cancelingIuran?.namaAnggota}" (${formatRupiah(cancelingIuran?.nominal)})? Transaksi ini akan ditandai dibatalkan dan tidak dihitung ke dalam saldo berjalan.`}
        confirmText="Ya, Batalkan Transaksi"
        requireReason={true}
        reasonPlaceholder="Tuliskan alasan pembatalan transaksi (misal: salah input anggota/nominal)..."
        isDanger={true}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelingIuran(null)}
      />
    </div>
  );
};
