'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';

interface TenantOption {
  id: string;
  name: string;
  slug: string;
}

export function TenantSelector() {
  const { currentUser, selectedTenant, tenants, switchTenant, isLoading: contextLoading } = useTenant();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Auto-select first tenant if none is selected
  useEffect(() => {
    if (currentUser && !selectedTenant && tenants.length > 0 && !contextLoading) {
      console.log('🏢 [TenantSelector] Auto-selecting first tenant:', tenants[0].name);
      handleTenantChange(tenants[0].id);
    }
  }, [currentUser, selectedTenant, tenants, contextLoading]);

  const handleTenantChange = async (tenantId: string) => {
    if (tenantId === selectedTenant?.id) return;

    console.log('🔄 [TenantSelector] Changing tenant:', tenantId);
    setLoading(true);
    try {
      await switchTenant(tenantId);
      console.log('✅ [TenantSelector] Tenant changed successfully');

      // Refresh the page to reload data with new tenant
      router.refresh();
    } catch (error) {
      console.error('❌ [TenantSelector] Error changing tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show if not superuser or no tenants available
  if (!currentUser?.superuser || tenants.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-secondary to-secondary/90 border-b border-secondary/20 shadow-sm">
      <div className="flex items-center space-x-3">
        <Building2 className="h-5 w-5 text-white" />
        <span className="text-sm font-semibold text-white">Organización:</span>

        <select
          value={selectedTenant?.id || ''}
          onChange={(e) => {
            console.log('🔄 [TenantSelector] Select onChange triggered:', e.target.value);
            handleTenantChange(e.target.value);
          }}
          disabled={loading || contextLoading}
          className="min-w-[280px] h-9 bg-white/95 border border-white/30 rounded-md px-3 text-sm font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {tenants.map((tenantOption) => (
            <option key={tenantOption.id} value={tenantOption.id}>
              {tenantOption.name} {tenantOption.slug && `(${tenantOption.slug})`}
            </option>
          ))}
        </select>

        {loading && (
          <span className="text-xs text-white/80 bg-white/20 px-2 py-1 rounded animate-pulse">
            Cargando...
          </span>
        )}
      </div>

      {!selectedTenant && tenants.length > 0 && (
        <span className="text-xs text-white bg-red-500 px-3 py-1 rounded-full font-medium">
          Sin organización seleccionada
        </span>
      )}
    </div>
  );
}
