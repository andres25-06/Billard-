'use client';

import React from 'react';
import { Bell, ShoppingCart, Utensils } from 'lucide-react';
import { ModuloId } from './Sidebar';

interface TopbarProps {
  moduloActivo: ModuloId;
  alertas: Array<{ id: string; mensaje: string }>;
  onAtenderAlerta: (alertaId: string) => void;
  onVentaBarra: () => void;
  onVentaMesa?: () => void;
}

const MODULO_INFO: Record<ModuloId, { titulo: string; subtitulo: string }> = {
  mesas: {
    titulo: 'Mapa de mesas',
    subtitulo: 'Tiempos, marcadores y cuentas en vivo',
  },
  pedidos: {
    titulo: 'Ventas',
    subtitulo: 'Registro de lo vendido · Consultar, editar o eliminar ventas',
  },
  inventario: {
    titulo: 'Inventario del bar',
    subtitulo: 'Catálogo de productos, existencias y costos',
  },
  caja: {
    titulo: 'Caja y arqueo',
    subtitulo: 'Turno activo, base en efectivo y cuadre de jornada',
  },
  torneos: {
    titulo: 'Campeonatos y torneos',
    subtitulo: 'Fase de grupos de 3 y llaves 1 vs 1 en vivo',
  },
  reportes: {
    titulo: 'Reportes y estadísticas',
    subtitulo: 'Métricas de ventas, consumo y rotación',
  },
  configuracion: {
    titulo: 'Usuarios y tarifas',
    subtitulo: 'Precios por hora, fracciones y accesos con PIN',
  },
};

export default function Topbar({
  moduloActivo,
  alertas,
  onAtenderAlerta,
  onVentaBarra,
  onVentaMesa,
}: TopbarProps) {
  const info = MODULO_INFO[moduloActivo];

  return (
    <header className="topbar">
      <div className="title">
        <h2>{info.titulo}</h2>
        <p>{info.subtitulo}</p>
      </div>

      <div className="status" title="Operación local sin internet · Autoguardado cada 5 s">
        <span className="dot"></span>
        Red local · PostgreSQL 18
      </div>

      <div className="spacer"></div>

      {/* Alerta de mesa */}
      {alertas.length > 0 && (
        <div className="alert-banner">
          <Bell className="w-4 h-4 text-amber-600 bell-anim" />
          <span>{alertas[0].mensaje}</span>
          <button onClick={() => onAtenderAlerta(alertas[0].id)}>Atender</button>
        </div>
      )}

      {moduloActivo === 'mesas' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onVentaMesa && (
            <button className="btn btn-ghost" onClick={onVentaMesa}>
              <Utensils className="w-4 h-4" />
              Venta en mesa
            </button>
          )}
          <button className="btn btn-primary" onClick={onVentaBarra}>
            <ShoppingCart className="w-4 h-4" />
            Venta en barra
          </button>
        </div>
      )}
    </header>
  );
}
