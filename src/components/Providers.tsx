'use client';

import { SidebarProvider } from '@/contexts/SidebarContext';
import { TenantProvider } from '@/contexts/TenantContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider>
      <SidebarProvider>
        {children}
      </SidebarProvider>
    </TenantProvider>
  );
}
