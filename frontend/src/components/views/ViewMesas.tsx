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
  Sparkles
} from 'lucide-react';
import BilliardTableIcon from '../icons/BilliardTableIcon';

interface Jugador {
  id: string;
  nombre: string;
  puntos_carambolas: number;
  posicion: number;
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
  const [jugadoresCuenta, setJugadoresCuenta] = useState<string[]>(['Jugador 1']);
  const [nuevoJugadorInput, setNuevoJugadorInput] = useState<string>('');

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

  const handleConfirmarApertura = async () => {
    if (!modalAbrir) return;
    const jugadoresLimpios = jugadoresCuenta.map(j => j.trim()).filter(j => j !== '');
    await onAbrirMesa(modalAbrir.id, {
      modalidad_tiempo: modalidadTiempo,
      minutos_prepago: modalidadTiempo === 'prepago' ? bloquePrepago : 0,
      jugadores: jugadoresLimpios.length > 0 ? jugadoresLimpios : ['General Mesa'],
    });
    setModalAbrir(null);
  };

  const agregarJugadorCuenta = (nombre: string) => {
    const limpio = nombre.trim();
    if (!limpio) return;
    if (jugadoresCuenta.length >= 6) return;
    if (!jugadoresCuenta.includes(limpio)) {
      setJugadoresCuenta([...jugadoresCuenta, limpio]);
    }
    setNuevoJugadorInput('');
  };

  const eliminarJugadorCuenta = (index: number) => {
    if (jugadoresCuenta.length <= 1) return;
    setJugadoresCuenta(jugadoresCuenta.filter((_, idx) => idx !== index));
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
                <div className="c-title">
                  <div className="c-num">{String(mesa.numero).padStart(2, '0')}</div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3>{mesa.nombre}</h3>
                      <BilliardTableIcon size={16} className="text-slate-400" />
                    </div>
                    <small className="capitalize">{mesa.tipo.replace('_', ' ')} · ${Number(mesa.tarifa_por_hora).toLocaleString('es-CO')}/h</small>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
                      </div>
                      <div className="text-right">
                        <label>Costo tiempo</label>
                        <div className="font-mono font-bold text-lg text-white">
                          ${sesion.costo_tiempo.toLocaleString('es-CO')}
                        </div>
                      </div>
                    </div>

                    {/* Lista de clientes para llevar la cuenta */}
                    {sesion.jugadores && sesion.jugadores.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="sec">
                          <span><Users className="w-3 h-3" />Cuentas individuales ({sesion.jugadores.length})</span>
                          <span>Estado</span>
                        </div>
                        <div className="players">
                          {sesion.jugadores.map((j, idx) => (
                            <div key={j.id} className={`player ${idx === 0 ? 'lead' : ''}`}>
                              <span className="ini">
                                {j.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                              <span className="n">{j.nombre}</span>
                              <span className="text-[11px] font-bold text-slate-500 ml-auto">
                                Activo
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Desglose de cuenta */}
                    <div className="bill">
                      <div className="row">
                        <span><Clock className="w-3.5 h-3.5" />Tiempo ({sesion.minutos_transcurridos} min)</span>
                        <span>${sesion.costo_tiempo.toLocaleString('es-CO')}</span>
                      </div>
                      <div className="row">
                        <span><Beer className="w-3.5 h-3.5" />Consumo Bar</span>
                        <span>${sesion.total_pedidos.toLocaleString('es-CO')}</span>
                      </div>
                      <div className="total">
                        <span>Total cuenta</span>
                        <b>${sesion.total_acumulado.toLocaleString('es-CO')}</b>
                      </div>
                    </div>
                  </>
                ) : (
                  /* ================= ESTADO DISPONIBLE COMPACTO ================= */
                  <div className="empty-compact">
                    <div className="empty-compact-badge">
                      <BilliardTableIcon size={24} className="text-emerald-600" />
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
                )}
              </div>

              {/* Botones de acción */}
              <div className="c-foot">
                {enJuego ? (
                  <>
                    <button className="a a-sec" onClick={() => onAbrirPedidoMesa(mesa.id)}>
                      <Plus className="w-3.5 h-3.5" />
                      Pedido
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

              {/* Paso 2: Cuentas individuales */}
              <div>
                <div className="step"><i>2</i>Cuentas individuales para pedidos (Opcional)</div>
                <div className="search">
                  <Users className="w-4 h-4 text-slate-400" />
                  <input
                    value={nuevoJugadorInput}
                    onChange={(e) => setNuevoJugadorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        agregarJugadorCuenta(nuevoJugadorInput);
                      }
                    }}
                    placeholder="Agregar nombre para llevar cuenta (ej: El Chamo, Carlos M.)..."
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: '6px 12px' }}
                    onClick={() => agregarJugadorCuenta(nuevoJugadorInput)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar
                  </button>
                </div>

                {/* Slots de cuentas activas */}
                <div className="slots">
                  {jugadoresCuenta.map((nombre, i) => (
                    <div key={i} className="slot">
                      <span className="ini">
                        {nombre.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="truncate">{nombre}</span>
                      {jugadoresCuenta.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarJugadorCuenta(i)}
                          className="ml-auto text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {jugadoresCuenta.length < 4 && (
                    <div
                      className="slot empty-s cursor-pointer"
                      onClick={() => agregarJugadorCuenta(`Cliente ${jugadoresCuenta.length + 1}`)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Cuenta {jugadoresCuenta.length + 1}
                    </div>
                  )}
                </div>
              </div>

              <div className="summary">
                <BilliardTableIcon size={18} className="text-indigo-600 flex-shrink-0" />
                <span>Al iniciar, el cronómetro de la mesa empezará a contar y podrás cargar pedidos a nombre de cada cuenta.</span>
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
                        const fraccBar = Math.round((modalCobrar.sesion?.total_pedidos || 0) / cant);
                        const totalJ = fraccTiempo + fraccBar;
                        return (
                          <tr key={j.id || idx}>
                            <td><b>{j.nombre}</b></td>
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
                    <div className="field">
                      <label>Recibido</label>
                      <input
                        type="number"
                        value={efectivoRecibido || ''}
                        onChange={(e) => setEfectivoRecibido(Number(e.target.value))}
                        placeholder="0"
                      />
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

                  <div className="quick">
                    <button type="button" onClick={() => setEfectivoRecibido(modalCobrar.sesion?.total_acumulado || 0)}>
                      Exacto
                    </button>
                    {[20000, 50000, 100000].map((b) => (
                      <button key={b} type="button" onClick={() => setEfectivoRecibido(b)}>
                        ${b.toLocaleString('es-CO')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="m-foot">
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
