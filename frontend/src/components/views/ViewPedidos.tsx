'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, Check, Clock, AlertCircle } from 'lucide-react';

interface PedidoItem {
  id: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  nota?: string;
}

interface Pedido {
  id: string;
  codigo_pedido: string;
  mesa_numero?: number;
  origen: string;
  estado: string;
  total_pedido: number;
  solicitado_el: string;
  items: PedidoItem[];
}

export default function ViewPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<string>('todos');
  const [cargando, setCargando] = useState<boolean>(true);

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
                  <span
                    className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full ${
                      p.estado === 'pendiente'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {p.estado.toUpperCase()}
                  </span>
                </div>

                <div className="border-t border-slate-100 my-3 pt-2 space-y-1">
                  {p.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs text-slate-600">
                      <span>{item.cantidad}× {item.producto_nombre}</span>
                      <b className="font-mono">${Number(item.subtotal).toLocaleString('es-CO')}</b>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total orden:</span>
                  <b className="font-mono text-base text-slate-900">${Number(p.total_pedido).toLocaleString('es-CO')}</b>
                </div>

                {p.estado === 'pendiente' ? (
                  <button
                    onClick={() => handleCambiarEstado(p.id, 'servido')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Marcar Servido
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Entregado
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
