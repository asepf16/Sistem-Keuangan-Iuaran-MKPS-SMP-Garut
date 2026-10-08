import React, { useMemo } from 'react';
import {
  CreditCard,
  CheckCircle,
  Clock,
  User,
  Calendar,
  AlertCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { formatRupiah, BULAN_SHORT, BULAN_NAMES, formatDateIndo } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';

export const AnggotaDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { anggotaProfile, userProfile } = useAuth();
  const { iuranList, settings, selectedYear } = useApp();

  // Filter dues strictly for this member
  const memberDues = useMemo(() => {
    if (!anggotaProfile) return [];
    return iuranList.filter(
      (i) => i.anggotaId === anggotaProfile.id && i.tahun === selectedYear && i.status === 'lunas'
    );
  }, [iuranList, anggotaProfile, selectedYear]);

  // Map 12 months status
  const calendar12Months = useMemo(() => {
    return BULAN_SHORT.map((short, idx) => {
      const monthNum = idx + 1;
      const found = memberDues.find((i) => i.bulan === monthNum);
      return {
        monthIndex: monthNum,
        short,
        full: BULAN_NAMES[idx],
        isPaid: !!found,
        nominal: found ? found.nominal : settings.nominalIuran,
        paymentDate: found ? found.tanggalBayar : null,
        nomorTrx: found ? found.nomorTransaksi : null,
      };
    });
  }, [memberDues, settings.nominalIuran]);

  const jumlahLunas = calendar12Months.filter((m) => m.isPaid).length;
  const jumlahBelumLunas = 12 - jumlahLunas;
  const totalDibayar = memberDues.reduce((sum, item) => sum + item.nominal, 0);
  const totalKewajiban = 12 * settings.nominalIuran;
  const totalBelumDibayar = Math.max(0, totalKewajiban - totalDibayar);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wide border border-emerald-500/30">
            Portal Anggota Pengawas MKPS ({selectedYear})
          </span>
          <h1 className="text-xl sm:text-2xl font-bold mt-2">
            Selamat Datang, {anggotaProfile?.nama || userProfile?.nama}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            NIP: <span className="font-mono text-emerald-300 font-semibold">{anggotaProfile?.nip || '-'}</span> | Status: <span className="text-emerald-400 font-bold uppercase">{anggotaProfile?.status || 'Aktif'}</span>
          </p>
        </div>

        <button
          onClick={() => onNavigate('anggota-laporan')}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition"
        >
          <FileText className="w-4 h-4" />
          <span>Lihat Kuitansi & Laporan Saya</span>
        </button>
      </div>

      {/* 4 Cards Summary as requested in Section P */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Iuran Dibayar</span>
          <h3 className="text-2xl font-bold text-emerald-700 mt-2">{formatRupiah(totalDibayar)}</h3>
          <p className="text-xs text-emerald-600 font-medium mt-1">{jumlahLunas} Bulan Telah Dilunasi</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Iuran Belum Dibayar</span>
          <h3 className="text-2xl font-bold text-rose-700 mt-2">{formatRupiah(totalBelumDibayar)}</h3>
          <p className="text-xs text-rose-600 font-medium mt-1">{jumlahBelumLunas} Bulan Belum Lunas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Jumlah Bulan Lunas</span>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">{jumlahLunas} / 12 Bulan</h3>
          <p className="text-xs text-slate-500 mt-1">
            Persentase: {Math.round((jumlahLunas / 12) * 100)}%
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Besaran Iuran Bulanan</span>
          <h3 className="text-2xl font-bold text-blue-700 mt-2">
            {formatRupiah(settings.nominalIuran)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Ditetapkan per rapat MKPS</p>
        </div>
      </div>

      {/* Monthly Status Matrix (JAN ✓, FEB ✓, MAR ✕, etc.) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Status Iuran 12 Bulan ({selectedYear})
            </h3>
            <p className="text-xs text-slate-500">
              Tinjau status pelunasan iuran bulanan Anda sepanjang tahun anggaran ini.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center text-emerald-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
              Lunas (✓)
            </span>
            <span className="flex items-center text-rose-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 mr-1.5" />
              Belum Bayar (✕)
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {calendar12Months.map((m) => (
            <div
              key={m.short}
              className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                m.isPaid
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm tracking-wider">{m.short}</span>
                {m.isPaid ? (
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    ✓
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full bg-rose-400 text-white flex items-center justify-center font-bold text-xs">
                    ✕
                  </span>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/40 text-[11px]">
                <p className="font-semibold">{m.isPaid ? 'Lunas' : 'Belum Bayar'}</p>
                <p className="text-slate-500 text-[10px]">
                  {m.paymentDate ? formatDateIndo(m.paymentDate) : formatRupiah(m.nominal)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Riwayat Pembayaran Terbaru Saya */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Riwayat Pembayaran Saya</h3>
          <button
            onClick={() => onNavigate('anggota-riwayat')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
          >
            Lihat Semua Riwayat →
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          {memberDues.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              Belum ada riwayat pembayaran yang tercatat untuk tahun {selectedYear}.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2 font-semibold">No Transaksi</th>
                  <th className="pb-2 font-semibold">Bulan</th>
                  <th className="pb-2 font-semibold text-right">Nominal</th>
                  <th className="pb-2 font-semibold">Tanggal Bayar</th>
                  <th className="pb-2 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberDues.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 font-mono font-semibold text-slate-800">
                      {item.nomorTransaksi}
                    </td>
                    <td className="py-2.5 font-medium text-slate-800">
                      {BULAN_NAMES[item.bulan - 1]} {item.tahun}
                    </td>
                    <td className="py-2.5 text-right font-bold text-emerald-700">
                      {formatRupiah(item.nominal)}
                    </td>
                    <td className="py-2.5 text-slate-600">{formatDateIndo(item.tanggalBayar)}</td>
                    <td className="py-2.5 text-center">
                      <Badge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
