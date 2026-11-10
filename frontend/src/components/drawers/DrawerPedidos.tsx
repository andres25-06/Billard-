'use client';

import React, { useState, useEffect } from 'react';
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
  UserPlus,
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
  // Cuentas extra añadidas en el drawer
  const [cuentasExtra, setCuentasExtra] = useState<{ [mesaId: string]: string[] }>({});
  // Cuentas eliminadas en el drawer
  const [cuentasEliminadas, setCuentasEliminadas] = useState<{ [mesaId: string]: string[] }>({});

  const [mostrandoInputAgregar, setMostrandoInputAgregar] = useState<boolean>(false);
  const [nuevoNombreCuenta, setNuevoNombreCuenta] = useState<string>('');
  const [cuentaActiva, setCuentaActiva] = useState<string>('Mesa');

  // Clientes/jugadores almacenados en el sistema
  const [clientesGuardados, setClientesGuardados] = useState<Array<{ id: string; nombre: string; apodo?: string }>>([]);

  useEffect(() => {
    if (!abierto) return;
    fetchClientes()
      .then((data) => {
        setClientesGuardados(data.clientes || []);
      })
      .catch((err) => console.error('Error cargando clientes:', err));
  }, [abierto]);

  // Al cambiar de mesa, predeterminar 'Mesa'
  useEffect(() => {
    setCuentaActiva('Mesa');
    setMostrandoInputAgregar(false);
    setNuevoNombreCuenta('');
  }, [mesaSeleccionada]);

  if (!abierto) return null;

  const mesaActual = mesas.find((m) => m.id === mesaSeleccionada);

  // Lista consolidada de cuentas de la mesa
  const eliminadasDeMesa = cuentasEliminadas[mesaSeleccionada] || [];
  const cuentasMesaActual: { id?: string; nombre: string }[] = [{ nombre: 'Mesa' }];

  if (mesaActual?.sesion?.jugadores) {
    mesaActual.sesion.jugadores.forEach((j) => {
      if (
        j.nombre &&
        !eliminadasDeMesa.includes(j.nombre.toLowerCase()) &&
        !cuentasMesaActual.some((c) => c.nombre.toLowerCase() === j.nombre.toLowerCase())
      ) {
        cuentasMesaActual.push({ id: j.id, nombre: j.nombre });
      }
    });
  }

  (cuentasExtra[mesaSeleccionada] || []).forEach((nombreExtra) => {
    if (
      !eliminadasDeMesa.includes(nombreExtra.toLowerCase()) &&
      !cuentasMesaActual.some((c) => c.nombre.toLowerCase() === nombreExtra.toLowerCase())
    ) {
      cuentasMesaActual.push({ nombre: nombreExtra });
    }
  });

  const handleGuardarNuevaCuenta = async (nombreAUsar?: string) => {
    const limpio = (nombreAUsar || nuevoNombreCuenta).trim();
    if (!limpio) {
      setMostrandoInputAgregar(false);
      return;
    }

    // Quitar de eliminadas si estaba
    setCuentasEliminadas((prev) => ({
      ...prev,
      [mesaSeleccionada]: (prev[mesaSeleccionada] || []).filter((n) => n !== limpio.toLowerCase()),
    }));

    if (!cuentasMesaActual.some((c) => c.nombre.toLowerCase() === limpio.toLowerCase())) {
      setCuentasExtra((prev) => ({
        ...prev,
        [mesaSeleccionada]: [...(prev[mesaSeleccionada] || []), limpio],
      }));
    }

    // Guardar en la base de datos de clientes y en la sesión activa de la mesa
    try {
      if (mesaSeleccionada) {
        await agregarCuentaSesionMesa(mesaSeleccionada, limpio);
      }
      const res = await guardarCliente(limpio);
      if (res?.cliente) {
        setClientesGuardados((prev) => {
          if (!prev.some((c) => c.nombre.toLowerCase() === limpio.toLowerCase())) {
            return [...prev, res.cliente];
          }
          return prev;
        });
      }
    } catch (e) {
      console.error('Error guardando cuenta/cliente en base de datos:', e);
    }

    setCuentaActiva(limpio);
    setNuevoNombreCuenta('');
    setMostrandoInputAgregar(false);
  };

  const handleEliminarCuenta = async (nombreCuenta: string) => {
    if (nombreCuenta === 'Mesa') return;

    setCuentasEliminadas((prev) => ({
      ...prev,
      [mesaSeleccionada]: [...(prev[mesaSeleccionada] || []), nombreCuenta.toLowerCase()],
    }));

    setCuentasExtra((prev) => ({
      ...prev,
      [mesaSeleccionada]: (prev[mesaSeleccionada] || []).filter(
        (n) => n.toLowerCase() !== nombreCuenta.toLowerCase()
      ),
    }));

    if (cuentaActiva.toLowerCase() === nombreCuenta.toLowerCase()) {
      setCuentaActiva('Mesa');
    }

    if (mesaSeleccionada) {
      try {
        await eliminarCuentaSesionMesa(mesaSeleccionada, nombreCuenta);
      } catch (e) {
        console.error('Error eliminando cuenta en base de datos:', e);
      }
    }
  };

  const handleClicProducto = (prodId: string) => {
    const cuentaDestino = mesaSeleccionada ? cuentaActiva : 'Barra';
    const jugadorObj = cuentasMesaActual.find(
      (c) => c.nombre.toLowerCase() === cuentaDestino.toLowerCase()
    );
    onAgregarACanasta(prodId, cuentaDestino, jugadorObj?.id);
  };

  const itemsCanastaArray = Object.entries(canasta);
  const totalItems = itemsCanastaArray.reduce((acc, [, item]) => acc + item.cantidad, 0);
  const totalMonto = itemsCanastaArray.reduce((acc, [, item]) => {
    const prod = productos.find((p) => p.id === item.productoId);
    return acc + (prod ? Number(prod.precio_venta) * item.cantidad : 0);
  }, 0);

  const productosFiltrados = productos.filter(
    (p) => !categoriaSeleccionada || p.categoria_id === categoriaSeleccionada
  );

  // Sugerencias de clientes al escribir
  const sugerenciasClientes = clientesGuardados.filter(
    (cg) =>
      cg.nombre.toLowerCase().includes(nuevoNombreCuenta.toLowerCase()) &&
      !cuentasMesaActual.some((c) => c.nombre.toLowerCase() === cg.nombre.toLowerCase())
  );

  const subtituloMesa = mesaActual
    ? `${(mesaActual.tipo || 'Mesa').replace('_', ' ')} · ${cuentasMesaActual.length} ${cuentasMesaActual.length === 1 ? 'cuenta' : 'cuentas'}`
    : 'Despacho directo en barra';

  const formatoTiempoSesion = mesaActual?.sesion
    ? `${String(Math.floor(mesaActual.sesion.minutos_transcurridos / 60)).padStart(2, '0')}:${String(mesaActual.sesion.minutos_transcurridos % 60).padStart(2, '0')}`
    : null;

  return (
    <>
      <div className="overlay" style={{ zIndex: 59 }} onClick={onCerrar}></div>
      <aside className="drawer">
        {/* ================= Lado izquierdo: Catálogo de productos ================= */}
        <section className="cat">
          <div className="d-head">
            <div className="kpi-ic" style={{ width: '38px', height: '38px' }}>
              <Store className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h3>Catálogo del bar</h3>
              <p>Clic en un producto para cargarlo al pedido</p>
            </div>
          </div>

          {/* 1. Selector de Destino (Venta en Barra o Mesas en juego) */}
          <div className="assign" style={{ borderBottom: '1px solid var(--line)', background: '#F8F9FD' }}>
            <span className="assign-label">
              <Store className="w-3.5 h-3.5" /> Destino:
            </span>
            <button
              type="button"
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
                  type="button"
                  className={`who ${mesaSeleccionada === m.id ? 'sel' : ''}`}
                  onClick={() => onSeleccionarMesa(m.id)}
                >
                  Mesa {m.numero}
                </button>
              ))}
          </div>

          {/* 2. Selector de Cuenta / Jugador con opción de Quitar y Buscar/Agregar */}
          {mesaActual ? (
            <div className="assign relative">
              <span className="assign-label">
                <Users className="w-3.5 h-3.5" /> Asignar a:
              </span>
              {cuentasMesaActual.map((c) => (
                <div
                  key={c.nombre}
                  onClick={() => setCuentaActiva(c.nombre)}
                  className={`who ${cuentaActiva.toLowerCase() === c.nombre.toLowerCase() ? 'sel' : ''}`}
                >
                  <span>{c.nombre === 'Mesa' ? 'Mesa (General)' : c.nombre}</span>
                  {c.nombre !== 'Mesa' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminarCuenta(c.nombre);
                      }}
                      className="ml-1 text-slate-400 hover:text-red-500 rounded-full p-0.5 transition"
                      title={`Quitar ${c.nombre} de esta comanda`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

              {!mostrandoInputAgregar ? (
                <button
                  type="button"
                  className="who-add"
                  onClick={() => {
                    setMostrandoInputAgregar(true);
                    setNuevoNombreCuenta('');
                  }}
                  title="Buscar o agregar nuevo jugador/cliente"
                >
                  <Plus className="w-3 h-3" />
                  Agregar / Buscar jugador
                </button>
              ) : (
                <div className="relative">
                  <div className="flex items-center gap-1.5 bg-white border border-indigo-400 rounded-full px-3 py-1 shadow-md">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      autoFocus
                      value={nuevoNombreCuenta}
                      onChange={(e) => setNuevoNombreCuenta(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleGuardarNuevaCuenta();
                        } else if (e.key === 'Escape') {
                          setMostrandoInputAgregar(false);
                        }
                      }}
                      placeholder="Buscar o escribir nombre..."
                      className="text-xs bg-transparent outline-none w-36 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleGuardarNuevaCuenta()}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-1"
                      title="Guardar jugador"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setMostrandoInputAgregar(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Autocompletado de jugadores almacenados */}
                  {nuevoNombreCuenta.trim().length > 0 && sugerenciasClientes.length > 0 && (
                    <div className="absolute top-8 left-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl w-48 overflow-hidden py-1">
                      <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                        Jugadores guardados:
                      </div>
                      {sugerenciasClientes.slice(0, 4).map((cg) => (
                        <div
                          key={cg.id}
                          onClick={() => handleGuardarNuevaCuenta(cg.nombre)}
                          className="px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer flex justify-between items-center"
                        >
                          <span className="font-semibold">{cg.nombre}</span>
                          {cg.apodo && <small className="text-slate-400">"{cg.apodo}"</small>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="assign" style={{ fontSize: '11px', color: 'var(--c400)' }}>
              <span>Despacho directo en mostrador de barra</span>
            </div>
          )}

          {/* 3. Indicador visible de a quién se le carga el próximo consumo */}
          {mesaActual && (
            <div style={{ padding: '6px 18px 2px', fontSize: '11.5px', color: 'var(--c400)' }}>
              Cargando productos a:{' '}
              <span className="font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                {cuentaActiva === 'Mesa' ? 'Mesa (Cuenta General)' : cuentaActiva}
              </span>
            </div>
          )}

          {/* 4. Categorías con scroll horizontal */}
          <div className="ctabs">
            <button
              type="button"
              className={`ctab ${categoriaSeleccionada === '' ? 'active' : ''}`}
              onClick={() => onSeleccionarCategoria('')}
            >
              Todos
            </button>
            {categorias.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`ctab ${categoriaSeleccionada === c.id ? 'active' : ''}`}
                onClick={() => onSeleccionarCategoria(c.id)}
              >
                {c.nombre}
              </button>
            ))}
          </div>

          {/* 5. Catálogo de productos */}
          <div className="prods">
            {productosFiltrados.map((prod) => (
              <button
                key={prod.id}
                type="button"
                className="prod"
                onClick={() => handleClicProducto(prod.id)}
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

        {/* ================= Lado derecho: Comanda / Resumen ================= */}
        <section className="ord">
          <div className="d-head">
            <div className="c-num">{mesaActual ? String(mesaActual.numero).padStart(2, '0') : 'B'}</div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate">
                {mesaActual ? `Comanda · Mesa ${mesaActual.numero}` : 'Venta en Barra'}
              </h3>
              <p className="truncate">
                {subtituloMesa}
              </p>
            </div>
            {formatoTiempoSesion ? (
              <span className="mini-timer" title="Tiempo de juego">
                {formatoTiempoSesion}
              </span>
            ) : null}
            <button
              type="button"
              onClick={onCerrar}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200/80 flex items-center justify-center transition-colors flex-shrink-0 ml-1 cursor-pointer"
              title="Cerrar comanda"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="lines">
            {itemsCanastaArray.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--c400)', padding: '50px 20px', fontSize: '13px' }}>
                <Store className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">Comanda vacía</p>
                <small className="block text-slate-400 mt-1">
                  Selecciona la cuenta y haz clic en los productos para agregarlos
                </small>
              </div>
            ) : (
              itemsCanastaArray.map(([itemKey, item]) => {
                const prod = productos.find((p) => p.id === item.productoId);
                if (!prod) return null;
                const sub = Number(prod.precio_venta) * item.cantidad;

                return (
                  <div key={itemKey} className="line">
                    <div className="li">
                      <b>
                        {prod.nombre}
                        <span className={`tag ${item.cuenta === 'Mesa' ? 'mesa' : ''}`}>
                          {item.cuenta}
                        </span>
                      </b>
                      <small>${Number(prod.precio_venta).toLocaleString('es-CO')} c/u</small>
                    </div>
                    <div className="qty">
                      <button
                        type="button"
                        onClick={() => onQuitarDeCanasta(itemKey)}
                        title="Disminuir"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span>{item.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => onAgregarACanasta(item.productoId, item.cuenta, item.jugadorId)}
                        title="Aumentar"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="lp">${sub.toLocaleString('es-CO')}</div>
                    <button
                      type="button"
                      className="del"
                      onClick={() => onEliminarItemCanasta(itemKey)}
                      title="Eliminar de la comanda"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
              type="button"
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
