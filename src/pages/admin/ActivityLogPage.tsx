import React, { useState, useMemo } from 'react';
import { History, Search, Filter, ShieldAlert, Clock, User } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { formatDateTimeIndo } from '../../utils/formatters';

export const ActivityLogPage: React.FC = () => {
  const { activityLogs } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [modulFilter, setModulFilter] = useState('all');

  const modulOptions = [
    'Autentikasi',
    'Data Anggota',
    'Iuran Bulanan',
    'Pemasukan',
    'Pengeluaran',
    'Pengaturan',
    'Sistem',
  ];

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchModul = modulFilter === 'all' || log.modul === modulFilter;
      const matchSearch =
        log.aktivitas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.namaUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.detail && log.detail.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchModul && matchSearch;
    });
  }, [activityLogs, modulFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800">Activity Log & Jejak Audit Sistem</h2>
        <p className="text-xs text-slate-500 mt-1">
          Rekaman kronologis setiap perubahan transaksi, pengelolaan anggota, dan aktivitas keamanan sistem untuk keperluan audit transparansi.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari aktivitas, nama pengguna, atau rincian..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={modulFilter}
            onChange={(e) => setModulFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Modul Log</option>
            {modulOptions.map((m) => (
              <option key={m} value={m}>
                Modul {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity Log List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Riwayat Aktivitas Terakhir</h3>
          <span className="text-xs text-slate-500">{filteredLogs.length} catatan log</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              Belum ada log aktivitas tercatat.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/80 transition flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800">{log.aktivitas}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600">
                        {log.modul}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDateTimeIndo(log.timestamp)}
                    </span>
                  </div>
                  {log.detail && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{log.detail}</p>
                  )}
                  <div className="mt-2 flex items-center space-x-2 text-[11px] text-slate-400">
                    <User className="w-3.5 h-3.5" />
                    <span>
                      Oleh: <strong className="text-slate-700">{log.namaUser}</strong> ({log.role})
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
