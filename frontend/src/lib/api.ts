const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchMesas() {
  const res = await fetch(`${API_BASE}/mesas`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Error al obtener mesas");
  return res.json();
}

export async function abrirMesa(mesaId: string, data: { modalidad_tiempo: string; minutos_prepago?: number; jugadores: string[]; nota?: string }) {
  const res = await fetch(`${API_BASE}/mesas/${mesaId}/abrir`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Error al abrir mesa");
  }
  return res.json();
}

export async function cerrarMesa(mesaId: string, data: { descuento?: number; metodo_pago?: string }) {
  const res = await fetch(`${API_BASE}/mesas/${mesaId}/cerrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Error al cerrar mesa");
  }
  return res.json();
}

export async function toggleLuzMesa(mesaId: string) {
  const res = await fetch(`${API_BASE}/mesas/${mesaId}/luz`, { method: "POST" });
  if (!res.ok) throw new Error("Error al cambiar luz");
  return res.json();
}

export async function actualizarPuntosJugador(jugadorId: string, delta: number) {
  const res = await fetch(`${API_BASE}/mesas/jugador/${jugadorId}/carambola`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jugador_id: jugadorId, delta }),
  });
  if (!res.ok) throw new Error("Error al actualizar puntos");
  return res.json();
}

export async function fetchProductos(categoriaId?: string, incluirInactivos: boolean = true) {
  const params = new URLSearchParams();
  if (categoriaId) params.append('categoria_id', categoriaId);
  if (incluirInactivos) params.append('incluir_inactivos', 'true');
  const qs = params.toString();
  const url = qs ? `${API_BASE}/productos?${qs}` : `${API_BASE}/productos`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error("Error al obtener productos");
  return res.json();
}

export async function guardarProducto(data: {
  nombre: string;
  categoria_nombre?: string;
  categoria_id?: string;
  codigo_barras?: string;
  precio_venta: number;
  precio_costo: number;
  stock_actual?: number;
  stock_minimo?: number;
  activo?: boolean;
}) {
  const res = await fetch(`${API_BASE}/productos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al crear producto");
  }
  return res.json();
}

export async function actualizarProductoApi(productoId: string, data: {
  nombre: string;
  precio_venta: number;
  precio_costo: number;
  stock_minimo?: number;
  activo?: boolean;
}) {
  const res = await fetch(`${API_BASE}/productos/${productoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al actualizar producto");
  }
  return res.json();
}

export async function eliminarProductoApi(productoId: string) {
  const res = await fetch(`${API_BASE}/productos/${productoId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al eliminar producto");
  }
  return res.json();
}

export async function fetchCategorias() {
  const res = await fetch(`${API_BASE}/productos/categorias`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Error al obtener categorías");
  return res.json();
}

export async function crearPedido(data: {
  mesa_id?: string;
  origen: string;
  items: Array<{ producto_id: string; cantidad: number; nota?: string; jugador_id?: string }>;
  nota?: string;
}) {
  const res = await fetch(`${API_BASE}/pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Error al crear pedido");
  }
  return res.json();
}

export async function agregarCuentaSesionMesa(mesaId: string, nombre: string) {
  const res = await fetch(`${API_BASE}/mesas/${mesaId}/cuentas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al agregar cuenta a la sesión");
  }
  return res.json();
}

export async function eliminarCuentaSesionMesa(mesaId: string, nombre: string) {
  const res = await fetch(`${API_BASE}/mesas/${mesaId}/cuentas/${encodeURIComponent(nombre)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al eliminar cuenta de la sesión");
  }
  return res.json();
}

export async function fetchTurnoActivo() {
  const res = await fetch(`${API_BASE}/caja/turno-activo`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Error al obtener turno activo");
  return res.json();
}

export async function fetchAlertasActivas() {
  const res = await fetch(`${API_BASE}/alertas/activas`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Error al obtener alertas");
  return res.json();
}

export async function atenderAlerta(alertaId: string) {
  const res = await fetch(`${API_BASE}/alertas/${alertaId}/atender`, { method: "POST" });
  if (!res.ok) throw new Error("Error al atender alerta");
  return res.json();
}

export async function editarPedido(pedidoId: string, data: {
  items: Array<{ producto_id: string; cantidad: number; nota?: string; jugador_id?: string }>;
  nota?: string;
  estado?: string;
}) {
  const res = await fetch(`${API_BASE}/pedidos/${pedidoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Error al editar pedido");
  }
  return res.json();
}

export async function eliminarPedido(pedidoId: string) {
  const res = await fetch(`${API_BASE}/pedidos/${pedidoId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Error al eliminar pedido");
  }
  return res.json();
}

export async function fetchClientes() {
  const res = await fetch(`${API_BASE}/clientes`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Error al obtener clientes");
  return res.json();
}

export async function guardarCliente(nombre: string, apodo?: string, telefono?: string) {
  const res = await fetch(`${API_BASE}/clientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, apodo, telefono }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Error al guardar cliente");
  }
  return res.json();
}

export async function eliminarCliente(clienteId: string) {
  const res = await fetch(`${API_BASE}/clientes/${clienteId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Error al eliminar cliente");
  }
  return res.json();
}

export async function fetchSidebarStats() {
  const res = await fetch(`${API_BASE}/stats-sidebar`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Error al obtener estadísticas del sidebar");
  return res.json();
}

export async function abrirTurnoCaja(montoBase: number) {
  const res = await fetch(`${API_BASE}/caja/abrir`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monto_base: montoBase }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Error al abrir turno");
  }
  return res.json();
}

export async function cerrarTurnoCaja(efectivoDeclarado: number, observaciones?: string) {
  const res = await fetch(`${API_BASE}/caja/cerrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ efectivo_declarado: efectivoDeclarado, observaciones }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Error al cerrar turno");
  }
  return res.json();
}

export async function registrarMovimientoCaja(data: {
  tipo: string;
  monto: number;
  descripcion: string;
  metodo_pago?: string;
}) {
  const res = await fetch(`${API_BASE}/caja/movimiento`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Error al registrar movimiento");
  }
  return res.json();
}


