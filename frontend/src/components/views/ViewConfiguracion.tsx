'use client';

import React from 'react';
import { Settings, Shield, DollarSign } from 'lucide-react';

export default function ViewConfiguracion() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Tarifas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            <h4 className="font-extrabold text-sm text-slate-900">Tarifas por Hora de Mesas</h4>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Mesas Tres Bandas</span>
              <span className="font-mono font-bold text-slate-900">$18.000 / hora</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Mesas Pool Máster y Clásico</span>
              <span className="font-mono font-bold text-slate-900">$14.000 / hora</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Mesas Libre / Carambola</span>
              <span className="font-mono font-bold text-slate-900">$12.000 / hora</span>
            </div>
          </div>
        </div>

        {/* Usuarios y PIN */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h4 className="font-extrabold text-sm text-slate-900">Personal y PIN de Acceso</h4>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <b className="text-slate-800">Andrés Ardila</b>
                <span className="text-[11px] text-slate-400 block">Administrador General</span>
              </div>
              <span className="font-mono font-bold bg-slate-200 text-slate-700 px-2 py-1 rounded-md">PIN: ••••</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
