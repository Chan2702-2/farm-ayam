'use client';

import React from 'react';
import { Sun, Sunset } from 'lucide-react';

interface EggStepperProps {
  session: 'pagi' | 'sore';
  valueIkat: number;
  onChange: (value: number) => void;
  title?: string;
  timeLabel?: string;
}

export function EggStepper({
  session,
  valueIkat,
  onChange,
  title,
  timeLabel,
}: EggStepperProps) {
  const isPagi = session === 'pagi';
  const totalButir = valueIkat * 30;

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-100 space-y-3">
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
              {timeLabel || (isPagi ? 'Sesi 1 • 1 Ikat = 30 Butir' : 'Sesi 2 • 1 Ikat = 30 Butir')}
            </span>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
          isPagi ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-[#0284c7]'
        }`}>
          {totalButir.toLocaleString('id-ID')} Butir
        </span>
      </div>

      <div className="flex items-center justify-between gap-1 sm:gap-2 pt-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(Math.max(0, valueIkat - 50))}
            className="px-2 sm:px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold font-mono transition-all"
          >
            -50
          </button>
          <button
            type="button"
            onClick={() => onChange(Math.max(0, valueIkat - 1))}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-sm font-bold transition-all"
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
            Ikat ({totalButir.toLocaleString('id-ID')} btr)
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
  );
}
