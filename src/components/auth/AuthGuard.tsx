'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  getCurrentUser,
  recordUserActivity,
  checkSessionExpired,
  logoutUser,
  INACTIVITY_TIMEOUT_MS,
  AuthUser
} from '@/lib/data/auth-users';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean>(false);
  const lastRecordRef = useRef<number>(0);

  // Throttled activity recorder (at most once every 30 seconds to prevent lag and excessive storage writes)
  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastRecordRef.current > 30000) {
      lastRecordRef.current = now;
      recordUserActivity();
    }
  }, []);

  const verifyAuth = useCallback(() => {
    // If session has timed out due to 1-hour inactivity
    if (checkSessionExpired()) {
      logoutUser(true);
      setAuthorized(false);
      router.replace('/login?expired=1');
      return false;
    }

    const user = getCurrentUser();
    if (!user) {
      setAuthorized(false);
      router.replace('/login');
      return false;
    }

    setAuthorized(true);
    return true;
  }, [router]);

  useEffect(() => {
    const isAuthed = verifyAuth();
    if (!isAuthed) return;

    recordUserActivity();

    // Only listen to discrete user actions (NO mousemove or scroll which cause high CPU/jank)
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // 2. Periodic background check every 15 seconds
    const intervalId = setInterval(() => {
      if (checkSessionExpired()) {
        logoutUser(true);
        setAuthorized(false);
        router.replace('/login?expired=1');
      }
    }, 15000);

    // 3. Check immediately when tab regains focus or visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (checkSessionExpired()) {
          logoutUser(true);
          setAuthorized(false);
          router.replace('/login?expired=1');
        } else {
          recordUserActivity();
        }
      }
    };

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [verifyAuth, handleUserActivity, router, pathname]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#F0F6FA] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white flex items-center justify-center font-jakarta font-extrabold text-xl shadow-md shadow-sky-600/25 animate-pulse">
            YF
          </div>
          <div className="text-center">
            <h3 className="font-jakarta font-bold text-sm text-slate-800">
              Memverifikasi Sesi Operasional
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sistem Biosecurity &bull; Autentikasi Pengawas Kandang
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
