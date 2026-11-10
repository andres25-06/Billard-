'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight, DollarSign, Lock, AlertCircle } from 'lucide-react';

interface TurnoActivo {
  id: string;
  usuario_nombre: string;
  fecha_apertura: string;
  monto_apertura_base: number;
  total_ventas: number;
  total_efectivo: number;
  total_transferencias: number;
  total_tarjetas: number;
  total_egresos: number;
  saldo_esperado_efectivo: number;
  ultimos_movimientos: Array<{
    id: string;
    tipo: string;
    metodo_pago: string;
    monto: number;
    descripcion: string;
    creado_el: string;
  }>;
}

export default function ViewCaja() {
  const [turno, setTurno] = useState<TurnoActivo | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [baseInicial, setBaseInicial] = useState<number>(100000);
  const [efectivoContado, setEfectivoContado] = useState<string>('');

  const cargarTurno = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/caja/turno-activo');
      const data = await res.json();
      setTurno(data.turno || null);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTurno();
  }, []);

  const handleAbrirTurno = async () => {
    try {
      await fetch('http://localhost:8000/api/caja/abrir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto_base: baseInicial }),
      });
      await cargarTurno();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCerrarTurno = async () => {
    const declarado = parseFloat(efectivoContado);
    if (isNaN(declarado)) {
      alert('Ingresa el monto de efectivo físico contado en caja');
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/api/caja/cerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ efectivo_declarado: declarado }),
      });
      const data = await res.json();
      alert(`Turno cerrado. Diferencia: $${data.diferencia?.toLocaleString('es-CO')}`);
      setEfectivoContado('');
      await cargarTurno();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {turno ? (
        <>
          {/* Cabecera del Turno Abierto */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Turno de Caja Abierto</h3>
                <p className="text-xs text-slate-300">
                  Cajero: <b className="text-white">{turno.usuario_nombre}</b> · Abierto desde {new Date(turno.fecha_apertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Base Inicial</span>
              <div className="font-mono text-xl font-bold text-white">
                ${Number(turno.monto_apertura_base).toLocaleString('es-CO')}
              </div>
            </div>
          </div>

          {/* Tarjetas de Dinero */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-400 font-medium">Ventas Totales</span>
              <b className="block text-2xl font-bold text-slate-900 font-mono mt-1">
                ${turno.total_ventas.toLocaleString('es-CO')}
              </b>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-400 font-medium">Ventas Efectivo</span>
              <b className="block text-2xl font-bold text-emerald-600 font-mono mt-1">
                ${turno.total_efectivo.toLocaleString('es-CO')}
              </b>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-400 font-medium">Nequi / Daviplata</span>
              <b className="block text-2xl font-bold text-purple-600 font-mono mt-1">
                ${turno.total_transferencias.toLocaleString('es-CO')}
              </b>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-400 font-medium">Efectivo Esperado en Caja</span>
              <b className="block text-2xl font-bold text-indigo-600 font-mono mt-1">
                ${turno.saldo_esperado_efectivo.toLocaleString('es-CO')}
              </b>
            </div>
          </div>

          {/* Arqueo y Cierre */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between gap-6">
            <div>
              <h4 className="font-bold text-sm text-slate-900">Arqueo y Cierre de Turno</h4>
              <p className="text-xs text-slate-500 mt-0.5">Ingresa el conteo físico de billetes y monedas para verificar descuadres.</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="Efectivo contado ($)"
                value={efectivoContado}
                onChange={(e) => setEfectivoContado(e.target.value)}
                className="text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 w-44"
              />
              <button
                onClick={handleCerrarTurno}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow transition"
              >
                Cerrar Turno y Arqueo
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Caja Cerrada */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">No hay turno de caja abierto</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Ingresa el monto de la base en efectivo con el que inicia la jornada para registrar ventas y mesas.
          </p>

          <div className="space-y-3">
            <div className="text-left">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Base inicial en efectivo</label>
              <input
                type="number"
                value={baseInicial}
                onChange={(e) => setBaseInicial(Number(e.target.value))}
                className="w-full text-base font-mono font-bold text-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 mt-1"
              />
            </div>
            <button
              onClick={handleAbrirTurno}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
            >
              Abrir Turno de Caja
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
