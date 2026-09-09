'use client';

import React, { useState } from 'react';
import { Webhook, Check, Copy, ArrowRight, BellRing, Sparkles } from 'lucide-react';

export const MakeIntegrationView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const webhookUrl = 'https://hook.us1.make.com/gastronomy-admin-sync-v1';

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestWebhook = () => {
    alert('🚀 Webhook enviado a Make.com: Escenario activado para notificar alerta de cheque por WhatsApp.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Integración y Automatizaciones con Make.com
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Conecta Fudo, MaxiRest o alertas automáticas por WhatsApp / Email sin programar código.
        </p>
      </div>

      {/* URL del Webhook */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Webhook className="w-4 h-4 text-amber-400" />
          Endpoint Webhook de Entrada
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-amber-400 font-mono"
          />
          <button
            onClick={handleCopy}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-3 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
            {copied ? 'Copiado' : 'Copiar URL'}
          </button>
        </div>
      </div>

      {/* Escenarios de Make */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">
              Escenario #1
            </span>
            <BellRing className="w-4 h-4 text-amber-400" />
          </div>
          <h4 className="font-bold text-white text-sm">Alertas de Cheques y Servicios por WhatsApp</h4>
          <p className="text-xs text-slate-400">
            Cada mañana a las 9:00 AM, Make consulta los cheques que vencen en las próximas 48hs y te envía un resumen por WhatsApp al teléfono del dueño.
          </p>
          <button
            onClick={handleTestWebhook}
            className="mt-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl border border-slate-700 transition-all"
          >
            Probar Escenario de Alerta
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
              Escenario #2
            </span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="font-bold text-white text-sm">Sincronización Automática con Fudo/MaxiRest</h4>
          <p className="text-xs text-slate-400">
            Cuando tu comanda POS genere el cierre de caja diario, Make envía los totales por canal directamente a este sistema.
          </p>
        </div>
      </div>
    </div>
  );
};
