'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar, { ModuloId, SidebarStats } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import ModalPIN from '@/components/modals/ModalPIN';
import DrawerPedidos, { Producto, Categoria } from '@/components/drawers/DrawerPedidos';

import ViewMesas, { Mesa } from '@/components/views/ViewMesas';
import ViewPedidos from '@/components/views/ViewPedidos';
import ViewJugadores from '@/components/views/ViewJugadores';
import ViewInventario from '@/components/views/ViewInventario';
import ViewCaja from '@/components/views/ViewCaja';
import ViewTorneos from '@/components/views/ViewTorneos';
import ViewReportes from '@/components/views/ViewReportes';
import ViewConfiguracion from '@/components/views/ViewConfiguracion';

import {
  fetchMesas,
  abrirMesa,
  cerrarMesa,
  toggleLuzMesa,
  actualizarPuntosJugador,
  fetchCategorias,
  fetchProductos,
  crearPedido,
  fetchAlertasActivas,
  atenderAlerta,
  fetchSidebarStats,
  fetchTurnoActivo,
  abrirTurnoCaja,
} from '@/lib/api';

export interface ItemPedidoCanasta {
  productoId: string;
  cuenta: string;
  cantidad: number;
  jugadorId?: string;
}

export default function PCControlPage() {
  const [moduloActivo, setModuloActivo] = useState<ModuloId>('mesas');
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [alertas, setAlertas] = useState<Array<{ id: string; mensaje: string }>>([]);

  // Estadísticas del sidebar
  const [stats, setStats] = useState<SidebarStats>({
    mesas_en_juego: 0,
    pedidos_pendientes: 0,
    stock_bajo: 0,
    caja_abierta: false,
    alertas: 0,
  });

  // Drawer de Pedidos
  const [drawerPedidos, setDrawerPedidos] = useState<boolean>(false);
  const [mesaPedidoSeleccionada, setMesaPedidoSeleccionada] = useState<string>('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');
  const [canasta, setCanasta] = useState<{ [itemKey: string]: ItemPedidoCanasta }>({});

  // Modal PIN
  const [modalPinAbierto, setModalPinAbierto] = useState<boolean>(false);

  // Modal de notificación elegante (reemplaza alert nativo)
  const [modalNotificacion, setModalNotificacion] = useState<{ titulo: string; mensaje: string } | null>(null);

  useEffect(() => {
    if (!modalNotificacion) return;
    const timer = setTimeout(() => setModalNotificacion(null), 6000);
    return () => clearTimeout(timer);
  }, [modalNotificacion]);

  // Modal Apertura de Caja Obligatoria al iniciar sesión
  const [requiereAperturaCaja, setRequiereAperturaCaja] = useState<boolean>(false);
  const [baseInicialDia, setBaseInicialDia] = useState<number>(100000);
  const [abriendoCajaDia, setAbriendoCajaDia] = useState<boolean>(false);

  useEffect(() => {
    fetchTurnoActivo()
      .then((res) => {
        if (!res.turno) {
          setRequiereAperturaCaja(true);
        }
      })
      .catch((err) => console.error('Error verificando turno activo:', err));
  }, []);

  const handleConfirmarAperturaDia = async () => {
    if (baseInicialDia < 0) return;
    try {
      setAbriendoCajaDia(true);
      await abrirTurnoCaja(baseInicialDia);
      setRequiereAperturaCaja(false);
      await cargarDatos();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('billard_chamo_pedidos_actualizados'));
      }
    } catch (e: any) {
      alert(e.message || 'Error al abrir turno de caja');
    } finally {
      setAbriendoCajaDia(false);
    }
  };

  // Carga de datos
  const cargarDatos = useCallback(async () => {
    try {
      const [resMesas, resAlertas, resCats, resProds, resStats] = await Promise.all([
        fetchMesas(),
        fetchAlertasActivas(),
        fetchCategorias(),
        fetchProductos(),
        fetchSidebarStats(),
      ]);

      setMesas(resMesas.mesas || []);
      setAlertas(resAlertas.alertas || []);
      setCategorias(resCats.categorias || []);
      setProductos(resProds.productos || []);
      if (resStats) setStats(resStats);
    } catch (e) {
      console.error('Error al sincronizar datos:', e);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 4000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  // Manejadores de Mesas
  const handleAbrirMesa = async (mesaId: string, data: any) => {
    try {
      await abrirMesa(mesaId, data);
      await cargarDatos();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('billard_chamo_pedidos_actualizados'));
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCerrarMesa = async (mesaId: string, metodoPago: string) => {
    try {
      await cerrarMesa(mesaId, { metodo_pago: metodoPago });
      await cargarDatos();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('billard_chamo_pedidos_actualizados'));
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleLuz = async (mesaId: string) => {
    try {
      await toggleLuzMesa(mesaId);
      await cargarDatos();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('billard_chamo_pedidos_actualizados'));
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCarambola = async (jugadorId: string, delta: number) => {
    try {
      await actualizarPuntosJugador(jugadorId, delta);
      await cargarDatos();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('billard_chamo_pedidos_actualizados'));
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Manejadores de Canasta / Pedido
  const handleAgregarACanasta = (prodId: string, cuenta: string = 'Mesa', jugadorId?: string) => {
    const prod = productos.find((p) => p.id === prodId);
    const itemKey = `${prodId}:::${cuenta}`;
    setCanasta((prev) => {
      const totalEnCanasta = Object.values(prev)
        .filter((i) => i.productoId === prodId)
        .reduce((acc, i) => acc + i.cantidad, 0);
      if (prod && totalEnCanasta >= prod.stock_actual) {
        return prev;
      }
      return {
        ...prev,
        [itemKey]: {
          productoId: prodId,
          cuenta,
          cantidad: (prev[itemKey]?.cantidad || 0) + 1,
          jugadorId,
        },
      };
    });
  };

  const handleQuitarDeCanasta = (itemKey: string) => {
    setCanasta((prev) => {
      const copy = { ...prev };
      if (!copy[itemKey]) return copy;
      if (copy[itemKey].cantidad > 1) {
        copy[itemKey] = {
          ...copy[itemKey],
          cantidad: copy[itemKey].cantidad - 1,
        };
      } else {
        delete copy[itemKey];
      }
      return copy;
    });
  };

  const handleEliminarItemCanasta = (itemKey: string) => {
    setCanasta((prev) => {
      const copy = { ...prev };
      delete copy[itemKey];
      return copy;
    });
  };

  const handleEnviarPedido = async () => {
    const items = Object.values(canasta).map((item) => ({
      producto_id: item.productoId,
      cantidad: item.cantidad,
      nota: item.cuenta ? `Cuenta: ${item.cuenta}` : undefined,
      jugador_id: item.jugadorId,
    }));
    if (items.length === 0) return;

    try {
      await crearPedido({
        mesa_id: mesaPedidoSeleccionada || undefined,
        origen: mesaPedidoSeleccionada ? 'caja' : 'barra',
        items,
      });
      setCanasta({});
      setDrawerPedidos(false);
      await cargarDatos();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('billard_chamo_pedidos_actualizados'));
      }
      setModalNotificacion({
        titulo: '¡Pedido Enviado!',
        mensaje: 'La comanda fue cargada y despachada correctamente.',
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAtenderAlerta = async (alertaId: string) => {
    try {
      await atenderAlerta(alertaId);
      await cargarDatos();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('billard_chamo_pedidos_actualizados'));
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="w-screen h-screen m-0 p-0 flex flex-row overflow-hidden bg-transparent">
      {/* 1. Menú lateral izquierdo con el diseño exacto de Billar Club */}
      <Sidebar
        moduloActivo={moduloActivo}
        onCambiarModulo={setModuloActivo}
        stats={stats}
        onBloquearTerminal={() => setModalPinAbierto(true)}
      />

      {/* 2. Área Principal de Contenido */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
        {/* Cabecera Superior limpia con título del módulo y acciones */}
        <Topbar
          moduloActivo={moduloActivo}
          onCambiarModulo={setModuloActivo}
          alertas={alertas}
          onAtenderAlerta={handleAtenderAlerta}
          onVentaMesa={() => {
            const primeraEnJuego = mesas.find((m) => m.estado === 'en_juego') || mesas[0];
            setMesaPedidoSeleccionada(primeraEnJuego ? primeraEnJuego.id : '');
            setDrawerPedidos(true);
          }}
          onVentaBarra={() => {
            setMesaPedidoSeleccionada('');
            setDrawerPedidos(true);
          }}
          onBloquearTerminal={() => setModalPinAbierto(true)}
          cajaAbierta={stats.caja_abierta}
        />

        {/* Vista Activa Dinámica con scroll vertical habilitado */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 h-[calc(100vh-65px)]">
          {moduloActivo === 'mesas' && (
            <ViewMesas
              mesas={mesas}
              onAbrirMesa={handleAbrirMesa}
              onCerrarMesa={handleCerrarMesa}
              onAbrirPedidoMesa={(mesaId) => {
                setMesaPedidoSeleccionada(mesaId);
                setDrawerPedidos(true);
              }}
            />
          )}

          {moduloActivo === 'pedidos' && <ViewPedidos />}
          {moduloActivo === 'jugadores' && <ViewJugadores />}
          {moduloActivo === 'inventario' && <ViewInventario />}
          {moduloActivo === 'caja' && <ViewCaja />}
          {moduloActivo === 'torneos' && <ViewTorneos />}
          {moduloActivo === 'reportes' && <ViewReportes />}
          {moduloActivo === 'configuracion' && <ViewConfiguracion />}
        </main>
      </div>

      {/* 3. Drawer Lateral de Pedidos */}
      <DrawerPedidos
        abierto={drawerPedidos}
        onCerrar={() => setDrawerPedidos(false)}
        mesas={mesas}
        categorias={categorias}
        productos={productos}
        mesaSeleccionada={mesaPedidoSeleccionada}
        onSeleccionarMesa={setMesaPedidoSeleccionada}
        categoriaSeleccionada={categoriaSeleccionada}
        onSeleccionarCategoria={setCategoriaSeleccionada}
        canasta={canasta}
        onAgregarACanasta={handleAgregarACanasta}
        onQuitarDeCanasta={handleQuitarDeCanasta}
        onEliminarItemCanasta={handleEliminarItemCanasta}
        onEnviarPedido={handleEnviarPedido}
      />

      {/* 4. Modal PIN de Bloqueo */}
      <ModalPIN
        abierto={modalPinAbierto}
        onCerrar={() => setModalPinAbierto(false)}
        onExito={() => setModalPinAbierto(false)}
      />

      {/* Modal de Confirmación / Notificación */}
      {modalNotificacion && (
        <div
          onClick={() => setModalNotificacion(null)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 cursor-pointer font-['Urbanist',sans-serif]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-3xl p-6 border border-slate-300 shadow-2xl text-center cursor-default"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#184A35] text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#184A35]/20">
              <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="font-black text-lg text-[#28353E]">{modalNotificacion.titulo}</h4>
            <p className="text-xs font-semibold text-slate-500 mt-1">{modalNotificacion.mensaje}</p>
            <button
              type="button"
              onClick={() => setModalNotificacion(null)}
              className="w-full mt-5 py-2.5 rounded-xl bg-[#184A35] hover:bg-[#123828] text-white font-black text-xs cursor-pointer transition-all"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* 5. Modal Obligatorio de Apertura de Caja (Primer Inicio del Día) */}
      {requiereAperturaCaja && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 font-['Urbanist',sans-serif] select-none">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-300 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#184A35] text-white flex items-center justify-center mx-auto mb-4 shadow-md">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
            </div>

            <span className="text-[10px] font-black tracking-widest text-[#184A35] uppercase bg-[#184A35]/10 px-3 py-1 rounded-full">
              Inicio de Jornada · Caja Cerrada
            </span>

            <h3 className="font-black text-2xl text-[#28353E] mt-3">
              Apertura de Caja del Día
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Registra el dinero base físico en cajón para comenzar a operar. Esta base quedará fija hasta el cierre y arqueo de turno.
            </p>

            <div className="mt-5 p-4 bg-[#EDF2F7] rounded-2xl border border-slate-300/80 text-left">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block mb-2">
                Base Inicial en Efectivo (COP)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 font-mono font-black text-lg text-slate-400">$</span>
                <input
                  type="number"
                  value={baseInicialDia || ''}
                  onChange={(e) => setBaseInicialDia(Number(e.target.value))}
                  placeholder="100000"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xl font-mono font-black text-[#28353E] focus:outline-none focus:ring-2 focus:ring-[#184A35]"
                />
              </div>

              <div className="flex items-center gap-2 mt-2.5">
                {[50000, 100000, 200000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBaseInicialDia(preset)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      baseInicialDia === preset
                        ? 'bg-[#184A35] text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    ${preset.toLocaleString('es-CO')}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleConfirmarAperturaDia}
              disabled={abriendoCajaDia || baseInicialDia < 0}
              className="w-full mt-5 py-3.5 rounded-2xl bg-[#184A35] hover:bg-[#123828] text-white font-black text-sm shadow-lg shadow-[#184A35]/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {abriendoCajaDia ? 'Iniciando Turno...' : 'Confirmar Base e Iniciar Turno'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
