import React from 'react';
import { User, Shield, Calendar, Mail, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateIndo } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';

export const AnggotaProfil: React.FC = () => {
  const { anggotaProfile, userProfile } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800">Profil Saya</h2>
        <p className="text-xs text-slate-500 mt-1">
          Informasi keanggotaan dan identitas pengawas sekolah pada MKPS SMP Kabupaten Garut.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
            {anggotaProfile?.nama ? anggotaProfile.nama.charAt(0) : 'A'}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {anggotaProfile?.nama || userProfile?.nama}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              NIP: {anggotaProfile?.nip || 'Belum diisi'}
            </p>
            <div className="mt-2">
              <Badge status={anggotaProfile?.status || 'aktif'} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center mb-1">
              <User className="w-3.5 h-3.5 mr-1" />
              Nama Lengkap
            </span>
            <p className="font-bold text-slate-800">{anggotaProfile?.nama || userProfile?.nama}</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center mb-1">
              <FileText className="w-3.5 h-3.5 mr-1" />
              Nomor Induk Pegawai (NIP)
            </span>
            <p className="font-mono font-bold text-slate-800">{anggotaProfile?.nip || '-'}</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center mb-1">
              <Mail className="w-3.5 h-3.5 mr-1" />
              Email Terdaftar
            </span>
            <p className="text-slate-700">{anggotaProfile?.email || userProfile?.email || '-'}</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center mb-1">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Tanggal Terdaftar
            </span>
            <p className="text-slate-700">
              {formatDateIndo(anggotaProfile?.tanggalBergabung) || '2020'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
