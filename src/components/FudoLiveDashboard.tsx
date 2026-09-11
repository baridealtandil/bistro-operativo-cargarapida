'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { formatDateDDMMAAAA } from '../utils/formatters';
import { DateRangePicker } from './DateRangePicker';
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
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle
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
  const [period, setPeriod] = useState<'TODAY' | '7DAYS' | 'MONTH' | 'PREV_MONTH' | 'CUSTOM'>('7DAYS');
  const [customStart, setCustomStart] = useState<string>('2026-09-01');
  const [customEnd, setCustomEnd] = useState<string>('2026-09-10');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscador Histórico State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterShift, setFilterShift] = useState<'TODOS' | 'MEDIODIA' | 'NOCHE'>('TODOS');
  const [filterState, setFilterState] = useState<'TODOS' | 'CLOSED' | 'IN-COURSE' | 'CANCELED'>('TODOS');

  const [data, setData] = useState<{
    startDate: string;
    endDate: string;
    todayStr: string;
    todaySummary: {
      totalGross: number;
      mediodiaGross: number;
      nocheGross: number;
      totalPeople: number;
      totalOrders: number;
      cashAmount: number;
      digitalAmount: number;
      avgTicketCover: number;
      avgTicketSale: number;
    };
    grandTotals: {
      totalGrossAmount: number;
      totalCashAmount: number;
      totalDigitalAmount: number;
      totalPeopleCount: number;
      totalClosedOrders: number;
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
    historicalSales: Array<{
      id: string;
      createdAt: string;
      date: string;
      hour: number;
      shift: 'MEDIODIA' | 'NOCHE';
      total: number;
      people: number;
      state: string;
      comment?: string;
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
        // start and end are today
      } else if (period === '7DAYS') {
        start.setDate(now.getDate() - 7);
      } else if (period === 'MONTH') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === 'PREV_MONTH') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
      } else if (period === 'CUSTOM') {
        if (customStart) start = new Date(customStart);
        if (customEnd) end = new Date(customEnd);
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
    // Auto-refresh every 30s for live data
    const timer = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(timer);
  }, [period, customStart, customEnd]);

  // Aggregate by date for the evolutionary bar chart
  const chartData = useMemo(() => {
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

  // Historical Sales filtered by search & selectors
  const filteredHistoricalSales = useMemo(() => {
    if (!data || !data.historicalSales) return [];
    return data.historicalSales.filter(sale => {
      if (filterShift !== 'TODOS' && sale.shift !== filterShift) return false;
      if (filterState !== 'TODOS' && sale.state !== filterState) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchId = sale.id.toLowerCase().includes(q);
        const matchComment = (sale.comment || '').toLowerCase().includes(q);
        const matchTotal = sale.total.toString().includes(q);
        const matchDate = formatDateDDMMAAAA(sale.date).includes(q);
        if (!matchId && !matchComment && !matchTotal && !matchDate) return false;
      }
      return true;
    });
  }, [data, filterShift, filterState, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 p-5 rounded-3xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">Espejo Fudo POS & Buscador Histórico</h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Sync 100% Automático
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualización en vivo de turnos, cajas, comandas y motor de búsqueda de facturación histórica
            </p>
          </div>
        </div>

        {/* Period Selector Buttons */}
        <div className="flex flex-wrap items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0 gap-1">
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
          <p className="text-sm font-bold text-slate-300">Descargando métricas y comandas en tiempo real desde Fudo POS...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl text-rose-300 text-xs">
          <strong>Error de Conexión:</strong> {error}
        </div>
      )}

      {!loading && data && (
        <>
          {/* TARJETA EN VIVO "HOY EN TIEMPO REAL" (DÍA EN CURSO) */}
          <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-3xl space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="text-base font-black text-white">DATOS EN VIVO HOY ({formatDateDDMMAAAA(data.todayStr)})</h3>
              </div>
              <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Actualizado automáticamente en tiempo real
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* 1. Mediodía Hoy */}
              <div className="bg-slate-950 border border-amber-500/30 p-3.5 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5" /> Mediodía Hoy
                </span>
                <div className="text-lg font-black text-white">
                  ${data.todaySummary.mediodiaGross.toLocaleString('es-AR')}
                </div>
                <span className="text-[9px] text-slate-500 block">07:00 a 18:00 hs</span>
              </div>

              {/* 2. Noche Hoy */}
              <div className="bg-slate-950 border border-indigo-500/30 p-3.5 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" /> Noche Hoy
                </span>
                <div className="text-lg font-black text-white">
                  ${data.todaySummary.nocheGross.toLocaleString('es-AR')}
                </div>
                <span className="text-[9px] text-slate-500 block">18:00 a 07:00 hs</span>
              </div>

              {/* 3. Total Facturado Hoy */}
              <div className="bg-slate-950 border border-emerald-500/30 p-3.5 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Total Hoy
                </span>
                <div className="text-lg font-black text-emerald-400">
                  ${data.todaySummary.totalGross.toLocaleString('es-AR')}
                </div>
                <span className="text-[9px] text-slate-500 block">{data.todaySummary.totalOrders} comandas</span>
              </div>

              {/* 4. Cubiertos Hoy */}
              <div className="bg-slate-950 border border-sky-500/30 p-3.5 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Cubiertos Hoy
                </span>
                <div className="text-lg font-black text-sky-400">
                  {data.todaySummary.totalPeople} pax
                </div>
                <span className="text-[9px] text-slate-500 block">Comensales</span>
              </div>

              {/* 5. Efectivo Hoy */}
              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Efectivo Hoy
                </span>
                <div className="text-lg font-black text-emerald-400">
                  ${data.todaySummary.cashAmount.toLocaleString('es-AR')}
                </div>
                <span className="text-[9px] text-slate-500 block">Cobrado en caja</span>
              </div>

              {/* 6. Digital Hoy */}
              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-sky-400" /> MercadoPago Hoy
                </span>
                <div className="text-lg font-black text-sky-400">
                  ${data.todaySummary.digitalAmount.toLocaleString('es-AR')}
                </div>
                <span className="text-[9px] text-slate-500 block">QR y Tarjetas</span>
              </div>
            </div>
          </div>

          {/* ACUMULADOS DEL PERÍODO SELECCIONADO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-slate-400">Total Período</span>
              <div className="text-2xl font-black text-amber-400">
                ${data.grandTotals.totalGrossAmount.toLocaleString('es-AR')}
              </div>
              <span className="text-[10px] text-slate-500 block">{data.grandTotals.totalClosedOrders} órdenes cerradas</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-slate-400">Cubiertos Período</span>
              <div className="text-2xl font-black text-sky-400">
                {data.grandTotals.totalPeopleCount} pax
              </div>
              <span className="text-[10px] text-slate-500 block">Promedio por pax: ${data.grandTotals.averageTicketPerCover.toLocaleString('es-AR')}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-slate-400">Efectivo Período</span>
              <div className="text-2xl font-black text-emerald-400">
                ${data.grandTotals.totalCashAmount.toLocaleString('es-AR')}
              </div>
              <span className="text-[10px] text-slate-500 block">Cobrado en papel</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-slate-400">MercadoPago Período</span>
              <div className="text-2xl font-black text-sky-400">
                ${data.grandTotals.totalDigitalAmount.toLocaleString('es-AR')}
              </div>
              <span className="text-[10px] text-slate-500 block">QR, Débito y Crédito</span>
            </div>
          </div>

          {/* GRÁFICO EVOLUTIVO DE VENTAS BRUTAS */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  Evolución Diaria de Ventas (Mediodía vs Noche)
                </h3>
                <p className="text-xs text-slate-400">Desglose exacto en fecha y hora Argentina (UTC-3)</p>
              </div>
              <span className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                {formatDateDDMMAAAA(data.startDate)} al {formatDateDDMMAAAA(data.endDate)}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString('es-AR')}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="mediodia" name="Turno Mediodía (07-18 hs)" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="noche" name="Turno Noche (18-07 hs)" fill="#6366f1" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BUSCADOR DE DATOS HISTÓRICOS DE FUDO */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-amber-400" />
                  Buscador de Datos Históricos de Fudo POS
                </h3>
                <p className="text-xs text-slate-400">Busca comandas por fecha, turno, nro de orden o texto libre</p>
              </div>

              {/* Unified Single Calendar DateRangePicker */}
              <div className="w-full sm:w-72">
                <DateRangePicker
                  startDate={customStart}
                  endDate={customEnd}
                  onChange={(start, end) => {
                    setCustomStart(start);
                    setCustomEnd(end);
                    setPeriod('CUSTOM');
                  }}
                />
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search text input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar por N° comanda, fecha o importe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs pl-9 pr-4 py-2.5 rounded-xl focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Shift Filter */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                <span className="text-[11px] text-slate-400 px-2 font-semibold">Turno:</span>
                <select
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value as any)}
                  className="bg-transparent text-white text-xs font-bold focus:outline-none flex-1"
                >
                  <option value="TODOS" className="bg-slate-900">Todos los turnos</option>
                  <option value="MEDIODIA" className="bg-slate-900">☀️ Turno Mediodía</option>
                  <option value="NOCHE" className="bg-slate-900">🌙 Turno Noche</option>
                </select>
              </div>

              {/* State Filter */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                <span className="text-[11px] text-slate-400 px-2 font-semibold">Estado:</span>
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value as any)}
                  className="bg-transparent text-white text-xs font-bold focus:outline-none flex-1"
                >
                  <option value="TODOS" className="bg-slate-900">Todos los estados</option>
                  <option value="CLOSED" className="bg-slate-900">✅ Cerradas</option>
                  <option value="IN-COURSE" className="bg-slate-900">⏳ En Curso</option>
                  <option value="CANCELED" className="bg-slate-900">❌ Canceladas</option>
                </select>
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3">N° Comanda</th>
                    <th className="p-3">Fecha (DD/MM/AAAA)</th>
                    <th className="p-3">Hora (ARG)</th>
                    <th className="p-3">Turno</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Cubiertos</th>
                    <th className="p-3 text-right">Importe Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {filteredHistoricalSales.length > 0 ? (
                    filteredHistoricalSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-400">#{sale.id}</td>
                        <td className="p-3 font-bold text-white whitespace-nowrap">{formatDateDDMMAAAA(sale.date)}</td>
                        <td className="p-3 font-mono text-slate-400">{sale.hour.toString().padStart(2, '0')}:00 hs</td>
                        <td className="p-3">
                          {sale.shift === 'MEDIODIA' ? (
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                              <Sun className="w-3 h-3" /> Mediodía
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                              <Moon className="w-3 h-3" /> Noche
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {sale.state === 'CLOSED' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Cerrada
                            </span>
                          ) : sale.state === 'CANCELED' ? (
                            <span className="inline-flex items-center gap-1 text-rose-400 text-[10px] font-bold">
                              <XCircle className="w-3 h-3 text-rose-400" /> Cancelada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400 text-[10px] font-bold">
                              <AlertCircle className="w-3 h-3 text-amber-400" /> En Curso
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-sky-400">{sale.people} pax</td>
                        <td className="p-3 text-right font-black text-white text-sm">
                          ${sale.total.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No se encontraron comandas con los criterios de búsqueda seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Mostrando {filteredHistoricalSales.length} comandas encontradas</span>
              <span>Rango: {formatDateDDMMAAAA(data.startDate)} a {formatDateDDMMAAAA(data.endDate)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
