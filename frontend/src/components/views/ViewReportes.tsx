'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  Beer,
  Calendar,
  Download,
  Banknote,
  Smartphone,
  CreditCard,
  Award,
  CheckCircle2,
  AlertTriangle,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type Periodo = 'hoy' | 'semana' | 'mes' | 'personalizado';

const DATOS_GRAFICA: Record<Periodo, Array<{ label: string; mesas: number; barra: number }>> = {
  hoy: [
    { label: '2 PM', mesas: 42000, barra: 28000 },
    { label: '4 PM', mesas: 68000, barra: 45000 },
    { label: '6 PM', mesas: 95000, barra: 72000 },
    { label: '8 PM', mesas: 140000, barra: 115000 },
    { label: '10 PM', mesas: 175000, barra: 160000 },
    { label: '12 AM', mesas: 120000, barra: 135000 },
  ],
  semana: [
    { label: 'Lun', mesas: 180000, barra: 140000 },
    { label: 'Mar', mesas: 210000, barra: 165000 },
    { label: 'Mié', mesas: 245000, barra: 190000 },
    { label: 'Jue', mesas: 320000, barra: 280000 },
    { label: 'Vie', mesas: 490000, barra: 420000 },
    { label: 'Sáb', mesas: 610000, barra: 540000 },
    { label: 'Dom', mesas: 385000, barra: 310000 },
  ],
  mes: [
    { label: 'Sem 1', mesas: 1850000, barra: 1420000 },
    { label: 'Sem 2', mesas: 2120000, barra: 1680000 },
    { label: 'Sem 3', mesas: 2340000, barra: 1890000 },
    { label: 'Sem 4', mesas: 2440000, barra: 2045000 },
  ],
  personalizado: [
    { label: 'Ago', mesas: 7800000, barra: 6100000 },
    { label: 'Sep', mesas: 8250000, barra: 6450000 },
    { label: 'Oct', mesas: 8900000, barra: 7120000 },
    { label: 'Nov', mesas: 8750000, barra: 7035000 },
  ],
};

const TOP_PRODUCTOS = [
  { nombre: 'Cerveza Poker 330ml', categoria: 'Cervezas', unidades: 184, total: 828000 },
  { nombre: 'Club Colombia Dorada', categoria: 'Cervezas', unidades: 112, total: 616000 },
  { nombre: 'Media Aguardiente Antioqueño', categoria: 'Licores', unidades: 14, total: 672000 },
  { nombre: 'Coronita 210ml', categoria: 'Cervezas', unidades: 68, total: 476000 },
];

const HISTORIAL_CIERRES = [
  {
    id: 'TUR-104',
    fecha: '12 Nov · 11:30 PM',
    apertura: '02:00 PM',
    cajero: 'Carlos Méndez',
    baseInicial: 100000,
    ventasMesas: 460000,
    ventasBarra: 315000,
    efectivo: 545000,
    transferencias: 230000,
    egresos: 30000,
    esperado: 845000,
    contado: 845000,
    diferencia: 0,
    observaciones: 'Cierre sin novedades, caja cuadrada.',
  },
  {
    id: 'TUR-103',
    fecha: '11 Nov · 11:45 PM',
    apertura: '02:15 PM',
    cajero: 'Andrés Gómez',
    baseInicial: 100000,
    ventasMesas: 340000,
    ventasBarra: 212000,
    efectivo: 412000,
    transferencias: 140000,
    egresos: 40000,
    esperado: 612000,
    contado: 610000,
    diferencia: -2000,
    observaciones: 'Faltante menor en monedas al cierre.',
  },
  {
    id: 'TUR-102',
    fecha: '10 Nov · 11:15 PM',
    apertura: '01:50 PM',
    cajero: 'Carlos Méndez',
    baseInicial: 100000,
    ventasMesas: 290000,
    ventasBarra: 168000,
    efectivo: 348000,
    transferencias: 110000,
    egresos: 20000,
    esperado: 528000,
    contado: 530000,
    diferencia: 2000,
    observaciones: 'Sobrante de $2.000 en billetes.',
  },
];

export default function ViewReportes() {
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [rangoAbierto, setRangoAbierto] = useState<boolean>(false);
  const [agrupacionRango, setAgrupacionRango] = useState<'dias' | 'meses'>('dias');
  const [calMesIdx, setCalMesIdx] = useState<number>(10); // 10 = Noviembre
  const [calAnio, setCalAnio] = useState<number>(2026);
  const [diaInicio, setDiaInicio] = useState<number>(1);
  const [diaFin, setDiaFin] = useState<number | null>(12);
  const [mesInicioIdx, setMesInicioIdx] = useState<number>(7); // Agosto
  const [mesFinIdx, setMesFinIdx] = useState<number | null>(10); // Noviembre
  const [turnoDetalle, setTurnoDetalle] = useState<(typeof HISTORIAL_CIERRES)[0] | null>(null);
  const rangoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickAfuera = (e: MouseEvent) => {
      if (rangoRef.current && !rangoRef.current.contains(e.target as Node)) {
        setRangoAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  const NOMBRES_MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const NOMBRES_MESES_LARGO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const handleClickDia = (dia: number) => {
    if (diaFin !== null || dia < diaInicio) {
      setDiaInicio(dia);
      setDiaFin(null);
    } else {
      setDiaFin(dia);
    }
  };

  const handleClickMes = (idx: number) => {
    if (mesFinIdx !== null || idx < mesInicioIdx) {
      setMesInicioIdx(idx);
      setMesFinIdx(null);
    } else {
      setMesFinIdx(idx);
    }
  };

  const datosActuales =
    periodo === 'personalizado' && agrupacionRango === 'dias'
      ? [
          { label: '01 Nov', mesas: 210000, barra: 155000 },
          { label: '03 Nov', mesas: 260000, barra: 190000 },
          { label: '05 Nov', mesas: 310000, barra: 240000 },
          { label: '07 Nov', mesas: 480000, barra: 390000 },
          { label: '09 Nov', mesas: 520000, barra: 430000 },
          { label: '12 Nov', mesas: 410000, barra: 325000 },
        ]
      : DATOS_GRAFICA[periodo];
  const maxValor = Math.max(...datosActuales.map((d) => d.mesas + d.barra), 1);

  const formatearEjeY = (val: number) => {
    if (val === 0) return '$0';
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1).replace('.0', '')}M`;
    return `$${Math.round(val / 1000)}k`;
  };

  const ticksEjeY = [1, 0.75, 0.5, 0.25, 0].map((factor) => Math.round(maxValor * factor));

  return (
    <div className="w-full h-full flex flex-col gap-3 font-['Urbanist',sans-serif] select-none overflow-hidden">
      {/* 1. Barra Superior de Filtros y Exportación */}
      <div className="bg-white px-5 py-3 rounded-2xl border border-slate-300 shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#28353E] text-white flex items-center justify-center shadow-xs">
            <BarChart3 className="w-5 h-5 text-[#AAC7D5]" />
          </div>
          <div>
            <h3 className="font-black text-base text-[#28353E] leading-none">
              Reportes & Analítica del Club
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              Consolidado de mesas, ventas de barra y auditoría de cierres
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative" ref={rangoRef}>
          {/* Selector de Período */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'hoy', label: 'Hoy' },
              { id: 'semana', label: 'Esta Semana' },
              { id: 'mes', label: 'Este Mes' },
              { id: 'personalizado', label: 'Rango' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  const p = item.id as Periodo;
                  if (p === 'personalizado') {
                    if (periodo === 'personalizado') {
                      setRangoAbierto((prev) => !prev);
                    } else {
                      setPeriodo('personalizado');
                      setRangoAbierto(true);
                    }
                  } else {
                    setPeriodo(p);
                    setRangoAbierto(false);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  periodo === item.id
                    ? 'bg-[#28353E] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button className="px-3.5 py-2 rounded-xl bg-[#184A35] hover:bg-[#123828] text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>

          {/* Popover Flotante de Calendario Visual (clic directo, sin escribir) */}
          {periodo === 'personalizado' && rangoAbierto && (
            <div className="absolute right-0 top-12 z-40 w-[290px] bg-white rounded-2xl p-3.5 border border-slate-300 shadow-2xl flex flex-col gap-3 animate-in fade-in duration-150">
              {/* Header + Toggle Días / Meses */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-black text-xs text-[#28353E] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#184A35]" />
                  Rango
                </span>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setAgrupacionRango('dias')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      agrupacionRango === 'dias'
                        ? 'bg-[#28353E] text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Días
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgrupacionRango('meses')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      agrupacionRango === 'meses'
                        ? 'bg-[#28353E] text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Meses
                  </button>
                </div>
              </div>

              {agrupacionRango === 'dias' ? (
                <div className="flex flex-col gap-2">
                  {/* Navegación de Mes */}
                  <div className="flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={() => setCalMesIdx((m) => (m === 0 ? 11 : m - 1))}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-black text-xs text-[#28353E]">
                      {NOMBRES_MESES_LARGO[calMesIdx]} {calAnio}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalMesIdx((m) => (m === 11 ? 0 : m + 1))}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Cabecera Días */}
                  <div
                    className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
                  >
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>

                  {/* Cuadrícula de Días 1..30 */}
                  <div
                    className="grid grid-cols-7 gap-1 text-xs"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((dia) => {
                      const esInicio = dia === diaInicio;
                      const esFin = dia === diaFin;
                      const enRango = diaFin !== null && dia > diaInicio && dia < diaFin;
                      return (
                        <button
                          key={dia}
                          type="button"
                          onClick={() => handleClickDia(dia)}
                          className={`h-7 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                            esInicio || esFin
                              ? 'bg-[#184A35] text-white font-black shadow-xs'
                              : enRango
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          {dia}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-center font-semibold text-slate-500">
                    {diaFin !== null
                      ? `Del ${diaInicio} al ${diaFin} de ${NOMBRES_MESES[calMesIdx]}`
                      : `Inicio: ${diaInicio} de ${NOMBRES_MESES[calMesIdx]} (elige fin)`}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Navegación de Año */}
                  <div className="flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={() => setCalAnio((a) => a - 1)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-black text-xs text-[#28353E]">{calAnio}</span>
                    <button
                      type="button"
                      onClick={() => setCalAnio((a) => a + 1)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Cuadrícula de 12 Meses */}
                  <div
                    className="grid grid-cols-3 gap-1.5 text-xs"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
                  >
                    {NOMBRES_MESES.map((mes, idx) => {
                      const esInicio = idx === mesInicioIdx;
                      const esFin = idx === mesFinIdx;
                      const enRango = mesFinIdx !== null && idx > mesInicioIdx && idx < mesFinIdx;
                      return (
                        <button
                          key={mes}
                          type="button"
                          onClick={() => handleClickMes(idx)}
                          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            esInicio || esFin
                              ? 'bg-[#184A35] text-white font-black shadow-xs'
                              : enRango
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          {mes}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-center font-semibold text-slate-500">
                    {mesFinIdx !== null
                      ? `De ${NOMBRES_MESES[mesInicioIdx]} a ${NOMBRES_MESES[mesFinIdx]} ${calAnio}`
                      : `Inicio: ${NOMBRES_MESES[mesInicioIdx]} (elige mes fin)`}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setRangoAbierto(false)}
                className="w-full py-2 rounded-xl bg-[#184A35] hover:bg-[#123828] text-white font-black text-xs cursor-pointer transition-all"
              >
                Aplicar Rango
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Fila de 3 Tarjetas KPI */}
      <div
        className="grid grid-cols-3 gap-3 shrink-0"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
      >
        <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-black uppercase tracking-wider">Facturación Total</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="font-mono font-black text-2xl text-[#28353E]">$4.485.000</span>
            <p className="text-[10.5px] font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +14.2% vs período anterior
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-black uppercase tracking-wider">Horas de Juego</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="font-mono font-black text-2xl text-[#28353E]">142.5 h</span>
            <p className="text-[10.5px] font-semibold text-slate-400 mt-0.5">
              Promedio 20.3 h / día · $2.440.000
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-black uppercase tracking-wider">Consumo en Barra</span>
            <Beer className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="font-mono font-black text-2xl text-[#28353E]">$2.045.000</span>
            <p className="text-[10.5px] font-semibold text-slate-400 mt-0.5">
              45.6% del ingreso total del club
            </p>
          </div>
        </div>
      </div>

      {/* 3. Cuerpo Central: Gráfico de Barras + Desglose */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        {/* Izquierda: Gráfico Comparativo Mesas vs Barra */}
        <div className="flex-1 bg-white rounded-2xl p-4 border border-slate-300 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
            <div>
              <h4 className="font-black text-sm text-[#28353E]">
                Ingresos Diarios: Mesas vs. Barra
              </h4>
              <p className="text-[11px] font-semibold text-slate-400">
                Distribución semanal por origen de venta
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#184A35]" /> Mesas
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#45576D]" /> Barra
              </span>
            </div>
          </div>

          {/* Barras con Eje Y (COP) y Líneas Guía */}
          <div className="flex-1 flex gap-3 pt-4 pb-1 px-1 min-h-0">
            {/* Eje Y */}
            <div className="flex flex-col justify-between items-end pr-2 pb-6 text-[10px] font-mono font-bold text-slate-400 shrink-0 select-none">
              {ticksEjeY.map((tick, idx) => (
                <span key={idx}>{formatearEjeY(tick)}</span>
              ))}
            </div>

            {/* Área de Barras */}
            <div className="flex-1 relative flex items-end justify-between gap-3 pb-6 min-h-0">
              {/* Líneas horizontales de referencia */}
              <div className="absolute inset-0 bottom-6 flex flex-col justify-between pointer-events-none">
                {ticksEjeY.map((_, idx) => (
                  <div key={idx} className="w-full border-b border-dashed border-slate-200/80" />
                ))}
              </div>

              {datosActuales.map((d) => {
                const total = d.mesas + d.barra;
                const pctMesas = Math.round((d.mesas / maxValor) * 100);
                const pctBarra = Math.round((d.barra / maxValor) * 100);
                return (
                  <div key={d.label} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 group relative z-10">
                    <span className="font-mono text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatearEjeY(total)}
                    </span>
                    <div className="w-full max-w-[44px] flex-1 flex flex-col justify-end gap-0.5">
                      <div
                        style={{ height: `${pctBarra}%` }}
                        className="w-full bg-[#45576D] rounded-t-md transition-all group-hover:brightness-110"
                        title={`Barra: $${d.barra.toLocaleString('es-CO')}`}
                      />
                      <div
                        style={{ height: `${pctMesas}%` }}
                        className="w-full bg-[#184A35] rounded-b-md transition-all group-hover:brightness-110"
                        title={`Mesas: $${d.mesas.toLocaleString('es-CO')}`}
                      />
                    </div>
                    <span className="absolute -bottom-6 text-[11px] font-extrabold text-slate-600">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Derecha: Métodos de Pago */}
        <div className="w-[340px] flex flex-col shrink-0 overflow-hidden">
          <div className="flex-1 h-full bg-white rounded-2xl p-4 border border-slate-300 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="font-black text-sm text-[#28353E] pb-1.5 border-b border-slate-200 mb-4">
                Recaudo por Método de Pago
              </h4>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Efectivo
                    </span>
                    <span className="font-mono">$2.915.000 (65%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-purple-600" /> Nequi / Daviplata
                    </span>
                    <span className="font-mono">$1.570.000 (35%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: '35%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Total Recaudado
              </span>
              <span className="font-mono font-black text-base text-[#184A35]">
                $4.485.000
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tabla Inferior: Auditoría de Cierres Recientes */}
      <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-xs shrink-0">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
          <h4 className="font-black text-sm text-[#28353E] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#45576D]" />
            Últimos Cierres de Caja y Arqueos
          </h4>
          <span className="text-[11px] font-bold text-slate-400">Auditoría reciente</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {HISTORIAL_CIERRES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setTurnoDetalle(c)}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#28353E]/40 flex items-center justify-between text-xs text-left transition-all cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-[#28353E]">{c.id}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">· {c.fecha}</span>
                </div>
                <p className="font-bold text-slate-700 mt-0.5">{c.cajero}</p>
              </div>

              <div className="text-right">
                <span className="font-mono font-black text-slate-800 block">
                  ${c.contado.toLocaleString('es-CO')}
                </span>
                {c.diferencia === 0 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" /> Cuadrada
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-black ${
                      c.diferencia < 0 ? 'text-rose-600' : 'text-blue-600'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {c.diferencia > 0 ? '+' : ''}${c.diferencia.toLocaleString('es-CO')}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal de Detalle del Turno de Caja */}
      {turnoDetalle && (
        <div
          onClick={() => setTurnoDetalle(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-300 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-[#28353E] text-white">
                    {turnoDetalle.id}
                  </span>
                  <h4 className="font-black text-base text-[#28353E]">Detalle de Cierre de Caja</h4>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 mt-1">
                  Cajero: <b className="text-slate-800">{turnoDetalle.cajero}</b> · {turnoDetalle.apertura} – {turnoDetalle.fecha}
                </p>
              </div>
              <button
                onClick={() => setTurnoDetalle(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Desglose de Ingresos */}
            <div
              className="grid grid-cols-2 gap-2 text-xs"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
            >
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Mesas</span>
                <b className="font-mono text-sm text-[#28353E]">
                  ${turnoDetalle.ventasMesas.toLocaleString('es-CO')}
                </b>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Barra</span>
                <b className="font-mono text-sm text-[#28353E]">
                  ${turnoDetalle.ventasBarra.toLocaleString('es-CO')}
                </b>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Efectivo</span>
                <b className="font-mono text-sm text-emerald-800">
                  ${turnoDetalle.efectivo.toLocaleString('es-CO')}
                </b>
              </div>
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
                <span className="text-[10px] font-bold text-purple-700 uppercase block">Nequi / Daviplata</span>
                <b className="font-mono text-sm text-purple-800">
                  ${turnoDetalle.transferencias.toLocaleString('es-CO')}
                </b>
              </div>
            </div>

            {/* Balance Físico del Arqueo */}
            <div className="p-3.5 rounded-2xl bg-[#EDF2F7] border border-slate-300 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base Inicial:</span>
                <b className="font-mono text-slate-800">${turnoDetalle.baseInicial.toLocaleString('es-CO')}</b>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Gastos / Egresos:</span>
                <b className="font-mono text-rose-600">-${turnoDetalle.egresos.toLocaleString('es-CO')}</b>
              </div>
              <div className="flex justify-between text-slate-700 font-bold pt-1.5 border-t border-slate-300">
                <span>Saldo Esperado:</span>
                <span className="font-mono">${turnoDetalle.esperado.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-black">
                <span>Efectivo Contado:</span>
                <span className="font-mono">${turnoDetalle.contado.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-300 font-black">
                <span>Diferencia:</span>
                <span
                  className={`font-mono px-2 py-0.5 rounded-md ${
                    turnoDetalle.diferencia === 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : turnoDetalle.diferencia < 0
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {turnoDetalle.diferencia === 0
                    ? 'Cuadrada ($0)'
                    : `${turnoDetalle.diferencia > 0 ? '+' : ''}$${turnoDetalle.diferencia.toLocaleString('es-CO')}`}
                </span>
              </div>
            </div>

            {turnoDetalle.observaciones && (
              <p className="text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <b>Observaciones:</b> {turnoDetalle.observaciones}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-[#28353E] hover:bg-[#1a2329] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
              <button
                onClick={() => setTurnoDetalle(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
