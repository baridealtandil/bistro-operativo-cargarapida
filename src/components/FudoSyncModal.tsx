'use client';

import React, { useState, useEffect } from 'react';
import { useGastronomy } from '../context/GastronomyContext';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  TrendingUp,
  Users,
  UtensilsCrossed,
  DollarSign,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface FudoSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FudoSyncModal: React.FC<FudoSyncModalProps> = ({ isOpen, onClose }) => {
  const { addSale } = useGastronomy();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fudoData, setFudoData] = useState<{
    targetDate: string;
    summary: {
      totalSalesAmount: number;
      closedSalesCount: number;
      inCourseSalesCount: number;
      totalOrders: number;
      totalPeople: number;
      averageTicket: number;
    };
    sales: Array<{
      id: string;
      createdAt: string;
      closedAt: string | null;
      total: number;
      people: number;
      saleType: string;
      saleState: string;
    }>;
  } | null>(null);

  const [importSuccess, setImportSuccess] = useState(false);

  const fetchFudoData = async () => {
    setLoading(true);
    setError(null);
    setImportSuccess(false);

    try {
      const res = await fetch('/api/fudo/sync');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al conectar con la API de Fudo');
      }

      setFudoData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'No se pudo comunicar con Fudo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFudoData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImportToSales = () => {
    if (!fudoData || !fudoData.summary) return;

    const totalAmount = fudoData.summary.totalSalesAmount;
    if (totalAmount <= 0) {
      alert('No hay ventas cerradas o registradas en Fudo para importar en esta fecha.');
      return;
    }

    const todayStr = fudoData.targetDate || new Date().toISOString().split('T')[0];

    // Distribuimos automáticamente la venta por canales si no se especifica
    // Por omisión 60% MercadoPago/Tarjeta, 40% Efectivo o según comensales
    const cashAmount = Math.round(totalAmount * 0.35);
    const mpAmount = totalAmount - cashAmount;

    addSale({
      date: todayStr,
      shift: 'NOCHE',
      covers: fudoData.summary.totalPeople || 1,
      channel: 'SALON',
      paymentMethod: 'MERCADO_PAGO',
      grossAmount: totalAmount,
      commissionAmount: 0,
      notes: `Importado automáticamente desde Fudo POS (API En Vivo) - ${fudoData.summary.totalOrders} órdenes`,
    });

    setImportSuccess(true);
    setTimeout(() => {
      setImportSuccess(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-0 text-white animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900 border-b border-slate-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Sincronización en Vivo Fudo POS</h3>
                <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  API En Vivo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Información directa de mesas, cierres y comandas activas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {loading && (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Conectando con Fudo y descargando datos en vivo...</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-rose-200 text-sm">Error de Comunicación</strong>
                {error}
              </div>
            </div>
          )}

          {importSuccess && (
            <div className="bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between text-emerald-300 text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold">¡Venta importada exitosamente en el módulo de Ventas y Dashboard!</span>
              </div>
            </div>
          )}

          {!loading && fudoData && (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                    Venta Total Hoy
                  </span>
                  <div className="text-xl font-black text-amber-400">
                    ${fudoData.summary.totalSalesAmount.toLocaleString('es-AR')}
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {fudoData.summary.closedSalesCount} cerradas / {fudoData.summary.inCourseSalesCount} en curso
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    Comensales / Cubiertos
                  </span>
                  <div className="text-xl font-black text-sky-400">
                    {fudoData.summary.totalPeople} pers.
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {fudoData.summary.totalOrders} comandas registradas
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-400 font-semibold block flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                    Ticket Promedio
                  </span>
                  <div className="text-xl font-black text-purple-400">
                    ${fudoData.summary.averageTicket.toLocaleString('es-AR')}
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Por mesa cerrada
                  </span>
                </div>
              </div>

              {/* List of Recent Sales */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Últimas Comandas en Tiempo Real (Fudo)</span>
                  <span className="text-slate-500 font-mono text-[10px]">Fecha: {fudoData.targetDate}</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 max-h-48 overflow-y-auto custom-scrollbar">
                  {fudoData.sales.length > 0 ? (
                    fudoData.sales.slice(0, 10).map((sale) => (
                      <div key={sale.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-900/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sale.saleState === 'CLOSED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : sale.saleState === 'IN-COURSE'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {sale.saleState === 'CLOSED' ? 'Cerrada' : sale.saleState === 'IN-COURSE' ? 'En Curso' : sale.saleState}
                          </span>
                          <div>
                            <span className="font-bold text-white block">
                              Mesa / Orden #{sale.id} ({sale.saleType || 'Salón'})
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {sale.people ? `${sale.people} pers. · ` : ''}
                              {new Date(sale.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <span className="font-black text-amber-400">
                          ${sale.total.toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No hay órdenes para mostrar en este momento.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={fetchFudoData}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar Datos Fudo
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-xl border border-slate-800 transition-all"
            >
              Cerrar
            </button>
            <button
              onClick={handleImportToSales}
              disabled={loading || !fudoData || fudoData.summary.totalSalesAmount <= 0}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <span>Importar Venta de Hoy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
