import React, { useState, useEffect } from 'react';
import { X, Calculator, ArrowRight, HelpCircle, AlertCircle, PlusCircle, KeyRound } from 'lucide-react';
import { StallSettings, VendorEntry } from '../types';
import { calculateVendorFinancials, formatCurrency } from '../utils/calculations';

interface VendorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendor: VendorEntry) => void;
  vendorToEdit?: VendorEntry | null;
  settings: StallSettings;
}

export const VendorFormModal: React.FC<VendorFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vendorToEdit,
  settings,
}) => {
  const [formData, setFormData] = useState<VendorEntry>({
    id: '',
    vendorName: '',
    boothOrSpace: '',
    contactInfo: '',
    grossSales: 0,
    commissionRate: settings.defaultCommissionRate,
    tradeTakenIn: 0,
    tradeNotes: '',
    cashWithdrawal: 0,
    cashWithdrawalNotes: '',
    otherDeductions: 0,
    deductionNotes: '',
    paymentStatus: 'pending',
    paymentDate: '',
    paymentReference: '',
    notes: '',
  });

  const curr = settings.currency;

  useEffect(() => {
    if (vendorToEdit) {
      setFormData({ 
        ...vendorToEdit,
        cashWithdrawal: vendorToEdit.cashWithdrawal || 0,
        cashWithdrawalNotes: vendorToEdit.cashWithdrawalNotes || '',
      });
    } else {
      setFormData({
        id: `ven-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        vendorName: '',
        boothOrSpace: '',
        contactInfo: '',
        grossSales: 0,
        commissionRate: settings.defaultCommissionRate,
        tradeTakenIn: 0,
        tradeNotes: '',
        cashWithdrawal: 0,
        cashWithdrawalNotes: '',
        otherDeductions: 0,
        deductionNotes: '',
        paymentStatus: 'pending',
        paymentDate: '',
        paymentReference: '',
        notes: '',
      });
    }
  }, [vendorToEdit, isOpen, settings.defaultCommissionRate]);

  if (!isOpen) return null;

  const calc = calculateVendorFinancials(formData, settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorName.trim()) {
      alert('Please enter a vendor name.');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                {vendorToEdit ? 'Edit Vendor Sales & Trade' : 'Add New Vendor'}
              </h3>
              <p className="text-xs text-slate-500">
                Enter sold amount, commission cut, and customer trade-ins taken in
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex-1 space-y-6">
          
          {/* Row 1: Vendor Name & Booth */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Vendor / Seller Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ash's Holos & Slabs"
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Booth / Cabinet Space
              </label>
              <input
                type="text"
                placeholder="e.g. Cabinet A2, Table 3"
                value={formData.boothOrSpace || ''}
                onChange={(e) => setFormData({ ...formData, boothOrSpace: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Contact Info and Portal Access PIN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contact Info / Phone / Email (Optional, for PDF statement)
              </label>
              <input
                type="text"
                placeholder="e.g. vendor@pokemoncards.com or 07700 900123"
                value={formData.contactInfo || ''}
                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>Portal PIN</span>
              </label>
              <input
                type="text"
                maxLength={8}
                placeholder="4-digit PIN"
                value={formData.pin || ''}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono font-bold tracking-widest text-center"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Vendor login PIN</span>
            </div>
          </div>

          {/* Primary Financial Inputs Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-amber-500" />
              Financial Calculation Inputs
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Gross Sales */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  1. Gross Amount Sold ({curr})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                    {curr}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.grossSales === 0 ? '' : formData.grossSales}
                    onChange={(e) => setFormData({ ...formData, grossSales: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-3 py-2 text-base font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Total card/merch sales at stall
                </p>
              </div>

              {/* Commission Rate */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    2. Commission Cut (%)
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, commissionRate: 0 })}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition ${
                      formData.commissionRate === 0
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    Set 0% (Free)
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={formData.commissionRate !== undefined && formData.commissionRate !== null ? formData.commissionRate : 0}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData({ 
                        ...formData, 
                        commissionRate: v === '' ? 0 : Math.max(0, Math.min(100, parseFloat(v) || 0)) 
                      });
                    }}
                    className="w-full pr-8 pl-3 py-2 text-base font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                    %
                  </span>
                </div>
                <p className="text-[11px] mt-1">
                  {formData.commissionRate === 0 ? (
                    <span className="text-emerald-600 font-semibold">0% Commission: Vendor retains 100% of sales</span>
                  ) : (
                    <span className="text-amber-700 font-semibold">Stall fee: {formatCurrency(calc.commissionAmount, curr)}</span>
                  )}
                </p>
              </div>

              {/* Trade Taken In */}
              <div>
                <label className="block text-xs font-bold text-purple-800 mb-1">
                  3. Trade Taken In ({curr})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-purple-600">
                    -{curr}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.tradeTakenIn === 0 ? '' : formData.tradeTakenIn}
                    onChange={(e) => setFormData({ ...formData, tradeTakenIn: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-9 pr-3 py-2 text-base font-bold text-purple-900 bg-purple-50/50 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <p className="text-[11px] text-purple-700 mt-1">
                  Stock income (inventory acquired) • Not cash profit
                </p>
              </div>

              {/* Cash Withdrawal */}
              <div>
                <label className="block text-xs font-bold text-amber-700 mb-1">
                  4. Cash Withdrawal ({curr})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-amber-600">
                    -{curr}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.cashWithdrawal === 0 ? '' : formData.cashWithdrawal}
                    onChange={(e) => setFormData({ ...formData, cashWithdrawal: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-9 pr-3 py-2 text-base font-bold text-amber-800 bg-amber-50/50 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <p className="text-[11px] text-amber-700 mt-1">
                  Cash taken from till by vendor
                </p>
              </div>

            </div>

            {/* Notes Section: Trade Itemization & Cash Withdrawal Notes */}
            <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trade-in Details &amp; Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Charizard Base Set LP (£150 credit allowed), Gengar VMAX Alt Art (£70 credit)"
                  value={formData.tradeNotes || ''}
                  onChange={(e) => setFormData({ ...formData, tradeNotes: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cash Withdrawal Details &amp; Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Took £50 cash at 2pm for lunch/expenses, signed by vendor"
                  value={formData.cashWithdrawalNotes || ''}
                  onChange={(e) => setFormData({ ...formData, cashWithdrawalNotes: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Other Deductions (Optional) */}
            <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Other Deductions / Rent / Fees ({curr})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.otherDeductions === 0 ? '' : formData.otherDeductions}
                  onChange={(e) => setFormData({ ...formData, otherDeductions: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Deduction Reason / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Showcase shelf rental, card sleeves"
                  value={formData.deductionNotes || ''}
                  onChange={(e) => setFormData({ ...formData, deductionNotes: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

          </div>

          {/* Real-time Math Breakdown Box */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Live Balance Calculation Breakdown
              </span>
              <span className="text-xs text-slate-400">
                Formula: (Sales - Comm) - Trade - Cash Out = Net Payout
              </span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Gross Card Sales Sold:</span>
                <span className="font-semibold text-white">{formatCurrency(calc.grossSales, curr)}</span>
              </div>
              <div className="flex justify-between text-amber-300">
                <span>Less: Stall Commission ({calc.commissionRate}%):</span>
                <span className="font-semibold">-{formatCurrency(calc.commissionAmount, curr)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-xs pl-2">
                <span>&rarr; Vendor Net after Commission:</span>
                <span>{formatCurrency(calc.netSalesAfterCommission, curr)}</span>
              </div>
              <div className="flex justify-between text-purple-300 font-medium">
                <span>Less: Trade-ins Taken In (Stock Income):</span>
                <span className="font-bold">-{formatCurrency(calc.tradeTakenIn, curr)}</span>
              </div>
              {calc.cashWithdrawal > 0 && (
                <div className="flex justify-between text-amber-300 font-medium">
                  <span>Less: Cash Withdrawal (Taken from Till):</span>
                  <span className="font-bold">-{formatCurrency(calc.cashWithdrawal, curr)}</span>
                </div>
              )}
              {calc.otherDeductions > 0 && (
                <div className="flex justify-between text-rose-200">
                  <span>Less: Other Deductions:</span>
                  <span>-{formatCurrency(calc.otherDeductions, curr)}</span>
                </div>
              )}
              
              {/* Final Net Payout Line */}
              <div className="border-t border-slate-700 pt-2.5 mt-2 flex items-center justify-between text-sm sm:text-base font-bold">
                <span className={calc.finalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {calc.finalBalance >= 0 ? 'FINAL VENDOR PAYOUT DUE:' : 'AMOUNT VENDOR OWES STALL:'}
                </span>
                <span className={`text-xl font-extrabold ${
                  calc.finalBalance >= 0 ? 'text-emerald-300' : 'text-rose-300'
                }`}>
                  {formatCurrency(calc.finalBalance, curr)}
                </span>
              </div>

              {/* Stall Owner Cut Info */}
              <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                <span>Your Stall Revenue: <strong className="text-amber-300">{formatCurrency(calc.commissionAmount, curr)}</strong></span>
                <span>VAT to Save: <strong className="text-blue-300">{formatCurrency(calc.vatAmount, curr)}</strong></span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                *Trade-ins are stock income (inventory acquired), not cash income or stall profit.
              </div>
            </div>
          </div>

          {/* Payment & Settlement Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Status
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentStatus: e.target.value as 'pending' | 'paid' | 'settled',
                  })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold"
              >
                <option value="pending">Pending Settlement</option>
                <option value="paid">Paid to Vendor</option>
                <option value="settled">Settled in Full</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Date
              </label>
              <input
                type="date"
                value={formData.paymentDate || ''}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Reference / Note
              </label>
              <input
                type="text"
                placeholder="e.g. Bank Transfer, Cash"
                value={formData.paymentReference || ''}
                onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* General Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Internal Vendor Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Special booster box pricing, returning vendor next week"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-sm transition"
            >
              {vendorToEdit ? 'Save Changes' : 'Add Vendor to Week'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
