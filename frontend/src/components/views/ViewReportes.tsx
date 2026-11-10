'use client';

import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Clock } from 'lucide-react';

export default function ViewReportes() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Facturación Semanal</span>
          <b className="block text-2xl font-bold text-slate-900 font-mono mt-1">$2.840.000</b>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">↑ +14% vs semana anterior</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Horas de Juego Cobradas</span>
          <b className="block text-2xl font-bold text-indigo-600 font-mono mt-1">142 horas</b>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Promedio 20.2 h / día</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Cerveza Más Vendida</span>
          <b className="block text-xl font-bold text-amber-600 truncate mt-1">Cerveza Poker 330ml</b>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">184 unidades despachadas</span>
        </div>
      </div>
    </div>
  );
}
