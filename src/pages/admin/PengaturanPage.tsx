import React, { useState } from 'react';
import { Settings, Save, CheckCircle, AlertCircle, Building2, Wallet } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { formatRupiah } from '../../utils/formatters';

export const PengaturanPage: React.FC = () => {
  const { settings, updateSettings } = useApp();

  const [namaOrganisasi, setNamaOrganisasi] = useState(settings.namaOrganisasi || '');
  const [namaAplikasi, setNamaAplikasi] = useState(settings.namaAplikasi || '');
  const [nominalIuran, setNominalIuran] = useState<number>(settings.nominalIuran || 100000);
  const [tahunAktif, setTahunAktif] = useState<number>(settings.tahunAktif || 2026);
  const [alamat, setAlamat] = useState(settings.alamat || '');
  const [kontak, setKontak] = useState(settings.kontak || '');
  const [namaKetua, setNamaKetua] = useState(settings.namaKetua || '');
  const [namaBendahara, setNamaBendahara] = useState(settings.namaBendahara || '');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaOrganisasi.trim()) {
      setErrorMsg('Nama organisasi wajib diisi');
      return;
    }
    if (nominalIuran <= 0) {
      setErrorMsg('Nominal iuran harus lebih besar dari 0');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      await updateSettings({
        namaOrganisasi: namaOrganisasi.trim(),
        namaAplikasi: namaAplikasi.trim(),
        nominalIuran,
        tahunAktif,
        alamat: alamat.trim(),
        kontak: kontak.trim(),
        namaKetua: namaKetua.trim(),
        namaBendahara: namaBendahara.trim(),
      });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800">Pengaturan Sistem & Organisasi</h2>
        <p className="text-xs text-slate-500 mt-1">
          Sesuaikan identitas lembaga, besaran tarif iuran bulanan wajib, tahun anggaran aktif, dan nama penandatangan laporan.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pengaturan berhasil disimpan dan diperbarui di database Cloud Firestore!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identitas Organisasi & Iuran */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Identitas Organisasi & Parameter Iuran</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Organisasi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={namaOrganisasi}
                onChange={(e) => setNamaOrganisasi(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Aplikasi
              </label>
              <input
                type="text"
                value={namaAplikasi}
                onChange={(e) => setNamaAplikasi(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Iuran Bulanan Standar (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1000}
                required
                value={nominalIuran}
                onChange={(e) => setNominalIuran(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Tarif saat ini: <strong>{formatRupiah(nominalIuran)}</strong> per bulan per anggota. Perubahan tidak akan mengubah riwayat nominal transaksi lama (Section AS).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Anggaran Aktif <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={2020}
                max={2035}
                required
                value={tahunAktif}
                onChange={(e) => setTahunAktif(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Sekretariat
              </label>
              <input
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Jl. Pembangunan, Garut..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kontak / Email Sekretariat
              </label>
              <input
                type="text"
                value={kontak}
                onChange={(e) => setKontak(e.target.value)}
                placeholder="0812-xxxx-xxxx / mkps.garut@gmail.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Pejabat Penandatangan Laporan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
            Penandatangan Laporan Resmi (Ketua & Bendahara)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Ketua MKPS
              </label>
              <input
                type="text"
                value={namaKetua}
                onChange={(e) => setNamaKetua(e.target.value)}
                placeholder="Drs. H. Asep Saepudin, M.Pd."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Bendahara MKPS
              </label>
              <input
                type="text"
                value={namaBendahara}
                onChange={(e) => setNamaBendahara(e.target.value)}
                placeholder="Imas Komariah, S.Pd., M.M.Pd."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
