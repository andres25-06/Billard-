'use client';

import React from 'react';
import { Bell, ShoppingCart } from 'lucide-react';
import { ModuloId } from './Sidebar';

interface TopbarProps {
  moduloActivo: ModuloId;
  alertas: Array<{ id: string; mensaje: string }>;
  onAtenderAlerta: (alertaId: string) => void;
  onVentaBarra: () => void;
}

const MODULO_TITULOS: Record<ModuloId, { titulo: string; subtitulo: string }> = {
  mesas: {
    titulo: 'Mapa de mesas',
    subtitulo: 'Tiempos, marcadores de carambola y cuentas en vivo',
  },
  pedidos: {
    titulo: 'Ventas y pedidos',
    subtitulo: 'Historial de órdenes, comandas de barra y estado de despacho',
  },
  inventario: {
    titulo: 'Inventario Bar',
    subtitulo: 'Existencias de cervezas, licores, snacks y alertas de stock bajo',
  },
  caja: {
    titulo: 'Caja y arqueo',
    subtitulo: 'Turno activo, base en efectivo, cuadre y desglose de medios de pago',
  },
  torneos: {
    titulo: 'Campeonatos y Torneos',
    subtitulo: 'Fase de grupos de 3 y llaves eliminatorias 1 vs 1 en vivo',
  },
  reportes: {
    titulo: 'Reportes y métricas',
    subtitulo: 'Ingresos diarios, horas jugadas por mesa y rotación de productos',
  },
  configuracion: {
    titulo: 'Tarifas y usuarios',
    subtitulo: 'Precios por hora, fracciones de tiempo y control de accesos con PIN',
  },
};

export default function Topbar({
  moduloActivo,
  alertas,
  onAtenderAlerta,
  onVentaBarra,
}: TopbarProps) {
  const info = MODULO_TITULOS[moduloActivo];

  return (
    <header className="h-16 px-8 flex items-center gap-4 bg-white/80 backdrop-blur border-b border-slate-200 select-none">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{info.titulo}</h2>
        <p className="text-xs text-slate-500">{info.subtitulo}</p>
      </div>

      <div className="ml-4 flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
        <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span>
        Red local · PostgreSQL 18
      </div>

      <div className="flex-1"></div>

      {/* Alerta de mesa en vivo */}
      {alertas.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm animate-pulse">
          <Bell className="w-4 h-4 text-amber-600 bell-ring" />
          <span className="max-w-xs truncate">{alertas[0].mensaje}</span>
          <button
            onClick={() => onAtenderAlerta(alertas[0].id)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition"
          >
            Atender
          </button>
        </div>
      )}

      {/* Botón rápido Venta en Barra */}
      <button
        onClick={onVentaBarra}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition"
      >
        <ShoppingCart className="w-4 h-4" />
        Venta en Barra
      </button>
    </header>
  );
}
