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
  Sparkles,
  Lock
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

  const itemsOperacion = [
    {
      id: 'mesas' as ModuloId,
      nombre: 'Mapa de mesas',
      icono: LayoutGrid,
      badge: stats.mesas_en_juego > 0 ? `${stats.mesas_en_juego}` : undefined,
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      id: 'pedidos' as ModuloId,
      nombre: 'Ventas y pedidos',
      icono: Receipt,
      badge: stats.pedidos_pendientes > 0 ? `${stats.pedidos_pendientes}` : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'inventario' as ModuloId,
      nombre: 'Inventario Bar',
      icono: Package,
      badge: stats.stock_bajo > 0 ? `${stats.stock_bajo}` : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'caja' as ModuloId,
      nombre: 'Caja y arqueo',
      icono: Wallet,
      badge: stats.caja_abierta ? 'Abierta' : 'Cerrada',
      badgeColor: stats.caja_abierta ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300',
    },
    {
      id: 'torneos' as ModuloId,
      nombre: 'Campeonatos',
      icono: Trophy,
      badge: 'En vivo',
      badgeColor: 'bg-emerald-600 text-white',
    },
  ];

  const itemsAdmin = [
    {
      id: 'reportes' as ModuloId,
      nombre: 'Reportes',
      icono: BarChart3,
      bloqueado: true,
    },
    {
      id: 'configuracion' as ModuloId,
      nombre: 'Tarifas y usuarios',
      icono: Settings,
      bloqueado: true,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col flex-shrink-0 border-r border-slate-800 select-none">
      
      {/* Brand Header */}
      <div className="flex items-center gap-3 p-5 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-950">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-sm tracking-wider text-white">BILLAR CHAMO</h1>
          <p className="text-[11px] text-slate-400">Sistema de Control</p>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        
        {/* Sección Operación */}
        <div>
          <div className="px-3 pb-2 text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">
            Operación
          </div>
          <nav className="space-y-1">
            {itemsOperacion.map((item) => {
              const activo = moduloActivo === item.id;
              const Icono = item.icono;

              return (
                <button
                  key={item.id}
                  onClick={() => onCambiarModulo(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition relative group ${
                    activo
                      ? 'bg-gradient-to-r from-indigo-600/40 to-indigo-600/10 text-white font-bold border-l-4 border-indigo-500 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icono className={`w-4 h-4 transition ${activo ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className="truncate">{item.nombre}</span>

                  {item.badge && (
                    <span className={`ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sección Administración */}
        <div>
          <div className="px-3 pb-2 text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">
            Administración
          </div>
          <nav className="space-y-1">
            {itemsAdmin.map((item) => {
              const activo = moduloActivo === item.id;
              const Icono = item.icono;

              return (
                <button
                  key={item.id}
                  onClick={() => onCambiarModulo(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition relative group ${
                    activo
                      ? 'bg-gradient-to-r from-indigo-600/40 to-indigo-600/10 text-white font-bold border-l-4 border-indigo-500 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icono className={`w-4 h-4 transition ${activo ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className="truncate">{item.nombre}</span>

                  {item.bloqueado && (
                    <span className="ml-auto text-slate-500 group-hover:text-slate-400" title="Requiere permisos de administrador">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Pie de Usuario / Sesión */}
      <div className="p-4 border-t border-slate-800 flex items-center gap-3 bg-slate-950/40">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-xs text-white border border-indigo-300/30 shadow">
          AA
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-200 truncate">Andrés Ardila</h4>
          <p className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${stats.caja_abierta ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
            Admin · {stats.caja_abierta ? 'Turno abierto' : 'Turno cerrado'}
          </p>
        </div>
        <button
          onClick={onBloquearTerminal}
          title="Bloquear terminal o cambiar usuario"
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

    </aside>
  );
}
