'use client';

import React, { useRef, useEffect, useState } from 'react';

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

interface MenuItemDef {
  id: ModuloId;
  label: string;
  badge?: number | string | null;
  badgeType?: 'default' | 'warn';
  svgPath: React.ReactNode;
}

export default function Sidebar({
  moduloActivo,
  onCambiarModulo,
  stats,
  onBloquearTerminal,
}: SidebarProps) {
  const navRef = useRef<HTMLElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);
  const [barTop, setBarTop] = useState<number>(0);

  const menuItems: MenuItemDef[] = [
    {
      id: 'mesas',
      label: 'Mapa de mesas',
      badge: stats.mesas_en_juego > 0 ? stats.mesas_en_juego : null,
      svgPath: (
        <>
          <rect x="2.5" y="6" width="19" height="12" rx="3.5" />
          <circle cx="8" cy="12" r="1.5" />
          <path d="M13.5 8.5l3.5 7" />
        </>
      ),
    },
    {
      id: 'pedidos',
      label: 'Ventas y pedidos',
      badge: stats.pedidos_pendientes > 0 ? stats.pedidos_pendientes : null,
      svgPath: (
        <>
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
          <path d="M9 8h6M9 12h6" />
        </>
      ),
    },
    {
      id: 'jugadores',
      label: 'Jugadores',
      svgPath: (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      ),
    },
    {
      id: 'inventario',
      label: 'Inventario del bar',
      badge: stats.stock_bajo > 0 ? stats.stock_bajo : null,
      badgeType: 'warn',
      svgPath: (
        <>
          <path d="M3 8l9-5 9 5v8l-9 5-9-5z" />
          <path d="M3 8l9 5 9-5M12 13v8" />
        </>
      ),
    },
    {
      id: 'caja',
      label: 'Caja y arqueo',
      svgPath: (
        <>
          <rect x="2.5" y="7" width="19" height="13" rx="3.5" />
          <path d="M8 7V5.5A2.5 2.5 0 0110.5 3h3A2.5 2.5 0 0116 5.5V7" />
          <path d="M12 11v5.5M10 13.2c0-1 .9-1.5 2-1.5s2 .5 2 1.4-.9 1.2-2 1.4-2 .5-2 1.4.9 1.5 2 1.5 2-.5 2-1.4" />
        </>
      ),
    },
    {
      id: 'torneos',
      label: 'Torneos',
      svgPath: (
        <>
          <path d="M7 4h10v5a5 5 0 01-10 0z" />
          <path d="M7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M12 14v4M8 21h8" />
        </>
      ),
    },
    {
      id: 'reportes',
      label: 'Reportes',
      svgPath: (
        <>
          <path d="M4 20V11M10 20V4M16 20v-6M22 20H2" />
        </>
      ),
    },
    {
      id: 'configuracion',
      label: 'Ajustes y tarifas',
      svgPath: (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
        </>
      ),
    },
  ];

  // Calcular la posición vertical del bar indicador animado dentro del nav
  useEffect(() => {
    if (activeBtnRef.current && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const btnRect = activeBtnRef.current.getBoundingClientRect();
      const y = btnRect.top - navRect.top + (activeBtnRef.current.offsetHeight - 26) / 2;
      setBarTop(y);
    }
  }, [moduloActivo]);

  return (
    <aside
      className="panel-billar"
      style={{
        width: '280px',
        maxWidth: '100%',
        height: '100vh',
        maxHeight: '100vh',
        background: 'var(--panel)',
        padding: '20px 18px 16px 22px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxSizing: 'border-box',
        flexShrink: 0,
        borderRight: '1px solid rgba(120, 140, 160, 0.2)',
        userSelect: 'none',
        overflow: 'hidden',
      }}
      aria-label="Menú principal"
    >
      {/* Brand */}
      <h1
        className="brand-billar"
        style={{
          fontWeight: 800,
          fontSize: '17px',
          letterSpacing: '-0.02em',
          margin: '0 0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'var(--ink)',
        }}
      >
        <img
          src="/logo-tocano.jpg"
          alt="El Encuentro Tocano"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            flexShrink: 0,
          }}
        />
        <span>El Encuentro Tocano</span>
      </h1>

      {/* Profile */}
      <div
        className="profile-billar"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '16px',
        }}
      >
        <svg
          className="avatar-billar"
          viewBox="0 0 64 64"
          aria-hidden="true"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            boxShadow: '0 0 0 3px var(--ring), 0 6px 14px var(--shadow-out)',
            display: 'block',
          }}
        >
          <circle cx="32" cy="32" r="32" fill="#AAC7D5" />
          <circle cx="32" cy="25" r="10" fill="#F1D5BF" />
          <path
            d="M21 24c0-8 6-12 12-11 6 0 10 4 10 11-3-4-8-6-14-5-4 1-6 3-8 5z"
            fill="#28353E"
          />
          <path d="M10 58c2-12 11-18 22-18s20 6 22 18z" fill="#45576D" />
        </svg>
        <b
          style={{
            fontSize: '17px',
            fontWeight: 700,
            marginTop: '8px',
            letterSpacing: '-0.01em',
            color: 'var(--text)',
          }}
        >
          Carlos M.
        </b>
        <span
          style={{
            fontSize: '11.5px',
            color: 'var(--label)',
            fontWeight: 500,
          }}
        >
          Cajero · Turno de la tarde
        </span>
      </div>

      {/* Nav List */}
      <nav
        ref={navRef}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          flex: 1,
          paddingLeft: '10px',
        }}
      >
        {/* Indicador de barra vertical animada situado dentro del nav */}
        {moduloActivo !== 'reportes' && moduloActivo !== 'configuracion' && (
          <span
            className="bar-billar"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '4px',
              height: '26px',
              borderRadius: '0 4px 4px 0',
              background: 'var(--bar)',
              transform: `translateY(${barTop}px)`,
              transition: 'transform 0.25s cubic-bezier(0.3, 0.8, 0.3, 1)',
            }}
            aria-hidden="true"
          />
        )}

        {menuItems
          .filter((item) => item.id !== 'reportes' && item.id !== 'configuracion')
          .map((item) => {
          const isActive = moduloActivo === item.id;
          return (
            <button
              key={item.id}
              ref={isActive ? activeBtnRef : null}
              type="button"
              className={`item-billar ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onCambiarModulo(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                width: '100%',
                padding: '8px 6px',
                border: 0,
                background: 'none',
                color: isActive ? 'var(--text)' : 'var(--label)',
                font: isActive
                  ? '700 14px "Urbanist", system-ui, sans-serif'
                  : '600 14px "Urbanist", system-ui, sans-serif',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'color 0.15s, transform 0.15s',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{
                  width: '20px',
                  height: '20px',
                  flex: 'none',
                  stroke: isActive ? 'var(--text)' : 'var(--label)',
                  fill: 'none',
                  strokeWidth: isActive ? 2 : 1.6,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  transition: 'transform 0.15s, stroke 0.15s',
                }}
              >
                {item.svgPath}
              </svg>
              <span style={{ flex: 1 }}>{item.label}</span>

              {item.badge && (
                <span
                  className={`count-billar ${item.badgeType === 'warn' ? 'warn' : ''}`}
                  style={{
                    minWidth: '20px',
                    height: '20px',
                    padding: '0 6px',
                    borderRadius: '99px',
                    background:
                      item.badgeType === 'warn' ? '#E3A93F' : 'var(--ink)',
                    color: item.badgeType === 'warn' ? '#3B2806' : '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Empuje hacia abajo + Reportes y Ajustes encima de Cerrar Sesión */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px', paddingTop: '10px', borderTop: '1px solid rgba(119, 139, 150, 0.18)' }}>
        {menuItems.filter((item) => item.id === 'reportes' || item.id === 'configuracion').map((item) => {
          const isActive = moduloActivo === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onCambiarModulo(item.id)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 10px 9px 14px',
                borderRadius: '10px',
                fontFamily: 'inherit',
                fontSize: '13.5px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--text)' : 'var(--label)',
                background: isActive ? 'rgba(40, 53, 62, 0.08)' : 'transparent',
                border: 0,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    left: '-10px',
                    width: '4px',
                    height: '22px',
                    borderRadius: '0 4px 4px 0',
                    background: 'var(--bar)',
                  }}
                  aria-hidden="true"
                />
              )}
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{
                  width: '18px',
                  height: '18px',
                  flex: 'none',
                  stroke: isActive ? 'var(--text)' : 'var(--label)',
                  fill: 'none',
                  strokeWidth: isActive ? 2 : 1.6,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }}
              >
                {item.svgPath}
              </svg>
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Card Inferior: Cerrar Sesión / Bloquear Terminal */}
      <button
        className="hist-billar group"
        type="button"
        onClick={onBloquearTerminal}
        style={{
          background: 'var(--card)',
          color: 'var(--card-text)',
          borderRadius: '18px',
          padding: '14px 16px',
          position: 'relative',
          border: 0,
          textAlign: 'left',
          fontFamily: 'inherit',
          cursor: 'pointer',
          display: 'block',
          width: '100%',
          boxShadow: '0 8px 18px var(--shadow-out)',
          transition: 'all 0.2s ease',
        }}
        title="Cerrar sesión o bloquear terminal de control"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Icono Cerrar Sesión / Log out */}
              <svg
                viewBox="0 0 24 24"
                style={{
                  width: '18px',
                  height: '18px',
                  stroke: '#FFFFFF',
                  fill: 'none',
                  strokeWidth: 2,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }}
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <div>
              <b
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1.2,
                }}
              >
                Cerrar sesión
              </b>
              <small
                style={{
                  display: 'block',
                  fontSize: '11px',
                  color: 'var(--card-sub)',
                  fontWeight: 500,
                }}
              >
                Bloquear terminal
              </small>
            </div>
          </div>

          {/* Flechita / Indicador */}
          <svg
            viewBox="0 0 24 24"
            style={{
              width: '16px',
              height: '16px',
              stroke: 'var(--card-sub)',
              fill: 'none',
              strokeWidth: 2,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </button>
    </aside>
  );
}
