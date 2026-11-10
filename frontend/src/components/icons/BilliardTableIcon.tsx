'use client';

import React from 'react';

interface BilliardTableIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function BilliardTableIcon({
  className = '',
  size = 20,
  color = 'currentColor',
}: BilliardTableIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Mesa exterior con esquinas redondeadas */}
      <rect x="2" y="5" width="20" height="13" rx="2.5" />
      {/* Paño interior */}
      <rect x="4.5" y="7.5" width="15" height="8" rx="1.2" />
      {/* Troneras o puntos en las esquinas y centros */}
      <circle cx="5" cy="8" r="0.8" fill={color} />
      <circle cx="19" cy="8" r="0.8" fill={color} />
      <circle cx="12" cy="7.5" r="0.8" fill={color} />
      <circle cx="5" cy="15" r="0.8" fill={color} />
      <circle cx="19" cy="15" r="0.8" fill={color} />
      <circle cx="12" cy="15.5" r="0.8" fill={color} />
      {/* Bolas sobre el paño */}
      <circle cx="10" cy="11.5" r="1.1" fill={color} />
      <circle cx="14" cy="10.5" r="1.1" fill={color} />
      {/* Patas de la mesa */}
      <path d="M4 18v2.5M20 18v2.5" strokeWidth="2" />
    </svg>
  );
}
