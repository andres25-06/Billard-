'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Printer,
  X,
  Plus,
  Coins,
  Banknote,
  Clock,
  UserCheck,
  TrendingUp,
  DollarSign,
  FileText,
  CreditCard,
  Smartphone,
  Info,
} from 'lucide-react';
import {
  fetchTurnoActivo,
  abrirTurnoCaja,
  cerrarTurnoCaja,
  registrarMovimientoCaja,
} from '@/lib/api';

interface Movimiento {
  id: string;
  tipo: string;
  metodo_pago: string;
  monto: number;
  descripcion: string;
  creado_el: string;
}

interface TurnoActivo {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  fecha_apertura: string;
  monto_apertura_base: number;
  total_ventas: number;
  total_efectivo: number;
  total_transferencias: number;
  total_tarjetas: number;
  total_egresos: number;
  saldo_esperado_efectivo: number;
  ultimos_movimientos: Movimiento[];
}

// Denominaciones Colombianas de Billetes y Monedas
const DENOMINACIONES = [
  { valor: 100000, label: '$100.000', tipo: 'billete' },
  { valor: 50000, label: '$50.000', tipo: 'billete' },
  { valor: 20000, label: '$20.000', tipo: 'billete' },
  { valor: 10000, label: '$10.000', tipo: 'billete' },
  { valor: 5000, label: '$5.000', tipo: 'billete' },
  { valor: 2000, label: '$2.000', tipo: 'billete' },
];

export default function ViewCaja() {
  const [turno, setTurno] = useState<TurnoActivo | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  // Apertura
  const [baseInicial, setBaseInicial] = useState<number>(100000);
  const [abriendoTurno, setAbriendoTurno] = useState<boolean>(false);

  // Modal Egreso / Gasto Menor
  const [modalGastoAbierto, setModalGastoAbierto] = useState<boolean>(false);
  const [montoGasto, setMontoGasto] = useState<number>(0);
  const [descripcionGasto, setDescripcionGasto] = useState<string>('');
  const [guardandoGasto, setGuardandoGasto] = useState<boolean>(false);

  // Modal Arqueo y Cierre
  const [modalArqueoAbierto, setModalArqueoAbierto] = useState<boolean>(false);
  const [cantidadesBilletes, setCantidadesBilletes] = useState<{ [valor: number]: number }>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
  });
  const [monedasSueltas, setMonedasSueltas] = useState<number>(0);
  const [observacionesCierre, setObservacionesCierre] = useState<string>('');
  const [cerrandoTurno, setCerrandoTurno] = useState<boolean>(false);

  // Comprobante Térmico de Cierre (Ticket)
  const [ticketCierre, setTicketCierre] = useState<{
    id: string;
    fechaApertura: string;
    fechaCierre: string;
    cajero: string;
    baseInicial: number;
    totalVentas: number;
    totalEfectivo: number;
    totalTransferencias: number;
    totalTarjetas: number;
    totalEgresos: number;
    esperado: number;
    declarado: number;
    diferencia: number;
    observaciones?: string;
  } | null>(null);

  const cargarTurno = async () => {
    try {
      setCargando(true);
      const data = await fetchTurnoActivo();
      setTurno(data.turno || null);
    } catch (e) {
      console.error('Error al cargar turno de caja:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTurno();
  }, []);

  // Total declarado mediante calculadora táctica
  const totalBilletes = Object.entries(cantidadesBilletes).reduce((acc, [val, cant]) => {
    return acc + Number(val) * (Number(cant) || 0);
  }, 0);
  const totalDeclaradoArqueo = totalBilletes + (Number(monedasSueltas) || 0);
  const saldoEsperado = turno?.saldo_esperado_efectivo || 0;
  const diferenciaArqueo = totalDeclaradoArqueo - saldoEsperado;

  const handleIncrementarDenominacion = (valor: number, delta: number) => {
    setCantidadesBilletes((prev) => ({
      ...prev,
      [valor]: Math.max(0, (prev[valor] || 0) + delta),
    }));
  };

  const handleAbrirTurno = async () => {
    if (baseInicial < 0) return;
    try {
      setAbriendoTurno(true);
      await abrirTurnoCaja(baseInicial);
      await cargarTurno();
    } catch (e: any) {
      alert(e.message || 'Error al abrir turno');
    } finally {
      setAbriendoTurno(false);
    }
  };

  const handleGuardarGasto = async () => {
    if (montoGasto <= 0 || !descripcionGasto.trim()) {
      alert('Ingresa el monto del egreso y el concepto de justificación');
      return;
    }
    try {
      setGuardandoGasto(true);
      await registrarMovimientoCaja({
        tipo: 'egreso_gasto',
        monto: montoGasto,
        descripcion: descripcionGasto.trim(),
        metodo_pago: 'efectivo',
      });
      setModalGastoAbierto(false);
      setMontoGasto(0);
      setDescripcionGasto('');
      await cargarTurno();
    } catch (e: any) {
      alert(e.message || 'Error al registrar egreso');
    } finally {
      setGuardandoGasto(false);
    }
  };

  const handleConfirmarCierre = async () => {
    if (!turno) return;
    try {
      setCerrandoTurno(true);
      const res = await cerrarTurnoCaja(totalDeclaradoArqueo, observacionesCierre);

      // Armar el comprobante térmico con los datos finales
      setTicketCierre({
        id: turno.id.slice(0, 8),
        fechaApertura: turno.fecha_apertura,
        fechaCierre: new Date().toISOString(),
        cajero: turno.usuario_nombre,
        baseInicial: Number(turno.monto_apertura_base),
        totalVentas: turno.total_ventas,
        totalEfectivo: turno.total_efectivo,
        totalTransferencias: turno.total_transferencias,
        totalTarjetas: turno.total_tarjetas,
        totalEgresos: turno.total_egresos,
        esperado: res.saldo_esperado,
        declarado: res.declarado,
        diferencia: res.diferencia,
        observaciones: observacionesCierre,
      });

      setModalArqueoAbierto(false);
      await cargarTurno();
    } catch (e: any) {
      alert(e.message || 'Error al cerrar el turno');
    } finally {
      setCerrandoTurno(false);
    }
  };

  const formatearCOP = (val: number) => {
    return '$' + Math.round(val).toLocaleString('es-CO');
  };

  return (
    <div className="w-full h-full flex flex-col gap-3 font-['Urbanist',sans-serif] select-none overflow-hidden">
      {/* ============================================================== */}
      {/* ESTADO 1: CAJA CERRADA (APERTURA DE TURNO)                    */}
      {/* ============================================================== */}
      {!turno && !cargando ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-300 shadow-xl text-center relative overflow-hidden">
            {/* Cabecera / Branding */}
            <div className="w-16 h-16 rounded-2xl bg-[#184A35] text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-[#184A35]/20">
              <Lock className="w-8 h-8" />
            </div>

            <span className="text-[11px] font-black tracking-widest text-[#184A35] uppercase bg-[#184A35]/10 px-3 py-1 rounded-full">
              Control de Turno Obligatorio
            </span>

            <h3 className="font-black text-2xl text-[#28353E] mt-3">
              Caja Cerrada · Apertura de Turno
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-1 max-w-sm mx-auto">
              Club de Billar & Café Bar <b>El Encuentro Tocano</b>. Registra la base en efectivo antes de operar mesas y despachar comandas.
            </p>

            {/* Input de Base Inicial */}
            <div className="mt-6 p-5 bg-[#EDF2F7] rounded-2xl border border-slate-300/80 text-left">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block mb-2">
                Monto Base en Efectivo Físico (COP)
              </label>

              <div className="relative flex items-center">
                <span className="absolute left-4 font-mono font-black text-xl text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  value={baseInicial || ''}
                  onChange={(e) => setBaseInicial(Number(e.target.value))}
                  placeholder="100000"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-2xl font-mono font-black text-[#28353E] focus:outline-none focus:ring-2 focus:ring-[#184A35]"
                />
              </div>

              {/* Presets Rápidos de Base */}
              <div className="flex items-center gap-2 mt-3">
                {[50000, 100000, 200000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBaseInicial(preset)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      baseInicial === preset
                        ? 'bg-[#184A35] text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    {formatearCOP(preset)}
                  </button>
                ))}
              </div>
            </div>

            {/* Botón Acción Principal */}
            <button
              onClick={handleAbrirTurno}
              disabled={abriendoTurno || baseInicial < 0}
              className="w-full mt-6 py-4 rounded-2xl bg-[#184A35] hover:bg-[#123828] text-white font-black text-sm shadow-lg shadow-[#184A35]/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Unlock className="w-5 h-5 stroke-[2.5]" />
              <span>{abriendoTurno ? 'Iniciando Turno...' : 'Abrir Turno de Caja'}</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* ============================================================== */}
      {/* ESTADO 2: TURNO ACTIVO (PANEL DE CONTROL FINANCIERO)          */}
      {/* ============================================================== */}
      {turno ? (
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          {/* 1. Cinta Superior de Auditoría */}
          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-300 shadow-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#184A35] text-white flex items-center justify-center shadow-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-[#28353E] leading-none">
                    Turno de Caja Activo
                  </h3>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Operativo
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-2">
                  <span>Cajero: <b className="text-slate-800">{turno.usuario_nombre}</b></span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Abierto: {new Date(turno.fecha_apertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </p>
              </div>
            </div>

            {/* Acciones Inmediatas de Caja */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalGastoAbierto(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <ArrowDownRight className="w-4 h-4 text-amber-700" />
                <span>Registrar Gasto / Egreso</span>
              </button>

              <button
                onClick={() => setModalArqueoAbierto(true)}
                className="px-4 py-2.5 rounded-xl bg-[#28353E] hover:bg-[#1a2329] text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Arqueo y Cerrar Turno</span>
              </button>
            </div>
          </div>

          {/* 2. Cuatro Tarjetas KPI Financieras en una sola fila */}
          <div className="grid grid-cols-4 gap-3 shrink-0" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
            {/* KPI 1: Facturación Total */}
            <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-black uppercase tracking-wider">Total Facturado</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2">
                <span className="font-mono font-black text-2xl text-[#28353E]">
                  {formatearCOP(turno.total_ventas)}
                </span>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  Mesas + Bar consolidado
                </p>
              </div>
            </div>

            {/* KPI 2: Efectivo Físico Esperado */}
            <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-black uppercase tracking-wider">Efectivo Esperado</span>
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2">
                <span className="font-mono font-black text-2xl text-emerald-700">
                  {formatearCOP(turno.saldo_esperado_efectivo)}
                </span>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  Base ({formatearCOP(turno.monto_apertura_base)}) + Efec - Gastos
                </p>
              </div>
            </div>

            {/* KPI 3: Transferencias Digitales */}
            <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-black uppercase tracking-wider">Nequi / Daviplata</span>
                <Smartphone className="w-4 h-4 text-purple-600" />
              </div>
              <div className="mt-2">
                <span className="font-mono font-black text-2xl text-purple-700">
                  {formatearCOP(turno.total_transferencias)}
                </span>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  Sin afectar efectivo de caja
                </p>
              </div>
            </div>

            {/* KPI 4: Egresos Registrados */}
            <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-black uppercase tracking-wider">Gastos / Egresos</span>
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
              </div>
              <div className="mt-2">
                <span className="font-mono font-black text-2xl text-rose-600">
                  {formatearCOP(turno.total_egresos)}
                </span>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  Salidas menores justificadas
                </p>
              </div>
            </div>
          </div>

          {/* 3. Panel Dividido: Últimos Movimientos + Resumen de Medios de Pago */}
          <div className="flex-1 flex gap-3 overflow-hidden min-h-0">
            {/* Movimientos de Caja en Vivo */}
            <div className="flex-1 bg-white rounded-2xl p-4 border border-slate-300 shadow-xs flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#28353E]" />
                  <h4 className="font-black text-sm text-[#28353E]">
                    Auditoría de Movimientos en el Turno
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  {turno.ultimos_movimientos.length} operaciones
                </span>
              </div>

              {/* Lista Scrollable sin desborde */}
              <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-2">
                {turno.ultimos_movimientos.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs font-semibold">
                    No hay movimientos registrados en este turno aún.
                  </div>
                ) : (
                  turno.ultimos_movimientos.map((m) => {
                    const esEgreso = m.tipo === 'egreso_gasto' || m.tipo === 'retiro_caja';
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              esEgreso ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {esEgreso ? (
                              <ArrowDownRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-slate-800 truncate leading-snug">
                              {m.descripcion || (esEgreso ? 'Gasto de caja' : 'Cobro de venta')}
                            </p>
                            <span className="text-[10px] font-semibold text-slate-400 capitalize">
                              {m.metodo_pago} · {new Date(m.creado_el).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`font-mono font-black text-xs shrink-0 ${
                            esEgreso ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {esEgreso ? '-' : '+'}
                          {formatearCOP(m.monto)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Desglose Lateral por Método de Pago (Compactado sin recortes) */}
            <div className="w-[310px] bg-white rounded-2xl p-4 border border-slate-300 shadow-xs flex flex-col justify-between shrink-0 overflow-y-auto">
              <div className="flex flex-col gap-2">
                <h4 className="font-black text-sm text-[#28353E] pb-1.5 border-b border-slate-200">
                  Desglose por Métodos
                </h4>

                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-600 flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      Efectivo en Ventas
                    </span>
                    <b className="font-mono text-[#28353E]">{formatearCOP(turno.total_efectivo)}</b>
                  </div>

                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-600 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                      Transferencias
                    </span>
                    <b className="font-mono text-[#28353E]">{formatearCOP(turno.total_transferencias)}</b>
                  </div>

                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-600 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      Datáfono / Tarjetas
                    </span>
                    <b className="font-mono text-[#28353E]">{formatearCOP(turno.total_tarjetas)}</b>
                  </div>
                </div>

                <div className="mt-1 p-2.5 rounded-xl bg-[#EDF2F7] border border-slate-300 flex flex-col gap-1 text-xs">
                  <span className="text-[10px] font-black uppercase text-slate-500">Balance del Cajón</span>
                  <div className="flex justify-between text-slate-700">
                    <span>Base Inicial (Fija):</span>
                    <b className="font-mono">{formatearCOP(turno.monto_apertura_base)}</b>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Efectivo cobrado:</span>
                    <b className="font-mono text-emerald-700">+{formatearCOP(turno.total_efectivo)}</b>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Egresos / Gastos:</span>
                    <b className="font-mono text-rose-600">-{formatearCOP(turno.total_egresos)}</b>
                  </div>
                  <div className="pt-1.5 border-t border-slate-300 flex justify-between items-center font-black text-[#28353E]">
                    <span>Total en Cajón:</span>
                    <span className="font-mono text-emerald-800 text-sm">
                      {formatearCOP(turno.saldo_esperado_efectivo)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setModalArqueoAbierto(true)}
                className="w-full py-2.5 rounded-xl bg-[#184A35] hover:bg-[#123828] text-white font-black text-xs shadow-md shadow-[#184A35]/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer mt-2 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Proceder al Arqueo Físico</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ============================================================== */}
      {/* MODAL 1: REGISTRAR GASTO / EGRESO MENOR                       */}
      {/* ============================================================== */}
      {modalGastoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-300 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-base text-[#28353E]">Registrar Egreso Menor</h4>
                  <p className="text-[11px] font-semibold text-slate-500">Salida de efectivo justificada</p>
                </div>
              </div>
              <button
                onClick={() => setModalGastoAbierto(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                  Monto del Gasto (COP)
                </label>
                <input
                  type="number"
                  value={montoGasto || ''}
                  onChange={(e) => setMontoGasto(Number(e.target.value))}
                  placeholder="Ej: 25000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-base text-[#28353E] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                  Concepto / Justificación *
                </label>
                <input
                  type="text"
                  value={descripcionGasto}
                  onChange={(e) => setDescripcionGasto(e.target.value)}
                  placeholder="Ej: Compra de hielo, propinas, pasabocas..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-[#28353E] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setModalGastoAbierto(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarGasto}
                disabled={guardandoGasto || montoGasto <= 0 || !descripcionGasto.trim()}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md disabled:opacity-50"
              >
                {guardandoGasto ? 'Guardando...' : 'Confirmar Egreso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: CALCULADORA TÁCTICA DE ARQUEO & CIERRE               */}
      {/* ============================================================== */}
      {modalArqueoAbierto && turno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 border border-slate-300 shadow-2xl flex flex-col gap-4 max-h-[95vh] overflow-hidden">
            {/* Header Arqueo */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#184A35] text-white flex items-center justify-center shadow-xs">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-[#28353E]">
                    Arqueo de Turno · Calculadora de Billetes COP
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Conteo táctil sin calculadoras externas para auditar descuadres
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalArqueoAbierto(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido: Grid de Billetes + Monedas */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                1. Conteo de Billetes por Denominación
              </span>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {DENOMINACIONES.map((den) => {
                  const cant = cantidadesBilletes[den.valor] || 0;
                  const subtotal = den.valor * cant;
                  return (
                    <div
                      key={den.valor}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-[#28353E]">{den.label}</span>
                        <span className="font-mono text-[10px] font-bold text-slate-500">
                          {formatearCOP(subtotal)}
                        </span>
                      </div>

                      {/* Control + / - táctil */}
                      <div className="flex items-center justify-between mt-2 bg-white px-2 py-1 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleIncrementarDenominacion(den.valor, -1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 font-black"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={cant || ''}
                          onChange={(e) =>
                            setCantidadesBilletes((prev) => ({
                              ...prev,
                              [den.valor]: Math.max(0, parseInt(e.target.value) || 0),
                            }))
                          }
                          className="w-12 text-center font-mono font-black text-xs text-[#28353E] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleIncrementarDenominacion(den.valor, 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 font-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Monedas Sueltas */}
              <div className="mt-1 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-700">Monedas Sueltas Totales (COP)</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={monedasSueltas || ''}
                  onChange={(e) => setMonedasSueltas(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-32 px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-black text-xs text-right text-[#28353E] focus:outline-none focus:ring-1 focus:ring-[#184A35]"
                />
              </div>

              {/* 2. Resumen Comparativo de Arqueo */}
              <div className="p-3.5 rounded-2xl bg-[#EDF2F7] border border-slate-300 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Esperado por Sistema</span>
                  <b className="font-mono text-sm text-slate-800">{formatearCOP(saldoEsperado)}</b>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Físico Contado</span>
                  <b className="font-mono text-base font-black text-[#28353E]">
                    {formatearCOP(totalDeclaradoArqueo)}
                  </b>
                </div>

                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Resultado</span>
                  <span
                    className={`font-mono font-black text-sm px-2 py-0.5 rounded-lg border ${
                      diferenciaArqueo === 0
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : diferenciaArqueo > 0
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    {diferenciaArqueo === 0
                      ? '✓ Cuadrada'
                      : diferenciaArqueo > 0
                      ? `+${formatearCOP(diferenciaArqueo)} (Sobrante)`
                      : `${formatearCOP(diferenciaArqueo)} (Faltante)`}
                  </span>
                </div>
              </div>

              {/* Observaciones si hay descuadre */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Observaciones de Cierre {diferenciaArqueo !== 0 && <span className="text-rose-600 font-black">* (Justificación requerida)</span>}
                </label>
                <input
                  type="text"
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  placeholder="Comentarios adicionales o justificación de descuadre..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-[#28353E] focus:outline-none focus:ring-1 focus:ring-[#184A35]"
                />
              </div>
            </div>

            {/* Acciones Cierre */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 shrink-0">
              <button
                onClick={() => setModalArqueoAbierto(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarCierre}
                disabled={cerrandoTurno}
                className="flex-1 py-3 rounded-xl bg-[#184A35] hover:bg-[#123828] text-white font-black text-xs shadow-md shadow-[#184A35]/25 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{cerrandoTurno ? 'Procesando Cierre...' : 'Confirmar Cierre & Imprimir'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: COMPROBANTE TÉRMICO DE CIERRE (TIRILLA 80MM)          */}
      {/* ============================================================== */}
      {ticketCierre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 border border-slate-300 shadow-2xl flex flex-col gap-3 font-mono text-xs">
            {/* Header del Ticket */}
            <div className="text-center pb-2 border-b border-dashed border-slate-300">
              <b className="text-sm font-black text-slate-900 block uppercase">
                El Encuentro Tocano
              </b>
              <span className="text-[10px] text-slate-500 block">Club de Billar & Café Bar</span>
              <span className="text-[9.5px] text-slate-400 block mt-0.5">
                Tocancipá · NIT: 900.824.112-1
              </span>
              <div className="mt-2 py-0.5 px-2 bg-slate-100 rounded text-[10px] font-bold text-slate-700 inline-block">
                COMPROBANTE DE CIERRE DE TURNO #{ticketCierre.id}
              </div>
            </div>

            {/* Datos del Turno */}
            <div className="flex flex-col gap-1 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>Cajero:</span>
                <b className="text-slate-900">{ticketCierre.cajero}</b>
              </div>
              <div className="flex justify-between">
                <span>Apertura:</span>
                <span>{new Date(ticketCierre.fechaApertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Cierre:</span>
                <span>{new Date(ticketCierre.fechaCierre).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Desglose de Ventas */}
            <div className="py-2 border-y border-dashed border-slate-300 flex flex-col gap-1 text-[11px]">
              <div className="flex justify-between text-slate-700">
                <span>Ventas Totales:</span>
                <b className="font-bold">{formatearCOP(ticketCierre.totalVentas)}</b>
              </div>
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>• En Efectivo:</span>
                <span>{formatearCOP(ticketCierre.totalEfectivo)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>• Transferencias:</span>
                <span>{formatearCOP(ticketCierre.totalTransferencias)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>• Datáfono:</span>
                <span>{formatearCOP(ticketCierre.totalTarjetas)}</span>
              </div>
            </div>

            {/* Balance Físico de Caja */}
            <div className="flex flex-col gap-1 text-[11px]">
              <div className="flex justify-between text-slate-700">
                <span>Base Inicial:</span>
                <b>{formatearCOP(ticketCierre.baseInicial)}</b>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Gastos / Egresos:</span>
                <b className="text-rose-600">-{formatearCOP(ticketCierre.totalEgresos)}</b>
              </div>
              <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-slate-200">
                <span>Saldo Esperado:</span>
                <span>{formatearCOP(ticketCierre.esperado)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-black">
                <span>Efectivo Contado:</span>
                <span>{formatearCOP(ticketCierre.declarado)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-300 font-black text-xs">
                <span>Diferencia:</span>
                <span
                  className={
                    ticketCierre.diferencia === 0
                      ? 'text-emerald-700'
                      : ticketCierre.diferencia > 0
                      ? 'text-blue-700'
                      : 'text-rose-700'
                  }
                >
                  {ticketCierre.diferencia === 0
                    ? 'CUADRADA ($0)'
                    : ticketCierre.diferencia > 0
                    ? `SOBRANTE (+${formatearCOP(ticketCierre.diferencia)})`
                    : `FALTANTE (${formatearCOP(ticketCierre.diferencia)})`}
                </span>
              </div>
            </div>

            {ticketCierre.observaciones && (
              <p className="text-[10px] text-slate-500 italic mt-1">
                Obs: {ticketCierre.observaciones}
              </p>
            )}

            {/* Firmas */}
            <div className="grid grid-cols-2 gap-4 pt-6 mt-2 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-400">
              <div>
                <div className="border-b border-slate-400 mb-1" />
                <span>Firma Cajero</span>
              </div>
              <div>
                <div className="border-b border-slate-400 mb-1" />
                <span>Firma Administrador</span>
              </div>
            </div>

            {/* Acciones del Comprobante */}
            <div className="flex items-center gap-2 mt-3 font-sans">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                onClick={() => setTicketCierre(null)}
                className="py-2 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
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
