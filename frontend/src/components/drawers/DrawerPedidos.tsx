'use client';

import React from 'react';
import { X, Beer, Wine, CupSoda, Cookie, Minus, Plus, Trash2, CreditCard } from 'lucide-react';
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

  const mesaActual = mesas.find((m) => m.id === mesaSeleccionada);
  const totalItems = Object.values(canasta).reduce((a, b) => a + b, 0);
  const totalMonto = Object.entries(canasta).reduce((sum, [prodId, qty]) => {
    const prod = productos.find((p) => p.id === prodId);
    return sum + (prod ? Number(prod.precio_venta) * qty : 0);
  }, 0);

  const productosFiltrados = productos.filter(
    (p) => !categoriaSeleccionada || p.categoria_id === categoriaSeleccionada
  );

  return (
    <>
      <div className="overlay" style={{ zIndex: 59 }} onClick={onCerrar}></div>
      <aside className="drawer">
        {/* Lado izquierdo: Catálogo de productos */}
        <section className="cat">
          <div className="d-head">
            <div>
              <h3>Catálogo del bar</h3>
              <p>Clic para agregar al pedido</p>
            </div>
          </div>

          <div className="ctabs">
            <button
              className={`ctab ${categoriaSeleccionada === '' ? 'active' : ''}`}
              onClick={() => onSeleccionarCategoria('')}
            >
              Todos
            </button>
            {categorias.map((c) => (
              <button
                key={c.id}
                className={`ctab ${categoriaSeleccionada === c.id ? 'active' : ''}`}
                onClick={() => onSeleccionarCategoria(c.id)}
              >
                {c.nombre}
              </button>
            ))}
          </div>

          <div className="assign">
            <span style={{ fontSize: '11px', color: 'var(--c400)', marginRight: '6px' }}>Cargar a:</span>
            <button
              className={`who ${mesaSeleccionada === '' ? 'sel' : ''}`}
              onClick={() => onSeleccionarMesa('')}
            >
              Venta en Barra
            </button>
            {mesas
              .filter((m) => m.estado === 'en_juego')
              .map((m) => (
                <button
                  key={m.id}
                  className={`who ${mesaSeleccionada === m.id ? 'sel' : ''}`}
                  onClick={() => onSeleccionarMesa(m.id)}
                >
                  Mesa {m.numero}
                </button>
              ))}
          </div>

          <div className="prods">
            {productosFiltrados.map((prod) => (
              <button
                key={prod.id}
                className="prod"
                onClick={() => onAgregarACanasta(prod.id)}
              >
                <div className="pi">
                  <Beer className="w-4 h-4 text-slate-700" />
                </div>
                <b>{prod.nombre}</b>
                <span>${Number(prod.precio_venta).toLocaleString('es-CO')}</span>
                <small className={prod.stock_actual <= 5 ? 'low' : ''}>
                  Stock {prod.stock_actual}
                </small>
              </button>
            ))}
          </div>
        </section>

        {/* Lado derecho: Comanda / Resumen */}
        <section className="ord">
          <div className="d-head">
            <div className="c-num">{mesaActual ? String(mesaActual.numero).padStart(2, '0') : 'B'}</div>
            <div>
              <h3>{mesaActual ? `Comanda · ${mesaActual.nombre}` : 'Venta en Barra'}</h3>
              <p>{mesaActual ? 'Mesa en juego' : 'Despacho directo'}</p>
            </div>
            {mesaActual?.sesion && (
              <span className="mini-timer">
                {Math.floor(mesaActual.sesion.minutos_transcurridos / 60)}h {mesaActual.sesion.minutos_transcurridos % 60}m
              </span>
            )}
            <button className="x icon-btn" onClick={onCerrar}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="lines">
            {Object.entries(canasta).length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--c400)', padding: '40px 20px', fontSize: '13px' }}>
                Selecciona productos del catálogo para armar el pedido
              </p>
            ) : (
              Object.entries(canasta).map(([prodId, qty]) => {
                const prod = productos.find((p) => p.id === prodId);
                if (!prod) return null;
                const sub = Number(prod.precio_venta) * qty;

                return (
                  <div key={prodId} className="line">
                    <div className="li">
                      <b>{prod.nombre}</b>
                      <small>${Number(prod.precio_venta).toLocaleString('es-CO')} c/u</small>
                    </div>
                    <div className="qty">
                      <button onClick={() => onQuitarDeCanasta(prodId)}>
                        <Minus className="w-3 h-3" />
                      </button>
                      <span>{qty}</span>
                      <button onClick={() => onAgregarACanasta(prodId)}>
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="lp">${sub.toLocaleString('es-CO')}</div>
                  </div>
                );
              })
            )}
          </div>

          <div className="d-tot">
            <div className="row">
              <span>Unidades en pedido</span>
              <b>{totalItems}</b>
            </div>
            <div className="total">
              <span>Total Pedido</span>
              <b>${totalMonto.toLocaleString('es-CO')}</b>
            </div>
          </div>

          <div className="d-actions">
            <button
              className="a a-pri"
              disabled={totalItems === 0}
              onClick={onEnviarPedido}
              style={totalItems === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <CreditCard className="w-4 h-4" />
              Confirmar y Despachar Pedido
            </button>
          </div>
        </section>
      </aside>
    </>
  );
}
