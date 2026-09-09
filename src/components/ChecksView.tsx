'use client';

import React, { useState } from 'react';
import { useGastronomy } from '../context/GastronomyContext';
import { DateRangePicker } from './DateRangePicker';
import {
  CheckSquare,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Filter,
  Search,
  Building,
  DollarSign,
  UserCheck,
  Edit2,
  ShieldCheck,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { Check as CheckType } from '../types/gastronomy';

export const ChecksView: React.FC = () => {
  const { checks, addCheck, editCheck, toggleCheckCovered, suppliers, role } = useGastronomy();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCheck, setEditingCheck] = useState<CheckType | null>(null);

  // Estados de Filtros Avanzados
  const [filterType, setFilterType] = useState<'ALL' | 'PROPIO' | 'TERCERO'>('ALL');
  const [filterBank, setFilterBank] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchSupplier, setSearchSupplier] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Form State para Nuevo Cheque
  const [type, setType] = useState<CheckType['type']>('PROPIO');
  const [number, setNumber] = useState('');
  const [bank, setBank] = useState('');
  const [issuerOrRecipient, setIssuerOrRecipient] = useState('');
  const [supplierSearchQueryModal, setSupplierSearchQueryModal] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!number || !amount) return;

    addCheck({
      type,
      number,
      bank,
      issuerOrRecipient: issuerOrRecipient || supplierSearchQueryModal || 'Sin Especificar',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      amount: parseFloat(amount),
      status: 'PENDIENTE',
      notes
    });

    setNumber('');
    setAmount('');
    setIssuerOrRecipient('');
    setSupplierSearchQueryModal('');
    setShowModal(false);
  };

  const handleStartEdit = (chk: CheckType) => {
    setEditingCheck(chk);
    setType(chk.type);
    setNumber(chk.number);
    setBank(chk.bank);
    setIssuerOrRecipient(chk.issuerOrRecipient);
    setSupplierSearchQueryModal(chk.issuerOrRecipient);
    setDueDate(chk.dueDate);
    setAmount(chk.amount.toString());
    setNotes(chk.notes || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCheck || !number || !amount) return;

    editCheck(editingCheck.id, {
      type,
      number,
      bank,
      issuerOrRecipient: issuerOrRecipient || supplierSearchQueryModal || 'Sin Especificar',
      dueDate,
      amount: parseFloat(amount),
      notes
    });

    setShowEditModal(false);
    setEditingCheck(null);
  };

  // Bancos únicos presentes
  const uniqueBanks = Array.from(new Set(checks.map(c => c.bank)));

  // Buscador de Proveedores en Modal de Carga de Cheque
  const matchingSuppliersModal = suppliers.filter(s =>
    s.name.toLowerCase().includes(supplierSearchQueryModal.toLowerCase()) ||
    s.cuit.includes(supplierSearchQueryModal)
  );

  // Cálculos de Totales por Mes para Cheques Propios (Próximos 90-120 días)
  const calculateMonthlyTotal = (yearMonthPrefix: string) => {
    return checks
      .filter(c => c.type === 'PROPIO' && c.dueDate.startsWith(yearMonthPrefix))
      .reduce((acc, c) => acc + c.amount, 0);
  };

  const septTotal = calculateMonthlyTotal('2026-09');
  const octTotal = calculateMonthlyTotal('2026-10');
  const novTotal = calculateMonthlyTotal('2026-11');
  const dicTotal = calculateMonthlyTotal('2026-12');
  const total90Days = septTotal + octTotal + novTotal + dicTotal;

  // Lógica de Filtrado de la Tabla
  const filteredChecks = checks.filter(c => {
    if (filterType !== 'ALL' && c.type !== filterType) return false;
    if (filterBank !== 'ALL' && c.bank !== filterBank) return false;
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (searchSupplier && !c.issuerOrRecipient.toLowerCase().includes(searchSupplier.toLowerCase()) && !c.number.toLowerCase().includes(searchSupplier.toLowerCase())) {
      return false;
    }
    if (startDate && c.dueDate < startDate) return false;
    if (endDate && c.dueDate > endDate) return false;

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Gestión y Control de Cheques
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro de cheques propios y de terceros, seguimiento de diferidos y vencimientos.
          </p>
        </div>
        <button
          onClick={() => {
            setSupplierSearchQueryModal('');
            setIssuerOrRecipient('');
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Registrar Cheque
        </button>
      </div>

      {/* TARJETAS DE RESUMEN MENSUAL EN $ (PRÓXIMOS 90 DÍAS) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" /> Septiembre
          </div>
          <div className="text-xl font-bold text-slate-100">${septTotal.toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-slate-500">Mes corriente</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" /> Octubre
          </div>
          <div className="text-xl font-bold text-slate-100">${octTotal.toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-slate-500">Próximo mes</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" /> Noviembre
          </div>
          <div className="text-xl font-bold text-slate-100">${novTotal.toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-slate-500">En 60 días</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" /> Diciembre
          </div>
          <div className="text-xl font-bold text-slate-100">${dicTotal.toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-slate-500">En 90 días</div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-slate-900/90 border border-amber-500/30 p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-semibold text-amber-400/90 flex items-center justify-between">
            <span>Total 90 Días</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">${total90Days.toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-slate-500">Compromisos totales</div>
        </div>
      </div>

      {/* TABLA CON TOOLBAR DE FILTROS INTEGRADA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-amber-400" />
              Listado de Cheques Registrados
            </h3>
            <span className="text-xs text-slate-400 font-medium">{filteredChecks.length} registros</span>
          </div>

          {/* Barra de búsqueda y controles integrados en la cabecera de la tabla */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por proveedor o N°..."
                value={searchSupplier}
                onChange={e => setSearchSupplier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-amber-500/50 outline-none"
              />
            </div>

            <div>
              <select
                value={filterBank}
                onChange={e => setFilterBank(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 focus:border-amber-500/50 outline-none"
              >
                <option value="ALL">Todos los Bancos</option>
                {uniqueBanks.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 focus:border-amber-500/50 outline-none font-medium"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="PROPIO">Propios Emitidos</option>
                <option value="TERCERO">De Terceros</option>
              </select>
            </div>

            <div>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={(s, e) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
              />
            </div>
          </div>

          {(filterBank !== 'ALL' || filterType !== 'ALL' || searchSupplier || startDate || endDate) && (
            <div className="flex items-center justify-end pt-1">
              <button
                onClick={() => {
                  setFilterBank('ALL');
                  setFilterType('ALL');
                  setFilterStatus('ALL');
                  setSearchSupplier('');
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
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">N° Cheque</th>
                <th className="py-3 px-4">Banco</th>
                <th className="py-3 px-4">Proveedor / Destinatario</th>
                <th className="py-3 px-4">Emisión</th>
                <th className="py-3 px-4">Vencimiento</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4">Notas</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredChecks.length > 0 ? (
                filteredChecks.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      {c.type === 'PROPIO' ? (
                        <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                          <ArrowUpRight className="w-3 h-3" /> PROPIO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                          <ArrowDownLeft className="w-3 h-3" /> TERCERO
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-200 whitespace-nowrap">{c.number}</td>
                    <td className="py-3 px-4 text-slate-300 font-medium whitespace-nowrap">{c.bank}</td>
                    <td className="py-3 px-4 text-slate-100 font-semibold">{c.issuerOrRecipient}</td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{c.issueDate}</td>
                    <td className="py-3 px-4 font-medium text-amber-400 whitespace-nowrap">{c.dueDate}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-100 font-bold text-sm">
                      ${c.amount.toLocaleString('es-AR')}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => toggleCheckCovered(c.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          c.status === 'CUBIERTO' || c.status === 'PAGADO'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : c.status === 'ENDOSADO'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                        }`}
                        title={c.status === 'CUBIERTO' || c.status === 'PAGADO' ? "Haz clic para desmarcar (restituye saldo al banco)" : "Haz clic para marcar como cubierto (descuenta saldo del banco)"}
                      >
                        {c.status === 'CUBIERTO' || c.status === 'PAGADO' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>✓ Cubierto</span>
                          </>
                        ) : c.status === 'ENDOSADO' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                            <span>Endosado</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5 text-amber-400" />
                            <span>Por Cubrir</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      <div className="flex items-center gap-1.5">
                        <span>{c.notes || '-'}</span>
                        {c.lastModifiedBy && (
                          <span title={`Editado por ${c.lastModifiedBy} el ${c.lastModifiedAt ? new Date(c.lastModifiedAt).toLocaleString() : ''}`} className="inline-flex shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-400 hover:text-amber-400 cursor-help" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleStartEdit(c)}
                        className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                        title="Editar cheque"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-500 italic text-xs">
                    No se encontraron cheques que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REGISTRAR CHEQUE MANUALMENTE (CON BUSCADOR DE PROVEEDOR) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Registrar Cheque Manualmente</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleAddCheck} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tipo de Cheque</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
                  >
                    <option value="PROPIO">Propio (Emitido)</option>
                    <option value="TERCERO">De Tercero (Recibido)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">N° de Cheque</label>
                  <input
                    type="text"
                    placeholder="CHK-001234"
                    value={number}
                    onChange={e => setNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Banco</label>
                  <input
                    type="text"
                    placeholder="Banco Galicia / ICBC / BBVA"
                    value={bank}
                    onChange={e => setBank(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Monto ($)</label>
                  <input
                    type="number"
                    placeholder="250000"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold text-amber-400"
                    required
                  />
                </div>
              </div>

              {/* BUSCADOR AUTOCOMPLETADO DE PROVEEDOR / CLIENTE */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="text-xs text-slate-400 block mb-1">Buscar Proveedor / Cliente</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                    <input
                      type="text"
                      placeholder="Escribe para buscar..."
                      value={supplierSearchQueryModal}
                      onChange={e => {
                        setSupplierSearchQueryModal(e.target.value);
                        setIssuerOrRecipient(e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
                      required
                    />
                  </div>

                  {/* Dropdown de opciones coincidentes */}
                  {supplierSearchQueryModal && matchingSuppliersModal.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-36 overflow-y-auto divide-y divide-slate-800">
                      {matchingSuppliersModal.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setIssuerOrRecipient(s.name);
                            setSupplierSearchQueryModal(s.name);
                          }}
                          className="w-full text-left p-2 text-xs hover:bg-amber-500/20 hover:text-amber-300 text-slate-200 transition-colors flex items-center justify-between"
                        >
                          <span className="font-bold">{s.name}</span>
                          <span className="text-[10px] text-slate-500">{s.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Fecha Cobro / Vencimiento</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Indicador visual de la selección */}
              {issuerOrRecipient && (
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 text-[11px] flex items-center gap-1.5 text-emerald-400">
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Destinatario asignado: <strong className="text-white">{issuerOrRecipient}</strong></span>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 block mb-1">Observaciones</label>
                <input
                  type="text"
                  placeholder="Ej. Cheque entregado para cubrir factura"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                />
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
                  Guardar Cheque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODIFICAR CHEQUE */}
      {showEditModal && editingCheck && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Modificar Cheque ({role})
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tipo de Cheque</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
                  >
                    <option value="PROPIO">Propio (Emitido)</option>
                    <option value="TERCERO">De Tercero (Recibido)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">N° de Cheque</label>
                  <input
                    type="text"
                    value={number}
                    onChange={e => setNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Banco</label>
                  <input
                    type="text"
                    value={bank}
                    onChange={e => setBank(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
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
                  <label className="text-xs text-slate-400 block mb-1">Proveedor / Destinatario</label>
                  <input
                    type="text"
                    value={issuerOrRecipient}
                    onChange={e => setIssuerOrRecipient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Fecha Vencimiento</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                    required
                  />
                </div>
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

              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>La modificación quedará registrada con el usuario <strong>{role}</strong>.</span>
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
    </div>
  );
};
