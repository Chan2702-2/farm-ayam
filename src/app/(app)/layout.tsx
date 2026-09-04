import type { Metadata } from 'next';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Yuki Farm Mobile',
  description: 'Farm Management System',
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="bg-[#F0F6FA] min-h-screen">
        <AppHeader />
        <main className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto min-h-screen">
          {children}
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
