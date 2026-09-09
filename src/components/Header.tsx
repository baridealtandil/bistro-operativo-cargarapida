'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useGastronomy } from '../context/GastronomyContext';
import { Shield, User, Bell, Sparkles, AlertTriangle, Clock, DollarSign, CheckCircle2, X, LogOut } from 'lucide-react';

import { AdminPinModal } from './AdminPinModal';

interface HeaderProps {
  onOpenAiChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAiChat }) => {
  const {
    role,
    setRole,
    loginRole,
    logoutApp,
    primeCostPercentage,
    foodCostPercentage,
    laborCostPercentage,
    pendingChecksAmount7Days,
    pendingServicesAmount,
    totalSupplierDebt
  } = useGastronomy();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logoutApp();
  };

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute active business notifications dynamically
  const notifications: Array<{
    id: string;
    type: 'DANGER' | 'WARNING' | 'INFO';
    title: string;
    message: string;
    tag: string;
  }> = [];

  if (primeCostPercentage > 65) {
    notifications.push({
      id: 'primecost',
      type: 'DANGER',
      title: `Alerta de Prime Cost Elevado (${primeCostPercentage.toFixed(1)}%)`,
      message: `Costo conjunto de materia prima (${foodCostPercentage.toFixed(1)}%) y sueldos (${laborCostPercentage.toFixed(1)}%) supera el 65% recomendado para gastronomía. Revisa precios de proveedores o ajusta escandallos.`,
      tag: 'Crítico'
    });
  }

  if (pendingChecksAmount7Days > 0) {
    notifications.push({
      id: 'checks',
      type: 'WARNING',
      title: `Cheques Propios a Vencer: $${pendingChecksAmount7Days.toLocaleString('es-AR')}`,
      message: 'Compromisos de cheques emitidos a debitarse de la cuenta bancaria en los próximos 7 días.',
      tag: 'Próximos 7 días'
    });
  }

  if (pendingServicesAmount > 0) {
    notifications.push({
      id: 'services',
      type: 'WARNING',
      title: `Servicios Pendientes de Pago: $${pendingServicesAmount.toLocaleString('es-AR')}`,
      message: 'Facturas de luz, gas o abonos operativos vencidos o por vencer.',
      tag: 'Gasto Fijo'
    });
  }

  if (totalSupplierDebt > 0) {
    notifications.push({
      id: 'suppliers',
      type: 'INFO',
      title: `Deuda Total con Proveedores: $${totalSupplierDebt.toLocaleString('es-AR')}`,
      message: 'Saldo pendiente acumulado por facturas y remitos recibidos.',
      tag: 'Proveedores'
    });
  }

  const alertCount = notifications.length;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 px-4 py-5 md:py-6 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Title */}
        <div className="flex items-center space-x-4">
          <Image src="/cantina-pink-logo.png" alt="Cantina Pink" width={252} height={261} className="h-20 md:h-28 w-auto rounded-lg shrink-0" priority />
          <div>
            <h1 className="text-lg md:text-xl font-black text-amber-400">Bistro Operativo - Carga Rápida</h1>
            <p className="text-xs md:text-sm text-slate-400 hidden sm:block">Consola Simplificada de Operaciones y Data Entry</p>
          </div>
        </div>

        {/* Right Actions & Role Switcher */}
        <div className="flex items-center space-x-3">
          {/* AI Quick Button */}
          <button
            onClick={onOpenAiChat}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="hidden md:inline">Consultar a la</span> IA
          </button>

          {/* Interactive Bell Icon & Notifications Popover */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors relative flex items-center justify-center"
              title="Ver Alertas y Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                  {alertCount}
                </span>
              )}
            </button>

            {/* Notifications Popover Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-200 divide-y divide-slate-800">
                {/* Header */}
                <div className="p-3.5 bg-slate-900/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-white">Centro de Alertas & Notificaciones</span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body / List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map(n => {
                      return (
                        <div key={n.id} className="p-3.5 hover:bg-slate-900/50 transition-colors space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white flex items-center gap-1.5">
                              {n.type === 'DANGER' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                              {n.type === 'WARNING' && <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                              {n.type === 'INFO' && <DollarSign className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                              {n.title}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              n.type === 'DANGER'
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                                : n.type === 'WARNING'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                            }`}>
                              {n.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed pl-5">
                            {n.message}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <div className="text-xs font-bold text-slate-200">Sin Alertas Activas</div>
                      <p className="text-[11px] text-slate-500">
                        ¡Todo marcha en orden! El Prime Cost y los pagos se encuentran en niveles saludables.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-2.5 bg-slate-900/60 text-center">
                  <span className="text-[10px] text-slate-500">
                    Las alertas se calculan en tiempo real según el estado financiero.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Botón de Cerrar Sesión */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-2 rounded-xl font-bold transition-all active:scale-95 shadow-sm"
            title="Cerrar sesión e inhabilitar credenciales guardadas en este navegador"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
};
