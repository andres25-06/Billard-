'use client';

import React from 'react';
import { Trophy, Users, Award, Play } from 'lucide-react';

export default function ViewTorneos() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl flex items-center justify-between shadow-lg">
        <div>
          <span className="text-[10.5px] uppercase font-bold text-indigo-300 tracking-wider">Torneo en curso</span>
          <h3 className="font-extrabold text-xl mt-0.5">Gran Campeonato Tres Bandas Chamo</h3>
          <p className="text-xs text-slate-300 mt-1">12 jugadores inscritos · Fase de grupos de 3 (Pasan los 2 mejores)</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow transition">
          <Play className="w-4 h-4 fill-slate-950" />
          Transmitir a Smart TV
        </button>
      </div>

      {/* Grupos de 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { grupo: 'Grupo A', lider: 'Carlos Ortiz', pts: 6, p2: 'Mauricio Gómez', pts2: 4, p3: 'Javier Peña', pts3: 0 },
          { grupo: 'Grupo B', lider: 'Andrés Ardila', pts: 6, p2: 'Wilson Marín', pts2: 3, p3: 'David Soto', pts3: 1 },
          { grupo: 'Grupo C', lider: 'Héctor Fabio', pts: 4, p2: 'Fabián Ruiz', pts2: 4, p3: 'Camilo V.', pts3: 0 },
          { grupo: 'Grupo D', lider: 'Diego Morales', pts: 6, p2: 'Nelson Castro', pts2: 3, p3: 'Pedro Luis', pts3: 0 },
        ].map((g, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-3.5 bg-slate-900 text-white flex justify-between items-center text-xs font-bold">
              <span>{g.grupo}</span>
              <span className="text-[10px] text-emerald-400">En juego</span>
            </div>
            <div className="p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold">
                <span>1. {g.lider}</span>
                <span className="font-mono">{g.pts} pts</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 text-slate-700">
                <span>2. {g.p2}</span>
                <span className="font-mono font-bold">{g.pts2} pts</span>
              </div>
              <div className="flex justify-between items-center p-2 text-slate-400">
                <span>3. {g.p3}</span>
                <span className="font-mono">{g.pts3} pts</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
