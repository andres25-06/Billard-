'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  DollarSign,
  Save,
  UserPlus,
  Clock,
  Store,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';

interface UsuarioConfig {
  id: string;
  nombre: string;
  rol: string;
  pin: string;
  activo: boolean;
}

export default function ViewConfiguracion() {
  const [guardado, setGuardado] = useState(false);

  // Tarifas editables
  const [tarifaTresBandas, setTarifaTresBandas] = useState(18000);
  const [tarifaPool, setTarifaPool] = useState(14000);
  const [fraccionMinima, setFraccionMinima] = useState(15);
  const [minutosGracia, setMinutosGracia] = useState(5);

  // Datos del Club
  const [nombreClub, setNombreClub] = useState('El Encuentro Tocano');
  const [nitClub, setNitClub] = useState('900.824.112-1');
  const [direccionClub, setDireccionClub] = useState('Tocancipá, Cundinamarca');
  const [mensajeTicket, setMensajeTicket] = useState('¡Gracias por su visita! Vuelva pronto.');

  // Personal
  const [usuarios, setUsuarios] = useState<UsuarioConfig[]>([
    { id: '1', nombre: 'Andrés Ardila', rol: 'Administrador General', pin: '1234', activo: true },
    { id: '2', nombre: 'Carlos Méndez', rol: 'Cajero · Turno Tarde', pin: '4580', activo: true },
    { id: '3', nombre: 'Andrés Gómez', rol: 'Cajero · Turno Noche', pin: '7890', activo: true },
  ]);
  const [verPinId, setVerPinId] = useState<string | null>(null);

  const handleGuardar = () => {
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };

  return (
    <div className="w-full h-full flex flex-col gap-3 font-['Urbanist',sans-serif] select-none overflow-hidden">
      {/* 1. Barra Superior */}
      <div className="bg-white px-5 py-3 rounded-2xl border border-slate-300 shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#28353E] text-white flex items-center justify-center shadow-xs">
            <Settings className="w-5 h-5 text-[#AAC7D5]" />
          </div>
          <div>
            <h3 className="font-black text-base text-[#28353E] leading-none">
              Ajustes y Tarifas del Club
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              Configuración de precios por hora, reglas de tiempo, personal y ticket
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGuardar}
          className="px-4 py-2 rounded-xl bg-[#184A35] hover:bg-[#123828] text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
        >
          {guardado ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Cambios Guardados</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Cuerpo Principal: 2 Columnas */}
      <div
        className="flex-1 grid grid-cols-2 gap-3 min-h-0 overflow-hidden"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
      >
        {/* Columna Izquierda: Tarifas por Hora y Reglas de Tiempo */}
        <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-xs flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#184A35]" />
                <h4 className="font-black text-sm text-[#28353E]">Tarifas por Hora de Mesas</h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">COP / Hora</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">Mesas Tres Bandas</span>
                  <span className="text-[10px] text-slate-400">Carambola profesional</span>
                </div>
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-300">
                  <span className="font-mono font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    value={tarifaTresBandas}
                    onChange={(e) => setTarifaTresBandas(Number(e.target.value))}
                    className="w-20 font-mono font-black text-right text-[#28353E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">Mesas Pool</span>
                  <span className="text-[10px] text-slate-400">Bola 8 / Bola 9</span>
                </div>
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-300">
                  <span className="font-mono font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    value={tarifaPool}
                    onChange={(e) => setTarifaPool(Number(e.target.value))}
                    className="w-20 font-mono font-black text-right text-[#28353E] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reglas de Tiempo */}
          <div className="pt-3 mt-3 border-t border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-[#45576D]" />
              Reglas de Fracción de Tiempo
            </span>
            <div
              className="grid grid-cols-2 gap-2.5 text-xs"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
            >
              <div className="p-2.5 rounded-xl bg-[#EDF2F7] border border-slate-300 flex items-center justify-between">
                <span className="font-bold text-slate-700">Fracción mín.</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={fraccionMinima}
                    onChange={(e) => setFraccionMinima(Number(e.target.value))}
                    className="w-10 text-center font-mono font-black bg-white rounded-md py-0.5 border border-slate-300 text-[#28353E]"
                  />
                  <span className="text-[10px] font-bold text-slate-500">min</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#EDF2F7] border border-slate-300 flex items-center justify-between">
                <span className="font-bold text-slate-700">Gracia inicio</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={minutosGracia}
                    onChange={(e) => setMinutosGracia(Number(e.target.value))}
                    className="w-10 text-center font-mono font-black bg-white rounded-md py-0.5 border border-slate-300 text-[#28353E]"
                  />
                  <span className="text-[10px] font-bold text-slate-500">min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Personal y PIN de Acceso */}
        <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-xs flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#184A35]" />
                <h4 className="font-black text-sm text-[#28353E]">Personal y PIN de Acceso</h4>
              </div>
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#28353E] font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Nuevo Cajero</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {usuarios.map((u) => {
                const mostrarPin = verPinId === u.id;
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#28353E] text-white font-black text-xs flex items-center justify-center">
                        {u.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <b className="text-slate-800 block leading-tight">{u.nombre}</b>
                        <span className="text-[10.5px] text-slate-400 font-semibold">{u.rol}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold bg-white border border-slate-300 text-slate-700 px-2.5 py-1 rounded-lg text-[11px]">
                        PIN: {mostrarPin ? u.pin : '••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setVerPinId(mostrarPin ? null : u.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
                        title="Mostrar u ocultar PIN"
                      >
                        {mostrarPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#EDF2F7] border border-slate-300 text-[11px] text-slate-600 font-semibold mt-3">
            El PIN de 4 dígitos se solicita al bloquear la terminal o al realizar arqueos de caja.
          </div>
        </div>
      </div>

      {/* 3. Franja Inferior: Datos del Club & Ticket Térmico */}
      <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-xs shrink-0">
        <div className="flex items-center gap-2 pb-2 mb-2.5 border-b border-slate-200">
          <Store className="w-4 h-4 text-[#45576D]" />
          <h4 className="font-black text-sm text-[#28353E]">Datos del Club & Ticket Térmico</h4>
        </div>

        <div
          className="grid grid-cols-4 gap-3 text-xs"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
        >
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nombre del Club</label>
            <input
              type="text"
              value={nombreClub}
              onChange={(e) => setNombreClub(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 font-bold text-[#28353E] focus:outline-none focus:ring-1 focus:ring-[#184A35]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">NIT</label>
            <input
              type="text"
              value={nitClub}
              onChange={(e) => setNitClub(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-[#28353E] focus:outline-none focus:ring-1 focus:ring-[#184A35]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Dirección / Ciudad</label>
            <input
              type="text"
              value={direccionClub}
              onChange={(e) => setDireccionClub(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 font-semibold text-[#28353E] focus:outline-none focus:ring-1 focus:ring-[#184A35]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pie de Ticket</label>
            <input
              type="text"
              value={mensajeTicket}
              onChange={(e) => setMensajeTicket(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 font-semibold text-[#28353E] focus:outline-none focus:ring-1 focus:ring-[#184A35]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
