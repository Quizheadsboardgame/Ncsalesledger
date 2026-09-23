import React from 'react';
import { 
  FileText, 
  Settings, 
  Plus, 
  Coins,
  Cloud,
  CloudOff,
  RefreshCw,
  KeyRound,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { StallSettings, WeekLedger } from '../types';
import { calculateConsolidatedSummary, formatCurrency } from '../utils/calculations';

interface NavbarProps {
  settings: StallSettings;
  ledger: WeekLedger;
  isCloudSyncing?: boolean;
  onOpenNewVendor: () => void;
  onOpenConsolidatedReport: () => void;
  onOpenSettings: () => void;
  onOpenVendorPins: () => void;
  onLock: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  ledger,
  isCloudSyncing = false,
  onOpenNewVendor,
  onOpenConsolidatedReport,
  onOpenSettings,
  onOpenVendorPins,
  onLock,
}) => {
  const summary = calculateConsolidatedSummary(ledger.vendors, settings);
  const curr = settings.currency;

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand / Logo */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-amber-500 to-amber-400 p-0.5 flex-shrink-0 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center relative overflow-hidden">
                {/* Pokéball styling */}
                <div className="absolute top-0 inset-x-0 h-1/2 bg-red-600 opacity-80" />
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-slate-900 z-10" />
                <div className="w-3.5 h-3.5 rounded-full bg-white border border-slate-900 z-20 flex items-center justify-center shadow-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight truncate text-white">
                  {settings.stallName || 'Newtons Collectables Pokémon Stall'}
                </h1>
                
                {/* Multi-Device Cloud Sync Badge */}
                <span 
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition ${
                    isCloudSyncing 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                  title="Multi-Device Cloud Memory Active: Data syncs live across phones, tablets, and computers."
                >
                  {isCloudSyncing ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                      <span className="hidden sm:inline">Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3 h-3 text-emerald-400" />
                      <span className="hidden sm:inline">Multi-Device Cloud Memory</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate hidden sm:block">
                Weekly vendor settlement, commissions, trade deductions &amp; VAT
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Consolidated Report CTA */}
            <button
              id="open-consolidated-report-btn"
              onClick={onOpenConsolidatedReport}
              type="button"
              className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              title="View consolidated vendor report & VAT breakdown"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span className="hidden xs:inline font-medium">Consolidated Report</span>
              <span className="bg-amber-500/20 text-amber-300 text-[11px] font-bold px-1.5 py-0.2 rounded-sm hidden md:inline">
                VAT: {formatCurrency(summary.totalVatToSave, curr)}
              </span>
            </button>

            {/* Add Vendor Button */}
            <button
              id="add-vendor-btn"
              onClick={onOpenNewVendor}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition shadow-sm hover:shadow-red-600/25 focus:ring-2 focus:ring-red-400 focus:outline-hidden"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vendor</span>
            </button>

            {/* Vendor PINs Management Button */}
            <button
              id="vendor-pins-btn"
              onClick={onOpenVendorPins}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/50 transition shadow-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              title="Manage Vendor PINs & Access"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline font-medium">Vendor PINs</span>
            </button>

            {/* Settings Button */}
            <button
              id="open-settings-btn"
              onClick={onOpenSettings}
              type="button"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Stall & VAT Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Lock Screen / Sign Out Button */}
            <button
              id="lock-screen-btn"
              onClick={onLock}
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition"
              title="Lock stall records immediately"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
