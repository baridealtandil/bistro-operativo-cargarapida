'use client';

import React, { useState } from 'react';
import { useGastronomy } from '../context/GastronomyContext';
import { Users, KeyRound, ArrowRight, X } from 'lucide-react';

interface EmployeesPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminPinModal: React.FC<EmployeesPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { authenticateEmployees } = useGastronomy();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setErrorMsg('');

    const res = await authenticateEmployees(pin.trim());
    setLoading(false);

    if (res.success) {
      setPin('');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMsg(res.message || 'Clave de Empleados incorrecta.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Acceso a Empleados
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Ingrese la clave numérica de Empleados para acceder a la nómina, fichaje y sueldos del personal.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Clave de Empleados
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              placeholder="•••••"
              value={pin}
              onChange={e => {
                setErrorMsg('');
                setPin(e.target.value);
              }}
              className="w-full bg-slate-950 border-2 border-slate-800 focus:border-amber-500 rounded-2xl py-3 px-4 text-center text-xl font-black tracking-[0.3em] text-amber-400 outline-none transition-all"
            />
          </div>

          {errorMsg && (
            <div className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !pin}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-colors flex items-center gap-1.5"
            >
              {loading ? (
                <span>Validando...</span>
              ) : (
                <>
                  <span>Desbloquear Empleados</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
