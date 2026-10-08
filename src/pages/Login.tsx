import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, ShieldCheck, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const { loginWithEmailOrNip, loginWithGoogle, demoLoginAsAdmin, demoLoginAsAnggota } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Masukkan NIP atau Email Anda.');
      return;
    }
    if (!password) {
      setError('Masukkan Password Anda.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await loginWithEmailOrNip(identifier, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError('NIP/Email atau password salah. Silakan periksa kembali.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Password tidak cocok.');
      } else {
        setError(err.message || 'Gagal masuk. Silakan gunakan Google Sign-In atau Demo Akun.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError('Gagal login dengan akun Google. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient blur background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Organization emblem */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-xl flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Building2 className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl font-extrabold text-white tracking-tight">
          MKPS SMP KABUPATEN GARUT
        </h2>
        <p className="mt-1 text-center text-xs font-medium text-emerald-400 uppercase tracking-widest">
          Sistem Keuangan Iuran Pengawas Sekolah
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Masuk ke Sistem</h3>
            <p className="text-xs text-slate-500">
              Gunakan NIP/Email untuk anggota, atau Google Auth untuk Pengurus MKPS
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2 animate-in fade-in">
              <span className="font-semibold shrink-0">Peringatan:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIP atau Email Anggota
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: 196803151994121002"
                  className="block w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Masuk Sekarang'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </form>

          {/* Google Sign-in */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-400 uppercase font-semibold">
                  Atau Masuk Dengan
                </span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-slate-300 rounded-lg shadow-xs bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Masuk dengan Akun Google
              </button>
            </div>
          </div>

          {/* Demo quick access buttons for evaluation */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Akses Cepat Pengujian (Mode Demo)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => demoLoginAsAdmin()}
                className="flex items-center justify-center p-2 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                Login Admin
              </button>
              <button
                type="button"
                onClick={() => demoLoginAsAnggota()}
                className="flex items-center justify-center p-2 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition"
              >
                <User className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
                Login Anggota
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Akun superadmin: <span className="font-mono">asepf16@guru.smp.belajar.id</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
