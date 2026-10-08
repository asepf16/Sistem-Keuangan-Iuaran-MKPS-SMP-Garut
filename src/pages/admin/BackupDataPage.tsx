import React, { useState } from 'react';
import { Database, Download, RefreshCw, CheckCircle, AlertTriangle, FileCode, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const BackupDataPage: React.FC = () => {
  const {
    anggotaList,
    iuranList,
    pemasukanList,
    pengeluaranList,
    settings,
    activityLogs,
    triggerSeedData,
    clearDatabase,
    loading,
  } = useApp();

  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  const handleDownloadJsonBackup = () => {
    const backupPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: settings.namaAplikasi,
      organisasi: settings.namaOrganisasi,
      data: {
        settings,
        anggota: anggotaList,
        iuran: iuranList,
        pemasukan: pemasukanList,
        pengeluaran: pengeluaranList,
        activityLogs,
      },
      summary: {
        totalAnggota: anggotaList.length,
        totalIuran: iuranList.length,
        totalPemasukan: pemasukanList.length,
        totalPengeluaran: pengeluaranList.length,
      },
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupPayload, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `backup_mkps_garut_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleReSeed = async () => {
    if (confirm('Apakah Anda ingin memuat ulang sampel data demo MKPS Garut? Data baru akan ditambahkan.')) {
      setSeeding(true);
      try {
        await triggerSeedData();
        alert('Data demo berhasil dimuat ulang!');
      } catch (err) {
        console.error(err);
      } finally {
        setSeeding(false);
      }
    }
  };

  const handleExecuteClear = async () => {
    setClearing(true);
    setIsConfirmClearOpen(false);
    try {
      await clearDatabase();
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert('Gagal membersihkan data: ' + err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800">Backup & Pemulihan Data</h2>
        <p className="text-xs text-slate-500 mt-1">
          Unduh salinan data terstruktur arsip keuangan dan keanggotaan MKPS SMP Kabupaten Garut.
        </p>
      </div>

      {downloadSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>File arsip JSON cadangan berhasil diunduh ke perangkat Anda!</span>
        </div>
      )}

      {/* Backup Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Export Seluruh Database (Format JSON)</h3>
            <p className="text-xs text-slate-500">
              Menyimpan seluruh data anggota, iuran, pemasukan, pengeluaran, dan pengaturan aplikasi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400">Data Anggota:</span>
            <p className="font-bold text-slate-800">{anggotaList.length} Record</p>
          </div>
          <div>
            <span className="text-slate-400">Data Iuran:</span>
            <p className="font-bold text-slate-800">{iuranList.length} Transaksi</p>
          </div>
          <div>
            <span className="text-slate-400">Pemasukan Kas:</span>
            <p className="font-bold text-slate-800">{pemasukanList.length} Record</p>
          </div>
          <div>
            <span className="text-slate-400">Pengeluaran Kas:</span>
            <p className="font-bold text-slate-800">{pengeluaranList.length} Record</p>
          </div>
        </div>

        <button
          onClick={handleDownloadJsonBackup}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
        >
          <Download className="w-4 h-4" />
          <span>Unduh File Cadangan JSON</span>
        </button>
      </div>

      {/* Note about cloud backups (Section AW) */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 text-xs text-amber-900 space-y-2">
        <div className="flex items-center space-x-2 font-bold text-amber-950">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Catatan Penting Mengenai Cadangan Cloud (Section AW)</span>
        </div>
        <p className="leading-relaxed">
          Penyimpanan data utama aplikasi ini berjalan secara permanen di <strong>Google Cloud Firestore</strong>. Ekspor berkas JSON di atas mencadangkan snapshot data level antarmuka. Untuk replikasi otomatis level storage GCP (misal: point-in-time recovery atau export bucket BigQuery), dapat dikonfigurasi melalui Google Cloud Console proyek Anda.
        </p>
      </div>

      {/* Bersihkan Seluruh Data (Mulai dari Awal) */}
      <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            <h3 className="text-sm font-bold text-rose-950">
              Bersihkan Seluruh Data (Mulai dari Nol)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Hapus semua data anggota dummy, riwayat iuran, transaksi pemasukan, dan pengeluaran agar Anda dapat memulai pencatatan kas riil dari awal.
          </p>
        </div>
        <button
          onClick={() => setIsConfirmClearOpen(true)}
          disabled={clearing || loading}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 shrink-0"
        >
          <Trash2 className="w-4 h-4" />
          <span>{clearing ? 'Membersihkan...' : 'Kosongkan Seluruh Data'}</span>
        </button>
      </div>

      {clearSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Seluruh data anggota dan transaksi berhasil dibersihkan! Database sekarang dalam keadaan kosong dan siap untuk pencatatan awal.</span>
        </div>
      )}

      {/* Re-seed demo data option */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Muat Ulang Sampel Data Demo</h3>
          <p className="text-xs text-slate-500">
            Gunakan opsi ini hanya jika Anda ingin mengisi kembali sampel data simulasi untuk keperluan pengujian.
          </p>
        </div>
        <button
          onClick={handleReSeed}
          disabled={seeding || loading || clearing}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
          <span>{seeding ? 'Memuat...' : 'Muat Demo'}</span>
        </button>
      </div>

      {/* Confirmation Modal Bersihkan Seluruh Data */}
      <ConfirmModal
        isOpen={isConfirmClearOpen}
        title="Konfirmasi Pengosongan Seluruh Data"
        message="Apakah Anda benar-benar yakin ingin MENGHAPUS SEMUA DATA ANGGOTA dan SELURUH TRANSAKSI KEUANGAN? Tindakan ini akan mengosongkan database Firestore agar Anda dapat memulai pencatatan dari awal. Tindakan ini tidak dapat dibatalkan!"
        confirmText="Ya, Bersihkan & Mulai Dari Awal"
        cancelText="Batal"
        isDanger={true}
        onConfirm={handleExecuteClear}
        onCancel={() => setIsConfirmClearOpen(false)}
      />
    </div>
  );
};
