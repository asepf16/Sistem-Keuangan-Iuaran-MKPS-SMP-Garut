import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  UserX,
  UserCheck,
  FileSpreadsheet,
  X,
  Eye,
  Key,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Anggota } from '../../types';
import { formatDateIndo, getTodayDateString } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { exportToExcel } from '../../utils/excelExport';

export const DataAnggota: React.FC = () => {
  const { anggotaList, addAnggota, editAnggota, hapusAnggota, iuranList } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aktif' | 'nonaktif'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Anggota | null>(null);
  const [detailMember, setDetailMember] = useState<Anggota | null>(null);

  // Confirmation modals
  const [toggleMember, setToggleMember] = useState<{ member: Anggota; nextStatus: 'aktif' | 'nonaktif' } | null>(null);
  const [deletingMember, setDeletingMember] = useState<Anggota | null>(null);

  // Form fields
  const [formNama, setFormNama] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTanggalBergabung, setFormTanggalBergabung] = useState(getTodayDateString());
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Filtering & Search
  const filteredMembers = useMemo(() => {
    return anggotaList.filter((m) => {
      const matchSearch =
        m.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.nip.includes(searchTerm) ||
        (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [anggotaList, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, currentPage]);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormNama('');
    setFormNip('');
    setFormEmail('');
    setFormTanggalBergabung(getTodayDateString());
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (member: Anggota) => {
    setEditingMember(member);
    setFormNama(member.nama);
    setFormNip(member.nip);
    setFormEmail(member.email || '');
    setFormTanggalBergabung(member.tanggalBergabung || getTodayDateString());
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) {
      setFormError('Nama lengkap anggota wajib diisi');
      return;
    }
    if (!formNip.trim()) {
      setFormError('NIP anggota wajib diisi');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingMember) {
        await editAnggota(editingMember.id, {
          nama: formNama.trim(),
          nip: formNip.trim(),
          email: formEmail.trim() || undefined,
          tanggalBergabung: formTanggalBergabung,
        });
      } else {
        // Check duplication
        const duplicate = anggotaList.find((a) => a.nip === formNip.trim());
        if (duplicate) {
          setFormError('Anggota dengan NIP ini sudah terdaftar.');
          setFormSubmitting(false);
          return;
        }

        await addAnggota({
          nama: formNama.trim(),
          nip: formNip.trim(),
          email: formEmail.trim() || `${formNip.trim()}@mkps-garut.sch.id`,
          tanggalBergabung: formTanggalBergabung,
          status: 'aktif',
        });
      }
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan anggota');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!toggleMember) return;
    try {
      await editAnggota(toggleMember.member.id, {
        status: toggleMember.nextStatus,
      });
      setToggleMember(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMember) return;
    try {
      await hapusAnggota(deletingMember.id, deletingMember.nama);
      setDeletingMember(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    const data = filteredMembers.map((m, idx) => ({
      No: idx + 1,
      Nama: m.nama,
      NIP: m.nip,
      Email: m.email || '-',
      Status: m.status.toUpperCase(),
      'Tanggal Bergabung': formatDateIndo(m.tanggalBergabung),
    }));
    exportToExcel(data, `Data_Anggota_MKPS_SMP_Garut_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Data Master Anggota MKPS</h2>
          <p className="text-xs text-slate-500">
            Kelola identitas, NIP, status keaktifan, dan akun pengawas sekolah anggota MKPS SMP Kabupaten Garut.
          </p>
        </div>
        <div className="flex items-center space-x-2">
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
            <UserPlus className="w-4 h-4" />
            <span>Tambah Anggota</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Cari berdasarkan Nama, NIP, atau Email..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Status Keanggotaan</option>
            <option value="aktif">Hanya Aktif</option>
            <option value="nonaktif">Hanya Nonaktif</option>
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
                <th className="py-3 px-4 font-bold">Nama Anggota</th>
                <th className="py-3 px-4 font-bold">NIP</th>
                <th className="py-3 px-4 font-bold">Email</th>
                <th className="py-3 px-4 font-bold">Tgl Bergabung</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
                <th className="py-3 px-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Belum ada anggota yang terdaftar atau sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member, idx) => {
                  const num = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-center font-medium text-slate-500">{num}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{member.nama}</span>
                        <span className="text-[10px] text-slate-400">ID: {member.id}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 font-semibold">{member.nip}</td>
                      <td className="py-3 px-4 text-slate-500">{member.email || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDateIndo(member.tanggalBergabung)}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={member.status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setDetailMember(member)}
                            title="Detail"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(member)}
                            title="Edit"
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {member.status === 'aktif' ? (
                            <button
                              onClick={() => setToggleMember({ member, nextStatus: 'nonaktif' })}
                              title="Nonaktifkan"
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setToggleMember({ member, nextStatus: 'aktif' })}
                              title="Aktifkan Kembali"
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeletingMember(member)}
                            title="Hapus Anggota"
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
              {Math.min(currentPage * itemsPerPage, filteredMembers.length)} dari {filteredMembers.length} anggota
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

      {/* Add / Edit Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {editingMember ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
              </h3>
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

            <form onSubmit={handleSaveMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Drs. H. Asep Saepudin, M.Pd."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    placeholder="18 Digit NIP"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Bergabung
                  </label>
                  <input
                    type="date"
                    value={formTanggalBergabung}
                    onChange={(e) => setFormTanggalBergabung(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Akun (Opsional)
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="nama.pengawas@mkps-garut.id"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Jika dikosongkan, NIP akan otomatis dijadikan identifikasi login anggota.
                </p>
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
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {detailMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Detail Pengawas MKPS</h3>
              <button onClick={() => setDetailMember(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Nama Lengkap</span>
                <p className="text-sm font-bold text-slate-800">{detailMember.nama}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">NIP</span>
                  <p className="font-mono font-semibold text-slate-800">{detailMember.nip}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Status</span>
                  <div className="mt-0.5">
                    <Badge status={detailMember.status} />
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Email Login</span>
                <p className="text-slate-700">{detailMember.email || '-'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Tanggal Bergabung</span>
                <p className="text-slate-700">{formatDateIndo(detailMember.tanggalBergabung)}</p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setDetailMember(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Status Toggle */}
      <ConfirmModal
        isOpen={!!toggleMember}
        title={toggleMember?.nextStatus === 'nonaktif' ? 'Nonaktifkan Anggota?' : 'Aktifkan Kembali Anggota?'}
        message={
          toggleMember?.nextStatus === 'nonaktif'
            ? `Apakah Anda yakin ingin menonaktifkan "${toggleMember?.member.nama}"? Anggota nonaktif tidak akan dimasukkan ke dalam target kewajiban iuran baru.`
            : `Aktifkan kembali "${toggleMember?.member.nama}" sebagai anggota aktif MKPS?`
        }
        confirmText={toggleMember?.nextStatus === 'nonaktif' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        isDanger={toggleMember?.nextStatus === 'nonaktif'}
        onConfirm={handleConfirmToggleStatus}
        onCancel={() => setToggleMember(null)}
      />

      {/* Confirmation Modal Hapus Anggota */}
      <ConfirmModal
        isOpen={!!deletingMember}
        title="Hapus Data Anggota?"
        message={
          deletingMember
            ? `Apakah Anda yakin ingin menghapus data anggota "${deletingMember.nama}" (NIP: ${deletingMember.nip}) secara permanen? Data profil ini akan dihapus dari daftar anggota MKPS.${
                iuranList.some((i) => i.anggotaId === deletingMember.id)
                  ? ' Catatan: Anggota ini memiliki riwayat transaksi iuran tercatat di sistem yang tetap tersimpan pada histori pembukuan.'
                  : ''
              }`
            : ''
        }
        confirmText="Ya, Hapus Anggota"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingMember(null)}
      />
    </div>
  );
};
