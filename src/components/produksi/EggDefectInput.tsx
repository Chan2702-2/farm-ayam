'use client';

import React from 'react';

interface EggDefectInputProps {
  retak: number;
  putih: number;
  kotorPutih: number;
  k: number;
  r: number;
  l: number;
  onChange: (field: string, value: number) => void;
}

export function EggDefectInput({
  retak,
  putih,
  kotorPutih,
  k,
  r,
  l,
  onChange,
}: EggDefectInputProps) {
  const items = [
    { key: 'retak', label: 'Retak', value: retak, desc: 'Cangkang retak' },
    { key: 'putih', label: 'Putih', value: putih, desc: 'Cangkang pucat' },
    { key: 'kotorPutih', label: 'Kotor', value: kotorPutih, desc: 'Feses/Noda' },
    { key: 'k', label: 'K (Kecil)', value: k, desc: '< 50 gram' },
    { key: 'r', label: 'R (Rusak)', value: r, desc: 'Pecah/Bocor' },
    { key: 'l', label: 'L (Lainnya)', value: l, desc: 'Abnormal' },
  ];

  const totalDefect = retak + putih + kotorPutih + k + r + l;

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-100 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-jakarta font-bold text-sm text-slate-900">
            Sortir Cacat & Grade Telur
          </h3>
          <p className="text-[11px] text-slate-400">
            Pencatatan telur abnormal dan sortiran fisik
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
          Total: {totalDefect} Butir
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {items.map((it) => (
          <div key={it.key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block leading-tight">
                {it.label}
              </span>
              <span className="text-[9px] text-slate-400 block truncate mt-0.5">
                {it.desc}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <input
                type="number"
                min="0"
                placeholder="0"
                value={it.value === 0 ? '' : it.value}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/^0+(?=\d)/, '');
                  const num = parseInt(raw, 10);
                  onChange(it.key, isNaN(num) ? 0 : Math.max(0, num));
                }}
                className="w-full h-8 px-2 text-center font-bold text-xs bg-white rounded-lg border border-slate-200 text-slate-800 outline-none focus:border-[#0284c7]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
