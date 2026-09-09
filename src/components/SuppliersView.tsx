'use client';

import React, { useState } from 'react';
import { useGastronomy } from '../context/GastronomyContext';
import { SearchableCombobox, DEFAULT_GASTRONOMY_CATEGORIES } from './SearchableCombobox';
import { DateRangePicker } from './DateRangePicker';
import {
  Plus,
  Camera,
  AlertTriangle,
  Truck,
  DollarSign,
  FileText,
  CheckCircle,
  CreditCard,
  Receipt,
  CheckSquare,
  Search,
  Calendar,
  Gift,
  ArrowRight,
  X,
  Edit2,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { SupplierPayment, Supplier } from '../types/gastronomy';

export const SuppliersView: React.FC = () => {
  const {
    suppliers,
    purchases,
    supplierPayments,
    checks,
    addPurchase,
    addSupplier,
    editSupplier,
    addSupplierPayment,
    totalSupplierDebt,
    role
  } = useGastronomy();

  const [selectedCcSupplierId, setSelectedCcSupplierId] = useState<string>(suppliers[0]?.id || '');

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isScanningOcr, setIsScanningOcr] = useState(false);

  // Buscador principal de proveedores y Rango de Fechas
  const [supplierListSearch, setSupplierListSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Buscador de proveedores en el modal de pago
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');

  // Form State Compra
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [purchaseSupplierName, setPurchaseSupplierName] = useState(suppliers[0]?.name || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemUnitPrice, setItemUnitPrice] = useState('');

  const allCategories = Array.from(new Set([...DEFAULT_GASTRONOMY_CATEGORIES, ...suppliers.map(s => s.category)]));

  // Form State Proveedor
  const [supName, setSupName] = useState('');
  const [supCuit, setSupCuit] = useState('');
  const [supCategory, setSupCategory] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supInitialBalanceDue, setSupInitialBalanceDue] = useState('');

  const handleStartEditSupplier = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupName(sup.name);
    setSupCuit(sup.cuit);
    setSupCategory(sup.category);
    setSupPhone(sup.phone);
    setSupInitialBalanceDue((sup.initialBalanceDue || 0).toString());
    setShowEditSupplierModal(true);
  };

  const handleSaveEditSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !supName) return;

    editSupplier(editingSupplier.id, {
      name: supName,
      cuit: supCuit,
      category: supCategory || 'VARIOS',
      phone: supPhone,
      initialBalanceDue: parseFloat(supInitialBalanceDue || '0')
    });

    setShowEditSupplierModal(false);
    setEditingSupplier(null);
  };

  // Detección de coincidencia/duplicidad de proveedor
  const normalizedSupName = supName.trim().toLowerCase();
  const exactSupplierMatch = normalizedSupName
    ? suppliers.find(s => s.name.trim().toLowerCase() === normalizedSupName)
    : null;
  const similarSupplierMatch = (!exactSupplierMatch && normalizedSupName.length >= 3)
    ? suppliers.find(s => {
        const sName = s.name.trim().toLowerCase();
        return sName.includes(normalizedSupName) || normalizedSupName.includes(sName);
      })
    : null;

  // Form State Pago a Proveedor
  const [paySupplierId, setPaySupplierId] = useState(suppliers[0]?.id || '');
  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payMethod, setPayMethod] = useState<SupplierPayment['paymentMethod']>('TRANSFERENCIA');
  const [payAmount, setPayAmount] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [checkBank, setCheckBank] = useState('');
  const [checkDueDate, setCheckDueDate] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Proveedores ordenados alfabéticamente y filtrados por el buscador principal
  const sortedAndFilteredSuppliers = [...suppliers]
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(s =>
      s.name.toLowerCase().includes(supplierListSearch.toLowerCase()) ||
      s.cuit.includes(supplierListSearch) ||
      s.category.toLowerCase().includes(supplierListSearch.toLowerCase())
    );

  // IDs de proveedores coincidentes con la búsqueda activa
  const matchingSupplierIds = new Set(sortedAndFilteredSuppliers.map(s => s.id));

  // Facturas filtradas según la búsqueda activa y Rango de Fechas (Desde - Hasta)
  const filteredPurchasesForCards = purchases.filter(p => {
    const matchesSupplier = supplierListSearch.trim() === '' || matchingSupplierIds.has(p.supplierId);
    const matchesStart = !startDate || p.date >= startDate;
    const matchesEnd = !endDate || p.date <= endDate;
    return matchesSupplier && matchesStart && matchesEnd;
  });

  // CÁLCULO DE DEUDAS POR MES BASADAS EN LA BÚSQUEDA DEL PROVEEDOR
  const calculateDebtByMonth = (yearMonthPrefix: string) => {
    return filteredPurchasesForCards
      .filter(p => p.status !== 'PAGADO' && p.date.startsWith(yearMonthPrefix))
      .reduce((acc, p) => acc + (p.amount - (p.paidAmount || 0)), 0);
  };

  const augustDebt = calculateDebtByMonth('2026-08'); // Meses anteriores (Agosto)
  const septemberDebt = calculateDebtByMonth('2026-09'); // Mes Corriente (Septiembre)
  const octoberDebt = calculateDebtByMonth('2026-10'); // Próximo Mes (Octubre)
  const totalFilteredDebt = augustDebt + septemberDebt + octoberDebt;

  // Facturas pendientes filtradas para la tabla de comprobantes del proveedor
  const filteredPendingPurchases = filteredPurchasesForCards.filter(p => p.status !== 'PAGADO');

  // CÁLCULO DE CUENTA CORRIENTE Y LIBRO MAYOR DE PROVEEDOR (DEBE, HABER, SALDO ACUMULADO)
  const getSupplierLedgerMovements = (sup?: Supplier) => {
    if (!sup) return { movements: [], totalDebe: 0, totalHaber: 0, finalSaldo: 0 };

    interface LedgerEntry {
      id: string;
      date: string;
      concept: string;
      method: string;
      debe: number;
      haber: number;
      saldo?: number;
      type: 'INICIAL' | 'FACTURA' | 'PAGO';
      reference?: string;
    }

    const movements: LedgerEntry[] = [];

    // 1. Saldo Inicial de Apertura
    if ((sup.initialBalanceDue || 0) > 0) {
      movements.push({
        id: `init_${sup.id}`,
        date: '2026-08-01',
        concept: 'Saldo Inicial de Apertura (Deuda Previa)',
        method: 'SALDO INICIAL',
        debe: sup.initialBalanceDue || 0,
        haber: 0,
        type: 'INICIAL'
      });
    }

    // 2. Facturas de Compra (DEBE - Incrementa la deuda)
    const supPurchases = purchases.filter(p => p.supplierId === sup.id);
    for (const p of supPurchases) {
      movements.push({
        id: p.id,
        date: p.date,
        concept: `Factura ${p.invoiceNumber}${p.items && p.items[0] ? ` - ${p.items[0].description}` : ''}`,
        method: 'COMPRA / DEBE',
        debe: p.amount,
        haber: 0,
        type: 'FACTURA',
        reference: p.invoiceNumber
      });
    }

    // 3. Pagos / Abonos / Bonificaciones a Proveedor (HABER - Reduce la deuda)
    const supPayments = supplierPayments.filter(sp => sp.supplierId === sup.id);
    for (const sp of supPayments) {
      movements.push({
        id: sp.id,
        date: sp.date,
        concept: sp.notes || `Pago a Proveedor (${sp.paymentMethod})`,
        method: sp.paymentMethod + (sp.checkNumber ? ` N° ${sp.checkNumber}` : '') + (sp.bank ? ` (${sp.bank})` : ''),
        debe: 0,
        haber: sp.amount,
        type: 'PAGO',
        reference: sp.checkNumber || sp.invoiceNumber
      });
    }

    // 4. Cheques emitidos asignados al proveedor (si aún no figuran en supplierPayments)
    const supNameLower = sup.name.toLowerCase().trim();
    const supChecks = checks.filter(c => {
      const recipientLower = (c.issuerOrRecipient || '').toLowerCase().trim();
      const isMatch = recipientLower === supNameLower || recipientLower.includes(supNameLower) || supNameLower.includes(recipientLower);
      const isAlreadyInPayments = supPayments.some(sp => sp.checkNumber === c.number);
      return isMatch && !isAlreadyInPayments;
    });

    for (const c of supChecks) {
      movements.push({
        id: c.id,
        date: c.issueDate || c.dueDate,
        concept: `Cheque ${c.type === 'PROPIO' ? 'Propio' : 'Tercero'} N° ${c.number} (${c.status})`,
        method: `CHEQUE ${c.bank}`,
        debe: 0,
        haber: c.amount,
        type: 'PAGO',
        reference: c.number
      });
    }

    // Ordenar cronológicamente por fecha
    movements.sort((a, b) => a.date.localeCompare(b.date));

    // Calcular saldo acumulado corriendo
    let runningSaldo = 0;
    let totalDebe = 0;
    let totalHaber = 0;

    const calculatedMovements = movements.map(m => {
      totalDebe += m.debe;
      totalHaber += m.haber;
      runningSaldo += (m.debe - m.haber);
      return { ...m, saldo: runningSaldo };
    });

    return { movements: calculatedMovements, totalDebe, totalHaber, finalSaldo: runningSaldo };
  };

  const handleSimulateOcr = () => {
    setIsScanningOcr(true);
    setTimeout(() => {
      setIsScanningOcr(false);
      setInvoiceNumber('FC-A-0003-0009841');
      setAmount('185000');
      setDueDate('2026-09-18');
      setItemDescription('Ojo de Bife envasado al vacío (20kg)');
      setItemUnitPrice('9250');
      alert('📷 OCR de IA finalizado: Factura procesada y datos completados automáticamente.');
    }, 1200);
  };

  const handleAddPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    let targetSup = suppliers.find(
      s => s.name.toLowerCase().trim() === (purchaseSupplierName || suppliers[0]?.name || '').toLowerCase().trim()
    );

    if (!targetSup && purchaseSupplierName.trim()) {
      const newSupName = purchaseSupplierName.trim();
      addSupplier({
        name: newSupName,
        cuit: '30-00000000-0',
        category: 'Varios & Gastos Generales',
        phone: '11-0000-0000',
        email: '',
        paymentTermDays: 15
      });
      targetSup = {
        id: `sup-${Date.now()}`,
        name: newSupName,
        cuit: '30-00000000-0',
        category: 'Varios & Gastos Generales',
        phone: '11-0000-0000',
        email: '',
        paymentTermDays: 15,
        balanceDue: 0
      };
    }

    const finalSupplierId = targetSup ? targetSup.id : (suppliers[0]?.id || 'sup1');
    const finalSupplierName = targetSup ? targetSup.name : (suppliers[0]?.name || 'Proveedor General');

    addPurchase({
      supplierId: finalSupplierId,
      supplierName: finalSupplierName,
      invoiceNumber: invoiceNumber || `FC-${Date.now().toString().slice(-6)}`,
      date,
      dueDate: dueDate || date,
      amount: parseFloat(amount),
      paidAmount: 0,
      status: 'PENDIENTE',
      items: itemDescription ? [{ description: itemDescription, qty: 1, unitPrice: parseFloat(itemUnitPrice || amount) }] : []
    });

    setAmount('');
    setInvoiceNumber('');
    setItemDescription('');
    setShowPurchaseModal(false);
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName) return;
    if (exactSupplierMatch) {
      alert(`⛔ No es posible registrar el proveedor: Ya existe un registro con el nombre exacto "${exactSupplierMatch.name}".`);
      return;
    }

    addSupplier({
      name: supName,
      cuit: supCuit || '30-00000000-0',
      category: supCategory || 'Varios & Gastos Generales',
      phone: supPhone || '11-0000-0000',
      email: '',
      paymentTermDays: 15,
      initialBalanceDue: parseFloat(supInitialBalanceDue || '0')
    });

    setSupName('');
    setSupCuit('');
    setSupCategory('');
    setSupPhone('');
    setSupInitialBalanceDue('');
    setShowSupplierModal(false);
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) return;

    const targetSup = suppliers.find(s => s.id === paySupplierId) || suppliers[0];
    const targetInvoice = purchases.find(p => p.id === payInvoiceId);

    addSupplierPayment({
      supplierId: targetSup.id,
      supplierName: targetSup.name,
      invoiceId: targetInvoice?.id,
      invoiceNumber: targetInvoice?.invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: payMethod,
      amount: parseFloat(payAmount),
      checkNumber,
      bank: checkBank,
      dueDate: checkDueDate,
      notes: payMethod === 'BONIFICACION_ACUERDO' ? `[Acuerdo / Bonificación Comercial] ${payNotes}` : payNotes
    });

    setPayAmount('');
    setCheckNumber('');
    setPayNotes('');
    setSupplierSearchQuery('');
    setShowPaymentModal(false);
  };

  // Buscador de proveedores en el modal de pago
  const filteredSuppliersForPayment = suppliers.filter(s =>
    s.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
    s.cuit.includes(supplierSearchQuery)
  );

  const selectedSupplier = suppliers.find(s => s.id === paySupplierId) || suppliers[0];

  const selectedSupplierInvoices = purchases.filter(
    p => p.supplierId === paySupplierId && p.status !== 'PAGADO'
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Gestión de Proveedores, Compras y Bonificaciones
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Busca un proveedor para ver sus facturas pendientes y actualizar las tarjetas de deuda automáticamente.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSupplierModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all"
          >
            <Truck className="w-4 h-4 text-amber-400" />
            + Nuevo Proveedor
          </button>
          <button
            onClick={() => {
              setPaySupplierId(suppliers[0]?.id || '');
              setSupplierSearchQuery('');
              setShowPaymentModal(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <CreditCard className="w-4 h-4" />
            + Registrar Pago / Bonificación
          </button>
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            + Factura (OCR)
          </button>
        </div>
      </div>

      {/* TARJETAS SUPERIORES DE DEUDAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" /> Meses Anteriores
          </div>
          <div className="text-xl font-bold text-rose-400">${augustDebt.toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-slate-500">
            {supplierListSearch.trim() !== '' ? 'Deuda previa del proveedor' : 'Facturas impagas anteriores'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" /> Mes Corriente
          </div>
          <div className="text-xl font-bold text-slate-100">${septemberDebt.toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-slate-500">
            {supplierListSearch.trim() !== '' ? 'Deuda actual del proveedor' : 'Facturas emitidas este mes'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" /> Próximos Meses
          </div>
          <div className="text-xl font-bold text-slate-100">${octoberDebt.toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-slate-500">Vencimientos diferidos</div>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/30 p-4 rounded-xl space-y-1">
          <div className="text-xs font-semibold text-amber-400/90 flex items-center justify-between">
            <span>Deuda Total Acumulada</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">${totalFilteredDebt.toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-slate-500">
            {supplierListSearch.trim() !== '' ? 'Deuda del proveedor buscado' : 'Sumatoria general de saldos'}
          </div>
        </div>
      </div>

      {/* TABLA BASE DE PROVEEDORES CON TOOLBAR DE FILTROS INTEGRADOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" /> Base de Proveedores
            </h3>
            <span className="text-xs text-slate-400 font-medium">{sortedAndFilteredSuppliers.length} proveedores</span>
          </div>

          {/* Toolbar integrados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar proveedor por nombre comercial o rubro..."
                value={supplierListSearch}
                onChange={e => setSupplierListSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-amber-500/50 outline-none"
              />
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

          {(supplierListSearch || startDate || endDate) && (
            <div className="flex items-center justify-end pt-1">
              <button
                onClick={() => {
                  setSupplierListSearch('');
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
                <th className="py-3 px-4">Nombre Comercial</th>
                <th className="py-3 px-4">Rubro / Categoría</th>
                <th className="py-3 px-4">Plazo</th>
                <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedAndFilteredSuppliers.length > 0 ? (
                sortedAndFilteredSuppliers.map(sup => (
                    <tr
                      key={sup.id}
                      onClick={() => setSelectedCcSupplierId(sup.id)}
                      className="hover:bg-slate-800/60 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="group-hover:text-amber-400 transition-colors">{sup.name}</span>
                          {sup.lastModifiedBy && (
                            <span title={`Editado por ${sup.lastModifiedBy} el ${sup.lastModifiedAt ? new Date(sup.lastModifiedAt).toLocaleString() : ''}`} className="inline-flex shrink-0">
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 hover:text-amber-400 cursor-help" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-800 text-slate-300 font-medium px-2 py-0.5 rounded text-[10px] border border-slate-700">
                          {sup.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">{sup.paymentTermDays} días</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm whitespace-nowrap">
                        {(() => {
                          const realBal = getSupplierLedgerMovements(sup).finalSaldo;
                          return realBal > 0 ? (
                            <span className="text-rose-400 font-black">${realBal.toLocaleString('es-AR')}</span>
                          ) : realBal < 0 ? (
                            <div>
                              <span className="text-emerald-400 font-black">-${Math.abs(realBal).toLocaleString('es-AR')}</span>
                              <span className="block text-[9px] text-emerald-400/80 font-normal">A favor</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-normal">$0</span>
                          );
                        })()}
                        {(sup.initialBalanceDue || 0) > 0 && (
                          <span className="block text-[9px] text-slate-500 font-normal">
                            (Inicial: ${(sup.initialBalanceDue || 0).toLocaleString('es-AR')})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCcSupplierId(sup.id);
                          }}
                          className="bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Ver Ficha / Cta Cte
                        </button>
                      </td>
                    </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 italic text-xs">
                    No se encontraron proveedores que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN DE CUENTA CORRIENTE Y LIBRO MAYOR DE PROVEEDORES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              Cuenta Corriente & Libro Mayor de Proveedor
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Consulta en tiempo real los movimientos de Debe (Facturas), Haber (Pagos, Cheques y Bonificaciones) y Saldo Acumulado.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium">Seleccionar Proveedor:</label>
            <select
              value={selectedCcSupplierId || (suppliers[0]?.id ?? '')}
              onChange={e => setSelectedCcSupplierId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
            >
              {suppliers.map(s => {
                const bal = getSupplierLedgerMovements(s).finalSaldo;
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} (Saldo: ${bal.toLocaleString('es-AR')})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Tarjetas Resumen de la Cuenta Corriente Seleccionada */}
        {(() => {
          const currentCcSup = suppliers.find(s => s.id === (selectedCcSupplierId || suppliers[0]?.id)) || suppliers[0];
          const ledgerData = getSupplierLedgerMovements(currentCcSup);

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Saldo Inicial de Apertura</span>
                  <span className="text-base font-black text-amber-300">
                    ${(currentCcSup?.initialBalanceDue || 0).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="bg-slate-950 border border-rose-900/40 p-3.5 rounded-xl">
                  <span className="text-[10px] text-rose-400 font-bold block mb-1">Total DEBE (Facturas / Cargos)</span>
                  <span className="text-base font-black text-rose-400">
                    +${ledgerData.totalDebe.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="bg-slate-950 border border-emerald-900/40 p-3.5 rounded-xl">
                  <span className="text-[10px] text-emerald-400 font-bold block mb-1">Total HABER (Pagos / Cheques / Acreditaciones)</span>
                  <span className="text-base font-black text-emerald-400">
                    -${ledgerData.totalHaber.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="bg-slate-950 border border-amber-500/30 bg-amber-500/5 p-3.5 rounded-xl">
                  <span className="text-[10px] text-amber-400 font-bold block mb-1">SALDO ACUMULADO ACTUAL</span>
                  <span className="text-lg font-black text-amber-400">
                    ${ledgerData.finalSaldo.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Tabla Libro Mayor */}
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Concepto / Comprobante</th>
                      <th className="p-3">Medio de Pago / Tipo</th>
                      <th className="p-3 text-right">DEBE (Factura +)</th>
                      <th className="p-3 text-right">HABER (Pago -)</th>
                      <th className="p-3 text-right font-black text-amber-400">SALDO ACUMULADO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {ledgerData.movements.length > 0 ? (
                      ledgerData.movements.map((m, idx) => (
                        <tr key={m.id || idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-semibold text-white whitespace-nowrap">{m.date}</td>
                          <td className="p-3 font-bold text-amber-300">
                            <div>{m.concept}</div>
                            {m.reference && <span className="text-[10px] text-slate-400 font-mono">Ref: {m.reference}</span>}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              m.type === 'INICIAL'
                                ? 'bg-slate-800 text-amber-400 border-slate-700'
                                : m.type === 'FACTURA'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}>
                              {m.method}
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-rose-400">
                            {m.debe > 0 ? `+$${m.debe.toLocaleString('es-AR')}` : '-'}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-400">
                            {m.haber > 0 ? `-$${m.haber.toLocaleString('es-AR')}` : '-'}
                          </td>
                          <td className="p-3 text-right font-black text-white text-sm">
                            ${(m.saldo ?? 0).toLocaleString('es-AR')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500 italic text-xs">
                          No hay movimientos registrados en la cuenta corriente de este proveedor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>

      {/* SECCIÓN DE FACTURAS Y REMITOS PENDIENTES DEL PROVEEDOR BUSCADO */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/60">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              {supplierListSearch.trim() !== ''
                ? `Facturas y Remitos Pendientes de Pago (${sortedAndFilteredSuppliers.map(s => s.name).join(', ')})`
                : 'Facturas de Compra & Remitos Pendientes de Pago (General)'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {supplierListSearch.trim() !== ''
                ? 'Comprobantes impagos imputados al proveedor filtrado arriba.'
                : 'Histórico de facturas ingresadas con saldo pendiente de cancelación.'}
            </p>
          </div>
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 w-fit">
            {filteredPendingPurchases.length} comprobantes impagos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Factura / Remito #</th>
                <th className="p-3">Proveedor</th>
                <th className="p-3">Fecha Factura</th>
                <th className="p-3">Vencimiento</th>
                <th className="p-3">Monto Total</th>
                <th className="p-3">Monto Pagado</th>
                <th className="p-3">Saldo Pendiente</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPendingPurchases.length > 0 ? (
                filteredPendingPurchases.map(p => {
                  const pendingAmount = p.amount - (p.paidAmount || 0);
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-amber-400">{p.invoiceNumber}</td>
                      <td className="p-3 font-bold text-white">{p.supplierName}</td>
                      <td className="p-3 text-slate-300 font-semibold">{p.date}</td>
                      <td className="p-3 text-slate-400">{p.dueDate}</td>
                      <td className="p-3 text-white font-bold">${p.amount.toLocaleString('es-AR')}</td>
                      <td className="p-3 text-emerald-400 font-semibold">${(p.paidAmount || 0).toLocaleString('es-AR')}</td>
                      <td className="p-3 text-rose-400 font-black text-sm">${pendingAmount.toLocaleString('es-AR')}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          p.status === 'PAGADO'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : p.status === 'PARCIAL'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setPaySupplierId(p.supplierId);
                            setPayInvoiceId(p.id);
                            setPayAmount(pendingAmount.toString());
                            setSupplierSearchQuery(p.supplierName);
                            setShowPaymentModal(true);
                          }}
                          className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 px-3 py-1 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1"
                        >
                          <CreditCard className="w-3 h-3" /> Pagar Factura
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-500 italic text-xs">
                    No hay facturas pendientes registradas para la búsqueda realizada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Compra / Factura */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" /> Cargar Factura o Remito
              </h3>
              <button onClick={() => setShowPurchaseModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <button
              type="button"
              onClick={handleSimulateOcr}
              disabled={isScanningOcr}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow"
            >
              <Camera className="w-4 h-4 animate-bounce" />
              {isScanningOcr ? 'Escaneando Factura con IA...' : '📸 Escanear / Cargar Foto de Factura (IA OCR)'}
            </button>

            <form onSubmit={handleAddPurchase} className="space-y-3 pt-2">
              <div>
                <SearchableCombobox
                  label="Proveedor"
                  value={purchaseSupplierName || (suppliers[0]?.name ?? '')}
                  onChange={setPurchaseSupplierName}
                  options={suppliers.map(s => s.name)}
                  placeholder="Buscar o seleccionar proveedor..."
                  allowCustom={true}
                  required={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">N° de Factura / Remito</label>
                  <input
                    type="text"
                    placeholder="FC-A-0001-000456"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Monto Total ($)</label>
                  <input
                    type="number"
                    placeholder="150000"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold text-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Fecha Emisión</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Detalle del Insumo / Producto (Opcional)</label>
                <input
                  type="text"
                  placeholder="Lomo de ternera (15kg)"
                  value={itemDescription}
                  onChange={e => setItemDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg"
                >
                  Guardar Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Proveedor */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Registrar Nuevo Proveedor</h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre Comercial / Razón Social</label>
                <input
                  type="text"
                  placeholder="Distribuidora de Lácteos SRL"
                  value={supName}
                  onChange={e => setSupName(e.target.value)}
                  className={`w-full bg-slate-950 border rounded-xl p-2.5 text-xs text-white outline-none font-bold transition-colors ${
                    exactSupplierMatch
                      ? 'border-rose-500 text-rose-300'
                      : similarSupplierMatch
                      ? 'border-amber-500 text-amber-300'
                      : 'border-slate-800 focus:border-amber-500'
                  }`}
                  required
                />

                {exactSupplierMatch && (
                  <div className="mt-2 p-2.5 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-start gap-2 animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-300 block">⛔ Proveedor ya registrado</span>
                      Ya existe un proveedor con este nombre exacto: <strong>"{exactSupplierMatch.name}"</strong> (Rubro: {exactSupplierMatch.category}).
                    </div>
                  </div>
                )}

                {similarSupplierMatch && (
                  <div className="mt-2 p-2.5 bg-amber-950/80 border border-amber-800 rounded-xl text-amber-200 text-xs flex items-start gap-2 animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300 block">⚠️ Coincidencia detectada</span>
                      Existe un proveedor registrado con nombre similar: <strong>"{similarSupplierMatch.name}"</strong> (Rubro: {similarSupplierMatch.category}). Revisa si no es la misma empresa antes de crearlo.
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">CUIT</label>
                  <input
                    type="text"
                    placeholder="30-12345678-9"
                    value={supCuit}
                    onChange={e => setSupCuit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <SearchableCombobox
                    label="Rubro / Categoría"
                    value={supCategory}
                    onChange={setSupCategory}
                    options={allCategories}
                    placeholder="Buscar o escribir rubro..."
                    allowCustom={true}
                    required={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Teléfono / Celular</label>
                  <input
                    type="text"
                    placeholder="11-4567-8901"
                    value={supPhone}
                    onChange={e => setSupPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-amber-300 font-semibold block mb-1">Saldo Inicial Adeudado ($)</label>
                  <input
                    type="number"
                    placeholder="Ej. 150000"
                    value={supInitialBalanceDue}
                    onChange={e => setSupInitialBalanceDue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold text-amber-400"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg"
                >
                  Crear Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Pago o Bonificación */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" /> Registrar Pago o Bonificación a Proveedor
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-3">
              {/* Buscador de Proveedor en el Modal */}
              <div className="relative">
                <label className="text-xs text-slate-400 block mb-1">Buscar Proveedor (Nombre o CUIT)</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Escribe el nombre o CUIT..."
                    value={supplierSearchQuery}
                    onChange={e => setSupplierSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
                  />
                </div>

                {supplierSearchQuery && filteredSuppliersForPayment.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto divide-y divide-slate-800">
                    {filteredSuppliersForPayment.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setPaySupplierId(s.id);
                          setSupplierSearchQuery(s.name);
                        }}
                        className="w-full text-left p-2.5 text-xs hover:bg-amber-500/20 hover:text-amber-300 text-slate-200 transition-colors flex items-center justify-between"
                      >
                        <span className="font-bold">{s.name}</span>
                        <span className="text-[10px] text-slate-500">Saldo: ${getSupplierLedgerMovements(s).finalSaldo.toLocaleString('es-AR')}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedSupplier && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Proveedor Seleccionado:</span>
                    <span className="font-bold text-amber-400 text-sm">{selectedSupplier.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">Saldo Pendiente:</span>
                    <span className="font-black text-rose-400 text-sm">${getSupplierLedgerMovements(selectedSupplier).finalSaldo.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              )}

              {/* Selector de Factura Pendiente a Imputar (Opcional) */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Imputar a Factura Específica (Opcional)</label>
                <select
                  value={payInvoiceId}
                  onChange={e => {
                    setPayInvoiceId(e.target.value);
                    const inv = purchases.find(p => p.id === e.target.value);
                    if (inv) setPayAmount((inv.amount - (inv.paidAmount || 0)).toString());
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
                >
                  <option value="">Pago General a Cuenta del Proveedor</option>
                  {selectedSupplierInvoices.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.invoiceNumber} - Vence: {p.dueDate} - Saldo: ${(p.amount - (p.paidAmount || 0)).toLocaleString('es-AR')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Método de Pago / Ajuste</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold text-amber-300"
                  >
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    <option value="CHEQUE_PROPIO">Cheque Propio (Emitido)</option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                    <option value="BONIFICACION_ACUERDO">✨ Bonificación / Acuerdo Comercial</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Monto a Descontar ($)</label>
                  <input
                    type="number"
                    placeholder="50000"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold text-emerald-400"
                    required
                  />
                </div>
              </div>

              {/* Transferencia: hay que saber de qué banco sale la plata para que se descuente de ahí */}
              {payMethod === 'TRANSFERENCIA' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                  <label className="text-[11px] font-bold text-amber-300 block">Banco de Origen</label>
                  <input
                    type="text"
                    placeholder="Banco Galicia / Banco Nación / BBVA..."
                    value={checkBank}
                    onChange={e => setCheckBank(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    required
                  />
                  <span className="text-[10px] text-slate-500 block">Este monto se descuenta del saldo de ese banco.</span>
                </div>
              )}

              {/* Si se paga con Cheque Propio */}
              {payMethod === 'CHEQUE_PROPIO' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                  <span className="text-[11px] font-bold text-amber-300 block">Datos del Cheque Emitido</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">N° Cheque</label>
                      <input
                        type="text"
                        placeholder="CHK-001234"
                        value={checkNumber}
                        onChange={e => setCheckNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Banco</label>
                      <input
                        type="text"
                        placeholder="Galicia / BBVA"
                        value={checkBank}
                        onChange={e => setCheckBank(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Vencimiento</label>
                      <input
                        type="date"
                        value={checkDueDate}
                        onChange={e => setCheckDueDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Si es Bonificación / Acuerdo Commercial */}
              {payMethod === 'BONIFICACION_ACUERDO' && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1 text-purple-200 text-xs">
                  <span className="font-bold text-purple-300 block flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-purple-400" /> Bonificación Comercial
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Este monto se descontará directamente de la cuenta del proveedor sin requerir movimiento de efectivo o banco.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 block mb-1">Notas / Motivo del Pago o Descuento</label>
                <input
                  type="text"
                  placeholder="Ej. Descuento por volumen / Pago parcial comprobante"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODIFICAR PROVEEDOR & SALDO INICIAL */}
      {showEditSupplierModal && editingSupplier && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Modificar Proveedor & Saldo Inicial ({role})
              </h3>
              <button onClick={() => setShowEditSupplierModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSaveEditSupplier} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre Comercial / Razón Social</label>
                <input
                  type="text"
                  value={supName}
                  onChange={e => setSupName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">CUIT</label>
                  <input
                    type="text"
                    value={supCuit}
                    onChange={e => setSupCuit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <SearchableCombobox
                    label="Rubro / Categoría"
                    value={supCategory}
                    onChange={setSupCategory}
                    options={allCategories}
                    placeholder="Buscar o escribir rubro..."
                    allowCustom={true}
                    required={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Teléfono / Celular</label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={e => setSupPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-amber-300 font-semibold block mb-1">Saldo Inicial Adeudado ($)</label>
                  <input
                    type="number"
                    placeholder="Ej. 150000"
                    value={supInitialBalanceDue}
                    onChange={e => setSupInitialBalanceDue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold text-amber-400"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>La modificación se registrará bajo el usuario <strong>{role}</strong>.</span>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditSupplierModal(false)}
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
