import React, { useState, useEffect } from 'react';
import { User, Lock, CheckCircle, AlertCircle, Shield, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ProfilAdmin: React.FC = () => {
  const { userProfile, changePassword, updateProfileName, currentUser } = useAuth();

  const [adminName, setAdminName] = useState(userProfile?.nama || 'Imas Komariah');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (userProfile?.nama) {
      setAdminName(userProfile.nama);
    }
  }, [userProfile?.nama]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) return;
    setNameSaving(true);
    try {
      await updateProfileName(adminName.trim());
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui nama');
    } finally {
      setNameSaving(false);
    }
  };

  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await changePassword(newPassword);
      setSuccessMsg(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800">Profil Administrator</h2>
        <p className="text-xs text-slate-500 mt-1">
          Informasi akun pengelola dan keamanan kredensial login bendahara / admin sistem.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Password berhasil diperbarui!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            ADM
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">{userProfile?.nama || 'Imas Komariah'}</h3>
            <p className="text-xs text-slate-500">{userProfile?.email || currentUser?.email}</p>
            <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              <Shield className="w-3 h-3 mr-1" />
              Super Admin / Pengurus MKPS
            </span>
          </div>
        </div>

        {nameSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Nama tampilan admin berhasil diperbarui!</span>
          </div>
        )}

        <form onSubmit={handleSaveName} className="pt-3 border-t border-slate-100 flex items-end space-x-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Administrator (Ditampilkan di Sistem & Sidebar)
            </label>
            <input
              type="text"
              required
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Imas Komariah"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            disabled={nameSaving}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{nameSaving ? 'Menyimpan...' : 'Simpan Nama'}</span>
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>Ubah Password Akun</span>
        </h3>

        <form onSubmit={handleChangePass} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password Baru (Minimal 6 Karakter)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ulangi Password Baru
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  );
};
