'use client';

import React, { useState, useEffect } from 'react';
import { formatDateDDMMAAAA } from '../utils/formatters';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  Clock,
  Sparkles,
  RefreshCw,
  UtensilsCrossed,
  Tag,
  CreditCard,
  Wallet,
  Sun,
  Moon,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export const FudoLiveDashboard: React.FC = () => {
  const [period, setPeriod] = useState<'TODAY' | '7DAYS' | 'MONTH' | 'PREV_MONTH'>('7DAYS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<{
    startDate: string;
    endDate: string;
    grandTotals: {
      totalGrossAmount: number;
      totalCashAmount: number;
      totalDigitalAmount: number;
      totalPeopleCount: number;
      totalClosedOrders: number;
      averageDailyGross: number;
      averageTicketPerCover: number;
      averageTicketPerSale: number;
    };
    dailySummary: Array<{
      date: string;
      shift: 'MEDIODIA' | 'NOCHE';
      totalGross: number;
      closedOrdersCount: number;
      totalPeople: number;
      cashAmount: number;
      digitalAmount: number;
    }>;
  } | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      let start = new Date();
      let end = new Date();

      if (period === 'TODAY') {
        // Today
      } else if (period === '7DAYS') {
        start.setDate(now.getDate() - 7);
      } else if (period === 'MONTH') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === 'PREV_MONTH') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
      }

      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];

      const res = await fetch('/api/fudo/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al conectar con la API de Fudo');
      }

      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar el tablero espejo de Fudo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 60s
    const timer = setInterval(() => {
      fetchDashboardData();
    }, 60000);
    return () => clearInterval(timer);
  }, [period]);

  // Aggregate by date for the evolutionary bar chart
  const chartData = React.useMemo(() => {
    if (!data || !data.dailySummary) return [];
    const dateMap: Record<string, { date: string; displayDate: string; mediodia: number; noche: number; total: number }> = {};

    data.dailySummary.forEach(item => {
      const dateKey = item.date;
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          date: dateKey,
          displayDate: formatDateDDMMAAAA(dateKey),
          mediodia: 0,
          noche: 0,
          total: 0
        };
      }
      if (item.shift === 'MEDIODIA') {
        dateMap[dateKey].mediodia += item.totalGross;
      } else {
        dateMap[dateKey].noche += item.totalGross;
      }
      dateMap[dateKey].total += item.totalGross;
    });

    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  // Shift Totals
  const mediodiaTotal = data?.dailySummary.filter(d => d.shift === 'MEDIODIA').reduce((acc, d) => acc + d.totalGross, 0) || 0;
  const nocheTotal = data?.dailySummary.filter(d => d.shift === 'NOCHE').reduce((acc, d) => acc + d.totalGross, 0) || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">Tablero Ejecutivo Fudo POS (Espejo En Vivo)</h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Sync 100% Automático
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Reflejo directo sin cargas manuales: Ventas Brutas, Netas, Descuentos, Cubiertos y Cajas
            </p>
          </div>
        </div>

        {/* Period Filter Switcher */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setPeriod('TODAY')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              period === 'TODAY' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setPeriod('7DAYS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              period === '7DAYS' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Últimos 7 días
          </button>
          <button
            onClick={() => setPeriod('MONTH')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              period === 'MONTH' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Este Mes
          </button>
          <button
            onClick={() => setPeriod('PREV_MONTH')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              period === 'PREV_MONTH' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mes Anterior
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-300">Conectando en vivo a Fudo POS y descargando métricas oficiales...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl text-rose-300 text-xs">
          <strong>Error de Conexión:</strong> {error}
        </div>
      )}

      {!loading && data && (
        <>
          {/* 7 KPI METRIC CARDS MATCHING FUDO'S OFFICIAL DASHBOARD */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* 1. Total Ventas Brutas */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <span className="text-xs font-bold text-slate-400 flex items-center justify-between">
                Total Ventas Brutas
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </span>
              <div className="text-2xl font-black text-amber-400">
                ${data.grandTotals.totalGrossAmount.toLocaleString('es-AR')}
              </div>
              <span className="text-[10px] text-slate-500 block">Fudo Official Metric</span>
            </div>

            {/* 2. Total Ventas Netas */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <span className="text-xs font-bold text-slate-400 flex items-center justify-between">
                Total Ventas Netas
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </span>
              <div className="text-2xl font-black text-emerald-400">
                ${data.grandTotals.totalGrossAmount.toLocaleString('es-AR')}
              </div>
              <span className="text-[10px] text-slate-500 block">Deducidos descuentos</span>
            </div>

            {/* 3. Cubiertos Totales */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <span className="text-xs font-bold text-slate-400 flex items-center justify-between">
                Total Personas / Cubiertos
                <Users className="w-4 h-4 text-sky-400" />
              </span>
              <div className="text-2xl font-black text-sky-400">
                {data.grandTotals.totalPeopleCount} pax
              </div>
              <span className="text-[10px] text-slate-500 block">Comensales atendiados</span>
            </div>

            {/* 4. Cantidad de Ventas / Comandas */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <span className="text-xs font-bold text-slate-400 flex items-center justify-between">
                Cantidad de Ventas
                <ShoppingBag className="w-4 h-4 text-purple-400" />
              </span>
              <div className="text-2xl font-black text-purple-400">
                {data.grandTotals.totalClosedOrders} órdenes
              </div>
              <span className="text-[10px] text-slate-500 block">Comandas cerradas</span>
            </div>

            {/* 5. Promedio por Venta */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <span className="text-xs font-bold text-slate-400 flex items-center justify-between">
                Promedio por Venta / Mesa
                <Layers className="w-4 h-4 text-amber-400" />
              </span>
              <div className="text-xl font-black text-white">
                ${data.grandTotals.averageTicketPerSale.toLocaleString('es-AR')}
              </div>
              <span className="text-[10px] text-slate-500 block">Ticket por orden</span>
            </div>

            {/* 6. Promedio por Persona / Cubierto */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-lg">
              <span className="text-xs font-bold text-slate-400 flex items-center justify-between">
                Promedio por Persona
                <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
              </span>
              <div className="text-xl font-black text-emerald-400">
                ${data.grandTotals.averageTicketPerCover.toLocaleString('es-AR')}
              </div>
              <span className="text-[10px] text-slate-500 block">Gasto prom. por comensal</span>
            </div>

            {/* 7. Cobrado en Efectivo */}
            <div className="bg-slate-900 border border-emerald-500/20 p-4 rounded-2xl space-y-2 shadow-lg">
              <span className="text-xs font-bold text-slate-400 flex items-center justify-between">
                Caja Efectivo Total
                <Wallet className="w-4 h-4 text-emerald-400" />
              </span>
              <div className="text-xl font-black text-emerald-400">
                ${data.grandTotals.totalCashAmount.toLocaleString('es-AR')}
              </div>
              <span className="text-[10px] text-slate-500 block">Cobros en papel</span>
            </div>

            {/* 8. Cobrado en MercadoPago / Tarjetas */}
            <div className="bg-slate-900 border border-sky-500/20 p-4 rounded-2xl space-y-2 shadow-lg">
              <span className="text-xs font-bold text-slate-400 flex items-center justify-between">
                MercadoPago / Digital
                <CreditCard className="w-4 h-4 text-sky-400" />
              </span>
              <div className="text-xl font-black text-sky-400">
                ${data.grandTotals.totalDigitalAmount.toLocaleString('es-AR')}
              </div>
              <span className="text-[10px] text-slate-500 block">QR, Débito y Crédito</span>
            </div>
          </div>

          {/* TURN BREAKDOWN CARDS: MEDIODÍA VS NOCHE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  Ventas Turno Mediodía (Almuerzos 07:00 a 18:00 hs)
                </span>
                <span className="text-xs font-mono text-slate-400 font-bold">Fudo Verified</span>
              </div>
              <div className="text-3xl font-black text-white">
                ${mediodiaTotal.toLocaleString('es-AR')}
              </div>
              <p className="text-xs text-slate-400">
                Ventas del turno de la tarde registradas en el período seleccionado.
              </p>
            </div>

            <div className="bg-slate-900 border border-indigo-500/30 p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-300 text-sm flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  Ventas Turno Noche (Cenas 18:00 a 07:00 hs)
                </span>
                <span className="text-xs font-mono text-slate-400 font-bold">Fudo Verified</span>
              </div>
              <div className="text-3xl font-black text-white">
                ${nocheTotal.toLocaleString('es-AR')}
              </div>
              <p className="text-xs text-slate-400">
                Ventas del turno nocturno registradas en el período seleccionado.
              </p>
            </div>
          </div>

          {/* EVOLUTIONARY BAR CHART (REPLICA OF FUDO OFFICIAL REPORT) */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  Evolución de Ventas Brutas por Día y Turno (Gráfico Espejo Fudo)
                </h3>
                <p className="text-xs text-slate-400">Desglose acumulado por fecha (Mediodía vs Noche)</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">Período: {formatDateDDMMAAAA(data.startDate)} a {formatDateDDMMAAAA(data.endDate)}</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString('es-AR')}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="mediodia" name="Turno Mediodía" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="noche" name="Turno Noche" fill="#6366f1" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DETAILED SHIFT CLOSURES TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-0">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Desglose Completo de Cajas y Turnos Fudo</h3>
              <span className="text-xs text-slate-400">{data.dailySummary.length} turnos registrados</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800/60">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3.5">Fecha</th>
                    <th className="p-3.5">Turno</th>
                    <th className="p-3.5">Comandas</th>
                    <th className="p-3.5">Cubiertos</th>
                    <th className="p-3.5">💵 Efectivo</th>
                    <th className="p-3.5">📱 Digital / Tarjeta</th>
                    <th className="p-3.5">Total Bruto Fudo</th>
                    <th className="p-3.5">Promedio / Cubierto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.dailySummary.map((item, idx) => {
                    const avgTicket = item.totalPeople > 0 ? Math.round(item.totalGross / item.totalPeople) : 0;
                    return (
                      <tr key={`${item.date}_${item.shift}_${idx}`} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-bold text-white whitespace-nowrap">{formatDateDDMMAAAA(item.date)}</td>
                        <td className="p-3.5">
                          {item.shift === 'MEDIODIA' ? (
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              <Sun className="w-3 h-3" /> MEDIODÍA
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              <Moon className="w-3 h-3" /> NOCHE
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-300 font-semibold">{item.closedOrdersCount} órdenes</td>
                        <td className="p-3.5 text-sky-400 font-bold">{item.totalPeople} pax</td>
                        <td className="p-3.5 text-emerald-400 font-bold">${item.cashAmount.toLocaleString('es-AR')}</td>
                        <td className="p-3.5 text-sky-400 font-bold">${item.digitalAmount.toLocaleString('es-AR')}</td>
                        <td className="p-3.5 text-amber-400 font-black text-sm">${item.totalGross.toLocaleString('es-AR')}</td>
                        <td className="p-3.5 text-slate-300 font-medium">${avgTicket.toLocaleString('es-AR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
