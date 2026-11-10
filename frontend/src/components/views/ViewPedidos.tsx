'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, Check, Clock, AlertCircle, Trash2, Pencil, X, Plus, Minus, Save, ShoppingBag } from 'lucide-react';
import { eliminarPedido, editarPedido, fetchProductos } from '@/lib/api';

interface PedidoItem {
  id: string;
  producto_id?: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  nota?: string;
  jugador_id?: string;
}

interface Pedido {
  id: string;
  codigo_pedido: string;
  mesa_numero?: number;
  origen: string;
  estado: string;
  total_pedido: number;
  solicitado_el: string;
  nota?: string;
  items: PedidoItem[];
}

export default function ViewPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<string>('todos');
  const [cargando, setCargando] = useState<boolean>(true);

  // Estado para modal de edición
  const [pedidoAEditar, setPedidoAEditar] = useState<Pedido | null>(null);
  const [itemsEdicion, setItemsEdicion] = useState<Array<{ producto_id: string; nombre: string; cantidad: number; precio_unitario: number; nota?: string }>>([]);
  const [productosDisponibles, setProductosDisponibles] = useState<Array<{ id: string; nombre: string; precio_venta: number }>>([]);
  const [productoAAgregarId, setProductoAAgregarId] = useState<string>('');
  const [cuentaNuevoItem, setCuentaNuevoItem] = useState<string>('Mesa');
  const [guardandoEdicion, setGuardandoEdicion] = useState<boolean>(false);

  const cargarPedidos = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/pedidos');
      const data = await res.json();
      setPedidos(data.pedidos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
    const interval = setInterval(cargarPedidos, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchProductos()
      .then((data) => setProductosDisponibles(data.productos || []))
      .catch((err) => console.error(err));
  }, []);

  const handleCambiarEstado = async (pedidoId: string, nuevoEstado: string) => {
    try {
      await fetch(`http://localhost:8000/api/pedidos/${pedidoId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      await cargarPedidos();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEliminar = async (pedido: Pedido) => {
    const seguro = window.confirm(
      `¿Deseas eliminar el pedido ${pedido.codigo_pedido}? Los productos volverán al stock del inventario.`
    );
    if (!seguro) return;

    try {
      await eliminarPedido(pedido.id);
      await cargarPedidos();
      alert(`Pedido ${pedido.codigo_pedido} eliminado con éxito.`);
    } catch (err: any) {
      alert(`Error al eliminar pedido: ${err.message}`);
    }
  };

  const handleAbrirEdicion = (pedido: Pedido) => {
    setPedidoAEditar(pedido);
    setItemsEdicion(
      pedido.items.map((it) => ({
        producto_id: it.producto_id || it.id,
        nombre: it.producto_nombre,
        cantidad: it.cantidad,
        precio_unitario: Number(it.precio_unitario),
        nota: it.nota || 'Mesa',
      }))
    );
    setProductoAAgregarId('');
    setCuentaNuevoItem('Mesa');
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

  const handleAgregarProductoAEdicion = () => {
    if (!productoAAgregarId) return;
    const prod = productosDisponibles.find((p) => p.id === productoAAgregarId);
    if (!prod) return;

    setItemsEdicion((prev) => {
      const existente = prev.find(
        (it) => it.producto_id === prod.id && (it.nota || '') === cuentaNuevoItem
      );
      if (existente) {
        return prev.map((it) =>
          it.producto_id === prod.id && (it.nota || '') === cuentaNuevoItem
            ? { ...it, cantidad: it.cantidad + 1 }
            : it
        );
      }
      return [
        ...prev,
        {
          producto_id: prod.id,
          nombre: prod.nombre,
          cantidad: 1,
          precio_unitario: Number(prod.precio_venta),
          nota: cuentaNuevoItem,
        },
      ];
    });
    setProductoAAgregarId('');
  };

  const handleGuardarCambiosPedido = async () => {
    if (!pedidoAEditar) return;
    if (itemsEdicion.length === 0) {
      alert('El pedido no puede quedar vacío. Si deseas cancelarlo, elimínalo directamente.');
      return;
    }

    setGuardandoEdicion(true);
    try {
      await editarPedido(pedidoAEditar.id, {
        items: itemsEdicion.map((it) => ({
          producto_id: it.producto_id,
          cantidad: it.cantidad,
          nota: it.nota,
        })),
        nota: pedidoAEditar.nota,
        estado: pedidoAEditar.estado,
      });
      setPedidoAEditar(null);
      await cargarPedidos();
      alert('Pedido actualizado correctamente.');
    } catch (err: any) {
      alert(`Error al guardar cambios: ${err.message}`);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const totalEditando = itemsEdicion.reduce(
    (sum, it) => sum + it.precio_unitario * it.cantidad,
    0
  );

  const pedidosFiltrados = pedidos.filter((p) => {
    if (filtro === 'pendiente') return p.estado === 'pendiente';
    if (filtro === 'servido') return p.estado === 'servido';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-sm">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filtro === 'todos' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({pedidos.length})
          </button>
          <button
            onClick={() => setFiltro('pendiente')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filtro === 'pendiente' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFiltro('servido')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filtro === 'servido' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Servidos
          </button>
        </div>
      </div>

      {pedidosFiltrados.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <Receipt className="w-12 h-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No hay pedidos registrados</h4>
          <p className="text-xs text-slate-400 mt-1">Los pedidos solicitados desde las mesas o la barra aparecerán aquí en vivo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pedidosFiltrados.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-xs text-indigo-600">{p.codigo_pedido}</span>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {p.mesa_numero ? `Mesa ${p.mesa_numero}` : 'Venta en Barra'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full ${
                        p.estado === 'pendiente'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {p.estado.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAbrirEdicion(p)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Editar productos o cantidades de este pedido"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminar(p)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar este pedido permanentemente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 my-3 pt-2 space-y-1">
                  {p.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs text-slate-600 py-0.5">
                      <span className="truncate pr-2">
                        {item.cantidad}× {item.producto_nombre}
                        {item.nota && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 ml-1.5 font-semibold">
                            {item.nota}
                          </span>
                        )}
                      </span>
                      <b className="font-mono flex-shrink-0">${Number(item.subtotal).toLocaleString('es-CO')}</b>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total orden:</span>
                  <b className="font-mono text-base text-slate-900">${Number(p.total_pedido).toLocaleString('es-CO')}</b>
                </div>

                <div className="flex items-center gap-2">
                  {p.estado === 'pendiente' ? (
                    <button
                      onClick={() => handleCambiarEstado(p.id, 'servido')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Servido
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCambiarEstado(p.id, 'pendiente')}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition"
                      title="Marcar de nuevo como pendiente"
                    >
                      Reabrir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL EDITAR PEDIDO ================= */}
      {pedidoAEditar && (
        <div className="overlay show" style={{ zIndex: 75 }}>
          <div className="modal" style={{ width: 'min(580px, 94vw)' }}>
            <div className="m-head">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Editar {pedidoAEditar.codigo_pedido}
                </h3>
                <p className="text-xs text-slate-400">
                  {pedidoAEditar.mesa_numero ? `Mesa ${pedidoAEditar.mesa_numero}` : 'Venta en Barra'} · Ajusta cantidades o agrega productos
                </p>
              </div>
              <button
                className="x"
                onClick={() => setPedidoAEditar(null)}
                title="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="m-body" style={{ maxHeight: '60vh' }}>
              {/* Agregar producto adicional al pedido */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Agregar producto al pedido:</span>
                <div className="flex gap-2">
                  <select
                    value={productoAAgregarId}
                    onChange={(e) => setProductoAAgregarId(e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white outline-none"
                  >
                    <option value="">Selecciona un producto del bar...</option>
                    {productosDisponibles.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.nombre} (${Number(prod.precio_venta).toLocaleString('es-CO')})
                      </option>
                    ))}
                  </select>
                  <input
                    value={cuentaNuevoItem}
                    onChange={(e) => setCuentaNuevoItem(e.target.value)}
                    placeholder="Cuenta..."
                    className="w-24 text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white outline-none"
                    title="A qué cuenta asignar este producto"
                  />
                  <button
                    type="button"
                    onClick={handleAgregarProductoAEdicion}
                    disabled={!productoAAgregarId}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir
                  </button>
                </div>
              </div>

              {/* Lista de productos editables */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Productos en el pedido:</span>
                {itemsEdicion.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No hay productos en la lista</p>
                ) : (
                  itemsEdicion.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl"
                    >
                      <div className="flex-1 pr-2">
                        <b className="text-xs text-slate-900 block truncate">{item.nombre}</b>
                        <small className="text-[11px] text-slate-400">
                          ${item.precio_unitario.toLocaleString('es-CO')} c/u · Cuenta:{' '}
                          <span className="text-indigo-600 font-semibold">{item.nota || 'Mesa'}</span>
                        </small>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleModificarCantidad(idx, -1)}
                            className="w-6 h-6 rounded bg-white text-slate-600 flex items-center justify-center hover:bg-slate-200"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold">{item.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => handleModificarCantidad(idx, 1)}
                            className="w-6 h-6 rounded bg-white text-slate-600 flex items-center justify-center hover:bg-slate-200"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <b className="font-mono text-xs w-20 text-right text-slate-800">
                          ${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}
                        </b>

                        <button
                          type="button"
                          onClick={() => handleEliminarItemEdicion(idx)}
                          className="text-slate-400 hover:text-red-500 p-1"
                          title="Eliminar este producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total editado */}
              <div className="flex justify-between items-center bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5">
                <span className="text-xs font-bold text-indigo-900">Total ajustado del pedido:</span>
                <b className="font-mono text-lg text-indigo-950">${totalEditando.toLocaleString('es-CO')}</b>
              </div>
            </div>

            <div className="m-foot">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPedidoAEditar(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoEdicion}
                onClick={handleGuardarCambiosPedido}
                className="btn btn-ok flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
