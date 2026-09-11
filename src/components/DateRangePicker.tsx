'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, RotateCcw, X } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = startDate ? new Date(startDate + 'T00:00:00') : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());

  const [tempStart, setTempStart] = useState<string>(startDate);
  const [tempEnd, setTempEnd] = useState<string>(endDate);
  const [hoverDate, setHoverDate] = useState<string>('');
  const [activePreset, setActivePreset] = useState<string>('');

  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateStr = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayClick = (dayStr: string) => {
    setActivePreset('');
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dayStr);
      setTempEnd('');
    } else if (tempStart && !tempEnd) {
      if (dayStr < tempStart) {
        setTempStart(dayStr);
      } else {
        setTempEnd(dayStr);
        onChange(tempStart, dayStr);
        setIsOpen(false);
      }
    }
  };

  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    const today = new Date();
    const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

    if (presetKey === 'HOY') {
      setTempStart(todayStr);
      setTempEnd(todayStr);
      onChange(todayStr, todayStr);
    } else if (presetKey === 'AYER') {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      const s = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
      setTempStart(s);
      setTempEnd(s);
      onChange(s, s);
    } else if (presetKey === '7DIAS') {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      const s = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
      setTempStart(s);
      setTempEnd(todayStr);
      onChange(s, todayStr);
    } else if (presetKey === 'ESTEMES') {
      const first = formatDateStr(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const last = formatDateStr(today.getFullYear(), today.getMonth(), lastDay);
      setTempStart(first);
      setTempEnd(last);
      onChange(first, last);
    } else if (presetKey === 'MESPASADO') {
      const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const first = formatDateStr(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1);
      const lastDay = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0).getDate();
      const last = formatDateStr(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), lastDay);
      setTempStart(first);
      setTempEnd(last);
      onChange(first, last);
    } else if (presetKey === 'TODO') {
      setTempStart('');
      setTempEnd('');
      onChange('', '');
    }
    setIsOpen(false);
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Clean Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/60 rounded-xl px-4 py-2 text-xs font-semibold text-white flex items-center gap-2.5 transition-all shadow-md group"
      >
        <CalendarIcon className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
        <span>
          {startDate && endDate
            ? startDate === endDate
              ? `${formatDisplay(startDate)}`
              : `${formatDisplay(startDate)} - ${formatDisplay(endDate)}`
            : startDate
            ? `Desde: ${formatDisplay(startDate)}`
            : endDate
            ? `Hasta: ${formatDisplay(endDate)}`
            : 'Período Completo'}
        </span>
      </button>

      {/* Popover Calendar Modal - Clean Positioning Below Trigger */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 top-full mt-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 p-4 w-80 sm:w-96 text-slate-100 ring-1 ring-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Seleccionar Fecha
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-3 gap-1.5 py-3 border-b border-slate-800">
            <button
              type="button"
              onClick={() => applyPreset('HOY')}
              className={`text-xs py-1.5 rounded-lg font-medium border transition-colors ${
                activePreset === 'HOY'
                  ? 'bg-blue-600 border-blue-500 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-blue-900/30 hover:text-blue-300'
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => applyPreset('AYER')}
              className={`text-xs py-1.5 rounded-lg font-medium border transition-colors ${
                activePreset === 'AYER'
                  ? 'bg-blue-600 border-blue-500 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-blue-900/30 hover:text-blue-300'
              }`}
            >
              Ayer
            </button>
            <button
              type="button"
              onClick={() => applyPreset('7DIAS')}
              className={`text-xs py-1.5 rounded-lg font-medium border transition-colors ${
                activePreset === '7DIAS'
                  ? 'bg-blue-600 border-blue-500 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-blue-900/30 hover:text-blue-300'
              }`}
            >
              Últimos 7 días
            </button>
            <button
              type="button"
              onClick={() => applyPreset('ESTEMES')}
              className={`text-xs py-1.5 rounded-lg font-medium border transition-colors ${
                activePreset === 'ESTEMES'
                  ? 'bg-blue-600 border-blue-500 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-blue-900/30 hover:text-blue-300'
              }`}
            >
              Este Mes
            </button>
            <button
              type="button"
              onClick={() => applyPreset('MESPASADO')}
              className={`text-xs py-1.5 rounded-lg font-medium border transition-colors ${
                activePreset === 'MESPASADO'
                  ? 'bg-blue-600 border-blue-500 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-blue-900/30 hover:text-blue-300'
              }`}
            >
              Mes Pasado
            </button>
            <button
              type="button"
              onClick={() => applyPreset('TODO')}
              className={`text-xs py-1.5 rounded-lg font-medium border transition-colors ${
                activePreset === 'TODO'
                  ? 'bg-blue-600 border-blue-500 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Ver Todo
            </button>
          </div>

          {/* Direct Input Range */}
          <div className="grid grid-cols-2 gap-2 py-3 border-b border-slate-800">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">DESDE</label>
              <input
                type="date"
                value={tempStart}
                onChange={(e) => setTempStart(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">HASTA</label>
              <input
                type="date"
                value={tempEnd}
                onChange={(e) => setTempEnd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Month Header */}
          <div className="flex items-center justify-between py-2.5 border-b border-slate-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-bold text-sm text-white">
              {monthNames[currentMonth]} {currentYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 py-2">
            <span>Dom</span>
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="h-8" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayStr = formatDateStr(currentYear, currentMonth, dayNum);

              const isStart = tempStart === dayStr;
              const isEnd = tempEnd === dayStr;
              const isInRange =
                tempStart &&
                tempEnd &&
                dayStr > tempStart &&
                dayStr < tempEnd;
              const isHoveredInRange =
                tempStart &&
                !tempEnd &&
                hoverDate &&
                dayStr > tempStart &&
                dayStr <= hoverDate;

              let style = 'hover:bg-slate-800 text-slate-200';
              if (isStart || isEnd) {
                style = 'bg-blue-600 text-white font-bold shadow-md rounded-lg scale-105';
              } else if (isInRange || isHoveredInRange) {
                style = 'bg-blue-500/20 text-blue-300 font-semibold rounded-none';
              }

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleDayClick(dayStr)}
                  onMouseEnter={() => setHoverDate(dayStr)}
                  className={`h-8 text-xs flex items-center justify-center transition-all ${style}`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setTempStart('');
                setTempEnd('');
                onChange('', '');
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-rose-400 flex items-center gap-1 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpiar
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white px-2 py-1 font-medium"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (tempStart || tempEnd) {
                    const finalStart = tempStart || tempEnd;
                    const finalEnd = tempEnd || tempStart;
                    onChange(finalStart, finalEnd);
                  }
                  setIsOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
