import React, { useState } from 'react';
import { X, Settings, RotateCcw, Save, ShieldAlert, Sparkles } from 'lucide-react';
import { StallSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StallSettings;
  onSave: (newSettings: StallSettings) => void;
  onResetToDemoData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onResetToDemoData,
}) => {
  const [formData, setFormData] = useState<StallSettings>({ ...settings });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reload sample Pokémon stall demo data? Your current week will be restored with demo vendors.')) {
      onResetToDemoData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg text-white">Stall &amp; VAT Settings</h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex-1 space-y-5">
          
          {/* Stall Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Pokémon Stall / Shop Name
            </label>
            <input
              type="text"
              required
              value={formData.stallName}
              onChange={(e) => setFormData({ ...formData, stallName: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Appears on generated vendor settlement PDF statements and consolidated reports.
            </p>
          </div>

          {/* Owner Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Stall Manager / Owner Name
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Payout Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment &amp; Payout Instructions (Printed on PDF Statements)
            </label>
            <textarea
              rows={2}
              value={formData.payoutDetails}
              onChange={(e) => setFormData({ ...formData, payoutDetails: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="e.g. Bank Transfer: Sort: 20-40-60, Acc: 12345678 (or Cash payout at stall closing)"
            />
          </div>

          {/* Currency & Commission & VAT */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Financial Default Rules
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-bold"
                >
                  <option value="£">£ (GBP)</option>
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Comm. %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={formData.defaultCommissionRate !== undefined && formData.defaultCommissionRate !== null ? formData.defaultCommissionRate : 0}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData({
                        ...formData,
                        defaultCommissionRate: v === '' ? 0 : Math.max(0, Math.min(100, parseFloat(v) || 0)),
                      });
                    }}
                    className="w-full pr-6 pl-2 py-2 text-sm bg-white border border-slate-200 rounded-lg font-bold"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">VAT Rate %</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={formData.vatRate}
                    onChange={(e) =>
                      setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pr-6 pl-2 py-2 text-sm bg-white border border-slate-200 rounded-lg font-bold"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    %
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                VAT Calculation Scheme
              </label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className={`p-3 rounded-lg border cursor-pointer transition ${
                  formData.vatTreatment === 'inclusive'
                    ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <input
                    type="radio"
                    name="vatTreatment"
                    checked={formData.vatTreatment === 'inclusive'}
                    onChange={() => setFormData({ ...formData, vatTreatment: 'inclusive' })}
                    className="mr-2"
                  />
                  <strong>VAT Inclusive in Commission</strong>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Your commission fee includes {formData.vatRate}% VAT (Standard retail consignment)
                  </p>
                </label>

                <label className={`p-3 rounded-lg border cursor-pointer transition ${
                  formData.vatTreatment === 'exclusive'
                    ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <input
                    type="radio"
                    name="vatTreatment"
                    checked={formData.vatTreatment === 'exclusive'}
                    onChange={() => setFormData({ ...formData, vatTreatment: 'exclusive' })}
                    className="mr-2"
                  />
                  <strong>VAT Added onto Commission</strong>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {formData.vatRate}% VAT is applied on top of the commission fee
                  </p>
                </label>
              </div>
            </div>

          </div>

          {/* Reset button */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-600 hover:text-slate-800 hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <span>Reset Week to Default Vendors (Pete, Kieron, Roy, Charlie, Connor, Newton Collectables)</span>
            </button>
          </div>

          {/* Footer Save */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
