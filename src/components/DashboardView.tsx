import React from 'react';
import { useGastronomy } from '../context/GastronomyContext';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  PieChart as PieIcon,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Users,
  ShoppingBag,
  Building2,
  Landmark,
  Target,
  Truck,
  Receipt,
  CheckSquare,
  Handshake,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    totalSalesNetMonth,
    totalSalesGrossMonth,
    totalPurchasesMonth,
    totalLaborMonth,
    totalOperatingExpensesMonth,
    totalTaxExpensesMonth,
    laborGrossPercentage,
    purchasesGrossPercentage,
    operatingExpensesPercentage,
    taxExpensesPercentage,
    primeCostPercentage,
    foodCostPercentage,
    laborCostPercentage,
    netProfitEstMonth,
    pendingChecksAmount7Days,
    pendingServicesAmount,
    sales,
    purchases
  } = useGastronomy();

  // Datos agrupados por canal para gráfico de torta
  const channelData = sales.reduce((acc: any, s) => {
    const existing = acc.find((item: any) => item.name === s.channel);
    if (existing) {
      existing.value += s.netAmount;
    } else {
      acc.push({ name: s.channel, value: s.netAmount });
    }
    return acc;
  }, []);

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'];

  // Datos para gráfico comparativo
  const comparisonData = [
    { name: 'Ventas Netas', monto: totalSalesNetMonth },
    { name: 'Compras Insumos', monto: totalPurchasesMonth },
    { name: 'Costo Laboral', monto: totalLaborMonth },
    { name: 'Utilidad Est.', monto: netProfitEstMonth > 0 ? netProfitEstMonth : 0 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* HUB DE TARJETAS OPERATIVAS COMPACTAS (CARD LAUNCHPAD) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Lanzador de Acciones Rápida (Hub de Tarjetas)
          </h2>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">1 Clic para Cargar</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Card 1: + Cargar Venta */}
          <button
            onClick={() => onNavigate('ventas')}
            className="p-3.5 bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl shadow-lg border border-emerald-500/30 flex flex-col justify-between h-32 text-left transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-md text-emerald-200">Ventas</span>
              <TrendingUp className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="text-sm font-black block leading-tight">+ Cargar Venta</span>
              <span className="text-[10px] text-emerald-100/80 block mt-1">Cierre de turno y caja</span>
            </div>
          </button>

          {/* Card 2: + Cargar Factura / Remito */}
          <button
            onClick={() => onNavigate('compras')}
            className="p-3.5 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 rounded-2xl shadow-lg border border-amber-500/30 flex flex-col justify-between h-32 text-left transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-md text-slate-900">Compras</span>
              <ShoppingBag className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="text-sm font-black block leading-tight">+ Cargar Factura</span>
              <span className="text-[10px] text-slate-900/80 block mt-1">Remitos e insumos</span>
            </div>
          </button>

          {/* Card 3: + Registrar Pago Proveedor */}
          <button
            onClick={() => onNavigate('gastos')}
            className="p-3.5 bg-gradient-to-br from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white rounded-2xl shadow-lg border border-sky-500/30 flex flex-col justify-between h-32 text-left transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-md text-sky-200">Pagos</span>
              <DollarSign className="w-5 h-5 text-sky-200 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="text-sm font-black block leading-tight">+ Registrar Pago</span>
              <span className="text-[10px] text-sky-100/80 block mt-1">Efectivo, MP o Banco</span>
            </div>
          </button>

          {/* Card 4: 🚚 Lista de Proveedores */}
          <button
            onClick={() => onNavigate('compras')}
            className="p-3.5 bg-gradient-to-br from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 rounded-2xl shadow-lg border border-amber-400/30 flex flex-col justify-between h-32 text-left transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-md text-slate-950">Proveedores</span>
              <Truck className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="text-sm font-black block leading-tight">Ver Proveedores</span>
              <span className="text-[10px] text-slate-900/80 block mt-1">Saldos y Fichas Cta Cte</span>
            </div>
          </button>

          {/* Card 5: ⚙️ Gastos de Funcionamiento */}
          <button
            onClick={() => onNavigate('gastos')}
            className="p-3.5 bg-gradient-to-br from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded-2xl shadow-lg border border-cyan-400/30 flex flex-col justify-between h-32 text-left transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-md text-cyan-200">Egresos</span>
              <Building2 className="w-5 h-5 text-cyan-200 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="text-sm font-black block leading-tight">Gastos Servicios</span>
              <span className="text-[10px] text-cyan-100/80 block mt-1">Alquiler, Luz, Gas, POS</span>
            </div>
          </button>

          {/* Card 6: 🏛️ Cargar Impuesto / Tasa */}
          <button
            onClick={() => onNavigate('gastos')}
            className="p-3.5 bg-gradient-to-br from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 text-white rounded-2xl shadow-lg border border-fuchsia-400/30 flex flex-col justify-between h-32 text-left transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-md text-fuchsia-200">Impuestos</span>
              <Landmark className="w-5 h-5 text-fuchsia-200 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="text-sm font-black block leading-tight">Impuestos & Tasas</span>
              <span className="text-[10px] text-fuchsia-100/80 block mt-1">AFIP, ARBA, Cargas 931</span>
            </div>
          </button>

          {/* Card 7: 📝 Cheques & Cuentas */}
          <button
            onClick={() => onNavigate('cheques')}
            className="p-3.5 bg-gradient-to-br from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white rounded-2xl shadow-lg border border-purple-500/30 flex flex-col justify-between h-32 text-left transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-md text-purple-200">Chequera</span>
              <CheckSquare className="w-5 h-5 text-purple-200 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="text-sm font-black block leading-tight">+ Cheque / Chequera</span>
              <span className="text-[10px] text-purple-100/80 block mt-1">Cheques diferidos y cobros</span>
            </div>
          </button>

          {/* Card 8: 👤 Adelanto / Personal */}
          <button
            onClick={() => onNavigate('empleados')}
            className="p-3.5 bg-gradient-to-br from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white rounded-2xl shadow-lg border border-violet-400/30 flex flex-col justify-between h-32 text-left transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-md text-violet-200">Personal</span>
              <Users className="w-5 h-5 text-violet-200 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="text-sm font-black block leading-tight">Personal & Sueldos</span>
              <span className="text-[10px] text-violet-100/80 block mt-1">Registrar sueldo o adelanto</span>
            </div>
          </button>
        </div>
      </div>

      {/* Saludo y Resumen rápido */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Consola Operativa - Control de Caja y Proveedores
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Herramienta rápida para carga diaria de comprobantes, compras y ventas.
          </p>
        </div>
        <button
          onClick={() => onNavigate('ia')}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all text-xs"
        >
          <Sparkles className="w-4 h-4" />
          Hacer consulta a la IA
        </button>
      </div>

      {/* Sección de Metas Ideales BI (Estructura Financiera) */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-400" />
              Estructura Financiera - Metas Ideales (BI Gastronómico)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitoreo mensual de los 4 pilares financieros clave comparados contra los estándares óptimos de rentabilidad. Facturación Bruta: <strong className="text-slate-200">${totalSalesGrossMonth.toLocaleString('es-AR')}</strong>
            </p>
          </div>
          <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 self-start sm:self-auto">
            Base: % Facturación Bruta
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: % Personal */}
          {(() => {
            const val = laborGrossPercentage;
            let badgeBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
            let statusText = 'En Meta (≤ 20%)';
            let iconColor = 'text-emerald-400';

            if (val > 24) {
              badgeBg = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
              statusText = 'Excedido (> 24%)';
              iconColor = 'text-rose-400';
            } else if (val > 20) {
              badgeBg = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
              statusText = 'Leve Desvío (> 20%)';
              iconColor = 'text-amber-400';
            }

            return (
              <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-sky-400" /> % Personal</span>
                    <span className="text-[10px] text-slate-400 font-mono">Ideal: 20%</span>
                  </div>
                  <div className={`text-2xl font-black ${iconColor}`}>
                    {val.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    ${totalLaborMonth.toLocaleString('es-AR')}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/60">
                  <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-lg text-[10px] font-bold ${badgeBg}`}>
                    {statusText}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* KPI 2: % Compras de Mercadería */}
          {(() => {
            const val = purchasesGrossPercentage;
            let badgeBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
            let statusText = 'En Meta (≤ 45%)';
            let iconColor = 'text-emerald-400';

            if (val > 50) {
              badgeBg = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
              statusText = 'Excedido (> 50%)';
              iconColor = 'text-rose-400';
            } else if (val > 45) {
              badgeBg = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
              statusText = 'Leve Desvío (> 45%)';
              iconColor = 'text-amber-400';
            }

            return (
              <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5"><ShoppingBag className="w-4 h-4 text-emerald-400" /> % Compras Mercadería</span>
                    <span className="text-[10px] text-slate-400 font-mono">Ideal: 45%</span>
                  </div>
                  <div className={`text-2xl font-black ${iconColor}`}>
                    {val.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    ${totalPurchasesMonth.toLocaleString('es-AR')}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/60">
                  <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-lg text-[10px] font-bold ${badgeBg}`}>
                    {statusText}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* KPI 3: % Gastos de Funcionamiento */}
          {(() => {
            const val = operatingExpensesPercentage;
            let badgeBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
            let statusText = 'En Meta (≤ 13%)';
            let iconColor = 'text-emerald-400';

            if (val > 16) {
              badgeBg = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
              statusText = 'Excedido (> 16%)';
              iconColor = 'text-rose-400';
            } else if (val > 13) {
              badgeBg = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
              statusText = 'Leve Desvío (> 13%)';
              iconColor = 'text-amber-400';
            }

            return (
              <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-sky-400" /> % Funcionamiento</span>
                    <span className="text-[10px] text-slate-400 font-mono">Ideal: 13%</span>
                  </div>
                  <div className={`text-2xl font-black ${iconColor}`}>
                    {val.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    ${totalOperatingExpensesMonth.toLocaleString('es-AR')}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/60">
                  <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-lg text-[10px] font-bold ${badgeBg}`}>
                    {statusText}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* KPI 4: % Impuestos */}
          {(() => {
            const val = taxExpensesPercentage;
            let badgeBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
            let statusText = 'En Meta (≤ 7%)';
            let iconColor = 'text-emerald-400';

            if (val > 9) {
              badgeBg = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
              statusText = 'Excedido (> 9%)';
              iconColor = 'text-rose-400';
            } else if (val > 7) {
              badgeBg = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
              statusText = 'Leve Desvío (> 7%)';
              iconColor = 'text-amber-400';
            }

            return (
              <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5"><Landmark className="w-4 h-4 text-purple-400" /> % Impuestos & Tasas</span>
                    <span className="text-[10px] text-slate-400 font-mono">Ideal: 7%</span>
                  </div>
                  <div className={`text-2xl font-black ${iconColor}`}>
                    {val.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    ${totalTaxExpensesMonth.toLocaleString('es-AR')}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/60">
                  <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-lg text-[10px] font-bold ${badgeBg}`}>
                    {statusText}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Grilla de KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Facturación Neta */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Facturación Neta (Mes)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-white">
            ${totalSalesNetMonth.toLocaleString('es-AR')}
          </div>
          <div className="text-[10px] text-slate-400">Descontadas comisiones POS</div>
        </div>

        {/* KPI 2: Prime Cost % */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Prime Cost Total</span>
            <PieIcon className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-xl md:text-2xl font-black ${primeCostPercentage > 65 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {primeCostPercentage.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400">
            Food Cost: {foodCostPercentage.toFixed(1)}% | Labor: {laborCostPercentage.toFixed(1)}%
          </div>
        </div>

        {/* KPI 3: Utilidad Neta Est. */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Utilidad Neta Est.</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className={`text-xl md:text-2xl font-black ${netProfitEstMonth >= 0 ? 'text-white' : 'text-rose-400'}`}>
            ${netProfitEstMonth.toLocaleString('es-AR')}
          </div>
          <div className={`text-[10px] font-semibold ${netProfitEstMonth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalSalesNetMonth > 0 ? ((netProfitEstMonth / totalSalesNetMonth) * 100).toFixed(1) : 0}% margen neto
          </div>
        </div>

        {/* KPI 4: Cheques a Vencer */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Cheques Pendientes</span>
            <Calendar className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-amber-400">
            ${pendingChecksAmount7Days.toLocaleString('es-AR')}
          </div>
          <div className="text-[10px] text-slate-400">Por cobrar o debitar en 7 días</div>
        </div>
      </div>

      {/* Sección de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Estructura Financiera */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Estructura de Ingresos vs Costos</span>
            <span className="text-xs font-normal text-slate-400">Mes Actual</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString('es-AR')}`, 'Monto']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px' }}
                />
                <Bar dataKey="monto" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Ventas por Canal */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Distribución de Ventas por Canal</span>
            <span className="text-xs font-normal text-slate-400">POS / Delivery</span>
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {channelData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString('es-AR')}`, 'Venta']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Accesos rápidos a modulos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('ventas')}
          className="p-3 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all"
        >
          <div className="text-xs font-semibold text-white flex items-center justify-between">
            + Cargar Venta <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Registrar cierre de turno o día</div>
        </button>

        <button
          onClick={() => onNavigate('compras')}
          className="p-3 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all"
        >
          <div className="text-xs font-semibold text-white flex items-center justify-between">
            + Cargar Factura <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Ingresar compra de insumos u OCR</div>
        </button>

        <button
          onClick={() => onNavigate('cheques')}
          className="p-3 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all"
        >
          <div className="text-xs font-semibold text-white flex items-center justify-between">
            Chequera <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Verificar vencimientos cercanos</div>
        </button>

        <button
          onClick={() => onNavigate('make')}
          className="p-3 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left transition-all"
        >
          <div className="text-xs font-semibold text-indigo-300 flex items-center justify-between">
            Sync Fudo/MaxiRest <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Importar CSV o Webhook Make</div>
        </button>
      </div>
    </div>
  );
};
