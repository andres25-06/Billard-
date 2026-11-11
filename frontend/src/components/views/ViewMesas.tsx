'use client';

import React, { useState, useEffect } from 'react';
import {
  Beer,
  Tag,
  Play,
  Check,
  Users,
  CreditCard,
  Plus,
  Lightbulb,
  X,
  MapPin,
  Clock,
  DollarSign,
  Smartphone,
} from 'lucide-react';
import { fetchClientes, guardarCliente, toggleLuzMesa, actualizarPuntosJugador } from '@/lib/api';

interface Jugador {
  id: string;
  nombre: string;
  puntos_carambolas: number;
  posicion: number;
  consumo_bar?: number;
}

interface SesionMesa {
  sesion_id: string;
  modalidad_tiempo: string;
  minutos_prepago: number;
  hora_inicio: string;
  tarifa_hora_aplicada: number;
  minutos_transcurridos: number;
  costo_tiempo: number;
  total_pedidos: number;
  total_acumulado: number;
  jugadores: Jugador[];
}

export interface Mesa {
  id: string;
  numero: number;
  nombre: string;
  tipo: string;
  tarifa_por_hora: number;
  estado: string;
  sesion?: SesionMesa | null;
}

interface ViewMesasProps {
  mesas: Mesa[];
  onAbrirMesa: (mesaId: string, data: any) => Promise<void>;
  onCerrarMesa: (mesaId: string, metodoPago: string) => Promise<void>;
  onAbrirPedidoMesa: (mesaId: string) => void;
}

export default function ViewMesas({
  mesas,
  onAbrirMesa,
  onCerrarMesa,
  onAbrirPedidoMesa,
}: ViewMesasProps) {
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState<string>(mesas[0]?.id || '');
  const [modalAbrir, setModalAbrir] = useState<Mesa | null>(null);
  const [modalCobrar, setModalCobrar] = useState<Mesa | null>(null);
  const [lucesEstado, setLucesEstado] = useState<Record<string, boolean>>({});

  // Formulario apertura
  const [modalidadTiempo, setModalidadTiempo] = useState<'libre' | 'prepago'>('libre');
  const [bloquePrepago, setBloquePrepago] = useState<number>(60);
  const [jugadoresCuenta, setJugadoresCuenta] = useState<string[]>(['Mesa']);
  const [nuevoJugadorInput, setNuevoJugadorInput] = useState<string>('');
  const [clientesBD, setClientesBD] = useState<Array<{ id: string; nombre: string; apodo?: string; visitas?: number }>>([]);

  useEffect(() => {
    if (!mesaSeleccionadaId && mesas.length > 0) {
      const enJuego = mesas.find((m) => m.estado === 'en_juego');
      setMesaSeleccionadaId(enJuego ? enJuego.id : mesas[0].id);
    }
  }, [mesas, mesaSeleccionadaId]);

  useEffect(() => {
    fetchClientes()
      .then((res) => setClientesBD(res.clientes || []))
      .catch((err) => console.error('Error cargando clientes de BD:', err));
  }, [modalAbrir]);

  const getInitials = (nombre: string) => {
    if (!nombre) return 'ME';
    const clean = nombre.trim();
    if (clean.toLowerCase() === 'mesa') return 'ME';
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  };

  // Formulario cobro
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<string>('efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(0);

  // Cronómetro local
  const [segundosExtra, setSegundosExtra] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setSegundosExtra((prev) => (prev + 1) % 60);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalCobrar) setModalCobrar(null);
        if (modalAbrir) setModalAbrir(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalCobrar, modalAbrir]);

  const mesasEnJuego = mesas.filter((m) => m.estado === 'en_juego').length;
  const mesaActiva = mesas.find((m) => m.id === mesaSeleccionadaId) || mesas[0];

  const formatearTiempo = (minutos: number, seg: number = 0) => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    const s = seg;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleToggleLuz = async (mesaId: string) => {
    try {
      const nuevoEstado = !lucesEstado[mesaId];
      setLucesEstado((prev) => ({ ...prev, [mesaId]: nuevoEstado }));
      await toggleLuzMesa(mesaId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeltaPuntos = async (jugadorId: string, delta: number) => {
    try {
      await actualizarPuntosJugador(jugadorId, delta);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmarApertura = async () => {
    if (!modalAbrir) return;
    const jugadoresLimpios = jugadoresCuenta.map(j => j.trim()).filter(j => j !== '');
    await onAbrirMesa(modalAbrir.id, {
      modalidad_tiempo: modalidadTiempo,
      minutos_prepago: modalidadTiempo === 'prepago' ? bloquePrepago : 0,
      jugadores: jugadoresLimpios.length > 0 ? jugadoresLimpios : ['Mesa'],
    });
    setModalAbrir(null);
  };

  const handleConfirmarCobro = async () => {
    if (!modalCobrar) return;
    await onCerrarMesa(modalCobrar.id, metodoPagoSeleccionado);
    setModalCobrar(null);
  };

  return (
    <div className="w-full h-full flex flex-col gap-3 select-none overflow-hidden">
      {/* 1. Barra de Control Superior Compacta */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl border border-[var(--slate)]/20 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[var(--ink)] text-white text-xs font-bold shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Salón de Billar</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {mesasEnJuego} en juego
            </span>
            <span className="flex items-center gap-1.5 font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              {mesas.length - mesasEnJuego} libres
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-[var(--navy)]">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-[var(--label)]" />
            <span>Pool: <b>$14.000/h</b></span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span>Tres Bandas: <b>$18.000/h</b></span>
          </div>
        </div>
      </div>

      {/* 2. Cuerpo: Floor Plan + Centro de Control */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        
        {/* ================= AREA DEL SALON DE BILLAR (FLOOR PLAN) ================= */}
        <div className="flex-1 floor-wood rounded-2xl p-4 border border-[var(--slate)]/30 shadow-inner flex flex-col justify-between overflow-hidden">
          
          {/* Zona de Barra de Café / Bar */}
          <div className="w-full flex items-center justify-between px-4 py-1.5 rounded-xl bg-white/70 border border-[var(--slate)]/20 text-[var(--ink)] text-xs backdrop-blur-md shadow-xs shrink-0">
            <div className="flex items-center gap-2">
              <Beer className="w-4 h-4 text-amber-500" />
              <span className="font-extrabold tracking-wider uppercase text-xs">Zona de Barra & Bebidas</span>
            </div>
            <span className="text-[11px] font-semibold text-[var(--label)]">Atención directa a mesa</span>
          </div>

          {/* Distribución de las mesas en el salón (auto adaptada sin scroll) */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 items-center justify-items-center py-2 flex-1 content-center">
            {mesas.map((mesa) => {
              const enJuego = mesa.estado === 'en_juego';
              const isSelected = mesa.id === mesaActiva?.id;
              const sesion = mesa.sesion;
              const esPrepago = sesion?.modalidad_tiempo === 'prepago';
              const luzEncendida = lucesEstado[mesa.id] !== undefined ? lucesEstado[mesa.id] : enJuego;

              return (
                <div
                  key={mesa.id}
                  onClick={() => setMesaSeleccionadaId(mesa.id)}
                  className={`group relative flex flex-col items-center cursor-pointer transition-all duration-200 ${
                    isSelected ? 'scale-105 z-20' : 'hover:scale-102 hover:z-10'
                  }`}
                >
                  {/* Lámpara Cenital */}
                  <div className="flex flex-col items-center mb-0.5 z-10">
                    <div className="w-0.5 h-4 bg-slate-500/70" />
                    <div
                      className={`w-16 h-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                        luzEncendida
                          ? 'bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.9)]'
                          : 'bg-slate-400 shadow-none'
                      }`}
                    >
                      <span className="text-[7.5px] font-black uppercase text-slate-900 opacity-90 leading-none">
                        {luzEncendida ? 'LUZ ON' : 'OFF'}
                      </span>
                    </div>
                  </div>

                  {/* Mesa de Billar */}
                  <div
                    className={`table-cushion w-48 h-28 p-2 transition-all duration-200 relative ${
                      isSelected
                        ? 'ring-4 ring-emerald-500 shadow-xl'
                        : 'shadow-md'
                    }`}
                  >
                    {/* Paño del tapiz */}
                    <div
                      className={`w-full h-full rounded-md flex flex-col justify-between p-2 relative overflow-hidden transition-all duration-300 ${
                        enJuego
                          ? esPrepago
                            ? 'table-felt-warn'
                            : 'table-felt-busy'
                          : 'table-felt-free'
                      }`}
                    >
                      {/* Cabecera del tapiz */}
                      <div className="flex items-center justify-between text-white drop-shadow z-10">
                        <span className="font-mono font-black text-[11px] px-1.5 py-0.5 rounded bg-black/40 border border-white/20">
                          #{String(mesa.numero).padStart(2, '0')}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            enJuego
                              ? 'bg-white/25 text-white animate-pulse'
                              : 'bg-black/30 text-emerald-200'
                          }`}
                        >
                          {enJuego ? (esPrepago ? 'Prepago' : 'Jugando') : 'Libre'}
                        </span>
                      </div>

                      {/* Bolas de billar */}
                      <div className="flex items-center justify-center gap-2 z-10">
                        {mesa.tipo.includes('banda') || mesa.tipo.includes('carambola') ? (
                          <>
                            <div className="w-3.5 h-3.5 rounded-full ball-cue" />
                            <div className="w-3.5 h-3.5 rounded-full ball-red" />
                            <div className="w-3.5 h-3.5 rounded-full ball-yellow" />
                          </>
                        ) : (
                          <>
                            <div className="w-3.5 h-3.5 rounded-full ball-cue" />
                            <div className="w-3.5 h-3.5 rounded-full ball-eight flex items-center justify-center text-[6px] font-bold text-white">8</div>
                          </>
                        )}
                      </div>

                      {/* Pie del tapiz */}
                      <div className="flex items-center justify-between text-white z-10">
                        <span className="text-[9.5px] font-semibold text-emerald-100/90 capitalize truncate max-w-[70px]">
                          {mesa.tipo.replace('_', ' ')}
                        </span>
                        {enJuego && sesion ? (
                          <span className="font-mono font-black text-[11px] text-white bg-black/40 px-1 py-0.5 rounded border border-white/20 drop-shadow">
                            {formatearTiempo(sesion.minutos_transcurridos, segundosExtra)}
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-bold text-emerald-300">
                            Disponible
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rótulo de la Mesa */}
                  <div className="mt-1.5 text-center">
                    <span
                      className={`text-[11px] font-extrabold tracking-wide px-2.5 py-0.5 rounded-full transition-all ${
                        isSelected
                          ? 'bg-[var(--ink)] text-white shadow-sm'
                          : 'text-[var(--navy)] bg-white/80'
                      }`}
                    >
                      Mesa {mesa.numero}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rótulo de acceso */}
          <div className="w-full flex items-center justify-center pt-2 border-t border-[var(--slate)]/20 text-[var(--label)] text-[11px] font-semibold shrink-0">
            <span>🚪 Entrada Principal · Acceso de Clientes</span>
          </div>
        </div>

        {/* ================= CENTRO DE CONTROL LATERAL DERECHO (NO SCROLL) ================= */}
        {mesaActiva && (
          <aside className="w-[330px] bg-white rounded-2xl p-4 border border-[var(--slate)]/20 shadow-lg flex flex-col justify-between shrink-0 overflow-y-auto max-h-full">
            {/* Cabecera */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[var(--ink)] text-white flex items-center justify-center font-mono font-black text-sm shadow-sm">
                    {String(mesaActiva.numero).padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[var(--ink)] leading-tight">
                      Mesa {mesaActiva.numero}
                    </h3>
                    <p className="text-[11px] font-semibold text-[var(--label)] capitalize">
                      {mesaActiva.tipo.replace('_', ' ')} · ${Number(mesaActiva.tarifa_por_hora).toLocaleString('es-CO')}/h
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleLuz(mesaActiva.id)}
                  className={`p-2 rounded-xl transition-all shadow-xs ${
                    lucesEstado[mesaActiva.id]
                      ? 'bg-amber-400 text-amber-950 font-bold'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                  title="Encender o apagar luz"
                >
                  <Lightbulb className="w-4 h-4 fill-current" />
                </button>
              </div>

              {/* Contenido en Juego */}
              {mesaActiva.estado === 'en_juego' && mesaActiva.sesion ? (
                <>
                  {/* Cronómetro Digital */}
                  <div className="bg-[var(--ink)] rounded-xl p-3 text-white text-center shadow-sm">
                    <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold mb-0.5">
                      <span>{mesaActiva.sesion.modalidad_tiempo === 'prepago' ? 'Mesa en Prepago' : 'Tiempo en Curso'}</span>
                      <span className="text-emerald-400 font-mono text-[10px] font-bold">● En vivo</span>
                    </div>

                    <div className="text-3xl font-mono font-black tracking-widest text-emerald-400 py-0.5 drop-shadow">
                      {formatearTiempo(mesaActiva.sesion.minutos_transcurridos, segundosExtra)}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1.5 border-t border-slate-700 mt-1">
                      <span>Costo tiempo:</span>
                      <b className="font-mono text-white text-xs">
                        ${mesaActiva.sesion.costo_tiempo.toLocaleString('es-CO')}
                      </b>
                    </div>
                  </div>

                  {/* Marcadores de Carambolas */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-[var(--navy)] flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Marcador de Carambolas
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">● En juego</span>
                    </span>

                    <div className="flex flex-col gap-1 max-h-28 overflow-hidden">
                      {mesaActiva.sesion.jugadores.slice(0, 3).map((j) => (
                        <div
                          key={j.id}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[var(--page)] border border-[var(--slate)]/20"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-5 h-5 rounded-md bg-[var(--ink)] text-white text-[9px] font-black flex items-center justify-center">
                              {getInitials(j.nombre)}
                            </div>
                            <span className="text-xs font-bold text-[var(--ink)] truncate max-w-[110px]">
                              {j.nombre === 'Mesa' ? 'Mesa General' : j.nombre}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-slate-200">
                            <button
                              onClick={() => handleDeltaPuntos(j.id, -1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 font-black text-xs"
                            >
                              -
                            </button>
                            <span className="font-mono font-black text-xs min-w-[18px] text-center text-[var(--ink)]">
                              {j.puntos_carambolas || 0}
                            </span>
                            <button
                              onClick={() => handleDeltaPuntos(j.id, 1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 font-black text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desglose de Cobro */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col gap-1 text-xs">
                    <div className="flex justify-between text-[var(--label)]">
                      <span>Consumo Bar:</span>
                      <b className="font-mono text-slate-800">
                        ${mesaActiva.sesion.total_pedidos.toLocaleString('es-CO')}
                      </b>
                    </div>
                    <div className="flex justify-between text-[var(--label)]">
                      <span>Costo Mesa:</span>
                      <b className="font-mono text-slate-800">
                        ${mesaActiva.sesion.costo_tiempo.toLocaleString('es-CO')}
                      </b>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center">
                      <span className="font-black text-xs text-[var(--ink)]">Total a Cobrar:</span>
                      <span className="text-base font-mono font-black text-emerald-800">
                        ${mesaActiva.sesion.total_acumulado.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                /* Estado Disponible */
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 border border-emerald-200">
                    <Check className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[var(--ink)]">Mesa Disponible</h4>
                  <p className="text-xs text-[var(--label)] mt-0.5">
                    Lista para iniciar juego
                  </p>
                </div>
              )}
            </div>

            {/* Acciones Inferiores en línea con flex horizontal asegurado */}
            <div
              className="pt-3 pb-1 border-t border-slate-100 flex-shrink-0"
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '8px',
                width: '100%',
              }}
            >
              {mesaActiva.estado === 'en_juego' ? (
                <>
                  <button
                    onClick={() => onAbrirPedidoMesa(mesaActiva.id)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 8px',
                      borderRadius: '12px',
                      background: '#F1F5F9',
                      color: 'var(--ink)',
                      fontWeight: 700,
                      fontSize: '12px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus style={{ width: '15px', height: '15px' }} />
                    <span>+ Comanda</span>
                  </button>

                  <button
                    onClick={() => {
                      setModalCobrar(mesaActiva);
                      setMetodoPagoSeleccionado('efectivo');
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 8px',
                      borderRadius: '12px',
                      background: '#184A35',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(24, 74, 53, 0.3)',
                    }}
                  >
                    <CreditCard style={{ width: '15px', height: '15px' }} />
                    <span>Cobrar</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setModalAbrir(mesaActiva);
                    setModalidadTiempo('libre');
                    setBloquePrepago(60);
                    setJugadoresCuenta(['Mesa']);
                    setNuevoJugadorInput('');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'var(--ink)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Play style={{ width: '14px', height: '14px', fill: '#FFFFFF' }} />
                  <span>Abrir Mesa {mesaActiva.numero}</span>
                </button>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ================= MODALES ================= */}
      {modalAbrir && (
        <div
          onClick={() => setModalAbrir(null)}
          className="overlay show cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal cursor-default"
          >
            <div className="m-head">
              <div className="c-num">{String(modalAbrir.numero).padStart(2, '0')}</div>
              <div>
                <h3>Abrir {modalAbrir.nombre}</h3>
                <p>{modalAbrir.tipo.replace('_', ' ')} · ${Number(modalAbrir.tarifa_por_hora).toLocaleString('es-CO')} / hora</p>
              </div>
              <button className="x" onClick={() => setModalAbrir(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="m-body">
              <div>
                <div className="step"><i>1</i>Modalidad de juego</div>
                <div className="opts">
                  <button
                    className={`opt ${modalidadTiempo === 'libre' ? 'sel' : ''}`}
                    onClick={() => setModalidadTiempo('libre')}
                  >
                    <div className="t">Tiempo libre</div>
                    <small>Se liquida al final según minutos reales</small>
                  </button>
                  <button
                    className={`opt ${modalidadTiempo === 'prepago' ? 'sel' : ''}`}
                    onClick={() => setModalidadTiempo('prepago')}
                  >
                    <div className="t">Prepago fijado</div>
                    <small>Tiempo límite con aviso sonoro/luz</small>
                  </button>
                </div>
              </div>

              {modalidadTiempo === 'prepago' && (
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setBloquePrepago(mins)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        bloquePrepago === mins
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-white font-bold shadow'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-sm font-bold">{mins} min</span>
                      <small className="text-[10px] opacity-80">
                        ${((mins / 60) * Number(modalAbrir.tarifa_por_hora)).toLocaleString('es-CO')}
                      </small>
                    </button>
                  ))}
                </div>
              )}

              <div>
                <div className="step"><i>2</i>Nombre de Jugadores / Cuenta</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {jugadoresCuenta.map((j, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold flex items-center gap-1.5"
                    >
                      {j}
                      {j !== 'Mesa' && (
                        <button
                          onClick={() => setJugadoresCuenta(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nuevoJugadorInput}
                    onChange={(e) => setNuevoJugadorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && nuevoJugadorInput.trim()) {
                        setJugadoresCuenta(prev => [...prev, nuevoJugadorInput.trim()]);
                        setNuevoJugadorInput('');
                      }
                    }}
                    placeholder="Escribe el nombre del cliente..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ink)]"
                  />
                  <button
                    onClick={() => {
                      if (nuevoJugadorInput.trim()) {
                        setJugadoresCuenta(prev => [...prev, nuevoJugadorInput.trim()]);
                        setNuevoJugadorInput('');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            <div className="m-foot">
              <button className="btn btn-ghost" onClick={() => setModalAbrir(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleConfirmarApertura}>
                Confirmar y Encender Luz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Concepto 2: Panel Lateral Deslizante (Slide-over Drawer POS) Sin Scroll */}
      {modalCobrar && (
        <div
          onClick={() => setModalCobrar(null)}
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-pointer"
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '440px',
              maxWidth: '92vw',
              height: '100vh',
              maxHeight: '100vh',
              background: '#FFFFFF',
              boxShadow: '-10px 0 40px rgba(15, 23, 42, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              cursor: 'default',
            }}
          >
            {/* Cabecera Compacta del Panel Lateral */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                color: '#FFFFFF',
                padding: '18px 22px 16px',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      background: '#184A35',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'JetBrains Mono',
                      fontWeight: 900,
                      fontSize: '15px',
                      boxShadow: '0 4px 12px rgba(24, 74, 53, 0.4)',
                    }}
                  >
                    #{String(modalCobrar.numero).padStart(2, '0')}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                      Cobro Mesa {modalCobrar.numero}
                    </h3>
                    <p style={{ fontSize: '11px', margin: '1px 0 0', color: '#94A3B8' }}>
                      {modalCobrar.tipo.replace('_', ' ')} · Cierre de cuenta
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalCobrar(null)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#CBD5E1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Cerrar panel"
                >
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>

              {/* Total Prominente en el Header */}
              <div
                style={{
                  marginTop: '12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total a Liquidar
                  </span>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '28px', fontWeight: 900, color: '#34D399', letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: '2px' }}>
                    ${modalCobrar.sesion?.total_acumulado.toLocaleString('es-CO')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10.5px', color: '#94A3B8' }}>Duración sesión</span>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginTop: '1px' }}>
                    {modalCobrar.sesion?.minutos_transcurridos} min
                  </div>
                </div>
              </div>
            </div>

            {/* Cuerpo del Drawer Lateral Ajustado sin desbordamientos */}
            <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflow: 'hidden' }}>
              
              {/* Desglose compacto de la Cuenta */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                  Desglose de la Cuenta
                </span>

                <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '12px 14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#334155' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock style={{ width: '14px', height: '14px', color: '#64748B' }} />
                      Tiempo ({modalCobrar.sesion?.minutos_transcurridos} min):
                    </span>
                    <b style={{ fontFamily: 'JetBrains Mono', color: '#0F172A' }}>
                      ${modalCobrar.sesion?.costo_tiempo.toLocaleString('es-CO')}
                    </b>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#334155' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Beer style={{ width: '14px', height: '14px', color: '#64748B' }} />
                      Consumo de bar y cafetería:
                    </span>
                    <b style={{ fontFamily: 'JetBrains Mono', color: '#D97706' }}>
                      ${modalCobrar.sesion?.total_pedidos.toLocaleString('es-CO')}
                    </b>
                  </div>
                </div>
              </div>

              {/* Selector de Método de Pago */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                  Método de Pago
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'efectivo', label: 'Efectivo', icon: DollarSign, desc: 'Caja' },
                    { id: 'transferencia', label: 'Transferencia', icon: Smartphone, desc: 'Nequi / Banc.' },
                    { id: 'tarjeta', label: 'Datáfono', icon: CreditCard, desc: 'Tarjeta' },
                  ].map((m) => {
                    const isSel = metodoPagoSeleccionado === m.id;
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMetodoPagoSeleccionado(m.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          padding: '10px 6px',
                          borderRadius: '14px',
                          border: isSel ? '2px solid #0F172A' : '1px solid #CBD5E1',
                          background: isSel ? '#0F172A' : '#F8FAFC',
                          color: isSel ? '#FFFFFF' : '#334155',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSel ? '0 4px 12px rgba(15, 23, 42, 0.18)' : 'none',
                        }}
                      >
                        <Icon style={{ width: '18px', height: '18px', color: isSel ? '#34D399' : '#64748B' }} />
                        <span style={{ fontSize: '12px', fontWeight: 800 }}>{m.label}</span>
                        <span style={{ fontSize: '9.5px', color: isSel ? '#94A3B8' : '#94A3B8' }}>{m.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cálculo de Efectivo y Cambio / Vueltas Compacto */}
              {metodoPagoSeleccionado === 'efectivo' && (
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                      Efectivo recibido:
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[10000, 20000, 50000].map((monto) => (
                        <button
                          key={monto}
                          type="button"
                          onClick={() => setEfectivoRecibido(monto)}
                          style={{
                            fontSize: '10.5px',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: '#E2E8F0',
                            border: 'none',
                            color: '#1E293B',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          ${monto / 1000}k
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748B', fontSize: '14px' }}>
                        $
                      </span>
                      <input
                        type="number"
                        value={efectivoRecibido || ''}
                        onChange={(e) => setEfectivoRecibido(Number(e.target.value))}
                        placeholder={String(modalCobrar.sesion?.total_acumulado || 0)}
                        style={{
                          width: '100%',
                          padding: '8px 10px 8px 24px',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          fontSize: '15px',
                          fontFamily: 'JetBrains Mono',
                          fontWeight: 700,
                          color: '#0F172A',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '100px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', display: 'block' }}>
                        Cambio / Vueltas
                      </span>
                      <b
                        style={{
                          fontFamily: 'JetBrains Mono',
                          fontSize: '16px',
                          color: (efectivoRecibido || 0) >= (modalCobrar.sesion?.total_acumulado || 0) ? '#059669' : '#DC2626',
                        }}
                      >
                        ${Math.max(0, (efectivoRecibido || 0) - (modalCobrar.sesion?.total_acumulado || 0)).toLocaleString('es-CO')}
                      </b>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Acciones Inferiores del Panel Lateral */}
            <div
              style={{
                padding: '16px 22px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                gap: '10px',
                background: '#FAFAFA',
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => setModalCobrar(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  background: '#F1F5F9',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Volver
              </button>

              <button
                type="button"
                onClick={handleConfirmarCobro}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '14px',
                  background: '#184A35',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(24, 74, 53, 0.4)',
                }}
              >
                <Check style={{ width: '16px', height: '16px', strokeWidth: 3 }} />
                <span>Confirmar y Liquidar</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
