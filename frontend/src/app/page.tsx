'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar, { ModuloId, SidebarStats } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import ModalPIN from '@/components/modals/ModalPIN';
import DrawerPedidos, { Producto, Categoria } from '@/components/drawers/DrawerPedidos';

import ViewMesas, { Mesa } from '@/components/views/ViewMesas';
import ViewPedidos from '@/components/views/ViewPedidos';
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
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCerrarMesa = async (mesaId: string, metodoPago: string) => {
    try {
      await cerrarMesa(mesaId, { metodo_pago: metodoPago });
      await cargarDatos();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleLuz = async (mesaId: string) => {
    try {
      await toggleLuzMesa(mesaId);
      await cargarDatos();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCarambola = async (jugadorId: string, delta: number) => {
    try {
      await actualizarPuntosJugador(jugadorId, delta);
      await cargarDatos();
    } catch (err: any) {
      console.error(err);
    }
  };

  // Manejadores de Canasta / Pedido
  const handleAgregarACanasta = (prodId: string, cuenta: string = 'Mesa', jugadorId?: string) => {
    const itemKey = `${prodId}:::${cuenta}`;
    setCanasta((prev) => ({
      ...prev,
      [itemKey]: {
        productoId: prodId,
        cuenta,
        cantidad: (prev[itemKey]?.cantidad || 0) + 1,
        jugadorId,
      },
    }));
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
      alert('¡Pedido enviado exitosamente!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAtenderAlerta = async (alertaId: string) => {
    try {
      await atenderAlerta(alertaId);
      await cargarDatos();
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden select-none" style={{ width: '100vw', height: '100vh' }}>
      
      {/* 1. Barra Lateral Fija */}
      <Sidebar
        moduloActivo={moduloActivo}
        onCambiarModulo={setModuloActivo}
        stats={stats}
        onBloquearTerminal={() => setModalPinAbierto(true)}
      />

      {/* 2. Área Principal */}
      <div className="main">
        
        {/* Cabecera Superior */}
        <Topbar
          moduloActivo={moduloActivo}
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
        />

        {/* Vista Activa Dinámica */}
        <main className="content">
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

    </div>
  );
}
