import React, { useState, useEffect } from 'react';
import { 
  X, 
  KeyRound, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  User, 
  Lock, 
  Save,
  AlertCircle
} from 'lucide-react';
import { StallSecurityConfig, VendorEntry } from '../types';

interface VendorPinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  securityConfig: StallSecurityConfig;
  vendors: VendorEntry[];
  onSaveSecurityConfig: (updatedConfig: StallSecurityConfig) => Promise<void>;
  targetVendorName?: string | null;
}

export const VendorPinsModal: React.FC<VendorPinsModalProps> = ({
  isOpen,
  onClose,
  securityConfig,
  vendors,
  onSaveSecurityConfig,
  targetVendorName,
}) => {
  const [vendorPinsState, setVendorPinsState] = useState<Record<string, string>>({});
  const [ownerPinState, setOwnerPinState] = useState<string>('');
  const [showOwnerPin, setShowOwnerPin] = useState(false);
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
  const [copiedVendor, setCopiedVendor] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize from current security config and vendor list
  useEffect(() => {
    if (isOpen) {
      setOwnerPinState(securityConfig.ownerPin || '0907');
      
      // Combine vendors from security config and active vendors
      const mergedPins: Record<string, string> = { ...(securityConfig.vendorPins || {}) };
      
      vendors.forEach((v) => {
        if (!mergedPins[v.vendorName]) {
          mergedPins[v.vendorName] = v.pin || '';
        }
      });

      setVendorPinsState(mergedPins);
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, securityConfig, vendors]);

  if (!isOpen) return null;

  // List of all unique vendor names
  const allVendorNames = Array.from(
    new Set([
      ...vendors.map((v) => v.vendorName),
      ...Object.keys(vendorPinsState),
    ])
  ).filter(Boolean);

  const handlePinChange = (name: string, pin: string) => {
    // Digits only, max 8 digits
    const clean = pin.replace(/\D/g, '').slice(0, 8);
    setVendorPinsState((prev) => ({
      ...prev,
      [name]: clean,
    }));
  };

  const handleGenerateRandomPin = (name: string) => {
    // Generate a clean 4-digit PIN between 1000 and 9999
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    handlePinChange(name, randomPin);
    setVisiblePins((prev) => ({ ...prev, [name]: true }));
  };

  const togglePinVisibility = (name: string) => {
    setVisiblePins((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleCopyVendorInfo = (name: string) => {
    const pin = vendorPinsState[name];
    if (!pin) return;
    const text = `Hi ${name}, here is your private PIN to access your Pokémon stall statements and sales balance: ${pin}`;
    navigator.clipboard.writeText(text);
    setCopiedVendor(name);
    setTimeout(() => setCopiedVendor(null), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    // Validate Owner PIN
    const cleanOwnerPin = ownerPinState.trim();
    if (cleanOwnerPin.length < 4) {
      setErrorMessage('Owner Master PIN must be at least 4 digits.');
      setIsSaving(false);
      return;
    }

    // Check for duplicate PINs between vendors and owner
    const allPinsUsed = new Map<string, string>();
    allPinsUsed.set(cleanOwnerPin, 'Owner');

    for (const [vName, vPin] of Object.entries(vendorPinsState)) {
      const cleanVPin = String(vPin || '').trim();
      if (cleanVPin) {
        if (cleanVPin.length < 4) {
          setErrorMessage(`PIN for "${vName}" must be at least 4 digits (or leave blank).`);
          setIsSaving(false);
          return;
        }
        if (allPinsUsed.has(cleanVPin)) {
          const conflict = allPinsUsed.get(cleanVPin);
          setErrorMessage(`Duplicate PIN "${cleanVPin}": used for both "${conflict}" and "${vName}". Each PIN must be unique.`);
          setIsSaving(false);
          return;
        }
        allPinsUsed.set(cleanVPin, vName);
      }
    }

    const updatedConfig: StallSecurityConfig = {
      ownerPin: cleanOwnerPin,
      vendorPins: vendorPinsState,
    };

    try {
      await onSaveSecurityConfig(updatedConfig);
      setSuccessMessage('All PINs successfully updated and synced across devices!');
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to save PIN configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Vendor PINs &amp; Access Control</span>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  Owner Only
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Set unique 4-digit PINs for vendors so they can only view their own sales statements.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          
          {/* Feedback messages */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Owner Master PIN Section */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Owner Master PIN</span>
                </span>
                <p className="text-xs text-amber-800 mt-0.5">
                  Grants full access to all stall records, consolidated earnings, VAT pot, and settings.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-36">
                  <input
                    type={showOwnerPin ? 'text' : 'password'}
                    value={ownerPinState}
                    onChange={(e) => setOwnerPinState(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="Owner PIN"
                    className="w-full px-3 py-2 text-sm font-black text-slate-900 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden tracking-widest text-center"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOwnerPin(!showOwnerPin)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showOwnerPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showOwnerPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Vendors PIN List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-500" />
                <span>Vendor Access PINs ({allVendorNames.length} Vendors)</span>
              </span>
              <span className="text-xs text-slate-400">
                Vendors type their PIN on the lock screen to see their own statement.
              </span>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {allVendorNames.map((name) => {
                const currentPin = vendorPinsState[name] || '';
                const isVisible = !!visiblePins[name];
                const isTarget = targetVendorName && targetVendorName.toLowerCase() === name.toLowerCase();

                return (
                  <div
                    key={name}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl border transition ${
                      isTarget 
                        ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40' 
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">
                          {name}
                        </h4>
                        <span className="text-[11px] text-slate-500 block">
                          {currentPin ? 'PIN Active' : 'No PIN assigned'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {/* PIN Input */}
                      <div className="relative w-32">
                        <input
                          type={isVisible ? 'text' : 'password'}
                          value={currentPin}
                          placeholder="e.g. 1001"
                          onChange={(e) => handlePinChange(name, e.target.value)}
                          className="w-full px-3 py-1.5 text-xs sm:text-sm font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden tracking-widest text-center"
                        />
                        <button
                          type="button"
                          onClick={() => togglePinVisibility(name)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                          title={isVisible ? 'Hide' : 'Show'}
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Randomizer Button */}
                      <button
                        type="button"
                        onClick={() => handleGenerateRandomPin(name)}
                        className="p-2 rounded-xl bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 hover:border-amber-300 transition"
                        title="Generate random 4-digit PIN"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy Info Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyVendorInfo(name)}
                        disabled={!currentPin}
                        className={`p-2 rounded-xl border transition ${
                          copiedVendor === name
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 disabled:opacity-40'
                        }`}
                        title="Copy vendor login info to clipboard"
                      >
                        {copiedVendor === name ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Changes sync automatically across all devices and phones.
            </p>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-extrabold text-xs shadow-md transition disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save & Sync PINs'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
