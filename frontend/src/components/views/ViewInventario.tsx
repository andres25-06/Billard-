'use client';

import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, ArrowUpDown, Plus } from 'lucide-react';

interface Producto {
  id: string;
  nombre: string;
  categoria_nombre: string;
  precio_venta: number;
  precio_costo: number;
  stock_actual: number;
  stock_minimo: number;
}

export default function ViewInventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const cargarProductos = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/productos');
      const data = await res.json();
      setProductos(data.productos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleAjustarStock = async (prodId: string, cantidad: number) => {
    try {
      await fetch(`http://localhost:8000/api/productos/${prodId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad, motivo: 'ajuste_inventario' }),
      });
      await cargarProductos();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Catálogo de Productos y Existencias</h3>
            <p className="text-xs text-slate-400">Control de stock de cervezas, licores y botanas en tiempo real</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-200">
              <tr>
                <th className="p-4">Producto</th>
                <th className="p-4">Categoría</th>
                <th className="p-4 font-mono">P. Venta</th>
                <th className="p-4 font-mono">Costo</th>
                <th className="p-4">Stock Actual</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Ajuste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productos.map((prod) => {
                const stockBajo = prod.stock_actual <= prod.stock_minimo;
                return (
                  <tr key={prod.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-bold text-slate-900">{prod.nombre}</td>
                    <td className="p-4">{prod.categoria_nombre}</td>
                    <td className="p-4 font-mono font-bold text-slate-900">
                      ${Number(prod.precio_venta).toLocaleString('es-CO')}
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      ${Number(prod.precio_costo).toLocaleString('es-CO')}
                    </td>
                    <td className="p-4">
                      <span className={`font-mono font-bold text-sm ${stockBajo ? 'text-rose-600' : 'text-slate-800'}`}>
                        {prod.stock_actual}
                      </span>
                      <span className="text-[10px] text-slate-400 block">mínimo: {prod.stock_minimo}</span>
                    </td>
                    <td className="p-4">
                      {stockBajo ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-rose-100 text-rose-700">
                          <AlertTriangle className="w-3 h-3" /> Stock Bajo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-700">
                          Disponible
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleAjustarStock(prod.id, 6)}
                          title="Entrada de +6 unidades"
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-xs"
                        >
                          +6
                        </button>
                        <button
                          onClick={() => handleAjustarStock(prod.id, 12)}
                          title="Entrada de +12 unidades (Caja)"
                          className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 font-bold text-indigo-700 text-xs"
                        >
                          +12
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
