'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutGrid, Receipt, Package, Wallet, Trophy, Bell, Plus, ShoppingCart,
  Play, CheckCircle2, Clock, DollarSign, Lightbulb, User, X, ChevronRight,
  Beer, Sparkles, RefreshCw
} from 'lucide-react';
import {
  fetchMesas, abrirMesa, cerrarMesa, toggleLuzMesa, actualizarPuntosJugador,
  fetchCategorias, fetchProductos, crearPedido, fetchAlertasActivas, atenderAlerta
} from '@/lib/api';

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

interface Mesa {
  id: string;
  numero: number;
  nombre: string;
  tipo: string;
  tarifa_por_hora: number;
  estado: string;
  luz_encendida: boolean;
  sesion?: SesionMesa | null;
}

interface Producto {
  id: string;
  categoria_id: string;
  nombre: string;
  precio_venta: number;
  stock_actual: number;
  categoria_nombre: string;
}

interface Categoria {
  id: string;
  nombre: string;
}

interface Alerta {
  id: string;
  mesa_id: string;
  mesa_numero: number;
  mensaje: string;
  creado_el: string;
}

export default function PCControlPage() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [cargando, setCargando] = useState<boolean>(true);

  // Modales
  const [modalAbrir, setModalAbrir] = useState<Mesa | null>(null);
  const [modalCobrar, setModalCobrar] = useState<Mesa | null>(null);
  const [drawerPedidos, setDrawerPedidos] = useState<boolean>(false);
  const [mesaPedidoSeleccionada, setMesaPedidoSeleccionada] = useState<string>('');

  // Formulario apertura
  const [modalidadTiempo, setModalidadTiempo] = useState<'libre' | 'prepago'>('libre');
  const [minutosPrepago, setMinutosPrepago] = useState<number>(60);
  const [jugador1, setJugador1] = useState<string>('Jugador 1');
  const [jugador2, setJugador2] = useState<string>('Jugador 2');

  // Canasta pedidos
  const [canasta, setCanasta] = useState<{ [productoId: string]: number }>({});

  // Cargar datos
  const cargarTodo = useCallback(async () => {
    try {
      const [resMesas, resAlertas, resCats, resProds] = await Promise.all([
        fetchMesas(),
        fetchAlertasActivas(),
        fetchCategorias(),
        fetchProductos()
      ]);
      setMesas(resMesas.mesas || []);
      setAlertas(resAlertas.alertas || []);
      setCategorias(resCats.categorias || []);
      setProductos(resProds.productos || []);
    } catch (e) {
      console.error("Error al cargar datos:", e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarTodo();
    const interval = setInterval(cargarTodo, 5000); // Polling cada 5 seg
    return () => clearInterval(interval);
  }, [cargarTodo]);

  // Manejadores
  const handleAbrirMesa = async () => {
    if (!modalAbrir) return;
    try {
      await abrirMesa(modalAbrir.id, {
        modalidad_tiempo: modalidadTiempo,
        minutos_prepago: modalidadTiempo === 'prepago' ? minutosPrepago : 0,
        jugadores: [jugador1.trim() || 'Jugador 1', jugador2.trim() || 'Jugador 2']
      });
      setModalAbrir(null);
      await cargarTodo();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCerrarMesa = async (metodoPago: string) => {
    if (!modalCobrar) return;
    try {
      await cerrarMesa(modalCobrar.id, { metodo_pago: metodoPago });
      setModalCobrar(null);
      await cargarTodo();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleLuz = async (mesaId: string) => {
    try {
      await toggleLuzMesa(mesaId);
      await cargarTodo();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCarambola = async (jugadorId: string, delta: number) => {
    try {
      await actualizarPuntosJugador(jugadorId, delta);
      await cargarTodo();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAgregarACanasta = (prodId: string) => {
    setCanasta(prev => ({ ...prev, [prodId]: (prev[prodId] || 0) + 1 }));
  };

  const handleQuitarDeCanasta = (prodId: string) => {
    setCanasta(prev => {
      const nueva = { ...prev };
      if (nueva[prodId] > 1) {
        nueva[prodId] -= 1;
      } else {
        delete nueva[prodId];
      }
      return nueva;
    });
  };

  const handleEnviarPedido = async () => {
    const items = Object.entries(canasta).map(([producto_id, cantidad]) => ({
      producto_id,
      cantidad
    }));
    if (items.length === 0) {
      alert("Selecciona al menos un producto");
      return;
    }
    try {
      await crearPedido({
        mesa_id: mesaPedidoSeleccionada || undefined,
        origen: mesaPedidoSeleccionada ? 'caja' : 'barra',
        items
      });
      setCanasta({});
      setDrawerPedidos(false);
      await cargarTodo();
      alert("¡Pedido registrado exitosamente!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAtenderAlerta = async (alertaId: string) => {
    try {
      await atenderAlerta(alertaId);
      await cargarTodo();
    } catch (err: any) {
      console.error(err);
    }
  };

  // KPIs
  const mesasEnJuego = mesas.filter(m => m.estado === 'en_juego').length;
  const totalConsumoEnMesas = mesas.reduce((sum, m) => sum + (m.sesion?.total_acumulado || 0), 0);

  // Filtrado
  const mesasFiltradas = mesas.filter(m => {
    if (filtroEstado === 'en_juego') return m.estado === 'en_juego';
    if (filtroEstado === 'disponible') return m.estado === 'disponible';
    return true;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col flex-shrink-0 border-r border-slate-800">
        <div className="flex items-center gap-3 p-5 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wider">BILLAR CHAMO</h1>
            <p className="text-[11px] text-slate-400">Control · Entorno 1</p>
          </div>
        </div>

        <div className="px-5 pt-5 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Operación</div>
        <nav className="flex-1 px-3 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-600/30 text-white font-semibold text-sm border-l-2 border-indigo-400">
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
            <span>Mapa de mesas</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold">{mesasEnJuego}</span>
          </button>
          
          <button 
            onClick={() => { setDrawerPedidos(true); setMesaPedidoSeleccionada(''); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/60 transition text-sm">
            <Receipt className="w-4 h-4 text-slate-400" />
            <span>Ventas y pedidos</span>
          </button>

          <button 
            onClick={() => { setDrawerPedidos(true); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/60 transition text-sm">
            <Package className="w-4 h-4 text-slate-400" />
            <span>Inventario Bar</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold">{productos.length}</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/60 transition text-sm">
            <Wallet className="w-4 h-4 text-slate-400" />
            <span>Caja y Turno</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 flex items-center gap-3 bg-slate-900/60">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">AA</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold truncate">Andrés Ardila</h4>
            <p className="text-[10px] text-slate-400">Admin · Base Local</p>
          </div>
          <button onClick={cargarTodo} title="Recargar datos" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Topbar */}
        <header className="h-16 px-8 flex items-center gap-4 bg-white/80 backdrop-blur border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Mapa de Mesas en Vivo</h2>
            <p className="text-xs text-slate-500">PostgreSQL Local · Cronometraje y comanda activa</p>
          </div>

          <div className="ml-4 flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span>
            Red local · Base de datos activa
          </div>

          <div className="flex-1"></div>

          {/* Alerta de mesa si hay pedidos o llamados */}
          {alertas.length > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm animate-bounce">
              <Bell className="w-4 h-4 text-amber-600 bell-ring" />
              <span>{alertas[0].mensaje}</span>
              <button 
                onClick={() => handleAtenderAlerta(alertas[0].id)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold">
                Atender
              </button>
            </div>
          )}

          <button 
            onClick={() => { setDrawerPedidos(true); setMesaPedidoSeleccionada(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition">
            <ShoppingCart className="w-4 h-4" />
            Venta en Barra
          </button>
        </header>

        {/* Contenedor con scroll */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {/* KPIs */}
          <section className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Mesas en juego</span>
                <b className="block text-2xl font-bold text-slate-900">{mesasEnJuego} / {mesas.length}</b>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Tarifa Tres Bandas</span>
                <b className="block text-2xl font-bold text-slate-900">$18.000<span className="text-xs font-normal text-slate-500"> /h</span></b>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Beer className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Consumo acumulado</span>
                <b className="block text-2xl font-bold text-slate-900">${totalConsumoEnMesas.toLocaleString('es-CO')}</b>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Total Mesas Activas</span>
                <b className="block text-2xl font-bold text-slate-900">{mesasEnJuego} activas</b>
              </div>
            </div>
          </section>

          {/* Toolbar de filtros */}
          <div className="flex items-center justify-between">
            <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-sm">
              <button 
                onClick={() => setFiltroEstado('todas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filtroEstado === 'todas' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                Todas ({mesas.length})
              </button>
              <button 
                onClick={() => setFiltroEstado('en_juego')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${filtroEstado === 'en_juego' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                En juego ({mesasEnJuego})
              </button>
              <button 
                onClick={() => setFiltroEstado('disponible')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${filtroEstado === 'disponible' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Disponibles ({mesas.length - mesasEnJuego})
              </button>
            </div>
          </div>

          {/* Grid de Mesas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mesasFiltradas.map((mesa) => {
              const enJuego = mesa.estado === 'en_juego';
              const sesion = mesa.sesion;

              return (
                <div 
                  key={mesa.id}
                  className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col ${enJuego ? 'border-rose-300' : 'border-slate-200'}`}>
                  
                  {/* Barra superior de color */}
                  <div className={`h-1.5 w-full ${enJuego ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>

                  {/* Cabecera de la mesa */}
                  <div className="p-5 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-lg shadow">
                        {mesa.numero}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{mesa.nombre}</h3>
                        <p className="text-[11px] text-slate-500 capitalize">{mesa.tipo.replace('_', ' ')} · ${Number(mesa.tarifa_por_hora).toLocaleString('es-CO')}/h</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Botón Luz */}
                      <button 
                        onClick={() => handleToggleLuz(mesa.id)}
                        title={mesa.luz_encendida ? "Apagar luz de mesa" : "Encender luz de mesa"}
                        className={`p-2 rounded-lg border transition ${mesa.luz_encendida ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'}`}>
                        <Lightbulb className="w-4 h-4" />
                      </button>

                      {/* Badge Estado */}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${enJuego ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {enJuego ? 'EN JUEGO' : 'LIBRE'}
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo de la mesa */}
                  <div className="p-5 pt-1 flex-1 flex flex-col justify-between space-y-4">
                    
                    {enJuego && sesion ? (
                      <>
                        {/* Caja de Cronómetro y Costo */}
                        <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between shadow-inner">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tiempo jugado</span>
                            <div className="font-mono text-2xl font-bold text-emerald-400">
                              {Math.floor(sesion.minutos_transcurridos / 60)}h {sesion.minutos_transcurridos % 60}m
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Costo Tiempo</span>
                            <div className="font-mono text-lg font-bold text-white">
                              ${sesion.costo_tiempo.toLocaleString('es-CO')}
                            </div>
                          </div>
                        </div>

                        {/* Marcador de Jugadores */}
                        {sesion.jugadores && sesion.jugadores.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marcador carambolas</div>
                            <div className="grid grid-cols-2 gap-2">
                              {sesion.jugadores.map((j) => (
                                <div key={j.id} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                                  <div className="min-w-0 pr-2">
                                    <p className="text-xs font-semibold text-slate-800 truncate">{j.nombre}</p>
                                    <span className="font-mono text-base font-extrabold text-indigo-600">{j.puntos_carambolas}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <button 
                                      onClick={() => handleCarambola(j.id, 1)}
                                      className="w-6 h-6 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center">
                                      +
                                    </button>
                                    <button 
                                      onClick={() => handleCarambola(j.id, -1)}
                                      className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center">
                                      -
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Resumen de Cuenta */}
                        <div className="border-t border-slate-100 pt-3 space-y-1">
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Consumos (Bar):</span>
                            <b>${sesion.total_pedidos.toLocaleString('es-CO')}</b>
                          </div>
                          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                            <span>Total a pagar:</span>
                            <span className="text-base text-rose-600">${sesion.total_acumulado.toLocaleString('es-CO')}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Mesa Disponible */
                      <div className="py-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-4 bg-slate-50/50">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                        <h4 className="text-sm font-bold text-slate-800">Mesa Disponible</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Lista para iniciar nueva partida o juego de libre.</p>
                      </div>
                    )}

                    {/* Botones de pie */}
                    <div className="pt-2 flex gap-2">
                      {enJuego ? (
                        <>
                          <button 
                            onClick={() => { setMesaPedidoSeleccionada(mesa.id); setDrawerPedidos(true); }}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition">
                            <ShoppingCart className="w-3.5 h-3.5" />
                            + Pedido
                          </button>
                          <button 
                            onClick={() => setModalCobrar(mesa)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition">
                            Cobrar Mesa
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => {
                            setModalAbrir(mesa);
                            setJugador1('Jugador 1');
                            setJugador2('Jugador 2');
                            setModalidadTiempo('libre');
                          }}
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition">
                          <Play className="w-4 h-4 fill-white" />
                          INICIAR MESA
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </main>

      {/* ================= MODAL INICIAR MESA ================= */}
      {modalAbrir && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Iniciar {modalAbrir.nombre}</h3>
                <p className="text-xs text-slate-500">Tarifa: ${Number(modalAbrir.tarifa_por_hora).toLocaleString('es-CO')}/h</p>
              </div>
              <button onClick={() => setModalAbrir(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Modalidad de tiempo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setModalidadTiempo('libre')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition ${modalidadTiempo === 'libre' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                    Tiempo Libre
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Hasta que el cliente decida parar</span>
                  </button>
                  <button 
                    onClick={() => setModalidadTiempo('prepago')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition ${modalidadTiempo === 'prepago' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                    Tiempo Prepago
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Bloque fijo de minutos</span>
                  </button>
                </div>
              </div>

              {modalidadTiempo === 'prepago' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Minutos prepago</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[30, 60, 90, 120].map((mins) => (
                      <button 
                        key={mins}
                        onClick={() => setMinutosPrepago(mins)}
                        className={`py-2 rounded-lg text-xs font-bold border ${minutosPrepago === mins ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Jugadores en Mesa</label>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={jugador1} 
                    onChange={e => setJugador1(e.target.value)}
                    placeholder="Jugador 1"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                  />
                  <input 
                    type="text" 
                    value={jugador2} 
                    onChange={e => setJugador2(e.target.value)}
                    placeholder="Jugador 2"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button 
                onClick={() => setModalAbrir(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition">
                Cancelar
              </button>
              <button 
                onClick={handleAbrirMesa}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow transition">
                Abrir Mesa y Encender Luz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL COBRAR MESA ================= */}
      {modalCobrar && modalCobrar.sesion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Cobro · {modalCobrar.nombre}</h3>
                <p className="text-xs text-slate-500">Tiempo total: {modalCobrar.sesion.minutos_transcurridos} minutos</p>
              </div>
              <button onClick={() => setModalCobrar(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Costo por tiempo:</span>
                  <b>${modalCobrar.sesion.costo_tiempo.toLocaleString('es-CO')}</b>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Consumos bar:</span>
                  <b>${modalCobrar.sesion.total_pedidos.toLocaleString('es-CO')}</b>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-extrabold text-slate-900">
                  <span>Total a Liquidar:</span>
                  <span className="text-indigo-600">${modalCobrar.sesion.total_acumulado.toLocaleString('es-CO')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Método de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {['efectivo', 'nequi', 'daviplata', 'tarjeta_debito'].map((metodo) => (
                    <button 
                      key={metodo}
                      onClick={() => handleCerrarMesa(metodo)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 text-xs font-bold capitalize text-slate-800 transition text-center">
                      {metodo.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setModalCobrar(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition">
                Cerrar sin cobrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DRAWER PEDIDOS Y VENTAS ================= */}
      {drawerPedidos && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Registrar Pedido / Venta</h3>
                <p className="text-xs text-slate-500">Selecciona los productos y la mesa</p>
              </div>
              <button onClick={() => setDrawerPedidos(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Asignar mesa */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-500 uppercase">Cargar a:</span>
              <button 
                onClick={() => setMesaPedidoSeleccionada('')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${mesaPedidoSeleccionada === '' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-700'}`}>
                Venta en Barra
              </button>
              {mesas.filter(m => m.estado === 'en_juego').map(m => (
                <button 
                  key={m.id}
                  onClick={() => setMesaPedidoSeleccionada(m.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${mesaPedidoSeleccionada === m.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-700'}`}>
                  Mesa {m.numero}
                </button>
              ))}
            </div>

            {/* Filtro Categorías */}
            <div className="p-3 flex gap-2 border-b border-slate-100 overflow-x-auto">
              <button 
                onClick={() => setCategoriaSeleccionada('')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${categoriaSeleccionada === '' ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}>
                Todos
              </button>
              {categorias.map(c => (
                <button 
                  key={c.id}
                  onClick={() => setCategoriaSeleccionada(c.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${categoriaSeleccionada === c.id ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}>
                  {c.nombre}
                </button>
              ))}
            </div>

            {/* Grid de Productos */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
              {productos
                .filter(p => !categoriaSeleccionada || p.categoria_id === categoriaSeleccionada)
                .map(prod => (
                  <div key={prod.id} className="p-3 border border-slate-200 rounded-xl flex flex-col justify-between hover:border-indigo-400 transition">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{prod.nombre}</h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">${Number(prod.precio_venta).toLocaleString('es-CO')}</p>
                      <span className="text-[10px] text-slate-400">Stock: {prod.stock_actual}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600">
                        {canasta[prod.id] ? `x${canasta[prod.id]}` : ''}
                      </span>
                      <div className="flex gap-1">
                        {canasta[prod.id] && (
                          <button 
                            onClick={() => handleQuitarDeCanasta(prod.id)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center">
                            -
                          </button>
                        )}
                        <button 
                          onClick={() => handleAgregarACanasta(prod.id)}
                          className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center">
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Pie de Canasta y Enviar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-600">Items en pedido:</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {Object.values(canasta).reduce((a, b) => a + b, 0)} unidades
                </span>
              </div>
              <button 
                onClick={handleEnviarPedido}
                disabled={Object.keys(canasta).length === 0}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow transition flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Confirmar y Despachar Pedido
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
