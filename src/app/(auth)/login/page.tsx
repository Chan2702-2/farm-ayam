'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Simulate API call
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      if (res.ok) {
        router.push('/dashboard')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.message || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      setError('An error occurred during login. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F6FA] flex flex-col pt-12 pb-8 px-4 font-['Plus_Jakarta_Sans',sans-serif] items-center">
      <div className="w-full max-w-[420px] flex flex-col flex-grow">
        
        {/* Logo & Headline */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#e0f2fe] to-transparent opacity-50"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-[#0284c7] relative z-10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
          </div>
          
          <div className="px-3 py-1 bg-[#e0f2fe] rounded-full flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#0284c7] animate-pulse"></span>
            <span className="text-[11px] font-semibold text-[#0369a1] tracking-wide">AGRI-OS BIOSECURE CORE</span>
          </div>
          
          <h1 className="text-3xl font-extrabold text-[#0369a1] tracking-tight">YUKI<span className="text-[#0284c7]">FARM</span></h1>
          <p className="text-[#3f4850] text-sm mt-1">Sistem Manajemen Peternakan Modern</p>
        </div>

        {/* Offline Ready Banner */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 mb-6 flex items-start gap-3 border border-white/40 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#0284c7] mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          <div>
            <h3 className="text-sm font-semibold text-[#131b2e]">Offline-Ready Mode Aktif</h3>
            <p className="text-xs text-[#3f4850] mt-0.5 leading-relaxed">Data akan otomatis tersinkronisasi ketika koneksi internet kembali tersedia.</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-[#131b2e] mb-1">Masuk ke Akun</h2>
          <p className="text-sm text-[#3f4850] mb-6">Silakan masukkan kredensial Anda</p>
          
          {error && (
            <div className="bg-[#fee2e2] text-[#dc2626] text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#131b2e]">Email / ID Pengguna</label>
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] focus:bg-white focus:border-[#0284c7] focus:ring-2 focus:ring-[#e0f2fe] transition-all outline-none text-[#131b2e] text-sm"
                placeholder="Masukkan email atau ID"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#131b2e]">Kata Sandi</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-4 pr-12 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] focus:bg-white focus:border-[#0284c7] focus:ring-2 focus:ring-[#e0f2fe] transition-all outline-none text-[#131b2e] text-sm"
                  placeholder="Masukkan kata sandi"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#0284c7]"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-[#cbd5e1] text-[#0284c7] focus:ring-[#0284c7]" />
                <span className="text-sm text-[#3f4850]">Ingat saya</span>
              </label>
              <a href="#" className="text-sm font-semibold text-[#0284c7] hover:underline">Lupa kata sandi?</a>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 mt-2 bg-[#0369a1] hover:bg-[#0284c7] active:bg-[#075985] text-white rounded-xl font-bold transition-colors shadow-[0_4px_12px_rgba(3,105,161,0.25)] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Masuk'}
            </button>
          </form>
        </div>

        {/* Bottom Indicators */}
        <div className="mt-auto grid grid-cols-2 gap-3">
          <div className="bg-white/80 rounded-lg p-3 flex flex-col items-center justify-center shadow-sm">
            <span className="text-xs text-[#64748b] mb-1">Site Aktif</span>
            <span className="text-sm font-bold text-[#131b2e]">Farm Cikijing</span>
          </div>
          <div className="bg-white/80 rounded-lg p-3 flex flex-col items-center justify-center shadow-sm">
            <span className="text-xs text-[#64748b] mb-1">Status Sistem</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              <span className="text-sm font-bold text-[#10b981]">Normal</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-[#94a3b8]">
          &copy; {new Date().getFullYear()} Yuki Farm • v2.0.1
        </div>
      </div>
    </div>
  )
}
