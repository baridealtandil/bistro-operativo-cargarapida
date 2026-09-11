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
  Receipt, 
  Search,
  DollarSign,
  Smartphone,
  Calendar as CalendarIcon
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
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'RECONCILED' | 'UNMATCHED_FUDO' | 'UNMATCHED_MP'>('ALL');
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
    if (filterStatus === 'UNMATCHED_FUDO' && r.status !== 'UNMATCHED_FUDO') return false;
    if (filterStatus === 'UNMATCHED_MP' && r.status !== 'UNMATCHED_MP') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMpId = r.mpPaymentId ? String(r.mpPaymentId).toLowerCase().includes(q) : false;
      const matchFudoId = r.fudoSaleId ? String(r.fudoSaleId).toLowerCase().includes(q) : false;
      const matchDevice = r.mpDevice ? String(r.mpDevice).toLowerCase().includes(q) : false;
      return matchMpId || matchFudoId || matchDevice;
    }
    return true;
  });

  const kpis = data?.kpis || {};
  const account = data?.accountInfo || {};

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-blue-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <CreditCard className="w-64 h-64 text-white" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 backdrop-blur-md rounded-xl border border-blue-400/30 text-blue-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Conciliación Mercado Pago API</h2>
                <p className="text-blue-200/80 text-sm">
                  Cobros Point N950, QR, deducciones impositivas SIRTAC y conciliación automática con Fudo POS
                </p>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-blue-200">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                API En Vivo Conectada
              </span>
              <span className="bg-blue-950/60 px-3 py-1 rounded-full border border-blue-700/50">
                Cuenta: <strong>{account.email || 'mpagocantina@gmail.com'}</strong>
              </span>
              <span className="bg-blue-950/60 px-3 py-1 rounded-full border border-blue-700/50">
                ID Usuario MP: <strong>{account.id || 836632087}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
            <div className="text-slate-200 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
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
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1 text-sm font-medium disabled:opacity-50"
              title="Actualizar datos en vivo"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{loading ? 'Cargando...' : 'Actualizar'}</span>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Bruto MP */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>TOTAL BRUTO MP</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ${(kpis.mpGrossTotal || 0).toLocaleString('es-AR')}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {kpis.mpPaymentsCount || 0} cobros procesados
          </div>
        </div>

        {/* Total Neto Recibido */}
        <div className="bg-emerald-950/40 rounded-xl p-4 border border-emerald-800/40">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-medium mb-1">
            <span>NETO EN CUENTA</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            ${(kpis.mpNetTotal || 0).toLocaleString('es-AR')}
          </div>
          <div className="text-xs text-emerald-300/70 mt-1">
            Fondos limpios disponibles
          </div>
        </div>

        {/* Comisiones Mercado Pago */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium mb-1">
            <span>COMISIONES MP</span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">
            ${(kpis.mpFeesTotal || 0).toLocaleString('es-AR')}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Tarifa de procesamiento POS/QR
          </div>
        </div>

        {/* Retenciones Impositivas */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-rose-400 text-xs font-medium mb-1">
            <span>RETENCIONES SIRTAC/TAX</span>
            <Receipt className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-300">
            ${(kpis.mpTaxesTotal || 0).toLocaleString('es-AR')}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            SIRTAC IIBB / Débitos y Créditos
          </div>
        </div>

        {/* % Conciliación Fudo */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-purple-400 text-xs font-medium mb-1">
            <span>CONCILIACIÓN FUDO</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300">
            {kpis.reconciliationPercentage || 0}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {kpis.reconciledCount || 0} de {kpis.fudoSalesCount || 0} ventas cruzadas
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
        {/* Table Filters & Search */}
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
              Todos ({rows.length})
            </button>
            <button
              onClick={() => setFilterStatus('RECONCILED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                filterStatus === 'RECONCILED'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Conciliados ({rows.filter((r: any) => r.status === 'RECONCILED').length})
            </button>
            <button
              onClick={() => setFilterStatus('UNMATCHED_FUDO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                filterStatus === 'UNMATCHED_FUDO'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Solo en Fudo ({rows.filter((r: any) => r.status === 'UNMATCHED_FUDO').length})
            </button>
            <button
              onClick={() => setFilterStatus('UNMATCHED_MP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                filterStatus === 'UNMATCHED_MP'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Solo en MP ({rows.filter((r: any) => r.status === 'UNMATCHED_MP').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID, dispositivo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Fecha / Turno</th>
                <th className="py-3 px-4 text-right">Venta Fudo</th>
                <th className="py-3 px-4 text-right">Bruto MP</th>
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
                    Consultando API de Mercado Pago y realizando conciliación...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No se encontraron registros para la fecha o filtro seleccionado.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row: any, idx: number) => {
                  const isReconciled = row.status === 'RECONCILED';
                  const isOnlyFudo = row.status === 'UNMATCHED_FUDO';
                  const isOnlyMp = row.status === 'UNMATCHED_MP';

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      {/* Estado */}
                      <td className="py-3 px-4">
                        {isReconciled && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Conciliado
                          </span>
                        )}
                        {isOnlyFudo && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[11px] font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Pendiente MP
                          </span>
                        )}
                        {isOnlyMp && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[11px] font-medium">
                            <CreditCard className="w-3.5 h-3.5" />
                            Ingreso MP
                          </span>
                        )}
                      </td>

                      {/* Fecha / Turno */}
                      <td className="py-3 px-4 font-medium text-slate-200">
                        <div>{row.fudoDate || row.mpDate}</div>
                        <div className="text-[10px] text-slate-500">{row.fudoShift || 'N/A'}</div>
                      </td>

                      {/* Venta Fudo */}
                      <td className="py-3 px-4 text-right font-semibold text-slate-200">
                        {row.fudoTotal > 0 ? `$${row.fudoTotal.toLocaleString('es-AR')}` : '-'}
                        {row.fudoSaleId && (
                          <div className="text-[10px] text-slate-500">ID #{row.fudoSaleId}</div>
                        )}
                      </td>

                      {/* Bruto MP */}
                      <td className="py-3 px-4 text-right font-semibold text-white">
                        {row.mpGross > 0 ? `$${row.mpGross.toLocaleString('es-AR')}` : '-'}
                        {row.mpPaymentId && (
                          <div className="text-[10px] text-slate-500">MP #{row.mpPaymentId}</div>
                        )}
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
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">
                        {row.mpNet > 0 ? `$${row.mpNet.toLocaleString('es-AR')}` : '-'}
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
