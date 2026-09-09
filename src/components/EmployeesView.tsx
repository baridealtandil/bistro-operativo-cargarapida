'use client';

import React, { useState } from 'react';
import { useGastronomy } from '../context/GastronomyContext';
import { Users, Plus, DollarSign, Calendar, ShieldCheck, Search, Filter, X, FileText, UserPlus, Lock } from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';

export const EmployeesView: React.FC = () => {
  const { employees, addEmployee, advances, addAdvance, totalLaborMonth, laborCostPercentage, lockEmployees } = useGastronomy();
  const [showModal, setShowModal] = useState(false);
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);

  // Filtro de Búsqueda y Almanaque Rango de Fechas (Desde - Hasta)
  const [searchEmp, setSearchEmp] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form State para Nuevo Empleado
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('COCINA');
  const [empPaymentType, setEmpPaymentType] = useState<'MENSUAL' | 'JORNAL'>('MENSUAL');
  const [empBaseSalary, setEmpBaseSalary] = useState('');

  // Form State para Nuevo Adelanto
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empBaseSalary || parseFloat(empBaseSalary) <= 0) return;

    addEmployee({
      name: empName.trim(),
      role: empRole.trim().toUpperCase() as any,
      paymentType: empPaymentType,
      baseSalary: parseFloat(empBaseSalary),
      active: true
    });

    setEmpName('');
    setEmpBaseSalary('');
    setShowAddEmpModal(false);
  };

  const handleAddAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    const emp = employees.find(e => e.id === employeeId) || employees[0];

    if (!emp) return;

    addAdvance({
      employeeId: emp.id,
      employeeName: emp.name,
      date: advanceDate || new Date().toISOString().split('T')[0],
      amount: parseFloat(amount),
      notes
    });

    setAmount('');
    setNotes('');
    setShowModal(false);
  };

  // Filtrar Adelantos por Empleado y Almanaque Rango de Fechas
  const filteredAdvances = advances.filter(a => {
    const matchesSearch = searchEmp.trim() === '' ||
      a.employeeName.toLowerCase().includes(searchEmp.toLowerCase()) ||
      (a.notes && a.notes.toLowerCase().includes(searchEmp.toLowerCase()));

    const matchesStart = !startDate || a.date >= startDate;
    const matchesEnd = !endDate || a.date <= endDate;

    return matchesSearch && matchesStart && matchesEnd;
  });

  const totalFilteredAdvancesAmount = filteredAdvances.reduce((acc, a) => acc + a.amount, 0);

  // Filtrar Empleados por búsqueda
  const filteredEmployees = employees.filter(emp =>
    searchEmp.trim() === '' ||
    emp.name.toLowerCase().includes(searchEmp.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchEmp.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Personal, Sueldos y Adelantos (Labor Cost)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestión completa de personal, sueldos base, carga de nuevos empleados y adelantos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => lockEmployees()}
            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all"
            title="Bloquear acceso al módulo de Empleados"
          >
            <Lock className="w-4 h-4" />
            Bloquear Módulo
          </button>

          <button
            onClick={() => {
              setEmpName('');
              setEmpBaseSalary('');
              setEmpRole('COCINA');
              setEmpPaymentType('MENSUAL');
              setShowAddEmpModal(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <UserPlus className="w-4 h-4" />
            + Agregar Empleado
          </button>

          <button
            onClick={() => {
              if (employees.length > 0 && !employeeId) {
                setEmployeeId(employees[0].id);
              }
              setAmount('');
              setNotes('');
              setAdvanceDate(new Date().toISOString().split('T')[0]);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            + Registrar Adelanto
          </button>
        </div>
      </div>

      {/* KPI Labor Cost */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Costo Laboral Total (Mes)</div>
            <div className="text-2xl font-black text-white mt-1">${totalLaborMonth.toLocaleString('es-AR')}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Labor Cost %</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{laborCostPercentage.toFixed(1)}%</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Adelantos Entregados (Período Seleccionado)</div>
            <div className="text-2xl font-black text-rose-400 mt-1">
              ${totalFilteredAdvancesAmount.toLocaleString('es-AR')}
            </div>
          </div>
          <div className="text-xs text-slate-400 text-right">
            {filteredAdvances.length} adelantos en el rango
          </div>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y ALMANAQUE RANGO DE FECHAS (DESDE - HASTA) */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <div className="relative">
            <label className="text-[10px] text-slate-400 block mb-1 font-medium">Buscar por Empleado o Puesto</label>
            <div className="relative">
              <Search className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Ej. Carlos Rodríguez, Cocina, Mozo..."
                value={searchEmp}
                onChange={e => setSearchEmp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold"
              />
              {searchEmp && (
                <button
                  onClick={() => setSearchEmp('')}
                  className="absolute right-2.5 top-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2 py-1 rounded-lg border border-slate-700 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1 font-medium">📅 Seleccionar Período (Desde - Hasta)</label>
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

        {(searchEmp || startDate || endDate) && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
            <span className="text-[11px] text-amber-400 font-semibold">
              Filtros activos de personal y fechas
            </span>
            <button
              onClick={() => {
                setSearchEmp('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-medium"
            >
              <X className="w-3 h-3" /> Limpiar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla Nómina de Personal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Nómina de Personal</h3>
          <span className="text-xs text-slate-400">{filteredEmployees.length} empleados listados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Puesto</th>
                <th className="p-3">Modalidad</th>
                <th className="p-3">Sueldo Base</th>
                <th className="p-3">Adelantos Acum. (Período)</th>
                <th className="p-3">Saldo a Liquidar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEmployees.map(emp => {
                const empAdv = filteredAdvances.filter(a => a.employeeId === emp.id).reduce((acc, a) => acc + a.amount, 0);
                const netToPay = emp.baseSalary - empAdv;
                return (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-white whitespace-nowrap">{emp.name}</td>
                    <td className="p-3">
                      <span className="bg-slate-800 text-amber-400 font-bold px-2 py-0.5 rounded text-[10px]">
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{emp.paymentType}</td>
                    <td className="p-3 text-slate-200 font-medium">${emp.baseSalary.toLocaleString('es-AR')}</td>
                    <td className="p-3 text-rose-400 font-medium">-${empAdv.toLocaleString('es-AR')}</td>
                    <td className="p-3 text-emerald-400 font-bold">${netToPay.toLocaleString('es-AR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Adelantos y Vales Otorgados */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            Historial de Adelantos / Vales Otorgados (Período Seleccionado)
          </h3>
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            {filteredAdvances.length} adelantos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Empleado</th>
                <th className="p-3">Monto Adelanto</th>
                <th className="p-3">Notas / Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAdvances.length > 0 ? (
                filteredAdvances.map(adv => (
                  <tr key={adv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-white">{adv.date}</td>
                    <td className="p-3 font-bold text-amber-300">{adv.employeeName}</td>
                    <td className="p-3 font-black text-rose-400 text-sm">${adv.amount.toLocaleString('es-AR')}</td>
                    <td className="p-3 text-slate-400">{adv.notes || 'Adelanto registrado'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500 italic text-xs">
                    No se registraron adelantos para el período seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cargar Nuevo Empleado */}
      {showAddEmpModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                Cargar Nuevo Empleado a la Nómina
              </h3>
              <button onClick={() => setShowAddEmpModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Nombre y Apellido del Empleado</label>
                <input
                  type="text"
                  placeholder="Ej. Matías Fernández"
                  value={empName}
                  onChange={e => setEmpName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Puesto / Rol</label>
                  <select
                    value={empRole}
                    onChange={e => setEmpRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none font-medium"
                  >
                    <option value="COCINA">COCINA</option>
                    <option value="MOZO">MOZO / SALÓN</option>
                    <option value="BARRA">BARRA / BARTENDER</option>
                    <option value="ENCAJERO">CAJA / CAJERO</option>
                    <option value="LIMPIEZA">LIMPIEZA & BHA</option>
                    <option value="GERENTE">ENCARGADO / GERENTE</option>
                    <option value="DELIVERY">DELIVERY</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Modalidad de Pago</label>
                  <select
                    value={empPaymentType}
                    onChange={e => setEmpPaymentType(e.target.value as 'MENSUAL' | 'JORNAL')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none font-medium"
                  >
                    <option value="MENSUAL">MENSUAL</option>
                    <option value="JORNAL">JORNAL / DIARIO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Sueldo / Salario Base ($)</label>
                <input
                  type="number"
                  placeholder="Ej. 650000"
                  value={empBaseSalary}
                  onChange={e => setEmpBaseSalary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-emerald-400 font-bold focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition-colors"
                >
                  Guardar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Adelanto */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Registrar Adelanto / Vale</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleAddAdvance} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Empleado</label>
                <select
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Monto del Adelanto ($)</label>
                  <input
                    type="number"
                    placeholder="30000"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none font-bold text-rose-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Fecha del Adelanto</label>
                  <input
                    type="date"
                    value={advanceDate}
                    onChange={e => setAdvanceDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Motivo / Notas</label>
                <input
                  type="text"
                  placeholder="Adelanto de quincena por emergencia personal"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                />
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
                  Guardar Adelanto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
