'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  ShieldCheck,
  Info,
  Calendar,
  Layers,
  Check,
  XCircle,
  HelpCircle,
  Smartphone
} from 'lucide-react';

interface MpFudoReconciliationBoardProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  fudoMpSalesAmount?: number; // Total MP sales from Fudo
  fudoTotalSalesAmount?: number; // Total Sales from Fudo
}

export const MpFudoReconciliationBoard: React.FC<MpFudoReconciliationBoardProps> = ({
  startDate,
  endDate,
  fudoMpSalesAmount,
  fudoTotalSalesAmount,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'RECONCILED' | 'UNMATCHED_FUDO' | 'UNMATCHED_MP' | 'FUDO_CASH' | 'POSNET_OTHER' | 'PEDIDOS_YA' | 'MP_TIP' | 'EGRESOS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExplanation, setShowExplanation] = useState(true);

  const fetchReconciliation = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);
    setData(null); // Wipe previous data so the screen reflects fresh state
    try {
      const res = await fetch('/api/mercadopago/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify({ startDate, endDate }),
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || 'Error al obtener datos de conciliación de Mercado Pago');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error al conectar con el servidor para la conciliación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, [startDate, endDate]);

  const kpis = data?.kpis || {};
  const rows: any[] = data?.reconciliationRows || [];

  // Category totals
  const reconciledRows = useMemo(() => rows.filter(r => r.status === 'RECONCILED'), [rows]);
  const unmatchedFudoRows = useMemo(() => rows.filter(r => r.status === 'UNMATCHED_FUDO'), [rows]);
  const unmatchedMpRows = useMemo(() => rows.filter(r => r.status === 'UNMATCHED_MP'), [rows]);
  const fudoCashRows = useMemo(() => rows.filter(r => r.status === 'FUDO_CASH'), [rows]);
  const pedidosYaRows = useMemo(() => rows.filter(r => r.status === 'PEDIDOS_YA'), [rows]);
  const posnetOtherRows = useMemo(() => rows.filter(r => r.status === 'POSNET_OTHER'), [rows]);
  const mpTipRows = useMemo(() => rows.filter(r => r.status === 'MP_TIP'), [rows]);
  const egresosRows = useMemo(() => rows.filter(r => r.status === 'EGRESO_MP'), [rows]);

  const reconciledTotal = useMemo(() => reconciledRows.reduce((sum, r) => sum + (r.fudoTotal || 0), 0), [reconciledRows]);
  const unmatchedFudoTotal = useMemo(() => unmatchedFudoRows.reduce((sum, r) => sum + (r.fudoTotal || 0), 0), [unmatchedFudoRows]);
  const unmatchedMpTotal = useMemo(() => unmatchedMpRows.reduce((sum, r) => sum + (r.mpGross || 0), 0), [unmatchedMpRows]);
  const fudoCashTotal = useMemo(() => fudoCashRows.reduce((sum, r) => sum + (r.fudoTotal || 0), 0), [fudoCashRows]);
  const pedidosYaTotal = useMemo(() => pedidosYaRows.reduce((sum, r) => sum + (r.fudoTotal || 0), 0), [pedidosYaRows]);
  const posnetOtherTotal = useMemo(() => posnetOtherRows.reduce((sum, r) => sum + (r.fudoTotal || 0), 0), [posnetOtherRows]);

  // Total Fudo MP Declared Amount
  const fudoMpDeclared = reconciledTotal + unmatchedFudoTotal;

  const mpGrossTotal = kpis.mpGrossTotal || 0;
  const mpNetTotal = kpis.mpNetTotal || 0;
  const mpFeesTotal = kpis.mpFeesTotal || 0;
  const mpTaxesTotal = kpis.mpTaxesTotal || 0;
  const mpEgresosTotal = kpis.mpEgresosTotal || 0;
  const totalDeductions = mpFeesTotal + mpTaxesTotal;

  // Real gap / difference between Fudo MP sales and Mercado Pago API Real
  const difference = fudoMpDeclared - mpGrossTotal;
  const isBalanced = difference === 0 && unmatchedFudoRows.length === 0;

  // Filtered rows for drilldown table
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (activeTab === 'RECONCILED' && r.status !== 'RECONCILED') return false;
      if (activeTab === 'UNMATCHED_FUDO' && r.status !== 'UNMATCHED_FUDO') return false;
      if (activeTab === 'UNMATCHED_MP' && r.status !== 'UNMATCHED_MP') return false;
      if (activeTab === 'FUDO_CASH' && r.status !== 'FUDO_CASH') return false;
      if (activeTab === 'PEDIDOS_YA' && r.status !== 'PEDIDOS_YA') return false;
      if (activeTab === 'POSNET_OTHER' && r.status !== 'POSNET_OTHER') return false;
      if (activeTab === 'MP_TIP' && r.status !== 'MP_TIP') return false;
      if (activeTab === 'EGRESOS' && r.status !== 'EGRESO_MP') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchFudoId = r.fudoSaleId ? String(r.fudoSaleId).toLowerCase().includes(q) : false;
        const matchMpId = r.mpPaymentId ? String(r.mpPaymentId).toLowerCase().includes(q) : false;
        const matchPm = r.fudoPmName ? String(r.fudoPmName).toLowerCase().includes(q) : false;
        const matchDevice = r.mpDevice ? String(r.mpDevice).toLowerCase().includes(q) : false;
        const matchDesc = r.mpDescription ? String(r.mpDescription).toLowerCase().includes(q) : false;
        const matchAmount = (r.fudoTotal || r.mpGross || 0).toString().includes(q);
        return matchFudoId || matchMpId || matchPm || matchDevice || matchDesc || matchAmount;
      }
      return true;
    });
  }, [rows, activeTab, searchQuery]);

  return (
    <div className="bg-slate-900 border border-sky-500/30 rounded-3xl p-5 sm:p-6 space-y-6 shadow-2xl">
      {/* HEADER BANNER OF RECONCILIATION BOARD */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 shadow-lg">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-black text-white tracking-tight">
                Conciliación Directa: Ventas Fudo MP ↔ Cobros Mercado Pago
              </h3>
              {loading ? (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Sincronizando...
                </span>
              ) : isBalanced ? (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Conciliado 100% Sin Diferencias
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Descalce: ${Math.abs(difference).toLocaleString('es-AR')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verificación directa entre lo facturado en Fudo como Mercado Pago y los ingresos reales recibidos en la cuenta de Mercado Pago
            </p>
          </div>
        </div>

        <button
          onClick={fetchReconciliation}
          disabled={loading}
          className="self-start lg:self-auto px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar & Conciliar</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 CORE KPI CARDS OF CONCILIATION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. FUDO MP SALES */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-sky-500/40 relative overflow-hidden space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-sky-400" /> Ventas Fudo (Mercado Pago)
            </span>
            <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded-full">
              Fudo POS
            </span>
          </div>
          <div className="text-2xl font-black text-sky-400">
            ${fudoMpDeclared.toLocaleString('es-AR')}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Registrado en Fudo como Mercado Pago
          </div>
        </div>

        {/* 2. REAL MP API GROSS INCOMES */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 relative overflow-hidden space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Cobros MP (API Real)
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
              Mercado Pago
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ${mpGrossTotal.toLocaleString('es-AR')}
          </div>
          <div className="text-[11px] text-emerald-300/80 font-medium flex items-center gap-1">
            <span>Neto abonado: <strong>${mpNetTotal.toLocaleString('es-AR')}</strong></span>
          </div>
        </div>

        {/* 3. DEDUCTIONS: COMMISSIONS & SIRTAC TAXES */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/40 relative overflow-hidden space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-indigo-400" /> Comisiones & Retenciones
            </span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full">
              SIRTAC + MP
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-300">
            -${totalDeductions.toLocaleString('es-AR')}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Comisiones: ${mpFeesTotal.toLocaleString('es-AR')} | Impuestos: ${mpTaxesTotal.toLocaleString('es-AR')}
          </div>
        </div>

        {/* 4. GAP / DIFFERENCE */}
        <div className={`bg-slate-950 p-4 rounded-2xl border ${
          isBalanced 
            ? 'border-emerald-500/50' 
            : difference > 0 
              ? 'border-amber-500/50' 
              : 'border-rose-500/50'
        } relative overflow-hidden space-y-2 shadow-lg`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Estado / Descalce
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isBalanced ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {isBalanced ? 'OK' : 'Diferencia'}
            </span>
          </div>
          <div className={`text-2xl font-black ${
            isBalanced 
              ? 'text-emerald-400' 
              : difference > 0 
                ? 'text-amber-400' 
                : 'text-rose-400'
          }`}>
            {difference > 0 ? '+' : ''}${difference.toLocaleString('es-AR')}
          </div>
          <div className="text-[11px] text-slate-300 font-medium">
            {isBalanced 
              ? 'Ventas Fudo MP coinciden 100% con MP' 
              : difference > 0
                ? 'Fudo registra más MP que lo cobrado en MP'
                : 'Mercado Pago cobró más de lo registrado en Fudo'}
          </div>
        </div>
      </div>

      {/* AUTO-DIAGNOSTIC & EXPLANATION BOX */}
      {showExplanation && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-3 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <Info className="w-4 h-4 text-sky-400" />
              <span>Análisis Detallado del Estado de Conciliación</span>
            </div>
            <button
              onClick={() => setShowExplanation(false)}
              className="text-slate-500 hover:text-slate-300 text-[11px] font-medium"
            >
              Ocultar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {/* Matched */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ventas Conciliadas 1 a 1
              </div>
              <div className="text-lg font-black text-white">
                ${reconciledTotal.toLocaleString('es-AR')}
              </div>
              <div className="text-[10px] text-slate-400">
                {reconciledRows.length} ventas coincidentes en Fudo y Mercado Pago.
              </div>
            </div>

            {/* Fudo MP without MP */}
            <div className="bg-rose-950/30 border border-rose-500/30 p-3 rounded-xl space-y-1">
              <div className="font-bold text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Fudo MP / QR sin cobro en MP
              </div>
              <div className="text-lg font-black text-white">
                ${unmatchedFudoTotal.toLocaleString('es-AR')}
              </div>
              <div className="text-[10px] text-slate-400">
                {unmatchedFudoRows.length} ventas QR/Point MP declaradas sin cobro en MP.
              </div>
            </div>

            {/* PedidosYa (Plataforma Externa) */}
            <div className="bg-rose-950/20 border border-rose-500/20 p-3 rounded-xl space-y-1">
              <div className="font-bold text-rose-300 flex items-center gap-1.5">
                <span className="text-xs">📱</span>
                Ventas PedidosYa (Liq. Plataforma)
              </div>
              <div className="text-lg font-black text-white">
                ${pedidosYaTotal.toLocaleString('es-AR')}
              </div>
              <div className="text-[10px] text-slate-400">
                {pedidosYaRows.length} órdenes cobradas por PedidosYa (no ingresan a MP).
              </div>
            </div>

            {/* Tarjetas sin cobro en MP (Posible Efectivo / Error Selección) */}
            <div className="bg-purple-950/30 border border-purple-500/30 p-3 rounded-xl space-y-1">
              <div className="font-bold text-purple-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                Tarjetas s/ Cobro MP (Posible Efectivo)
              </div>
              <div className="text-lg font-black text-white">
                ${posnetOtherTotal.toLocaleString('es-AR')}
              </div>
              <div className="text-[10px] text-slate-400">
                {posnetOtherRows.length} ventas declaradas como Tarjeta sin cobro en MP (Error / Cobrado en Efectivo).
              </div>
            </div>

            {/* Fudo Cash */}
            <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl space-y-1">
              <div className="font-bold text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Ventas Fudo en Efectivo
              </div>
              <div className="text-lg font-black text-white">
                ${fudoCashTotal.toLocaleString('es-AR')}
              </div>
              <div className="text-[10px] text-slate-400">
                {fudoCashRows.length} ventas en efectivo descontadas del cálculo MP.
              </div>
            </div>

            {/* MP without Fudo */}
            <div className="bg-sky-950/30 border border-sky-500/30 p-3 rounded-xl space-y-1">
              <div className="font-bold text-sky-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Cobradas en MP s/ Registro Fudo
              </div>
              <div className="text-lg font-black text-white">
                ${unmatchedMpTotal.toLocaleString('es-AR')}
              </div>
              <div className="text-[10px] text-slate-400">
                {unmatchedMpRows.length} cobros en MP no cargados en Fudo POS.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABS & SEARCH DRILLDOWN TABLE */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'ALL'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Todos ({rows.length})
            </button>

            <button
              onClick={() => setActiveTab('RECONCILED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'RECONCILED'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Conciliados 🟢 ({reconciledRows.length})
            </button>

            <button
              onClick={() => setActiveTab('UNMATCHED_FUDO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'UNMATCHED_FUDO'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Descalce QR/MP 🔴 ({unmatchedFudoRows.length})
            </button>

            <button
              onClick={() => setActiveTab('PEDIDOS_YA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'PEDIDOS_YA'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              PedidosYa 📱 ({pedidosYaRows.length})
            </button>

            <button
              onClick={() => setActiveTab('POSNET_OTHER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'POSNET_OTHER'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Tarjetas s/ MP 💳 ({posnetOtherRows.length})
            </button>

            <button
              onClick={() => setActiveTab('FUDO_CASH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'FUDO_CASH'
                  ? 'bg-slate-800 text-emerald-300 border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Efectivo Fudo 💵 ({fudoCashRows.length})
            </button>

            <button
              onClick={() => setActiveTab('MP_TIP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'MP_TIP'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Propinas MP 🪙 ({mpTipRows.length})
            </button>

            <button
              onClick={() => setActiveTab('UNMATCHED_MP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'UNMATCHED_MP'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Solo en MP 🟡 ({unmatchedMpRows.length})
            </button>

            <button
              onClick={() => setActiveTab('EGRESOS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'EGRESOS'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Egresos MP 💸 ({egresosRows.length})
            </button>
          </div>

          {/* Search box */}
          <div className="relative shrink-0 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por ID, monto o medio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-white text-xs pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Table of Reconciliation Rows */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Fecha / Turno</th>
                <th className="py-3 px-4">Estado Conciliación</th>
                <th className="py-3 px-4 text-right">Venta Fudo</th>
                <th className="py-3 px-4 text-right">Cobro MP (Bruto)</th>
                <th className="py-3 px-4 text-right">Comisión / Impuesto</th>
                <th className="py-3 px-4 text-right">Neto MP</th>
                <th className="py-3 px-4">Dispositivo / Concepto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    {loading ? 'Cargando movimientos...' : 'No se encontraron movimientos para el filtro seleccionado.'}
                  </td>
                </tr>
              ) : (
                filteredRows.slice(0, 50).map((row, idx) => {
                  const isReconciled = row.status === 'RECONCILED';
                  const isUnmatchedFudo = row.status === 'UNMATCHED_FUDO';
                  const isUnmatchedMp = row.status === 'UNMATCHED_MP';
                  const isFudoCash = row.status === 'FUDO_CASH';
                  const isPedidosYa = row.status === 'PEDIDOS_YA';
                  const isPosnetOther = row.status === 'POSNET_OTHER';
                  const isMpTip = row.status === 'MP_TIP';
                  const isEgreso = row.status === 'EGRESO_MP';

                  return (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                      {/* Date / Shift */}
                      <td className="py-2.5 px-4 font-mono text-[11px]">
                        <div className="font-bold text-white">{row.fudoDate || row.mpDate}</div>
                        <span className="text-[9px] text-slate-500">{row.fudoShift || 'N/A'}</span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-4">
                        {isReconciled && (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3 text-emerald-400" /> Conciliado
                          </span>
                        )}
                        {isUnmatchedFudo && (
                          <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3 text-rose-400" /> Fudo MP s/ MP
                          </span>
                        )}
                        {isPedidosYa && (
                          <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            📱 PedidosYa
                          </span>
                        )}
                        {isPosnetOther && (
                          <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            💳 Tarjeta s/ MP (Posible Efectivo)
                          </span>
                        )}
                        {isFudoCash && (
                          <span className="inline-flex items-center gap-1 bg-slate-800 text-emerald-300 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <DollarSign className="w-3 h-3 text-emerald-400" /> Efectivo Fudo
                          </span>
                        )}
                        {isMpTip && (
                          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <DollarSign className="w-3 h-3 text-amber-400" /> Propina MP
                          </span>
                        )}
                        {isUnmatchedMp && (
                          <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <TrendingUp className="w-3 h-3 text-indigo-400" /> Solo MP
                          </span>
                        )}
                        {isEgreso && (
                          <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <ArrowUpRight className="w-3 h-3 text-rose-400" /> Egreso MP
                          </span>
                        )}
                      </td>

                      {/* Fudo Sale Amount */}
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-sky-400">
                        {row.fudoTotal > 0 ? `$${row.fudoTotal.toLocaleString('es-AR')}` : '-'}
                        {row.fudoSaleId && (
                          <span className="text-[9px] text-slate-500 block">#{row.fudoSaleId}</span>
                        )}
                      </td>

                      {/* MP Gross Amount */}
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {row.mpGross > 0 ? `$${row.mpGross.toLocaleString('es-AR')}` : '-'}
                        {row.mpPaymentId && (
                          <span className="text-[9px] text-slate-500 block">ID: {row.mpPaymentId}</span>
                        )}
                      </td>

                      {/* Fee + Tax */}
                      <td className="py-2.5 px-4 text-right font-mono text-slate-400 text-[11px]">
                        {(row.mpFee > 0 || row.mpTax > 0) ? (
                          <span className="text-amber-400/90 font-semibold">
                            -${(row.mpFee + row.mpTax).toLocaleString('es-AR')}
                          </span>
                        ) : '-'}
                      </td>

                      {/* MP Net Amount */}
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                        {row.mpNet > 0 ? `$${row.mpNet.toLocaleString('es-AR')}` : '-'}
                      </td>

                      {/* Device / Description */}
                      <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                        <div className="font-medium text-slate-200 truncate max-w-[200px]">
                          {row.mpDevice || 'Point N950 / QR'}
                        </div>
                        <span className="text-[9px] text-slate-500 truncate block max-w-[200px]">
                          {row.mpDescription || 'Cobro registrado'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {filteredRows.length > 50 && (
            <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-center text-xs text-slate-400">
              Mostrando los primeros 50 registros de {filteredRows.length}. Usa los filtros para afinar la búsqueda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
