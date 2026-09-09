'use client';

import React from 'react';
import { useGastronomy } from '../context/GastronomyContext';
import { UtensilsCrossed, Star, HelpCircle, AlertCircle, Award } from 'lucide-react';

export const DishesView: React.FC = () => {
  const { dishes } = useGastronomy();

  const getBadgeClass = (classification: string) => {
    switch (classification) {
      case 'ESTRELLA':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'VACALUCHERA':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'INCOGNITA':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Matriz de Ingeniería de Menú (Escandallos)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Clasifica la rentabilidad y popularidad de tus platos para decidir aumentos o promociones.
        </p>
      </div>

      {/* Grilla de Platos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dishes.map(d => {
          const margin = d.salesPrice - d.costPrice;
          const foodCostPct = (d.costPrice / d.salesPrice) * 100;
          return (
            <div key={d.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded">
                  {d.category}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getBadgeClass(d.classification)}`}>
                  {d.classification}
                </span>
              </div>

              <h3 className="font-bold text-white text-base">{d.name}</h3>

              <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-800/80 py-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Precio Venta:</span>
                  <span className="font-bold text-white">${d.salesPrice.toLocaleString('es-AR')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Costo Materia Prima:</span>
                  <span className="font-semibold text-rose-400">${d.costPrice.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <span className="text-slate-400 text-[10px] block">Food Cost %:</span>
                  <span className={`font-bold ${foodCostPct > 35 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {foodCostPct.toFixed(1)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Margen Bruto Unitario:</span>
                  <span className="font-bold text-emerald-400">${margin.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
