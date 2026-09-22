'use client';

import * as React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { SidebarMobileContent } from '@/components/layout/sidebar-mobile-content';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { X } from 'lucide-react';
import { DataProvider } from '@/lib/data-provider';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/lib/auth';
import { usePathname, useRouter } from 'next/navigation';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [authLoading, user, router, pathname]);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024) {
      setCollapsed(true);
    }
  }, []);

  if (authLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-fg">Checking your session…</div>;
  }

  return (
    <DataProvider>
      <div className="min-h-screen bg-background">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />

        <div
          className={`transition-all duration-250 ease-in-out ${
            collapsed ? 'md:pl-[76px]' : 'md:pl-64'
          }`}
        >
          <Topbar onOpenMobileSidebar={() => setMobileOpen(true)} />
          <main className="min-h-[calc(100vh-4rem)] px-4 pb-20 pt-6 md:px-8 md:pb-6">
            {children}
          </main>
        </div>

        <MobileBottomNav />

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="w-72 border-0 p-0 sidebar-bg"
          >
            <SidebarMobileContent />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 text-white/70 hover:text-white focus-ring rounded-sm"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </SheetContent>
        </Sheet>

        <Toaster position="top-right" />
      </div>
    </DataProvider>
  );
}
