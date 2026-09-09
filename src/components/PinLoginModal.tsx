'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useGastronomy } from '../context/GastronomyContext';
import { Lock, Delete, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

export const PinLoginModal: React.FC = () => {
  const { isAppAuthenticated, authenticateApp } = useGastronomy();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAppAuthenticated) return null;

  const handleKeyPress = (num: string) => {
    setErrorMsg('');
    if (pin.length < 10) setPin(prev => prev + num);
  };

  const handleDelete = () => {
    setErrorMsg('');
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setErrorMsg('');

    const res = await authenticateApp(pin.trim());
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Clave de acceso incorrecta.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 md:p-8 space-y-6 shadow-2xl text-center">
        {/* Logo & Header */}
        <div className="flex flex-col items-center space-y-2">
          <Image
            src="/cantina-pink-logo.png"
            alt="Cantina Pink"
            width={252}
            height={261}
            className="h-20 w-auto rounded-xl shadow-lg shrink-0"
            priority
          />
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Ingrese la clave numérica para acceder al sistema</span>
          </p>
        </div>

        {/* Display PIN Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
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
              className="w-full bg-slate-950 border-2 border-slate-800 focus:border-amber-500 rounded-2xl py-3.5 px-4 text-center text-2xl font-black tracking-[0.4em] text-amber-400 outline-none transition-all shadow-inner"
            />
          </div>

          {errorMsg && (
            <div className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl animate-shake">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pin}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black py-3.5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <span>Verificando...</span>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* On-screen Numeric Keypad for Mobile Touch screens */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="bg-slate-950 hover:bg-slate-800/80 active:bg-amber-500 active:text-slate-950 text-white font-bold text-lg py-3 rounded-2xl border border-slate-800 transition-colors shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDelete}
            className="bg-slate-950 hover:bg-slate-800/80 text-rose-400 font-bold py-3 rounded-2xl border border-slate-800 transition-colors flex items-center justify-center"
            title="Borrar"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="bg-slate-950 hover:bg-slate-800/80 active:bg-amber-500 active:text-slate-950 text-white font-bold text-lg py-3 rounded-2xl border border-slate-800 transition-colors shadow-sm"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!pin}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-slate-950 font-black text-xs py-3 rounded-2xl transition-colors shadow-sm flex items-center justify-center"
            title="Confirmar"
          >
            OK
          </button>
        </div>

        <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Acceso seguro protegido por PIN gastronómico</span>
        </div>
      </div>
    </div>
  );
};
