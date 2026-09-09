import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';

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

  // Month & Year state for current calendar view
  const initialDate = startDate ? new Date(startDate + 'T00:00:00') : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());

  // Transient selection state
  const [tempStart, setTempStart] = useState<string>(startDate);
  const [tempEnd, setTempEnd] = useState<string>(endDate);
  const [hoverDate, setHoverDate] = useState<string>('');

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

  const handleDayClick = (dayStr: string) => {
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

  const applyPreset = (preset: 'HOY' | 'AYER' | '7DIAS' | 'ESTEMES' | '30DIAS' | 'TODO') => {
    const today = new Date();
    const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

    if (preset === 'HOY') {
      onChange(todayStr, todayStr);
    } else if (preset === 'AYER') {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      const s = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
      onChange(s, s);
    } else if (preset === '7DIAS') {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      const s = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
      onChange(s, todayStr);
    } else if (preset === 'ESTEMES') {
      const first = formatDateStr(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const last = formatDateStr(today.getFullYear(), today.getMonth(), lastDay);
      onChange(first, last);
    } else if (preset === '30DIAS') {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      const s = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
      onChange(s, todayStr);
    } else if (preset === 'TODO') {
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
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 flex items-center justify-between transition-all group shadow-sm"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors shrink-0" />
          <span className="font-semibold text-slate-200 truncate">
            {startDate && endDate
              ? `${formatDisplay(startDate)} - ${formatDisplay(endDate)}`
              : startDate
              ? `Desde: ${formatDisplay(startDate)}`
              : endDate
              ? `Hasta: ${formatDisplay(endDate)}`
              : 'Período: Todo el historial'}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 shrink-0">
          Almanaque
        </span>
      </button>

      {/* Unified Single Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 p-4 w-80 sm:w-96 text-slate-200">
          {/* Calendar Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
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

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1 py-2.5 border-b border-slate-800/70">
            <button
              type="button"
              onClick={() => applyPreset('HOY')}
              className="text-[10px] px-2 py-1 bg-slate-900 hover:bg-amber-500/20 hover:text-amber-300 rounded-md font-semibold text-slate-300 border border-slate-800 transition-colors"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => applyPreset('AYER')}
              className="text-[10px] px-2 py-1 bg-slate-900 hover:bg-amber-500/20 hover:text-amber-300 rounded-md font-semibold text-slate-300 border border-slate-800 transition-colors"
            >
              Ayer
            </button>
            <button
              type="button"
              onClick={() => applyPreset('7DIAS')}
              className="text-[10px] px-2 py-1 bg-slate-900 hover:bg-amber-500/20 hover:text-amber-300 rounded-md font-semibold text-slate-300 border border-slate-800 transition-colors"
            >
              Últimos 7 días
            </button>
            <button
              type="button"
              onClick={() => applyPreset('ESTEMES')}
              className="text-[10px] px-2 py-1 bg-slate-900 hover:bg-amber-500/20 hover:text-amber-300 rounded-md font-semibold text-slate-300 border border-slate-800 transition-colors"
            >
              Este Mes
            </button>
            <button
              type="button"
              onClick={() => applyPreset('30DIAS')}
              className="text-[10px] px-2 py-1 bg-slate-900 hover:bg-amber-500/20 hover:text-amber-300 rounded-md font-semibold text-slate-300 border border-slate-800 transition-colors"
            >
              Últimos 30 días
            </button>
            <button
              type="button"
              onClick={() => applyPreset('TODO')}
              className="text-[10px] px-2 py-1 bg-slate-900 hover:bg-rose-500/20 hover:text-rose-300 rounded-md font-semibold text-slate-400 border border-slate-800 transition-colors"
            >
              Ver Todo
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 py-2">
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
                style = 'bg-amber-500 text-slate-950 font-bold shadow-md rounded-lg scale-105';
              } else if (isInRange || isHoveredInRange) {
                style = 'bg-amber-500/20 text-amber-300 font-semibold rounded-none';
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

          {/* Footer instruction & apply */}
          <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">
              {!tempStart
                ? '👆 Selecciona fecha de inicio'
                : !tempEnd
                ? '👉 Selecciona fecha de fin'
                : '✅ Rango completo'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white px-2 py-1"
              >
                Cerrar
              </button>
              {tempStart && tempEnd && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(tempStart, tempEnd);
                    setIsOpen(false);
                  }}
                  className="bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-lg flex items-center gap-1 shadow-md hover:bg-amber-400 transition-colors"
                >
                  <Check className="w-3 h-3" /> Aplicar Rango
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
