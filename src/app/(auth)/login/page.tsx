'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Warehouse,
  Clock
} from 'lucide-react';
import { initialUsers, setCurrentUser, getCurrentUser, AuthUser } from '@/lib/data/auth-users';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  useEffect(() => {
    // If user is already authenticated with active session, redirect to dashboard
    const user = getCurrentUser();
    if (user) {
      router.replace('/dashboard');
      return;
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isExpired = params.get('expired') === '1' || sessionStorage.getItem('yuki_session_expired') === '1';
      if (isExpired) {
        setSessionExpiredNotice(true);
      }
    }
  }, [router]);

  const performLogin = async (userParam?: AuthUser) => {
    setIsLoading(true);
    setError(null);

    try {
      if (userParam) {
        // Quick demo login
        setCurrentUser(userParam);
        router.push('/dashboard');
        return;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login gagal. Periksa username dan kata sandi.');
      }

      setCurrentUser(data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin();
  };

  return (
    <div className="min-h-screen bg-[#F0F6FA] flex flex-col justify-center items-center px-4 py-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-md space-y-4">
        {/* Header Branding */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white shadow-md shadow-sky-600/25 mb-1 font-jakarta font-extrabold text-xl">
            YF
          </div>
          <h1 className="font-jakarta font-extrabold text-2xl text-slate-900 tracking-tight">
            YUKI<span className="text-[#0284c7] ml-0.5">FARM</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
            Sistem ERP Peternakan Ayam Layer &bull; Akses Terbatas Pengawas Kandang
          </p>
        </div>

        {/* Session Expired Notice */}
        {sessionExpiredNotice && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 shadow-xs animate-in fade-in slide-in-from-top-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Sesi Telah Berakhir Otomatis</strong>
              <span className="leading-relaxed">
                Anda telah keluar secara otomatis karena tidak ada aktivitas selama 1 jam. Silakan login kembali untuk melanjutkan pekerjaan lapangan.
              </span>
            </div>
          </div>
        )}

        {/* Login Box */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-jakarta font-bold text-base text-slate-900">
                Masuk ke Akun
              </h2>
              <p className="text-xs text-slate-400">
                Gunakan ID Pengawas atau Username
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Username / ID Pengawas
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: pengawas_a, pengawas_b, admin"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] active:scale-95 text-white font-bold text-sm shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <span>Masuk Sekarang</span>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Pilih Akun Cepat (Pengawas Lapangan)
              </span>
              <span className="text-[10px] text-sky-600 font-semibold">1-Klik Masuk</span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar pr-0.5">
              {initialUsers.slice(0, 6).map((u) => {
                const isAdmin = u.role === 'ADMIN';
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => performLogin(u)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all hover:scale-[1.01] active:scale-95 ${
                      isAdmin
                        ? 'bg-sky-50/70 border-sky-200 hover:bg-sky-100/80'
                        : 'bg-slate-50/70 border-slate-200/70 hover:bg-amber-50/50 hover:border-amber-200'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">
                          {u.name}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                            isAdmin
                              ? 'bg-[#0284c7] text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isAdmin ? 'ADMIN' : 'PENGAWAS'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {u.title} &bull; {u.branchName}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-slate-400 block">
                        ID: {u.username}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-sky-50/60 rounded-2xl border border-sky-100 text-[11px] text-slate-600 flex items-start gap-2">
          <Warehouse className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
          <p>
            <strong>Hak Akses Per Cabang:</strong> Pengawas hanya dapat melihat, menginput, dan menganalisis seluruh data kandang di cabang binaannya (Pengawas A untuk Cabang 3 Alur, Pengawas B untuk Cabang Balai Rupih). Super Admin memiliki akses penuh ke seluruh cabang.
          </p>
        </div>
      </div>
    </div>
  );
}
