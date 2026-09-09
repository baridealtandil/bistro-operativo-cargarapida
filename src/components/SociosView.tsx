'use client';

import React, { useState } from 'react';
import { useGastronomy } from '../context/GastronomyContext';
import { Handshake, Plus, UserPlus, Wallet2, FileText, Pencil, Check as CheckIcon, X, Users, Percent } from 'lucide-react';
import { PartnerWithdrawalCashLine } from '../types/gastronomy';

export const SociosView: React.FC = () => {
  const {
    partners,
    addPartner,
    editPartner,
    partnerConsumptions,
    addPartnerConsumption,
    partnerWithdrawals,
    addPartnerWithdrawal
  } = useGastronomy();

  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [editingPartnerName, setEditingPartnerName] = useState('');
  const [editingPartnerShare, setEditingPartnerShare] = useState<string>('100');

  // Form: nuevo socio
  const [newPartnerName, setNewPartnerName] = useState('');
  const [isAssociate, setIsAssociate] = useState(false);
  const [newPartnerLinkedId, setNewPartnerLinkedId] = useState('');
  const [newPartnerSharePct, setNewPartnerSharePct] = useState('50');

  // Form: nuevo consumo
  const [consPartnerId, setConsPartnerId] = useState(partners[0]?.id || '');
  const [consAmount, setConsAmount] = useState('');
  const [consDescription, setConsDescription] = useState('');
  const [consDate, setConsDate] = useState(new Date().toISOString().split('T')[0]);
  const [consNotes, setConsNotes] = useState('');

  // Form: retiro
  const [wPartnerId, setWPartnerId] = useState(partners[0]?.id || '');
  const [wDate, setWDate] = useState(new Date().toISOString().split('T')[0]);
  const [wIncludeCash, setWIncludeCash] = useState(false);
  const [wNotes, setWNotes] = useState('');

  // Retiros en efectivo por integrante del grupo
  const [wCashInputs, setWCashInputs] = useState<Record<string, { amount: string; accountType: 'CAJA' | 'MERCADO_PAGO' | 'BANCO'; bankName: string }>>({});

  const pendingByPartner = (partnerId: string) =>
    partnerConsumptions
      .filter(pc => pc.partnerId === partnerId && !pc.settled)
      .reduce((acc, pc) => acc + pc.amount, 0);

  const totalPendingAllPartners = partners.reduce((acc, p) => acc + pendingByPartner(p.id), 0);

  // Obtiene los integrantes del grupo para un socio seleccionado
  const getPartnerGroup = (partnerId: string) => {
    const p = partners.find(item => item.id === partnerId);
    if (!p) return [];
    const mainId = p.linkedToPartnerId || p.id;
    return partners.filter(item => item.id === mainId || item.linkedToPartnerId === mainId);
  };

  const selectedGroup = getPartnerGroup(wPartnerId);
  const groupPendingTotal = selectedGroup.reduce((acc, p) => acc + pendingByPartner(p.id), 0);

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) return;

    addPartner({
      name: newPartnerName.trim(),
      active: true,
      linkedToPartnerId: isAssociate && newPartnerLinkedId ? newPartnerLinkedId : undefined,
      sharePercentage: parseFloat(newPartnerSharePct) || 100
    });

    setNewPartnerName('');
    setIsAssociate(false);
    setNewPartnerLinkedId('');
    setNewPartnerSharePct('50');
    setShowAddPartnerModal(false);
  };

  const handleSaveRename = (id: string) => {
    if (editingPartnerName.trim()) {
      editPartner(id, {
        name: editingPartnerName.trim(),
        sharePercentage: parseFloat(editingPartnerShare) || 100
      });
    }
    setEditingPartnerId(null);
  };

  const handleAddConsumption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consAmount || parseFloat(consAmount) <= 0) return;
    const partner = partners.find(p => p.id === consPartnerId) || partners[0];
    if (!partner) return;

    addPartnerConsumption({
      partnerId: partner.id,
      partnerName: partner.name,
      date: consDate || new Date().toISOString().split('T')[0],
      description: consDescription.trim() || 'Consumo de comida y bebida',
      amount: parseFloat(consAmount),
      notes: consNotes.trim() || undefined
    });

    setConsAmount('');
    setConsDescription('');
    setConsNotes('');
    setShowConsumptionModal(false);
  };

  const handleAddWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const partner = partners.find(p => p.id === wPartnerId) || partners[0];
    if (!partner) return;

    const cashLines: PartnerWithdrawalCashLine[] = [];
    if (wIncludeCash) {
      selectedGroup.forEach(gPartner => {
        const input = wCashInputs[gPartner.id];
        if (input && parseFloat(input.amount) > 0) {
          cashLines.push({
            partnerId: gPartner.id,
            partnerName: gPartner.name,
            cashAmount: parseFloat(input.amount),
            cashAccountType: input.accountType,
            bankName: input.accountType === 'BANCO' ? input.bankName : undefined
          });
        }
      });
    }

    addPartnerWithdrawal({
      partnerId: partner.id,
      date: wDate || new Date().toISOString().split('T')[0],
      cashLines: cashLines.length > 0 ? cashLines : undefined,
      notes: wNotes.trim() || undefined
    });

    setWCashInputs({});
    setWIncludeCash(false);
    setWNotes('');
    setShowWithdrawalModal(false);
  };

  const sortedConsumptions = [...partnerConsumptions].sort((a, b) => (a.date < b.date ? 1 : -1));
  const sortedWithdrawals = [...partnerWithdrawals].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Handshake className="w-5 h-5 text-amber-400" />
            Consumo y Retiro de Socios
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registra consumos que no se cobran en el momento y liquidalos con reparto porcentual entre socios titulares y adherentes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setNewPartnerName(''); setShowAddPartnerModal(true); }}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <UserPlus className="w-4 h-4" />
            + Agregar Socio
          </button>
          <button
            onClick={() => {
              if (partners.length > 0) setConsPartnerId(partners[0].id);
              setConsAmount(''); setConsDescription(''); setConsNotes('');
              setConsDate(new Date().toISOString().split('T')[0]);
              setShowConsumptionModal(true);
            }}
            disabled={partners.length === 0}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            + Registrar Consumo
          </button>
          <button
            onClick={() => {
              if (partners.length > 0) setWPartnerId(partners[0].id);
              setWDate(new Date().toISOString().split('T')[0]);
              setWIncludeCash(false); setWNotes('');
              setShowWithdrawalModal(true);
            }}
            disabled={partners.length === 0}
            className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <Wallet2 className="w-4 h-4" />
            + Registrar Retiro
          </button>
        </div>
      </div>

      {/* KPI general */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400 font-medium">Consumo Pendiente de Liquidar (Todos los Socios)</div>
          <div className="text-2xl font-black text-rose-400 mt-1">${totalPendingAllPartners.toLocaleString('es-AR')}</div>
        </div>
        <div className="text-xs text-slate-400 text-right max-w-[240px]">
          Se descuenta de cada socio según su % recién al registrar su Retiro. No afecta Caja ni Bancos hasta entonces.
        </div>
      </div>

      {/* Tabla de Socios */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" /> Socios y Reparto de %
          </h3>
          <span className="text-xs text-slate-400">{partners.length} socios cargados</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Tipo / Vinculación</th>
                <th className="p-3">% Participación</th>
                <th className="p-3">Consumo Pendiente Individual</th>
                <th className="p-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {partners.map(p => {
                const pending = pendingByPartner(p.id);
                const isEditing = editingPartnerId === p.id;
                const linkedPartner = p.linkedToPartnerId ? partners.find(item => item.id === p.linkedToPartnerId) : null;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-white whitespace-nowrap">
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editingPartnerName}
                          onChange={e => setEditingPartnerName(e.target.value)}
                          className="bg-slate-950 border border-amber-500 rounded-lg px-2 py-1 text-xs text-white outline-none"
                        />
                      ) : (
                        p.name
                      )}
                    </td>
                    <td className="p-3 font-medium">
                      {linkedPartner ? (
                        <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded text-[10px] border border-indigo-500/20">
                          Adherente de {linkedPartner.name}
                        </span>
                      ) : (
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] border border-emerald-500/20">
                          Titular
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-amber-300">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editingPartnerShare}
                            onChange={e => setEditingPartnerShare(e.target.value)}
                            className="bg-slate-950 border border-amber-500 rounded-lg px-2 py-1 text-xs text-white outline-none w-16"
                          />
                          <span>%</span>
                        </div>
                      ) : (
                        `${p.sharePercentage !== undefined ? p.sharePercentage : 100}%`
                      )}
                    </td>
                    <td className="p-3 font-bold text-rose-400">${pending.toLocaleString('es-AR')}</td>
                    <td className="p-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleSaveRename(p.id)} className="text-emerald-400 hover:text-emerald-300">
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingPartnerId(null)} className="text-slate-400 hover:text-white">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPartnerId(p.id);
                            setEditingPartnerName(p.name);
                            setEditingPartnerShare((p.sharePercentage !== undefined ? p.sharePercentage : 100).toString());
                          }}
                          className="text-slate-400 hover:text-amber-400 flex items-center gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {partners.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 italic text-xs">
                    No hay socios cargados todavía. Usá &quot;+ Agregar Socio&quot; para empezar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Consumos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            Historial de Consumos
          </h3>
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            {partnerConsumptions.length} consumos
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Socio</th>
                <th className="p-3">Descripción</th>
                <th className="p-3">Monto</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedConsumptions.length > 0 ? (
                sortedConsumptions.map(pc => (
                  <tr key={pc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-white">{pc.date}</td>
                    <td className="p-3 font-bold text-amber-300">{pc.partnerName}</td>
                    <td className="p-3 text-slate-400">{pc.description}</td>
                    <td className="p-3 font-black text-rose-400 text-sm">${pc.amount.toLocaleString('es-AR')}</td>
                    <td className="p-3">
                      {pc.settled ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">LIQUIDADO</span>
                      ) : (
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">PENDIENTE</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 italic text-xs">
                    No se registraron consumos todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Retiros */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Wallet2 className="w-4 h-4 text-indigo-400" />
            Historial de Retiros
          </h3>
          <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
            {partnerWithdrawals.length} retiros
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Titular / Grupo</th>
                <th className="p-3">Consumo Total Liquidador</th>
                <th className="p-3">Desglose por %</th>
                <th className="p-3">Retiro Dinero Real</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedWithdrawals.length > 0 ? (
                sortedWithdrawals.map(w => (
                  <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-white whitespace-nowrap">{w.date}</td>
                    <td className="p-3 font-bold text-amber-300 whitespace-nowrap">{w.partnerName}</td>
                    <td className="p-3 text-slate-300 font-bold">${w.consumptionAmount.toLocaleString('es-AR')}</td>
                    <td className="p-3">
                      {w.shares && w.shares.length > 0 ? (
                        <div className="space-y-1">
                          {w.shares.map(s => (
                            <div key={s.partnerId} className="text-[11px] flex items-center gap-2">
                              <span className="text-slate-300 font-semibold">{s.partnerName} ({s.sharePercentage}%):</span>
                              <span className="text-rose-400 font-bold">${s.withdrawalShare.toLocaleString('es-AR')}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-300">
                      {w.cashLines && w.cashLines.length > 0 ? (
                        <div className="space-y-1 text-[11px]">
                          {w.cashLines.map(cl => (
                            <div key={cl.partnerId} className="text-emerald-400 font-bold">
                              {cl.partnerName}: ${cl.cashAmount.toLocaleString('es-AR')} ({cl.cashAccountType === 'BANCO' ? cl.bankName || 'Banco' : cl.cashAccountType})
                            </div>
                          ))}
                        </div>
                      ) : w.cashAmount > 0 ? (
                        <span className="text-emerald-400 font-bold">
                          ${w.cashAmount.toLocaleString('es-AR')} ({w.cashAccountType === 'BANCO' ? w.bankName || 'Banco' : w.cashAccountType})
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 italic text-xs">
                    No se registraron retiros todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar Socio */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                Agregar Socio
              </h3>
              <button onClick={() => setShowAddPartnerModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>
            <form onSubmit={handleAddPartner} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Nombre del Socio</label>
                <input
                  type="text"
                  placeholder="Ej. Gabriel Marca"
                  value={newPartnerName}
                  onChange={e => setNewPartnerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none font-bold"
                  required
                />
              </div>

              <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/50 space-y-3">
                <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                  <input
                    type="checkbox"
                    checked={isAssociate}
                    onChange={e => setIsAssociate(e.target.checked)}
                    className="w-3.5 h-3.5"
                  />
                  Es socio adherente / comparte % con otro socio
                </label>

                {isAssociate && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Vincular al Socio Titular</label>
                      <select
                        value={newPartnerLinkedId}
                        onChange={e => setNewPartnerLinkedId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        required={isAssociate}
                      >
                        <option value="">-- Seleccionar Titular --</option>
                        {partners.filter(p => !p.linkedToPartnerId).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">% del Reparto Total</label>
                      <input
                        type="number"
                        placeholder="50"
                        value={newPartnerSharePct}
                        onChange={e => setNewPartnerSharePct(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none font-bold text-amber-300"
                        required={isAssociate}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button type="button" onClick={() => setShowAddPartnerModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition-colors">
                  Guardar Socio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Consumo */}
      {showConsumptionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Registrar Consumo de Socio</h3>
              <button onClick={() => setShowConsumptionModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>
            <form onSubmit={handleAddConsumption} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Socio</label>
                <select
                  value={consPartnerId}
                  onChange={e => setConsPartnerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                >
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.name} {p.linkedToPartnerId ? '(Adherente)' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Monto del Consumo ($)</label>
                  <input
                    type="number"
                    placeholder="15000"
                    value={consAmount}
                    onChange={e => setConsAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold text-rose-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Fecha</label>
                  <input
                    type="date"
                    value={consDate}
                    onChange={e => setConsDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Descripción</label>
                <input
                  type="text"
                  placeholder="Ej. Almuerzo familiar, cena con amigos"
                  value={consDescription}
                  onChange={e => setConsDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Notas (opcional)</label>
                <input
                  type="text"
                  value={consNotes}
                  onChange={e => setConsNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                />
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Este consumo no se cobra ni descuenta de Caja/Banco ahora — queda pendiente hasta que se registre como Retiro.
              </p>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button type="button" onClick={() => setShowConsumptionModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg">
                  Guardar Consumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Retiro */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Registrar Retiro de Socio</h3>
              <button onClick={() => setShowWithdrawalModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>
            <form onSubmit={handleAddWithdrawal} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Socio / Grupo Liquidador</label>
                <select
                  value={wPartnerId}
                  onChange={e => setWPartnerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-indigo-500 outline-none font-bold"
                >
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.linkedToPartnerId ? '(Socio Adherente)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vista previa del reparto por % del grupo */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-amber-400" /> Consumo Total del Grupo
                  </span>
                  <span className="text-sm font-black text-rose-400">
                    ${groupPendingTotal.toLocaleString('es-AR')}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] text-slate-400 font-medium">Reparto por % de participación:</div>
                  {selectedGroup.map(gp => {
                    const sharePct = gp.sharePercentage !== undefined ? gp.sharePercentage : (selectedGroup.length > 1 ? 100 / selectedGroup.length : 100);
                    const indCons = pendingByPartner(gp.id);
                    const shareAmount = groupPendingTotal * (sharePct / 100);
                    return (
                      <div key={gp.id} className="flex items-center justify-between text-xs bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <div>
                          <span className="font-bold text-white">{gp.name}</span>
                          <span className="text-[10px] text-amber-300 font-semibold ml-1">({sharePct}%)</span>
                          <span className="text-[10px] text-slate-400 block">Consumido individual: ${indCons.toLocaleString('es-AR')}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-rose-400">${shareAmount.toLocaleString('es-AR')}</span>
                          <span className="text-[10px] text-slate-400 block">a compensar</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Fecha del Retiro</label>
                <input
                  type="date"
                  value={wDate}
                  onChange={e => setWDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 pt-1">
                <input
                  type="checkbox"
                  checked={wIncludeCash}
                  onChange={e => setWIncludeCash(e.target.checked)}
                  className="w-3.5 h-3.5"
                />
                Además se retiró efectivo/banco real (aparte de consumos)
              </label>

              {wIncludeCash && (
                <div className="space-y-3 border border-slate-800 rounded-xl p-3 bg-slate-950/40">
                  <div className="text-xs font-bold text-emerald-400 mb-1">
                    Retiro en dinero por integrante:
                  </div>
                  {selectedGroup.map(gp => {
                    const current = wCashInputs[gp.id] || { amount: '', accountType: 'CAJA', bankName: '' };
                    return (
                      <div key={gp.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                        <div className="text-xs font-bold text-white">{gp.name}</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Monto ($)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={current.amount}
                              onChange={e =>
                                setWCashInputs(prev => ({
                                  ...prev,
                                  [gp.id]: { ...current, amount: e.target.value }
                                }))
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Cuenta</label>
                            <select
                              value={current.accountType}
                              onChange={e =>
                                setWCashInputs(prev => ({
                                  ...prev,
                                  [gp.id]: { ...current, accountType: e.target.value as any }
                                }))
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                            >
                              <option value="CAJA">CAJA (Efectivo)</option>
                              <option value="MERCADO_PAGO">MERCADOPAGO</option>
                              <option value="BANCO">BANCO (Transferencia)</option>
                            </select>
                          </div>
                        </div>
                        {current.accountType === 'BANCO' && (
                          <div>
                            <input
                              type="text"
                              placeholder="Nombre del Banco (ej. Banco Galicia)"
                              value={current.bankName}
                              onChange={e =>
                                setWCashInputs(prev => ({
                                  ...prev,
                                  [gp.id]: { ...current, bankName: e.target.value }
                                }))
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 block mb-1">Notas (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Liquidación de septiembre con reparto 50/50"
                  value={wNotes}
                  onChange={e => setWNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button type="button" onClick={() => setShowWithdrawalModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-xs shadow-lg">
                  Confirmar Retiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
