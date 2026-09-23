import React from 'react';
import { 
  X, 
  FileDown, 
  FileSpreadsheet, 
  PiggyBank, 
  Coins, 
  TrendingUp, 
  ArrowDownLeft, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Percent,
  Calendar,
  Package
} from 'lucide-react';
import { StallSettings, WeekLedger } from '../types';
import { calculateConsolidatedSummary, calculateVendorFinancials, formatCurrency } from '../utils/calculations';
import { formatFullDate, getWeekDateRange } from '../utils/dateUtils';
import { generateConsolidatedReportPDF } from '../utils/pdfGenerator';
import { exportWeekToCSV } from '../utils/csvExport';

interface ConsolidatedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledger: WeekLedger;
  settings: StallSettings;
  vatSavedConfirmed: boolean;
  onToggleVatSaved: () => void;
  onUpdateVatSettings: (newRate: number, newTreatment: 'inclusive' | 'exclusive') => void;
}

export const ConsolidatedReportModal: React.FC<ConsolidatedReportModalProps> = ({
  isOpen,
  onClose,
  ledger,
  settings,
  vatSavedConfirmed,
  onToggleVatSaved,
  onUpdateVatSettings,
}) => {
  if (!isOpen) return null;

  const summary = calculateConsolidatedSummary(ledger.vendors, settings);
  const { startDate, endDate } = getWeekDateRange(ledger.year, ledger.weekNumber);
  const curr = settings.currency;

  const handleDownloadPDF = () => {
    generateConsolidatedReportPDF(ledger, settings);
  };

  const handleExportCSV = () => {
    exportWeekToCSV(ledger, settings);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-2">
                Consolidated Sales &amp; VAT Report
              </h2>
              <p className="text-xs text-slate-400">
                Week {ledger.weekNumber}, {ledger.year} ({formatFullDate(startDate)} – {formatFullDate(endDate)})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Export report to CSV for Excel / Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition shadow-xs"
              title="Download print-ready Consolidated PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>Download PDF Report</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 flex-1 space-y-6 bg-slate-50/50">
          
          {/* Top 2 Primary Request Callouts: "TOTAL I HAVE MADE" & "THE VAT I NEED TO SAVE" */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. TOTAL CASH COMMISSION (Stall Cut) */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 rounded-2xl p-5 shadow-sm border border-amber-400 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-950 mb-1">
                  <span>TOTAL CASH EARNED (STALL COMMISSION)</span>
                  <span className="bg-amber-400/80 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    Gross Commission
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 mt-1">
                  {formatCurrency(summary.totalCommissionMade, curr)}
                </div>
                <p className="text-xs text-amber-950 font-medium mt-1">
                  Cash commission earned from {summary.vendorCount} vendors across {formatCurrency(summary.totalGrossSales, curr)} in sales.
                </p>
                <div className="mt-2 text-[11px] font-semibold text-amber-950 bg-amber-400/50 rounded-md px-2.5 py-1 inline-block border border-amber-400/80">
                  Trade-ins are stock income, not cash profit.
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-400/60 flex items-center justify-between text-xs font-semibold text-amber-950">
                <span>Net Cash Profit (after VAT):</span>
                <span className="font-extrabold text-sm">{formatCurrency(summary.netCashProfit, curr)}</span>
              </div>
            </div>

            {/* 2. THE VAT I NEED TO SAVE (Tax Pot) */}
            <div className={`rounded-2xl p-5 shadow-sm border flex flex-col justify-between transition ${
              vatSavedConfirmed
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-gradient-to-br from-blue-900 to-indigo-950 text-white border-blue-800'
            }`}>
              <div>
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-blue-200 mb-1">
                  <span className="flex items-center gap-1.5">
                    <PiggyBank className="w-4 h-4 text-blue-300" />
                    THE VAT YOU NEED TO SAVE
                  </span>

                  <button
                    onClick={onToggleVatSaved}
                    type="button"
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition ${
                      vatSavedConfirmed
                        ? 'bg-emerald-800 text-emerald-100 hover:bg-emerald-700'
                        : 'bg-blue-800/90 text-blue-100 hover:bg-blue-700 border border-blue-700'
                    }`}
                  >
                    {vatSavedConfirmed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Transferred to Tax Pot</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Mark as Transferred</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
                  {formatCurrency(summary.totalVatToSave, curr)}
                </div>

                <p className="text-xs text-blue-200/90 mt-1">
                  {settings.vatTreatment === 'inclusive'
                    ? `Calculated as ${settings.vatRate}% VAT inclusive within stall commission fees (${formatCurrency(summary.totalCommissionMade, curr)}).`
                    : `Calculated as ${settings.vatRate}% VAT on stall commission revenue (${formatCurrency(summary.totalCommissionMade, curr)}).`}
                </p>
                <div className="mt-2 text-[11px] font-semibold text-amber-300 bg-blue-950/60 rounded-md px-2.5 py-1 inline-block border border-blue-800">
                  Notice: VAT is charged on your commission, NOT on the full sales amount.
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-blue-700/60 flex items-center justify-between text-xs text-blue-200">
                <span>Tax Pot Status:</span>
                <span className="font-bold text-white">
                  {vatSavedConfirmed ? 'Saved in Reserve Pot' : 'Pending Transfer to Tax Account'}
                </span>
              </div>
            </div>

          </div>

          {/* Secondary KPIs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                Total Gross Stall Turnover
              </span>
              <span className="text-xl font-extrabold text-slate-900">
                {formatCurrency(summary.totalGrossSales, curr)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Total card sales across vendors
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-purple-200">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block mb-0.5">
                Stock Income (Trade-Ins)
              </span>
              <span className="text-xl font-extrabold text-purple-900">
                {formatCurrency(summary.totalTradeTakenIn, curr)}
              </span>
              <span className="text-[10px] text-purple-700 block mt-0.5">
                Inventory intake • Not cash profit
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-100">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-0.5">
                Total Cash Withdrawals
              </span>
              <span className="text-xl font-extrabold text-amber-700">
                -{formatCurrency(summary.totalCashWithdrawals, curr)}
              </span>
              <span className="text-[10px] text-amber-700/80 block mt-0.5">
                Cash taken from till by vendors
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-0.5">
                Total Net Vendor Payouts
              </span>
              <span className="text-xl font-extrabold text-emerald-700">
                {formatCurrency(summary.totalVendorPayouts, curr)}
              </span>
              <span className="text-[10px] text-emerald-700/80 block mt-0.5">
                Net cash owed/settled to vendors
              </span>
            </div>
          </div>

          {/* Explicit Accounting Distinction: Cash Profit vs Stock Income */}
          <div className="bg-slate-900 text-white rounded-xl p-4 shadow-xs border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-purple-400" />
                  Accounting Classification: Cash Profit vs Stock Income
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Trade-ins are classified as <strong>stock income (inventory acquired)</strong>, not cash income, and do <strong>not</strong> count towards your cash profit.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/80">
                <span className="text-amber-300 font-bold uppercase tracking-wider block text-[11px] mb-1">
                  1. Cash Profit (Net Cash Income)
                </span>
                <div className="flex justify-between items-baseline mb-1 text-slate-300">
                  <span>Gross Cash Commission:</span>
                  <span className="font-semibold text-white">{formatCurrency(summary.totalCommissionMade, curr)}</span>
                </div>
                <div className="flex justify-between items-baseline mb-1 text-slate-400">
                  <span>Less VAT Reserve ({settings.vatRate}%):</span>
                  <span className="font-semibold text-blue-300">-{formatCurrency(summary.totalVatToSave, curr)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-700 font-bold text-emerald-400">
                  <span>Realized Cash Profit:</span>
                  <span className="text-sm">{formatCurrency(summary.netCashProfit, curr)}</span>
                </div>
              </div>

              <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/80">
                <span className="text-purple-300 font-bold uppercase tracking-wider block text-[11px] mb-1">
                  2. Stock Income (Inventory Intake — Non-Cash)
                </span>
                <div className="flex justify-between items-baseline mb-1 text-slate-300">
                  <span>Trade-In Cards Taken In:</span>
                  <span className="font-semibold text-purple-300">{formatCurrency(summary.totalTradeTakenIn, curr)}</span>
                </div>
                <div className="flex justify-between items-baseline mb-1 text-slate-400">
                  <span>Classification:</span>
                  <span className="font-medium text-slate-200">Physical Card Inventory</span>
                </div>
                <div className="pt-1.5 border-t border-slate-700 text-[11px] text-purple-200/90">
                  * Stock value in hand. Excluded from cash profit and stall commission.
                </div>
              </div>
            </div>
          </div>

          {/* VAT Treatment Setting Quick-Config */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Percent className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  VAT Calculation Settings
                </span>
                <p className="text-xs text-blue-700 mt-0.5">
                  Adjust standard VAT % rate or toggle whether commission is VAT-inclusive or added on.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span>VAT Rate:</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={settings.vatRate}
                  onChange={(e) =>
                    onUpdateVatSettings(parseFloat(e.target.value) || 0, settings.vatTreatment)
                  }
                  className="w-16 px-2 py-1 text-xs font-bold bg-white border border-blue-300 rounded-md text-center focus:outline-hidden"
                />
                <span>%</span>
              </div>

              <div className="flex items-center bg-white border border-blue-300 rounded-lg p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => onUpdateVatSettings(settings.vatRate, 'inclusive')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    settings.vatTreatment === 'inclusive'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Inclusive
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateVatSettings(settings.vatRate, 'exclusive')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    settings.vatTreatment === 'exclusive'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Exclusive
                </button>
              </div>
            </div>
          </div>

          {/* Consolidated Vendor Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">
                Itemized Vendor Breakdown (Week {ledger.weekNumber})
              </h3>
              <span className="text-xs text-slate-500">
                {ledger.vendors.length} vendors listed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">Vendor</th>
                    <th className="py-2.5 px-2">Booth</th>
                    <th className="py-2.5 px-3 text-right">Gross Sales</th>
                    <th className="py-2.5 px-2 text-center">Comm %</th>
                    <th className="py-2.5 px-3 text-right font-bold text-amber-900">Comm Earned</th>
                    <th className="py-2.5 px-3 text-right text-purple-800" title="Stock income (inventory acquired) — not cash profit">
                      Trade-In (Stock)
                    </th>
                    <th className="py-2.5 px-3 text-right text-amber-700">Cash Out</th>
                    <th className="py-2.5 px-3 text-right font-bold text-emerald-800">Net Payout</th>
                    <th className="py-2.5 px-3 text-right font-bold text-blue-700">VAT to Save</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledger.vendors.map((vendor, i) => {
                    const calc = calculateVendorFinancials(vendor, settings);
                    return (
                      <tr key={vendor.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {vendor.vendorName}
                        </td>
                        <td className="py-2.5 px-2 text-slate-500">
                          {vendor.boothOrSpace || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                          {formatCurrency(calc.grossSales, curr)}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-600">
                          {calc.commissionRate}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-800">
                          {formatCurrency(calc.commissionAmount, curr)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-700 font-medium">
                          {calc.tradeTakenIn > 0 ? `-${formatCurrency(calc.tradeTakenIn, curr)}` : `${curr}0.00`}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-700 font-medium">
                          {calc.cashWithdrawal > 0 ? `-${formatCurrency(calc.cashWithdrawal, curr)}` : `${curr}0.00`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">
                          {formatCurrency(calc.finalBalance, curr)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                          {formatCurrency(calc.vatAmount, curr)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            vendor.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : vendor.paymentStatus === 'settled'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {vendor.paymentStatus.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td className="py-3 px-3" colSpan={2}>
                      CONSOLIDATED TOTALS
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatCurrency(summary.totalGrossSales, curr)}
                    </td>
                    <td className="py-3 px-2 text-center">—</td>
                    <td className="py-3 px-3 text-right font-extrabold text-amber-900">
                      {formatCurrency(summary.totalCommissionMade, curr)}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-700 font-extrabold">
                      -{formatCurrency(summary.totalTradeTakenIn, curr)}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-700 font-extrabold">
                      -{formatCurrency(summary.totalCashWithdrawals, curr)}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-emerald-800">
                      {formatCurrency(summary.totalVendorPayouts, curr)}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-blue-800">
                      {formatCurrency(summary.totalVatToSave, curr)}
                    </td>
                    <td className="py-3 px-3 text-center">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Export ready for your accountant or tax return records.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              type="button"
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition"
            >
              Export CSV
            </button>
            <button
              onClick={handleDownloadPDF}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-sm transition"
            >
              <FileDown className="w-4 h-4" />
              <span>Download Consolidated PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
