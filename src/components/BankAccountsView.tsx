'use client';

import React, { useState } from 'react';
import { useGastronomy } from '../context/GastronomyContext';
import { DateRangePicker } from './DateRangePicker';
import {
  Building2,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Filter,
  Search,
  DollarSign,
  Edit2,
  ShieldCheck,
  CreditCard,
  Building,
  RotateCcw
} from 'lucide-react';
import { BankMovement } from '../types/gastronomy';

export const BankAccountsView: React.FC = () => {
  const {
    bankMovements,
    addBankMovement,
    editBankMovement,
    deleteBankMovement,
    initialBalances,
    addInitialBalance,
    editInitialBalance,
    role
  } = useGastronomy();

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInitialBalanceModal, setShowInitialBalanceModal] = useState(false);
  const [editingBm, setEditingBm] = useState<BankMovement | null>(null);

  // Form State para Saldo Inicial Modal
  const [ibAccountType, setIbAccountType] = useState<'CAJA' | 'MERCADO_PAGO' | 'BANCO'>('BANCO');
  const [ibBankName, setIbBankName] = useState('');
  const [ibAmount, setIbAmount] = useState('');
  const [ibNotes, setIbNotes] = useState('');

  // Filtros Avanzados
  const [selectedBank, setSelectedBank] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'INGRESO' | 'EGRESO'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form State para Nuevo Movimiento Bancario
  const [bankName, setBankName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'INGRESO' | 'EGRESO'>('INGRESO');
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Lista de bancos únicos presentes en Saldos Iniciales y Movimientos
  const allBankNames = Array.from(
    new Set([
      ...initialBalances.filter(ib => ib.accountType === 'BANCO' && ib.bankName).map(ib => ib.bankName!),
      ...bankMovements.map(bm => bm.bankName)
    ])
  );

  const handleSaveInitialBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ibAmount) return;

    // Buscar si ya existe saldo inicial para este banco/tipo
    const existing = initialBalances.find(ib => 
      ib.accountType === ibAccountType && (ibAccountType !== 'BANCO' || ib.bankName === ibBankName)
    );

    if (existing) {
      editInitialBalance(existing.id, {
        amount: parseFloat(ibAmount),
        notes: ibNotes || existing.notes
      });
    } else {
      addInitialBalance({
        accountType: ibAccountType,
        bankName: ibAccountType === 'BANCO' ? ibBankName : undefined,
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(ibAmount),
        notes: ibNotes
      });
    }

    setIbAmount('');
    setIbNotes('');
    setShowInitialBalanceModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept || !amount) return;

    addBankMovement({
      bankName,
      date: date || new Date().toISOString().split('T')[0],
      type,
      concept,
      amount: parseFloat(amount),
      referenceNumber,
      notes
    });

    setConcept('');
    setAmount('');
    setReferenceNumber('');
    setNotes('');
    setShowModal(false);
  };

  const handleStartEdit = (bm: BankMovement) => {
    setEditingBm(bm);
    setBankName(bm.bankName);
    setDate(bm.date);
    setType(bm.type);
    setConcept(bm.concept);
    setAmount(bm.amount.toString());
    setReferenceNumber(bm.referenceNumber || '');
    setNotes(bm.notes || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBm || !concept || !amount) return;

    editBankMovement(editingBm.id, {
      bankName,
      date,
      type,
      concept,
      amount: parseFloat(amount),
      referenceNumber,
      notes
    });

    setShowEditModal(false);
    setEditingBm(null);
  };

  // Filtrado de movimientos
  const filteredMovements = bankMovements.filter(bm => {
    if (selectedBank !== 'ALL' && bm.bankName !== selectedBank) return false;
    if (filterType !== 'ALL' && bm.type !== filterType) return false;
    if (startDate && bm.date < startDate) return false;
    if (endDate && bm.date > endDate) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchConcept = bm.concept.toLowerCase().includes(q);
      const matchRef = (bm.referenceNumber || '').toLowerCase().includes(q);
      const matchBank = bm.bankName.toLowerCase().includes(q);
      const matchNotes = (bm.notes || '').toLowerCase().includes(q);
      if (!matchConcept && !matchRef && !matchBank && !matchNotes) return false;
    }
    return true;
  });

  // Cálculo de Saldos por Banco
  const getBankSummary = (targetBankName?: string) => {
    const relevantIB = initialBalances.filter(
      ib => ib.accountType === 'BANCO' && (!targetBankName || ib.bankName === targetBankName)
    );
    const initialSum = relevantIB.reduce((acc, ib) => acc + ib.amount, 0);

    const relevantMovements = bankMovements.filter(
      bm => !targetBankName || bm.bankName === targetBankName
    );
    const totalIngresos = relevantMovements
      .filter(bm => bm.type === 'INGRESO')
      .reduce((acc, bm) => acc + bm.amount, 0);

    const totalEgresos = relevantMovements
      .filter(bm => bm.type === 'EGRESO')
      .reduce((acc, bm) => acc + bm.amount, 0);

    const currentBalance = initialSum + totalIngresos - totalEgresos;

    return { initialSum, totalIngresos, totalEgresos, currentBalance };
  };

  const totalSummary = getBankSummary(selectedBank === 'ALL' ? undefined : selectedBank);

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            Módulo de Bancos y Cuentas Corrientes
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registro y control de depósitos, comisiones, transferencias y movimientos bancarios con saldo dinámico.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setIbAccountType('BANCO');
              setIbBankName('');
              setIbAmount('');
              setIbNotes('');
              setShowInitialBalanceModal(true);
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all"
          >
            ⚙️ Configurar Saldo Inicial
          </button>
          <button
            onClick={() => {
              setBankName('');
              setDate(new Date().toISOString().split('T')[0]);
              setType('INGRESO');
              setConcept('');
              setAmount('');
              setReferenceNumber('');
              setNotes('');
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            + Registrar Movimiento
          </button>
        </div>
      </div>

      {/* TARJETAS RESUMEN DE SALDOS REALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400 font-semibold">Total Ingresos / Depósitos</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400">+${totalSummary.totalIngresos.toLocaleString('es-AR')}</p>
          <span className="text-[10px] text-slate-500">Acreditaciones y cobros bancarios</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400 font-semibold">Total Egresos / Débitos</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-bold text-rose-400">-${totalSummary.totalEgresos.toLocaleString('es-AR')}</p>
          <span className="text-[10px] text-slate-500">Pagos, comisiones y débitos</span>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/30 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-amber-400/90 font-semibold">Saldo Real Disponible en Banco</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">${totalSummary.currentBalance.toLocaleString('es-AR')}</p>
          <span className="text-[10px] text-slate-500">Saldo bancario líquido actual</span>
        </div>
      </div>

      {/* TARJETAS INDIVIDUALES SEPARADAS POR ENTIDAD BANCARIA */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-slate-400" /> Saldos por Entidad Bancaria
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {allBankNames.map(bn => {
            const bSummary = getBankSummary(bn);
            return (
              <div key={bn} className={`bg-slate-900 border ${selectedBank === bn ? 'border-amber-500/60 bg-amber-500/5' : 'border-slate-800'} p-4 rounded-xl space-y-2 shadow-md hover:border-slate-700 transition-colors`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    🏦 {bn}
                  </span>
                  <button
                    onClick={() => setSelectedBank(selectedBank === bn ? 'ALL' : bn)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-medium transition-colors"
                  >
                    {selectedBank === bn ? 'Ver Todos' : 'Filtrar'}
                  </button>
                </div>
                <div className="text-lg font-bold text-slate-100">
                  ${bSummary.currentBalance.toLocaleString('es-AR')}
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                  <div>Ingresos: <span className="text-emerald-400 font-semibold">+${bSummary.totalIngresos.toLocaleString('es-AR')}</span></div>
                  <div>Egresos: <span className="text-rose-400 font-semibold">-${bSummary.totalEgresos.toLocaleString('es-AR')}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TABLA DE MOVIMIENTOS BANCARIOS CON FILTROS INTEGRADOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Historial de Movimientos Bancarios
            </h3>
            <span className="text-xs text-slate-400 font-medium">{filteredMovements.length} movimientos</span>
          </div>

          {/* Toolbar de filtros integrados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por concepto o N°..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-amber-500/50 outline-none"
              />
            </div>

            <div>
              <select
                value={selectedBank}
                onChange={e => setSelectedBank(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 focus:border-amber-500/50 outline-none"
              >
                <option value="ALL">Todos los Bancos</option>
                {allBankNames.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 focus:border-amber-500/50 outline-none"
              >
                <option value="ALL">Todos los Movimientos</option>
                <option value="INGRESO">Ingresos / Créditos</option>
                <option value="EGRESO">Egresos / Débitos</option>
              </select>
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
          </div>

          {(selectedBank !== 'ALL' || filterType !== 'ALL' || searchQuery || startDate || endDate) && (
            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  setSelectedBank('ALL');
                  setFilterType('ALL');
                  setSearchQuery('');
                  setStartDate('');
                  setEndDate('');
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
                <th className="py-3 px-4">Banco</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Concepto / Descripción</th>
                <th className="py-3 px-4">N° Ref</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4">Observaciones</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMovements.length > 0 ? (
                filteredMovements.map(bm => (
                  <tr key={bm.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200 whitespace-nowrap">{bm.bankName}</td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{bm.date}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {bm.type === 'INGRESO' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                          <ArrowDownLeft className="w-3 h-3" /> INGRESO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                          <ArrowUpRight className="w-3 h-3" /> EGRESO
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-100">{bm.concept}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">{bm.referenceNumber || '-'}</td>
                    <td className={`py-3 px-4 text-right font-mono font-bold text-sm whitespace-nowrap ${bm.type === 'INGRESO' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {bm.type === 'INGRESO' ? '+' : '-'}${bm.amount.toLocaleString('es-AR')}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      <div className="flex items-center gap-1.5">
                        <span>{bm.notes || '-'}</span>
                        {bm.lastModifiedBy && (
                          <span title={`Editado por ${bm.lastModifiedBy} el ${bm.lastModifiedAt ? new Date(bm.lastModifiedAt).toLocaleString() : ''}`} className="inline-flex shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-400 hover:text-amber-400 cursor-help" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleStartEdit(bm)}
                        className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                        title="Editar movimiento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500 italic text-xs">
                    No se registraron movimientos bancarios con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REGISTRAR MOVIMIENTO BANCARIO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Registrar Movimiento Bancario</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Banco / Cuenta</label>
                  <input
                    type="text"
                    placeholder="Banco Galicia"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tipo de Movimiento</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
                  >
                    <option value="INGRESO">🟢 Ingreso / Crédito</option>
                    <option value="EGRESO">🔴 Egreso / Débito</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Concepto / Descripción (Escribe Libremente)</label>
                <input
                  type="text"
                  placeholder="Ej. Depósito para cubrir cheque, Comisión banco, Seña..."
                  value={concept}
                  onChange={e => setConcept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Monto ($)</label>
                  <input
                    type="number"
                    placeholder="Ej. 150000"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold text-amber-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">N° Comprobante / Ref</label>
                  <input
                    type="text"
                    placeholder="TR-12345"
                    value={referenceNumber}
                    onChange={e => setReferenceNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Observaciones</label>
                  <input
                    type="text"
                    placeholder="Detalles adicionales"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODIFICAR MOVIMIENTO BANCARIO */}
      {showEditModal && editingBm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Modificar Movimiento Bancario ({role})
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Banco / Cuenta</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tipo de Movimiento</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
                  >
                    <option value="INGRESO">🟢 Ingreso / Crédito</option>
                    <option value="EGRESO">🔴 Egreso / Débito</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Concepto (Escribe Libremente)</label>
                <input
                  type="text"
                  value={concept}
                  onChange={e => setConcept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Monto ($)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold text-amber-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">N° Comprobante / Ref</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={e => setReferenceNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Observaciones</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>La modificación se registrará con el usuario <strong>{role}</strong>.</span>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg"
                >
                  Guardar Cambios ({role})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAR SALDO INICIAL */}
      {showInitialBalanceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                ⚙️ Configurar Saldo de Apertura / Inicial
              </h3>
              <button onClick={() => setShowInitialBalanceModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSaveInitialBalance} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tipo de Cuenta / Origen</label>
                <select
                  value={ibAccountType}
                  onChange={e => setIbAccountType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
                >
                  <option value="BANCO">🏦 Cuenta Bancaria</option>
                  <option value="CAJA">💵 Efectivo / Caja Chica / Mayor</option>
                  <option value="MERCADO_PAGO">💳 MercadoPago</option>
                </select>
              </div>

              {ibAccountType === 'BANCO' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Nombre del Banco</label>
                  <input
                    type="text"
                    placeholder="Ej. Banco Galicia, Banco Nación"
                    value={ibBankName}
                    onChange={e => setIbBankName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 block mb-1">Saldo de Apertura ($)</label>
                <input
                  type="number"
                  placeholder="Ej. 1450000"
                  value={ibAmount}
                  onChange={e => setIbAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold text-amber-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Observaciones</label>
                <input
                  type="text"
                  placeholder="Ej. Saldo de inicio de gestión"
                  value={ibNotes}
                  onChange={e => setIbNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowInitialBalanceModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg"
                >
                  Guardar Saldo Inicial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
