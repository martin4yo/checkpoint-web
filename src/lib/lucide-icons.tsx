import * as Icons from 'lucide-react'
import { LucideProps } from 'lucide-react'

// Iconos disponibles para tipos de novedades
export const availableIcons = [
  { name: 'Plane', label: 'Avión (Vacaciones)' },
  { name: 'GraduationCap', label: 'Graduación (Estudios)' },
  { name: 'Briefcase', label: 'Maletín (Trabajo)' },
  { name: 'Heart', label: 'Corazón (Salud)' },
  { name: 'DollarSign', label: 'Dinero (Préstamos)' },
  { name: 'Calendar', label: 'Calendario (Fechas)' },
  { name: 'Clock', label: 'Reloj (Horarios)' },
  { name: 'FileText', label: 'Documento (General)' },
  { name: 'AlertCircle', label: 'Alerta (Urgente)' },
  { name: 'CheckCircle', label: 'Check (Aprobado)' },
  { name: 'XCircle', label: 'X (Rechazado)' },
  { name: 'Home', label: 'Casa (Hogar)' },
  { name: 'Car', label: 'Auto (Transporte)' },
  { name: 'Users', label: 'Usuarios (Equipo)' },
  { name: 'Star', label: 'Estrella (Destacado)' },
  { name: 'Award', label: 'Premio (Logro)' },
  { name: 'Coffee', label: 'Café (Descanso)' },
  { name: 'Zap', label: 'Rayo (Urgente)' },
  { name: 'Gift', label: 'Regalo (Beneficio)' },
  { name: 'TrendingUp', label: 'Tendencia (Crecimiento)' },
  { name: 'Shield', label: 'Escudo (Seguridad)' },
  { name: 'MapPin', label: 'Pin (Ubicación)' },
  { name: 'Phone', label: 'Teléfono (Contacto)' },
  { name: 'Mail', label: 'Correo (Email)' },
  { name: 'Bell', label: 'Campana (Notificación)' },
  { name: 'Clipboard', label: 'Portapapeles (Notas)' },
  { name: 'Folder', label: 'Carpeta (Archivos)' },
  { name: 'Tag', label: 'Etiqueta (Categoría)' },
  { name: 'Camera', label: 'Cámara (Foto)' },
  { name: 'MessageSquare', label: 'Mensaje (Chat)' },
]

// Colores predefinidos
export const availableColors = [
  { hex: '#3B82F6', name: 'Azul' },
  { hex: '#10B981', name: 'Verde' },
  { hex: '#F59E0B', name: 'Amarillo' },
  { hex: '#EF4444', name: 'Rojo' },
  { hex: '#8B5CF6', name: 'Púrpura' },
  { hex: '#EC4899', name: 'Rosa' },
  { hex: '#14B8A6', name: 'Turquesa' },
  { hex: '#F97316', name: 'Naranja' },
  { hex: '#6366F1', name: 'Índigo' },
  { hex: '#06B6D4', name: 'Cian' },
  { hex: '#84CC16', name: 'Lima' },
  { hex: '#64748B', name: 'Gris' },
]

interface DynamicIconProps extends LucideProps {
  name: string
}

// Componente para renderizar iconos dinámicamente
export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  const IconComponent = Icons[name as keyof typeof Icons] as React.ComponentType<LucideProps>

  if (!IconComponent) {
    // Fallback a FileText si el icono no existe
    return <Icons.FileText {...props} />
  }

  return <IconComponent {...props} />
}
