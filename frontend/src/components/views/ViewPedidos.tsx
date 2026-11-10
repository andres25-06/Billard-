'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Trash2,
  X,
  Plus,
  Minus,
  Save,
  Printer,
  Beer,
  CreditCard,
  Check,
  ChevronRight,
  UserCheck,
  Lock,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  Search,
} from 'lucide-react';
import { eliminarPedido, editarPedido, fetchProductos } from '@/lib/api';

export interface VentaItem {
  id: string;
  producto_id?: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  nota?: string;
  jugador_id?: string;
}

export interface VentaRegistro {
  id: string;
  codigo_pedido: string;
  mesa_numero?: number;
  mesa_tipo?: string;
  deportista: string;
  origen: string;
  estado_cobro: 'pendiente' | 'pagado';
  metodo_pago?: string;
  total_pedido: number;
  solicitado_el: string;
  hora_registro?: string;
  nota?: string;
  items: VentaItem[];
}

const PRODUCTOS_CATALOGO_DEMO = [
  { id: 'p-1', nombre: 'Cerveza Poker 330ml', precio_venta: 4500, categoria: 'Cervezas' },
  { id: 'p-2', nombre: 'Club Colombia Dorada', precio_venta: 5500, categoria: 'Cervezas' },
  { id: 'p-3', nombre: 'Cerveza Águila Light', precio_venta: 4500, categoria: 'Cervezas' },
  { id: 'p-4', nombre: 'Coronita 210ml', precio_venta: 7000, categoria: 'Cervezas' },
  { id: 'p-5', nombre: 'Media Aguardiente', precio_venta: 48000, categoria: 'Licores' },
  { id: 'p-7', nombre: 'Coca-Cola 400ml', precio_venta: 4000, categoria: 'Bebidas' },
  { id: 'p-8', nombre: 'Agua Cristal 600ml', precio_venta: 3000, categoria: 'Bebidas' },
  { id: 'p-9', nombre: 'Red Bull Energizante', precio_venta: 9500, categoria: 'Bebidas' },
  { id: 'p-10', nombre: 'Empanada de Carne', precio_venta: 3500, categoria: 'Snacks' },
  { id: 'p-11', nombre: 'Papas Margarita', precio_venta: 4500, categoria: 'Snacks' },
];

export const DEPORTISTAS_REGISTRADOS = [
  'Carlos M.',
  'Andrés R.',
  'Mauricio T.',
  'Juan Pérez',
  'Jorge L.',
  'Mesa (General)',
];

const VENTAS_INICIALES: VentaRegistro[] = [
  {
    id: 'vta-1',
    codigo_pedido: 'VTA-0041',
    mesa_numero: 1,
    mesa_tipo: '3 Bandas',
    deportista: 'Carlos M.',
    origen: 'Deportista · Mesa 1',
    estado_cobro: 'pendiente',
    total_pedido: 29000,
    solicitado_el: new Date(Date.now() - 8 * 60000).toISOString(),
    hora_registro: '05:42 PM',
    items: [
      {
        id: 'it-101',
        producto_id: 'p-1',
        producto_nombre: 'Cerveza Poker 330ml',
        cantidad: 4,
        precio_unitario: 4500,
        subtotal: 18000,
        nota: 'Carlos M.',
      },
      {
        id: 'it-102',
        producto_id: 'p-2',
        producto_nombre: 'Club Colombia Dorada',
        cantidad: 2,
        precio_unitario: 5500,
        subtotal: 11000,
        nota: 'Carlos M.',
      },
    ],
  },
  {
    id: 'vta-2',
    codigo_pedido: 'VTA-0040',
    deportista: 'Juan Pérez (Barra)',
    origen: 'Venta en Barra',
    estado_cobro: 'pendiente',
    total_pedido: 18500,
    solicitado_el: new Date(Date.now() - 16 * 60000).toISOString(),
    hora_registro: '05:31 PM',
    items: [
      {
        id: 'it-201',
        producto_id: 'p-4',
        producto_nombre: 'Coronita 210ml',
        cantidad: 2,
        precio_unitario: 7000,
        subtotal: 14000,
        nota: 'Juan Pérez (Barra)',
      },
      {
        id: 'it-202',
        producto_id: 'p-11',
        producto_nombre: 'Papas Margarita',
        cantidad: 1,
        precio_unitario: 4500,
        subtotal: 4500,
        nota: 'Juan Pérez (Barra)',
      },
    ],
  },
  {
    id: 'vta-3',
    codigo_pedido: 'VTA-0039',
    mesa_numero: 3,
    mesa_tipo: 'Pool',
    deportista: 'Mauricio T.',
    origen: 'Deportista · Mesa 3',
    estado_cobro: 'pendiente',
    total_pedido: 66000,
    solicitado_el: new Date(Date.now() - 32 * 60000).toISOString(),
    hora_registro: '05:14 PM',
    items: [
      {
        id: 'it-301',
        producto_id: 'p-5',
        producto_nombre: 'Media Aguardiente',
        cantidad: 1,
        precio_unitario: 48000,
        subtotal: 48000,
        nota: 'Mauricio T.',
      },
      {
        id: 'it-302',
        producto_id: 'p-3',
        producto_nombre: 'Cerveza Águila Light',
        cantidad: 4,
        precio_unitario: 4500,
        subtotal: 18000,
        nota: 'Mauricio T.',
      },
    ],
  },
  {
    id: 'vta-4',
    codigo_pedido: 'VTA-0038',
    mesa_numero: 1,
    mesa_tipo: '3 Bandas',
    deportista: 'Andrés R.',
    origen: 'Deportista · Mesa 1',
    estado_cobro: 'pagado',
    metodo_pago: 'Efectivo',
    total_pedido: 21500,
    solicitado_el: new Date(Date.now() - 48 * 60000).toISOString(),
    hora_registro: '04:58 PM',
    items: [
      {
        id: 'it-401',
        producto_id: 'p-1',
        producto_nombre: 'Cerveza Poker 330ml',
        cantidad: 4,
        precio_unitario: 4500,
        subtotal: 18000,
        nota: 'Andrés R.',
      },
      {
        id: 'it-402',
        producto_id: 'p-10',
        producto_nombre: 'Empanada de Carne',
        cantidad: 1,
        precio_unitario: 3500,
        subtotal: 3500,
        nota: 'Andrés R.',
      },
    ],
  },
  {
    id: 'vta-5',
    codigo_pedido: 'VTA-0037',
    deportista: 'Mostrador Barra',
    origen: 'Venta en Barra',
    estado_cobro: 'pagado',
    metodo_pago: 'Nequi',
    total_pedido: 13500,
    solicitado_el: new Date(Date.now() - 65 * 60000).toISOString(),
    hora_registro: '04:40 PM',
    items: [
      {
        id: 'it-501',
        producto_id: 'p-9',
        producto_nombre: 'Red Bull Energizante',
        cantidad: 1,
        precio_unitario: 9500,
        subtotal: 9500,
        nota: 'Mostrador Barra',
      },
      {
        id: 'it-502',
        producto_id: 'p-7',
        producto_nombre: 'Coca-Cola 400ml',
        cantidad: 1,
        precio_unitario: 4000,
        subtotal: 4000,
        nota: 'Mostrador Barra',
      },
    ],
  },
  {
    id: 'vta-6',
    codigo_pedido: 'VTA-0036',
    mesa_numero: 2,
    mesa_tipo: '3 Bandas',
    deportista: 'Jorge L.',
    origen: 'Deportista · Mesa 2',
    estado_cobro: 'pagado',
    metodo_pago: 'Daviplata',
    total_pedido: 22000,
    solicitado_el: new Date(Date.now() - 85 * 60000).toISOString(),
    hora_registro: '04:20 PM',
    items: [
      {
        id: 'it-601',
        producto_id: 'p-2',
        producto_nombre: 'Club Colombia Dorada',
        cantidad: 4,
        precio_unitario: 5500,
        subtotal: 22000,
        nota: 'Jorge L.',
      },
    ],
  },
];

export default function ViewPedidos() {
  const [ventas, setVentas] = useState<VentaRegistro[]>(VENTAS_INICIALES);
  const [filtro, setFiltro] = useState<'todas' | 'por_cobrar' | 'pagadas' | 'deportistas' | 'barra'>(
    'todas'
  );
  const [busqueda, setBusqueda] = useState<string>('');

  // Catálogo para tarjetas de selección en Pedido
  const [productosDisponibles, setProductosDisponibles] = useState<
    Array<{ id: string; nombre: string; precio_venta: number; categoria?: string }>
  >(PRODUCTOS_CATALOGO_DEMO);

  // Tarjeta seleccionada -> Abre el modal con 3 pestañas: Pedido (primera), Detalle, Cobrar
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaRegistro | null>(null);
  const [vistaModal, setVistaModal] = useState<'pedido' | 'detalle' | 'cobrar'>('pedido');
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Todos');

  // Estado de productos en cuenta dentro de la pestaña Pedido
  const [itemsEdicion, setItemsEdicion] = useState<
    Array<{
      producto_id: string;
      nombre: string;
      cantidad: number;
      precio_unitario: number;
      nota?: string;
    }>
  >([]);
  const [guardandoEdicion, setGuardandoEdicion] = useState<boolean>(false);

  // Estado de Cobro dentro del modal
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<string>('Efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(0);

  useEffect(() => {
    fetchProductos()
      .then((data) => {
        if (data?.productos && data.productos.length > 0) {
          setProductosDisponibles(data.productos);
        }
      })
      .catch(() => {});
  }, []);

  // Indicadores superiores (KPIs de valor)
  const kpis = useMemo(() => {
    const porCobrar = ventas.filter((v) => v.estado_cobro === 'pendiente');
    const pagadas = ventas.filter((v) => v.estado_cobro === 'pagado');
    const deportistas = ventas.filter((v) => Boolean(v.mesa_numero));
    const barra = ventas.filter((v) => !v.mesa_numero);

    const totalVendido = ventas.reduce((acc, v) => acc + Number(v.total_pedido || 0), 0);
    const totalPorCobrar = porCobrar.reduce((acc, v) => acc + Number(v.total_pedido || 0), 0);
    const totalRecaudado = pagadas.reduce((acc, v) => acc + Number(v.total_pedido || 0), 0);
    const totalDeportistas = deportistas.reduce((acc, v) => acc + Number(v.total_pedido || 0), 0);
    const totalBarra = barra.reduce((acc, v) => acc + Number(v.total_pedido || 0), 0);
    const totalUnidades = ventas.reduce(
      (acc, v) => acc + (v.items || []).reduce((s, it) => s + Number(it.cantidad || 0), 0),
      0
    );

    return {
      totalVendido,
      totalPorCobrar,
      porCobrarCount: porCobrar.length,
      totalRecaudado,
      pagadasCount: pagadas.length,
      totalDeportistas,
      deportistasCount: deportistas.length,
      totalBarra,
      barraCount: barra.length,
      totalUnidades,
    };
  }, [ventas]);

  // Filtrado de tarjetas
  const ventasFiltradas = useMemo(() => {
    return ventas.filter((v) => {
      if (filtro === 'por_cobrar' && v.estado_cobro !== 'pendiente') return false;
      if (filtro === 'pagadas' && v.estado_cobro !== 'pagado') return false;
      if (filtro === 'deportistas' && !v.mesa_numero) return false;
      if (filtro === 'barra' && Boolean(v.mesa_numero)) return false;

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const matchCodigo = v.codigo_pedido.toLowerCase().includes(q);
        const matchDeportista = v.deportista.toLowerCase().includes(q);
        const matchMesa = v.mesa_numero ? `mesa ${v.mesa_numero}`.includes(q) : 'barra'.includes(q);
        const matchProd = v.items.some((it) =>
          it.producto_nombre.toLowerCase().includes(q)
        );
        return matchCodigo || matchDeportista || matchMesa || matchProd;
      }

      return true;
    });
  }, [ventas, filtro, busqueda]);

  // Al hacer clic en la tarjeta -> Abrir modal mostrando primero 'pedido'
  const handleAbrirTarjeta = (venta: VentaRegistro) => {
    setVentaSeleccionada(venta);
    setVistaModal('pedido');
    setCategoriaActiva('Todos');
    setMetodoPagoSeleccionado(venta.metodo_pago || 'Efectivo');
    setEfectivoRecibido(Number(venta.total_pedido));
    setItemsEdicion(
      venta.items.map((it) => ({
        producto_id: it.producto_id || it.id,
        nombre: it.producto_nombre,
        cantidad: it.cantidad,
        precio_unitario: Number(it.precio_unitario),
        nota: venta.deportista,
      }))
    );
  };

  // Clic en tarjeta de producto (izquierda) -> Lo suma a los productos en cuenta (derecha)
  const handleSeleccionarTarjetaProducto = (prod: {
    id: string;
    nombre: string;
    precio_venta: number;
  }) => {
    if (!ventaSeleccionada) return;
    const deportistaFijo = ventaSeleccionada.deportista;

    setItemsEdicion((prev) => {
      const existente = prev.find((it) => it.producto_id === prod.id);
      if (existente) {
        return prev.map((it) =>
          it.producto_id === prod.id ? { ...it, cantidad: it.cantidad + 1 } : it
        );
      }
      return [
        ...prev,
        {
          producto_id: prod.id,
          nombre: prod.nombre,
          cantidad: 1,
          precio_unitario: Number(prod.precio_venta),
          nota: deportistaFijo,
        },
      ];
    });
  };

  const handleModificarCantidad = (index: number, delta: number) => {
    setItemsEdicion((prev) => {
      const nuevo = [...prev];
      const item = nuevo[index];
      const nuevaCantidad = item.cantidad + delta;
      if (nuevaCantidad <= 0) {
        return nuevo.filter((_, idx) => idx !== index);
      }
      nuevo[index] = { ...item, cantidad: nuevaCantidad };
      return nuevo;
    });
  };

  const handleEliminarItemEdicion = (index: number) => {
    setItemsEdicion((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleGuardarPedido = async () => {
    if (!ventaSeleccionada) return;
    if (itemsEdicion.length === 0) {
      alert('La cuenta debe tener al menos un producto.');
      return;
    }

    setGuardandoEdicion(true);
    const nuevoTotal = itemsEdicion.reduce(
      (sum, it) => sum + it.precio_unitario * it.cantidad,
      0
    );

    const nuevosItems: VentaItem[] = itemsEdicion.map((it, idx) => ({
      id: `${ventaSeleccionada.id}-it-${idx}`,
      producto_id: it.producto_id,
      producto_nombre: it.nombre,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
      subtotal: it.precio_unitario * it.cantidad,
      nota: ventaSeleccionada.deportista,
    }));

    const ventaActualizada: VentaRegistro = {
      ...ventaSeleccionada,
      total_pedido: nuevoTotal,
      items: nuevosItems,
    };

    setVentas((prev) =>
      prev.map((v) => (v.id === ventaSeleccionada.id ? ventaActualizada : v))
    );
    setVentaSeleccionada(ventaActualizada);
    setEfectivoRecibido(nuevoTotal);

    if (!ventaSeleccionada.id.startsWith('vta-')) {
      try {
        await editarPedido(ventaSeleccionada.id, {
          items: itemsEdicion.map((it) => ({
            producto_id: it.producto_id,
            cantidad: it.cantidad,
            nota: ventaSeleccionada.deportista,
          })),
          nota: ventaSeleccionada.nota,
          estado: 'servido',
        });
      } catch {}
    }

    setGuardandoEdicion(false);
    setVistaModal('detalle');
  };

  const handleConfirmarCobro = () => {
    if (!ventaSeleccionada) return;
    const actualizada: VentaRegistro = {
      ...ventaSeleccionada,
      estado_cobro: 'pagado',
      metodo_pago: metodoPagoSeleccionado,
    };
    setVentas((prev) =>
      prev.map((v) => (v.id === ventaSeleccionada.id ? actualizada : v))
    );
    setVentaSeleccionada(null);
  };

  const handleEliminarVenta = async () => {
    if (!ventaSeleccionada) return;
    const confirmar = window.confirm(
      `¿Eliminar la venta ${ventaSeleccionada.codigo_pedido} de ${ventaSeleccionada.deportista}?`
    );
    if (!confirmar) return;

    setVentas((prev) => prev.filter((v) => v.id !== ventaSeleccionada.id));

    if (!ventaSeleccionada.id.startsWith('vta-')) {
      try {
        await eliminarPedido(ventaSeleccionada.id);
      } catch {}
    }

    setVentaSeleccionada(null);
  };

  const totalEditando = itemsEdicion.reduce(
    (sum, it) => sum + it.precio_unitario * it.cantidad,
    0
  );

  const unidadesEditando = itemsEdicion.reduce((sum, it) => sum + it.cantidad, 0);

  const cambioEfectivo = Math.max(
    0,
    efectivoRecibido - Number(ventaSeleccionada?.total_pedido || 0)
  );

  const productosFiltradosModal = productosDisponibles.filter(
    (p) => categoriaActiva === 'Todos' || !p.categoria || p.categoria === categoriaActiva
  );

  return (
    <div>
      {/* ================= 1. TARJETAS SUPERIORES DE INDICADORES (KPIs) ================= */}
      <section className="kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi">
          <div className="kpi-ic">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span>Total Vendido en el Turno</span>
            <b>
              ${kpis.totalVendido.toLocaleString('es-CO')}{' '}
              <small style={{ fontSize: '11.5px', fontWeight: 500, color: 'var(--c400)' }}>
                ({ventas.length} cuentas)
              </small>
            </b>
          </div>
        </div>

        <div className="kpi">
          <div
            className="kpi-ic"
            style={{ background: 'var(--warn-bg)', color: '#B07A0C' }}
          >
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span>Pendiente por Cobrar</span>
            <b>
              ${kpis.totalPorCobrar.toLocaleString('es-CO')}{' '}
              <small style={{ fontSize: '11.5px', fontWeight: 600, color: '#B07A0C' }}>
                ({kpis.porCobrarCount} abiertas)
              </small>
            </b>
          </div>
        </div>

        <div className="kpi">
          <div
            className="kpi-ic"
            style={{ background: 'var(--ok-bg)', color: 'var(--ok)' }}
          >
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span>Recaudado / Pagado</span>
            <b>
              ${kpis.totalRecaudado.toLocaleString('es-CO')}{' '}
              <small style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--ok)' }}>
                ({kpis.pagadasCount} cobradas)
              </small>
            </b>
          </div>
        </div>
      </section>

      {/* ================= 2. BARRA DE FILTROS Y BÚSQUEDA ================= */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div className="tabs" style={{ flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFiltro('todas')}
            className={`tab ${filtro === 'todas' ? 'active' : ''}`}
          >
            Todas ({ventas.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltro('por_cobrar')}
            className={`tab ${filtro === 'por_cobrar' ? 'active' : ''}`}
          >
            <span className="sd" style={{ background: 'var(--warn)' }} />
            Por Cobrar ({kpis.porCobrarCount})
          </button>
          <button
            type="button"
            onClick={() => setFiltro('pagadas')}
            className={`tab ${filtro === 'pagadas' ? 'active' : ''}`}
          >
            <span className="sd" style={{ background: 'var(--ok)' }} />
            Cobradas ({kpis.pagadasCount})
          </button>
          <button
            type="button"
            onClick={() => setFiltro('deportistas')}
            className={`tab ${filtro === 'deportistas' ? 'active' : ''}`}
          >
            Deportistas ({kpis.deportistasCount})
          </button>
          <button
            type="button"
            onClick={() => setFiltro('barra')}
            className={`tab ${filtro === 'barra' ? 'active' : ''}`}
          >
            Barra ({kpis.barraCount})
          </button>
        </div>

        <div
          className="search"
          style={{
            width: '300px',
            padding: '8px 14px',
            borderRadius: '11px',
          }}
        >
          <Search className="w-4 h-4" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar deportista, mesa, barra o código..."
            style={{ fontSize: '12.5px' }}
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              style={{ color: 'var(--c400)', background: 'transparent' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ================= 3. GRILLA DE TARJETAS COMPACTAS DE VENTAS ================= */}
      {ventasFiltradas.length === 0 ? (
        <div
          className="empty"
          style={{
            background: 'var(--surface)',
            padding: '48px 24px',
          }}
        >
          <div className="ic" style={{ background: 'var(--c100)', color: 'var(--c600)' }}>
            <Receipt className="w-6 h-6" />
          </div>
          <h4>No se encontraron cuentas con ese filtro</h4>
          <p>Prueba seleccionando otra pestaña o buscando otro deportista.</p>
        </div>
      ) : (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {ventasFiltradas.map((v) => {
            const totalUnidades = (v.items || []).reduce(
              (acc, it) => acc + Number(it.cantidad || 0),
              0
            );
            const esPendiente = v.estado_cobro === 'pendiente';

            return (
              <article
                key={v.id}
                onClick={() => handleAbrirTarjeta(v)}
                className={`card ${esPendiente ? 'warn' : 'free'}`}
                style={{
                  cursor: 'pointer',
                  borderRadius: '15px',
                }}
              >
                {/* Cabecera compacta */}
                <div
                  className="c-head"
                  style={{
                    padding: '13px 15px 9px',
                  }}
                >
                  <div className="c-title" style={{ gap: '10px' }}>
                    <div
                      className="c-num"
                      style={{
                        width: '34px',
                        height: '34px',
                        fontSize: '13px',
                        borderRadius: '9px',
                        background: v.mesa_numero ? 'var(--c800)' : 'var(--c600)',
                      }}
                    >
                      {v.mesa_numero ? `M${String(v.mesa_numero).padStart(2, '0')}` : 'BAR'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h3 style={{ fontSize: '14.5px', lineHeight: 1.2 }}>{v.deportista}</h3>
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: 'var(--c600)',
                            background: 'var(--soft)',
                            padding: '1px 6px',
                            borderRadius: '5px',
                            border: '1px solid var(--line)',
                          }}
                        >
                          {v.codigo_pedido}
                        </span>
                      </div>
                      <small style={{ fontSize: '11px', display: 'block', marginTop: '1px' }}>
                        {v.mesa_numero
                          ? `Mesa ${v.mesa_numero} · ${v.mesa_tipo}`
                          : 'Venta en Barra'}{' '}
                        · {v.hora_registro}
                      </small>
                    </div>
                  </div>

                  <span
                    className={`pill ${esPendiente ? 'warn' : 'free'}`}
                    style={{ padding: '4px 9px', fontSize: '10px' }}
                  >
                    <span
                      className="sd"
                      style={{
                        background: esPendiente ? 'var(--warn)' : 'var(--ok)',
                      }}
                    />
                    {esPendiente
                      ? 'POR COBRAR'
                      : `PAGADO · ${(v.metodo_pago || 'EFECTIVO').toUpperCase()}`}
                  </span>
                </div>

                {/* Cuerpo compacto */}
                <div
                  className="c-body"
                  style={{
                    padding: '0 15px 11px',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      background: 'var(--soft)',
                      border: '1px solid var(--line)',
                      borderRadius: '10px',
                      padding: '7px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                    }}
                  >
                    {v.items.map((it) => (
                      <div
                        key={it.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          color: 'var(--c800)',
                        }}
                      >
                        <span>
                          <b
                            style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              color: 'var(--c600)',
                              marginRight: '5px',
                            }}
                          >
                            {it.cantidad}×
                          </b>
                          {it.producto_nombre}
                        </span>
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontWeight: 600,
                            fontSize: '11.5px',
                          }}
                        >
                          ${Number(it.subtotal).toLocaleString('es-CO')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '4px',
                      borderTop: '1px dashed var(--line)',
                      marginTop: 'auto',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--c400)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Beer className="w-3.5 h-3.5" />
                      {totalUnidades} uds.
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          color: 'var(--c400)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        Total:
                      </span>
                      <b
                        style={{
                          fontSize: '18px',
                          fontWeight: 800,
                          fontFamily: 'JetBrains Mono, monospace',
                          color: 'var(--c900)',
                        }}
                      >
                        ${Number(v.total_pedido).toLocaleString('es-CO')}
                      </b>
                    </div>
                  </div>
                </div>

                {/* Pie compacto */}
                <div
                  className="c-foot"
                  style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 15px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: 'var(--c600)',
                  }}
                >
                  <span>Pedido · Detalle · Cobrar</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* ================= MODAL AL HACER CLIC EN LA TARJETA ================= */}
      {ventaSeleccionada && (
        <div className="overlay" style={{ zIndex: 75 }} onClick={() => setVentaSeleccionada(null)}>
          <div
            className="modal"
            style={{
              width: vistaModal === 'pedido' ? 'min(860px, 95vw)' : 'min(640px, 95vw)',
              transition: 'width 0.18s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="m-head" style={{ padding: '16px 22px' }}>
              <div
                className="c-num"
                style={{
                  background: ventaSeleccionada.mesa_numero ? 'var(--c800)' : 'var(--c600)',
                }}
              >
                {ventaSeleccionada.mesa_numero
                  ? `M${String(ventaSeleccionada.mesa_numero).padStart(2, '0')}`
                  : 'BAR'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3>{ventaSeleccionada.deportista}</h3>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: 'var(--c600)',
                      background: 'var(--soft)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                    }}
                  >
                    {ventaSeleccionada.codigo_pedido}
                  </span>
                </div>
                <p>
                  {ventaSeleccionada.mesa_numero
                    ? `Deportista en Mesa ${ventaSeleccionada.mesa_numero} · ${ventaSeleccionada.hora_registro}`
                    : `Mostrador de Barra · ${ventaSeleccionada.hora_registro}`}
                </p>
              </div>
              <button
                type="button"
                className="x"
                onClick={() => setVentaSeleccionada(null)}
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menú superior: Pedido (primero a la izquierda) | Detalle | Cobrar */}
            <div style={{ padding: '12px 22px 0', background: 'var(--surface)' }}>
              <div className="ptabs">
                <button
                  type="button"
                  onClick={() => setVistaModal('pedido')}
                  className={`ptab ${vistaModal === 'pedido' ? 'active' : ''}`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Pedido
                </button>
                <button
                  type="button"
                  onClick={() => setVistaModal('detalle')}
                  className={`ptab ${vistaModal === 'detalle' ? 'active' : ''}`}
                >
                  <Receipt className="w-4 h-4" />
                  Detalle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEfectivoRecibido(Number(ventaSeleccionada.total_pedido));
                    setVistaModal('cobrar');
                  }}
                  className={`ptab ${vistaModal === 'cobrar' ? 'active' : ''}`}
                >
                  <CreditCard className="w-4 h-4" />
                  Cobrar
                </button>
              </div>
            </div>

            {/* ================= VISTA 1: DETALLE ================= */}
            {vistaModal === 'detalle' && (
              <>
                <div className="m-body" style={{ padding: '18px 22px', gap: '14px' }}>
                  <table className="split">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventaSeleccionada.items.map((it) => (
                        <tr key={it.id}>
                          <td style={{ fontWeight: 600 }}>{it.producto_nombre}</td>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                            {it.cantidad}
                          </td>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            ${Number(it.precio_unitario).toLocaleString('es-CO')}
                          </td>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                            ${Number(it.subtotal).toLocaleString('es-CO')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="big-total">
                    <span>Total Cuenta</span>
                    <b>${Number(ventaSeleccionada.total_pedido).toLocaleString('es-CO')}</b>
                  </div>
                </div>

                <div className="m-foot">
                  <button
                    type="button"
                    onClick={handleEliminarVenta}
                    className="btn btn-ghost"
                    style={{
                      color: 'var(--busy)',
                      borderColor: 'rgba(224, 83, 95, 0.35)',
                      marginRight: 'auto',
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setVistaModal('pedido')}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Pedido
                  </button>
                  <button
                    type="button"
                    className="btn btn-ok"
                    onClick={() => {
                      setEfectivoRecibido(Number(ventaSeleccionada.total_pedido));
                      setVistaModal('cobrar');
                    }}
                  >
                    <CreditCard className="w-4 h-4" />
                    Cobrar
                  </button>
                </div>
              </>
            )}

            {/* ================= VISTA 2: COBRAR ================= */}
            {vistaModal === 'cobrar' && (
              <>
                <div className="m-body" style={{ padding: '18px 22px', gap: '14px' }}>
                  <div className="step">
                    <i>1</i> Medio de Pago
                  </div>

                  <div className="pays">
                    {[
                      { id: 'Efectivo', sub: 'Caja física' },
                      { id: 'Nequi', sub: 'Transferencia' },
                      { id: 'Daviplata', sub: 'Billetera' },
                      { id: 'Tarjeta', sub: 'Datáfono' },
                    ].map((mp) => (
                      <button
                        key={mp.id}
                        type="button"
                        onClick={() => setMetodoPagoSeleccionado(mp.id)}
                        className={`pay ${metodoPagoSeleccionado === mp.id ? 'sel' : ''}`}
                      >
                        <span>{mp.id}</span>
                        <small>{mp.sub}</small>
                      </button>
                    ))}
                  </div>

                  {metodoPagoSeleccionado === 'Efectivo' && (
                    <div>
                      <div className="step">
                        <i>2</i> Cálculo de Vueltas
                      </div>
                      <div className="cash">
                        <div className="field">
                          <label>Total</label>
                          <div>
                            ${Number(ventaSeleccionada.total_pedido).toLocaleString('es-CO')}
                          </div>
                        </div>
                        <div className="field">
                          <label>Recibido</label>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--c900)', marginRight: '2px' }}>$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={efectivoRecibido ? efectivoRecibido.toLocaleString('es-CO') : ''}
                              onChange={(e) => {
                                const soloDigitos = e.target.value.replace(/\D/g, '');
                                setEfectivoRecibido(soloDigitos ? Number(soloDigitos) : 0);
                              }}
                              style={{ margin: 0, padding: 0 }}
                            />
                          </div>
                        </div>
                        <div className="field hl">
                          <label>Cambio</label>
                          <div>${cambioEfectivo.toLocaleString('es-CO')}</div>
                        </div>
                      </div>

                      <div className="quick">
                        {[10000, 20000, 50000, 100000].map((billete) => (
                          <button
                            key={billete}
                            type="button"
                            onClick={() => setEfectivoRecibido(billete)}
                          >
                            ${(billete / 1000).toFixed(0)}k
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setEfectivoRecibido(Number(ventaSeleccionada.total_pedido))
                          }
                        >
                          Exacto
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="big-total">
                    <span>Total a Cobrar ({ventaSeleccionada.deportista})</span>
                    <b>${Number(ventaSeleccionada.total_pedido).toLocaleString('es-CO')}</b>
                  </div>
                </div>

                <div className="m-foot">
                  <button
                    type="button"
                    onClick={handleEliminarVenta}
                    className="btn btn-ghost"
                    style={{
                      color: 'var(--busy)',
                      borderColor: 'rgba(224, 83, 95, 0.35)',
                      marginRight: 'auto',
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => window.print()}
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir
                  </button>
                  <button
                    type="button"
                    className="btn btn-ok"
                    onClick={handleConfirmarCobro}
                  >
                    <Check className="w-4 h-4" />
                    Confirmar Cobro
                  </button>
                </div>
              </>
            )}

            {/* ================= VISTA 3: PEDIDO (IZQUIERDA MENÚ DE PRODUCTOS | DERECHA PRODUCTOS EN CUENTA) ================= */}
            {vistaModal === 'pedido' && (
              <>
                <div
                  className="m-body"
                  style={{
                    padding: '14px 20px',
                    gap: '12px',
                    overflowX: 'hidden',
                  }}
                >
                  {/* Cinta superior de deportista fijo */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--soft)',
                      border: '1px solid var(--line)',
                      borderRadius: '10px',
                      padding: '7px 12px',
                      fontSize: '12px',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--c700)',
                        fontWeight: 600,
                      }}
                    >
                      <UserCheck className="w-4 h-4 text-slate-600" />
                      Cuenta de deportista: <b>{ventaSeleccionada.deportista}</b>
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: 'var(--c400)',
                      }}
                    >
                      <Lock className="w-3 h-3" />
                      Titular fijo
                    </span>
                  </div>

                  {/* Diseño en 2 columnas con minmax(0, ...) para que NUNCA se desborde ni corte a la derecha */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
                      gap: '12px',
                      width: '100%',
                      alignItems: 'stretch',
                    }}
                  >
                    {/* COLUMNA IZQUIERDA: Menú de Productos en Tarjetas */}
                    <div
                      style={{
                        minWidth: 0,
                        background: 'var(--soft)',
                        border: '1px solid var(--line)',
                        borderRadius: '14px',
                        padding: '11px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--c600)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.6px',
                          }}
                        >
                          Menú de productos
                        </span>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {['Todos', 'Cervezas', 'Licores', 'Bebidas', 'Snacks'].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCategoriaActiva(cat)}
                              className={`ctab ${categoriaActiva === cat ? 'active' : ''}`}
                              style={{ padding: '4px 9px', fontSize: '10.5px' }}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                          alignContent: 'start',
                          gap: '8px',
                          height: '296px',
                          maxHeight: '296px',
                          overflowY: 'auto',
                          paddingRight: '4px',
                        }}
                      >
                        {productosFiltradosModal.map((prod) => {
                          const enLista = itemsEdicion.find((i) => i.producto_id === prod.id);
                          return (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => handleSeleccionarTarjetaProducto(prod)}
                              className="prod"
                              style={{
                                padding: '9px 10px',
                                gap: '4px',
                                position: 'relative',
                                borderColor: enLista ? 'var(--c600)' : 'var(--line)',
                                background: enLista ? '#EEF0F8' : 'var(--surface)',
                              }}
                            >
                              {enLista && (
                                <span
                                  style={{
                                    position: 'absolute',
                                    top: '7px',
                                    right: '7px',
                                    background: 'var(--c600)',
                                    color: '#fff',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                    fontFamily: 'JetBrains Mono, monospace',
                                  }}
                                >
                                  {enLista.cantidad}×
                                </span>
                              )}
                              <div className="pi" style={{ width: '25px', height: '25px' }}>
                                <Beer className="w-3.5 h-3.5" />
                              </div>
                              <b style={{ fontSize: '11.5px' }}>{prod.nombre}</b>
                              <span style={{ fontSize: '11.5px' }}>
                                ${Number(prod.precio_venta).toLocaleString('es-CO')}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* COLUMNA DERECHA: Productos en Cuenta (5 visibles completos y el resto en scroll) */}
                    <div
                      style={{
                        minWidth: 0,
                        background: 'var(--surface)',
                        border: '1px solid var(--line)',
                        borderRadius: '14px',
                        padding: '11px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingBottom: '7px',
                          borderBottom: '1px solid var(--line)',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--c600)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.6px',
                          }}
                        >
                          Productos en cuenta
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--c400)',
                          }}
                        >
                          {unidadesEditando} uds.
                        </span>
                      </div>

                      {/* Lista con altura exacta para 5 filas completas */}
                      <div
                        style={{
                          height: '276px',
                          maxHeight: '276px',
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          padding: '6px 2px 6px 0',
                        }}
                      >
                        {itemsEdicion.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 9px',
                              height: '48px',
                              minHeight: '48px',
                              flexShrink: 0,
                              background: 'var(--soft)',
                              border: '1px solid var(--line)',
                              borderRadius: '10px',
                              gap: '6px',
                              minWidth: 0,
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <b
                                style={{
                                  fontSize: '11.5px',
                                  display: 'block',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                                title={item.nombre}
                              >
                                {item.nombre}
                              </b>
                              <small style={{ fontSize: '10px', color: 'var(--c400)' }}>
                                ${item.precio_unitario.toLocaleString('es-CO')} c/u
                              </small>
                            </div>

                            <div className="qty" style={{ gap: '3px', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => handleModificarCantidad(idx, -1)}
                                style={{ width: '22px', height: '22px', background: '#fff' }}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span style={{ fontSize: '11.5px', width: '16px' }}>
                                {item.cantidad}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleModificarCantidad(idx, 1)}
                                style={{ width: '22px', height: '22px', background: '#fff' }}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <b
                              style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '11px',
                                minWidth: '58px',
                                textAlign: 'right',
                                flexShrink: 0,
                              }}
                            >
                              ${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}
                            </b>

                            <button
                              type="button"
                              onClick={() => handleEliminarItemEdicion(idx)}
                              className="del"
                              style={{ width: '22px', height: '22px', flexShrink: 0 }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Total en la parte inferior derecha */}
                      <div
                        style={{
                          borderTop: '1px dashed var(--line)',
                          paddingTop: '9px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--c400)',
                            textTransform: 'uppercase',
                          }}
                        >
                          Total Pedido
                        </span>
                        <b
                          style={{
                            fontSize: '19px',
                            fontWeight: 800,
                            fontFamily: 'JetBrains Mono, monospace',
                            color: 'var(--c900)',
                          }}
                        >
                          ${totalEditando.toLocaleString('es-CO')}
                        </b>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="m-foot">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setVistaModal('detalle')}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={guardandoEdicion}
                    onClick={handleGuardarPedido}
                    className="btn btn-ok"
                  >
                    <Save className="w-4 h-4" />
                    {guardandoEdicion ? 'Guardando...' : 'Guardar Pedido'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
