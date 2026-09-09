'use client';

import React, { useState } from 'react';
import { useGastronomy, classifyPaymentMethod, classifyExpenseGroup } from '../context/GastronomyContext';
import { Plus, Search, CheckCircle2, DollarSign, X, CreditCard, Edit2, ShieldCheck, Building2, Landmark, Package } from 'lucide-react';
import { SearchableCombobox } from './SearchableCombobox';
import { DateRangePicker } from './DateRangePicker';
import { Expense } from '../types/gastronomy';

const COMMON_EXPENSE_PROVIDERS = [
  'Retiro de Socios / Ganancias',
  'Depósito en Banco para Cubrir Cheque',
  'Cobertura / Pago de Cheque Diferido',
  'Supermercado (Coto / Carrefour / Jumbo)',
  'Panadería & Repostería',
  'Kiosco & Almacén de Barrio',
  'Caja Chica / Compras Rápidas',
  'Usina Popular de Electricidad',
  'Camuzzi Gas Pampeana',
  'Telecom / Personal Internet',
  'AySA / Obras Sanitarias',
  'Metrogas',
  'Edenor',
  'Edesur',
  'Alquiler Salón Comercial',
  'Fudo POS System',
  'Tasas Municipalidad',
  'AFIP / ARBA - Cargas Sociales / Form 931',
  'ARBA / IIBB Impuestos Provincial',
  'Impuestos Bancarios y Comisiones'
];

const DEFAULT_EXPENSE_CATEGORIES = [
  'RETIRO_SOCIOS',
  'COBERTURA CHEQUES',
  'DEPÓSITO BANCARIO',
  'SUPERMERCADO',
  'PANADERIA',
  'KIOSCO',
  'CAJA CHICA',
  'VARIOS & CAJA',
  'LUZ / GAS / AGUA',
  'ALQUILER',
  'INTERNET / COMUNICACIONES',
  'SOFTWARE / FUDO POS',
  'MANTENIMIENTO & REPARACIONES',
  'MARKETING & PUBLICIDAD',
  'SEGUROS',
  'TASAS / MUNICIPAL',
  'AFIP / ARBA / IMPUESTOS',
  'CARGAS SOCIALES / FORM 931',
  'IMPUESTO IIBB',
  'IMPUESTOS BANCARIOS / DÉBITOS',
  'HONORARIOS PROFESIONALES'
];

const DEFAULT_PAYMENT_METHODS = [
  'EFECTIVO (Caja Chica)',
  'TRANSFERENCIA BANCARIA',
  'MERCADO PAGO / DIGITAL',
  'TARJETA DE DÉBITO',
  'TARJETA DE CRÉDITO',
  'CHEQUE PROPIO',
  'CHEQUE DE TERCERO',
  'DÉBITO AUTOMÁTICO'
];

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, editExpense, role } = useGastronomy();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Buscador y Filtros de la Tabla
  const [searchProvider, setSearchProvider] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form State Modal Registrar Pago
  const [providerName, setProviderName] = useState('');
  const [category, setCategory] = useState('SUPERMERCADO');
  const [expenseGroup, setExpenseGroup] = useState<'FUNCIONAMIENTO' | 'IMPUESTOS' | 'VARIOS'>('VARIOS');
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO (Caja Chica)');
  const [bankName, setBankName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Handler para cambios de categoría auto-clasificando el grupo
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    setExpenseGroup(classifyExpenseGroup(newCat));
  };

  // Lista dinámica de categorías
  const allCategories = Array.from(new Set([
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...expenses.map(e => e.category)
  ]));

  // Lista dinámica de métodos de pago
  const allPaymentMethods = Array.from(new Set([
    ...DEFAULT_PAYMENT_METHODS,
    ...expenses.map(e => e.paymentMethod).filter(Boolean) as string[]
  ]));

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerName || !amount || parseFloat(amount) <= 0) return;

    const finalPaymentMethod = paymentMethod.trim() || 'EFECTIVO (Caja Chica)';
    const finalCategory = category.trim().toUpperCase() || 'VARIOS & CAJA';
    const finalGroup = expenseGroup || classifyExpenseGroup(finalCategory);

    addExpense({
      date: paymentDate || new Date().toISOString().split('T')[0],
      category: finalCategory,
      expenseGroup: finalGroup,
      description: providerName.trim(),
      amount: parseFloat(amount),
      paymentMethod: finalPaymentMethod,
      bankName: classifyPaymentMethod(finalPaymentMethod) === 'BANCO' ? (bankName.trim() || undefined) : undefined,
      dueDate: paymentDate || new Date().toISOString().split('T')[0],
      status: 'PAGADO'
    });

    setProviderName('');
    setAmount('');
    setBankName('');
    setShowModal(false);
  };

  const handleStartEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setProviderName(exp.description);
    setCategory(exp.category);
    setExpenseGroup(exp.expenseGroup || classifyExpenseGroup(exp.category));
    setPaymentMethod(exp.paymentMethod || 'EFECTIVO (Caja Chica)');
    setBankName(exp.bankName || '');
    setAmount(exp.amount.toString());
    setPaymentDate(exp.date || exp.dueDate || new Date().toISOString().split('T')[0]);
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !providerName || !amount || parseFloat(amount) <= 0) return;

    const finalPaymentMethod = paymentMethod.trim() || 'EFECTIVO (Caja Chica)';
    const finalCategory = category.trim().toUpperCase() || 'VARIOS & CAJA';
    const finalGroup = expenseGroup || classifyExpenseGroup(finalCategory);

    editExpense(editingExpense.id, {
      description: providerName.trim(),
      category: finalCategory,
      expenseGroup: finalGroup,
      paymentMethod: finalPaymentMethod,
      bankName: classifyPaymentMethod(finalPaymentMethod) === 'BANCO' ? (bankName.trim() || undefined) : undefined,
      amount: parseFloat(amount),
      date: paymentDate
    });

    setEditingExpense(null);
    setShowEditModal(false);
  };

  // Filtrado de lista
  const filteredExpenses = expenses.filter(e => {
    const matchesProvider = searchProvider.trim() === '' ||
      e.description.toLowerCase().includes(searchProvider.toLowerCase()) ||
      e.category.toLowerCase().includes(searchProvider.toLowerCase()) ||
      (e.paymentMethod && e.paymentMethod.toLowerCase().includes(searchProvider.toLowerCase()));

    const group = e.expenseGroup || classifyExpenseGroup(e.category);
    const matchesGroup = filterGroup === 'ALL' || group === filterGroup;

    const matchesCategory = filterCategory === 'ALL' || e.category === filterCategory;
    const matchesMethod = filterPaymentMethod === 'ALL' || e.paymentMethod === filterPaymentMethod;

    const expDate = e.date || e.dueDate || '';
    const matchesStartDate = !startDate || expDate >= startDate;
    const matchesEndDate = !endDate || expDate <= endDate;

    return matchesProvider && matchesGroup && matchesCategory && matchesMethod && matchesStartDate && matchesEndDate;
  });

  const totalFilteredAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Registro de Pagos, Funcionamiento e Impuestos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Módulo general de egresos (Efectivo, Banco, Cheques, Gastos de Funcionamiento, Impuestos, etc.).
          </p>
        </div>
        <button
          onClick={() => {
            setProviderName('');
            setCategory('SUPERMERCADO');
            setExpenseGroup('VARIOS');
            setPaymentMethod('EFECTIVO (Caja Chica)');
            setAmount('');
            setPaymentDate(new Date().toISOString().split('T')[0]);
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          + Registrar Pago
        </button>
      </div>

      {/* TABLA DE PAGOS Y EGRESOS CON FILTROS INTEGRADOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Listado General de Pagos y Egresos Registrados
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {filteredExpenses.length} comprobantes / pagos en el periodo seleccionado.
              </p>
            </div>
            
            <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 w-fit flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> Total Pagado: ${totalFilteredAmount.toLocaleString('es-AR')}
            </div>
          </div>

          {/* Toolbar de Filtros Integrados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por comercio, proveedor o concepto..."
                value={searchProvider}
                onChange={e => setSearchProvider(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-amber-500/50 outline-none"
              />
            </div>

            <div>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                }}
              />
            </div>

            <div>
              <select
                value={filterGroup}
                onChange={e => setFilterGroup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-amber-300 font-semibold focus:border-amber-500/50 outline-none"
              >
                <option value="ALL">Todos los Grupos BI</option>
                <option value="FUNCIONAMIENTO">⚙️ Gastos Funcionamiento</option>
                <option value="IMPUESTOS">🏛️ Impuestos & Tasas</option>
                <option value="VARIOS">📦 Varios & Retiros</option>
              </select>
            </div>

            <div>
              <select
                value={filterPaymentMethod}
                onChange={e => setFilterPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 focus:border-amber-500/50 outline-none"
              >
                <option value="ALL">Todos los Medios de Pago</option>
                {allPaymentMethods.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 focus:border-amber-500/50 outline-none"
              >
                <option value="ALL">Todas las Categorías</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {(searchProvider || startDate || endDate || filterGroup !== 'ALL' || filterCategory !== 'ALL' || filterPaymentMethod !== 'ALL') && (
            <div className="flex items-center justify-end pt-1">
              <button
                onClick={() => {
                  setSearchProvider('');
                  setStartDate('');
                  setEndDate('');
                  setFilterGroup('ALL');
                  setFilterCategory('ALL');
                  setFilterPaymentMethod('ALL');
                }}
                className="text-[11px] text-slate-400 hover:text-amber-400 font-medium transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Proveedor / Concepto</th>
                <th className="py-3 px-4">Medio de Pago</th>
                <th className="py-3 px-4">Grupo BI</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(e => {
                  const grp = e.expenseGroup || classifyExpenseGroup(e.category);
                  return (
                    <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-300 whitespace-nowrap">{e.date || e.dueDate}</td>
                      <td className="py-3 px-4 font-semibold text-slate-100">{e.description}</td>
                      <td className="py-3 px-4 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                          <CreditCard className="w-3 h-3 text-emerald-400" />
                          {e.paymentMethod || 'EFECTIVO (Caja Chica)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {grp === 'FUNCIONAMIENTO' && (
                          <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> Funcionamiento
                          </span>
                        )}
                        {grp === 'IMPUESTOS' && (
                          <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <Landmark className="w-3 h-3" /> Impuestos
                          </span>
                        )}
                        {grp === 'VARIOS' && (
                          <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-medium inline-flex items-center gap-1">
                            <Package className="w-3 h-3" /> Varios
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="bg-slate-800 text-slate-300 font-medium px-2 py-0.5 rounded text-[10px] border border-slate-700">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-100 text-sm whitespace-nowrap">
                        ${e.amount.toLocaleString('es-AR')}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> PAGADO
                          </span>
                          {e.lastModifiedBy && (
                            <span title={`Editado por ${e.lastModifiedBy} el ${e.lastModifiedAt ? new Date(e.lastModifiedAt).toLocaleString() : ''}`} className="inline-flex shrink-0">
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 hover:text-amber-400 cursor-help" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleStartEdit(e)}
                          className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                          title="Editar pago"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500 italic text-xs">
                    No se encontraron pagos registrados con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REGISTRAR PAGO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Registrar Pago / Salida de Dinero</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3">
              {/* Proveedor / Establecimiento */}
              <div>
                <SearchableCombobox
                  label="Proveedor / Comercio / Establecimiento"
                  value={providerName}
                  onChange={setProviderName}
                  options={COMMON_EXPENSE_PROVIDERS}
                  placeholder="Escribir libremente o seleccionar..."
                  allowCustom={true}
                  required={true}
                />
              </div>

              {/* Origen / Medio de Pago */}
              <div>
                <SearchableCombobox
                  label="Origen / Medio de Pago Utilizado"
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={DEFAULT_PAYMENT_METHODS}
                  placeholder="Elegir o escribir medio de pago..."
                  allowCustom={true}
                  required={true}
                  icon={<CreditCard className="w-3.5 h-3.5 text-emerald-400" />}
                />
              </div>

              {/* Banco de origen: solo si el medio de pago es una transferencia/débito bancario */}
              {classifyPaymentMethod(paymentMethod) === 'BANCO' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Banco de Origen</label>
                  <input
                    type="text"
                    placeholder="Banco Galicia / Banco Nación / BBVA..."
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Este monto se descuenta del saldo de ese banco.</span>
                </div>
              )}

              {/* Categoría */}
              <div>
                <SearchableCombobox
                  label="Categoría / Rubro"
                  value={category}
                  onChange={handleCategoryChange}
                  options={allCategories}
                  placeholder="Escribir o seleccionar categoría..."
                  allowCustom={true}
                  required={true}
                />
              </div>

              {/* Clasificación de Grupo BI */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                  Grupo Indicador BI (para Tablero)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpenseGroup('FUNCIONAMIENTO')}
                    className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      expenseGroup === 'FUNCIONAMIENTO'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-sky-400" />
                    <span>Funcionamiento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpenseGroup('IMPUESTOS')}
                    className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      expenseGroup === 'IMPUESTOS'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Landmark className="w-4 h-4 text-purple-400" />
                    <span>Impuestos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpenseGroup('VARIOS')}
                    className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      expenseGroup === 'VARIOS'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Package className="w-4 h-4 text-amber-400" />
                    <span>Varios / Retiros</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Monto Pagado ($)</label>
                  <input
                    type="number"
                    placeholder="15000"
                    value={amount}
                    onChange={ev => setAmount(ev.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold text-emerald-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Fecha de Pago</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={ev => setPaymentDate(ev.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg"
                >
                  Guardar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODIFICAR PAGO (AUDITORÍA) */}
      {showEditModal && editingExpense && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Modificar Pago Registrado ({role})
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <SearchableCombobox
                  label="Proveedor / Comercio / Establecimiento"
                  value={providerName}
                  onChange={setProviderName}
                  options={COMMON_EXPENSE_PROVIDERS}
                  placeholder="Escribir o buscar..."
                  allowCustom={true}
                  required={true}
                />
              </div>

              <div>
                <SearchableCombobox
                  label="Origen / Medio de Pago"
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={DEFAULT_PAYMENT_METHODS}
                  placeholder="Medio de pago..."
                  allowCustom={true}
                  required={true}
                  icon={<CreditCard className="w-3.5 h-3.5 text-emerald-400" />}
                />
              </div>

              {classifyPaymentMethod(paymentMethod) === 'BANCO' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Banco de Origen</label>
                  <input
                    type="text"
                    placeholder="Banco Galicia / Banco Nación / BBVA..."
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <SearchableCombobox
                  label="Categoría / Rubro"
                  value={category}
                  onChange={handleCategoryChange}
                  options={allCategories}
                  placeholder="Categoría..."
                  allowCustom={true}
                  required={true}
                />
              </div>

              {/* Clasificación de Grupo BI */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                  Grupo Indicador BI (para Tablero)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpenseGroup('FUNCIONAMIENTO')}
                    className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      expenseGroup === 'FUNCIONAMIENTO'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-sky-400" />
                    <span>Funcionamiento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpenseGroup('IMPUESTOS')}
                    className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      expenseGroup === 'IMPUESTOS'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Landmark className="w-4 h-4 text-purple-400" />
                    <span>Impuestos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpenseGroup('VARIOS')}
                    className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      expenseGroup === 'VARIOS'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Package className="w-4 h-4 text-amber-400" />
                    <span>Varios / Retiros</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Monto Pagado ($)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={ev => setAmount(ev.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold text-emerald-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Fecha de Pago</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={ev => setPaymentDate(ev.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>La modificación quedará registrada con la marca de auditoría de usuario <strong>{role}</strong>.</span>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition-all"
                >
                  Guardar Cambios ({role})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
