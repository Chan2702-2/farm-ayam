'use client';

import React from 'react';
import { Sun, Sunset, Egg } from 'lucide-react';

interface EggStepperProps {
  session: 'pagi' | 'sore';
  valueIkat: number;
  onChange: (value: number) => void;
  valueButir?: number;
  onChangeButir?: (value: number) => void;
  title?: string;
  timeLabel?: string;
}

export function EggStepper({
  session,
  valueIkat,
  onChange,
  valueButir = 0,
  onChangeButir,
  title,
  timeLabel,
}: EggStepperProps) {
  const isPagi = session === 'pagi';
  const totalButir = (valueIkat * 30) + (valueButir || 0);

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-100 space-y-3">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            isPagi ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-[#0284c7]'
          }`}>
            {isPagi ? <Sun className="w-4 h-4" /> : <Sunset className="w-4 h-4" />}
          </div>
          <div>
            <span className="font-jakarta font-bold text-sm text-slate-900 block leading-tight">
              {title || (isPagi ? 'Panen Pagi (07:00)' : 'Panen Sore (14:00)')}
            </span>
            <span className="text-[11px] text-slate-400">
              {timeLabel || (isPagi ? 'Sesi 1 • 1 Ikat/Kertas = 30 Butir' : 'Sesi 2 • 1 Ikat/Kertas = 30 Butir')}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            isPagi ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-[#0284c7]'
          }`}>
            {totalButir.toLocaleString('id-ID')} Butir
          </span>
        </div>
      </div>

      {/* Row 1: Kertas / Ikat (Full 30 Butir per kertas) */}
      <div className="bg-slate-50/80 p-2.5 sm:p-3 rounded-xl border border-slate-100 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            📦 Kertas / Ikat Full
            <span className="text-[10px] text-slate-400 font-normal">(@ 30 btr)</span>
          </span>
          <span className="text-[11px] font-bold text-slate-600">
            {(valueIkat * 30).toLocaleString('id-ID')} butir
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChange(Math.max(0, valueIkat - 50))}
              className="px-2 sm:px-2.5 py-2 rounded-xl bg-white hover:bg-slate-200 active:scale-95 border border-slate-200 text-slate-700 text-xs font-bold font-mono transition-all"
            >
              -50
            </button>
            <button
              type="button"
              onClick={() => onChange(Math.max(0, valueIkat - 1))}
              className="w-9 h-9 rounded-xl bg-white hover:bg-slate-200 active:scale-95 border border-slate-200 text-slate-700 text-sm font-bold transition-all"
            >
              -1
            </button>
          </div>

          <div className="flex-1 text-center">
            <input
              type="number"
              min="0"
              value={valueIkat}
              onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
              className="w-20 sm:w-24 text-center font-jakarta font-extrabold text-2xl sm:text-3xl text-[#0284c7] bg-transparent outline-none p-0"
            />
            <span className="text-[11px] text-slate-400 block font-medium">
              Ikat
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChange(valueIkat + 1)}
              className="w-9 h-9 rounded-xl bg-sky-100 hover:bg-sky-200 active:scale-95 text-[#0369a1] text-sm font-bold transition-all"
            >
              +1
            </button>
            <button
              type="button"
              onClick={() => onChange(valueIkat + 50)}
              className="px-2 sm:px-2.5 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 active:scale-95 text-[#0369a1] text-xs font-bold font-mono transition-all"
            >
              +50
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Butir Eceran / Lepas (sisa yang tidak genap 1 kertas / tray 30 butir) */}
      {onChangeButir && (
        <div className="bg-amber-50/50 p-2.5 sm:p-3 rounded-xl border border-amber-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-900 flex items-center gap-1">
              <Egg className="w-3.5 h-3.5 text-amber-600" />
              + Butir Eceran / Lepas
              <span className="text-[10px] text-amber-700/70 font-normal">(tidak full 1 kertas)</span>
            </span>
            <span className="text-[11px] font-bold text-amber-800">
              +{valueButir || 0} butir
            </span>
          </div>

          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChangeButir(Math.max(0, (valueButir || 0) - 5))}
                className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-100 border border-amber-200 active:scale-95 text-amber-900 text-xs font-bold font-mono transition-all"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => onChangeButir(Math.max(0, (valueButir || 0) - 1))}
                className="w-8 h-8 rounded-lg bg-white hover:bg-amber-100 border border-amber-200 active:scale-95 text-amber-900 text-xs font-bold transition-all"
              >
                -1
              </button>
            </div>

            <div className="flex-1 text-center">
              <input
                type="number"
                min="0"
                value={valueButir || 0}
                onChange={(e) => onChangeButir(Math.max(0, Number(e.target.value) || 0))}
                className="w-16 sm:w-20 text-center font-jakarta font-bold text-xl sm:text-2xl text-amber-900 bg-transparent outline-none p-0"
              />
              <span className="text-[10px] text-amber-700/80 block font-medium">
                Butir
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChangeButir((valueButir || 0) + 1)}
                className="w-8 h-8 rounded-lg bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 text-xs font-bold transition-all"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => onChangeButir((valueButir || 0) + 5)}
                className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 text-xs font-bold font-mono transition-all"
              >
                +5
              </button>
            </div>
          </div>

          {/* Quick presets for mobile */}
          <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-slate-400 font-medium shrink-0">Cepat:</span>
            {[1, 5, 10, 15, 20].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => onChangeButir((valueButir || 0) + amt)}
                className="px-2 py-0.5 bg-white border border-amber-200 hover:bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold active:scale-95 transition-all"
              >
                +{amt}
              </button>
            ))}
            {(valueButir || 0) > 0 && (
              <button
                type="button"
                onClick={() => onChangeButir(0)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-md text-[10px] font-semibold active:scale-95 transition-all ml-auto"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
