import React from 'react';
import { 
  TrendingUp, 
  Package, 
  Wallet, 
  PiggyBank, 
  Receipt,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ConsolidatedWeekSummary, StallSettings } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ConsolidatedMetricCardsProps {
  summary: ConsolidatedWeekSummary;
  settings: StallSettings;
  vatSavedConfirmed: boolean;
  onToggleVatSaved: () => void;
  onOpenConsolidatedModal: () => void;
}

export const ConsolidatedMetricCards: React.FC<ConsolidatedMetricCardsProps> = ({
  summary,
  settings,
  vatSavedConfirmed,
  onToggleVatSaved,
  onOpenConsolidatedModal,
}) => {
  const curr = settings.currency;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      
      {/* 1. Total Gross Sales */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Gross Sales
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(summary.totalGrossSales, curr)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across {summary.vendorCount} stall {summary.vendorCount === 1 ? 'vendor' : 'vendors'}
          </p>
        </div>
      </div>

      {/* 2. Trade Taken In (Stock Income, Non-Cash) */}
      <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider">
            Stock Income (Trade-In)
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-900 tracking-tight">
            {formatCurrency(summary.totalTradeTakenIn, curr)}
          </div>
          <p className="text-xs text-purple-700/80 mt-1">
            Card stock intake • Not cash profit
          </p>
        </div>
      </div>

      {/* 3. Vendor Payouts Due */}
      <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Vendor Payouts Due
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">
            {formatCurrency(summary.totalVendorPayouts, curr)}
          </div>
          <p className="text-xs text-emerald-600/80 mt-1">
            Net cash owed to vendors
          </p>
        </div>
      </div>

      {/* 4. TOTAL CASH COMMISSION - Crucial requirement */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border border-amber-300 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
            Cash Commission Made
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shadow-xs">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-amber-950 tracking-tight">
            {formatCurrency(summary.totalCommissionMade, curr)}
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-amber-800">
            <span>Stall Cash Cut (Excludes Stock)</span>
          </div>
        </div>
      </div>

      {/* 5. THE VAT YOU NEED TO SAVE - Crucial requirement */}
      <div className={`rounded-xl border p-4 shadow-xs relative overflow-hidden flex flex-col justify-between transition ${
        vatSavedConfirmed 
          ? 'bg-blue-50/80 border-blue-300' 
          : 'bg-gradient-to-br from-blue-900 to-indigo-950 text-white border-blue-800 shadow-blue-900/10'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            vatSavedConfirmed ? 'text-blue-900' : 'text-blue-200'
          }`}>
            <PiggyBank className="w-4 h-4" />
            VAT to Save ({settings.vatRate}%)
          </span>
          
          <button
            onClick={onToggleVatSaved}
            type="button"
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition ${
              vatSavedConfirmed
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                : 'bg-blue-800/80 text-blue-200 hover:bg-blue-700'
            }`}
            title="Mark whether this VAT has been transferred to your separate tax pot"
          >
            {vatSavedConfirmed ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Saved</span>
              </>
            ) : (
              <span>Mark Saved</span>
            )}
          </button>
        </div>

        <div>
          <div className={`text-2xl font-extrabold tracking-tight ${
            vatSavedConfirmed ? 'text-blue-950' : 'text-white'
          }`}>
            {formatCurrency(summary.totalVatToSave, curr)}
          </div>
          <div className={`text-[11px] font-medium mt-0.5 ${
            vatSavedConfirmed ? 'text-blue-800' : 'text-blue-200'
          }`}>
            Charged on commission cut, not full sales
          </div>
          
          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-blue-500/20 text-xs">
            <span className={vatSavedConfirmed ? 'text-blue-700' : 'text-blue-300'}>
              Net Cash Profit: <strong className={vatSavedConfirmed ? 'text-blue-950' : 'text-white'}>{formatCurrency(summary.netCashProfit, curr)}</strong>
            </span>
            <button
              onClick={onOpenConsolidatedModal}
              type="button"
              className={`underline font-medium hover:opacity-80 text-[11px] ${
                vatSavedConfirmed ? 'text-blue-700' : 'text-amber-300'
              }`}
            >
              Report &rarr;
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
