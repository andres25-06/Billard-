'use client';

import React, { useState } from 'react';
import { Lock, X, Delete } from 'lucide-react';

interface ModalPINProps {
  abierto: boolean;
  onCerrar: () => void;
  onExito: () => void;
}

export default function ModalPIN({ abierto, onCerrar, onExito }: ModalPINProps) {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  if (!abierto) return null;

  const handleNumero = (num: string) => {
    if (pin.length < 4) {
      const nuevoPin = pin + num;
      setPin(nuevoPin);
      setError(false);
      if (nuevoPin.length === 4) {
        // Validar PIN (ej. 1234 para Andrés Ardila)
        if (nuevoPin === '1234') {
          setTimeout(() => {
            onExito();
            setPin('');
          }, 150);
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleBorrar = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xs p-6 flex flex-col items-center shadow-2xl text-white">
        
        <div className="w-full flex justify-end">
          <button onClick={onCerrar} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/30">
          <Lock className="w-7 h-7" />
        </div>

        <h3 className="text-base font-bold">Terminal Bloqueada</h3>
        <p className="text-xs text-slate-400 mt-1 mb-6 text-center">Ingresa tu PIN de 4 dígitos para desbloquear</p>

        {/* Círculos del PIN */}
        <div className="flex gap-4 mb-8">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? error
                    ? 'bg-rose-500 scale-110 shadow-lg shadow-rose-500/50'
                    : 'bg-indigo-500 scale-110 shadow-lg shadow-indigo-500/50'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((val, idx) => {
            if (val === '') return <div key={idx} />;
            if (val === 'del') {
              return (
                <button
                  key={idx}
                  onClick={handleBorrar}
                  className="h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition active:scale-95 font-bold"
                >
                  <Delete className="w-5 h-5" />
                </button>
              );
            }
            return (
              <button
                key={idx}
                onClick={() => handleNumero(val)}
                className="h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-700 text-white font-mono text-xl font-bold flex items-center justify-center transition active:scale-95 shadow-sm"
              >
                {val}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-rose-400 mt-4 font-semibold animate-pulse">
            PIN incorrecto. Intenta con 1234
          </p>
        )}

      </div>
    </div>
  );
}
