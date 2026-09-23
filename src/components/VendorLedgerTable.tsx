import React, { useState } from 'react';
import { 
  FileDown, 
  Eye, 
  Edit3, 
  Trash2, 
  Search, 
  HelpCircle,
  Plus,
  Layers,
  Sparkles,
  Check,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { StallSettings, VendorEntry, WeekLedger } from '../types';
import { calculateVendorFinancials, formatCurrency } from '../utils/calculations';
import { generateVendorStatementPDF } from '../utils/pdfGenerator';

interface VendorLedgerTableProps {
  ledger: WeekLedger;
  settings: StallSettings;
  onUpdateVendor: (updated: VendorEntry) => void;
  onDeleteVendor: (vendorId: string) => void;
  onEditVendor: (vendor: VendorEntry) => void;
  onPreviewStatement: (vendor: VendorEntry) => void;
  onAddVendor: () => void;
  onLoadSampleData?: () => void;
}

export const VendorLedgerTable: React.FC<VendorLedgerTableProps> = ({
  ledger,
  settings,
  onUpdateVendor,
  onDeleteVendor,
  onEditVendor,
  onPreviewStatement,
  onAddVendor,
  onLoadSampleData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const curr = settings.currency;

  const filteredVendors = ledger.vendors.filter((v) =>
    v.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.boothOrSpace && v.boothOrSpace.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleQuickSalesChange = (vendor: VendorEntry, valueStr: string) => {
    const val = parseFloat(valueStr) || 0;
    onUpdateVendor({ ...vendor, grossSales: val });
  };

  const handleQuickCommChange = (vendor: VendorEntry, valueStr: string) => {
    const val = valueStr === '' ? 0 : Math.max(0, Math.min(100, parseFloat(valueStr) || 0));
    onUpdateVendor({ ...vendor, commissionRate: val });
  };

  const handleQuickTradeChange = (vendor: VendorEntry, valueStr: string) => {
    const val = parseFloat(valueStr) || 0;
    onUpdateVendor({ ...vendor, tradeTakenIn: val });
  };

  const handleQuickCashWithdrawalChange = (vendor: VendorEntry, valueStr: string) => {
    const val = parseFloat(valueStr) || 0;
    onUpdateVendor({ ...vendor, cashWithdrawal: val });
  };

  const handleStatusChange = (vendor: VendorEntry, status: 'pending' | 'paid' | 'settled') => {
    onUpdateVendor({
      ...vendor,
      paymentStatus: status,
      paymentDate: status !== 'pending' && !vendor.paymentDate ? new Date().toISOString().split('T')[0] : vendor.paymentDate,
    });
  };

  const handleDownloadPDF = (vendor: VendorEntry) => {
    generateVendorStatementPDF(vendor, ledger, settings);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      
      {/* Header bar of Table */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Vendor Sales &amp; Settlement Ledger
            </h2>
            <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
              {ledger.vendors.length} {ledger.vendors.length === 1 ? 'Vendor' : 'Vendors'}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3 text-emerald-600" />
              Saved to Memory
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gross Sales − Commission % − Trade Taken In (Stock) − Cash Withdrawal = Final Vendor Balance Payout • Trade-ins are stock income, not cash profit.
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor or space..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <button
            onClick={onAddVendor}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition shadow-xs focus:ring-2 focus:ring-amber-400 focus:outline-hidden shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Vendor</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      {filteredVendors.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">
            {ledger.vendors.length === 0 ? 'No vendors added for this week yet' : 'No vendors match your search'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
            {ledger.vendors.length === 0
              ? 'Add vendors selling Pokémon cards and merchandise at your stall to calculate commissions, trade deductions, and generate payout PDF statements.'
              : 'Try searching for a different vendor name or clear the search filter.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={onAddVendor}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Vendor</span>
            </button>
            {onLoadSampleData && ledger.vendors.length === 0 && (
              <button
                onClick={onLoadSampleData}
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Restore Default Vendors (Pete, Kieron, Roy, Charlie, Connor, Newton Collectables)</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Vendor &amp; Space</th>
                <th className="py-3 px-3 min-w-[130px]">
                  Gross Sales
                  <span className="block text-[10px] font-normal normal-case text-slate-400">Total sold</span>
                </th>
                <th className="py-3 px-3 min-w-[110px]">
                  Commission %
                  <span className="block text-[10px] font-normal normal-case text-slate-400">Your cut</span>
                </th>
                <th className="py-3 px-3 min-w-[130px]">
                  Trade Taken In
                  <span className="block text-[10px] font-normal normal-case text-purple-700">Stock intake • Non-cash</span>
                </th>
                <th className="py-3 px-3 min-w-[130px]">
                  Cash Withdrawal
                  <span className="block text-[10px] font-normal normal-case text-amber-600">Taken from till</span>
                </th>
                <th className="py-3 px-3 min-w-[140px] text-right">
                  Final Balance
                  <span className="block text-[10px] font-normal normal-case text-emerald-600">Vendor Net Payout</span>
                </th>
                <th className="py-3 px-3 text-center min-w-[110px]">Status</th>
                <th className="py-3 px-4 text-right min-w-[160px]">Statement PDF &amp; Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredVendors.map((vendor) => {
                const calc = calculateVendorFinancials(vendor, settings);
                const isOwedToVendor = calc.finalBalance >= 0;

                return (
                  <tr key={vendor.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Vendor Info */}
                    <td className="py-3 px-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          {vendor.vendorName}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {vendor.boothOrSpace && (
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-sm">
                              {vendor.boothOrSpace}
                            </span>
                          )}
                          {vendor.contactInfo && (
                            <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                              {vendor.contactInfo}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Gross Sales (Editable) */}
                    <td className="py-3 px-3 align-middle">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                          {curr}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={vendor.grossSales === 0 ? '' : vendor.grossSales}
                          placeholder="0.00"
                          onChange={(e) => handleQuickSalesChange(vendor, e.target.value)}
                          className="w-full pl-6 pr-2 py-1 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                    </td>

                    {/* Commission % (Editable) */}
                    <td className="py-3 px-3 align-middle">
                      <div className="flex items-center gap-1">
                        <div className="relative w-20">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            value={vendor.commissionRate !== undefined && vendor.commissionRate !== null ? vendor.commissionRate : 0}
                            placeholder="0"
                            onChange={(e) => handleQuickCommChange(vendor, e.target.value)}
                            className="w-full pr-5 pl-2 py-1 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                            %
                          </span>
                        </div>
                        <div className="text-[11px] font-bold whitespace-nowrap">
                          {calc.commissionRate === 0 ? (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-emerald-200">
                              0% Free
                            </span>
                          ) : (
                            <span className="text-amber-700">
                              {formatCurrency(calc.commissionAmount, curr)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Trade Taken In (Editable) - Comes off final balance */}
                    <td className="py-3 px-3 align-middle">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-rose-500">
                          -{curr}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={vendor.tradeTakenIn === 0 ? '' : vendor.tradeTakenIn}
                          placeholder="0.00"
                          onChange={(e) => handleQuickTradeChange(vendor, e.target.value)}
                          className="w-full pl-7 pr-2 py-1 text-sm font-semibold text-rose-700 bg-rose-50/40 border border-rose-200 rounded-md focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                        />
                      </div>
                      {vendor.tradeNotes && (
                        <p className="text-[10px] text-slate-400 truncate max-w-[150px] mt-0.5" title={vendor.tradeNotes}>
                          {vendor.tradeNotes}
                        </p>
                      )}
                    </td>

                    {/* Cash Withdrawal (Editable) - Comes off final balance */}
                    <td className="py-3 px-3 align-middle">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-amber-600">
                          -{curr}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={vendor.cashWithdrawal === 0 || vendor.cashWithdrawal === undefined ? '' : vendor.cashWithdrawal}
                          placeholder="0.00"
                          onChange={(e) => handleQuickCashWithdrawalChange(vendor, e.target.value)}
                          className="w-full pl-7 pr-2 py-1 text-sm font-semibold text-amber-900 bg-amber-50/40 border border-amber-200 rounded-md focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                      {vendor.cashWithdrawalNotes && (
                        <p className="text-[10px] text-slate-400 truncate max-w-[150px] mt-0.5" title={vendor.cashWithdrawalNotes}>
                          {vendor.cashWithdrawalNotes}
                        </p>
                      )}
                    </td>

                    {/* Final Balance / Net Payout */}
                    <td className="py-3 px-3 text-right align-middle">
                      <div className="flex flex-col items-end">
                        <span className={`text-base font-extrabold tracking-tight ${
                          isOwedToVendor ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {formatCurrency(calc.finalBalance, curr)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isOwedToVendor ? 'Payout Due to Vendor' : 'Vendor Owes Stall'}
                        </span>
                        {calc.otherDeductions > 0 && (
                          <span className="text-[10px] text-slate-400">
                            (incl. -{formatCurrency(calc.otherDeductions, curr)} fees)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Payment Status Dropdown */}
                    <td className="py-3 px-3 text-center align-middle">
                      <select
                        value={vendor.paymentStatus}
                        onChange={(e) =>
                          handleStatusChange(vendor, e.target.value as 'pending' | 'paid' | 'settled')
                        }
                        className={`text-xs font-bold px-2 py-1 rounded-full border cursor-pointer focus:outline-hidden ${
                          vendor.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : vendor.paymentStatus === 'settled'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="settled">Settled</option>
                      </select>
                    </td>

                    {/* PDF Statement & Actions */}
                    <td className="py-3 px-4 text-right align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Download PDF Button */}
                        <button
                          onClick={() => handleDownloadPDF(vendor)}
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-md bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
                          title="Download official PDF statement to send to vendor"
                        >
                          <FileDown className="w-3.5 h-3.5 text-amber-400" />
                          <span className="hidden md:inline">PDF</span>
                        </button>

                        {/* Preview / Share statement modal */}
                        <button
                          onClick={() => onPreviewStatement(vendor)}
                          type="button"
                          className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                          title="Preview Statement / Copy message text"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit full details modal */}
                        <button
                          onClick={() => onEditVendor(vendor)}
                          type="button"
                          className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                          title="Edit full vendor notes and deductions"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete vendor */}
                        <button
                          onClick={() => onDeleteVendor(vendor.id)}
                          type="button"
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete vendor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Explanatory Footer Note for the User */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong>Balance Formula:</strong> (Gross Sales − Stall Commission) − Trade Taken In − Cash Withdrawal = Final Payout Due.
            <span className="text-purple-700 font-semibold ml-1">
              *Trade-in cards are stock income (inventory), not cash profit.
            </span>
            <span className="text-blue-700 font-semibold ml-1">
              *VAT is charged on your commission, NOT full sales.
            </span>
          </span>
        </div>
        <div className="text-slate-400 text-[11px]">
          All changes are automatically saved to your device memory.
        </div>
      </div>

    </div>
  );
};
