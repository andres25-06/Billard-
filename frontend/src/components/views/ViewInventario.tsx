'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Minus,
  Search,
  Beer,
  Wine,
  Coffee,
  Cookie,
  TrendingUp,
  DollarSign,
  Layers,
  CheckCircle2,
  X,
  Save,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Building2,
  Coins,
} from 'lucide-react';
import {
  fetchProductos,
  guardarProducto,
  actualizarProductoApi,
  eliminarProductoApi,
} from '@/lib/api';

export interface ProductoInventario {
  id: string;
  categoria_id?: string;
  codigo_barras?: string;
  nombre: string;
  descripcion?: string;
  categoria_nombre: string;
  precio_venta: number;
  precio_costo: number;
  stock_actual: number;
  stock_minimo: number;
  proveedor?: string;
  activo?: boolean;
}

const PRODUCTOS_MOCK_FALLBACK: ProductoInventario[] = [
  {
    id: 'p-1',
    nombre: 'Cerveza Club Colombia Dorada',
    categoria_nombre: 'Cervezas',
    codigo_barras: '7702004001',
    precio_venta: 7000,
    precio_costo: 3800,
    stock_actual: 42,
    stock_minimo: 24,
    proveedor: 'Bavaria S.A.',
    activo: true,
  },
  {
    id: 'p-2',
    nombre: 'Cerveza Poker 330ml',
    categoria_nombre: 'Cervezas',
    codigo_barras: '7702004002',
    precio_venta: 6000,
    precio_costo: 3200,
    stock_actual: 14,
    stock_minimo: 30,
    proveedor: 'Bavaria S.A.',
    activo: true,
  },
  {
    id: 'p-3',
    nombre: 'Cerveza Corona 355ml',
    categoria_nombre: 'Cervezas',
    codigo_barras: '7702004003',
    precio_venta: 9000,
    precio_costo: 5200,
    stock_actual: 8,
    stock_minimo: 18,
    proveedor: 'Bavaria S.A.',
    activo: true,
  },
  {
    id: 'p-4',
    nombre: 'Cerveza Águila Light 330ml',
    categoria_nombre: 'Cervezas',
    codigo_barras: '7702004004',
    precio_venta: 5500,
    precio_costo: 3000,
    stock_actual: 28,
    stock_minimo: 24,
    proveedor: 'Bavaria S.A.',
    activo: true,
  },
  {
    id: 'p-5',
    nombre: 'Aguardiente Antioqueño Media (375ml)',
    categoria_nombre: 'Licores',
    codigo_barras: '7702004005',
    precio_venta: 45000,
    precio_costo: 26000,
    stock_actual: 9,
    stock_minimo: 6,
    proveedor: 'FLA Distribuidor',
    activo: true,
  },
  {
    id: 'p-6',
    nombre: 'Ron Medellín Añejo Media',
    categoria_nombre: 'Licores',
    codigo_barras: '7702004006',
    precio_venta: 48000,
    precio_costo: 28000,
    stock_actual: 5,
    stock_minimo: 6,
    proveedor: 'FLA Distribuidor',
    activo: true,
  },
  {
    id: 'p-7',
    nombre: 'Whisky Old Parr 750ml (Botella)',
    categoria_nombre: 'Licores',
    codigo_barras: '7702004007',
    precio_venta: 165000,
    precio_costo: 105000,
    stock_actual: 4,
    stock_minimo: 3,
    proveedor: 'Diageo Colombia',
    activo: true,
  },
  {
    id: 'p-8',
    nombre: 'Red Bull Energizante 250ml',
    categoria_nombre: 'Bebidas',
    codigo_barras: '7702004008',
    precio_venta: 9500,
    precio_costo: 5500,
    stock_actual: 18,
    stock_minimo: 12,
    proveedor: 'Red Bull Co.',
    activo: true,
  },
  {
    id: 'p-9',
    nombre: 'Coca-Cola 400ml Pet',
    categoria_nombre: 'Bebidas',
    codigo_barras: '7702004009',
    precio_venta: 4000,
    precio_costo: 2100,
    stock_actual: 32,
    stock_minimo: 20,
    proveedor: 'FEMSA Coca-Cola',
    activo: true,
  },
  {
    id: 'p-10',
    nombre: 'Agua Cristal con Gas 600ml',
    categoria_nombre: 'Bebidas',
    codigo_barras: '7702004010',
    precio_venta: 4000,
    precio_costo: 1600,
    stock_actual: 22,
    stock_minimo: 15,
    proveedor: 'Postobón S.A.',
    activo: true,
  },
  {
    id: 'p-11',
    nombre: 'Papas Margarita Pollo / Natural',
    categoria_nombre: 'Snacks',
    codigo_barras: '7702004011',
    precio_venta: 4500,
    precio_costo: 2600,
    stock_actual: 16,
    stock_minimo: 15,
    proveedor: 'Pepsico Snacks',
    activo: true,
  },
  {
    id: 'p-12',
    nombre: 'Empanada de Carne Tocana',
    categoria_nombre: 'Snacks',
    codigo_barras: '7702004012',
    precio_venta: 3500,
    precio_costo: 1800,
    stock_actual: 7,
    stock_minimo: 12,
    proveedor: 'Cocina El Encuentro',
    activo: true,
  },
];

export default function ViewInventario() {
  const [productos, setProductos] = useState<ProductoInventario[]>(PRODUCTOS_MOCK_FALLBACK);
  const [cargando, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todos');
  const [soloBajoStock, setSoloBajoStock] = useState<boolean>(false);
  const [mostrarInactivos, setMostrarInactivos] = useState<boolean>(false);

  // Modal para Crear Nuevo Producto
  const [modalCrear, setModalCrear] = useState<boolean>(false);
  const [nuevoProd, setNuevoProd] = useState<{
    nombre: string;
    categoria_nombre: string;
    precio_venta: number;
    precio_costo: number;
    stock_actual: number;
    stock_minimo: number;
    proveedor: string;
    activo: boolean;
  }>({
    nombre: '',
    categoria_nombre: 'Cervezas',
    precio_venta: 6000,
    precio_costo: 3200,
    stock_actual: 24,
    stock_minimo: 12,
    proveedor: '',
    activo: true,
  });

  // Modal para Editar producto
  const [modalEditar, setModalEditar] = useState<{
    abierto: boolean;
    producto: ProductoInventario | null;
    nombre: string;
    categoria_nombre: string;
    precio_venta: number;
    precio_costo: number;
    stock_actual: number;
    stock_minimo: number;
    activo: boolean;
  }>({
    abierto: false,
    producto: null,
    nombre: '',
    categoria_nombre: '',
    precio_venta: 0,
    precio_costo: 0,
    stock_actual: 0,
    stock_minimo: 10,
    activo: true,
  });

  // Modal de confirmación para eliminar
  const [modalEliminar, setModalEliminar] = useState<{
    abierto: boolean;
    producto: ProductoInventario | null;
  }>({
    abierto: false,
    producto: null,
  });

  const cargarProductos = async () => {
    try {
      const data = await fetchProductos(undefined, true);
      if (data?.productos && data.productos.length > 0) {
        setProductos(data.productos);
      }
    } catch {
      // Fallback a mock local
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // KPIs de inventario de bar
  const kpis = useMemo(() => {
    const activos = productos.filter((p) => p.activo !== false);
    const inactivos = productos.filter((p) => p.activo === false);
    const totalItems = activos.length;
    const totalUnidades = activos.reduce((sum, p) => sum + Number(p.stock_actual || 0), 0);
    const valorCosto = activos.reduce(
      (sum, p) => sum + Number(p.stock_actual || 0) * Number(p.precio_costo || 0),
      0
    );
    const valorVentaProyectado = activos.reduce(
      (sum, p) => sum + Number(p.stock_actual || 0) * Number(p.precio_venta || 0),
      0
    );
    const bajoStock = activos.filter((p) => p.stock_actual <= p.stock_minimo);
    const gananciaEstimada = valorVentaProyectado - valorCosto;

    return {
      totalItems,
      inactivosCount: inactivos.length,
      totalUnidades,
      valorCosto,
      valorVentaProyectado,
      gananciaEstimada,
      bajoStockCount: bajoStock.length,
      bajoStock,
    };
  }, [productos]);

  // Filtros de tabla
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      if (!mostrarInactivos && p.activo === false) {
        return false;
      }
      if (mostrarInactivos && p.activo !== false) {
        return false;
      }
      if (categoriaFiltro !== 'Todos' && p.categoria_nombre !== categoriaFiltro) {
        return false;
      }
      if (soloBajoStock && p.stock_actual > p.stock_minimo) {
        return false;
      }
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const matchNombre = p.nombre.toLowerCase().includes(q);
        const matchCat = (p.categoria_nombre || '').toLowerCase().includes(q);
        const matchProv = (p.proveedor || '').toLowerCase().includes(q);
        const matchCod = (p.codigo_barras || '').toLowerCase().includes(q);
        return matchNombre || matchCat || matchProv || matchCod;
      }
      return true;
    });
  }, [productos, categoriaFiltro, soloBajoStock, mostrarInactivos, busqueda]);

  // Entrada rápida de stock (+6 / +24)
  const handleAjustarStock = async (prodId: string, delta: number) => {
    setProductos((prev) =>
      prev.map((p) => {
        if (p.id === prodId) {
          const nuevoStock = Math.max(0, p.stock_actual + delta);
          return { ...p, stock_actual: nuevoStock };
        }
        return p;
      })
    );

    try {
      await fetch(`http://localhost:8000/api/productos/${prodId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad: delta, motivo: 'reposicion_rapida' }),
      });
    } catch {}
  };

  // Crear producto
  const handleCrearProducto = async () => {
    if (!nuevoProd.nombre.trim()) {
      alert('Ingresa el nombre del producto');
      return;
    }

    const payload = {
      nombre: nuevoProd.nombre.trim(),
      categoria_nombre: nuevoProd.categoria_nombre,
      precio_venta: Number(nuevoProd.precio_venta) || 0,
      precio_costo: Number(nuevoProd.precio_costo) || 0,
      stock_actual: Number(nuevoProd.stock_actual) || 0,
      stock_minimo: Number(nuevoProd.stock_minimo) || 10,
      activo: nuevoProd.activo,
    };

    const nuevo: ProductoInventario = {
      id: `p-nuevo-${Date.now()}`,
      ...payload,
      proveedor: nuevoProd.proveedor.trim() || 'Proveedor Local',
    };

    setProductos((prev) => [nuevo, ...prev]);
    setModalCrear(false);
    setNuevoProd({
      nombre: '',
      categoria_nombre: 'Cervezas',
      precio_venta: 6000,
      precio_costo: 3200,
      stock_actual: 24,
      stock_minimo: 12,
      proveedor: '',
      activo: true,
    });

    try {
      await guardarProducto(payload);
    } catch {}
  };

  // Abrir modal de edición
  const handleAbrirEdicion = (prod: ProductoInventario) => {
    setModalEditar({
      abierto: true,
      producto: prod,
      nombre: prod.nombre,
      categoria_nombre: prod.categoria_nombre,
      precio_venta: prod.precio_venta,
      precio_costo: prod.precio_costo,
      stock_actual: prod.stock_actual,
      stock_minimo: prod.stock_minimo,
      activo: prod.activo !== false,
    });
  };

  // Guardar edición
  const handleGuardarEdicion = async () => {
    if (!modalEditar.producto) return;
    const prodId = modalEditar.producto.id;

    const actualizados: ProductoInventario = {
      ...modalEditar.producto,
      nombre: modalEditar.nombre.trim(),
      precio_venta: Number(modalEditar.precio_venta),
      precio_costo: Number(modalEditar.precio_costo),
      stock_actual: Number(modalEditar.stock_actual),
      stock_minimo: Number(modalEditar.stock_minimo),
      activo: modalEditar.activo,
    };

    setProductos((prev) => prev.map((p) => (p.id === prodId ? actualizados : p)));
    setModalEditar({
      abierto: false,
      producto: null,
      nombre: '',
      categoria_nombre: '',
      precio_venta: 0,
      precio_costo: 0,
      stock_actual: 0,
      stock_minimo: 10,
      activo: true,
    });

    try {
      await actualizarProductoApi(prodId, {
        nombre: actualizados.nombre,
        precio_venta: actualizados.precio_venta,
        precio_costo: actualizados.precio_costo,
        stock_minimo: actualizados.stock_minimo,
        activo: actualizados.activo,
      });
    } catch {}
  };

  // Confirmar eliminación
  const handleConfirmarEliminacion = async () => {
    const prod = modalEliminar.producto;
    if (!prod) return;

    setProductos((prev) => prev.filter((p) => p.id !== prod.id));
    setModalEliminar({ abierto: false, producto: null });

    if (modalEditar.abierto && modalEditar.producto?.id === prod.id) {
      setModalEditar({
        abierto: false,
        producto: null,
        nombre: '',
        categoria_nombre: '',
        precio_venta: 0,
        precio_costo: 0,
        stock_actual: 0,
        stock_minimo: 10,
        activo: true,
      });
    }

    try {
      await eliminarProductoApi(prod.id);
    } catch {}
  };

  const getIconoCategoria = (cat: string) => {
    switch (cat) {
      case 'Cervezas':
        return <Beer className="w-4 h-4 text-amber-600" />;
      case 'Licores':
        return <Wine className="w-4 h-4 text-rose-600" />;
      case 'Bebidas':
        return <Coffee className="w-4 h-4 text-sky-600" />;
      case 'Snacks':
        return <Cookie className="w-4 h-4 text-orange-600" />;
      default:
        return <Package className="w-4 h-4 text-emerald-700" />;
    }
  };

  return (
    <div className="w-full pb-12 space-y-6">
      {/* ================= 1. CABECERA Y KPIS SUPERIORES ================= */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI 1: Total Artículos y Unidades */}
        <div
          onClick={() => setMostrarInactivos(false)}
          className={`cursor-pointer rounded-2xl border shadow-2xs p-4 flex items-center justify-between hover:shadow-xs transition-all ${
            !mostrarInactivos ? 'bg-white border-slate-200/90' : 'bg-slate-50 border-slate-200 opacity-75'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Total en Catálogo</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                  {kpis.totalItems} activos
                </span>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {kpis.totalUnidades} uds
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Alertas de Stock Bajo */}
        <div
          onClick={() => {
            setMostrarInactivos(false);
            setSoloBajoStock(!soloBajoStock);
          }}
          className={`cursor-pointer rounded-2xl border shadow-2xs p-4 flex items-center justify-between transition-all ${
            kpis.bajoStockCount > 0
              ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
              : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                kpis.bajoStockCount > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-[#184A35]'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">
                Stock Bajo / Reposición
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className={`text-xl font-bold font-mono tracking-tight ${
                    kpis.bajoStockCount > 0 ? 'text-rose-700' : 'text-[#184A35]'
                  }`}
                >
                  {kpis.bajoStockCount} alertas
                </span>
                <span
                  className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                    soloBajoStock
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {soloBajoStock ? 'Filtro Activo' : 'Ver cuáles'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Valoración al Costo */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between hover:shadow-xs transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Inversión en Bodega</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                  ${kpis.valorCosto.toLocaleString('es-CO')}
                </span>
              </div>
              <span className="text-[10.5px] text-slate-400 block mt-0.5">Costo total inventario</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Proyección en Venta */}
        <div className="bg-white rounded-2xl border border-emerald-200/90 shadow-2xs p-4 flex items-center justify-between hover:shadow-xs transition-all bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-[#184A35] flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-[#184A35]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Proyección en Barra</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold font-mono text-[#184A35] tracking-tight">
                  ${kpis.valorVentaProyectado.toLocaleString('es-CO')}
                </span>
              </div>
              <span className="text-[10.5px] font-semibold text-emerald-800 block mt-0.5">
                Margen est.: +${kpis.gananciaEstimada.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. BARRA DE HERRAMIENTAS Y FILTROS ================= */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Pestañas de categorías + Alerta Stock + Inhabilitados */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {['Todos', 'Cervezas', 'Licores', 'Bebidas', 'Snacks'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategoriaFiltro(cat);
                setSoloBajoStock(false);
                setMostrarInactivos(false);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                categoriaFiltro === cat && !soloBajoStock && !mostrarInactivos
                  ? 'bg-[#184A35] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              setSoloBajoStock(!soloBajoStock);
              setMostrarInactivos(false);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              soloBajoStock && !mostrarInactivos
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Stock Crítico ({kpis.bajoStockCount})</span>
          </button>

          {kpis.inactivosCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setMostrarInactivos(!mostrarInactivos);
                setSoloBajoStock(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                mostrarInactivos
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Inhabilitados ({kpis.inactivosCount})</span>
            </button>
          )}
        </div>

        {/* Buscador + Botón Nuevo Producto */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto o código..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#184A35] text-slate-800 placeholder-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={() => setModalCrear(true)}
            className="px-4 py-2 rounded-xl bg-[#184A35] hover:bg-[#123828] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </section>

      {/* ================= 3. TABLA DE EXISTENCIAS ================= */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Producto & Categoría</th>
                <th className="py-3.5 px-4 font-mono">P. Costo</th>
                <th className="py-3.5 px-4 font-mono">P. Venta</th>
                <th className="py-3.5 px-4">Margen Bruto</th>
                <th className="py-3.5 px-4">Stock en Barra</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Entrada Rápida</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 stroke-1 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No se encontraron productos</p>
                    <p className="text-xs text-slate-400 mt-0.5">Intenta con otro término de búsqueda o categoría</p>
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((prod) => {
                  const esInactivo = prod.activo === false;
                  const esCritico = prod.stock_actual <= prod.stock_minimo;
                  const porcentajeStock = Math.min(
                    100,
                    Math.round((prod.stock_actual / (prod.stock_minimo * 2)) * 100)
                  );
                  const margenPesos = prod.precio_venta - prod.precio_costo;
                  const margenPorc = prod.precio_costo
                    ? Math.round((margenPesos / prod.precio_costo) * 100)
                    : 100;

                  return (
                    <tr
                      key={prod.id}
                      className={`transition-colors group ${
                        esInactivo
                          ? 'bg-slate-50/80 opacity-60 hover:opacity-100'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Producto */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              esInactivo
                                ? 'bg-slate-200 text-slate-400'
                                : 'bg-slate-100 group-hover:bg-emerald-50 text-slate-600 group-hover:text-[#184A35]'
                            }`}
                          >
                            {getIconoCategoria(prod.categoria_nombre)}
                          </div>
                          <div>
                            <span
                              className={`font-bold block text-xs ${
                                esInactivo ? 'line-through text-slate-500' : 'text-slate-900'
                              }`}
                            >
                              {prod.nombre}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10.5px] font-semibold text-slate-500">
                                {prod.categoria_nombre}
                              </span>
                              {prod.codigo_barras && (
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {prod.codigo_barras}
                                </span>
                              )}
                              {esInactivo && (
                                <span className="text-[9.5px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded">
                                  Inhabilitado
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Costo */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-500">
                        ${Number(prod.precio_costo).toLocaleString('es-CO')}
                      </td>

                      {/* Venta */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ${Number(prod.precio_venta).toLocaleString('es-CO')}
                      </td>

                      {/* Margen */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-[#184A35] block">
                          +${margenPesos.toLocaleString('es-CO')}
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                          {margenPorc}% ganancia
                        </span>
                      </td>

                      {/* Nivel de Stock con barra */}
                      <td className="py-3 px-4 w-44">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span
                            className={`font-mono font-black text-sm ${
                              esCritico ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {prod.stock_actual} uds
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            mín: {prod.stock_minimo}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              esCritico
                                ? 'bg-rose-500'
                                : porcentajeStock < 60
                                ? 'bg-amber-500'
                                : 'bg-[#184A35]'
                            }`}
                            style={{ width: `${porcentajeStock}%` }}
                          />
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        {esInactivo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-slate-200 text-slate-700">
                            <EyeOff className="w-3 h-3" />
                            Inactivo
                          </span>
                        ) : esCritico ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Pedir Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-emerald-50 text-[#184A35] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-[#184A35]" />
                            Disponible
                          </span>
                        )}
                      </td>

                      {/* Entrada Rápida de Stock */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAjustarStock(prod.id, 6)}
                            title="Sumar +6 unidades (Six-pack / Paquete)"
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#184A35] hover:text-white font-mono text-xs font-bold text-slate-700 transition-colors shadow-2xs"
                          >
                            +6
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAjustarStock(prod.id, 24)}
                            title="Sumar +24 unidades (Caja completa de cerveza/bebida)"
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-[#184A35] hover:text-white font-mono text-xs font-bold text-[#184A35] transition-colors shadow-2xs border border-emerald-200/60"
                          >
                            +24
                          </button>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAbrirEdicion(prod)}
                            className="p-1.5 rounded-xl border border-slate-200 hover:border-[#184A35] bg-white hover:bg-emerald-50/50 text-slate-600 hover:text-[#184A35] flex items-center justify-center transition-all shadow-2xs active:scale-95"
                            title="Editar producto o inhabilitar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setModalEliminar({ abierto: true, producto: prod })}
                            className="p-1.5 rounded-xl border border-rose-200 hover:border-rose-300 bg-rose-50/50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all shadow-2xs active:scale-95"
                            title="Eliminar producto del catálogo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MODAL: NUEVO PRODUCTO (REDISEÑO POS BILLAR CLUB COMPACTO & ELEGANTE)   */}
      {/* ========================================================================= */}
      {modalCrear && (
        <div
          className="overlay show"
          style={{ zIndex: 75 }}
          onClick={() => setModalCrear(false)}
        >
          <div
            className="modal"
            style={{ width: 'min(580px, 94vw)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header consistente con ViewMesas / ViewPedidos */}
            <div className="m-head" style={{ padding: '16px 22px' }}>
              <div
                className="c-num"
                style={{
                  background: '#184A35',
                  color: '#fff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '14px',
                }}
              >
                +
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--c900)' }}>
                  Nuevo Producto para Barra
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--c400)', margin: 0 }}>
                  Registra un producto en el inventario del billar club
                </p>
              </div>
              <button
                type="button"
                className="x"
                onClick={() => setModalCrear(false)}
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="m-body" style={{ padding: '18px 22px', gap: '16px' }}>
              {/* Paso 1: Información Básica */}
              <div>
                <div className="step" style={{ marginBottom: '8px' }}>
                  <i>1</i> Información del Producto
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--c600)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      value={nuevoProd.nombre}
                      onChange={(e) => setNuevoProd((prev) => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Ej: Cerveza Heineken 330ml, Tequila Don Julio..."
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '12.5px',
                        borderRadius: '10px',
                        border: '1.5px solid var(--line)',
                        background: 'var(--surface)',
                        color: 'var(--c900)',
                        outline: 'none',
                      }}
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--c600)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        Categoría
                      </label>
                      <select
                        value={nuevoProd.categoria_nombre}
                        onChange={(e) => setNuevoProd((prev) => ({ ...prev, categoria_nombre: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          fontSize: '12.5px',
                          borderRadius: '10px',
                          border: '1.5px solid var(--line)',
                          background: 'var(--surface)',
                          color: 'var(--c900)',
                          outline: 'none',
                        }}
                      >
                        <option value="Cervezas">Cervezas</option>
                        <option value="Licores">Licores</option>
                        <option value="Bebidas">Bebidas no alcohólicas</option>
                        <option value="Snacks">Snacks / Pasabocas</option>
                        <option value="Otros">Otros</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--c600)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        Proveedor
                      </label>
                      <input
                        type="text"
                        value={nuevoProd.proveedor}
                        onChange={(e) => setNuevoProd((prev) => ({ ...prev, proveedor: e.target.value }))}
                        placeholder="Ej: Bavaria, Postobón, FLA..."
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          fontSize: '12.5px',
                          borderRadius: '10px',
                          border: '1.5px solid var(--line)',
                          background: 'var(--surface)',
                          color: 'var(--c900)',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 2: Precios y Márgenes */}
              <div>
                <div className="step" style={{ marginBottom: '8px' }}>
                  <i>2</i> Precios y Ganancia
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'var(--soft)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--c400)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Precio Costo (COP)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid var(--line)', borderRadius: '8px', padding: '6px 10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c400)', marginRight: '4px' }}>$</span>
                      <input
                        type="number"
                        value={nuevoProd.precio_costo}
                        onChange={(e) => setNuevoProd((prev) => ({ ...prev, precio_costo: Number(e.target.value) }))}
                        style={{
                          width: '100%',
                          border: 'none',
                          outline: 'none',
                          fontSize: '14px',
                          fontWeight: 700,
                          fontFamily: 'JetBrains Mono, monospace',
                          color: 'var(--c800)',
                          background: 'transparent',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#184A35', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Precio Venta Barra (COP) *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '2px solid #184A35', borderRadius: '8px', padding: '6px 10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#184A35', marginRight: '4px' }}>$</span>
                      <input
                        type="number"
                        value={nuevoProd.precio_venta}
                        onChange={(e) => setNuevoProd((prev) => ({ ...prev, precio_venta: Number(e.target.value) }))}
                        style={{
                          width: '100%',
                          border: 'none',
                          outline: 'none',
                          fontSize: '15px',
                          fontWeight: 800,
                          fontFamily: 'JetBrains Mono, monospace',
                          color: 'var(--c900)',
                          background: 'transparent',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 3: Existencias */}
              <div>
                <div className="step" style={{ marginBottom: '8px' }}>
                  <i>3</i> Control de Existencias
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--c600)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Stock Inicial (uds)
                    </label>
                    <input
                      type="number"
                      value={nuevoProd.stock_actual}
                      onChange={(e) => setNuevoProd((prev) => ({ ...prev, stock_actual: Number(e.target.value) }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '13px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700,
                        borderRadius: '10px',
                        border: '1.5px solid var(--line)',
                        background: 'var(--surface)',
                        color: 'var(--c900)',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--c600)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Mínimo de Alerta
                    </label>
                    <input
                      type="number"
                      value={nuevoProd.stock_minimo}
                      onChange={(e) => setNuevoProd((prev) => ({ ...prev, stock_minimo: Number(e.target.value) }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '13px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700,
                        borderRadius: '10px',
                        border: '1.5px solid var(--line)',
                        background: 'var(--surface)',
                        color: 'var(--c900)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="m-foot" style={{ padding: '14px 22px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setModalCrear(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-ok"
                style={{ background: '#184A35' }}
                onClick={handleCrearProducto}
              >
                <Plus className="w-4 h-4" />
                <span>Guardar Producto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: EDITAR PRODUCTO (CON INTERRUPTOR MODERNO Y CONTROL STEPPER)     */}
      {/* ========================================================================= */}
      {modalEditar.abierto && modalEditar.producto && (
        <div
          className="overlay show"
          style={{ zIndex: 75 }}
          onClick={() =>
            setModalEditar({
              abierto: false,
              producto: null,
              nombre: '',
              categoria_nombre: '',
              precio_venta: 0,
              precio_costo: 0,
              stock_actual: 0,
              stock_minimo: 10,
              activo: true,
            })
          }
        >
          <div
            className="modal"
            style={{ width: 'min(580px, 94vw)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="m-head" style={{ padding: '16px 22px' }}>
              <div
                className="c-num"
                style={{
                  background: modalEditar.activo ? '#184A35' : '#64748B',
                  color: '#fff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Edit className="w-4 h-4" />
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--c900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {modalEditar.nombre || modalEditar.producto.nombre}
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--c400)', margin: 0 }}>
                  Ficha técnica y disponibilidad en la barra
                </p>
              </div>
              <button
                type="button"
                className="x"
                onClick={() =>
                  setModalEditar({
                    abierto: false,
                    producto: null,
                    nombre: '',
                    categoria_nombre: '',
                    precio_venta: 0,
                    precio_costo: 0,
                    stock_actual: 0,
                    stock_minimo: 10,
                    activo: true,
                  })
                }
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="m-body" style={{ padding: '18px 22px', gap: '16px' }}>
              {/* Tarjeta de Interruptor Inhabilitar / Habilitar */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: modalEditar.activo ? 'rgba(24, 74, 53, 0.06)' : 'rgba(224, 83, 95, 0.08)',
                  border: `1px solid ${modalEditar.activo ? '#184A35' : 'rgba(224, 83, 95, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: modalEditar.activo ? 'rgba(24, 74, 53, 0.15)' : 'rgba(224, 83, 95, 0.15)',
                      color: modalEditar.activo ? '#184A35' : '#E0535F',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {modalEditar.activo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <b style={{ fontSize: '12px', color: modalEditar.activo ? '#184A35' : '#E0535F', display: 'block' }}>
                      {modalEditar.activo ? 'Producto Habilitado' : 'Producto Inhabilitado'}
                    </b>
                    <span style={{ fontSize: '11px', color: 'var(--c600)', display: 'block' }}>
                      {modalEditar.activo
                        ? 'Visible para pedidos en mesas y mostrador'
                        : 'Oculto de la carta y pedidos'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalEditar((prev) => ({ ...prev, activo: !prev.activo }))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: modalEditar.activo ? 'rgba(224, 83, 95, 0.4)' : '#184A35',
                    background: modalEditar.activo ? '#fff' : '#184A35',
                    color: modalEditar.activo ? '#E0535F' : '#fff',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {modalEditar.activo ? 'Inhabilitar' : 'Habilitar'}
                </button>
              </div>

              {/* Nombre */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--c600)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  value={modalEditar.nombre}
                  onChange={(e) => setModalEditar((prev) => ({ ...prev, nombre: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '10px',
                    border: '1.5px solid var(--line)',
                    background: 'var(--surface)',
                    color: 'var(--c900)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Precios */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'var(--soft)',
                  border: '1px solid var(--line)',
                }}
              >
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--c400)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Precio Costo (COP)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid var(--line)', borderRadius: '8px', padding: '6px 10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c400)', marginRight: '4px' }}>$</span>
                    <input
                      type="number"
                      value={modalEditar.precio_costo}
                      onChange={(e) => setModalEditar((prev) => ({ ...prev, precio_costo: Number(e.target.value) }))}
                      style={{
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        fontSize: '14px',
                        fontWeight: 700,
                        fontFamily: 'JetBrains Mono, monospace',
                        color: 'var(--c800)',
                        background: 'transparent',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#184A35', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Precio Venta Barra (COP)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '2px solid #184A35', borderRadius: '8px', padding: '6px 10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#184A35', marginRight: '4px' }}>$</span>
                    <input
                      type="number"
                      value={modalEditar.precio_venta}
                      onChange={(e) => setModalEditar((prev) => ({ ...prev, precio_venta: Number(e.target.value) }))}
                      style={{
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        fontSize: '15px',
                        fontWeight: 800,
                        fontFamily: 'JetBrains Mono, monospace',
                        color: 'var(--c900)',
                        background: 'transparent',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Stock Actual con stepper y Stock Mínimo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--c600)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Stock Actual en Barra
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--surface)',
                      border: '1.5px solid var(--line)',
                      borderRadius: '10px',
                      padding: '3px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setModalEditar((prev) => ({ ...prev, stock_actual: Math.max(0, prev.stock_actual - 1) }))}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '7px',
                        background: 'var(--soft)',
                        border: 'none',
                        color: 'var(--c800)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={modalEditar.stock_actual}
                      onChange={(e) => setModalEditar((prev) => ({ ...prev, stock_actual: Number(e.target.value) }))}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        border: 'none',
                        outline: 'none',
                        fontSize: '14px',
                        fontWeight: 800,
                        fontFamily: 'JetBrains Mono, monospace',
                        color: 'var(--c900)',
                        background: 'transparent',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setModalEditar((prev) => ({ ...prev, stock_actual: prev.stock_actual + 1 }))}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '7px',
                        background: 'var(--soft)',
                        border: 'none',
                        color: 'var(--c800)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--c600)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Mínimo Alerta
                  </label>
                  <input
                    type="number"
                    value={modalEditar.stock_minimo}
                    onChange={(e) => setModalEditar((prev) => ({ ...prev, stock_minimo: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 700,
                      borderRadius: '10px',
                      border: '1.5px solid var(--line)',
                      background: 'var(--surface)',
                      color: 'var(--c900)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="m-foot" style={{ padding: '14px 22px', display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setModalEliminar({ abierto: true, producto: modalEditar.producto })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(224, 83, 95, 0.4)',
                  background: '#fff',
                  color: '#E0535F',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Producto</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    setModalEditar({
                      abierto: false,
                      producto: null,
                      nombre: '',
                      categoria_nombre: '',
                      precio_venta: 0,
                      precio_costo: 0,
                      stock_actual: 0,
                      stock_minimo: 10,
                      activo: true,
                    })
                  }
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-ok"
                  style={{ background: '#184A35' }}
                  onClick={handleGuardarEdicion}
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: CONFIRMACIÓN DE ELIMINACIÓN                                     */}
      {/* ========================================================================= */}
      {modalEliminar.abierto && modalEliminar.producto && (
        <div
          className="overlay show"
          style={{ zIndex: 85 }}
          onClick={() => setModalEliminar({ abierto: false, producto: null })}
        >
          <div
            className="modal"
            style={{ width: 'min(420px, 92vw)', textAlign: 'center', padding: '24px 22px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(224, 83, 95, 0.12)',
                color: '#E0535F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--c900)', margin: '0 0 6px' }}>
              ¿Eliminar {modalEliminar.producto.nombre}?
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--c600)', margin: '0 0 20px', lineHeight: 1.45 }}>
              El producto se removerá del catálogo activo. Las ventas pasadas registradas en caja se conservarán intactas.
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1, padding: '10px' }}
                onClick={() => setModalEliminar({ abierto: false, producto: null })}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminacion}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  background: '#E0535F',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
