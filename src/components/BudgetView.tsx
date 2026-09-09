'use client';

import React, { useState } from 'react';
import { useGastronomy, classifyExpenseGroup } from '../context/GastronomyContext';
import {
  Target,
  Plus,
  Copy,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Users,
  ShoppingBag,
  Building2,
  Landmark,
  Package,
  Calendar,
  Edit2,
  PieChart
} from 'lucide-react';
import { MonthlyBudget, BudgetItemTarget } from '../types/gastronomy';

const DEFAULT_GROUPS: { group: BudgetItemTarget['group']; label: string; idealPct: number; icon: any; color: string }[] = [
  { group: 'PERSONAL', label: 'Personal (Costo Laboral)', idealPct: 20, icon: Users, color: 'text-sky-400' },
  { group: 'COMPRAS', label: 'Compras de Mercadería', idealPct: 45, icon: ShoppingBag, color: 'text-emerald-400' },
  { group: 'FUNCIONAMIENTO', label: 'Gastos de Funcionamiento', idealPct: 13, icon: Building2, color: 'text-amber-400' },
  { group: 'IMPUESTOS', label: 'Impuestos & Tasas', idealPct: 7, icon: Landmark, color: 'text-purple-400' },
  { group: 'VARIOS', label: 'Varios & Operativos', idealPct: 5, icon: Package, color: 'text-slate-400' },
];

export const BudgetView: React.FC = () => {
  const {
    sales,
    purchases,
    expenses,
    employees,
    advances,
    budgets,
    saveMonthlyBudget,
    getBudgetForMonth,
    copyPreviousMonthBudget,
    role
  } = useGastronomy();

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // Budget actual cargado para el mes seleccionado
  const currentBudget = getBudgetForMonth(selectedMonthKey);

  // Form State Modal Configurar Presupuesto
  const [projectedSales, setProjectedSales] = useState<string>(
    currentBudget ? currentBudget.projectedSalesGross.toString() : '10000000'
  );
  const [itemTargets, setItemTargets] = useState<Record<BudgetItemTarget['group'], string>>({
    PERSONAL: currentBudget?.items.find(i => i.group === 'PERSONAL')?.targetAmount.toString() || '2000000',
    COMPRAS: currentBudget?.items.find(i => i.group === 'COMPRAS')?.targetAmount.toString() || '4500000',
    FUNCIONAMIENTO: currentBudget?.items.find(i => i.group === 'FUNCIONAMIENTO')?.targetAmount.toString() || '1300000',
    IMPUESTOS: currentBudget?.items.find(i => i.group === 'IMPUESTOS')?.targetAmount.toString() || '700000',
    VARIOS: currentBudget?.items.find(i => i.group === 'VARIOS')?.targetAmount.toString() || '500000',
  });

  // Abrir Modal con datos sincronizados
  const handleOpenModal = () => {
    const budget = getBudgetForMonth(selectedMonthKey);
    if (budget) {
      setProjectedSales(budget.projectedSalesGross.toString());
      const targetsMap: Record<BudgetItemTarget['group'], string> = {
        PERSONAL: '0',
        COMPRAS: '0',
        FUNCIONAMIENTO: '0',
        IMPUESTOS: '0',
        VARIOS: '0',
      };
      budget.items.forEach(item => {
        targetsMap[item.group] = item.targetAmount.toString();
      });
      setItemTargets(targetsMap);
    } else {
      setProjectedSales('10000000');
      setItemTargets({
        PERSONAL: '2000000',
        COMPRAS: '4500000',
        FUNCIONAMIENTO: '1300000',
        IMPUESTOS: '700000',
        VARIOS: '500000',
      });
    }
    setShowConfigModal(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const projSalesNum = parseFloat(projectedSales) || 0;

    const items: BudgetItemTarget[] = DEFAULT_GROUPS.map(g => {
      const amt = parseFloat(itemTargets[g.group]) || 0;
      const pct = projSalesNum > 0 ? (amt / projSalesNum) * 100 : 0;
      return {
        id: `target_${g.group.toLowerCase()}`,
        group: g.group,
        targetAmount: amt,
        targetPercentage: pct,
      };
    });

    const newBudget: MonthlyBudget = {
      monthKey: selectedMonthKey,
      projectedSalesGross: projSalesNum,
      items
    };

    saveMonthlyBudget(newBudget);
    setShowConfigModal(false);
  };

  // --- CÁLCULO DE REAL EJECUTADO PARA EL MES SELECCIONADO ---
  // Ventas Reales Brutas
  const monthSales = sales.filter(s => s.date.startsWith(selectedMonthKey));
  const actualSalesGross = monthSales.reduce((acc, s) => acc + s.grossAmount, 0);

  // Egresos por Grupo
  // 1. Personal: Sueldos de empleados activos (o base) + Adelantos en el mes
  const monthAdvances = advances.filter(a => a.date.startsWith(selectedMonthKey));
  const totalAdvancesMonth = monthAdvances.reduce((acc, a) => acc + a.amount, 0);
  const totalEmployeesBaseSalary = employees.filter(e => e.active).reduce((acc, e) => acc + e.baseSalary, 0);
  const actualLabor = totalEmployeesBaseSalary + totalAdvancesMonth;

  // 2. Compras: Facturas de compra de insumos en el mes
  const monthPurchases = purchases.filter(p => p.date.startsWith(selectedMonthKey));
  const actualPurchases = monthPurchases.reduce((acc, p) => acc + p.amount, 0);

  // 3. Gastos por grupo (Expenses)
  const monthExpenses = expenses.filter(e => (e.date || e.dueDate || '').startsWith(selectedMonthKey));
  
  const actualOperatingExpenses = monthExpenses
    .filter(e => (e.expenseGroup || classifyExpenseGroup(e.category)) === 'FUNCIONAMIENTO')
    .reduce((acc, e) => acc + e.amount, 0);

  const actualTaxExpenses = monthExpenses
    .filter(e => (e.expenseGroup || classifyExpenseGroup(e.category)) === 'IMPUESTOS')
    .reduce((acc, e) => acc + e.amount, 0);

  const actualVariosExpenses = monthExpenses
    .filter(e => (e.expenseGroup || classifyExpenseGroup(e.category)) === 'VARIOS')
    .reduce((acc, e) => acc + e.amount, 0);

  const actualAmountsMap: Record<BudgetItemTarget['group'], number> = {
    PERSONAL: actualLabor,
    COMPRAS: actualPurchases,
    FUNCIONAMIENTO: actualOperatingExpenses,
    IMPUESTOS: actualTaxExpenses,
    VARIOS: actualVariosExpenses
  };

  // Totales generales
  const projectedSalesGross = currentBudget ? currentBudget.projectedSalesGross : 0;
  const totalBudgetedExpenses = currentBudget ? currentBudget.items.reduce((acc, i) => acc + i.targetAmount, 0) : 0;
  const totalActualExpenses = Object.values(actualAmountsMap).reduce((acc, v) => acc + v, 0);

  const projectedNetResult = projectedSalesGross - totalBudgetedExpenses;
  const actualNetResult = (actualSalesGross || projectedSalesGross) - totalActualExpenses;

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado y Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-amber-400" /> Presupuesto & Planificación Financiera
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Análisis en tiempo real de Presupuestado vs. Real Ejecutado (*Budget vs. Actual*).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Mes */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs">
            <Calendar className="w-4 h-4 text-amber-400" />
            <input
              type="month"
              value={selectedMonthKey}
              onChange={e => setSelectedMonthKey(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            />
          </div>

          {/* Botón Clonar Mes Anterior */}
          <button
            onClick={() => copyPreviousMonthBudget(selectedMonthKey)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
            title="Copiar configuración presupuestaria del mes anterior"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            Clonar Mes Anterior
          </button>

          {/* Botón Configurar Presupuesto */}
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            {currentBudget ? 'Editar Presupuesto' : 'Cargar Presupuesto'}
          </button>
        </div>
      </div>

      {/* Resumen Global KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Facturación Bruta */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Facturación Bruta ({selectedMonthKey})</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs text-slate-400 font-mono">Proyectado: ${projectedSalesGross.toLocaleString('es-AR')}</div>
              <div className="text-xl md:text-2xl font-black text-white">${actualSalesGross.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">Real</span></div>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
              projectedSalesGross > 0 && (actualSalesGross / projectedSalesGross) >= 1
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {projectedSalesGross > 0 ? ((actualSalesGross / projectedSalesGross) * 100).toFixed(1) : 0}% meta
            </span>
          </div>
        </div>

        {/* Card 2: Egresos Presupuestados vs Real */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Egresos Totales Presupuestados</span>
            <PieChart className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs text-slate-400 font-mono">Presupuestado: ${totalBudgetedExpenses.toLocaleString('es-AR')}</div>
              <div className={`text-xl md:text-2xl font-black ${totalActualExpenses > totalBudgetedExpenses && totalBudgetedExpenses > 0 ? 'text-rose-400' : 'text-white'}`}>
                ${totalActualExpenses.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">Real</span>
              </div>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
              totalBudgetedExpenses === 0
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : totalActualExpenses > totalBudgetedExpenses
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              {totalBudgetedExpenses > 0 ? ((totalActualExpenses / totalBudgetedExpenses) * 100).toFixed(1) : 0}% consumido
            </span>
          </div>
        </div>

        {/* Card 3: Utilidad Operativa Est. */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Resultado Operativo Estimado</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs text-slate-400 font-mono">Proyectado: ${projectedNetResult.toLocaleString('es-AR')}</div>
              <div className={`text-xl md:text-2xl font-black ${actualNetResult >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${actualNetResult.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">Real Est.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA COMPARATIVA DE DESVÍOS (PRESUPUESTADO VS REAL) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Análisis de Desvíos por Rubro (Presupuestado vs. Real)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Comparación directa de metas planificadas vs. ejecución real acumulada en {selectedMonthKey}.
            </p>
          </div>

          {!currentBudget && (
            <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Sin presupuesto cargado para este mes
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Grupo / Rubro Financiero</th>
                <th className="py-3.5 px-4 text-right">Meta ($)</th>
                <th className="py-3.5 px-4 text-center">Meta (%)</th>
                <th className="py-3.5 px-4 text-right">Ejecutado Real ($)</th>
                <th className="py-3.5 px-4 text-center">Consumido (%)</th>
                <th className="py-3.5 px-4 text-right">Saldo / Desvío ($)</th>
                <th className="py-3.5 px-4 text-center">Estado / Alerta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {DEFAULT_GROUPS.map(g => {
                const Icon = g.icon;
                const targetItem = currentBudget?.items.find(i => i.group === g.group);
                const targetAmt = targetItem ? targetItem.targetAmount : 0;
                const targetPct = targetItem?.targetPercentage ?? (projectedSalesGross > 0 ? (targetAmt / projectedSalesGross) * 100 : g.idealPct);

                const actualAmt = actualAmountsMap[g.group] || 0;
                const actualPct = (actualSalesGross || projectedSalesGross) > 0 ? (actualAmt / ((actualSalesGross || projectedSalesGross))) * 100 : 0;

                const varianceAmt = targetAmt - actualAmt; // Positivo = Ahorro/Restante, Negativo = Excedido
                const pctUsed = targetAmt > 0 ? (actualAmt / targetAmt) * 100 : (actualAmt > 0 ? 100 : 0);

                // Estado y Alerta
                let statusBadge = (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> En Meta
                  </span>
                );

                if (pctUsed > 100) {
                  statusBadge = (
                    <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Excedido (+{(pctUsed - 100).toFixed(0)}%)
                    </span>
                  );
                } else if (pctUsed >= 85) {
                  statusBadge = (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Alerta (85%+)
                    </span>
                  );
                }

                return (
                  <tr key={g.group} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-semibold text-slate-100 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${g.color}`} />
                        <span>{g.label}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-200">
                      ${targetAmt.toLocaleString('es-AR')}
                    </td>

                    <td className="py-4 px-4 text-center font-mono text-xs text-slate-400">
                      {targetPct.toFixed(1)}%
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-bold text-white text-sm">
                      ${actualAmt.toLocaleString('es-AR')}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {pctUsed.toFixed(1)}%
                        </span>
                        {/* Barra de progreso */}
                        <div className="w-24 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pctUsed > 100 ? 'bg-rose-500' : pctUsed >= 85 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(pctUsed, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className={`py-4 px-4 text-right font-mono font-bold whitespace-nowrap ${
                      varianceAmt < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {varianceAmt < 0 ? `-$${Math.abs(varianceAmt).toLocaleString('es-AR')}` : `+$${varianceAmt.toLocaleString('es-AR')}`}
                      <div className="text-[10px] font-normal text-slate-500">
                        {varianceAmt < 0 ? 'Sobregasto' : 'Disponible'}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {statusBadge}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORMULARIO CONFIGURAR PRESUPUESTO */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                Configurar Presupuesto ({selectedMonthKey})
              </h3>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              {/* Facturación Bruta Esperada */}
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">
                  Facturación Bruta Proyectada ($)
                </label>
                <input
                  type="number"
                  placeholder="10000000"
                  value={projectedSales}
                  onChange={e => setProjectedSales(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-emerald-400 font-bold outline-none focus:border-amber-500"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Venta estimada antes de comenzar el mes.</span>
              </div>

              {/* Metas por Rubro */}
              <div className="space-y-3 pt-2">
                <label className="text-xs text-slate-300 block font-bold border-b border-slate-800 pb-1">
                  Presupuesto Planificado por Rubro ($)
                </label>

                {DEFAULT_GROUPS.map(g => {
                  const Icon = g.icon;
                  const currentVal = parseFloat(itemTargets[g.group]) || 0;
                  const projSalesNum = parseFloat(projectedSales) || 0;
                  const calcPct = projSalesNum > 0 ? (currentVal / projSalesNum) * 100 : 0;

                  return (
                    <div key={g.group} className="grid grid-cols-12 gap-2 items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="col-span-5 flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                        <Icon className={`w-4 h-4 ${g.color}`} />
                        <span>{g.label}</span>
                      </div>

                      <div className="col-span-4">
                        <input
                          type="number"
                          value={itemTargets[g.group]}
                          onChange={e => setItemTargets(prev => ({ ...prev, [g.group]: e.target.value }))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold text-right outline-none focus:border-amber-500"
                          required
                        />
                      </div>

                      <div className="col-span-3 text-right text-[11px] font-mono font-bold text-slate-400">
                        {calcPct.toFixed(1)}% <span className="text-[9px] font-normal text-slate-500">(Ideal: {g.idealPct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition-all"
                >
                  Guardar Presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
