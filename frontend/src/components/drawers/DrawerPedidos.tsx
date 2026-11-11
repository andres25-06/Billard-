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
  Clock,
  RotateCcw,
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
  const [horaActual, setHoraActual] = useState<string>('');

  useEffect(() => {
    const actualizarHora = () => {
      const now = new Date();
      setHoraActual(
        now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    };
    actualizarHora();
    const interval = setInterval(actualizarHora, 10000);
    return () => clearInterval(interval);
  }, [abierto]);

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

  useEffect(() => {
    if (!abierto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCerrar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abierto, onCerrar]);

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

  // Cantidad actual en canasta por producto
  const getCantidadEnCanasta = (prodId: string) => {
    return itemsCanastaArray
      .filter(([, item]) => item.productoId === prodId)
      .reduce((sum, [, item]) => sum + item.cantidad, 0);
  };

  // Icono dinámico según categoría
  const getCategoriaIcon = (catNombre: string) => {
    const n = catNombre.toLowerCase();
    if (n.includes('cerveza')) return <Beer className="w-3.5 h-3.5" />;
    if (n.includes('licor') || n.includes('botella')) return <Wine className="w-3.5 h-3.5" />;
    if (n.includes('bebida') || n.includes('gaseosa') || n.includes('agua')) return <CupSoda className="w-3.5 h-3.5" />;
    if (n.includes('snack') || n.includes('comida') || n.includes('mecato')) return <Flame className="w-3.5 h-3.5" />;
    return <UtensilsCrossed className="w-3.5 h-3.5" />;
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
    <div
      onClick={onCerrar}
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-[960px] bg-[#EDF2F7] shadow-2xl flex flex-row overflow-hidden border-l border-slate-300 font-['Urbanist',sans-serif] cursor-default"
        style={{ animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* ================= LADO IZQUIERDO: TERMINAL DE BAR ================= */}
        <section className="flex-1 flex flex-col h-full bg-[#EDF2F7] border-r border-slate-300 overflow-hidden">
          {/* Header Superior: Barra & Consumo */}
          <div className="p-4 bg-white border-b border-slate-200/90 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5">
              {/* Botón Cerrar X al lado del ícono de la copa */}
              <button
                type="button"
                onClick={onCerrar}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-all shrink-0 active:scale-95 border border-slate-200 shadow-2xs"
                title="Cerrar ventana (Esc o clic afuera)"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Ícono de la copa con el color verde billar (#184A35) */}
              <div className="w-10 h-10 rounded-2xl bg-[#184A35] text-white flex items-center justify-center shadow-sm ring-2 ring-[#184A35]/20 shrink-0">
                <Wine className="w-5 h-5 text-white" />
              </div>

              <div>
                <h3 className="font-extrabold text-base text-[#184A35] tracking-tight leading-none">
                  Barra & Consumo
                </h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-1">
                  Despacho de licores, bebidas y comida
                </p>
              </div>
            </div>

            {/* Buscador de Producto Limpio */}
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                placeholder="Buscar cerveza, ron..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-100/90 text-xs font-semibold text-slate-800 placeholder-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#184A35] focus:bg-white transition-all"
              />
              {busquedaProducto && (
                <button
                  type="button"
                  onClick={() => setBusquedaProducto('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 1. Barra de Herramientas: Destino + Cliente en una sola línea */}
          <div className="px-5 py-2.5 bg-slate-100/80 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
            {/* Destino */}
            <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <span className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Destino:
              </span>
              <button
                type="button"
                onClick={() => onSeleccionarMesa('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                  mesaSeleccionada === ''
                    ? 'bg-[#184A35] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-2xs'
                }`}
              >
                Barra
              </button>
              {mesas
                .filter((m) => m.estado === 'en_juego')
                .map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSeleccionarMesa(m.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                      mesaSeleccionada === m.id
                        ? 'bg-[#184A35] text-white shadow-sm font-black'
                        : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-2xs'
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 text-slate-800 text-xs font-extrabold shadow-2xs transition-all"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
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

          {/* 2. Categorías / Filtros limpios sin scrollbar visible */}
          <div className="px-5 py-2.5 bg-white border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => onSeleccionarCategoria('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                categoriaSeleccionada === ''
                  ? 'bg-[#184A35] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              Todos ({productosActivos.length})
            </button>
            {categoriasActivas.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSeleccionarCategoria(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 ${
                  categoriaSeleccionada === cat.id
                    ? 'bg-[#184A35] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {getCategoriaIcon(cat.nombre)}
                <span>{cat.nombre}</span>
              </button>
            ))}
          </div>

          {/* 3. Grid de Productos Moderno */}
          <div className="flex-1 p-4 overflow-y-auto">
            {productosFiltrados.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Search className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-600">No se encontraron productos</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Intenta con otro término o categoría</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
                {productosFiltrados.map((prod) => {
                  const qtyEnCanasta = getCantidadEnCanasta(prod.id);
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleClicProducto(prod.id)}
                      className={`bg-white rounded-2xl p-3 border transition-all active:scale-[0.97] group text-left flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                        qtyEnCanasta > 0
                          ? 'border-[#184A35]/80 ring-1 ring-[#184A35]/30 bg-[#184A35]/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-tight truncate">
                          {prod.categoria_nombre || 'Producto'}
                        </span>

                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            prod.stock_actual <= 5
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 font-extrabold'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Stock {prod.stock_actual}
                        </span>
                      </div>

                      <div className="my-1">
                        <h4 className="font-bold text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-black min-h-[30px] flex items-center">
                          {prod.nombre}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-sm text-[#1E293B]">
                            ${Number(prod.precio_venta).toLocaleString('es-CO')}
                          </span>
                          {qtyEnCanasta > 0 && (
                            <span className="font-mono font-black text-[10px] px-1.5 py-0.2 rounded-md bg-[#184A35] text-white shadow-2xs">
                              x{qtyEnCanasta}
                            </span>
                          )}
                        </div>

                        <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-[#184A35] group-hover:text-white group-hover:shadow-xs flex items-center justify-center transition-all">
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ================= LADO DERECHO: TICKET DE COMANDA DE LADO A LADO ================= */}
        <section className="w-[390px] bg-[#F7F6F2] flex flex-col h-full shrink-0 shadow-2xl justify-between border-l border-slate-300 relative overflow-hidden font-['Urbanist',sans-serif]">
          
          {/* Header Oscuro Superior de Lado a Lado con Bordes Redondeados Sutiles */}
          <div className="bg-[#18232C] text-white px-5 pt-3 pb-4 relative flex flex-col items-center shrink-0 shadow-md rounded-b-xl">
            {/* Hora y # Comanda a la derecha */}
            <div className="absolute right-5 top-4 text-right">
              <div className="text-[11px] font-semibold text-slate-300 font-mono">
                {horaActual || '10:45 PM'}
              </div>
              <div className="text-[10px] font-mono font-bold text-slate-400">
                #CMD-{mesaActual ? String(mesaActual.numero).padStart(2, '0') : '01'}
              </div>
            </div>

            {/* Badge Verde Billar Mesa en el centro */}
            <div className="w-16 h-12 rounded-2xl bg-[#184A35] text-white flex items-center justify-center font-mono font-black text-2xl shadow-lg shadow-[#184A35]/40 mb-2 mt-1 ring-1 ring-white/20">
              {mesaActual ? String(mesaActual.numero).padStart(2, '0') : 'B'}
            </div>

            {/* Texto de la mesa debajo del badge */}
            <span className="text-xs font-bold text-slate-200 tracking-wide">
              {mesaActual ? `Mesa ${mesaActual.numero} · ${mesaActual.tipo.replace('_', ' ')}` : 'Venta en Barra'}
            </span>
          </div>

          {/* Membrete del Ticket */}
          <div className="pt-3 pb-1 flex flex-col items-center justify-center bg-[#F7F6F2] shrink-0">
            <div className="flex items-center gap-1.5">
              <img
                src="/logo-tocano.jpg"
                alt="El Encuentro Tocano"
                className="w-5 h-5 rounded-full object-cover shadow-2xs"
              />
              <h4 className="font-black text-xs text-[#0F172A] tracking-wider uppercase">
                EL ENCUENTRO TOCANO
              </h4>
            </div>
            <p className="text-[9.5px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
              COMANDA DIGITAL · BILLAR & BAR
            </p>
          </div>

          {/* Muescas laterales de corte superior */}
          <div className="relative py-2 shrink-0 bg-[#F7F6F2] flex items-center justify-center">
            <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#EDF2F7] border border-slate-300/80 shadow-inner" />
            <div className="w-full border-t border-dashed border-slate-300 mx-6" />
            <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#EDF2F7] border border-slate-300/80 shadow-inner" />
          </div>

          {/* Cuerpo del Recibo de Lado a Lado */}
          <div className="flex-1 px-5 py-2 overflow-y-auto flex flex-col gap-2.5 bg-[#F7F6F2]">
            {itemsCanastaArray.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <div className="w-full p-8 rounded-3xl border-2 border-dashed border-slate-300/90 bg-white/70 flex flex-col items-center justify-center shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3 text-slate-500 shadow-inner">
                    <Receipt className="w-7 h-7 text-slate-400" />
                  </div>
                  <b className="text-sm font-extrabold text-[#0F172A]">Ticket Sin Ítems</b>
                  <span className="text-xs text-slate-500 mt-1 max-w-[220px] leading-relaxed">
                    Toca bebidas o snacks del menú a la izquierda para agregarlos a esta orden
                  </span>
                </div>
              </div>
            ) : (
              itemsCanastaArray.map(([itemKey, item], index) => {
                const prod = productosActivos.find((p) => p.id === item.productoId);
                if (!prod) return null;
                const sub = Number(prod.precio_venta) * item.cantidad;

                return (
                  <div
                    key={itemKey}
                    className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col gap-2 hover:shadow-sm transition-all"
                  >
                    {/* Fila Superior: [Index] Nombre ... [- QTY +] */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <h5 className="font-extrabold text-xs text-slate-900 truncate leading-snug">
                          {prod.nombre}
                        </h5>
                      </div>

                      {/* Pill Stepper [- Qty +] */}
                      <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2.5 py-1 bg-slate-50/70 shrink-0">
                        <button
                          type="button"
                          onClick={() => onQuitarDeCanasta(itemKey)}
                          className="text-slate-400 hover:text-slate-900 transition-colors p-0.5 active:scale-90"
                          title="Restar 1"
                        >
                          <Minus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span className="font-mono font-black text-xs min-w-[16px] text-center text-slate-900">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => onAgregarACanasta(item.productoId, item.cuenta, item.jugadorId)}
                          className="text-slate-400 hover:text-slate-900 transition-colors p-0.5 active:scale-90"
                          title="Sumar 1"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>

                    {/* Fila Inferior: [Píldora Jugador] ... $Precio COP */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="border border-slate-300 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-slate-600 bg-white shadow-2xs">
                        {item.cuenta}
                      </span>

                      <span className="font-mono font-black text-xs text-slate-900">
                        ${sub.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Muescas laterales de corte inferior */}
          <div className="relative py-2 shrink-0 bg-[#F7F6F2] flex items-center justify-center">
            <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#EDF2F7] border border-slate-300/80 shadow-inner" />
            <div className="w-full border-t border-dashed border-slate-300 mx-6" />
            <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#EDF2F7] border border-slate-300/80 shadow-inner" />
          </div>

          {/* Resumen Total y Botón de Lado a Lado */}
          <div className="px-5 pt-2 pb-5 bg-[#F7F6F2] flex flex-col gap-2.5 shrink-0 border-t border-slate-200/60">
            <div className="text-center text-xs font-bold text-slate-500">
              {totalItems} {totalItems === 1 ? 'Unidad' : 'Unidades'} | Subtotal: ${totalMonto.toLocaleString('es-CO')}
            </div>

            <div className="text-center py-1">
              <span className="text-2xl font-black font-mono text-[#0F172A] tracking-tight">
                TOTAL: ${totalMonto.toLocaleString('es-CO')}
              </span>
            </div>

            <button
              disabled={totalItems === 0}
              onClick={onEnviarPedido}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all ${
                totalItems > 0
                  ? 'bg-[#184A35] hover:bg-[#123828] text-white shadow-[#184A35]/35 cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <span>
                {mesaActual
                  ? `Cargar a la Mesa · $${totalMonto.toLocaleString('es-CO')}`
                  : `Cobrar en Barra · $${totalMonto.toLocaleString('es-CO')}`}
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
