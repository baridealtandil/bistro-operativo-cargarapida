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
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';

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

  return (
    <div className="space-y-6">
      {/* Header Banner with Custom Intuitivo Almanaque */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <CreditCard className="w-72 h-72 text-blue-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/20 backdrop-blur-md rounded-2xl border border-blue-400/30 text-blue-400 shadow-inner">
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
              <span className="bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700/60 font-medium">
                {account.email || 'mpagocantina@gmail.com'}
              </span>
              <span className="bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700/60 font-medium">
                ID: {account.id || 836632087}
              </span>
            </div>
          </div>

          {/* Intuitivo Selector de Fechas (Almanaque) */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/90 p-3 rounded-2xl border border-slate-800 shadow-lg">
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

      {/* 5 Executive Movement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* TARJETA 1: DINERO EN CUENTA */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-blue-500/30 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Dinero en Cuenta</span>
            <Wallet className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">
              ${(kpis.calculatedBalanceInAccount || 0).toLocaleString('es-AR')}
            </div>
            <div className="text-[11px] text-blue-300/80 mt-1 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Saldo acumulado neto disponible
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400">
            Fondos líquidos listos para operar
          </div>
        </div>

        {/* TARJETA 2: VENTAS E INGRESOS */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Ventas e Ingresos</span>
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              ${(kpis.mpGrossTotal || 0).toLocaleString('es-AR')} <span className="text-xs font-medium text-slate-400">Bruto</span>
            </div>
            <div className="text-lg font-semibold text-emerald-400 mt-0.5">
              ${(kpis.mpNetTotal || 0).toLocaleString('es-AR')} <span className="text-xs font-normal text-emerald-300/70">Neto</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400">
            {kpis.mpPaymentsCount || 0} cobros aprobados en el período
          </div>
        </div>

        {/* TARJETA 3: DESGLOSE POR MÉTODO DE PAGO */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Métodos de Pago</span>
            <PieChart className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="space-y-1.5 text-xs">
            {Object.entries(paymentMethods).map(([key, m]: [string, any]) => {
              const pct = totalPaymentMethodGross > 0 ? Math.round((m.gross / totalPaymentMethodGross) * 100) : 0;
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-slate-300 truncate max-w-[120px]">{m.label}:</span>
                  <span className="font-bold text-white">${(m.gross || 0).toLocaleString('es-AR')} <span className="text-[10px] text-indigo-300 font-normal">({pct}%)</span></span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400">
            Débito, Crédito, QR y Dinero en Cuenta
          </div>
        </div>

        {/* TARJETA 4: COMISIONES E IMPUESTOS */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Comisiones & SIRTAC</span>
            <Receipt className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Comisión MP:</span>
              <span className="font-bold text-amber-300">-${(kpis.mpFeesTotal || 0).toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">SIRTAC IIBB:</span>
              <span className="font-bold text-rose-400">-${(kpis.totalSirtacTax || 0).toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Imp. Déb/Créd:</span>
              <span className="font-bold text-rose-400">-${(kpis.totalDebitCreditTax || 0).toLocaleString('es-AR')}</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
            <span>Total Retenido:</span>
            <span className="font-bold text-rose-400">-${((kpis.mpFeesTotal || 0) + (kpis.mpTaxesTotal || 0)).toLocaleString('es-AR')}</span>
          </div>
        </div>

        {/* TARJETA 5: DINERO EGRESADO Y CONCEPTOS */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Dinero Egresado</span>
            <ArrowDownLeft className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-400">
              -${(kpis.mpEgresosTotal || 0).toLocaleString('es-AR')}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {kpis.mpEgresosCount || 0} transferencias / egresos
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 truncate">
            {egresosConcepts.length > 0
              ? egresosConcepts.map((c: any) => `${c.concept}: $${c.amount.toLocaleString('es-AR')}`).join(' | ')
              : 'Sin egresos registrados en el rango'}
          </div>
        </div>
      </div>

      {/* Main Table & Filters */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
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
