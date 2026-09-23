import React, { useState } from 'react';
import { 
  X, 
  FileDown, 
  Printer, 
  Copy, 
  Check, 
  Share2, 
  Send,
  Sparkles,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { StallSettings, VendorEntry, WeekLedger } from '../types';
import { calculateVendorFinancials, formatCurrency } from '../utils/calculations';
import { formatFullDate, formatWeekLabel, getWeekDateRange } from '../utils/dateUtils';
import { generateVendorStatementPDF } from '../utils/pdfGenerator';

interface VendorStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: VendorEntry | null;
  ledger: WeekLedger;
  settings: StallSettings;
}

export const VendorStatementModal: React.FC<VendorStatementModalProps> = ({
  isOpen,
  onClose,
  vendor,
  ledger,
  settings,
}) => {
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen || !vendor) return null;

  const calc = calculateVendorFinancials(vendor, settings);
  const { startDate, endDate } = getWeekDateRange(ledger.year, ledger.weekNumber);
  const curr = settings.currency;

  const handleDownloadPDF = () => {
    generateVendorStatementPDF(vendor, ledger, settings);
  };

  const handleCopyMessageText = () => {
    const isPositive = calc.finalBalance >= 0;
    const msg = [
      `*${settings.stallName} - Vendor Statement*`,
      `Week ${ledger.weekNumber}, ${ledger.year} (${formatFullDate(startDate)} - ${formatFullDate(endDate)})`,
      `Vendor: ${vendor.vendorName} ${vendor.boothOrSpace ? `(${vendor.boothOrSpace})` : ''}`,
      `---------------------------------`,
      `• Gross Sales: ${formatCurrency(calc.grossSales, curr)}`,
      calc.commissionRate === 0 
        ? `• Commission: 0% (No deduction - 100% retained by vendor)`
        : `• Commission (${calc.commissionRate}%): -${formatCurrency(calc.commissionAmount, curr)}`,
      `• Net from Sales: ${formatCurrency(calc.netSalesAfterCommission, curr)}`,
      `• Trade Taken In (Deduction): -${formatCurrency(calc.tradeTakenIn, curr)}`,
      calc.cashWithdrawal > 0 ? `• Cash Withdrawal (Deduction): -${formatCurrency(calc.cashWithdrawal, curr)}` : null,
      calc.otherDeductions > 0 ? `• Other Fees/Deductions: -${formatCurrency(calc.otherDeductions, curr)}` : null,
      `---------------------------------`,
      isPositive 
        ? `*NET PAYOUT DUE TO YOU: ${formatCurrency(calc.finalBalance, curr)}*` 
        : `*AMOUNT OWED TO STALL: ${formatCurrency(calc.finalBalance, curr)}*`,
      vendor.tradeNotes ? `Trade notes: ${vendor.tradeNotes}` : null,
      vendor.cashWithdrawalNotes ? `Cash withdrawal notes: ${vendor.cashWithdrawalNotes}` : null,
      settings.payoutDetails ? `Payment info: ${settings.payoutDetails}` : null,
      `Status: ${vendor.paymentStatus.toUpperCase()}`,
      `Thank you for trading with us!`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(msg);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Action Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-sm uppercase tracking-wider">
              Vendor Statement Preview
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
              Week {ledger.weekNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMessageText}
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Copy message summary for WhatsApp / SMS"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Text!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPDF}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Statement Canvas */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs max-w-xl mx-auto">
            
            {/* Statement Header */}
            <div className="border-b border-slate-200 pb-5 mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {settings.stallName || 'Pokémon Stall'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vendor Sales Settlement Statement
                </p>
                {settings.email && (
                  <p className="text-xs text-slate-400 mt-1">{settings.email}</p>
                )}
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-slate-800">
                  Week {ledger.weekNumber}, {ledger.year}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {formatFullDate(startDate)} – {formatFullDate(endDate)}
                </div>
                <div className="mt-2">
                  <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    vendor.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : vendor.paymentStatus === 'settled'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {vendor.paymentStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Vendor Recipient Box */}
            <div className="bg-slate-50 rounded-lg p-3.5 mb-5 border border-slate-200/80">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Statement Issued To:
              </div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {vendor.vendorName}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                {vendor.boothOrSpace && (
                  <span>Booth: <strong>{vendor.boothOrSpace}</strong></span>
                )}
                {vendor.contactInfo && (
                  <span>Contact: {vendor.contactInfo}</span>
                )}
              </div>
            </div>

            {/* Calculation Table */}
            <div className="space-y-3 mb-6">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Sales &amp; Deductions Breakdown
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-sm">
                
                {/* Gross Sales */}
                <div className="p-3 flex justify-between items-center bg-white">
                  <div>
                    <div className="font-semibold text-slate-800">Gross Pokémon Card Sales</div>
                    <div className="text-xs text-slate-400">Total sold through the stall till</div>
                  </div>
                  <div className="font-bold text-slate-900 text-base">
                    {formatCurrency(calc.grossSales, curr)}
                  </div>
                </div>

                {/* Stall Commission */}
                <div className="p-3 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <div className="font-semibold text-amber-900">
                      {calc.commissionRate === 0
                        ? 'Stall Commission (0% - No Commission)'
                        : `Less: Stall Commission (${calc.commissionRate}%)`}
                    </div>
                    <div className="text-xs text-slate-400">
                      {calc.commissionRate === 0
                        ? '100% of sales retained by vendor (0% stall fee)'
                        : 'Agreed stall service fee'}
                    </div>
                  </div>
                  <div className="font-bold text-amber-700">
                    {calc.commissionAmount > 0
                      ? `-${formatCurrency(calc.commissionAmount, curr)}`
                      : `${curr}0.00`}
                  </div>
                </div>

                {/* Net from sales */}
                <div className="p-3 flex justify-between items-center bg-white text-xs text-slate-600">
                  <div className="italic">Net sales amount after commission:</div>
                  <div className="font-semibold text-slate-700">
                    {formatCurrency(calc.netSalesAfterCommission, curr)}
                  </div>
                </div>

                {/* Trade Taken In */}
                <div className="p-3 flex justify-between items-center bg-purple-50/50">
                  <div>
                    <div className="font-semibold text-purple-900">
                      Less: Trade Taken In (Stock Income)
                    </div>
                    <div className="text-xs text-purple-700/80">
                      Physical card inventory acquired on vendor behalf (stock income, not cash profit)
                    </div>
                  </div>
                  <div className="font-bold text-purple-800">
                    {calc.tradeTakenIn > 0 ? `-${formatCurrency(calc.tradeTakenIn, curr)}` : `${curr}0.00`}
                  </div>
                </div>

                {/* Cash Withdrawal */}
                <div className="p-3 flex justify-between items-center bg-amber-50/40">
                  <div>
                    <div className="font-semibold text-amber-900">
                      Less: Cash Withdrawal (Deduction)
                    </div>
                    <div className="text-xs text-amber-800/80">
                      {vendor.cashWithdrawalNotes || 'Cash withdrawn from stall till during the event'}
                    </div>
                  </div>
                  <div className="font-bold text-amber-800">
                    {calc.cashWithdrawal > 0 ? `-${formatCurrency(calc.cashWithdrawal, curr)}` : `${curr}0.00`}
                  </div>
                </div>

                {/* Other Deductions */}
                {calc.otherDeductions > 0 && (
                  <div className="p-3 flex justify-between items-center bg-slate-50">
                    <div>
                      <div className="font-semibold text-slate-700">Other Deductions / Fees</div>
                      <div className="text-xs text-slate-400">{vendor.deductionNotes || 'Shelf / table fee'}</div>
                    </div>
                    <div className="font-bold text-slate-700">
                      -{formatCurrency(calc.otherDeductions, curr)}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Final Balance Box */}
            <div className={`p-4 rounded-xl border mb-5 ${
              calc.finalBalance >= 0
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : 'bg-rose-50/80 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {calc.finalBalance >= 0 ? 'NET PAYOUT DUE TO VENDOR' : 'AMOUNT VENDOR OWES STALL'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    (Gross Sales − Commission − Trade Taken In − Cash Withdrawal)
                  </div>
                </div>
                <div className="text-2xl font-black tracking-tight">
                  {formatCurrency(calc.finalBalance, curr)}
                </div>
              </div>
            </div>

            {/* Trade Details if any */}
            {vendor.tradeNotes && (
              <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="font-bold text-slate-700 block mb-1">
                  Trade-In Itemization Notes:
                </span>
                <p className="text-slate-600 whitespace-pre-wrap">{vendor.tradeNotes}</p>
              </div>
            )}

            {/* Cash Withdrawal Details if any */}
            {vendor.cashWithdrawalNotes && (
              <div className="mb-4 p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs">
                <span className="font-bold text-amber-900 block mb-1">
                  Cash Withdrawal Notes:
                </span>
                <p className="text-amber-800 whitespace-pre-wrap">{vendor.cashWithdrawalNotes}</p>
              </div>
            )}

            {/* Payout Instructions */}
            {settings.payoutDetails && (
              <div className="border-t border-slate-200 pt-4 text-xs text-slate-600">
                <span className="font-bold text-slate-800 block mb-1">Payment Instructions:</span>
                <p className="text-slate-600">{settings.payoutDetails}</p>
              </div>
            )}

            {vendor.paymentReference && (
              <div className="mt-2 text-xs text-slate-500">
                Payment Ref: <strong className="text-slate-700">{vendor.paymentReference}</strong>
                {vendor.paymentDate && ` (Date: ${vendor.paymentDate})`}
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
              {settings.stallName} • Generated {new Date().toLocaleDateString()}
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            PDF is ready to download and send via WhatsApp, email, or print.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-sm transition"
            >
              <FileDown className="w-4 h-4" />
              <span>Download Statement PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
