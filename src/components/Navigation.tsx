'use client';

import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Truck,
  Receipt,
  CheckSquare,
  Building2,
  Wallet,
  Users,
  UtensilsCrossed,
  Sparkles,
  Webhook,
  Handshake,
  Lock,
  Target,
  CreditCard
} from 'lucide-react';
import { useGastronomy } from '../context/GastronomyContext';

export type TabType =
  | 'dashboard'
  | 'fudo'
  | 'mercadopago'
  | 'ventas'
  | 'compras'
  | 'gastos'
  | 'presupuesto'
  | 'cheques'
  | 'bancos'
  | 'empleados'
  | 'socios'
  | 'platos'
  | 'ia'
  | 'make';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const COLAB_ALLOWED_TABS: TabType[] = [
  'dashboard',
  'fudo',
  'mercadopago',
  'ventas',
  'compras',
  'gastos',
  'presupuesto',
  'cheques',
  'bancos',
  'empleados',
  'socios',
  'platos',
  'ia',
  'make',
];

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { isEmployeesUnlocked, lockEmployees } = useGastronomy();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard BI', icon: LayoutDashboard },
    { id: 'fudo', label: 'Espejo Fudo POS', icon: UtensilsCrossed },
    { id: 'mercadopago', label: 'Conciliación MP', icon: CreditCard },
    { id: 'ventas', label: 'Ventas', icon: TrendingUp },
    { id: 'compras', label: 'Proveedores', icon: Truck },
    { id: 'gastos', label: 'Pagos', icon: Receipt },
    { id: 'presupuesto', label: 'Presupuesto', icon: Target },
    { id: 'cheques', label: 'Cheques', icon: CheckSquare },
    { id: 'bancos', label: 'Bancos', icon: Building2 },
    { id: 'empleados', label: 'Empleados', icon: Users, isLocked: !isEmployeesUnlocked },
    { id: 'socios', label: 'Socios', icon: Handshake },
    { id: 'ia', label: 'Asistente IA', icon: Sparkles },
    { id: 'make', label: 'Integración Make', icon: Webhook },
  ];

  const visibleItems = navItems;

  return (
    <>
      {/* Sidebar para Escritorio / Tablet */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-1 shrink-0">
        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Menú de Navegación
        </div>

        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.id === 'empleados' && isEmployeesUnlocked && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    lockEmployees();
                    if (activeTab === 'empleados') setActiveTab('dashboard');
                  }}
                  className={`ml-auto flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg font-bold transition-all shadow-sm ${
                    isActive
                      ? 'bg-slate-950/90 text-rose-400 hover:bg-slate-950 border border-slate-900/50'
                      : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                  }`}
                  title="Bloquear acceso al módulo de Empleados"
                >
                  <Lock className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>Cerrar</span>
                </span>
              )}
              {item.id === 'empleados' && !isEmployeesUnlocked && (
                <Lock className="ml-auto w-3.5 h-3.5 text-amber-400/80" />
              )}
              {item.id === 'ia' && (
                <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-md font-bold">
                  IA
                </span>
              )}
            </button>
          );
        })}
      </aside>

      {/* Bar de Navegación Inferior para Teléfonos Móviles */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-50 px-2 py-1.5 flex justify-around items-center overflow-x-auto">
        {visibleItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-all ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
