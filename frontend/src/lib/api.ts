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

export async function fetchProductos(categoriaId?: string) {
  const url = categoriaId ? `${API_BASE}/productos?categoria_id=${categoriaId}` : `${API_BASE}/productos`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error("Error al obtener productos");
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
  items: Array<{ producto_id: string; cantidad: number; nota?: string }>;
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

export async function fetchSidebarStats() {
  const res = await fetch(`${API_BASE}/stats-sidebar`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Error al obtener estadísticas del sidebar");
  return res.json();
}

