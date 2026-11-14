'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Users, Plus, Pencil, Trash2, Search, X, Check, Phone, User } from 'lucide-react';
import {
  fetchClientes,
  guardarCliente,
  actualizarCliente,
  eliminarCliente,
} from '@/lib/api';

interface Jugador {
  id: string;
  nombre: string;
  apodo?: string | null;
  telefono?: string | null;
  visitas?: number;
}

export default function ViewJugadores() {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Jugador | null>(null);
  const [nombre, setNombre] = useState('');
  const [apodo, setApodo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [jugadorAEliminar, setJugadorAEliminar] = useState<Jugador | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarJugadores = async () => {
    setCargando(true);
    try {
      const data = await fetchClientes();
      setJugadores(Array.isArray(data?.clientes) ? data.clientes : []);
    } catch {
      setJugadores([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarJugadores();
  }, []);

  const jugadoresFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return jugadores;
    return jugadores.filter(
      (j) =>
        j.nombre.toLowerCase().includes(q) ||
        (j.apodo || '').toLowerCase().includes(q) ||
        (j.telefono || '').toLowerCase().includes(q)
    );
  }, [jugadores, busqueda]);

  const abrirNuevo = () => {
    setEditando(null);
    setNombre('');
    setApodo('');
    setTelefono('');
    setError('');
    setModalAbierto(true);
  };

  const abrirEditar = (j: Jugador) => {
    setEditando(j);
    setNombre(j.nombre || '');
    setApodo(j.apodo || '');
    setTelefono(j.telefono || '');
    setError('');
    setModalAbierto(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del jugador es obligatorio.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      if (editando) {
        await actualizarCliente(
          editando.id,
          nombre.trim(),
          apodo.trim() || undefined,
          telefono.trim() || undefined
        );
      } else {
        await guardarCliente(
          nombre.trim(),
          apodo.trim() || undefined,
          telefono.trim() || undefined
        );
      }
      setModalAbierto(false);
      await cargarJugadores();
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar el jugador');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = (j: Jugador) => {
    setJugadorAEliminar(j);
  };

  const confirmarEliminar = async () => {
    if (!jugadorAEliminar) return;
    setEliminando(true);
    try {
      await eliminarCliente(jugadorAEliminar.id);
      setJugadorAEliminar(null);
      await cargarJugadores();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar jugador');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-hidden">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Jugadores</h2>
            <p className="text-xs text-slate-500 font-medium">
              {jugadores.length} registrados en el club
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar jugador..."
              className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 w-56"
            />
          </div>

          <button
            type="button"
            onClick={abrirNuevo}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Jugador</span>
          </button>
        </div>
      </div>

      {/* Lista de jugadores */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        {cargando ? (
          <div className="py-12 text-center text-sm text-slate-500">Cargando jugadores...</div>
        ) : jugadoresFiltrados.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No hay jugadores para mostrar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {jugadoresFiltrados.map((j) => (
              <div
                key={j.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-sm flex items-center justify-center shrink-0">
                    {j.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{j.nombre}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {j.apodo && <span className="truncate">"{j.apodo}"</span>}
                      {j.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {j.telefono}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => abrirEditar(j)}
                    title="Editar"
                    className="p-2 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminar(j)}
                    title="Eliminar"
                    className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
      {modalAbierto && (
        <div
          onClick={() => setModalAbierto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleGuardar}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {editando ? 'Editar Jugador' : 'Nuevo Jugador'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Apodo (opcional)
                </label>
                <input
                  type="text"
                  value={apodo}
                  onChange={(e) => setApodo(e.target.value)}
                  placeholder="Ej. El Chamo"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono (opcional)
                </label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 3001112233"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{guardando ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {jugadorAEliminar && (
        <div
          onClick={() => !eliminando && setJugadorAEliminar(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Eliminar jugador</h3>
                <p className="text-xs text-slate-500">
                  ¿Seguro que deseas eliminar a{' '}
                  <span className="font-bold text-slate-800">{jugadorAEliminar.nombre}</span>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={eliminando}
                onClick={() => setJugadorAEliminar(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminando}
                onClick={confirmarEliminar}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{eliminando ? 'Eliminando...' : 'Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
