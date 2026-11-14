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
  Zap,
  Search,
  UserPlus,
  ChevronDown,
} from 'lucide-react';
import {
  fetchClientes,
  guardarCliente,
  toggleLuzMesa,
  actualizarPuntosJugador,
  cargarTiempoACuenta,
} from '@/lib/api';

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
  const [modalNuevoTiempo, setModalNuevoTiempo] = useState<Mesa | null>(null);
  const [jugadorCuenta, setJugadorCuenta] = useState('');
  const [busquedaJugadorCuenta, setBusquedaJugadorCuenta] = useState('');
  const [modalPagoRealizado, setModalPagoRealizado] = useState<{
    mesaNumero: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    if (!modalPagoRealizado) return;
    const timer = setTimeout(() => {
      setModalPagoRealizado(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [modalPagoRealizado]);
  const [lucesEstado, setLucesEstado] = useState<Record<string, boolean>>({});

  // Formulario apertura
  const [modalidadTiempo, setModalidadTiempo] = useState<'libre' | 'prepago'>('libre');
  const [bloquePrepago, setBloquePrepago] = useState<number>(60);
  const [jugadoresCuenta, setJugadoresCuenta] = useState<string[]>(['Mesa']);
  const [nuevoJugadorInput, setNuevoJugadorInput] = useState<string>('');
  const [clientesBD, setClientesBD] = useState<Array<{ id: string; nombre: string; apodo?: string; visitas?: number }>>([]);
  const [menuClientesAbierto, setMenuClientesAbierto] = useState<boolean>(false);
  const [modalNuevoCliente, setModalNuevoCliente] = useState<boolean>(false);
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState<string>('');
  const [nuevoClienteApodo, setNuevoClienteApodo] = useState<string>('');
  const [nuevoClienteTelefono, setNuevoClienteTelefono] = useState<string>('');
  const [guardandoNuevoCliente, setGuardandoNuevoCliente] = useState<boolean>(false);

  const handleGuardarNuevoClienteModal = async () => {
    const limpio = nuevoClienteNombre.trim();
    if (!limpio) return;
    try {
      setGuardandoNuevoCliente(true);
      const res = await guardarCliente(
        limpio,
        nuevoClienteApodo.trim() || undefined,
        nuevoClienteTelefono.trim() || undefined
      );
      if (res?.cliente) {
        setClientesBD((prev) => [res.cliente, ...prev]);
      }
      if (!jugadoresCuenta.some((j) => j.toLowerCase() === limpio.toLowerCase())) {
        setJugadoresCuenta((prev) => [...prev, limpio]);
      }
      setNuevoClienteNombre('');
      setNuevoClienteApodo('');
      setNuevoClienteTelefono('');
      setModalNuevoCliente(false);
    } catch (e: any) {
      alert(e.message || 'Error al registrar cliente');
    } finally {
      setGuardandoNuevoCliente(false);
    }
  };

  const handleAgregarJugadorDesdeMenu = async (nombre: string) => {
    const limpio = nombre.trim();
    if (!limpio) return;
    const existeEnBD = clientesBD.some((c) => c.nombre.toLowerCase() === limpio.toLowerCase());
    if (!existeEnBD) {
      try {
        const res = await guardarCliente(limpio);
        if (res?.cliente) {
          setClientesBD((prev) => [res.cliente, ...prev]);
        }
      } catch (e) {
        console.error('Error registrando cliente:', e);
      }
    }
    if (!jugadoresCuenta.some((j) => j.toLowerCase() === limpio.toLowerCase())) {
      setJugadoresCuenta((prev) => [...prev, limpio]);
    }
    setNuevoJugadorInput('');
    setMenuClientesAbierto(false);
  };

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
    const totalALiquidar = modalCobrar.sesion?.total_acumulado || 0;
    if (metodoPagoSeleccionado === 'efectivo' && (efectivoRecibido || 0) < totalALiquidar) {
      return;
    }
    const mesaNumero = modalCobrar.numero;
    await onCerrarMesa(modalCobrar.id, metodoPagoSeleccionado);
    setModalCobrar(null);
    setEfectivoRecibido(0);
    setModalPagoRealizado({ mesaNumero, total: totalALiquidar });
  };

  const handleCargarACuentaYNuevoTiempo = async () => {
    if (!modalNuevoTiempo) return;
    const mesaId = modalNuevoTiempo.id;
    const mesaNumero = modalNuevoTiempo.numero;
    const minutos = modalNuevoTiempo.sesion?.minutos_transcurridos || 0;
    const costoTiempo = modalNuevoTiempo.sesion?.costo_tiempo || 0;
    const modalidadActual = (modalNuevoTiempo.sesion as any)?.modalidad || 'libre';
    const jugadoresActuales = modalNuevoTiempo.sesion?.jugadores?.map((j) => j.nombre) || [];
    const nombreJugador =
      jugadorCuenta.trim() || clientesBD[0]?.nombre || jugadoresActuales[0] || `Mesa ${mesaNumero}`;

    try {
      await cargarTiempoACuenta({
        mesa_id: mesaId,
        deportista: nombreJugador,
        minutos,
        costo_tiempo: costoTiempo,
      });
      await onAbrirMesa(mesaId, {
        modalidad_tiempo: modalidadActual,
        jugadores: jugadoresActuales.length > 0 ? jugadoresActuales : [nombreJugador],
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('billard_chamo_pedidos_actualizados'));
      }
      setModalNuevoTiempo(null);
      setJugadorCuenta('');
    } catch (err: any) {
      alert(err.message || 'Error al cargar tiempo a la cuenta');
    }
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

                          <div className="bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                            <span className="font-mono font-black text-xs text-[var(--ink)]">
                              {j.puntos_carambolas || 0} pts
                            </span>
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
                    <span>Comanda</span>
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

                  <button
                    onClick={() => {
                      setJugadorCuenta(clientesBD[0]?.nombre || '');
                      setModalNuevoTiempo(mesaActiva);
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      padding: '10px 8px',
                      borderRadius: '12px',
                      background: '#FEF3C7',
                      color: '#92400E',
                      fontWeight: 700,
                      fontSize: '12px',
                      border: '1px solid #FDE68A',
                      cursor: 'pointer',
                    }}
                  >
                    <Clock style={{ width: '15px', height: '15px' }} />
                    <span>Nuevo Tiempo</span>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl border border-slate-300 shadow-2xl cursor-default font-['Urbanist',sans-serif]"
          >
            {/* Header Oscuro Elegante */}
            <div className="p-5 bg-[#28353E] text-white flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#184A35] text-white font-mono font-black text-base flex items-center justify-center shadow-sm border border-emerald-400/30">
                  {String(modalAbrir.numero).padStart(2, '0')}
                </div>
                <div>
                  <h3 className="font-black text-base leading-tight">Abrir {modalAbrir.nombre}</h3>
                  <p className="text-[11px] font-semibold text-slate-300 capitalize mt-0.5">
                    {modalAbrir.tipo.replace('_', ' ')} · ${Number(modalAbrir.tarifa_por_hora).toLocaleString('es-CO')} / hora
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAbrir(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo */}
            <div className="p-5 space-y-4">
              {/* Paso 1: Modalidad */}
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                  1. Modalidad de Juego
                </span>
                <div
                  className="grid grid-cols-2 gap-2.5"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
                >
                  <button
                    type="button"
                    onClick={() => setModalidadTiempo('libre')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      modalidadTiempo === 'libre'
                        ? 'bg-[#EDF2F7] border-[#28353E] ring-2 ring-[#28353E]/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-[#28353E]">Tiempo Libre</span>
                      <Clock className="w-4 h-4 text-[#184A35]" />
                    </div>
                    <p className="text-[10.5px] font-semibold text-slate-500 leading-snug">
                      Se liquida al final según minutos reales
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalidadTiempo('prepago')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      modalidadTiempo === 'prepago'
                        ? 'bg-[#EDF2F7] border-[#28353E] ring-2 ring-[#28353E]/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-[#28353E]">Prepago Fijado</span>
                      <Zap className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-[10.5px] font-semibold text-slate-500 leading-snug">
                      Tiempo límite con aviso al finalizar
                    </p>
                  </button>
                </div>
              </div>

              {modalidadTiempo === 'prepago' && (
                <div
                  className="grid grid-cols-4 gap-2"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
                >
                  {[30, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setBloquePrepago(mins)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        bloquePrepago === mins
                          ? 'border-[#28353E] bg-[#28353E] text-white font-bold shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block text-xs font-black">{mins} min</span>
                      <small className="text-[10px] opacity-80 font-mono">
                        ${((mins / 60) * Number(modalAbrir.tarifa_por_hora)).toLocaleString('es-CO')}
                      </small>
                    </button>
                  ))}
                </div>
              )}

              {/* Paso 2: Jugadores */}
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                  2. Jugadores / Cuenta
                </span>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {jugadoresCuenta.map((j, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-[#EDF2F7] border border-slate-300 text-[#28353E] text-xs font-bold flex items-center gap-1.5"
                    >
                      {j}
                      {j !== 'Mesa' && (
                        <button
                          type="button"
                          onClick={() => setJugadoresCuenta(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 font-black cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={nuevoJugadorInput}
                        onFocus={() => setMenuClientesAbierto(true)}
                        onChange={(e) => {
                          setNuevoJugadorInput(e.target.value);
                          setMenuClientesAbierto(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && nuevoJugadorInput.trim()) {
                            handleAgregarJugadorDesdeMenu(nuevoJugadorInput);
                          }
                        }}
                        placeholder="Buscar cliente o escribir nuevo..."
                        className="w-full pl-8 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-[#28353E] focus:outline-none focus:ring-2 focus:ring-[#184A35]"
                      />
                      <button
                        type="button"
                        onClick={() => setMenuClientesAbierto((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNuevoClienteNombre(nuevoJugadorInput.trim());
                        setMenuClientesAbierto(false);
                        setModalNuevoCliente(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#28353E] hover:bg-[#1a2329] text-white text-xs font-bold cursor-pointer transition-all"
                    >
                      Agregar
                    </button>
                  </div>

                  {menuClientesAbierto && (
                    <div className="absolute left-0 right-0 top-11 z-30 max-h-40 overflow-y-auto rounded-xl bg-white border border-slate-300 shadow-2xl p-1.5 space-y-1">
                      {clientesBD
                        .filter((c) =>
                          c.nombre.toLowerCase().includes(nuevoJugadorInput.trim().toLowerCase())
                        )
                        .slice(0, 6)
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleAgregarJugadorDesdeMenu(c.nombre)}
                            className="w-full px-3 py-1.5 rounded-lg hover:bg-slate-100 text-left text-xs font-bold text-[#28353E] flex items-center justify-between cursor-pointer"
                          >
                            <span>{c.nombre}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">Cliente registrado</span>
                          </button>
                        ))}

                      {nuevoJugadorInput.trim() &&
                        !clientesBD.some(
                          (c) => c.nombre.toLowerCase() === nuevoJugadorInput.trim().toLowerCase()
                        ) && (
                          <button
                            type="button"
                            onClick={() => handleAgregarJugadorDesdeMenu(nuevoJugadorInput)}
                            className="w-full px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Registrar y agregar "{nuevoJugadorInput.trim()}"</span>
                          </button>
                        )}

                      {clientesBD.length === 0 && !nuevoJugadorInput.trim() && (
                        <p className="text-[11px] text-slate-400 text-center py-2">
                          Escribe un nombre para registrar el primer cliente
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center gap-2.5 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setModalAbrir(null)}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarApertura}
                className="flex-1 py-2.5 rounded-xl bg-[#184A35] hover:bg-[#123828] text-white font-black text-xs shadow-md shadow-[#184A35]/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Confirmar y Abrir Mesa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rápido para Registrar Nuevo Jugador en Base de Datos */}
      {modalNuevoCliente && (
        <div
          onClick={() => setModalNuevoCliente(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-3xl border border-slate-300 shadow-2xl overflow-hidden cursor-default font-['Urbanist',sans-serif]"
          >
            <div className="p-4 bg-[#28353E] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#184A35] flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h4 className="font-black text-sm leading-tight">Registrar Jugador</h4>
                  <p className="text-[10.5px] text-slate-300">Se guardará en la base de datos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoCliente(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Nombre completo *
                </label>
                <input
                  autoFocus
                  type="text"
                  value={nuevoClienteNombre}
                  onChange={(e) => setNuevoClienteNombre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && nuevoClienteNombre.trim()) {
                      handleGuardarNuevoClienteModal();
                    }
                  }}
                  placeholder="Ej: Carlos Rodríguez"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold text-[#28353E] focus:outline-none focus:ring-2 focus:ring-[#184A35]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Apodo (opcional)
                </label>
                <input
                  type="text"
                  value={nuevoClienteApodo}
                  onChange={(e) => setNuevoClienteApodo(e.target.value)}
                  placeholder="Ej: El Zurdo"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-semibold text-[#28353E] focus:outline-none focus:ring-2 focus:ring-[#184A35]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Teléfono / WhatsApp (opcional)
                </label>
                <input
                  type="text"
                  value={nuevoClienteTelefono}
                  onChange={(e) => setNuevoClienteTelefono(e.target.value)}
                  placeholder="Ej: 300 123 4567"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-semibold text-[#28353E] focus:outline-none focus:ring-2 focus:ring-[#184A35]"
                />
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalNuevoCliente(false)}
                className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoNuevoCliente || !nuevoClienteNombre.trim()}
                onClick={handleGuardarNuevoClienteModal}
                className="flex-1 py-2 rounded-xl bg-[#184A35] hover:bg-[#123828] text-white font-black text-xs cursor-pointer disabled:opacity-50"
              >
                {guardandoNuevoCliente ? 'Guardando...' : 'Guardar y Agregar'}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'efectivo', label: 'Efectivo', icon: DollarSign, desc: 'Caja' },
                    { id: 'transferencia', label: 'Transferencia', icon: Smartphone, desc: 'Nequi / Banc.' },
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
                        type="text"
                        inputMode="numeric"
                        value={efectivoRecibido ? efectivoRecibido.toLocaleString('es-CO') : ''}
                        onChange={(e) => {
                          const soloDigitos = e.target.value.replace(/\D/g, '');
                          setEfectivoRecibido(soloDigitos ? Number(soloDigitos) : 0);
                        }}
                        placeholder={(modalCobrar.sesion?.total_acumulado || 0).toLocaleString('es-CO')}
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
                disabled={
                  metodoPagoSeleccionado === 'efectivo' &&
                  (efectivoRecibido || 0) < (modalCobrar.sesion?.total_acumulado || 0)
                }
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '14px',
                  background: '#184A35',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '13px',
                  border: 'none',
                  cursor:
                    metodoPagoSeleccionado === 'efectivo' &&
                    (efectivoRecibido || 0) < (modalCobrar.sesion?.total_acumulado || 0)
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    metodoPagoSeleccionado === 'efectivo' &&
                    (efectivoRecibido || 0) < (modalCobrar.sesion?.total_acumulado || 0)
                      ? 0.5
                      : 1,
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

      {modalPagoRealizado && (
        <div
          onClick={() => setModalPagoRealizado(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            overflow: 'hidden',
          }}
        >
          <style>{`
            @keyframes confetti-fall {
              0% {
                transform: translateY(-10vh) rotate(0deg);
                opacity: 1;
              }
              100% {
                transform: translateY(110vh) rotate(720deg);
                opacity: 0;
              }
            }
          `}</style>
          {Array.from({ length: 36 }).map((_, i) => {
            const colors = ['#16A34A', '#22C55E', '#FACC15', '#3B82F6', '#EC4899', '#F97316'];
            const left = `${(i * 2.8 + (i % 3) * 1.5) % 100}%`;
            const delay = `${(i % 8) * 0.12}s`;
            const duration = `${2.2 + (i % 5) * 0.35}s`;
            const size = 8 + (i % 4) * 3;
            return (
              <span
                key={i}
                style={{
                  position: 'fixed',
                  top: 0,
                  left,
                  width: `${size}px`,
                  height: `${size * 0.6}px`,
                  background: colors[i % colors.length],
                  borderRadius: '2px',
                  pointerEvents: 'none',
                  animation: `confetti-fall ${duration} linear ${delay} infinite`,
                }}
              />
            );
          })}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '28px 36px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
              border: '1px solid #E2E8F0',
              maxWidth: '340px',
              width: '90%',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '9999px',
                background: '#DCFCE7',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <Check style={{ width: '30px', height: '30px', strokeWidth: 3 }} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
              Pago realizado
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
              Mesa {modalPagoRealizado.mesaNumero} · $
              {modalPagoRealizado.total.toLocaleString('es-CO')}
            </p>
          </div>
        </div>
      )}

      {modalNuevoTiempo && (
        <div
          onClick={() => setModalNuevoTiempo(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '24px',
              width: '100%',
              maxWidth: '380px',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
              border: '1px solid #E2E8F0',
            }}
          >
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
              Nuevo Tiempo · Mesa {modalNuevoTiempo.numero}
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#64748B' }}>
              Se cargará{' '}
              <b>${(modalNuevoTiempo.sesion?.total_acumulado || 0).toLocaleString('es-CO')}</b> (
              {modalNuevoTiempo.sesion?.minutos_transcurridos || 0} min) como cuenta por cobrar y se
              iniciará un nuevo tiempo.
            </p>

            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#475569',
                marginBottom: '6px',
              }}
            >
              Seleccionar jugador registrado:
            </label>
            <input
              type="text"
              value={busquedaJugadorCuenta}
              onChange={(e) => setBusquedaJugadorCuenta(e.target.value)}
              placeholder="Buscar jugador por nombre o apodo..."
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '12px',
                marginBottom: '8px',
                outline: 'none',
              }}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                maxHeight: '200px',
                overflowY: 'auto',
                marginBottom: '16px',
                paddingRight: '2px',
              }}
            >
              {(() => {
                const q = busquedaJugadorCuenta.trim().toLowerCase();
                const filtrados = q
                  ? clientesBD.filter(
                      (c) =>
                        c.nombre.toLowerCase().includes(q) ||
                        (c.apodo || '').toLowerCase().includes(q)
                    )
                  : clientesBD;
                const existeExacto =
                  q && clientesBD.some((c) => c.nombre.toLowerCase() === q);

                return (
                  <>
                    {filtrados.map((c) => {
                      const seleccionado = jugadorCuenta === c.nombre;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setJugadorCuenta(c.nombre)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: '12px',
                            border: seleccionado ? '2px solid #184A35' : '1px solid #E2E8F0',
                            background: seleccionado ? '#ECFDF5' : '#FFFFFF',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '9999px',
                                background: seleccionado ? '#184A35' : '#E2E8F0',
                                color: seleccionado ? '#FFFFFF' : '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              {c.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                                {c.nombre}
                              </div>
                              {c.apodo && (
                                <div style={{ fontSize: '11px', color: '#64748B' }}>
                                  "{c.apodo}"
                                </div>
                              )}
                            </div>
                          </div>
                          {seleccionado && (
                            <Check style={{ width: '16px', height: '16px', color: '#184A35' }} />
                          )}
                        </button>
                      );
                    })}

                    {q && !existeExacto && (
                      <button
                        type="button"
                        onClick={async () => {
                          const nuevoNombre = busquedaJugadorCuenta.trim();
                          if (!nuevoNombre) return;
                          try {
                            await guardarCliente(nuevoNombre);
                            const res = await fetchClientes();
                            setClientesBD(res.clientes || []);
                            setJugadorCuenta(nuevoNombre);
                            setBusquedaJugadorCuenta('');
                          } catch (err: any) {
                            alert(err.message || 'Error al agregar jugador');
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '9px 12px',
                          borderRadius: '12px',
                          border: '1px dashed #184A35',
                          background: '#F0FDF4',
                          color: '#184A35',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Plus style={{ width: '14px', height: '14px' }} />
                        <span>Agregar "{busquedaJugadorCuenta.trim()}"</span>
                      </button>
                    )}
                  </>
                );
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setModalNuevoTiempo(null)}
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  background: '#F1F5F9',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCargarACuentaYNuevoTiempo}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  background: '#D97706',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Confirmar y Abrir Nuevo Tiempo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
