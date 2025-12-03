'use client';

import React, { useEffect, useState } from 'react';
import { ChatWidget } from './ChatWidget';

/**
 * Wrapper del ChatWidget que obtiene el tenantId del usuario autenticado
 */
export const ChatWidgetWrapper: React.FC = () => {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // La respuesta devuelve { tenant: { id, name, slug } }
        if (data.tenant?.id) {
          setTenantId(data.tenant.id);
        }
      }
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // No mostrar nada mientras carga o si no hay tenant
  if (isLoading || !tenantId) {
    return null;
  }

  return <ChatWidget tenantId={tenantId} />;
};
