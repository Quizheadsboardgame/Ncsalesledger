import React, { useState } from 'react';
import { 
  FileDown, 
  FileText, 
  Lock, 
  Calendar, 
  Coins, 
  Package, 
  Wallet, 
  Percent, 
  Clock, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  HelpCircle,
  Phone,
  Mail
} from 'lucide-react';
import { StallSettings, VendorEntry, WeekLedger } from '../types';
import { calculateVendorFinancials, formatCurrency } from '../utils/calculations';
import { generateVendorStatementPDF } from '../utils/pdfGenerator';
import { VendorStatementModal } from './VendorStatementModal';

interface VendorPortalProps {
  vendorName: string;
  settings: StallSettings;
  year: number;
  weekNumber: number;
  ledger: WeekLedger;
  onSelectWeek: (year: number, week: number) => void;
  onLock: () => void;
}

export const VendorPortal: React.FC<VendorPortalProps> = ({
  vendorName,
  settings,
  year,
  weekNumber,
  ledger,
  onSelectWeek,
  onLock,
}) => {
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  // Find this vendor in the active week's ledger
  const currentVendor: VendorEntry | undefined = ledger.vendors.find(
    (v) => v.vendorName.trim().toLowerCase() === vendorName.trim().toLowerCase()
  );

  const calc = currentVendor ? calculateVendorFinancials(currentVendor, settings) : null;
  const curr = settings.currency;

  const handlePrevWeek = () => {
    if (weekNumber <= 1) {
      onSelectWeek(year - 1, 52);
    } else {
      onSelectWeek(year, weekNumber - 1);
    }
  };

  const handleNextWeek = () => {
    if (weekNumber >= 52) {
      onSelectWeek(year + 1, 1);
    } else {
      onSelectWeek(year, weekNumber + 1);
    }
  };

  const handleDownloadPDF = () => {
    if (currentVendor) {
      generateVendorStatementPDF(currentVendor, ledger, settings);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Header for Vendor */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3 min-w-0">
            {/* Pokéball Logo */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-amber-500 to-amber-400 p-0.5 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1/2 bg-red-600 opacity-90" />
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-slate-900 z-10" />
                <div className="w-3.5 h-3.5 rounded-full bg-white border border-slate-900 z-20 flex items-center justify-center shadow-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight truncate text-white">
                  {settings.stallName || 'Newtons Collectables Pokémon Stall'}
                </span>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30 hidden sm:inline">
                  Vendor Portal
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <span>Logged in as:</span>
                <strong className="text-amber-400 text-sm font-black">{vendorName}</strong>
              </p>
            </div>
          </div>

          {/* Sign Out / Lock Button */}
          <button
            onClick={onLock}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition shadow-xs"
            title="Lock session and return to PIN screen"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Lock / Exit</span>
          </button>

        </div>
      </header>

      {/* Main Vendor Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Week Navigator Card */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                Viewing Statement For
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Week {weekNumber}, {year}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-600 px-2">
              W{weekNumber} ({year})
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {currentVendor && calc ? (
          <>
            {/* Big Hero Standout: Net Payout Due */}
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-md mb-6 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-white/20 text-white text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-xs">
                      Final Net Payout Balance
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        currentVendor.paymentStatus === 'settled'
                          ? 'bg-emerald-300 text-emerald-950 font-black'
                          : currentVendor.paymentStatus === 'paid'
                          ? 'bg-blue-300 text-blue-950 font-black'
                          : 'bg-amber-300 text-amber-950 font-bold'
                      }`}
                    >
                      Status: {currentVendor.paymentStatus.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
                    {formatCurrency(calc.finalBalance, curr)}
                  </div>

                  <p className="text-xs sm:text-sm text-emerald-100 font-medium">
                    (Gross Card Sales − Stall Commission) − Trade-Ins Deducted − Cash Withdrawals
                  </p>

                  {currentVendor.paymentDate && (
                    <p className="text-xs text-emerald-200 mt-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Settled Date: {currentVendor.paymentDate}</span>
                      {currentVendor.paymentReference && (
                        <span>• Ref: {currentVendor.paymentReference}</span>
                      )}
                    </p>
                  )}
                </div>

                {/* PDF and Statement CTA Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                  <button
                    onClick={handleDownloadPDF}
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-extrabold text-sm shadow-md transition"
                  >
                    <FileDown className="w-4 h-4 text-emerald-700" />
                    <span>Download Statement PDF</span>
                  </button>

                  <button
                    onClick={() => setIsStatementModalOpen(true)}
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-900/50 hover:bg-emerald-900/80 text-white border border-emerald-400/30 text-xs font-bold transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-300" />
                    <span>View Itemized Breakdown</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Financial Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              
              {/* Gross Sales */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  1. Gross Card Sales
                </span>
                <span className="text-2xl font-black text-slate-900 block">
                  {formatCurrency(calc.grossSales, curr)}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Total card purchases made at stall
                </span>
              </div>

              {/* Commission Rate & Cut */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    2. Stall Commission
                  </span>
                  <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                    {calc.commissionRate}%
                  </span>
                </div>
                <span className="text-2xl font-black text-amber-800 block">
                  {calc.commissionRate === 0 ? '£0.00 (0% Free)' : formatCurrency(calc.commissionAmount, curr)}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Pitch, showcase &amp; till service fee
                </span>
              </div>

              {/* Trade-Ins Taken In (Stock Income) */}
              <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block mb-1">
                  3. Trade Taken In (Stock)
                </span>
                <span className="text-2xl font-black text-purple-900 block">
                  -{formatCurrency(calc.tradeTakenIn, curr)}
                </span>
                <span className="text-[11px] text-purple-700 mt-1 block">
                  Card inventory trade-in deducted
                </span>
              </div>

              {/* Cash Withdrawal */}
              <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">
                  4. Cash Withdrawal
                </span>
                <span className="text-2xl font-black text-amber-900 block">
                  -{formatCurrency(calc.cashWithdrawal, curr)}
                </span>
                <span className="text-[11px] text-amber-700 mt-1 block">
                  Cash drawn from till during event
                </span>
              </div>

            </div>

            {/* Itemized Notes and Deductions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              
              {/* Trade Notes */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span>Card Trade-Ins Recorded:</span>
                </h3>
                {currentVendor.tradeNotes ? (
                  <p className="text-xs text-slate-700 bg-purple-50/50 p-3 rounded-xl border border-purple-100 whitespace-pre-line leading-relaxed">
                    {currentVendor.tradeNotes}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">No trade-in notes recorded for this week.</p>
                )}
                <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                  <span>Trade-ins are classified as stock income (inventory acquired) and subtracted from cash payout.</span>
                </div>
              </div>

              {/* Cash Withdrawal Notes & Payout Info */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-600" />
                  <span>Cash Withdrawal &amp; Settlement:</span>
                </h3>
                {currentVendor.cashWithdrawalNotes ? (
                  <p className="text-xs text-slate-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100 whitespace-pre-line leading-relaxed mb-3">
                    {currentVendor.cashWithdrawalNotes}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mb-3">No cash withdrawals recorded.</p>
                )}

                <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                  <div>
                    <strong className="text-slate-900">Payout Method:</strong> {settings.payoutDetails}
                  </div>
                  {settings.email && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{settings.email}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </>
        ) : (
          /* Empty State for this week */
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              No Statement Records in Week {weekNumber}, {year}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
              There are no card sales or settlements recorded for <strong>{vendorName}</strong> in Week {weekNumber}. Use the arrows above to browse previous or next weeks.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handlePrevWeek}
                type="button"
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Check Previous Week</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Itemized Statement Modal */}
      {currentVendor && (
        <VendorStatementModal
          isOpen={isStatementModalOpen}
          onClose={() => setIsStatementModalOpen(false)}
          vendor={currentVendor}
          ledger={ledger}
          settings={settings}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 mt-auto">
        <span>{settings.stallName} • Private Vendor Portal for {vendorName}</span>
      </footer>

    </div>
  );
};
