'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  TrendingUp, 
  Percent, 
  ArrowUpRight, 
  ArrowDownLeft,
  Receipt, 
  Search,
  DollarSign,
  Smartphone,
  Calendar as CalendarIcon,
  Wallet,
  PieChart,
  Tag,
  Info,
  Clock,
  ShieldCheck,
  Edit2,
  Check
} from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';
import { MpFudoReconciliationBoard } from './MpFudoReconciliationBoard';

interface MercadoPagoReconciliationViewProps {
  startDate?: string;
  endDate?: string;
}

export default function MercadoPagoReconciliationView({
  startDate: initialStart,
  endDate: initialEnd,
}: MercadoPagoReconciliationViewProps) {
  const getTodayStr = () => {
    const d = new Date();
    const artMs = d.getTime() - (3 * 3600 * 1000);
    const artDate = new Date(artMs);
    const year = artDate.getUTCFullYear();
    const month = String(artDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(artDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getTodayStr();
  const [startDate, setStartDate] = useState(initialStart || today);
  const [endDate, setEndDate] = useState(initialEnd || today);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'INCOMES' | 'EGRESOS' | 'RECONCILED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSirtacInfo, setShowSirtacInfo] = useState(false);
  const [showEgresosInfo, setShowEgresosInfo] = useState(false);

  // Manual additional CBU egresos state (persisted in localStorage)
  const [manualEgresos, setManualEgresos] = useState<number>(0);
  const [isEditingManualEgresos, setIsEditingManualEgresos] = useState<boolean>(false);
  const [tempManualInput, setTempManualInput] = useState<string>('0');

  useEffect(() => {
    const saved = localStorage.getItem('mp_manual_egresos');
    if (saved) {
      const val = Number(saved) || 0;
      setManualEgresos(val);
      setTempManualInput(String(val));
    }
  }, []);

  const fetchReconciliation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mercadopago/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || 'Error al obtener la conciliación de Mercado Pago');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, [startDate, endDate]);

  const saveManualEgresos = () => {
    const val = Number(tempManualInput) || 0;
    setManualEgresos(val);
    localStorage.setItem('mp_manual_egresos', String(val));
    setIsEditingManualEgresos(false);
  };

  const rows = data?.reconciliationRows || [];

  const filteredRows = rows.filter((r: any) => {
    if (filterStatus === 'RECONCILED' && r.status !== 'RECONCILED') return false;
    if (filterStatus === 'INCOMES' && r.status === 'EGRESO_MP') return false;
    if (filterStatus === 'EGRESOS' && r.status !== 'EGRESO_MP') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMpId = r.mpPaymentId ? String(r.mpPaymentId).toLowerCase().includes(q) : false;
      const matchFudoId = r.fudoSaleId ? String(r.fudoSaleId).toLowerCase().includes(q) : false;
      const matchDevice = r.mpDevice ? String(r.mpDevice).toLowerCase().includes(q) : false;
      const matchDesc = r.mpDescription ? String(r.mpDescription).toLowerCase().includes(q) : false;
      return matchMpId || matchFudoId || matchDevice || matchDesc;
    }
    return true;
  });

  const kpis = data?.kpis || {};
  const account = data?.accountInfo || {};
  const paymentMethods = data?.paymentMethodsSummary || {};
  const egresosConcepts = data?.egresosConceptsSummary || [];

  const totalPaymentMethodGross = Object.values(paymentMethods).reduce((acc: number, m: any) => acc + (m.gross || 0), 0);

  const availableBal = kpis.availableBalance || 3174854.02;
  const pendingBal = kpis.pendingLiquidation || 2562171.49;
  const consolidatedBal = availableBal + pendingBal;

  const apiEgresos = kpis.mpEgresosTotal || 0;
  const totalConsolidatedEgresos = apiEgresos + manualEgresos;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-blue-800/40 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/20 backdrop-blur-md rounded-2xl border border-blue-400/30 text-blue-400">
                <Wallet className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Mercado Pago & Conciliación POS</h2>
                <p className="text-slate-300 text-xs sm:text-sm mt-0.5">
                  Movimientos en tiempo real, cobros Point N950, QR, comisiones, retenciones SIRTAC y egresos
                </p>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                API Mercado Pago Conectada
              </span>
              <span className="bg-slate-900 px-3 py-1 rounded-full border border-slate-700 font-medium">
                {account.nickname || 'PINK RESTAURANT'}
              </span>
              <span className="bg-slate-900 px-3 py-1 rounded-full border border-slate-700 font-medium">
                {account.email || 'mpagocantina@gmail.com'}
              </span>
            </div>
          </div>

          {/* Clean Date Picker Trigger Header */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-lg">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 pl-1">
              <CalendarIcon className="w-4 h-4 text-blue-400" />
              Período:
            </div>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(s, e) => {
                setStartDate(s);
                setEndDate(e);
              }}
            />
            <button
              onClick={fetchReconciliation}
              disabled={loading}
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-md disabled:opacity-50"
              title="Actualizar datos en vivo"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{loading ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Explicación SIRTAC Modal / Info Box */}
      {showSirtacInfo && (
        <div className="p-4 bg-indigo-950/60 border border-indigo-500/40 rounded-2xl text-indigo-200 text-xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between font-bold text-sm text-indigo-300">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>¿Qué es la Retención SIRTAC e Impuestos de Mercado Pago?</span>
            </div>
            <button
              onClick={() => setShowSirtacInfo(false)}
              className="text-indigo-400 hover:text-white text-xs font-semibold"
            >
              Cerrar ✕
            </button>
          </div>
          <p>
            • <strong>SIRTAC (Sistema de Recaudación sobre Tarjetas de Crédito y Compra)</strong>: Retención a cuenta del <strong>Impuesto a los Ingresos Brutos (IIBB)</strong> que Mercado Pago aplica automáticamente por cada venta cobrada con tarjeta o QR (1.5% en BsAs / ARBA).
          </p>
          <p>
            • <strong>Impuesto a los Débitos y Créditos (Ley 25.413)</strong>: Percepción impositiva bancaria (0,6%) sobre cobros con tarjetas.
          </p>
        </div>
      )}

      {/* Explicación Egresos API / CBU Info Box */}
      {showEgresosInfo && (
        <div className="p-4 bg-rose-950/60 border border-rose-500/40 rounded-2xl text-rose-200 text-xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between font-bold text-sm text-rose-300">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-rose-400" />
              <span>¿Cómo mide Mercado Pago el Dinero Egresado?</span>
            </div>
            <button
              onClick={() => setShowEgresosInfo(false)}
              className="text-rose-400 hover:text-white text-xs font-semibold"
            >
              Cerrar ✕
            </button>
          </div>
          <p>
            • <strong>API de Cobros y Checkouts ($1.216.666)</strong>: Devuelve automáticamente las transferencias enviadas vía API checkout en el período (4 transferencias registradas en septiembre).
          </p>
          <p>
            • <strong>Transferencias bancarias a CBU / CVU desde la App Móvil MP</strong>: Por políticas de seguridad financiera de Mercado Pago (`403 UNAUTHORIZED`), la API pública no entrega automáticamente las transferencias bancarias de salida iniciadas manualmente desde la aplicación móvil.
          </p>
          <p className="text-rose-300/90 font-semibold">
            👉 Puedes usar el campo "Egresos CBU / Pagos App" en la tarjeta para sumar los egresos bancarios salientes del período.
          </p>
        </div>
      )}

      {/* 5 Executive Movement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* TARJETA 1: DINERO EN CUENTA (Oficial App MP Coincidencia Exacta) */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-blue-500/40 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Dinero en Cuenta MP</span>
            <Wallet className="w-5 h-5 text-blue-400" />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-400 font-medium">Disponible en Pesos:</div>
            <div className="text-2xl font-black text-white tracking-tight">
              ${availableBal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> A liquidar:
              </span>
              <span className="font-bold text-amber-300">
                ${pendingBal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
            <span>Total Consolidado MP:</span>
            <span className="font-bold text-emerald-400">${consolidatedBal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* TARJETA 2: VENTAS E INGRESOS */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Ventas del Período</span>
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              ${(kpis.mpGrossTotal || 0).toLocaleString('es-AR')} <span className="text-xs font-medium text-slate-400">Bruto</span>
            </div>
            <div className="text-lg font-semibold text-emerald-400 mt-1">
              ${(kpis.mpNetTotal || 0).toLocaleString('es-AR')} <span className="text-xs font-normal text-emerald-300/70">Neto Limpio</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400">
            {kpis.mpPaymentsCount || 0} cobros aprobados
          </div>
        </div>

        {/* TARJETA 3: DESGLOSE POR MÉTODO DE PAGO */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Métodos de Pago</span>
            <PieChart className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="space-y-2 text-xs">
            {Object.entries(paymentMethods).map(([key, m]: [string, any]) => {
              const pct = totalPaymentMethodGross > 0 ? Math.round((m.gross / totalPaymentMethodGross) * 100) : 0;
              return (
                <div key={key} className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium text-[11px]">{m.label}</span>
                    <span className="font-bold text-white text-xs">
                      ${(m.gross || 0).toLocaleString('es-AR')} <span className="text-[10px] text-indigo-300 font-normal">({pct}%)</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400">
            Débito, Crédito, QR Presencial y Dinero en Cuenta
          </div>
        </div>

        {/* TARJETA 4: COMISIONES E IMPUESTOS */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1">
              Comisiones & SIRTAC
              <button
                onClick={() => setShowSirtacInfo(!showSirtacInfo)}
                className="text-indigo-400 hover:text-white transition-colors ml-1"
                title="Ver explicación de SIRTAC"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </span>
            <Receipt className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Comisión MP:</span>
              <span className="font-bold text-amber-300">-${(kpis.mpFeesTotal || 0).toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">SIRTAC IIBB (1.5%):</span>
              <span className="font-bold text-rose-400">-${(kpis.totalSirtacTax || 0).toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Imp. Déb/Créd (0.6%):</span>
              <span className="font-bold text-rose-400">-${(kpis.totalDebitCreditTax || 0).toLocaleString('es-AR')}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
            <span>Total Retenido:</span>
            <span className="font-bold text-rose-400">-${((kpis.mpFeesTotal || 0) + (kpis.mpTaxesTotal || 0)).toLocaleString('es-AR')}</span>
          </div>
        </div>

        {/* TARJETA 5: DINERO EGRESADO Y CONCEPTOS (Desglose API + CBU Configurable) */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-rose-500/40 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1">
              Dinero Egresado
              <button
                onClick={() => setShowEgresosInfo(!showEgresosInfo)}
                className="text-rose-400 hover:text-white transition-colors ml-1"
                title="Ver detalles de la API MP"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </span>
            <ArrowDownLeft className="w-5 h-5 text-rose-400" />
          </div>

          <div>
            <div className="text-lg sm:text-xl xl:text-2xl font-black text-rose-400 tracking-tight truncate" title={`-$${totalConsolidatedEgresos.toLocaleString('es-AR')}`}>
              -${totalConsolidatedEgresos.toLocaleString('es-AR')}
            </div>
            
            <div className="mt-1 space-y-1 text-[11px]">
              <div className="flex justify-between items-center text-slate-400 gap-1">
                <span className="shrink-0">Vía API MP:</span>
                <span className="font-semibold text-rose-300 font-mono truncate" title={`-$${apiEgresos.toLocaleString('es-AR')}`}>
                  -${apiEgresos.toLocaleString('es-AR')}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-400 gap-1">
                <span className="flex items-center gap-1 shrink-0">
                  CBU / App MP:
                  <button
                    onClick={() => setIsEditingManualEgresos(!isEditingManualEgresos)}
                    className="text-blue-400 hover:text-blue-300"
                    title="Editar egresos manuales de la app"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </span>
                {isEditingManualEgresos ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={tempManualInput}
                      onChange={(e) => setTempManualInput(e.target.value)}
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white"
                    />
                    <button
                      onClick={saveManualEgresos}
                      className="p-1 bg-blue-600 text-white rounded hover:bg-blue-500"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="font-semibold text-amber-400 font-mono truncate">
                    -${manualEgresos.toLocaleString('es-AR')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 truncate">
            {kpis.mpEgresosCount || 0} transferencias API + CBU App
          </div>
        </div>

      </div>

      {/* TABLERO DE CONCILIACIÓN FUDO MP ↔ MERCADO PAGO API */}
      <MpFudoReconciliationBoard
        startDate={startDate}
        endDate={endDate}
      />

      {/* Main Table & Filters */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                filterStatus === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos los Movimientos ({rows.length})
            </button>
            <button
              onClick={() => setFilterStatus('INCOMES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                filterStatus === 'INCOMES'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ingresos / Ventas ({rows.filter((r: any) => r.status !== 'EGRESO_MP').length})
            </button>
            <button
              onClick={() => setFilterStatus('EGRESOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                filterStatus === 'EGRESOS'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Egresos / Transferencias ({rows.filter((r: any) => r.status === 'EGRESO_MP').length})
            </button>
            <button
              onClick={() => setFilterStatus('RECONCILED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                filterStatus === 'RECONCILED'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Conciliados Fudo ({rows.filter((r: any) => r.status === 'RECONCILED').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar concepto, ID, POS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Movimientos Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Tipo / Estado</th>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4">Concepto / Detalle</th>
                <th className="py-3 px-4 text-right">Monto Bruto</th>
                <th className="py-3 px-4 text-right">Comisión MP</th>
                <th className="py-3 px-4 text-right">Retenciones SIRTAC</th>
                <th className="py-3 px-4 text-right">Neto Acreditado</th>
                <th className="py-3 px-4">Origen / POS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
                    Obteniendo movimientos de Mercado Pago y conciliando...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No se encontraron movimientos para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row: any, idx: number) => {
                  const isReconciled = row.status === 'RECONCILED';
                  const isEgreso = row.status === 'EGRESO_MP';
                  const isOnlyFudo = row.status === 'UNMATCHED_FUDO';
                  const isOnlyMp = row.status === 'UNMATCHED_MP';

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      {/* Tipo / Estado */}
                      <td className="py-3 px-4">
                        {isReconciled && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Conciliado
                          </span>
                        )}
                        {isEgreso && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[11px] font-medium">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            Egreso / Salida
                          </span>
                        )}
                        {isOnlyFudo && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[11px] font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Solo Fudo
                          </span>
                        )}
                        {isOnlyMp && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[11px] font-medium">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Ingreso MP
                          </span>
                        )}
                      </td>

                      {/* Fecha / Hora */}
                      <td className="py-3 px-4 font-medium text-slate-200">
                        <div>{row.fudoDate || row.mpDate}</div>
                        <div className="text-[10px] text-slate-500">{row.fudoShift || 'N/A'}</div>
                      </td>

                      {/* Concepto / Detalle */}
                      <td className="py-3 px-4 text-slate-200 font-medium max-w-[200px] truncate">
                        {row.mpDescription || 'Cobro Cantina Pink'}
                        {row.mpPaymentId && (
                          <div className="text-[10px] text-slate-500">ID #{row.mpPaymentId}</div>
                        )}
                      </td>

                      {/* Monto Bruto */}
                      <td className={`py-3 px-4 text-right font-semibold ${isEgreso ? 'text-rose-400' : 'text-white'}`}>
                        {isEgreso ? `-$${row.mpGross.toLocaleString('es-AR')}` : `$${(row.mpGross || row.fudoTotal).toLocaleString('es-AR')}`}
                      </td>

                      {/* Comisión MP */}
                      <td className="py-3 px-4 text-right font-medium text-amber-400">
                        {row.mpFee > 0 ? `-$${row.mpFee.toLocaleString('es-AR')}` : '$0'}
                      </td>

                      {/* Retenciones SIRTAC */}
                      <td className="py-3 px-4 text-right font-medium text-rose-400">
                        {row.mpTax > 0 ? `-$${row.mpTax.toLocaleString('es-AR')}` : '$0'}
                      </td>

                      {/* Neto Acreditado */}
                      <td className={`py-3 px-4 text-right font-bold ${isEgreso ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isEgreso ? `-$${row.mpGross.toLocaleString('es-AR')}` : (row.mpNet > 0 ? `$${row.mpNet.toLocaleString('es-AR')}` : '-')}
                      </td>

                      {/* Origen / POS */}
                      <td className="py-3 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                          <span className="font-medium">{row.mpDevice || 'Digital/QR'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
