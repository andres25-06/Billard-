'use client';

import React from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { Mesa } from '../views/ViewMesas';

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
  canasta: { [prodId: string]: number };
  onAgregarACanasta: (prodId: string) => void;
  onQuitarDeCanasta: (prodId: string) => void;
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
  onEnviarPedido,
}: DrawerPedidosProps) {
  if (!abierto) return null;

  const totalItems = Object.values(canasta).reduce((a, b) => a + b, 0);
  const totalMonto = Object.entries(canasta).reduce((sum, [prodId, qty]) => {
    const prod = productos.find((p) => p.id === prodId);
    return sum + (prod ? Number(prod.precio_venta) * qty : 0);
  }, 0);

  const productosFiltrados = productos.filter(
    (p) => !categoriaSeleccionada || p.categoria_id === categoriaSeleccionada
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col">
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Registrar Pedido / Venta</h3>
            <p className="text-xs text-slate-500">Selecciona los productos e indica a quién cargarlo</p>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cargar a Mesa o Barra */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase flex-shrink-0">Cargar a:</span>
          <button
            onClick={() => onSeleccionarMesa('')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition flex-shrink-0 ${
              mesaSeleccionada === ''
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Venta en Barra
          </button>
          {mesas
            .filter((m) => m.estado === 'en_juego')
            .map((m) => (
              <button
                key={m.id}
                onClick={() => onSeleccionarMesa(m.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition flex-shrink-0 ${
                  mesaSeleccionada === m.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Mesa {m.numero}
              </button>
            ))}
        </div>

        {/* Selector de Categorías */}
        <div className="p-3 flex gap-2 border-b border-slate-100 overflow-x-auto">
          <button
            onClick={() => onSeleccionarCategoria('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              categoriaSeleccionada === '' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos los productos
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => onSeleccionarCategoria(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                categoriaSeleccionada === c.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        {/* Lista de Productos */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
          {productosFiltrados.map((prod) => {
            const qty = canasta[prod.id] || 0;
            return (
              <div
                key={prod.id}
                className="p-3.5 border border-slate-200 rounded-xl flex flex-col justify-between hover:border-indigo-400 transition bg-white shadow-xs"
              >
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{prod.nombre}</h4>
                  <p className="text-xs text-indigo-600 font-mono font-bold mt-0.5">
                    ${Number(prod.precio_venta).toLocaleString('es-CO')}
                  </p>
                  <span className={`text-[10.5px] font-medium ${prod.stock_actual <= 5 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                    Stock: {prod.stock_actual} {prod.stock_actual <= 5 && '· ¡Bajo!'}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-indigo-600 font-mono">
                    {qty > 0 ? `x${qty}` : ''}
                  </span>
                  <div className="flex gap-1.5">
                    {qty > 0 && (
                      <button
                        onClick={() => onQuitarDeCanasta(prod.id)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center text-slate-700"
                      >
                        -
                      </button>
                    )}
                    <button
                      onClick={() => onAgregarACanasta(prod.id)}
                      className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen Canasta y Confirmar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Unidades en comanda:</span>
            <span className="font-mono font-bold text-slate-900">{totalItems} unidades</span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-slate-800">Total a cargar:</span>
            <span className="font-mono text-base text-indigo-600">${totalMonto.toLocaleString('es-CO')}</span>
          </div>
          <button
            onClick={onEnviarPedido}
            disabled={totalItems === 0}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Confirmar y Despachar Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
