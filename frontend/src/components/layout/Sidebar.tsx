'use client';

import React from 'react';
import {
  LayoutGrid,
  Receipt,
  Package,
  Wallet,
  Trophy,
  BarChart3,
  Settings,
  LogOut,
  CircleDot,
  Lock,
} from 'lucide-react';

export type ModuloId =
  | 'mesas'
  | 'pedidos'
  | 'inventario'
  | 'caja'
  | 'torneos'
  | 'reportes'
  | 'configuracion';

export interface SidebarStats {
  mesas_en_juego: number;
  pedidos_pendientes: number;
  stock_bajo: number;
  caja_abierta: boolean;
  alertas: number;
}

interface SidebarProps {
  moduloActivo: ModuloId;
  onCambiarModulo: (modulo: ModuloId) => void;
  stats: SidebarStats;
  onBloquearTerminal: () => void;
}

export default function Sidebar({
  moduloActivo,
  onCambiarModulo,
  stats,
  onBloquearTerminal,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="logo">
          <CircleDot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1>BILLAR CHAMO</h1>
          <small>Sistema de control</small>
        </div>
      </div>

      {/* Operación */}
      <div className="nav-label">Operación</div>
      <ul className="nav">
        <li
          className={moduloActivo === 'mesas' ? 'active' : ''}
          onClick={() => onCambiarModulo('mesas')}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Mapa de mesas</span>
          {stats.mesas_en_juego > 0 && <span className="count">{stats.mesas_en_juego}</span>}
        </li>

        <li
          className={moduloActivo === 'pedidos' ? 'active' : ''}
          onClick={() => onCambiarModulo('pedidos')}
        >
          <Receipt className="w-4 h-4" />
          <span>Ventas</span>
        </li>

        <li
          className={moduloActivo === 'inventario' ? 'active' : ''}
          onClick={() => onCambiarModulo('inventario')}
        >
          <Package className="w-4 h-4" />
          <span>Inventario</span>
          {stats.stock_bajo > 0 && (
            <span className="count" style={{ background: 'var(--busy)', color: '#fff' }}>
              {stats.stock_bajo}
            </span>
          )}
        </li>

        <li
          className={moduloActivo === 'caja' ? 'active' : ''}
          onClick={() => onCambiarModulo('caja')}
        >
          <Wallet className="w-4 h-4" />
          <span>Caja y arqueo</span>
          {stats.caja_abierta && (
            <span className="count" style={{ background: 'var(--ok)', color: '#fff' }}>
              Abierto
            </span>
          )}
        </li>

        <li
          className={moduloActivo === 'torneos' ? 'active' : ''}
          onClick={() => onCambiarModulo('torneos')}
        >
          <Trophy className="w-4 h-4" />
          <span>Campeonatos</span>
          <span className="count" style={{ background: 'var(--ok)', color: '#fff' }}>
            En vivo
          </span>
        </li>
      </ul>

      {/* Administración */}
      <div className="nav-label">Administración</div>
      <ul className="nav">
        <li
          className={moduloActivo === 'reportes' ? 'active' : ''}
          onClick={() => onCambiarModulo('reportes')}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Reportes</span>
          <span className="end">
            <Lock className="w-3.5 h-3.5" />
          </span>
        </li>

        <li
          className={moduloActivo === 'configuracion' ? 'active' : ''}
          onClick={() => onCambiarModulo('configuracion')}
        >
          <Settings className="w-4 h-4" />
          <span>Usuarios y tarifas</span>
          <span className="end">
            <Lock className="w-3.5 h-3.5" />
          </span>
        </li>
      </ul>

      {/* Usuario en turno */}
      <div className="user-box">
        <div className="avatar">AA</div>
        <div>
          <h4>Andrés Ardila</h4>
          <p>Administrador · Turno {stats.caja_abierta ? 'abierto' : 'cerrado'}</p>
        </div>
        <button
          className="icon-btn"
          title="Bloquear / Cerrar sesión (RF-01.3)"
          onClick={onBloquearTerminal}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
