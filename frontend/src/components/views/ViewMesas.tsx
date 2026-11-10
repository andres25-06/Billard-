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
  luz_encendida: boolean;
  sesion?: SesionMesa | null;
}

interface ViewMesasProps {
  mesas: Mesa[];
  onAbrirMesa: (mesaId: string, data: any) => Promise<void>;
  onCerrarMesa: (mesaId: string, metodoPago: string) => Promise<void>;
  onToggleLuz: (mesaId: string) => Promise<void>;
  onCarambola: (jugadorId: string, delta: number) => Promise<void>;
  onAbrirPedidoMesa: (mesaId: string) => void;
}

export default function ViewMesas({
  mesas,
  onAbrirMesa,
  onCerrarMesa,
  onToggleLuz,
  onCarambola,
  onAbrirPedidoMesa,
}: ViewMesasProps) {
  const [filtro, setFiltro] = useState<'all' | 'busy' | 'free' | 'warn'>('all');
  const [modalAbrir, setModalAbrir] = useState<Mesa | null>(null);
  const [modalCobrar, setModalCobrar] = useState<Mesa | null>(null);

  // Formulario apertura
  const [modalidadTiempo, setModalidadTiempo] = useState<'libre' | 'prepago'>('libre');
  const [bloquePrepago, setBloquePrepago] = useState<number>(60);
  const [jugadoresApertura, setJugadoresApertura] = useState<string[]>([
    'El Chamo',
    'Carlos M.',
    'Andrés A.',
    'Jhon Jairo'
  ]);

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
    const jugadoresLimpios = jugadoresApertura.filter((j) => j.trim() !== '');
    await onAbrirMesa(modalAbrir.id, {
      modalidad_tiempo: modalidadTiempo,
      minutos_prepago: modalidadTiempo === 'prepago' ? bloquePrepago : 0,
      jugadores: jugadoresLimpios.length > 0 ? jugadoresLimpios : ['Jugador 1', 'Jugador 2'],
    });
    setModalAbrir(null);
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
                  <button
                    onClick={() => onToggleLuz(mesa.id)}
                    title={mesa.luz_encendida ? 'Luz encendida' : 'Luz apagada'}
                    className={`p-1.5 rounded-lg border transition ${
                      mesa.luz_encendida
                        ? 'bg-amber-100 border-amber-300 text-amber-700'
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                  </button>

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

                    {/* Marcador de jugadores */}
                    {sesion.jugadores && sesion.jugadores.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="sec">
                          <span><Users className="w-3 h-3" />Marcador ({sesion.jugadores.length})</span>
                          <span>Carambolas</span>
                        </div>
                        <div className="players">
                          {sesion.jugadores.map((j, idx) => (
                            <div key={j.id} className={`player ${idx === 0 ? 'lead' : ''}`}>
                              <span className="ini">
                                {j.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                              <span className="n">{j.nombre}</span>
                              <div className="flex items-center gap-1 ml-auto">
                                <span className="s">{j.puntos_carambolas}</span>
                                <div className="flex flex-col">
                                  <button
                                    onClick={() => onCarambola(j.id, 1)}
                                    className="w-4 h-3.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] flex items-center justify-center"
                                  >
                                    +
                                  </button>
                                  <button
                                    onClick={() => onCarambola(j.id, -1)}
                                    className="w-4 h-3.5 rounded bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold text-[9px] flex items-center justify-center mt-0.5"
                                  >
                                    -
                                  </button>
                                </div>
                              </div>
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
                        <span>Luz:</span>
                        <b className={mesa.luz_encendida ? 'text-amber-600' : 'text-slate-400'}>
                          {mesa.luz_encendida ? 'Encendida' : 'Apagada'}
                        </b>
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
      {/* Modal Abrir Mesa */}
      {modalAbrir && (
        <div className="overlay">
          <div className="modal">
            <div className="m-head">
              <div className="c-num">{String(modalAbrir.numero).padStart(2, '0')}</div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3>Abrir {modalAbrir.nombre}</h3>
                  <BilliardTableIcon size={18} className="text-indigo-600" />
                </div>
                <p>{modalAbrir.tipo.replace('_', ' ')} · ${Number(modalAbrir.tarifa_por_hora).toLocaleString('es-CO')} / hora</p>
              </div>
              <button className="x" onClick={() => setModalAbrir(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="m-body">
              <div>
                <div className="step"><i>1</i>Modalidad de tiempo</div>
                <div className="opts">
                  <button
                    className={`opt ${modalidadTiempo === 'libre' ? 'sel' : ''}`}
                    onClick={() => setModalidadTiempo('libre')}
                  >
                    <div className="oi"><Timer className="w-5 h-5" /></div>
                    <div>
                      <h4>Tiempo libre</h4>
                      <p>Cronómetro abierto. Se liquida por minuto al finalizar.</p>
                    </div>
                  </button>

                  <button
                    className={`opt ${modalidadTiempo === 'prepago' ? 'sel' : ''}`}
                    onClick={() => setModalidadTiempo('prepago')}
                  >
                    <div className="oi"><Hourglass className="w-5 h-5" /></div>
                    <div>
                      <h4>Tiempo prepago</h4>
                      <p>Bloque fijo de tiempo con aviso de finalización.</p>
                    </div>
                  </button>
                </div>

                {modalidadTiempo === 'prepago' && (
                  <div className="blocks">
                    {[
                      { mins: 30, precio: `$${(Number(modalAbrir.tarifa_por_hora) * 0.5).toLocaleString('es-CO')}` },
                      { mins: 60, precio: `$${Number(modalAbrir.tarifa_por_hora).toLocaleString('es-CO')}` },
                      { mins: 90, precio: `$${(Number(modalAbrir.tarifa_por_hora) * 1.5).toLocaleString('es-CO')}` },
                      { mins: 120, precio: `$${(Number(modalAbrir.tarifa_por_hora) * 2).toLocaleString('es-CO')}` },
                    ].map((b) => (
                      <button
                        key={b.mins}
                        className={`blk ${bloquePrepago === b.mins ? 'sel' : ''}`}
                        onClick={() => setBloquePrepago(b.mins)}
                      >
                        {b.mins} min
                        <small>{b.precio}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="step"><i>2</i>Jugadores asignados</div>
                <div className="slots">
                  {jugadoresApertura.map((nombre, i) => (
                    <div key={i} className="slot">
                      <span className="ini">J{i + 1}</span>
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => {
                          const copia = [...jugadoresApertura];
                          copia[i] = e.target.value;
                          setJugadoresApertura(copia);
                        }}
                        className="bg-transparent border-none outline-none text-xs font-semibold w-full text-slate-800"
                        placeholder={`Jugador ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="summary">
                <BilliardTableIcon size={18} className="text-indigo-600 flex-shrink-0" />
                <span>La luz del relé de la mesa se encenderá automáticamente y el cronómetro comenzará a contar.</span>
              </div>
            </div>

            <div className="m-foot">
              <button className="btn btn-ghost" onClick={() => setModalAbrir(null)}>
                Cancelar
              </button>
              <button className="btn btn-ok" onClick={handleConfirmarApertura}>
                <Play className="w-4 h-4 fill-white" />
                Abrir Mesa y Activar Relé
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cobrar Mesa */}
      {modalCobrar && modalCobrar.sesion && (
        <div className="overlay">
          <div className="modal" style={{ width: 'min(780px, 94vw)' }}>
            <div className="m-head">
              <div className="c-num">{String(modalCobrar.numero).padStart(2, '0')}</div>
              <div>
                <h3>Liquidar cuenta · {modalCobrar.nombre}</h3>
                <p>
                  {modalCobrar.sesion.minutos_transcurridos} min jugados · Consumo bar: $
                  {modalCobrar.sesion.total_pedidos.toLocaleString('es-CO')}
                </p>
              </div>
              <button className="x" onClick={() => setModalCobrar(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="m-body">
              <div className="big-total">
                <div>
                  <span>Total Liquidación Mesa</span>
                  <p className="text-xs text-slate-300 mt-1">
                    Tiempo (${modalCobrar.sesion.costo_tiempo.toLocaleString('es-CO')}) + Bar ($
                    {modalCobrar.sesion.total_pedidos.toLocaleString('es-CO')})
                  </p>
                </div>
                <b>${modalCobrar.sesion.total_acumulado.toLocaleString('es-CO')}</b>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                  Método de Pago
                </label>
                <div className="pays">
                  {[
                    { id: 'efectivo', nombre: 'Efectivo', desc: 'Con vuelto', icon: DollarSign },
                    { id: 'nequi', nombre: 'Nequi', desc: 'Transferencia', icon: Smartphone },
                    { id: 'daviplata', nombre: 'Daviplata', desc: 'Transferencia', icon: Smartphone },
                    { id: 'tarjeta_debito', nombre: 'Tarjeta', desc: 'Datáfono POS', icon: CreditCard },
                  ].map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
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

              {metodoPagoSeleccionado === 'efectivo' && (
                <div>
                  <div className="cash">
                    <div className="field">
                      <label>Total a pagar</label>
                      <div>${modalCobrar.sesion.total_acumulado.toLocaleString('es-CO')}</div>
                    </div>
                    <div className="field">
                      <label>Efectivo recibido</label>
                      <input
                        type="number"
                        value={efectivoRecibido || ''}
                        onChange={(e) => setEfectivoRecibido(Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="field hl">
                      <label>Cambio / Vueltas</label>
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
                    <span className="text-xs font-bold text-slate-400 self-center mr-1">Billetes:</span>
                    {[20000, 50000, 100000].map((b) => (
                      <button key={b} onClick={() => setEfectivoRecibido(b)}>
                        ${(b / 1000).toFixed(0)}k
                      </button>
                    ))}
                    <button
                      onClick={() => setEfectivoRecibido(modalCobrar.sesion?.total_acumulado || 0)}
                    >
                      Exacto
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="m-foot">
              <button className="btn btn-ghost" onClick={() => setModalCobrar(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleConfirmarCobro}>
                <Check className="w-4 h-4" />
                Confirmar Cobro e Imprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
