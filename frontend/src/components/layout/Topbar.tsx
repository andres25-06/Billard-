'use client';

import React from 'react';
import {
  Bell,
  ShoppingCart,
  Calendar,
  Lock,
} from 'lucide-react';
import { ModuloId } from './Sidebar';

interface TopbarProps {
  moduloActivo: ModuloId;
  onCambiarModulo: (modulo: ModuloId) => void;
  alertas: Array<{ id: string; mensaje: string }>;
  onAtenderAlerta: (alertaId: string) => void;
  onVentaBarra: () => void;
  onVentaMesa?: () => void;
  onBloquearTerminal?: () => void;
  cajaAbierta?: boolean;
}

const MODULO_TITULOS: Record<ModuloId, { titulo: string; sub: string }> = {
  mesas: { titulo: 'Mapa de mesas', sub: 'Control de tiempos, luces y cuentas en tiempo real' },
  pedidos: { titulo: 'Ventas y pedidos', sub: 'Historial y registro de ventas del billar y bar' },
  inventario: { titulo: 'Inventario del bar', sub: 'Stock de licores, bebidas, snacks y alertas' },
  caja: { titulo: 'Caja y arqueo', sub: 'Turno activo, base en efectivo y cuadre de jornada' },
  torneos: { titulo: 'Torneos y campeonatos', sub: 'Fases clasificatorias y llaves de eliminación' },
  reportes: { titulo: 'Reportes y estadísticas', sub: 'Métricas de rendimiento, afluencia e ingresos' },
  configuracion: { titulo: 'Ajustes y tarifas', sub: 'Precios por hora, fracciones y accesos con PIN' },
};

export default function Topbar({
  moduloActivo,
  alertas,
  onAtenderAlerta,
  onVentaBarra,
  onBloquearTerminal,
  cajaAbierta = true,
}: TopbarProps) {
  const hoy = new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const info = MODULO_TITULOS[moduloActivo] || { titulo: 'Billar Club', sub: 'PC de Control' };

  return (
    <header className="w-full flex items-center justify-between px-7 py-4 border-b border-[#D6D9E8] bg-white/70 backdrop-blur-sm select-none shrink-0 gap-4">
      {/* 1. Título dinámico del módulo actual */}
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-[var(--ink)] tracking-tight">
          {info.titulo}
        </h2>
        <p className="text-xs font-medium text-[var(--label)]">
          {info.sub}
        </p>
      </div>

      {/* 2. Acciones Rápidas: Fecha, Alertas, Venta Barra, Bloqueo */}
      <div className="flex items-center gap-3">
        {/* Fecha */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--page)] border border-[var(--slate)]/20 text-xs font-semibold text-[var(--navy)]">
          <Calendar className="w-3.5 h-3.5 text-[var(--label)]" />
          <span className="capitalize">{hoy}</span>
        </div>

        {/* Estado de Caja */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            cajaAbierta
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              cajaAbierta ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="hidden sm:inline">
            {cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
          </span>
        </div>

        {/* Alertas */}
        {alertas.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-xs font-semibold text-amber-900 animate-bounce">
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span className="max-w-[140px] truncate">{alertas[0].mensaje}</span>
            <button
              onClick={() => onAtenderAlerta(alertas[0].id)}
              className="text-[11px] font-bold underline hover:text-amber-950"
            >
              Atender
            </button>
          </div>
        )}

        {/* Botón Venta en Barra */}
        {onVentaBarra && (
          <button
            onClick={onVentaBarra}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--ink)] text-white hover:bg-[var(--navy)] active:scale-95 text-xs font-bold shadow-sm transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Venta Barra</span>
          </button>
        )}

        {/* Separador */}
        <div className="w-[1px] h-6 bg-[var(--slate)]/30 hidden sm:block" />

        {/* Bloqueo rápido de terminal */}
        {onBloquearTerminal && (
          <button
            onClick={onBloquearTerminal}
            title="Bloquear Terminal"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--label)] hover:text-rose-600 hover:bg-rose-50 transition-all border border-[var(--slate)]/20 active:scale-95"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
