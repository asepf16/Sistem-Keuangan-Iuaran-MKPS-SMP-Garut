import React, { useMemo } from 'react';
import { History, Receipt, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { formatRupiah, formatDateIndo, BULAN_NAMES } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';

export const AnggotaRiwayat: React.FC = () => {
  const { anggotaProfile } = useAuth();
  const { iuranList } = useApp();

  const riwayatList = useMemo(() => {
    if (!anggotaProfile) return [];
    return iuranList
      .filter((i) => i.anggotaId === anggotaProfile.id)
      .sort((a, b) => new Date(b.tanggalBayar).getTime() - new Date(a.tanggalBayar).getTime());
  }, [anggotaProfile, iuranList]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800">Riwayat Pembayaran Iuran Saya</h2>
        <p className="text-xs text-slate-500 mt-1">
          Daftar seluruh transaksi pelunasan iuran pengawas yang telah tercatat dan disahkan oleh Bendahara.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-bold text-center w-12">No</th>
                <th className="py-3 px-4 font-bold">No Transaksi</th>
                <th className="py-3 px-4 font-bold">Periode Iuran</th>
                <th className="py-3 px-4 font-bold text-right">Nominal</th>
                <th className="py-3 px-4 font-bold">Tanggal Pembayaran</th>
                <th className="py-3 px-4 font-bold">Keterangan</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riwayatList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Belum ada riwayat transaksi pembayaran iuran.
                  </td>
                </tr>
              ) : (
                riwayatList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {item.nomorTransaksi}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {BULAN_NAMES[item.bulan - 1]} {item.tahun}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {formatRupiah(item.nominal)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDateIndo(item.tanggalBayar)}</td>
                    <td className="py-3 px-4 text-slate-500">{item.keterangan || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={item.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
