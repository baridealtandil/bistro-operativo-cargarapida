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
  Calendar,
  DownloadCloud
} from 'lucide-react';

interface FudoSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FudoSyncModal: React.FC<FudoSyncModalProps> = ({ isOpen, onClose }) => {
  const { addSale } = useGastronomy();

  const [activeTab, setActiveTab] = useState<'LIVE' | 'HISTORY'>('LIVE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Data State
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

  // History Importer State
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08'); // YYYY-MM
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<{
    startDate: string;
    endDate: string;
    daysCount: number;
    grandTotals: {
      totalGrossAmount: number;
      totalPeopleCount: number;
      totalClosedOrders: number;
      averageDailyGross: number;
      averageTicketPerCover: number;
    };
    dailySummary: Array<{
      date: string;
      totalGross: number;
      closedOrdersCount: number;
      totalPeople: number;
      cashEst: number;
      digitalEst: number;
    }>;
  } | null>(null);

  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  const fetchFudoLiveData = async () => {
    setLoading(true);
    setError(null);
    setImportSuccessMsg(null);

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

  const fetchFudoHistory = async () => {
    setHistoryLoading(true);
    setError(null);
    setImportSuccessMsg(null);

    try {
      // Calculate start and end date for selectedMonth (YYYY-MM)
      const [yearStr, monthStr] = selectedMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      const startDate = `${selectedMonth}-01`;
      // Last day of month
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${selectedMonth}-${lastDay < 10 ? '0' + lastDay : lastDay}`;

      const res = await fetch('/api/fudo/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al obtener historial de Fudo');
      }

      setHistoryData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'No se pudo descargar el historial de Fudo.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'LIVE') {
        fetchFudoLiveData();
      } else {
        fetchFudoHistory();
      }
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleImportToSales = () => {
    if (!fudoData || !fudoData.summary) return;

    const totalAmount = fudoData.summary.totalSalesAmount;
    if (totalAmount <= 0) {
      alert('No hay ventas registradas en Fudo para importar en esta fecha.');
      return;
    }

    const todayStr = fudoData.targetDate || new Date().toISOString().split('T')[0];

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

    setImportSuccessMsg('¡Venta de hoy actualizada correctamente sin duplicados!');
    setTimeout(() => setImportSuccessMsg(null), 4000);
  };

  const handleImportMonthHistory = () => {
    if (!historyData || historyData.dailySummary.length === 0) return;

    let importedCount = 0;
    historyData.dailySummary.forEach(day => {
      if (day.totalGross > 0) {
        addSale({
          date: day.date,
          shift: 'NOCHE',
          covers: day.totalPeople || 1,
          channel: 'SALON',
          paymentMethod: 'MERCADO_PAGO',
          grossAmount: day.totalGross,
          commissionAmount: 0,
          notes: `Importado automáticamente desde Fudo POS (API Histórico) - ${day.closedOrdersCount} órdenes`,
        });
        importedCount++;
      }
    });

    setImportSuccessMsg(`¡Éxito! Se importaron/actualizaron ${importedCount} días de ventas de ${selectedMonth}.`);
    setTimeout(() => setImportSuccessMsg(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-0 text-white animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900 border-b border-slate-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Consola de Integración Fudo POS</h3>
                <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  API En Vivo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sincronización en tiempo real e importador masivo de meses históricos
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6">
          <button
            onClick={() => setActiveTab('LIVE')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'LIVE'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sincronización de Hoy (En Vivo)
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'HISTORY'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            Importar Histórico por Meses
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-rose-200 text-sm">Error de Comunicación</strong>
                {error}
              </div>
            </div>
          )}

          {importSuccessMsg && (
            <div className="bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between text-emerald-300 text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-bold">{importSuccessMsg}</span>
              </div>
            </div>
          )}

          {/* TAB 1: LIVE SYNC */}
          {activeTab === 'LIVE' && (
            <>
              {loading && (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">Conectando con Fudo y descargando datos en vivo...</p>
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
            </>
          )}

          {/* TAB 2: HISTORICAL MONTH IMPORTER */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-5">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Seleccionar Mes a Importar desde Fudo
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white text-xs font-bold p-2.5 rounded-xl flex-1 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <button
                    onClick={fetchFudoHistory}
                    disabled={historyLoading}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
                    Consultar Histórico
                  </button>
                </div>
              </div>

              {historyLoading && (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">Descargando todas las comandas y cajas de {selectedMonth} desde Fudo...</p>
                </div>
              )}

              {!historyLoading && historyData && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 block font-bold">Venta Total Mes</span>
                      <div className="text-lg font-black text-amber-400">${historyData.grandTotals.totalGrossAmount.toLocaleString('es-AR')}</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 block font-bold">Días Registrados</span>
                      <div className="text-lg font-black text-white">{historyData.daysCount} días</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 block font-bold">Total Cubiertos</span>
                      <div className="text-lg font-black text-sky-400">{historyData.grandTotals.totalPeopleCount} pax</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 block font-bold">Prom. Cubierto</span>
                      <div className="text-lg font-black text-purple-400">${historyData.grandTotals.averageTicketPerCover.toLocaleString('es-AR')}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-300">Cajas Diarias Encontradas en Fudo</h4>
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 max-h-48 overflow-y-auto custom-scrollbar">
                      {historyData.dailySummary.map(day => (
                        <div key={day.date} className="p-3 flex items-center justify-between text-xs hover:bg-slate-900/50">
                          <div>
                            <span className="font-bold text-white block">{day.date}</span>
                            <span className="text-[10px] text-slate-400">
                              {day.closedOrdersCount} órdenes · {day.totalPeople} cubiertos
                            </span>
                          </div>
                          <span className="font-black text-amber-400">
                            ${day.totalGross.toLocaleString('es-AR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={activeTab === 'LIVE' ? fetchFudoLiveData : fetchFudoHistory}
            disabled={loading || historyLoading}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || historyLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-xl border border-slate-800 transition-all"
            >
              Cerrar
            </button>
            {activeTab === 'LIVE' ? (
              <button
                onClick={handleImportToSales}
                disabled={loading || !fudoData || fudoData.summary.totalSalesAmount <= 0}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <span>Sincronizar Venta de Hoy</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleImportMonthHistory}
                disabled={historyLoading || !historyData || historyData.dailySummary.length === 0}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Importar Mes Completo a la Herramienta</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
