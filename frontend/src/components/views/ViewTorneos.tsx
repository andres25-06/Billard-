'use client';

import React, { useState } from 'react';
import {
  Trophy,
  Users,
  Award,
  Play,
  Plus,
  Tv,
  Swords,
  Calendar,
  CheckCircle2,
  CircleDot,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

type TabTorneo = 'grupos' | 'llaves' | 'partidas';

const GRUPOS = [
  {
    grupo: 'Grupo A',
    mesa: 'Mesa 1',
    jugadores: [
      { nombre: 'Carlos Ortiz', pj: 2, pts: 6, prom: '1.150', clasificado: true },
      { nombre: 'Mauricio Gómez', pj: 2, pts: 4, prom: '0.980', clasificado: true },
      { nombre: 'Javier Peña', pj: 2, pts: 0, prom: '0.720', clasificado: false },
    ],
  },
  {
    grupo: 'Grupo B',
    mesa: 'Mesa 2',
    jugadores: [
      { nombre: 'Andrés Ardila', pj: 2, pts: 6, prom: '1.210', clasificado: true },
      { nombre: 'Wilson Marín', pj: 2, pts: 3, prom: '0.910', clasificado: true },
      { nombre: 'David Soto', pj: 2, pts: 1, prom: '0.680', clasificado: false },
    ],
  },
  {
    grupo: 'Grupo C',
    mesa: 'Mesa 3',
    jugadores: [
      { nombre: 'Héctor Fabio', pj: 2, pts: 4, prom: '1.050', clasificado: true },
      { nombre: 'Fabián Ruiz', pj: 2, pts: 4, prom: '0.960', clasificado: true },
      { nombre: 'Camilo Vargas', pj: 2, pts: 0, prom: '0.640', clasificado: false },
    ],
  },
  {
    grupo: 'Grupo D',
    mesa: 'Mesa 4',
    jugadores: [
      { nombre: 'Diego Morales', pj: 2, pts: 6, prom: '1.180', clasificado: true },
      { nombre: 'Nelson Castro', pj: 2, pts: 3, prom: '0.890', clasificado: true },
      { nombre: 'Pedro Luis', pj: 2, pts: 0, prom: '0.610', clasificado: false },
    ],
  },
];

const PARTIDAS_VIVO = [
  { mesa: 'Mesa 1', ronda: 'Grupo A · Fecha 3', j1: 'Carlos Ortiz', p1: 24, j2: 'Mauricio Gómez', p2: 19, meta: 30 },
  { mesa: 'Mesa 2', ronda: 'Grupo B · Fecha 3', j1: 'Andrés Ardila', p1: 28, j2: 'Wilson Marín', p2: 22, meta: 30 },
  { mesa: 'Mesa 3', ronda: 'Grupo C · Desempate', j1: 'Héctor Fabio', p1: 15, j2: 'Fabián Ruiz', p2: 17, meta: 30 },
];

export default function ViewTorneos() {
  const [tab, setTab] = useState<TabTorneo>('grupos');
  const [grupos, setGrupos] = useState(GRUPOS);
  const [grupoEditandoIdx, setGrupoEditandoIdx] = useState<number | null>(null);
  const [formGrupo, setFormGrupo] = useState<{ grupo: string; mesa: string; jugadores: string[] }>({
    grupo: '',
    mesa: '',
    jugadores: ['', '', ''],
  });

  const handleAgregarGrupo = () => {
    const letra = String.fromCharCode(65 + grupos.length); // A, B, C, D, E...
    const nuevoGrupo = {
      grupo: `Grupo ${letra}`,
      mesa: `Mesa ${(grupos.length % 6) + 1}`,
      jugadores: [
        { nombre: 'Jugador 1', pj: 0, pts: 0, prom: '0.000', clasificado: false },
        { nombre: 'Jugador 2', pj: 0, pts: 0, prom: '0.000', clasificado: false },
        { nombre: 'Jugador 3', pj: 0, pts: 0, prom: '0.000', clasificado: false },
      ],
    };
    setGrupos((prev) => [...prev, nuevoGrupo]);
  };

  const handleAbrirEditarGrupo = (idx: number) => {
    const g = grupos[idx];
    setFormGrupo({
      grupo: g.grupo,
      mesa: g.mesa,
      jugadores: g.jugadores.map((j) => j.nombre),
    });
    setGrupoEditandoIdx(idx);
  };

  const handleGuardarEdicionGrupo = () => {
    if (grupoEditandoIdx === null) return;
    setGrupos((prev) =>
      prev.map((g, idx) =>
        idx === grupoEditandoIdx
          ? {
              ...g,
              grupo: formGrupo.grupo.trim() || g.grupo,
              mesa: formGrupo.mesa.trim() || g.mesa,
              jugadores: g.jugadores.map((j, jIdx) => ({
                ...j,
                nombre: formGrupo.jugadores[jIdx]?.trim() || j.nombre,
              })),
            }
          : g
      )
    );
    setGrupoEditandoIdx(null);
  };

  const handleEliminarGrupo = (idx: number) => {
    setGrupos((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="w-full h-full flex flex-col gap-3 font-['Urbanist',sans-serif] select-none overflow-hidden">
      {/* 1. Barra Superior del Torneo */}
      <div className="bg-white px-5 py-3 rounded-2xl border border-slate-300 shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#184A35] text-white flex items-center justify-center shadow-xs">
            <Trophy className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base text-[#28353E] leading-none">
                Campeonato Tres Bandas · El Encuentro Tocano
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase">
                En Curso
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-1 flex items-center gap-2">
              <span>12 jugadores inscritos</span>
              <span>•</span>
              <span>Grupos de 3 (clasifican 2)</span>
              <span>•</span>
              <span>A 30 carambolas</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#28353E] font-bold text-xs flex items-center gap-1.5 border border-slate-300 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Torneo</span>
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-[#28353E] hover:bg-[#1a2329] text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Tv className="w-3.5 h-3.5 text-emerald-400" />
            <span>Transmitir a Smart TV</span>
          </button>
        </div>
      </div>

      {/* 2. Pestañas de Navegación + Resumen */}
      <div className="bg-white px-4 py-2 rounded-2xl border border-slate-300 shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'grupos', label: 'Fase de Grupos', icon: Users },
            { id: 'llaves', label: 'Llaves / Eliminatorias', icon: Award },
            { id: 'partidas', label: 'Partidas en Vivo', icon: Swords },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as TabTorneo)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#28353E] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
          {tab === 'grupos' && (
            <button
              type="button"
              onClick={handleAgregarGrupo}
              className="px-3 py-1.5 rounded-xl bg-[#184A35] hover:bg-[#123828] text-white font-black text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Grupo</span>
            </button>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            3 partidas en curso
          </span>
          <span className="font-mono text-[#184A35] font-black">Bolsa: $1.200.000</span>
        </div>
      </div>

      {/* 3. Contenido según Pestaña */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {/* TAB 1: FASE DE GRUPOS */}
        {tab === 'grupos' && (
          <div
            className="grid grid-cols-4 gap-3 pb-2"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
          >
            {grupos.map((g, idx) => (
              <div
                key={`${g.grupo}-${idx}`}
                className="bg-white rounded-2xl border border-slate-300 shadow-xs flex flex-col overflow-hidden"
              >
                <div className="px-4 py-2.5 bg-[#28353E] text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs">{g.grupo}</span>
                    <span className="text-[10px] font-bold text-emerald-300 bg-white/10 px-2 py-0.5 rounded-md">
                      {g.mesa}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAbrirEditarGrupo(idx)}
                      className="p-1 rounded-md hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer transition-all"
                      title="Editar grupo"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarGrupo(idx)}
                      className="p-1 rounded-md hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 cursor-pointer transition-all"
                      title="Eliminar grupo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                  <div className="space-y-2">
                    {g.jugadores.map((j, idx) => (
                      <div
                        key={j.nombre}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          j.clasificado
                            ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-[11px] text-[#184A35]">
                              {idx + 1}.
                            </span>
                            <span className="font-bold truncate">{j.nombre}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            PJ: {j.pj} · Prom: {j.prom}
                          </span>
                        </div>
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-white border border-slate-200 shrink-0">
                          {j.pts} pts
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10.5px] font-bold text-slate-400">
                    <span>Clasifican top 2</span>
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> En juego
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: LLAVES / ELIMINATORIAS */}
        {tab === 'llaves' && (
          <div className="h-full bg-white rounded-2xl p-5 border border-slate-300 shadow-xs flex flex-col justify-between overflow-hidden">
            <div
              className="flex-1 grid grid-cols-3 gap-6 items-center"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
            >
              {/* Cuartos de Final */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Cuartos de Final
                </span>
                {[
                  { j1: 'Carlos Ortiz', p1: 30, j2: 'Wilson Marín', p2: 24 },
                  { j1: 'Andrés Ardila', p1: 30, j2: 'Mauricio Gómez', p2: 21 },
                  { j1: 'Héctor Fabio', p1: 26, j2: 'Nelson Castro', p2: 30 },
                  { j1: 'Diego Morales', p1: 30, j2: 'Fabián Ruiz', p2: 27 },
                ].map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{m.j1}</span>
                      <span className="font-mono text-[#184A35]">{m.p1}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-500">
                      <span>{m.j2}</span>
                      <span className="font-mono">{m.p2}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Semifinales */}
              <div className="space-y-8">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Semifinales
                </span>
                {[
                  { j1: 'Carlos Ortiz', p1: '-', j2: 'Andrés Ardila', p2: '-' },
                  { j1: 'Nelson Castro', p1: '-', j2: 'Diego Morales', p2: '-' },
                ].map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#EDF2F7] border border-slate-300 text-xs space-y-1.5">
                    <div className="flex justify-between font-bold text-[#28353E]">
                      <span>{m.j1}</span>
                      <span className="font-mono">{m.p1}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#28353E]">
                      <span>{m.j2}</span>
                      <span className="font-mono">{m.p2}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gran Final */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-full p-5 rounded-2xl bg-[#28353E] text-white text-center shadow-lg">
                  <Trophy className="w-8 h-8 text-amber-300 mx-auto mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    Gran Final
                  </span>
                  <h4 className="font-black text-base mt-1">Por Definir</h4>
                  <p className="text-[11px] text-slate-300 mt-1">
                    A 35 carambolas · Mesa 1
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PARTIDAS EN VIVO */}
        {tab === 'partidas' && (
          <div
            className="grid grid-cols-3 gap-3 pb-2"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
          >
            {PARTIDAS_VIVO.map((p) => (
              <div
                key={p.mesa}
                className="bg-white rounded-2xl p-4 border border-slate-300 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-black text-sm text-[#28353E]">{p.mesa}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CircleDot className="w-3 h-3 animate-pulse" />
                    {p.ronda}
                  </span>
                </div>

                <div className="my-4 space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-sm text-[#28353E]">{p.j1}</span>
                    <span className="font-mono font-black text-2xl text-[#184A35]">{p.p1}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-sm text-[#28353E]">{p.j2}</span>
                    <span className="font-mono font-black text-2xl text-slate-700">{p.p2}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Meta: {p.meta} carambolas</span>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg bg-[#28353E] text-white font-bold text-[11px] cursor-pointer"
                  >
                    Ver Marcador
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edición Rápida de Grupo */}
      {grupoEditandoIdx !== null && (
        <div
          onClick={() => setGrupoEditandoIdx(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-3xl p-5 border border-slate-300 shadow-2xl flex flex-col gap-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="font-black text-sm text-[#28353E]">Editar Grupo</h4>
              <button
                type="button"
                onClick={() => setGrupoEditandoIdx(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div
                className="grid grid-cols-2 gap-2"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
              >
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formGrupo.grupo}
                    onChange={(e) => setFormGrupo((f) => ({ ...f, grupo: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 font-bold text-[#28353E]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mesa</label>
                  <input
                    type="text"
                    value={formGrupo.mesa}
                    onChange={(e) => setFormGrupo((f) => ({ ...f, mesa: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 font-bold text-[#28353E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Jugadores</label>
                <div className="space-y-1.5">
                  {formGrupo.jugadores.map((nom, jIdx) => (
                    <input
                      key={jIdx}
                      type="text"
                      value={nom}
                      onChange={(e) => {
                        const copia = [...formGrupo.jugadores];
                        copia[jIdx] = e.target.value;
                        setFormGrupo((f) => ({ ...f, jugadores: copia }));
                      }}
                      placeholder={`Jugador ${jIdx + 1}`}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 font-semibold text-[#28353E]"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setGrupoEditandoIdx(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarEdicionGrupo}
                className="flex-1 py-2 rounded-xl bg-[#184A35] hover:bg-[#123828] text-white font-black text-xs cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
