import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, ShieldCheck, AlertCircle } from 'lucide-react';
import { AuthSession, StallSecurityConfig, StallSettings, VendorEntry } from '../types';
import { verifyEnteredPin } from '../utils/storage';

interface LockScreenProps {
  settings: StallSettings;
  securityConfig: StallSecurityConfig;
  vendors?: VendorEntry[];
  onUnlock: (session: AuthSession) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  settings,
  securityConfig,
  vendors = [],
  onUnlock,
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkPin = useCallback(
    (pinToTest: string) => {
      setIsSubmitting(true);
      setErrorMessage(null);

      const result = verifyEnteredPin(pinToTest, securityConfig, vendors);

      if (result) {
        // Successful verification
        const session: AuthSession = {
          role: result.role,
          vendorName: result.role === 'vendor' ? result.vendorName : undefined,
          authenticatedAt: Date.now(),
        };
        onUnlock(session);
      } else {
        // Invalid PIN
        setIsShaking(true);
        setErrorMessage('Incorrect PIN. Please check and try again.');
        setTimeout(() => {
          setIsShaking(false);
          setPin('');
          setIsSubmitting(false);
        }, 500);
      }
    },
    [securityConfig, vendors, onUnlock]
  );

  const handleDigitPress = (digit: string) => {
    if (isSubmitting || pin.length >= 8) return;
    setErrorMessage(null);
    const newPin = pin + digit;
    setPin(newPin);

    // If 4 digits entered, auto-verify immediately
    if (newPin.length === 4) {
      setTimeout(() => checkPin(newPin), 80);
    }
  };

  const handleBackspace = () => {
    if (isSubmitting) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    if (isSubmitting) return;
    setPin('');
    setErrorMessage(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length > 0) {
      checkPin(pin);
    }
  };

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isSubmitting, checkPin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 select-none">
      
      {/* Background Subtle Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-600 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm sm:max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center">
        
        {/* Stall Logo / Pokéball icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 via-amber-500 to-amber-400 p-1 shadow-lg mb-4 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1/2 bg-red-600" />
            <div className="absolute inset-x-0 top-1/2 h-1 bg-slate-950 z-10" />
            <div className="w-5 h-5 rounded-full bg-white border-2 border-slate-950 z-20 flex items-center justify-center shadow-xs">
              <div className="w-2 h-2 rounded-full bg-slate-900" />
            </div>
          </div>
        </div>

        {/* Title and Instruction */}
        <h2 className="text-xl sm:text-2xl font-black text-white text-center tracking-tight">
          {settings.stallName || 'Newtons Collectables Pokémon Stall'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 text-center mt-1 mb-6 flex items-center justify-center gap-1.5 font-medium">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Enter your PIN to access your account</span>
        </p>

        {/* PIN Masked Dots */}
        <div
          className={`flex items-center justify-center gap-3.5 mb-6 py-2 px-6 rounded-2xl transition-all ${
            isShaking
              ? 'animate-shake bg-rose-950/40 border border-rose-700/60'
              : 'bg-slate-800/60 border border-slate-700/60'
          }`}
        >
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-amber-400 shadow-md shadow-amber-400/50 scale-110'
                    : 'bg-slate-700 border border-slate-600'
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {errorMessage ? (
          <div className="h-6 mb-3 flex items-center gap-1.5 text-xs font-semibold text-rose-400 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : (
          <div className="h-6 mb-3 flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
            <span>Owner &amp; Vendor secure portal</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="w-full grid grid-cols-3 gap-3 sm:gap-3.5 max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitPress(num.toString())}
              disabled={isSubmitting}
              className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 active:bg-amber-500 active:text-slate-950 text-white text-xl font-bold transition flex items-center justify-center border border-slate-700 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-amber-400/60"
            >
              {num}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            disabled={isSubmitting || pin.length === 0}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center border border-slate-800 focus:outline-hidden disabled:opacity-40"
          >
            Clear
          </button>

          {/* Zero Button */}
          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            disabled={isSubmitting}
            className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 active:bg-amber-500 active:text-slate-950 text-white text-xl font-bold transition flex items-center justify-center border border-slate-700 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-amber-400/60"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            disabled={isSubmitting || pin.length === 0}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition flex items-center justify-center border border-slate-800 focus:outline-hidden disabled:opacity-40"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Enter CTA button if user entered 4+ digits */}
        {pin.length >= 4 && (
          <button
            type="button"
            onClick={() => checkPin(pin)}
            disabled={isSubmitting}
            className="mt-5 w-full max-w-[280px] py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm uppercase tracking-wider transition shadow-md shadow-amber-500/25 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Unlock</span>
          </button>
        )}

      </div>
    </div>
  );
};
