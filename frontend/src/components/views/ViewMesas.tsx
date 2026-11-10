'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  Beer,
  TrendingUp,
  Tag,
  Play,
  Check,
  AlertTriangle,
  Users,
  CreditCard,
  Plus,
  Lightbulb,
  X,
  Timer,
  Hourglass,
  DollarSign,
  Smartphone,
  Minus,
  Sparkles,
  Search,
  Printer
} from 'lucide-react';
import BilliardTableIcon from '../icons/BilliardTableIcon';
import { fetchClientes, guardarCliente } from '@/lib/api';

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
  const [filtro, setFiltro] = useState<'all' | 'busy' | 'free' | 'warn'>('all');
  const [modalAbrir, setModalAbrir] = useState<Mesa | null>(null);
  const [modalCobrar, setModalCobrar] = useState<Mesa | null>(null);

  // Formulario apertura
  const [modalidadTiempo, setModalidadTiempo] = useState<'libre' | 'prepago'>('libre');
  const [bloquePrepago, setBloquePrepago] = useState<number>(60);
  const [jugadoresCuenta, setJugadoresCuenta] = useState<string[]>(['Mesa']);
  const [nuevoJugadorInput, setNuevoJugadorInput] = useState<string>('');
  const [clientesBD, setClientesBD] = useState<Array<{ id: string; nombre: string; apodo?: string; visitas?: number }>>([]);

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
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const clientesSugeridos = clientesBD.map((c) => ({
    nombre: c.nombre,
    ini: getInitials(c.nombre),
    detalle: `${c.visitas || 1} ${(c.visitas || 1) === 1 ? 'visita registrada' : 'visitas registradas'}`,
  }));

  // Formulario cobro
  const [modoLiquidacion, setModoLiquidacion] = useState<'total' | 'iguales' | 'discriminado'>('total');
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

  // KPIs
  const mesasEnJuego = mesas.filter((m) => m.estado === 'en_juego').length;
  const totalConsumo = mesas.reduce((acc, m) => acc + (m.sesion?.total_pedidos || 0), 0);
  const totalAcumulado = mesas.reduce((acc, m) => acc + (m.sesion?.total_acumulado || 0), 0);

  // Filtrado
  const mesasFiltradas = mesas.filter((m) => {
    if (filtro === 'busy') return m.estado === 'en_juego';
    if (filtro === 'free') return m.estado === 'disponible';
    if (filtro === 'warn') return m.estado === 'pausa' || (m.sesion && m.sesion.modalidad_tiempo === 'prepago');
    return true;
  });

  const formatearTiempo = (minutos: number, seg: number = 0) => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    const s = seg;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatearHoraInicio = (isoString?: string) => {
    if (!isoString) return '--:--';
    const fecha = new Date(isoString);
    if (isNaN(fecha.getTime())) return '--:--';
    return fecha.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
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

  const agregarJugadorCuenta = async (nombre?: string) => {
    const raw = typeof nombre === 'string' ? nombre : nuevoJugadorInput;
    const limpio = raw.trim();
    const nombreBase = limpio || `Cuenta ${jugadoresCuenta.length + 1}`;

    if (jugadoresCuenta.length >= 10) return;

    // Evitar duplicados exactos asignando numeración
    let nombreFinal = nombreBase;
    let contador = 2;
    while (jugadoresCuenta.some(j => j.toLowerCase() === nombreFinal.toLowerCase())) {
      nombreFinal = `${nombreBase} (${contador})`;
      contador++;
    }

    setJugadoresCuenta(prev => [...prev, nombreFinal]);
    setNuevoJugadorInput('');

    // Guardar en la base de datos de clientes si es un nombre personalizado
    if (limpio && limpio.toLowerCase() !== 'mesa') {
      try {
        const res = await guardarCliente(limpio);
        if (res?.cliente) {
          setClientesBD((prev) => {
            if (!prev.some((c) => c.nombre.toLowerCase() === limpio.toLowerCase())) {
              return [...prev, res.cliente];
            }
            return prev;
          });
        }
      } catch (e) {
        console.error('Error guardando cliente en BD:', e);
      }
    }
  };

  const eliminarJugadorCuenta = (index: number) => {
    const cuenta = jugadoresCuenta[index];
    if (cuenta === 'Mesa') return; // 'Mesa' siempre permanece fija
    setJugadoresCuenta(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmarCobro = async () => {
    if (!modalCobrar) return;
    await onCerrarMesa(modalCobrar.id, metodoPagoSeleccionado);
    setModalCobrar(null);
  };

  return (
    <div className="w-full">
      {/* 1. KPIs del turno compactos */}
      <section className="kpis">
        <div className="kpi">
          <div className="kpi-ic">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span>Mesas en juego</span>
            <b>{mesasEnJuego} / {mesas.length}</b>
          </div>
        </div>

        <div className="kpi">
          <div className="kpi-ic">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span>Horas jugadas hoy</span>
            <b>9 h 40 min</b>
          </div>
        </div>

        <div className="kpi">
          <div className="kpi-ic">
            <Beer className="w-5 h-5" />
          </div>
          <div>
            <span>Consumo en mesas</span>
            <b>${totalConsumo.toLocaleString('es-CO')}</b>
          </div>
        </div>

        <div className="kpi">
          <div className="kpi-ic">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span>Ventas del turno</span>
            <b>${(412500 + totalAcumulado).toLocaleString('es-CO')}</b>
          </div>
        </div>
      </section>

      {/* 2. Toolbar */}
      <div className="toolbar">
        <div className="tabs">
          <button
            className={`tab ${filtro === 'all' ? 'active' : ''}`}
            onClick={() => setFiltro('all')}
          >
            Todas ({mesas.length})
          </button>
          <button
            className={`tab ${filtro === 'busy' ? 'active' : ''}`}
            onClick={() => setFiltro('busy')}
          >
            <span className="sd" style={{ background: 'var(--busy)' }}></span>
            En juego ({mesasEnJuego})
          </button>
          <button
            className={`tab ${filtro === 'free' ? 'active' : ''}`}
            onClick={() => setFiltro('free')}
          >
            <span className="sd" style={{ background: 'var(--ok)' }}></span>
            Disponibles ({mesas.length - mesasEnJuego})
          </button>
          <button
            className={`tab ${filtro === 'warn' ? 'active' : ''}`}
            onClick={() => setFiltro('warn')}
          >
            <span className="sd" style={{ background: 'var(--warn)' }}></span>
            Prepago / Pausa
          </button>
        </div>

        <div className="rate">
          <Tag className="w-4 h-4 text-slate-400" />
          Tarifa 3 Bandas: <b>$18.000/h</b> · Pool: <b>$14.000/h</b>
        </div>
      </div>

      {/* 3. Grid de Mesas Compacto */}
      <section className="grid">
        {mesasFiltradas.map((mesa) => {
          const enJuego = mesa.estado === 'en_juego';
          const sesion = mesa.sesion;
          const esPrepago = sesion?.modalidad_tiempo === 'prepago';
          const cardClass = enJuego ? (esPrepago ? 'warn' : 'busy') : 'free';

          return (
            <article key={mesa.id} className={`card ${cardClass}`}>
              {/* Cabecera Compacta */}
              <div className="c-head">
                <div className="c-title min-w-0">
                  <div className="c-num">{String(mesa.numero).padStart(2, '0')}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate">Mesa {mesa.numero}</h3>
                      <BilliardTableIcon size={15} className="text-slate-400 flex-shrink-0" />
                    </div>
                    <small className="capitalize block truncate">
                      {mesa.tipo.replace('_', ' ')} · ${Number(mesa.tarifa_por_hora).toLocaleString('es-CO')}/h
                    </small>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {enJuego ? (
                    esPrepago ? (
                      <span className="pill warn">
                        <AlertTriangle className="w-3 h-3" />
                        PREPAGO
                      </span>
                    ) : (
                      <span className="pill busy">
                        <Play className="w-3 h-3 fill-current" />
                        EN JUEGO
                      </span>
                    )
                  ) : (
                    <span className="pill free">
                      <Check className="w-3 h-3" />
                      LIBRE
                    </span>
                  )}
                </div>
              </div>

              {/* Cuerpo de la tarjeta */}
              <div className="c-body">
                {enJuego && sesion ? (
                  <>
                    {/* Barra de tiempo esbelta */}
                    <div className="timer">
                      <div>
                        <label>
                          {esPrepago ? <Hourglass className="w-3 h-3" /> : <Timer className="w-3 h-3" />}
                          {esPrepago ? `Prepago · ${sesion.minutos_prepago}m` : 'Tiempo libre'}
                        </label>
                        <div className={`digits ${esPrepago ? 'warn' : ''}`}>
                          {formatearTiempo(sesion.minutos_transcurridos, segundosExtra)}
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span>Inició: <b className="text-white font-mono">{formatearHoraInicio(sesion.hora_inicio)}</b></span>
                        </div>
                      </div>
                      <div className="text-right">
                        <label className="justify-end">Costo tiempo</label>
                        <div className="font-mono font-bold text-lg text-white mt-0.5">
                          ${sesion.costo_tiempo.toLocaleString('es-CO')}
                        </div>
                      </div>
                    </div>

                    {/* Cuentas activas de la mesa */}
                    {sesion.jugadores && sesion.jugadores.length > 0 && (
                      <div>
                        <div className="sec">
                          <span><Users className="w-3 h-3" />Cuentas en mesa ({sesion.jugadores.length})</span>
                          <span className="text-[10px] text-emerald-600 font-bold">● En curso</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sesion.jugadores.map((j, idx) => {
                            const consumo = Number(j.consumo_bar || 0);
                            return (
                              <div
                                key={j.id || idx}
                                className={`player !py-1.5 !px-2.5 flex-1 min-w-[130px] ${idx === 0 ? 'lead' : ''}`}
                              >
                                <span className="ini !w-6 !h-6 !text-[10px]">
                                  {getInitials(j.nombre)}
                                </span>
                                <span className="n text-xs">
                                  {j.nombre === 'Mesa' ? 'Mesa (General)' : j.nombre}
                                </span>
                                {consumo > 0 ? (
                                  <span className="text-[11px] font-mono font-bold text-indigo-700 ml-auto">
                                    ${consumo.toLocaleString('es-CO')}
                                  </span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Desglose de cuenta */}
                    <div className="bill mt-auto">
                      <div className="row">
                        <span><Clock className="w-3.5 h-3.5" />Tiempo ({sesion.minutos_transcurridos} min)</span>
                        <span className="font-mono font-semibold">${sesion.costo_tiempo.toLocaleString('es-CO')}</span>
                      </div>
                      <div className="row">
                        <span><Beer className="w-3.5 h-3.5" />Consumo Bar</span>
                        <span className="font-mono font-semibold">${sesion.total_pedidos.toLocaleString('es-CO')}</span>
                      </div>
                      <div className="total">
                        <span>Total cuenta</span>
                        <b>${sesion.total_acumulado.toLocaleString('es-CO')}</b>
                      </div>
                    </div>
                  </>
                ) : (
                  /* ================= ESTADO DISPONIBLE COMPACTO ================= */
                  <>
                    <div className="empty-compact flex-1 justify-center">
                      <div className="empty-compact-badge">
                        <BilliardTableIcon size={24} className="text-emerald-600 flex-shrink-0" />
                        <div>
                          <h4>Mesa Lista para Juego</h4>
                          <p>Tarifa hora: <b>${Number(mesa.tarifa_por_hora).toLocaleString('es-CO')}</b> (${(Number(mesa.tarifa_por_hora)/60).toFixed(0)}/min)</p>
                        </div>
                      </div>

                      <div className="empty-compact-info">
                        <div className="empty-info-item">
                          <span>Modalidades:</span>
                          <b>Libre o Prepago</b>
                        </div>
                        <div className="empty-info-item text-right">
                          <span>Estado:</span>
                          <b className="text-emerald-600">Disponible</b>
                        </div>
                      </div>
                    </div>

                    <div className="bill mt-auto">
                      <div className="row">
                        <span><Clock className="w-3.5 h-3.5" />Cronómetro</span>
                        <span className="font-mono text-slate-400">00:00:00</span>
                      </div>
                      <div className="total">
                        <span>Tarifa base</span>
                        <b className="!text-lg !text-slate-600">${Number(mesa.tarifa_por_hora).toLocaleString('es-CO')}/h</b>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Botones de acción */}
              <div className="c-foot">
                {enJuego ? (
                  <>
                    <button className="a a-sec" onClick={() => onAbrirPedidoMesa(mesa.id)}>
                      <Plus className="w-3.5 h-3.5" />
                      Venta en mesa
                    </button>
                    <button
                      className="a a-pri"
                      onClick={() => {
                        setModalCobrar(mesa);
                        setEfectivoRecibido(mesa.sesion?.total_acumulado || 0);
                        setMetodoPagoSeleccionado('efectivo');
                      }}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Cobrar Mesa
                    </button>
                  </>
                ) : (
                  <button
                    className="a a-go"
                    onClick={() => {
                      setModalAbrir(mesa);
                      setModalidadTiempo('libre');
                      setBloquePrepago(60);
                      setJugadoresCuenta(['Mesa']);
                      setNuevoJugadorInput('');
                    }}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Iniciar Mesa
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* ================= MODALES ================= */}
      {/* 1. Modal Abrir Mesa (Diseño fiel a mockup_entorno1.html) */}
      {modalAbrir && (
        <div className="overlay show">
          <div className="modal">
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
              {/* Paso 1: Tipo de tiempo */}
              <div>
                <div className="step"><i>1</i>Tipo de tiempo</div>
                <div className="opts">
                  <button
                    className={`opt ${modalidadTiempo === 'libre' ? 'sel' : ''}`}
                    onClick={() => setModalidadTiempo('libre')}
                  >
                    <div className="oi"><Timer className="w-5 h-5" /></div>
                    <div>
                      <h4>Tiempo libre</h4>
                      <p>Cronómetro abierto. Se cobra por minuto al cerrar.</p>
                    </div>
                  </button>

                  <button
                    className={`opt ${modalidadTiempo === 'prepago' ? 'sel' : ''}`}
                    onClick={() => setModalidadTiempo('prepago')}
                  >
                    <div className="oi"><Hourglass className="w-5 h-5" /></div>
                    <div>
                      <h4>Prepago</h4>
                      <p>Bloque fijo con alerta al terminar el tiempo.</p>
                    </div>
                  </button>
                </div>

                {modalidadTiempo === 'prepago' && (
                  <div className="blocks">
                    {[
                      { mins: 30, label: '30 min', precio: `$${(Number(modalAbrir.tarifa_por_hora) * 0.5).toLocaleString('es-CO')}` },
                      { mins: 60, label: '1 hora', precio: `$${Number(modalAbrir.tarifa_por_hora).toLocaleString('es-CO')}` },
                      { mins: 120, label: '2 horas', precio: `$${(Number(modalAbrir.tarifa_por_hora) * 2).toLocaleString('es-CO')}` },
                    ].map((b) => (
                      <button
                        key={b.mins}
                        className={`blk ${bloquePrepago === b.mins ? 'sel' : ''}`}
                        onClick={() => setBloquePrepago(b.mins)}
                      >
                        {b.label}
                        <small>{b.precio}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Paso 2: Cuentas individuales para pedidos */}
              <div>
                <div className="step"><i>2</i>Cuentas individuales para pedidos (Opcional)</div>
                <div className="search">
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input
                    value={nuevoJugadorInput}
                    onChange={(e) => setNuevoJugadorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        agregarJugadorCuenta(nuevoJugadorInput);
                      }
                    }}
                    placeholder="Buscar o escribir nombre para llevar cuenta (ej: Carlos M., El Chamo)..."
                  />
                  <button
                    type="button"
                    className="btn btn-ghost select-none cursor-pointer"
                    style={{ padding: '6px 14px' }}
                    onClick={() => agregarJugadorCuenta(nuevoJugadorInput)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar
                  </button>
                </div>

                {/* Sugerencias desplegables idénticas al mockup */}
                {nuevoJugadorInput.trim().length > 0 && (
                  <div className="sugg">
                    {clientesSugeridos
                      .filter(
                        (c) =>
                          c.nombre.toLowerCase().includes(nuevoJugadorInput.toLowerCase()) &&
                          !jugadoresCuenta.includes(c.nombre)
                      )
                      .slice(0, 3)
                      .map((c, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            agregarJugadorCuenta(c.nombre);
                          }}
                        >
                          <span className="ini">{c.ini}</span>
                          <span className="font-semibold text-slate-800 text-xs">{c.nombre}</span>
                          <small>{c.detalle}</small>
                        </div>
                      ))}
                  </div>
                )}

                {/* Slots de cuentas activas */}
                <div className="slots">
                  {jugadoresCuenta.map((nombre, i) => (
                    <div
                      key={i}
                      className={`slot ${nombre === 'Mesa' ? 'bg-indigo-50/50 border-indigo-200' : ''}`}
                    >
                      <span className={`ini ${nombre === 'Mesa' ? '!bg-indigo-600 !text-white' : ''}`}>
                        {getInitials(nombre)}
                      </span>
                      <span className="truncate flex-1 text-xs font-semibold">
                        {nombre}
                        {nombre === 'Mesa' && (
                          <span className="text-[10px] text-indigo-500 font-normal ml-1">(Principal)</span>
                        )}
                      </span>
                      {nombre !== 'Mesa' && (
                        <button
                          type="button"
                          onClick={() => eliminarJugadorCuenta(i)}
                          className="ml-auto text-slate-400 hover:text-red-500 transition-colors p-0.5"
                          title="Eliminar cuenta"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {jugadoresCuenta.length < 10 && (
                    <div
                      className="slot empty-s cursor-pointer"
                      onClick={() => agregarJugadorCuenta()}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nueva cuenta</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="summary">
                <BilliardTableIcon size={18} className="text-indigo-600 flex-shrink-0" />
                <span>Al iniciar, el cronómetro de la mesa empezará a contar y podrás cargar pedidos del bar individualmente a cada cuenta.</span>
              </div>
            </div>

            <div className="m-foot">
              <button className="btn btn-ghost btn-lg" onClick={() => setModalAbrir(null)}>
                Cancelar
              </button>
              <button className="btn btn-ok btn-lg" onClick={handleConfirmarApertura}>
                <Play className="w-4 h-4 fill-white" />
                Iniciar partida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Cobrar Mesa (Diseño fiel a mockup_entorno1.html) */}
      {modalCobrar && modalCobrar.sesion && (
        <div className="overlay show">
          <div className="modal" style={{ width: 'min(780px, 94vw)' }}>
            <div className="m-head">
              <div className="c-num">{String(modalCobrar.numero).padStart(2, '0')}</div>
              <div>
                <h3>Liquidar cuenta · {modalCobrar.nombre}</h3>
                <p>
                  {modalCobrar.sesion.minutos_transcurridos} min de juego · Consumo bar: $
                  {modalCobrar.sesion.total_pedidos.toLocaleString('es-CO')} · {modalCobrar.sesion.jugadores?.length || 1} cuentas
                </p>
              </div>
              <button className="x" onClick={() => setModalCobrar(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="m-body">
              {/* Pestañas de modo de liquidación idénticas al mockup */}
              <div className="ptabs">
                <button
                  className={`ptab ${modoLiquidacion === 'total' ? 'active' : ''}`}
                  onClick={() => setModoLiquidacion('total')}
                >
                  <Users className="w-4 h-4" />
                  Pago total
                </button>
                <button
                  className={`ptab ${modoLiquidacion === 'iguales' ? 'active' : ''}`}
                  onClick={() => setModoLiquidacion('iguales')}
                >
                  <CreditCard className="w-4 h-4" />
                  Partes iguales
                </button>
                <button
                  className={`ptab ${modoLiquidacion === 'discriminado' ? 'active' : ''}`}
                  onClick={() => setModoLiquidacion('discriminado')}
                >
                  <Clock className="w-4 h-4" />
                  Discriminado
                </button>
              </div>

              {/* Vista Pago Total */}
              {modoLiquidacion === 'total' && (
                <div className="big-total">
                  <div>
                    <span className="text-sm text-slate-200">Paga una sola persona la cuenta completa</span>
                    <small className="block text-slate-300 text-xs mt-0.5">
                      Tiempo (${modalCobrar.sesion.costo_tiempo.toLocaleString('es-CO')}) + Bar ($
                      {modalCobrar.sesion.total_pedidos.toLocaleString('es-CO')})
                    </small>
                  </div>
                  <b>${modalCobrar.sesion.total_acumulado.toLocaleString('es-CO')}</b>
                </div>
              )}

              {/* Vista Partes Iguales */}
              {modoLiquidacion === 'iguales' && (
                <div className="big-total">
                  <div>
                    <span className="text-sm text-slate-200">
                      ${modalCobrar.sesion.total_acumulado.toLocaleString('es-CO')} ÷ {Math.max(1, modalCobrar.sesion.jugadores?.length || 1)} cuentas
                    </span>
                    <small className="block text-slate-300 text-xs mt-0.5">Monto por cada persona</small>
                  </div>
                  <b>
                    $
                    {Math.round(
                      modalCobrar.sesion.total_acumulado / Math.max(1, modalCobrar.sesion.jugadores?.length || 1)
                    ).toLocaleString('es-CO')}{' '}
                    c/u
                  </b>
                </div>
              )}

              {/* Vista Discriminada */}
              {modoLiquidacion === 'discriminado' && (
                <div>
                  <table className="split">
                    <thead>
                      <tr>
                        <th>Cuenta</th>
                        <th>Tiempo (fracción)</th>
                        <th>Consumo Bar</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(modalCobrar.sesion.jugadores || []).map((j, idx) => {
                        const cant = Math.max(1, modalCobrar.sesion?.jugadores?.length || 1);
                        const fraccTiempo = Math.round((modalCobrar.sesion?.costo_tiempo || 0) / cant);
                        const fraccBar =
                          typeof j.consumo_bar === 'number'
                            ? Math.round(j.consumo_bar)
                            : Math.round((modalCobrar.sesion?.total_pedidos || 0) / cant);
                        const totalJ = fraccTiempo + fraccBar;
                        return (
                          <tr key={j.id || idx}>
                            <td><b>{j.nombre === 'Mesa' ? 'Mesa (General)' : j.nombre}</b></td>
                            <td>${fraccTiempo.toLocaleString('es-CO')}</td>
                            <td>${fraccBar.toLocaleString('es-CO')}</td>
                            <td><b>${totalJ.toLocaleString('es-CO')}</b></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Medios de pago */}
              <div>
                <div className="step"><i>$</i>Medio de pago</div>
                <div className="pays">
                  {[
                    { id: 'efectivo', nombre: 'Efectivo', desc: 'Billetes/Monedas', icon: DollarSign },
                    { id: 'nequi', nombre: 'Nequi', desc: 'QR / Transferencia', icon: Smartphone },
                    { id: 'daviplata', nombre: 'Daviplata', desc: 'Transferencia', icon: Smartphone },
                    { id: 'tarjeta_debito', nombre: 'Tarjeta', desc: 'Datáfono POS', icon: CreditCard },
                  ].map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`pay ${metodoPagoSeleccionado === p.id ? 'sel' : ''}`}
                        onClick={() => setMetodoPagoSeleccionado(p.id)}
                      >
                        <Icon className="w-5 h-5 text-indigo-600" />
                        <span>{p.nombre}</span>
                        <small>{p.desc}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Caja y cálculo de vueltas para efectivo */}
              {metodoPagoSeleccionado === 'efectivo' && (
                <div>
                  <div className="cash">
                    <div className="field">
                      <label>A cobrar</label>
                      <div>${modalCobrar.sesion.total_acumulado.toLocaleString('es-CO')}</div>
                    </div>
                    <div
                      className="field transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/15 bg-white cursor-text"
                      onClick={() => {
                        const el = document.getElementById('input-efectivo-recibido') as HTMLInputElement | null;
                        if (el) el.focus();
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <label className="cursor-text">Recibido</label>
                        {efectivoRecibido > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEfectivoRecibido(0);
                              const el = document.getElementById('input-efectivo-recibido') as HTMLInputElement | null;
                              if (el) el.focus();
                            }}
                            className="text-[10px] font-semibold text-slate-400 hover:text-red-500 transition-colors"
                            title="Borrar para escribir otro valor"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        <span className="text-slate-900 font-mono font-extrabold text-[20px] select-none">$</span>
                        <input
                          id="input-efectivo-recibido"
                          type="text"
                          inputMode="numeric"
                          value={efectivoRecibido > 0 ? efectivoRecibido.toLocaleString('es-CO') : ''}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) => {
                            if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const soloPositivos = e.target.value.replace(/[^0-9]/g, '');
                            const valorNumerico = soloPositivos ? parseInt(soloPositivos, 10) : 0;
                            setEfectivoRecibido(Math.max(0, valorNumerico));
                          }}
                          placeholder="0"
                          className="w-full !mt-0"
                        />
                      </div>
                    </div>
                    <div className="field hl">
                      <label>Vueltas</label>
                      <div>
                        $
                        {Math.max(
                          0,
                          efectivoRecibido - modalCobrar.sesion.total_acumulado
                        ).toLocaleString('es-CO')}
                      </div>
                    </div>
                  </div>

                  <div className="quick flex-wrap items-center">
                    <button
                      type="button"
                      onClick={() => setEfectivoRecibido(modalCobrar.sesion?.total_acumulado || 0)}
                    >
                      Exacto
                    </button>
                    {[10000, 20000, 50000, 100000].map((b) => (
                      <button key={b} type="button" onClick={() => setEfectivoRecibido(b)}>
                        ${b.toLocaleString('es-CO')}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setEfectivoRecibido(0);
                        const el = document.getElementById('input-efectivo-recibido') as HTMLInputElement | null;
                        if (el) el.focus();
                      }}
                      className="!border-dashed !border-indigo-300 !text-indigo-600 hover:!bg-indigo-50"
                    >
                      Escribir otro valor
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="m-foot">
              <button className="btn btn-ghost btn-lg" onClick={() => window.print()}>
                <Printer className="w-4 h-4" />
                Imprimir recibo
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => setModalCobrar(null)}>
                Cancelar
              </button>
              <button className="btn btn-ok btn-lg" onClick={handleConfirmarCobro}>
                <Check className="w-4 h-4" />
                Registrar pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
