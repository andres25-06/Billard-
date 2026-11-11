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
  AlertTriangle,
  Ban,
  Smartphone,
  Wallet,
  Banknote,
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
  estado_cobro: 'pendiente' | 'pagado' | 'anulado';
  metodo_pago?: string;
  total_pedido: number;
  solicitado_el: string;
  hora_registro?: string;
  nota?: string;
  items: VentaItem[];
  motivo_anulacion?: string;
  anulado_el?: string;
  anulado_por?: string;
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
  {
    id: 'vta-7',
    codigo_pedido: 'VTA-0035',
    mesa_numero: 4,
    mesa_tipo: 'Pool',
    deportista: 'Carlos M.',
    origen: 'Deportista · Mesa 4',
    estado_cobro: 'anulado',
    metodo_pago: 'Efectivo',
    total_pedido: 11000,
    solicitado_el: new Date(Date.now() - 110 * 60000).toISOString(),
    hora_registro: '03:50 PM',
    motivo_anulacion: 'Pedido cargado a mesa equivocada por error',
    anulado_el: '03:55 PM',
    anulado_por: 'Carlos M. (Cajero)',
    items: [
      {
        id: 'it-701',
        producto_id: 'p-2',
        producto_nombre: 'Club Colombia Dorada',
        cantidad: 2,
        precio_unitario: 5500,
        subtotal: 11000,
        nota: 'Carlos M.',
      },
    ],
  },
];

export default function ViewPedidos() {
  const [ventas, setVentas] = useState<VentaRegistro[]>(VENTAS_INICIALES);
  const [filtro, setFiltro] = useState<
    'todas' | 'por_cobrar' | 'pagadas' | 'deportistas' | 'barra' | 'anuladas'
  >('todas');
  const [busqueda, setBusqueda] = useState<string>('');

  // Catálogo para tarjetas de selección en Pedido
  const [productosDisponibles, setProductosDisponibles] = useState<
    Array<{ id: string; nombre: string; precio_venta: number; categoria?: string }>
  >(PRODUCTOS_CATALOGO_DEMO);

  // Tarjeta seleccionada -> Abre el modal con 3 pestañas: Pedido (primera), Detalle, Cobrar
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaRegistro | null>(null);
  const [vistaModal, setVistaModal] = useState<'pedido' | 'detalle' | 'cobrar'>('pedido');
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Todos');
  const [busquedaProdModal, setBusquedaProdModal] = useState<string>('');

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

  // Estado para anulación de venta liquidada con motivo obligatorio
  const [mostrarModalAnulacion, setMostrarModalAnulacion] = useState<boolean>(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState<string>('');

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
    const activas = ventas.filter((v) => v.estado_cobro !== 'anulado');
    const porCobrar = activas.filter((v) => v.estado_cobro === 'pendiente');
    const pagadas = activas.filter((v) => v.estado_cobro === 'pagado');
    const deportistas = activas.filter((v) => Boolean(v.mesa_numero));
    const barra = activas.filter((v) => !v.mesa_numero);
    const anuladas = ventas.filter((v) => v.estado_cobro === 'anulado');

    const totalVendido = activas.reduce((acc, v) => acc + Number(v.total_pedido || 0), 0);
    const totalPorCobrar = porCobrar.reduce((acc, v) => acc + Number(v.total_pedido || 0), 0);
    const totalRecaudado = pagadas.reduce((acc, v) => acc + Number(v.total_pedido || 0), 0);
    const totalDeportistas = deportistas.reduce((acc, v) => acc + Number(v.total_pedido || 0), 0);
    const totalBarra = barra.reduce((acc, v) => acc + Number(v.total_pedido || 0), 0);
    const totalAnulado = anuladas.reduce((acc, v) => acc + Number(v.total_pedido || 0), 0);
    const totalUnidades = activas.reduce(
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
      anuladasCount: anuladas.length,
      totalAnulado,
      totalUnidades,
      activasCount: activas.length,
    };
  }, [ventas]);

  // Filtrado de tarjetas
  const ventasFiltradas = useMemo(() => {
    return ventas.filter((v) => {
      if (filtro === 'anuladas') {
        if (v.estado_cobro !== 'anulado') return false;
      } else {
        // En cualquier otra pestaña, solo mostrar ventas activas
        if (v.estado_cobro === 'anulado') return false;
        if (filtro === 'por_cobrar' && v.estado_cobro !== 'pendiente') return false;
        if (filtro === 'pagadas' && v.estado_cobro !== 'pagado') return false;
        if (filtro === 'deportistas' && !v.mesa_numero) return false;
        if (filtro === 'barra' && Boolean(v.mesa_numero)) return false;
      }

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const matchCodigo = v.codigo_pedido.toLowerCase().includes(q);
        const matchDeportista = v.deportista.toLowerCase().includes(q);
        const matchMesa = v.mesa_numero ? `mesa ${v.mesa_numero}`.includes(q) : 'barra'.includes(q);
        const matchMotivo = (v.motivo_anulacion || '').toLowerCase().includes(q);
        const matchProd = v.items.some((it) =>
          it.producto_nombre.toLowerCase().includes(q)
        );
        return matchCodigo || matchDeportista || matchMesa || matchProd || matchMotivo;
      }

      return true;
    });
  }, [ventas, filtro, busqueda]);

  // Cerrar modal al presionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVentaSeleccionada(null);
      }
    };
    if (ventaSeleccionada) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ventaSeleccionada]);

  // Al hacer clic en la tarjeta -> Si está pagada o anulada abre en 'detalle', si está pendiente abre en 'pedido'
  const handleAbrirTarjeta = (venta: VentaRegistro) => {
    setVentaSeleccionada(venta);
    setMostrarModalAnulacion(false);
    setMotivoAnulacion('');
    if (venta.estado_cobro === 'pagado' || venta.estado_cobro === 'anulado') {
      setVistaModal('detalle');
    } else {
      setVistaModal('pedido');
    }
    setCategoriaActiva('Todos');
    setBusquedaProdModal('');
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

  // Confirmar anulación de una venta liquidada con descripción obligatoria (NO se borra, se registra como anulada)
  const handleConfirmarAnulacion = async () => {
    if (!ventaSeleccionada || !motivoAnulacion.trim()) return;

    const ahora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const ventaAnulada: VentaRegistro = {
      ...ventaSeleccionada,
      estado_cobro: 'anulado',
      motivo_anulacion: motivoAnulacion.trim(),
      anulado_el: ahora,
      anulado_por: 'Cajero en turno',
    };

    setVentas((prev) =>
      prev.map((v) => (v.id === ventaSeleccionada.id ? ventaAnulada : v))
    );

    if (!ventaSeleccionada.id.startsWith('vta-')) {
      try {
        await eliminarPedido(ventaSeleccionada.id);
      } catch {}
    }

    setMostrarModalAnulacion(false);
    setMotivoAnulacion('');
    setVentaSeleccionada(null);
  };

  // Abrir directamente la pestaña de cobro desde la tarjeta
  const handleAbrirCobro = (e: React.MouseEvent, venta: VentaRegistro) => {
    e.stopPropagation();
    setVentaSeleccionada(venta);
    setVistaModal('cobrar');
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
    if (!ventaSeleccionada || ventaSeleccionada.estado_cobro === 'pagado') return;
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
    if (ventaSeleccionada.estado_cobro === 'pagado') {
      alert('No se pueden modificar los productos de una cuenta ya liquidada.');
      return;
    }
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

  // Eliminar/Cancelar pedido pendiente con motivo de auditoría (NO se borra)
  const handleEliminarVenta = async () => {
    if (!ventaSeleccionada) return;
    const motivo = window.prompt(
      `Ingresa el motivo para cancelar/eliminar el pedido ${ventaSeleccionada.codigo_pedido}:`,
      'Pedido cancelado por el cliente'
    );
    if (motivo === null) return; // canceló prompt

    const ahora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const ventaAnulada: VentaRegistro = {
      ...ventaSeleccionada,
      estado_cobro: 'anulado',
      motivo_anulacion: motivo.trim() || 'Pedido cancelado por el operador',
      anulado_el: ahora,
      anulado_por: 'Cajero en turno',
    };

    setVentas((prev) =>
      prev.map((v) => (v.id === ventaSeleccionada.id ? ventaAnulada : v))
    );

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

  const productosFiltradosModal = productosDisponibles.filter((p) => {
    const matchCat = categoriaActiva === 'Todos' || !p.categoria || p.categoria === categoriaActiva;
    const matchBusq = !busquedaProdModal.trim() || p.nombre.toLowerCase().includes(busquedaProdModal.toLowerCase());
    return matchCat && matchBusq;
  });

  return (
    <div className="w-full pb-10">
      {/* ================= 1. TARJETAS SUPERIORES DE INDICADORES (KPIs) ================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* KPI 1: Total Vendido */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between hover:shadow-xs hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Total Vendido en el Turno</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                  ${kpis.totalVendido.toLocaleString('es-CO')}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {ventas.length} cuentas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Pendiente por Cobrar */}
        <div className="bg-white rounded-2xl border border-amber-200/90 shadow-2xs p-4 flex items-center justify-between hover:shadow-xs hover:-translate-y-0.5 transition-all bg-gradient-to-br from-white to-amber-50/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <span className="text-xs font-semibold text-amber-900 block">Pendiente por Cobrar</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold font-mono text-amber-800 tracking-tight">
                  ${kpis.totalPorCobrar.toLocaleString('es-CO')}
                </span>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full">
                  {kpis.porCobrarCount} abiertas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Recaudado / Pagado */}
        <div className="bg-white rounded-2xl border border-emerald-200/90 shadow-2xs p-4 flex items-center justify-between hover:shadow-xs hover:-translate-y-0.5 transition-all bg-gradient-to-br from-white to-[#184A35]/5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#184A35]/10 text-[#184A35] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#184A35]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-950 block">Recaudado / En Caja</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold font-mono text-[#184A35] tracking-tight">
                  ${kpis.totalRecaudado.toLocaleString('es-CO')}
                </span>
                <span className="text-[11px] font-bold text-[#184A35] bg-[#184A35]/10 px-2 py-0.5 rounded-full">
                  {kpis.pagadasCount} cobradas
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. BARRA DE FILTROS Y BÚSQUEDA ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center bg-white border border-slate-200/90 rounded-xl p-1 shadow-2xs flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setFiltro('todas')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filtro === 'todas'
                  ? 'bg-[#184A35] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Todas ({kpis.activasCount})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('por_cobrar')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                filtro === 'por_cobrar'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
              Por Cobrar ({kpis.porCobrarCount})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('pagadas')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                filtro === 'pagadas'
                  ? 'bg-[#184A35] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Cobradas ({kpis.pagadasCount})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('deportistas')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filtro === 'deportistas'
                  ? 'bg-[#184A35] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Deportistas ({kpis.deportistasCount})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('barra')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filtro === 'barra'
                  ? 'bg-[#184A35] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Barra ({kpis.barraCount})
            </button>
          </div>

          {/* BOTÓN DEDICADO PARA VER VENTAS ANULADAS Y PEDIDOS ELIMINADOS */}
          <button
            type="button"
            onClick={() => setFiltro(filtro === 'anuladas' ? 'todas' : 'anuladas')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all shadow-2xs ${
              filtro === 'anuladas'
                ? 'bg-red-600 text-white border-red-700 shadow-xs'
                : 'bg-white text-red-700 border-red-200/90 hover:bg-red-50 hover:border-red-300'
            }`}
            title="Ver todas las ventas anuladas y pedidos eliminados"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Anuladas & Eliminados ({kpis.anuladasCount})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar deportista, mesa o código..."
            className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#184A35]/30 focus:border-[#184A35]"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ================= 3. GRILLA DE TARJETAS DE VENTAS ================= */}
      {ventasFiltradas.length === 0 ? (
        <div
          className="empty bg-white rounded-2xl border border-slate-200/90 shadow-2xs text-center"
          style={{ padding: '48px 24px' }}
        >
          <div className="ic" style={{ background: 'var(--c100)', color: 'var(--c600)' }}>
            <Receipt className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mt-3">No se encontraron cuentas con ese filtro</h4>
          <p className="text-xs text-slate-500 mt-1">Prueba seleccionando otra pestaña o buscando otro deportista.</p>
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
            const esAnulada = v.estado_cobro === 'anulado';

            return (
              <article
                key={v.id}
                onClick={() => handleAbrirTarjeta(v)}
                className={`bg-white rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-0.5 group h-[280px] max-h-[280px] ${
                  esAnulada
                    ? 'border-red-200/90 hover:border-red-400 bg-red-50/10'
                    : esPendiente
                    ? 'border-slate-200/90 hover:border-amber-300'
                    : 'border-slate-200/90 hover:border-[#184A35]/40'
                }`}
              >
                {/* Barra de acento superior */}
                <div
                  className={`h-1.5 w-full shrink-0 ${
                    esAnulada ? 'bg-red-500' : esPendiente ? 'bg-amber-400' : 'bg-[#184A35]'
                  }`}
                />

                {/* Cabecera */}
                <div className="p-4 pb-2.5 flex items-start justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Badge Mesa / Barra */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-xs text-white ${
                        esAnulada ? 'bg-red-800' : v.mesa_numero ? 'bg-[#184A35]' : 'bg-slate-800'
                      }`}
                    >
                      {v.mesa_numero ? `M${String(v.mesa_numero).padStart(2, '0')}` : 'BAR'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[14.5px] font-bold text-slate-900 truncate leading-snug group-hover:text-[#184A35] transition-colors">
                          {v.deportista}
                        </h3>
                        <span className="font-mono text-[10.5px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {v.codigo_pedido}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-500 font-medium truncate mt-0.5">
                        {v.mesa_numero ? `Mesa ${v.mesa_numero} · ${v.mesa_tipo || '3 Bandas'}` : 'Venta en Barra'}
                        <span className="mx-1 text-slate-300">·</span>
                        <span>{v.hora_registro}</span>
                      </p>
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="shrink-0">
                    {esAnulada ? (
                      <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200/90 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                        <Ban className="w-3 h-3 text-red-600" />
                        Anulada
                      </span>
                    ) : esPendiente ? (
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200/90 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Por Cobrar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#184A35] border border-emerald-200/90 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#184A35]" />
                        Pagado · {(v.metodo_pago || 'Efectivo').toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Resumen de Productos o Motivo de Anulación */}
                <div className="px-4 pb-2.5 flex-1 flex flex-col justify-between overflow-hidden gap-2 min-h-0">
                  {esAnulada ? (
                    <div className="bg-red-50/80 border border-red-200/90 rounded-xl p-2.5 flex flex-col justify-between h-[84px] max-h-[84px] overflow-y-auto">
                      <div>
                        <span className="text-[10px] font-extrabold text-red-700 uppercase tracking-wide flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          Motivo de anulación:
                        </span>
                        <p className="text-[11px] text-red-900 font-medium italic mt-0.5 leading-snug line-clamp-2">
                          "{v.motivo_anulacion || 'Cancelado por el operador'}"
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-red-600 font-semibold pt-1 border-t border-red-200/60 mt-1">
                        <span>Hora: {v.anulado_el || v.hora_registro}</span>
                        <span>{v.anulado_por || 'Cajero'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-2.5 space-y-1.5 h-[84px] max-h-[84px] overflow-y-auto pr-1">
                      {v.items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between text-xs text-slate-700">
                          <span className="truncate pr-2 flex items-center">
                            <span className="font-mono font-bold text-[11px] text-slate-800 bg-white border border-slate-200/90 px-1.5 py-0.5 rounded mr-1.5 shadow-2xs shrink-0">
                              {it.cantidad}×
                            </span>
                            <span className="truncate font-medium">{it.producto_nombre}</span>
                          </span>
                          <span className="font-mono font-semibold text-slate-900 shrink-0 text-[11.5px]">
                            ${Number(it.subtotal).toLocaleString('es-CO')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fila Total y Unidades */}
                  <div className="pt-2 border-t border-dashed border-slate-200 flex items-center justify-between shrink-0">
                    <span className="text-[11.5px] font-semibold text-slate-500 flex items-center gap-1.5">
                      <Beer className="w-3.5 h-3.5 text-slate-400" />
                      {totalUnidades} uds.
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Total:
                      </span>
                      <span className={`text-[18px] font-black font-mono ${esAnulada ? 'text-red-700 line-through opacity-75' : 'text-slate-900'}`}>
                        ${Number(v.total_pedido).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer de Acciones Rápidas */}
                <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs font-semibold shrink-0">
                  {esAnulada ? (
                    <>
                      <span className="text-red-700 flex items-center gap-1 text-[11px] font-bold">
                        <Ban className="w-3.5 h-3.5 text-red-600" />
                        <span>Registro Anulado</span>
                      </span>
                      <span className="text-slate-500 group-hover:text-red-700 transition-colors flex items-center gap-0.5 text-[11px]">
                        <span>Ver auditoría</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </>
                  ) : esPendiente ? (
                    <>
                      <span className="text-slate-500 group-hover:text-slate-800 transition-colors flex items-center gap-1">
                        <span>Editar pedido</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleAbrirCobro(e, v)}
                        className="bg-[#184A35] hover:bg-[#133c2b] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-all"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Cobrar</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-emerald-800 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#184A35]" />
                        <span>Cuenta pagada</span>
                      </span>
                      <span className="text-slate-500 group-hover:text-[#184A35] transition-colors flex items-center gap-0.5 text-[11px]">
                        <span>Ver recibo</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* ================= MODAL AL HACER CLIC EN LA TARJETA (REDISEÑO POS BILLAR TACTIL) ================= */}
      {ventaSeleccionada && (() => {
        const esVentaPagada = ventaSeleccionada.estado_cobro === 'pagado';
        const esVentaAnulada = ventaSeleccionada.estado_cobro === 'anulado';

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm animate-fadeIn"
            onClick={() => setVentaSeleccionada(null)}
          >
            <div
              className={`bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden transition-all duration-200 ${
                !esVentaPagada && !esVentaAnulada && vistaModal === 'pedido'
                  ? 'w-full max-w-[940px] max-h-[92vh]'
                  : 'w-full max-w-[620px] max-h-[92vh]'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* CABECERA MODAL MODERNA CON MARCA Y BOTÓN CERRAR REDONDO */}
              <div className="px-5 py-4 sm:px-6 sm:py-4.5 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-mono font-black text-white text-sm shadow-sm shrink-0 tracking-wider ${
                      esVentaAnulada
                        ? 'bg-rose-700'
                        : ventaSeleccionada.mesa_numero
                        ? 'bg-[#184A35]'
                        : 'bg-slate-800'
                    }`}
                  >
                    {ventaSeleccionada.mesa_numero
                      ? `M${String(ventaSeleccionada.mesa_numero).padStart(2, '0')}`
                      : 'BAR'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                        {ventaSeleccionada.deportista}
                      </h3>
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80 shrink-0">
                        {ventaSeleccionada.codigo_pedido}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      {ventaSeleccionada.mesa_numero
                        ? `Mesa ${ventaSeleccionada.mesa_numero} (${ventaSeleccionada.mesa_tipo || '3 Bandas'}) · ${ventaSeleccionada.hora_registro}`
                        : `Venta Mostrador Barra · ${ventaSeleccionada.hora_registro}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setVentaSeleccionada(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0 ml-2"
                  title="Cerrar modal (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* BARRA SEGMENTADA FLOTANTE DE PESTAÑAS O BANNER DE ESTADO */}
              <div className="px-5 pt-3 sm:px-6 sm:pt-3.5 bg-white shrink-0">
                {esVentaAnulada ? (
                  <div className="flex items-center justify-between p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                        <Ban className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-rose-900 uppercase tracking-wide text-[11px] block">
                          Venta Anulada / Registro Cancelado
                        </span>
                        <span className="text-rose-700 font-medium">
                          Motivo: &ldquo;{ventaSeleccionada.motivo_anulacion || 'Cancelado por el operador'}&rdquo;
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-[11px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200 block">
                        {ventaSeleccionada.anulado_el || ventaSeleccionada.hora_registro}
                      </span>
                      <span className="text-[10px] text-rose-600 mt-0.5 block">
                        {ventaSeleccionada.anulado_por || 'Cajero en turno'}
                      </span>
                    </div>
                  </div>
                ) : esVentaPagada ? (
                  <div className="flex items-center justify-between p-3.5 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#184A35] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#184A35] uppercase tracking-wide block">
                          Cuenta Liquidada · {(ventaSeleccionada.metodo_pago || 'Efectivo').toUpperCase()}
                        </span>
                        <span className="text-[11.5px] text-emerald-800 font-medium">
                          Transacción guardada exitosamente en caja
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#184A35] bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                      #{ventaSeleccionada.codigo_pedido}
                    </span>
                  </div>
                ) : (
                  <div className="bg-slate-100/90 p-1 rounded-2xl flex items-center border border-slate-200/70 w-full">
                    <button
                      type="button"
                      onClick={() => setVistaModal('pedido')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                        vistaModal === 'pedido'
                          ? '!bg-[#184A35] !text-white shadow-sm'
                          : '!text-slate-600 hover:!text-slate-900 hover:!bg-white/60 !bg-transparent'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4 shrink-0" />
                      <span>Pedido</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVistaModal('detalle')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                        vistaModal === 'detalle'
                          ? '!bg-[#184A35] !text-white shadow-sm'
                          : '!text-slate-600 hover:!text-slate-900 hover:!bg-white/60 !bg-transparent'
                      }`}
                    >
                      <Receipt className="w-4 h-4 shrink-0" />
                      <span>Detalle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEfectivoRecibido(Number(ventaSeleccionada.total_pedido));
                        setVistaModal('cobrar');
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                        vistaModal === 'cobrar'
                          ? '!bg-[#184A35] !text-white shadow-sm'
                          : '!text-slate-600 hover:!text-slate-900 hover:!bg-white/60 !bg-transparent'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 shrink-0" />
                      <span>Cobrar</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* VISTA 1: DETALLE (RECIBO DIGITAL TÉRMICO CON LOGO TOCANO)                 */}
              {/* ========================================================================= */}
              {(esVentaPagada || esVentaAnulada || vistaModal === 'detalle') && (
                <>
                  <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                    {mostrarModalAnulacion ? (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                          <span>Anular Venta #{ventaSeleccionada.codigo_pedido} ({ventaSeleccionada.deportista})</span>
                        </div>
                        <p className="text-xs text-rose-800 leading-relaxed">
                          Esta venta ya fue liquidada. Para cancelarla debes registrar obligatoriamente el motivo de anulación para auditoría interna:
                        </p>
                        <textarea
                          value={motivoAnulacion}
                          onChange={(e) => setMotivoAnulacion(e.target.value)}
                          placeholder="Ej: Cobro duplicado por error en datáfono, cliente pidió devolución de bebidas no destapadas..."
                          rows={3}
                          className="w-full text-xs p-3 bg-white border border-rose-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 placeholder-slate-400"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setMostrarModalAnulacion(false);
                              setMotivoAnulacion('');
                            }}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white transition-colors"
                          >
                            Volver
                          </button>
                          <button
                            type="button"
                            disabled={!motivoAnulacion.trim()}
                            onClick={handleConfirmarAnulacion}
                            className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Confirmar Anulación
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* CONTENEDOR TÉRMICO CON ESTILO FACTURA FÍSICA */
                      <div className="bg-[#FAF9F5] border border-amber-900/15 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
                        {/* Marca de agua si está anulada */}
                        {esVentaAnulada && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                            <span className="text-6xl sm:text-7xl font-black text-rose-950 uppercase rotate-[-25deg] border-8 border-rose-950 px-8 py-3 rounded-2xl">
                              ANULADO
                            </span>
                          </div>
                        )}

                        {/* ENCABEZADO TÉRMICO CON LOGO */}
                        <div className="text-center pb-4 border-b border-dashed border-slate-300">
                          <div className="flex items-center justify-center gap-2.5 mb-1.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/logo-tocano.jpg"
                              alt="El Encuentro Tocano"
                              className="w-9 h-9 rounded-full object-cover shadow-2xs border border-amber-900/20"
                            />
                            <h4 className="font-black text-sm tracking-wide text-slate-900 uppercase">
                              El Encuentro Tocano
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">
                            Club de Billar & Café Bar · NIT 901.432.890-1
                          </p>
                          <p className="text-[10.5px] text-slate-400 mt-0.5">
                            Tocancipá, Cundinamarca · Servicio POS Turno Actual
                          </p>

                          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 bg-white/70 py-1.5 px-3 rounded-xl border border-slate-200/70 font-mono">
                            <span>Ticket: <b>{ventaSeleccionada.codigo_pedido}</b></span>
                            <span>{ventaSeleccionada.hora_registro}</span>
                          </div>
                        </div>

                        {/* DETALLE DE CLIENTE / MESA */}
                        <div className="py-3 border-b border-dashed border-slate-300 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                              Cliente / Deportista
                            </span>
                            <span className="font-bold text-slate-800">
                              {ventaSeleccionada.deportista}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                              Ubicación
                            </span>
                            <span className="font-bold text-slate-800">
                              {ventaSeleccionada.mesa_numero
                                ? `Mesa ${ventaSeleccionada.mesa_numero} (${ventaSeleccionada.mesa_tipo || '3 Bandas'})`
                                : 'Mostrador Barra'}
                            </span>
                          </div>
                        </div>

                        {/* LISTA DE ARTÍCULOS TÉRMICA */}
                        <div className="py-3 space-y-2 border-b border-dashed border-slate-300">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono pb-1">
                            <span>Cant. & Producto</span>
                            <span>Subtotal</span>
                          </div>
                          {ventaSeleccionada.items.map((it) => (
                            <div key={it.id} className="flex items-baseline justify-between text-xs">
                              <div className="min-w-0 pr-3">
                                <span className="font-mono font-bold text-slate-800 mr-2">
                                  {it.cantidad}×
                                </span>
                                <span className="font-semibold text-slate-800">
                                  {it.producto_nombre}
                                </span>
                                <span className="text-[10.5px] text-slate-400 block ml-6">
                                  ${Number(it.precio_unitario).toLocaleString('es-CO')} c/u
                                </span>
                              </div>
                              <span className="font-mono font-bold text-slate-900 shrink-0">
                                ${Number(it.subtotal).toLocaleString('es-CO')}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* TOTAL Y ESTADO FISCAL */}
                        <div className="pt-3.5 flex items-baseline justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total a Pagar
                          </span>
                          <span
                            className={`font-mono text-2xl font-black ${
                              esVentaAnulada
                                ? 'line-through text-rose-700 opacity-60'
                                : 'text-slate-900'
                            }`}
                          >
                            ${Number(ventaSeleccionada.total_pedido).toLocaleString('es-CO')}
                          </span>
                        </div>

                        {/* PIE DEL TICKET */}
                        <div className="mt-4 pt-3 border-t border-dashed border-slate-200 text-center">
                          <p className="text-[10px] text-slate-400 font-mono">
                            {esVentaPagada
                              ? `Liquidado vía ${(ventaSeleccionada.metodo_pago || 'Efectivo').toUpperCase()} · Gracias por su visita`
                              : esVentaAnulada
                              ? 'Comprobante ANULADO · No válido para cobro ni soporte'
                              : 'Cuenta Abierta · Pendiente de Cobro en Caja'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FOOTER DETALLE */}
                  <div className="px-5 py-3.5 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                    {esVentaAnulada ? (
                      <>
                        <span className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                          <Ban className="w-4 h-4 text-rose-600" />
                          Comprobante Anulado
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                            onClick={() => window.print()}
                          >
                            <Printer className="w-4 h-4" />
                            Imprimir Copia
                          </button>
                          <button
                            type="button"
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                            onClick={() => setVentaSeleccionada(null)}
                          >
                            <Check className="w-4 h-4" />
                            Cerrar
                          </button>
                        </div>
                      </>
                    ) : esVentaPagada ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setMostrarModalAnulacion(true)}
                          className="px-3.5 py-2 rounded-xl text-rose-600 border border-rose-200 bg-rose-50/60 hover:bg-rose-100/70 flex items-center gap-1.5 text-xs font-bold transition-colors"
                          title="Anular venta pagada con justificación obligatoria"
                        >
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          Anular Venta
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                            onClick={() => window.print()}
                          >
                            <Printer className="w-4 h-4" />
                            Imprimir Recibo
                          </button>
                          <button
                            type="button"
                            className="px-4.5 py-2 rounded-xl bg-[#184A35] hover:bg-[#123828] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                            onClick={() => setVentaSeleccionada(null)}
                          >
                            <Check className="w-4 h-4" />
                            Cerrar
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleEliminarVenta}
                          className="px-3.5 py-2 rounded-xl text-rose-600 border border-rose-200 bg-white hover:bg-rose-50 flex items-center gap-1.5 text-xs font-bold transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Cancelar Cuenta
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                            onClick={() => setVistaModal('pedido')}
                          >
                            <ShoppingBag className="w-4 h-4" />
                            Editar Pedido
                          </button>
                          <button
                            type="button"
                            className="px-4.5 py-2 rounded-xl bg-[#184A35] hover:bg-[#123828] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
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
                  </div>
                </>
              )}

              {/* ========================================================================= */}
              {/* VISTA 2: COBRAR (FAST CASH + BILLETERAS DIGITALES)                         */}
              {/* ========================================================================= */}
              {!esVentaPagada && !esVentaAnulada && vistaModal === 'cobrar' && (
                <>
                  <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
                    {/* PASO 1: SELECCIONAR MÉTODO DE PAGO */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        <span className="w-5 h-5 rounded-full bg-[#184A35] text-white flex items-center justify-center text-[10px]">1</span>
                        <span>Medio de Pago</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          {
                            id: 'Efectivo',
                            sub: 'Caja física',
                            icon: Banknote,
                            accent: 'hover:border-emerald-500',
                            activeClass: '!border-emerald-600 !bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20',
                          },
                          {
                            id: 'Nequi',
                            sub: 'Transferencia',
                            icon: Smartphone,
                            accent: 'hover:border-purple-500',
                            activeClass: '!border-purple-600 !bg-purple-50 text-purple-900 ring-2 ring-purple-600/20',
                          },
                          {
                            id: 'Daviplata',
                            sub: 'Billetera',
                            icon: Wallet,
                            accent: 'hover:border-rose-500',
                            activeClass: '!border-rose-600 !bg-rose-50 text-rose-900 ring-2 ring-rose-600/20',
                          },
                          {
                            id: 'Tarjeta',
                            sub: 'Datáfono',
                            icon: CreditCard,
                            accent: 'hover:border-blue-500',
                            activeClass: '!border-blue-600 !bg-blue-50 text-blue-900 ring-2 ring-blue-600/20',
                          },
                        ].map((mp) => {
                          const IconComp = mp.icon;
                          const esActivo = metodoPagoSeleccionado === mp.id;
                          return (
                            <button
                              key={mp.id}
                              type="button"
                              onClick={() => setMetodoPagoSeleccionado(mp.id)}
                              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 bg-white ${mp.accent} ${
                                esActivo
                                  ? mp.activeClass
                                  : 'border-slate-200/90 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <IconComp className={`w-5 h-5 ${esActivo ? 'text-inherit' : 'text-slate-400'}`} />
                                {esActivo && (
                                  <span className="w-2 h-2 rounded-full bg-current"></span>
                                )}
                              </div>
                              <div>
                                <span className="text-xs font-bold block">{mp.id}</span>
                                <small className="text-[10.5px] opacity-70 block">{mp.sub}</small>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* PASO 2: CÁLCULO DE VUELTAS SI ES EFECTIVO */}
                    {metodoPagoSeleccionado === 'Efectivo' && (
                      <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                          <span className="w-5 h-5 rounded-full bg-[#184A35] text-white flex items-center justify-center text-[10px]">2</span>
                          <span>Cálculo Rápido de Efectivo & Vueltas</span>
                        </div>

                        {/* DISPLAYS DIGITALES */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total</label>
                            <div className="font-mono text-base sm:text-lg font-black text-slate-800 mt-0.5 truncate">
                              ${Number(ventaSeleccionada.total_pedido).toLocaleString('es-CO')}
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border-2 border-[#184A35] shadow-xs">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-[#184A35] block">Recibido</label>
                            <div className="flex items-center mt-0.5">
                              <span className="font-mono text-base font-bold text-slate-500 mr-1">$</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={efectivoRecibido ? efectivoRecibido.toLocaleString('es-CO') : ''}
                                onChange={(e) => {
                                  const soloDigitos = e.target.value.replace(/\D/g, '');
                                  setEfectivoRecibido(soloDigitos ? Number(soloDigitos) : 0);
                                }}
                                className="w-full font-mono text-base sm:text-lg font-black text-slate-900 focus:outline-none bg-transparent"
                                placeholder="0"
                              />
                            </div>
                          </div>

                          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Cambio / Vueltas</label>
                            <div className="font-mono text-base sm:text-lg font-black text-[#184A35] mt-0.5 truncate">
                              ${cambioEfectivo.toLocaleString('es-CO')}
                            </div>
                          </div>
                        </div>

                        {/* BILLETES RÁPIDOS */}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {[10000, 20000, 50000, 100000].map((billete) => (
                            <button
                              key={billete}
                              type="button"
                              onClick={() => setEfectivoRecibido(billete)}
                              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-[#184A35] text-xs font-mono font-bold text-slate-700 hover:text-[#184A35] transition-colors shadow-2xs"
                            >
                              ${(billete / 1000).toFixed(0)}k COP
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setEfectivoRecibido(Number(ventaSeleccionada.total_pedido))}
                            className="px-3 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-xs font-bold text-slate-800 transition-colors"
                          >
                            Exacto
                          </button>
                        </div>
                      </div>
                    )}

                    {/* BANNER TOTAL GRANDE */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-[#184A35] text-white flex items-center justify-between shadow-md">
                      <div>
                        <span className="text-[11px] font-medium text-slate-300 block">
                          Total a Liquidar ({ventaSeleccionada.deportista})
                        </span>
                        <span className="text-xs text-emerald-200">
                          {ventaSeleccionada.mesa_numero ? `Mesa ${ventaSeleccionada.mesa_numero}` : 'Mostrador Barra'}
                        </span>
                      </div>
                      <span className="font-mono text-2xl sm:text-3xl font-black tracking-tight text-white">
                        ${Number(ventaSeleccionada.total_pedido).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>

                  {/* FOOTER COBRO */}
                  <div className="px-5 py-3.5 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <button
                      type="button"
                      onClick={handleEliminarVenta}
                      className="px-3.5 py-2 rounded-xl text-rose-600 border border-rose-200 bg-white hover:bg-rose-50 flex items-center gap-1.5 text-xs font-bold transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Cancelar Cuenta
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                        onClick={() => window.print()}
                      >
                        <Printer className="w-4 h-4" />
                        Imprimir Pre-cuenta
                      </button>
                      <button
                        type="button"
                        className="px-5 py-2.5 rounded-xl bg-[#184A35] hover:bg-[#123828] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
                        onClick={handleConfirmarCobro}
                      >
                        <Check className="w-4 h-4" />
                        Confirmar y Liquidar Cuenta
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ========================================================================= */}
              {/* VISTA 3: PEDIDO (MODERNO POS BILLAR: CATÁLOGO IZQ | COMANDA DER)          */}
              {/* ========================================================================= */}
              {!esVentaPagada && !esVentaAnulada && vistaModal === 'pedido' && (
                <>
                  <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5">
                    {/* CINTA DEPORTISTA TITULAR FIJO */}
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl px-3.5 py-2 text-xs">
                      <span className="flex items-center gap-2 text-slate-700 font-semibold">
                        <UserCheck className="w-4 h-4 text-[#184A35]" />
                        <span>Cuenta activa de: <b>{ventaSeleccionada.deportista}</b></span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        <Lock className="w-3 h-3" />
                        Titular asignado
                      </span>
                    </div>

                    {/* GRILLA POS: CATÁLOGO (IZQ) vs COMANDA (DER) */}
                    <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-3.5">
                      {/* COLUMNA IZQUIERDA: MENÚ DE PRODUCTOS (LISTA COMPACTA RÁPIDA CON BOTÓN +) */}
                      <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Menú de Productos
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            Clic o toca para sumar
                          </span>
                        </div>

                        {/* Buscador de producto */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={busquedaProdModal}
                            onChange={(e) => setBusquedaProdModal(e.target.value)}
                            placeholder="Buscar por nombre..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#184A35] text-slate-800 placeholder-slate-400"
                          />
                        </div>

                        {/* Chips de Categorías */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['Todos', 'Cervezas', 'Licores', 'Bebidas', 'Snacks'].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCategoriaActiva(cat)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                                categoriaActiva === cat
                                  ? '!bg-[#184A35] !text-white shadow-2xs'
                                  : '!bg-white !text-slate-600 border border-slate-200/90 hover:!bg-slate-100'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Lista Compacta de Productos (Fila estilizada con precio, badge y botón agregar) */}
                        <div className="h-[290px] max-h-[290px] overflow-y-auto pr-1 space-y-1.5">
                          {productosFiltradosModal.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                              <Beer className="w-6 h-6 stroke-1 text-slate-300 mb-1" />
                              <span className="text-xs font-medium">No se encontraron productos</span>
                            </div>
                          ) : (
                            productosFiltradosModal.map((prod) => {
                              const enLista = itemsEdicion.find((i) => i.producto_id === prod.id);
                              return (
                                <div
                                  key={prod.id}
                                  onClick={() => handleSeleccionarTarjetaProducto(prod)}
                                  className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all select-none group ${
                                    enLista
                                      ? 'bg-emerald-50/80 border-[#184A35]/50 shadow-2xs'
                                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                        enLista
                                          ? 'bg-[#184A35] text-white'
                                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800'
                                      }`}
                                    >
                                      <Beer className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-xs font-semibold text-slate-800 block truncate group-hover:text-slate-900">
                                        {prod.nombre}
                                      </span>
                                      <span className="text-[10.5px] text-slate-400 block">
                                        {prod.categoria || 'Bar'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-mono text-xs font-bold text-slate-800">
                                      ${Number(prod.precio_venta).toLocaleString('es-CO')}
                                    </span>

                                    {enLista && (
                                      <span className="font-mono text-[10.5px] font-bold text-[#184A35] bg-emerald-100/90 px-1.5 py-0.5 rounded-md border border-[#184A35]/20">
                                        {enLista.cantidad} en cuenta
                                      </span>
                                    )}

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSeleccionarTarjetaProducto(prod);
                                      }}
                                      className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-[#184A35] text-slate-600 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                                      title="Agregar 1 unidad"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* COLUMNA DERECHA: PRODUCTOS EN CUENTA (ESTILO COMANDA TÉRMICA) */}
                      <div className="bg-[#FAF9F5] border border-amber-900/15 rounded-2xl p-3.5 flex flex-col justify-between shadow-xs">
                        <div>
                          <div className="flex items-center justify-between pb-2.5 border-b border-dashed border-slate-300">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              Productos en Cuenta
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {unidadesEditando} uds.
                            </span>
                          </div>

                          {/* Lista con scroll suave para items */}
                          <div className="h-[270px] max-h-[270px] overflow-y-auto pr-1 py-2 space-y-1.5">
                            {itemsEdicion.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                                <ShoppingBag className="w-8 h-8 stroke-1 text-slate-300 mb-1" />
                                <span className="text-xs font-medium">Cuenta sin productos</span>
                                <small className="text-[10px] text-slate-400">Toca productos de la izquierda para agregar</small>
                              </div>
                            ) : (
                              itemsEdicion.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2"
                                >
                                  <div className="min-w-0 flex-1">
                                    <span className="text-xs font-bold text-slate-800 block truncate" title={item.nombre}>
                                      {item.nombre}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono block">
                                      ${item.precio_unitario.toLocaleString('es-CO')} c/u
                                    </span>
                                  </div>

                                  {/* Control Stepper Cantidad */}
                                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleModificarCantidad(idx, -1)}
                                      className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-2xs"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="font-mono text-xs font-bold text-slate-800 w-5 text-center">
                                      {item.cantidad}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleModificarCantidad(idx, 1)}
                                      className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-2xs"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Subtotal del item */}
                                  <span className="font-mono text-xs font-bold text-slate-900 w-16 text-right shrink-0">
                                    ${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}
                                  </span>

                                  {/* Eliminar item */}
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarItemEdicion(idx)}
                                    className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* TOTAL COMANDA */}
                        <div className="pt-2.5 border-t border-dashed border-slate-300 flex items-baseline justify-between shrink-0">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Total Pedido
                          </span>
                          <span className="font-mono text-2xl font-black text-slate-900">
                            ${totalEditando.toLocaleString('es-CO')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FOOTER PEDIDO */}
                  <div className="px-5 py-3.5 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors shadow-2xs"
                      onClick={() => setVistaModal('detalle')}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={guardandoEdicion}
                      onClick={handleGuardarPedido}
                      className="px-5 py-2.5 rounded-xl bg-[#184A35] hover:bg-[#123828] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{guardandoEdicion ? 'Guardando...' : 'Guardar Cambios en Cuenta'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}
  </div>
);
}
