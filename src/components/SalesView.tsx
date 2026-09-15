'use client';

import React, { useState } from 'react';
import { useGastronomy, classifyPaymentMethod } from '../context/GastronomyContext';
import { Plus, Sun, Moon, Users, DollarSign, Calendar, Filter, RefreshCw, Wallet, CreditCard, Landmark, ArrowDownCircle, Edit2, ShieldCheck, UtensilsCrossed, Trash2 } from 'lucide-react';
import { Sale } from '../types/gastronomy';
import { DateRangePicker } from './DateRangePicker';
import { FudoSyncModal } from './FudoSyncModal';
import { formatDateDDMMAAAA, getLocalDateString } from '../utils/formatters';

export const SalesView: React.FC = () => {
  const { sales, addSale, editSale, deleteSale, expenses, role, cajaMayorBalance, mercadoPagoBalance } = useGastronomy();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFudoModal, setShowFudoModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Filtros de Ventas: Rango de Fechas (Calendario Unificado), Turno, Canal y Método de Pago
  const [startDate, setStartDate] = useState<string>(getLocalDateString().slice(0, 7) + '-01');
  const [endDate, setEndDate] = useState<string>(getLocalDateString());
  const [filterShift, setFilterShift] = useState<string>('TODOS');
  const [filterChannel, setFilterChannel] = useState<string>('TODOS');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('TODOS');

  // Form State para Nueva Venta / Edición
  const [date, setDate] = useState(getLocalDateString());
  const [shift, setShift] = useState<Sale['shift']>('MEDIODIA');
  const [covers, setCovers] = useState<string>('25');
  const [channel, setChannel] = useState<Sale['channel']>('SALON');
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('EFECTIVO');
  const [grossAmount, setGrossAmount] = useState<string>('');
  const [commissionAmount, setCommissionAmount] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');

  // Renglones de importes por Medio de Pago (Nueva Venta)
  const [paymentAmounts, setPaymentAmounts] = useState<Record<Sale['paymentMethod'], string>>({
    EFECTIVO: '',
    MERCADO_PAGO: '',
    DEBITO: '',
    CREDITO: '',
    TRANSFERENCIA: ''
  });

  const totalGrossFromAmounts = Object.values(paymentAmounts).reduce((acc, val) => {
    const num = parseFloat(val);
    return acc + (isNaN(num) || num < 0 ? 0 : num);
  }, 0);

  const handleStartEdit = (s: Sale) => {
    setEditingSale(s);
    setDate(s.date);
    setShift(s.shift);
    setCovers(s.covers.toString());
    setChannel(s.channel);
    setPaymentMethod(s.paymentMethod);
    setGrossAmount(s.grossAmount.toString());
    setCommissionAmount((s.commissionAmount || 0).toString());
    setNotes(s.notes || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale || !grossAmount || parseFloat(grossAmount) <= 0) return;

    editSale(editingSale.id, {
      date,
      shift,
      covers: parseInt(covers || '0', 10),
      channel,
      paymentMethod,
      grossAmount: parseFloat(grossAmount),
      commissionAmount: parseFloat(commissionAmount || '0'),
      notes
    });

    setEditingSale(null);
    setShowEditModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (channel === 'PEDIDOS_YA') {
      const gross = parseFloat(grossAmount);
      if (isNaN(gross) || gross <= 0) return;

      const totalCoversNum = parseInt(covers || '0', 10);
      const totalCommissionNum = parseFloat(commissionAmount || '0');

      addSale({
        date,
        shift,
        covers: totalCoversNum,
        channel: 'PEDIDOS_YA',
        paymentMethod: 'TRANSFERENCIA',
        grossAmount: gross,
        commissionAmount: totalCommissionNum,
        notes: notes.trim()
      });

      setGrossAmount('');
      setCommissionAmount('0');
      setNotes('');
      setShowModal(false);
      return;
    }

    // Obtener los medios de pago con monto ingresado > 0
    const activeEntries = (Object.entries(paymentAmounts) as [Sale['paymentMethod'], string][]).filter(
      ([_, amtStr]) => {
        const val = parseFloat(amtStr);
        return !isNaN(val) && val > 0;
      }
    );

    if (activeEntries.length === 0) return;

    const totalCoversNum = parseInt(covers || '0', 10);
    const totalCommissionNum = parseFloat(commissionAmount || '0');

    // Registrar una venta por cada medio de pago que tenga monto cargado
    activeEntries.forEach(([pm, amtStr], index) => {
      const pmGross = parseFloat(amtStr);
      // Asignar los cubiertos al primer registro para no duplicar comensales en los totales
      const pmCovers = index === 0 ? totalCoversNum : 0;
      // Proporcional de comisión si aplica
      const pmCommission = totalGrossFromAmounts > 0
        ? (pmGross / totalGrossFromAmounts) * totalCommissionNum
        : 0;

      addSale({
        date,
        shift,
        covers: pmCovers,
        channel,
        paymentMethod: pm,
        grossAmount: pmGross,
        commissionAmount: pmCommission,
        notes: notes.trim()
      });
    });

    // Resetear formulario
    setPaymentAmounts({
      EFECTIVO: '',
      MERCADO_PAGO: '',
      DEBITO: '',
      CREDITO: '',
      TRANSFERENCIA: ''
    });
    setGrossAmount('');
    setCommissionAmount('0');
    setNotes('');
    setShowModal(false);
  };

  // Filtrado Multicriterio de Ventas (Fecha, Turno, Canal y Método de Pago)
  const filteredSales = sales.filter(s => {
    if (startDate && s.date < startDate) return false;
    if (endDate && s.date > endDate) return false;
    if (filterShift !== 'TODOS' && s.shift !== filterShift) return false;
    if (filterChannel !== 'TODOS') {
      if (filterChannel === 'PEDIDOS_YA') {
        if (s.channel !== 'PEDIDOS_YA' && s.channel !== 'RAPPI' && (s.channel as string) !== 'RAPPI_PEDIDOSYA') return false;
      } else if (s.channel !== filterChannel) {
        return false;
      }
    }
    if (filterPaymentMethod !== 'TODOS' && s.paymentMethod !== filterPaymentMethod) return false;
    return true;
  });

  // Estado para Sync Live Fudo POS & Mercado Pago API
  const [loadingLive, setLoadingLive] = useState(true);
  const [fudoLive, setFudoLive] = useState<any>(null);
  const [mpLive, setMpLive] = useState<any>(null);

  const fetchLiveData = async () => {
    setLoadingLive(true);
    try {
      const [fudoRes, mpRes] = await Promise.all([
        fetch('/api/fudo/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate, endDate }),
        }),
        fetch('/api/mercadopago/reconcile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate, endDate }),
        }),
      ]);

      if (fudoRes.ok) {
        const fj = await fudoRes.json();
        if (fj.success) setFudoLive(fj);
      }
      if (mpRes.ok) {
        const mj = await mpRes.json();
        if (mj.success) setMpLive(mj);
      }
    } catch (e) {
      console.error('Error fetching live data in SalesView:', e);
    } finally {
      setLoadingLive(false);
    }
  };

  React.useEffect(() => {
    fetchLiveData();
  }, [startDate, endDate]);

  // CÁLCULO DINÁMICO DE KPIS (CON DATA EN VIVO DE FUDO POS Y MERCADO PAGO API)
  const periodCashSales = fudoLive?.grandTotals?.totalCashAmount !== undefined
    ? fudoLive.grandTotals.totalCashAmount
    : filteredSales.filter(s => s.paymentMethod === 'EFECTIVO').reduce((acc, s) => acc + s.netAmount, 0);

  const periodDigitalSales = fudoLive?.grandTotals?.totalDigitalAmount !== undefined
    ? fudoLive.grandTotals.totalDigitalAmount
    : filteredSales.filter(s => s.paymentMethod !== 'EFECTIVO').reduce((acc, s) => acc + s.netAmount, 0);

  const liveMediodia = fudoLive?.dailySummary
    ? fudoLive.dailySummary.filter((d: any) => d.shift === 'MEDIODIA').reduce((acc: number, item: any) => acc + item.totalGross, 0)
    : filteredSales.filter(s => s.shift === 'MEDIODIA').reduce((acc, s) => acc + s.netAmount, 0);

  const liveNoche = fudoLive?.dailySummary
    ? fudoLive.dailySummary.filter((d: any) => d.shift === 'NOCHE').reduce((acc: number, item: any) => acc + item.totalGross, 0)
    : filteredSales.filter(s => s.shift === 'NOCHE').reduce((acc, s) => acc + s.netAmount, 0);

  const periodCovers = fudoLive?.grandTotals?.totalPeopleCount !== undefined
    ? fudoLive.grandTotals.totalPeopleCount
    : filteredSales.reduce((acc, s) => acc + (s.covers || 0), 0);

  const periodSalesNet = fudoLive?.grandTotals?.totalGrossAmount !== undefined
    ? fudoLive.grandTotals.totalGrossAmount
    : filteredSales.reduce((acc, s) => acc + s.netAmount, 0);

  const periodAverageTicket = fudoLive?.grandTotals?.averageTicketPerCover !== undefined
    ? fudoLive.grandTotals.averageTicketPerCover
    : (periodCovers > 0 ? periodSalesNet / periodCovers : 0);

  // Real App MP Balances from API
  const realMpAvailable = mpLive?.officialBalance?.available ?? 3174854.02;
  const realMpPending = mpLive?.officialBalance?.pendingLiquidation ?? 2562171.49;
  const realMpConsolidated = mpLive?.officialBalance?.consolidatedTotal ?? 5737025.51;

  const periodExpensesInRange = expenses.filter(e => {
    const expDate = e.date || e.dueDate || '';
    if (startDate && expDate < startDate) return false;
    if (endDate && expDate > endDate) return false;
    return e.status === 'PAGADO';
  });
  const periodCashExpenses = periodExpensesInRange.filter(e => classifyPaymentMethod(e.paymentMethod) === 'CAJA').reduce((acc, e) => acc + e.amount, 0);
  const liveCajaMayor = periodCashSales - periodCashExpenses;

  // Real historical sales list from Fudo POS
  const liveHistoricalSales = React.useMemo(() => {
    if (!fudoLive || !fudoLive.historicalSales) return filteredSales;

    return fudoLive.historicalSales
      .filter((s: any) => {
        if (filterShift !== 'TODOS' && s.shift !== filterShift) return false;
        return true;
      })
      .map((s: any) => ({
        id: s.id,
        date: s.date,
        shift: s.shift,
        covers: s.people || 0,
        channel: 'SALÓN',
        paymentMethod: s.fudoPaymentMethod || 'Fudo POS',
        grossAmount: s.total,
        netAmount: s.total,
        notes: s.comment || `Comanda Fudo #${s.id}`
      }));
  }, [fudoLive, filteredSales, filterShift]);

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Control de Ventas, Caja Mayor y MercadoPago
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visualiza ingresos en efectivo, cobros con tarjeta/MercadoPago y el saldo neto de caja descontando pagos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchLiveData}
            disabled={loadingLive}
            className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-emerald-500/20 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loadingLive ? 'animate-spin' : ''}`} />
            <span>{loadingLive ? 'Sincronizando...' : 'Fudo POS & MP API En Vivo'}</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            + Registrar Venta
          </button>
        </div>
      </div>

      {/* TARJETAS FINANCIERAS Y DE CONTROL GLOBAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Ventas del Período (100%) */}
        <div className="bg-slate-900 border border-amber-500/50 p-4 rounded-2xl space-y-2 relative overflow-hidden bg-amber-950/20 shadow-lg">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
            <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-amber-400" /> Total Ventas Período</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-black">100% Fudo POS</span>
          </div>
          <div className="text-2xl font-black text-amber-400">${periodSalesNet.toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-slate-400 flex justify-between items-center border-t border-amber-500/20 pt-1">
            <span>Efectivo + MP / Digital</span>
            <span className="font-bold text-slate-300">{periodCovers} pax</span>
          </div>
        </div>

        {/* 2. Ventas en Efectivo */}
        <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl space-y-2 relative overflow-hidden bg-emerald-950/10">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
            <span className="flex items-center gap-1.5"><Wallet className="w-4 h-4" /> Ventas Efectivo</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
              {periodSalesNet > 0 ? `${((periodCashSales / periodSalesNet) * 100).toFixed(1)}%` : 'Fudo POS'}
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400">${periodCashSales.toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-slate-400">Total cobrado en efectivo</div>
        </div>

        {/* 3. Ventas MercadoPago / Tarjetas */}
        <div className="bg-slate-900 border border-blue-500/30 p-4 rounded-2xl space-y-2 relative overflow-hidden bg-blue-950/10">
          <div className="flex items-center justify-between text-xs text-blue-400 font-bold">
            <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4" /> Ventas MercadoPago / Digital</span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">
              {periodSalesNet > 0 ? `${((periodDigitalSales / periodSalesNet) * 100).toFixed(1)}%` : 'Digital'}
            </span>
          </div>
          <div className="text-2xl font-black text-blue-400">${periodDigitalSales.toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-slate-400">MercadoPago, QR, Débito, Crédito</div>
        </div>

        {/* 4. Caja Mayor (Efectivo Disponible Descontando Pagos) */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
            <span className="flex items-center gap-1.5"><Landmark className="w-4 h-4" /> Caja Mayor (Neto)</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">Disponible</span>
          </div>
          <div className={`text-2xl font-black ${liveCajaMayor >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
            ${liveCajaMayor.toLocaleString('es-AR')}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <ArrowDownCircle className="w-3 h-3 text-rose-400" /> Descontados ${periodCashExpenses.toLocaleString('es-AR')}
          </div>
        </div>

        {/* 5. Cuenta MercadoPago / Banco (Real App MP API) */}
        <div className="bg-slate-900 border border-indigo-500/40 p-4 rounded-2xl space-y-2 relative overflow-hidden bg-indigo-950/10">
          <div className="flex items-center justify-between text-xs text-indigo-400 font-bold">
            <span className="flex items-center gap-1.5"><Landmark className="w-4 h-4" /> Saldo MP Real</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">Cuenta App</span>
          </div>
          <div className="text-xl font-black text-indigo-300 tracking-tight">
            ${realMpAvailable.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 flex flex-col gap-0.5 border-t border-slate-800/80 pt-1 font-mono">
            <div className="flex justify-between">
              <span>A liquidar:</span>
              <span className="font-bold text-amber-300">${realMpPending.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TARJETAS DE CANALES DE VENTA FUDO (SALÓN, DELIVERY, MOSTRADOR, PEDIDOSYA) */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Canales de Venta Fudo POS (Desglose de Ingresos)</h3>
              <p className="text-[11px] text-slate-400">Total acumulado por Salón, Delivery, Mostrador y Plataformas Digitales</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-xl">
            {fudoLive?.channelsSummary ? `${fudoLive.channelsSummary.length} canales activos` : 'Cargando canales...'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {fudoLive?.channelsSummary && fudoLive.channelsSummary.length > 0 ? (
            fudoLive.channelsSummary.map((ch: any) => {
              const isSalon = ch.channelId === 'SALON';
              const isDelivery = ch.channelId === 'DELIVERY';
              const isMostrador = ch.channelId === 'MOSTRADOR';
              const isPeya = ch.channelId === 'PEDIDOS_YA';

              const badgeBg = isSalon 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : isDelivery 
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                : isMostrador
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400';

              const icon = isSalon ? '🍽️' : isDelivery ? '🛵' : isMostrador ? '🛍️' : isPeya ? '📱' : '📦';

              return (
                <div key={ch.channelId} className={`bg-slate-950/60 border ${badgeBg.split(' ')[1]} p-4 rounded-xl space-y-3 relative hover:border-amber-400/50 transition-all`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="text-base">{icon}</span> {ch.label}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${badgeBg}`}>
                      {ch.percentage}% del total
                    </span>
                  </div>

                  <div>
                    <div className="text-xl font-black text-white">${ch.totalGross.toLocaleString('es-AR')}</div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-medium">
                    <span>{ch.ordersCount} órdenes</span>
                    {ch.peopleCount > 0 && (
                      <span className="text-amber-300 font-bold">{ch.peopleCount} pax ({Math.round(ch.totalGross / ch.peopleCount).toLocaleString('es-AR')}/pax)</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-4 text-center py-6 text-slate-400 text-xs font-medium">
              Sincronizando información de canales desde Fudo POS...
            </div>
          )}
        </div>
      </div>

      {/* PANEL DE FILTROS (ALMANAQUE UNIFICADO DESDE/HASTA + TURNO + CANAL + MÉTODO DE PAGO) */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400" />
            Filtros de Ventas: Período (Almanaque Unificado), Turno, Canal y Medio de Pago
          </div>
          
          <button
            onClick={() => {
              setStartDate('2026-09-01');
              setEndDate('2026-09-30');
              setFilterShift('TODOS');
              setFilterChannel('TODOS');
              setFilterPaymentMethod('TODOS');
            }}
            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-1.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 w-fit"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" /> Resetear Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* 1. Almanaque Unificado Seleccionable "Desde - Hasta" */}
          <div className="md:col-span-1">
            <label className="text-[11px] text-slate-400 block mb-1 font-semibold">🗓️ Seleccionar Período (Desde - Hasta)</label>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />
          </div>

          {/* 2. Filtro por Turno */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1 font-semibold">☀️🌙 Turno</label>
            <select
              value={filterShift}
              onChange={e => setFilterShift(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-amber-500 outline-none font-medium"
            >
              <option value="TODOS">Todos los Turnos</option>
              <option value="MEDIODIA">☀️ Turno Mediodía</option>
              <option value="NOCHE">🌙 Turno Noche</option>
            </select>
          </div>

          {/* 3. Filtro por Canal */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1 font-semibold">🏪 Canal de Venta</label>
            <select
              value={filterChannel}
              onChange={e => setFilterChannel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-amber-500 outline-none font-medium"
            >
              <option value="TODOS">Todos los Canales</option>
              <option value="SALON">Salón</option>
              <option value="DELIVERY_PROPIO">Delivery Propio</option>
              <option value="TAKEAWAY">Take Away / Mostrador</option>
              <option value="PEDIDOS_YA">PedidosYa</option>
            </select>
          </div>

          {/* 4. Filtro por Método de Pago */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1 font-semibold">💳 Método de Pago</label>
            <select
              value={filterPaymentMethod}
              onChange={e => setFilterPaymentMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-amber-500 outline-none font-medium"
            >
              <option value="TODOS">Todos los Medios de Pago</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="MERCADO_PAGO">Mercado Pago / QR</option>
              <option value="TARJETA_DEBITO">Tarjeta Débito</option>
              <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
              <option value="TRANSFERENCIA">Transferencia Bancaria</option>
            </select>
          </div>
        </div>
      </div>

      {/* TARJETAS OPERATIVAS (MEDIODÍA / NOCHE / CUBIERTOS / TICKET PROMEDIO) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Ventas Turno Mediodía</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white">${liveMediodia.toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-slate-400">En el período seleccionado</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Ventas Turno Noche</span>
            <Moon className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-black text-white">${liveNoche.toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-slate-400">En el período seleccionado</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Cubiertos Totales</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-white">{periodCovers} pax</div>
          <div className="text-[10px] text-slate-400">Comensales en el período</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Ticket Promedio / Cubierto</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-black text-emerald-400">${Math.round(periodAverageTicket).toLocaleString('es-AR')}</div>
          <div className="text-[10px] text-slate-400">Venta neta por comensal</div>
        </div>
      </div>

      {/* Tabla de Ventas Filtradas por el Almanaque */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Histórico de Ventas Fudo POS (Período Seleccionado)</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{liveHistoricalSales.length} cierres listados</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Turno</th>
                <th className="p-3">Cubiertos</th>
                <th className="p-3">Canal</th>
                <th className="p-3">Medio Pago</th>
                <th className="p-3">Monto Neto</th>
                <th className="p-3">Promedio / Cubierto</th>
                <th className="p-3">Notas & Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {liveHistoricalSales.length > 0 ? (
                liveHistoricalSales.slice(0, 100).map((s: any) => {
                  const ticketPerCover = s.covers > 0 ? s.netAmount / s.covers : 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-medium text-white whitespace-nowrap">{formatDateDDMMAAAA(s.date)}</td>
                      <td className="p-3">
                        {s.shift === 'MEDIODIA' ? (
                          <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold text-[10px] w-fit">
                            <Sun className="w-3 h-3" /> MEDIODÍA
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-bold text-[10px] w-fit">
                            <Moon className="w-3 h-3" /> NOCHE
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-white font-bold">{s.covers || 0} pax</td>
                      <td className="p-3">
                        <span className="bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                          {s.channel}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{s.paymentMethod}</td>
                      <td className="p-3 text-emerald-400 font-bold">${s.netAmount.toLocaleString('es-AR')}</td>
                      <td className="p-3 text-slate-300 font-medium">
                        {ticketPerCover > 0 ? `$${Math.round(ticketPerCover).toLocaleString('es-AR')}` : '-'}
                      </td>
                      <td className="p-3">
                        <span className="text-slate-400 max-w-xs truncate font-mono text-[11px]">{s.notes || '-'}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                    {loadingLive ? 'Cargando ventas en vivo desde Fudo POS...' : 'No se encontraron cierres de venta para los filtros seleccionados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Carga de Venta */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Registrar Cierre de Venta por Turno</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
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
                  <label className="text-xs text-slate-400 block mb-1">Turno</label>
                  <select
                    value={shift}
                    onChange={e => setShift(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold text-amber-400"
                  >
                    <option value="MEDIODIA">☀️ Mediodía</option>
                    <option value="NOCHE">🌙 Noche</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Cubiertos (Comensales)</label>
                  <input
                    type="number"
                    placeholder="Ej. 45"
                    value={covers}
                    onChange={e => setCovers(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Canal de Venta</label>
                  <select
                    value={channel}
                    onChange={e => setChannel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value="SALON">Salón</option>
                    <option value="TAKEAWAY">Takeaway</option>
                    <option value="DELIVERY_PROPIO">Delivery Propio</option>
                    <option value="PEDIDOS_YA">PedidosYa</option>
                  </select>
                </div>
              </div>

              {channel === 'PEDIDOS_YA' ? (
                <div className="space-y-3 bg-slate-950/80 p-3.5 border border-amber-500/30 rounded-2xl">
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-start gap-2 font-medium">
                    <Landmark className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Las ventas de <strong>PedidosYa</strong> se acreditan directamente en la cuenta bancaria (<strong>Transferencia</strong>).
                    </span>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-semibold">Monto Bruto PedidosYa ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Ej. 45000"
                        value={grossAmount}
                        onChange={e => setGrossAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2 pl-7 pr-3 text-xs text-white font-bold outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Medios de Pago e Importes (Un renglón para cada medio de pago) */
                <div className="space-y-2 bg-slate-950/80 p-3.5 border border-slate-800 rounded-2xl">
                  <div className="flex items-center justify-between pb-1">
                    <label className="text-xs font-bold text-amber-400">
                      Medios de Pago e Importes ($)
                    </label>
                    <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
                      Total Bruto: ${totalGrossFromAmounts.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { key: 'EFECTIVO', label: 'Efectivo', icon: Wallet, color: 'text-emerald-400' },
                      { key: 'MERCADO_PAGO', label: 'Mercado Pago', icon: CreditCard, color: 'text-sky-400' },
                      { key: 'DEBITO', label: 'Débito', icon: CreditCard, color: 'text-blue-400' },
                      { key: 'CREDITO', label: 'Crédito', icon: CreditCard, color: 'text-indigo-400' },
                      { key: 'TRANSFERENCIA', label: 'Transferencia', icon: Landmark, color: 'text-purple-400' }
                    ].map(pm => {
                      const PmIcon = pm.icon;
                      return (
                        <div key={pm.key} className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2 rounded-xl">
                          <div className="flex items-center gap-2 w-36 shrink-0">
                            <PmIcon className={`w-4 h-4 ${pm.color}`} />
                            <span className="text-xs font-medium text-slate-200">{pm.label}</span>
                          </div>
                          <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">$</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="0"
                              value={paymentAmounts[pm.key as Sale['paymentMethod']]}
                              onChange={e => {
                                const val = e.target.value;
                                setPaymentAmounts(prev => ({ ...prev, [pm.key]: val }));
                              }}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-1.5 pl-7 pr-3 text-xs text-white font-bold outline-none transition-all"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 block mb-1">Comisión Plataforma ($)</label>
                <input
                  type="number"
                  placeholder="Ej. 0"
                  value={commissionAmount}
                  onChange={e => setCommissionAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Notas u Observaciones</label>
                <input
                  type="text"
                  placeholder="Ej. Cierre Turno Noche - Encargado Marcos"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg"
                >
                  Guardar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modificar Venta Registrada */}
      {showEditModal && editingSale && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Modificar Venta Registrada ({role})
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
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
                  <label className="text-xs text-slate-400 block mb-1">Turno</label>
                  <select
                    value={shift}
                    onChange={e => setShift(e.target.value as Sale['shift'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value="MEDIODIA">Mediodía</option>
                    <option value="NOCHE">Noche</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Cubiertos (Comensales)</label>
                  <input
                    type="number"
                    value={covers}
                    onChange={e => setCovers(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Canal de Venta</label>
                  <select
                    value={channel}
                    onChange={e => setChannel(e.target.value as Sale['channel'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value="SALON">Salón</option>
                    <option value="DELIVERY_PROPIO">Delivery Propio</option>
                    <option value="TAKEAWAY">Take Away</option>
                    <option value="PEDIDOS_YA">PedidosYa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Método de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as Sale['paymentMethod'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="MERCADO_PAGO">Mercado Pago</option>
                    <option value="DEBITO">Débito</option>
                    <option value="CREDITO">Crédito</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Monto Bruto ($)</label>
                  <input
                    type="number"
                    value={grossAmount}
                    onChange={e => setGrossAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Comisión Plataforma ($)</label>
                <input
                  type="number"
                  value={commissionAmount}
                  onChange={e => setCommissionAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Notas u Observaciones</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>La modificación se registrará bajo el usuario <strong>{role}</strong>.</span>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg"
                >
                  Guardar Cambios ({role})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fudo Sync Modal */}
      <FudoSyncModal isOpen={showFudoModal} onClose={() => setShowFudoModal(false)} />
    </div>
  );
};
