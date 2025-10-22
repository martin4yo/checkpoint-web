'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Home,
  MapPin,
  Users,
  CheckCircle,
  Link as LinkIcon,
  LogOut,
  Bell,
  FileBarChart,
  Building2,
  FileText,
  Tag,
  User,
  Settings,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { useSidebar } from '@/contexts/SidebarContext';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  superuser: boolean;
  authorizesNovelties: boolean;
}

interface SubMenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuSection {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: SubMenuItem[];
}

export default function Sidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    if (pathname !== '/login') {
      fetchCurrentUser();
    }
  }, [pathname]);

  // Auto-expand section based on current path
  useEffect(() => {
    const configPaths = ['/users', '/places', '/assignments', '/novelty-types', '/push-devices', '/tenants'];
    if (configPaths.some(path => pathname.startsWith(path))) {
      setExpandedSection('Configuración');
    }
  }, [pathname]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const menuSections: MenuSection[] = [
    {
      name: 'Dashboard',
      icon: Home,
      href: '/'
    },
    {
      name: 'Checkpoints',
      icon: CheckCircle,
      href: '/checkpoints'
    },
    {
      name: 'Reporte Jornadas',
      icon: FileBarChart,
      href: '/journey-reports'
    },
    {
      name: 'Novedades',
      icon: FileText,
      href: '/novelties'
    },
    {
      name: 'Configuración',
      icon: Settings,
      children: [
        {
          name: 'Usuarios',
          href: '/users',
          icon: Users
        },
        {
          name: 'Lugares',
          href: '/places',
          icon: MapPin
        },
        {
          name: 'Asignaciones',
          href: '/assignments',
          icon: LinkIcon
        },
        {
          name: 'Tipos de Novedades',
          href: '/novelty-types',
          icon: Tag
        },
        {
          name: 'Notificaciones',
          href: '/push-devices',
          icon: Bell
        },
        {
          name: 'Tenants',
          href: '/tenants',
          icon: Building2
        }
      ]
    }
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar overflow-hidden">
      {/* Header */}
      <div className="flex h-16 items-center justify-center px-4 border-b border-sidebar-hover relative flex-shrink-0">
        <div className={clsx(
          "flex items-center space-x-3 transition-opacity duration-200 absolute left-4",
          isCollapsed && "opacity-0 pointer-events-none"
        )}>
          <div className="w-8 h-8 bg-palette-yellow rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-palette-dark" />
          </div>
          <h1 className="text-text-white font-semibold text-lg">Checkpoint</h1>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={clsx(
            "text-text-white hover:bg-sidebar-hover hidden lg:flex flex-shrink-0 transition-all duration-200 p-2 rounded-lg",
            isCollapsed ? "absolute" : "absolute right-4"
          )}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className={clsx(
        "flex-1 py-2 space-y-1 overflow-y-auto scrollbar-thin min-h-0",
        isCollapsed ? "px-2" : "px-4"
      )}>
        {menuSections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.name;
          const hasChildren = section.children && section.children.length > 0;
          const isActive = section.href && pathname === section.href;

          return (
            <div key={section.name} className="space-y-1">
              {/* Sección principal */}
              {section.href ? (
                // Sección con enlace directo
                <Link
                  href={section.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={clsx(
                    'flex items-center text-text-white rounded-lg cursor-pointer select-none w-full pointer-events-auto relative',
                    isActive && 'bg-sidebar-active',
                    isCollapsed ? 'justify-center h-12 p-2' : 'px-4 py-3'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className={clsx(
                      'truncate whitespace-nowrap font-medium',
                      isCollapsed && 'opacity-0 pointer-events-none w-0 overflow-hidden'
                    )}>
                      {section.name}
                    </span>
                  </div>
                </Link>
              ) : (
                // Sección con hijos - botón para expandir/contraer
                <button
                  onClick={() => {
                    if (isCollapsed) {
                      setIsCollapsed(false);
                      if (hasChildren) {
                        setExpandedSection(section.name);
                      }
                    } else {
                      setExpandedSection(isExpanded ? null : section.name);
                    }
                  }}
                  className={clsx(
                    'flex items-center text-text-white rounded-lg cursor-pointer select-none w-full pointer-events-auto relative',
                    isCollapsed ? 'justify-center h-12 p-2' : 'justify-between px-4 py-3'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className={clsx(
                      'truncate whitespace-nowrap font-medium',
                      isCollapsed && 'opacity-0 pointer-events-none w-0 overflow-hidden'
                    )}>
                      {section.name}
                    </span>
                  </div>
                  {!isCollapsed && hasChildren && (
                    <div className="flex-shrink-0">
                      <ChevronRight className={clsx(
                        "w-4 h-4 transition-transform duration-300 ease-in-out",
                        isExpanded && "rotate-90"
                      )} />
                    </div>
                  )}
                </button>
              )}

              {/* Elementos hijos */}
              {!isCollapsed && hasChildren && (
                <div className={clsx(
                  "ml-8 space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
                  isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}>
                  {section.children!.map((child) => {
                    const isChildActive = pathname === child.href;
                    const ChildIcon = child.icon;

                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={clsx(
                          'flex items-center text-text-white rounded-lg cursor-pointer select-none px-4 py-2 w-full pointer-events-auto relative',
                          isChildActive && 'bg-sidebar-active'
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <ChildIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm truncate whitespace-nowrap">
                            {child.name}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className={clsx(
        "border-t border-sidebar-hover transition-all duration-200",
        isCollapsed ? "px-2 py-6" : "p-4"
      )}>
        <div className={clsx(
          'mb-4 transition-all duration-200',
          isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'flex items-center space-x-3 opacity-100'
        )}>
          <div className="w-8 h-8 bg-palette-yellow rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-palette-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-white truncate">
              {currentUser?.name}
            </p>
            <p className="text-xs text-text-light truncate">
              {currentUser?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className={clsx(
            'text-text-white flex items-center transition-all duration-200 rounded-lg cursor-pointer',
            isCollapsed ? 'justify-center w-12 h-12 mx-auto px-0' : 'justify-start space-x-3 w-full py-3 px-4'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className={clsx(
            'transition-opacity duration-200 whitespace-nowrap',
            isCollapsed && 'opacity-0 pointer-events-none w-0 overflow-hidden'
          )}>
            Cerrar Sesión
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile hamburger button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-md bg-white shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {isMobileOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className={clsx(
        'hidden lg:flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 fixed top-0 left-0 h-full bg-sidebar shadow-lg border-r border-sidebar-hover z-50',
        isCollapsed ? 'w-20' : 'w-64'
      )}>
        {/* Logo Section */}
        <div className="bg-sidebar py-0">
          <div className="relative h-16 w-full flex items-center justify-center">
            <img
              src="/axioma_logo_invertido.png"
              alt="Axioma Logo"
              className="h-full w-auto object-contain p-3"
            />
          </div>
        </div>
        <div className="bg-sidebar border-b border-sidebar-hover" />
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-sidebar flex flex-col">
            {/* Logo Section for mobile */}
            <div className="bg-sidebar py-2">
              <div className="relative h-12 w-full flex items-center justify-center">
                <img
                  src="/axioma_logo_invertido.png"
                  alt="Axioma Logo"
                  className="h-full w-auto object-contain p-2"
                />
              </div>
            </div>
            <div className="bg-sidebar border-b border-sidebar-hover" />
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Sidebar spacer for desktop */}
      <div className={clsx(
        'hidden lg:block transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )} />
    </>
  );
}