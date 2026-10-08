import React, { useMemo } from 'react';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { formatRupiah, formatDateIndo, BULAN_NAMES } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';

export const AnggotaIuran: React.FC = () => {
  const { anggotaProfile } = useAuth();
  const { iuranList, settings, selectedYear } = useApp();

  const monthlyRecords = useMemo(() => {
    if (!anggotaProfile) return [];

    return BULAN_NAMES.map((name, idx) => {
      const monthNum = idx + 1;
      const payment = iuranList.find(
        (i) =>
          i.anggotaId === anggotaProfile.id &&
          i.tahun === selectedYear &&
          i.bulan === monthNum &&
          i.status === 'lunas'
      );

      return {
        bulan: name,
        bulanIndex: monthNum,
        tahun: selectedYear,
        kewajiban: settings.nominalIuran,
        nominal: payment ? payment.nominal : 0,
        tanggalBayar: payment ? payment.tanggalBayar : null,
        nomorTransaksi: payment ? payment.nomorTransaksi : null,
        status: payment ? ('lunas' as const) : ('belum_bayar' as const),
      };
    });
  }, [anggotaProfile, iuranList, selectedYear, settings.nominalIuran]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800">Status Iuran Bulanan Saya</h2>
        <p className="text-xs text-slate-500 mt-1">
          Daftar kewajiban dan status pembayaran iuran pengawas MKPS untuk Tahun {selectedYear}.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-bold text-center w-12">No</th>
                <th className="py-3 px-4 font-bold">Bulan</th>
                <th className="py-3 px-4 font-bold text-right">Kewajiban</th>
                <th className="py-3 px-4 font-bold text-right">Dibayar</th>
                <th className="py-3 px-4 font-bold">Tanggal Bayar</th>
                <th className="py-3 px-4 font-bold">No Kuitansi / Trx</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyRecords.map((m, idx) => (
                <tr key={m.bulan} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{m.bulan}</td>
                  <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(m.kewajiban)}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">
                    {m.nominal > 0 ? formatRupiah(m.nominal) : '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {m.tanggalBayar ? formatDateIndo(m.tanggalBayar) : '-'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{m.nomorTransaksi || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge status={m.status} />
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
