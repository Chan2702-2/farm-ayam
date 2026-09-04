'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share2, PlusSquare, Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(true); // default true to prevent flash
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker for full PWA eligibility
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.log('Service Worker registration skipped:', err));
    }

    // 2. Check if already running in standalone mode (already installed app)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      return; // No need to show prompt if user is already inside the installed PWA
    }

    // 3. Check if user dismissed the prompt in this session
    const isDismissed = sessionStorage.getItem('yuki_install_dismissed') === '1';

    // 4. Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    if (!isDismissed) {
      // Show banner after 1.5 seconds for pleasant entrance
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);

      // Listen for Android/Chrome beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowBanner(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Native Android/Chrome prompt
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      // Show iOS step-by-step guide
      setShowIOSGuide(true);
    } else {
      // Browser doesn't support native trigger (e.g. desktop or non-Chrome)
      alert(
        'Untuk memasang aplikasi:\n1. Buka menu browser (titik 3 di kanan atas)\n2. Pilih "Install Aplikasi" atau "Tambahkan ke Layar Utama".'
      );
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('yuki_install_dismissed', '1');
  };

  if (isStandalone || !showBanner) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom PWA Install Banner */}
      <aside aria-label="Install Aplikasi Yuki Farm" className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
        <div className="p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-sky-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* App Icon */}
            <div className="w-11 h-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center p-1 shadow-xs shrink-0 overflow-hidden">
              <img src="/icons/logoyf.png" alt="Yuki Farm" className="w-full h-full object-contain" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-jakarta font-bold text-xs sm:text-sm text-slate-900 truncate">
                  Install Aplikasi Yuki Farm
                </h4>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold shrink-0">
                  Gratis
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                {isIOS
                  ? 'Pasang di layar utama iPhone Anda'
                  : 'Akses cepat di layar utama HP Anda'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>

            <button
              onClick={handleDismiss}
              aria-label="Tutup"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Step-by-Step Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#0284c7]" />
                <h3 className="font-jakarta font-bold text-sm text-slate-900">
                  Cara Install di iPhone / iPad
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-3 p-3 bg-sky-50/70 rounded-2xl border border-sky-100">
                <div className="w-7 h-7 rounded-xl bg-[#0284c7] text-white flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-800">Ketuk Tombol Bagikan (Share)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    Ikon panah keluar <Share2 className="w-3.5 h-3.5 text-[#0284c7] inline" /> di bilah bawah browser Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-sky-50/70 rounded-2xl border border-sky-100">
                <div className="w-7 h-7 rounded-xl bg-[#0284c7] text-white flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-800">Pilih &quot;Tambahkan ke Layar Utama&quot;</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    Gulir ke bawah dan ketuk <PlusSquare className="w-3.5 h-3.5 text-[#0284c7] inline" /> <b>Tambahkan ke Layar Utama</b> (Add to Home Screen).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-emerald-900">
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px]">
                  Selesai! Ikon <strong>Yuki Farm</strong> akan muncul di layar depan HP seperti aplikasi resmi dari App Store.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs transition-colors"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
