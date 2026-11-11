'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Beer,
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Store,
  Users,
  Search,
  Check,
  ShoppingCart,
  ChevronDown,
  UserCheck,
  UserPlus,
  Flame,
  Wine,
  CupSoda,
  UtensilsCrossed,
  Receipt,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Mesa } from '../views/ViewMesas';
import { ItemPedidoCanasta } from '@/app/page';
import {
  fetchClientes,
  guardarCliente,
  agregarCuentaSesionMesa,
  eliminarCuentaSesionMesa,
} from '@/lib/api';

export interface Producto {
  id: string;
  categoria_id: string;
  nombre: string;
  precio_venta: number;
  stock_actual: number;
  categoria_nombre: string;
}

export interface Categoria {
  id: string;
  nombre: string;
}

const CATEGORIAS_FALLBACK: Categoria[] = [
  { id: 'cat-cervezas', nombre: 'Cervezas' },
  { id: 'cat-licores', nombre: 'Licores' },
  { id: 'cat-bebidas', nombre: 'Bebidas' },
  { id: 'cat-snacks', nombre: 'Snacks' },
];

const PRODUCTOS_FALLBACK: Producto[] = [
  { id: 'pf-1', categoria_id: 'cat-cervezas', nombre: 'Cerveza Poker 330ml', precio_venta: 4500, stock_actual: 48, categoria_nombre: 'Cervezas' },
  { id: 'pf-2', categoria_id: 'cat-cervezas', nombre: 'Club Colombia Dorada', precio_venta: 5500, stock_actual: 36, categoria_nombre: 'Cervezas' },
  { id: 'pf-3', categoria_id: 'cat-cervezas', nombre: 'Cerveza Águila Light', precio_venta: 4500, stock_actual: 40, categoria_nombre: 'Cervezas' },
  { id: 'pf-4', categoria_id: 'cat-cervezas', nombre: 'Coronita 210ml', precio_venta: 7000, stock_actual: 18, categoria_nombre: 'Cervezas' },
  { id: 'pf-5', categoria_id: 'cat-licores', nombre: 'Media Aguardiente Antioqueño', precio_venta: 48000, stock_actual: 10, categoria_nombre: 'Licores' },
  { id: 'pf-6', categoria_id: 'cat-licores', nombre: 'Botella Ron Viejo de Caldas', precio_venta: 85000, stock_actual: 6, categoria_nombre: 'Licores' },
  { id: 'pf-7', categoria_id: 'cat-bebidas', nombre: 'Coca-Cola 400ml', precio_venta: 4000, stock_actual: 24, categoria_nombre: 'Bebidas' },
  { id: 'pf-8', categoria_id: 'cat-bebidas', nombre: 'Agua Cristal 600ml', precio_venta: 3000, stock_actual: 30, categoria_nombre: 'Bebidas' },
  { id: 'pf-9', categoria_id: 'cat-bebidas', nombre: 'Red Bull Energizante', precio_venta: 9500, stock_actual: 4, categoria_nombre: 'Bebidas' },
  { id: 'pf-10', categoria_id: 'cat-snacks', nombre: 'Empanada de Carne', precio_venta: 3500, stock_actual: 15, categoria_nombre: 'Snacks' },
  { id: 'pf-11', categoria_id: 'cat-snacks', nombre: 'Papas Margarita Grandes', precio_venta: 4500, stock_actual: 12, categoria_nombre: 'Snacks' },
  { id: 'pf-12', categoria_id: 'cat-snacks', nombre: 'Picada Billar (Para 4)', precio_venta: 32000, stock_actual: 5, categoria_nombre: 'Snacks' },
];

interface DrawerPedidosProps {
  abierto: boolean;
  onCerrar: () => void;
  mesas: Mesa[];
  categorias: Categoria[];
  productos: Producto[];
  mesaSeleccionada: string;
  onSeleccionarMesa: (mesaId: string) => void;
  categoriaSeleccionada: string;
  onSeleccionarCategoria: (catId: string) => void;
  canasta: { [itemKey: string]: ItemPedidoCanasta };
  onAgregarACanasta: (prodId: string, cuenta: string, jugadorId?: string) => void;
  onQuitarDeCanasta: (itemKey: string) => void;
  onEliminarItemCanasta: (itemKey: string) => void;
  onEnviarPedido: () => Promise<void>;
}

export default function DrawerPedidos({
  abierto,
  onCerrar,
  mesas,
  categorias,
  productos,
  mesaSeleccionada,
  onSeleccionarMesa,
  categoriaSeleccionada,
  onSeleccionarCategoria,
  canasta,
  onAgregarACanasta,
  onQuitarDeCanasta,
  onEliminarItemCanasta,
  onEnviarPedido,
}: DrawerPedidosProps) {
  const [cuentaActiva, setCuentaActiva] = useState<string>('Mesa');
  const [busquedaProducto, setBusquedaProducto] = useState<string>('');
  
  // Dropdown de clientes
  const [dropdownClienteAbierto, setDropdownClienteAbierto] = useState<boolean>(false);
  const [busquedaCliente, setBusquedaCliente] = useState<string>('');
  const [clientesBD, setClientesBD] = useState<Array<{ id: string; nombre: string; apodo?: string; visitas?: number }>>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [cuentasExtra, setCuentasExtra] = useState<{ [mesaId: string]: string[] }>({});

  useEffect(() => {
    fetchClientes()
      .then((res) => setClientesBD(res.clientes || []))
      .catch((err) => console.error(err));
  }, [abierto]);

  useEffect(() => {
    const handleClickAfuera = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownClienteAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  if (!abierto) return null;

  const categoriasActivas = categorias.length > 0 ? categorias : CATEGORIAS_FALLBACK;
  const productosActivos = productos.length > 0 ? productos : PRODUCTOS_FALLBACK;
  const mesaActual = mesas.find((m) => m.id === mesaSeleccionada);

  const cuentasSesion =
    mesaActual?.sesion?.jugadores?.map((j) => ({
      id: j.id,
      nombre: j.nombre,
      puntos: j.puntos_carambolas,
    })) || [{ id: 'general', nombre: 'Mesa', puntos: 0 }];

  const extras = cuentasExtra[mesaSeleccionada] || [];
  const todasLasCuentasMesa = [
    ...cuentasSesion,
    ...extras.map((nombre) => ({ id: `extra-${nombre}`, nombre, puntos: 0 })),
  ];

  const clientesFiltrados = clientesBD.filter((c) =>
    c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase())
  );
  const existeExacto = clientesBD.some(
    (c) => c.nombre.toLowerCase() === busquedaCliente.trim().toLowerCase()
  );

  const handleSeleccionarOCrearCliente = async (nombreCliente: string) => {
    const limpio = nombreCliente.trim();
    if (!limpio) return;

    const existe = clientesBD.some((c) => c.nombre.toLowerCase() === limpio.toLowerCase());
    if (!existe) {
      try {
        const res = await guardarCliente(limpio);
        if (res?.cliente) {
          setClientesBD((prev) => [res.cliente, ...prev]);
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (mesaSeleccionada) {
      setCuentasExtra((prev) => ({
        ...prev,
        [mesaSeleccionada]: Array.from(new Set([...(prev[mesaSeleccionada] || []), limpio])),
      }));
      try {
        await agregarCuentaSesionMesa(mesaSeleccionada, limpio);
      } catch (e) {
        console.error(e);
      }
    }

    setCuentaActiva(limpio);
    setDropdownClienteAbierto(false);
    setBusquedaCliente('');
  };

  const handleClicProducto = (prodId: string) => {
    const cuentaDestino = mesaSeleccionada ? cuentaActiva : 'Barra';
    const jugadorObj = todasLasCuentasMesa.find(
      (c) => c.nombre.toLowerCase() === cuentaDestino.toLowerCase()
    );
    onAgregarACanasta(prodId, cuentaDestino, jugadorObj?.id);
  };

  const itemsCanastaArray = Object.entries(canasta);
  const totalItems = itemsCanastaArray.reduce((acc, [, item]) => acc + item.cantidad, 0);
  const totalMonto = itemsCanastaArray.reduce((acc, [, item]) => {
    const prod = productosActivos.find((p) => p.id === item.productoId);
    return acc + (prod ? Number(prod.precio_venta) * item.cantidad : 0);
  }, 0);

  const productosFiltrados = productosActivos.filter((p) => {
    const cumpleCat = !categoriaSeleccionada || p.categoria_id === categoriaSeleccionada;
    const cumpleBusqueda = !busquedaProducto.trim() || p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase());
    return cumpleCat && cumpleBusqueda;
  });

  // 4 Favoritos / Despacho Rápido
  const productosRapidos = productosActivos.slice(0, 4);

  // Icono dinámico según categoría
  const getCategoriaIcon = (catNombre: string) => {
    const n = catNombre.toLowerCase();
    if (n.includes('cerveza')) return <Beer className="w-4 h-4" />;
    if (n.includes('licor')) return <Wine className="w-4 h-4" />;
    if (n.includes('bebida') || n.includes('gaseosa')) return <CupSoda className="w-4 h-4" />;
    return <UtensilsCrossed className="w-4 h-4" />;
  };

  // Badge de color por tipo de producto
  const getBadgeColor = (prod: Producto) => {
    const n = prod.categoria_nombre?.toLowerCase() || '';
    if (n.includes('cerveza')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (n.includes('licor')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (n.includes('bebida')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-orange-100 text-orange-800 border-orange-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 select-none">
      <div
        className="h-full w-full max-w-[960px] bg-[#EDF2F7] shadow-2xl flex flex-row overflow-hidden border-l border-slate-300 font-['Urbanist',sans-serif]"
        style={{ animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* ================= LADO IZQUIERDO: TERMINAL DE BAR ================= */}
        <section className="flex-1 flex flex-col h-full bg-[#EDF2F7] border-r border-slate-300 overflow-hidden">
          {/* Header Superior */}
          <div className="p-4 bg-white border-b border-slate-300/80 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#28353E] to-[#45576D] text-white flex items-center justify-center shadow-md">
                <Store className="w-5 h-5 text-[#AAC7D5]" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#28353E] tracking-tight leading-none flex items-center gap-1.5">
                  Barra & Comandas <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 mt-1">
                  Despacho de licores, bebidas y comida
                </p>
              </div>
            </div>

            {/* Buscador de Producto */}
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                placeholder="Buscar cerveza, ron..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-[#28353E] placeholder-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#28353E]"
              />
            </div>
          </div>

          {/* 1. Barra de Herramientas: Destino + Cliente en una sola línea */}
          <div className="px-5 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
            {/* Destino */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0">
                Destino:
              </span>
              <button
                onClick={() => onSeleccionarMesa('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  mesaSeleccionada === ''
                    ? 'bg-[#28353E] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
                }`}
              >
                Barra
              </button>
              {mesas
                .filter((m) => m.estado === 'en_juego')
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSeleccionarMesa(m.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      mesaSeleccionada === m.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
                    }`}
                  >
                    Mesa {m.numero}
                  </button>
                ))}
            </div>

            {/* Selector de Cliente */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownClienteAbierto(!dropdownClienteAbierto)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold shadow-xs transition-all"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>{cuentaActiva === 'Mesa' ? 'Mesa General' : cuentaActiva}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownClienteAbierto && (
                <div className="absolute right-0 top-10 z-50 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 animate-in fade-in duration-150">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      autoFocus
                      type="text"
                      value={busquedaCliente}
                      onChange={(e) => setBusquedaCliente(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && busquedaCliente.trim()) {
                          handleSeleccionarOCrearCliente(busquedaCliente);
                        }
                      }}
                      placeholder="Buscar o registrar..."
                      className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-slate-50 text-xs font-semibold text-slate-800 placeholder-slate-400 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#28353E]"
                    />
                  </div>

                  <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setCuentaActiva('Mesa');
                        setDropdownClienteAbierto(false);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all ${
                        cuentaActiva === 'Mesa' ? 'bg-[#28353E] text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>Mesa General</span>
                      {cuentaActiva === 'Mesa' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    {clientesFiltrados.slice(0, 6).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSeleccionarOCrearCliente(c.nombre)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all ${
                          cuentaActiva.toLowerCase() === c.nombre.toLowerCase() ? 'bg-[#28353E] text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{c.nombre}</span>
                        {cuentaActiva.toLowerCase() === c.nombre.toLowerCase() && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}

                    {busquedaCliente.trim() && !existeExacto && (
                      <button
                        type="button"
                        onClick={() => handleSeleccionarOCrearCliente(busquedaCliente)}
                        className="mt-1 flex items-center justify-center gap-1.5 p-2 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-all"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Crear "{busquedaCliente.trim()}"</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Categorías / Filtros limpios */}
          <div className="px-5 py-2 bg-white border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
            <button
              onClick={() => onSeleccionarCategoria('')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                categoriaSeleccionada === ''
                  ? 'bg-[#28353E] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({productosActivos.length})
            </button>
            {categoriasActivas.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSeleccionarCategoria(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  categoriaSeleccionada === cat.id
                    ? 'bg-[#28353E] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {getCategoriaIcon(cat.nombre)}
                <span>{cat.nombre}</span>
              </button>
            ))}
          </div>

          {/* 3. Grid de Productos Limpio y Proporcionado */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
              {productosFiltrados.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => handleClicProducto(prod.id)}
                  className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs text-left flex flex-col justify-between hover:border-[#28353E] hover:shadow-xs transition-all active:scale-95 group relative"
                >
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">
                      {prod.categoria_nombre || 'Producto'}
                    </span>

                    <span
                      className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md ${
                        prod.stock_actual <= 5
                          ? 'bg-rose-50 text-rose-700 font-extrabold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Stock {prod.stock_actual}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-800 line-clamp-1 leading-snug group-hover:text-black">
                      {prod.nombre}
                    </h4>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                      <span className="font-mono font-black text-sm text-[#28353E]">
                        ${Number(prod.precio_venta).toLocaleString('es-CO')}
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-[#28353E] group-hover:text-white flex items-center justify-center transition-all">
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ================= LADO DERECHO: TICKET PERFORADO DE COMANDA ================= */}
        <section className="w-[370px] bg-white flex flex-col h-full shrink-0 shadow-xl justify-between border-l border-slate-300 relative">
          
          {/* Cabecera del Ticket */}
          <div className="p-4 bg-gradient-to-r from-[#28353E] to-[#1E293B] text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-mono font-black text-base shadow-sm">
                {mesaActual ? String(mesaActual.numero).padStart(2, '0') : 'B'}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white tracking-tight leading-none">
                  {mesaActual ? `Ticket Mesa ${mesaActual.numero}` : 'Venta en Barra'}
                </h3>
                <p className="text-[10.5px] font-semibold text-slate-300 mt-1 uppercase tracking-wider">
                  {mesaActual ? `${mesaActual.tipo.replace('_', ' ')} · Comanda` : 'Despacho directo'}
                </p>
              </div>
            </div>

            <button
              onClick={onCerrar}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Borde Perforado Dentado estilo papel térmico */}
          <div className="w-full h-2 receipt-serrated shrink-0 bg-white" />

          {/* Cuerpo del Recibo: Lista de Ítems */}
          <div className="flex-1 px-4 py-2 overflow-y-auto flex flex-col gap-2">
            {itemsCanastaArray.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3 border border-slate-200 shadow-inner">
                  <Receipt className="w-7 h-7 text-slate-300" />
                </div>
                <b className="text-sm font-bold text-slate-700">Ticket Sin Ítems</b>
                <span className="text-[11px] text-slate-400 mt-1 max-w-[190px]">
                  Toca las bebidas del catálogo para incluirlas en la orden
                </span>
              </div>
            ) : (
              itemsCanastaArray.map(([itemKey, item]) => {
                const prod = productosActivos.find((p) => p.id === item.productoId);
                if (!prod) return null;
                const sub = Number(prod.precio_venta) * item.cantidad;

                return (
                  <div
                    key={itemKey}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200 gap-2 shadow-2xs"
                  >
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-[#28353E] truncate leading-tight">
                        {prod.nombre}
                      </h5>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {item.cuenta}
                        </span>
                        <span className="font-mono text-[10.5px] text-slate-500">
                          ${Number(prod.precio_venta).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>

                    {/* Controles + / - */}
                    <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-slate-300 shrink-0">
                      <button
                        onClick={() => onQuitarDeCanasta(itemKey)}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-black text-xs min-w-[16px] text-center text-[#28353E]">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => onAgregarACanasta(item.productoId, item.cuenta, item.jugadorId)}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:bg-emerald-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right shrink-0">
                      <b className="font-mono text-xs font-black text-[#28353E]">
                        ${sub.toLocaleString('es-CO')}
                      </b>
                    </div>

                    <button
                      onClick={() => onEliminarItemCanasta(itemKey)}
                      className="text-slate-300 hover:text-rose-600 p-1 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Resumen Total y Botón de Envío */}
          <div className="p-4 bg-[#F8FAFC] border-t border-slate-300 flex flex-col gap-3 shrink-0">
            <div className="flex justify-between text-xs text-slate-600 font-semibold">
              <span>Total de unidades:</span>
              <b className="font-mono text-slate-900">{totalItems}</b>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-black text-[#28353E] uppercase tracking-wider">Total a Cargar:</span>
              <span className="text-2xl font-black font-mono text-emerald-700">
                ${totalMonto.toLocaleString('es-CO')}
              </span>
            </div>

            <button
              disabled={totalItems === 0}
              onClick={onEnviarPedido}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all ${
                totalItems > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 shadow-emerald-700/20 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Cargar a la Mesa · ${totalMonto.toLocaleString('es-CO')}</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
