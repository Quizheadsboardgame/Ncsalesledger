/**
 * Pokémon Stall Sales Ledger Application
 * Weekly vendor sales, commission, trade deductions, PDF statements, and consolidated VAT reporting.
 * Integrated with real-time multi-device cloud synchronization.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileText, 
  FileDown, 
  FileSpreadsheet, 
  Plus, 
  Sparkles, 
  Coins, 
  PiggyBank, 
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  CloudCheck
} from 'lucide-react';
import { AuthSession, StallSecurityConfig, StallSettings, VendorEntry, WeekLedger } from './types';
import { 
  loadSettings, 
  saveSettings, 
  getWeekLedger, 
  saveWeekLedger, 
  copyVendorsFromWeek, 
  getCleanInitialLedger,
  subscribeToCloudSettings,
  subscribeToCloudWeekLedger,
  loadSecurityConfigLocal,
  saveSecurityConfig,
  subscribeToCloudSecurityConfig,
  loadAuthSession,
  saveAuthSession,
  clearAuthSession
} from './utils/storage';
import { getISOWeekAndYear } from './utils/dateUtils';
import { calculateConsolidatedSummary, formatCurrency } from './utils/calculations';
import { generateConsolidatedReportPDF } from './utils/pdfGenerator';
import { exportWeekToCSV } from './utils/csvExport';

import { Navbar } from './components/Navbar';
import { WeekNavigator } from './components/WeekNavigator';
import { ConsolidatedMetricCards } from './components/ConsolidatedMetricCards';
import { VendorLedgerTable } from './components/VendorLedgerTable';
import { VendorFormModal } from './components/VendorFormModal';
import { VendorStatementModal } from './components/VendorStatementModal';
import { ConsolidatedReportModal } from './components/ConsolidatedReportModal';
import { SettingsModal } from './components/SettingsModal';
import { LockScreen } from './components/LockScreen';
import { VendorPortal } from './components/VendorPortal';
import { VendorPinsModal } from './components/VendorPinsModal';

export default function App() {
  const [settings, setSettings] = useState<StallSettings>(() => loadSettings());
  const [securityConfig, setSecurityConfig] = useState<StallSecurityConfig>(() => loadSecurityConfigLocal());
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => loadAuthSession());

  // Initialize with current ISO week
  const initialWeekInfo = useMemo(() => getISOWeekAndYear(), []);
  const [year, setYear] = useState<number>(initialWeekInfo.year);
  const [weekNumber, setWeekNumber] = useState<number>(initialWeekInfo.week);

  // Current active week's ledger
  const [ledger, setLedger] = useState<WeekLedger>(() => 
    getWeekLedger(initialWeekInfo.year, initialWeekInfo.week)
  );

  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Modals state
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<VendorEntry | null>(null);

  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementVendor, setStatementVendor] = useState<VendorEntry | null>(null);

  const [isConsolidatedModalOpen, setIsConsolidatedModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Vendor PINs modal state
  const [isVendorPinsModalOpen, setIsVendorPinsModalOpen] = useState(false);
  const [pinTargetVendor, setPinTargetVendor] = useState<string | null>(null);

  // Toast / notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Subscribe to Cloud Settings changes in real-time across devices
  useEffect(() => {
    const unsubscribe = subscribeToCloudSettings((cloudSettings) => {
      setSettings(cloudSettings);
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Cloud Security & PINs in real-time across devices
  useEffect(() => {
    const unsubscribe = subscribeToCloudSecurityConfig((cloudSecurity) => {
      setSecurityConfig(cloudSecurity);
    });
    return () => unsubscribe();
  }, []);

  // 3. Subscribe to Active Week's Cloud Ledger in real-time across devices
  useEffect(() => {
    setIsCloudSyncing(true);
    const unsubscribe = subscribeToCloudWeekLedger(year, weekNumber, (cloudLedger) => {
      setLedger(cloudLedger);
      setIsCloudSyncing(false);
    });
    return () => unsubscribe();
  }, [year, weekNumber]);

  // Save ledger to local storage & cloud
  const updateLedgerState = async (updated: WeekLedger) => {
    setLedger(updated);
    setIsCloudSyncing(true);
    await saveWeekLedger(updated);
    setIsCloudSyncing(false);
  };

  // Check if previous week has vendors to copy
  const previousWeekInfo = useMemo(() => {
    if (weekNumber === 1) {
      return { y: year - 1, w: 52 };
    }
    return { y: year, w: weekNumber - 1 };
  }, [year, weekNumber]);

  const canCopyFromPrevious = useMemo(() => {
    const prevLedger = getWeekLedger(previousWeekInfo.y, previousWeekInfo.w);
    return prevLedger.vendors.length > 0 && ledger.vendors.length === 0;
  }, [previousWeekInfo, ledger.vendors.length]);

  // Handlers
  const handleSelectWeek = (newYear: number, newWeek: number) => {
    setYear(newYear);
    setWeekNumber(newWeek);
  };

  const handleUpdateVendor = (updatedVendor: VendorEntry) => {
    const updatedVendors = ledger.vendors.map((v) =>
      v.id === updatedVendor.id ? updatedVendor : v
    );
    updateLedgerState({ ...ledger, vendors: updatedVendors });
  };

  const handleSaveVendorModal = (vendorData: VendorEntry) => {
    const exists = ledger.vendors.some((v) => v.id === vendorData.id);
    let updatedVendors: VendorEntry[];
    if (exists) {
      updatedVendors = ledger.vendors.map((v) =>
        v.id === vendorData.id ? vendorData : v
      );
      showToast(`Updated details for "${vendorData.vendorName}"`);
    } else {
      updatedVendors = [...ledger.vendors, vendorData];
      showToast(`Added vendor "${vendorData.vendorName}" to Week ${weekNumber}`);
    }

    // If a custom PIN was assigned in the vendor modal, sync it with securityConfig.vendorPins
    if (vendorData.pin !== undefined) {
      const cleanPin = (vendorData.pin || '').trim();
      const updatedPins = { ...securityConfig.vendorPins };
      if (cleanPin) {
        updatedPins[vendorData.vendorName] = cleanPin;
      }
      const updatedSecurity = { ...securityConfig, vendorPins: updatedPins };
      setSecurityConfig(updatedSecurity);
      saveSecurityConfig(updatedSecurity).catch(console.error);
    }

    updateLedgerState({ ...ledger, vendors: updatedVendors });
  };

  const handleDeleteVendor = (vendorId: string) => {
    const target = ledger.vendors.find((v) => v.id === vendorId);
    if (!target) return;
    if (confirm(`Remove vendor "${target.vendorName}" from Week ${weekNumber}?`)) {
      const updated = ledger.vendors.filter((v) => v.id !== vendorId);
      updateLedgerState({ ...ledger, vendors: updated });
      showToast(`Removed "${target.vendorName}"`);
    }
  };

  const handleCopyFromPreviousWeek = async () => {
    const updated = await copyVendorsFromWeek(year, weekNumber, previousWeekInfo.y, previousWeekInfo.w);
    setLedger(updated);
    showToast(`Rolled over ${updated.vendors.length} vendors from Week ${previousWeekInfo.w}!`);
  };

  const handleToggleVatSaved = () => {
    const newStatus = !ledger.vatSavedConfirmed;
    const updated = { ...ledger, vatSavedConfirmed: newStatus };
    updateLedgerState(updated);
    if (newStatus) {
      showToast(`VAT marked as saved to separate tax pot!`);
    }
  };

  const handleSaveSettings = async (newSettings: StallSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
    showToast('Stall settings saved & synced to all devices.');
  };

  const handleUpdateVatSettings = async (newRate: number, newTreatment: 'inclusive' | 'exclusive') => {
    const updated = { ...settings, vatRate: newRate, vatTreatment: newTreatment };
    setSettings(updated);
    await saveSettings(updated);
    showToast(`Updated VAT rate to ${newRate}% (${newTreatment}).`);
  };

  const handleResetToDemo = () => {
    const clean = getCleanInitialLedger(year, weekNumber, settings.defaultCommissionRate);
    updateLedgerState(clean);
    showToast('Reset week to Pete, Kieron, Roy, Charlie, Connor, and Newton Collectables');
  };

  // Auth & Security handlers
  const handleUnlock = (session: AuthSession) => {
    setAuthSession(session);
    saveAuthSession(session);
    if (session.role === 'owner') {
      showToast('Stall unlocked: Full Owner Access');
    } else {
      showToast(`Welcome ${session.vendorName}: Viewing your personal statements`);
    }
  };

  const handleLock = () => {
    clearAuthSession();
    setAuthSession(null);
    showToast('Stall records locked.');
  };

  const handleSaveSecurityConfig = async (updatedConfig: StallSecurityConfig) => {
    setSecurityConfig(updatedConfig);
    await saveSecurityConfig(updatedConfig);
    showToast('Vendor PINs & Owner Security synced successfully.');
  };

  const handleOpenVendorPins = (targetVendorName?: string) => {
    setPinTargetVendor(targetVendorName || null);
    setIsVendorPinsModalOpen(true);
  };

  // -------------------------------------------------------------
  // VIEW ROUTING BASED ON AUTHENTICATION
  // -------------------------------------------------------------

  // 1. Lock Screen: If no active session, show lock screen over all information
  if (!authSession) {
    return (
      <LockScreen
        settings={settings}
        securityConfig={securityConfig}
        vendors={ledger.vendors}
        onUnlock={handleUnlock}
      />
    );
  }

  // 2. Vendor Portal: If logged in as vendor, strictly show their own information only
  if (authSession.role === 'vendor') {
    return (
      <VendorPortal
        vendorName={authSession.vendorName || ''}
        settings={settings}
        year={year}
        weekNumber={weekNumber}
        ledger={ledger}
        onSelectWeek={handleSelectWeek}
        onLock={handleLock}
      />
    );
  }

  // 3. Owner Dashboard: Full administrative access, consolidated earnings, settings & PIN management
  const summary = calculateConsolidatedSummary(ledger.vendors, settings);
  const curr = settings.currency;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        ledger={ledger}
        isCloudSyncing={isCloudSyncing}
        onOpenNewVendor={() => {
          setVendorToEdit(null);
          setIsVendorModalOpen(true);
        }}
        onOpenConsolidatedReport={() => setIsConsolidatedModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenVendorPins={() => handleOpenVendorPins()}
        onLock={handleLock}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className="mb-4 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between border border-slate-700 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white text-xs ml-4"
            >
              &times;
            </button>
          </div>
        )}

        {/* Week Navigator */}
        <WeekNavigator
          year={year}
          weekNumber={weekNumber}
          vendorCount={ledger.vendors.length}
          onSelectWeek={handleSelectWeek}
          onCopyFromPreviousWeek={handleCopyFromPreviousWeek}
          canCopyFromPrevious={canCopyFromPrevious}
        />

        {/* 5 Consolidated Metric Cards */}
        <ConsolidatedMetricCards
          summary={summary}
          settings={settings}
          vatSavedConfirmed={!!ledger.vatSavedConfirmed}
          onToggleVatSaved={handleToggleVatSaved}
          onOpenConsolidatedModal={() => setIsConsolidatedModalOpen(true)}
        />

        {/* Fast Action Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Quick Exports for Week {weekNumber}:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportWeekToCSV(ledger, settings)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Download spreadsheet CSV for bookkeeping"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => generateConsolidatedReportPDF(ledger, settings)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition shadow-xs"
              title="Download complete consolidated PDF of all vendors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Consolidated PDF</span>
            </button>

            <button
              onClick={() => setIsConsolidatedModalOpen(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-900 hover:bg-blue-800 text-white transition shadow-xs"
            >
              <PiggyBank className="w-3.5 h-3.5 text-blue-300" />
              <span>VAT Pot Breakdown ({formatCurrency(summary.totalVatToSave, curr)})</span>
            </button>
          </div>
        </div>

        {/* Vendor Ledger Table */}
        <VendorLedgerTable
          ledger={ledger}
          settings={settings}
          onUpdateVendor={handleUpdateVendor}
          onDeleteVendor={handleDeleteVendor}
          onEditVendor={(vendor) => {
            setVendorToEdit(vendor);
            setIsVendorModalOpen(true);
          }}
          onPreviewStatement={(vendor) => {
            setStatementVendor(vendor);
            setIsStatementModalOpen(true);
          }}
          onAddVendor={() => {
            setVendorToEdit(null);
            setIsVendorModalOpen(true);
          }}
          onLoadSampleData={handleResetToDemo}
          onManagePin={(vendor) => handleOpenVendorPins(vendor.vendorName)}
        />

        {/* Informative Guidance on Stall Commission, Trade Deductions, and VAT to Save */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
            <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              1. Commission &amp; What You Made
            </h4>
            <p>
              Your commission % is automatically deducted from each vendor&apos;s gross sales. This represents your stall service fee revenue for providing the pitch, card display showcases, customer till, and convention footfall.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
            <h4 className="font-bold text-rose-700 text-sm mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              2. Trade-Ins Deducted from Balance
            </h4>
            <p>
              When a vendor takes in card trades or cash is used to buy in customer collections on their behalf, that amount <strong>comes off their final payout</strong>: <code>Final Payout = (Sales − Commission) − Trade Taken In</code>.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
            <h4 className="font-bold text-blue-800 text-sm mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              3. The VAT You Need to Save (Commission Only)
            </h4>
            <p>
              VAT is charged strictly on your <strong>commission service fee</strong>, NOT on the full sales amount. The sales proceeds belong to your vendors. The app calculates your exact VAT liability ({settings.vatRate}%) on your commission earnings to transfer into your tax pot.
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <strong>{settings.stallName}</strong> • Pokémon Card &amp; Collectibles Sales Ledger
            <span className="text-emerald-600 font-semibold">• Cloud Sync Active</span>
          </div>
          <div className="text-slate-400">
            Multi-device real-time memory enabled across phones, tablets &amp; desktop
          </div>
        </div>
      </footer>

      {/* Modals */}
      <VendorFormModal
        isOpen={isVendorModalOpen}
        onClose={() => {
          setIsVendorModalOpen(false);
          setVendorToEdit(null);
        }}
        onSave={handleSaveVendorModal}
        vendorToEdit={vendorToEdit}
        settings={settings}
      />

      <VendorStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => {
          setIsStatementModalOpen(false);
          setStatementVendor(null);
        }}
        vendor={statementVendor}
        ledger={ledger}
        settings={settings}
      />

      <ConsolidatedReportModal
        isOpen={isConsolidatedModalOpen}
        onClose={() => setIsConsolidatedModalOpen(false)}
        ledger={ledger}
        settings={settings}
        vatSavedConfirmed={!!ledger.vatSavedConfirmed}
        onToggleVatSaved={handleToggleVatSaved}
        onUpdateVatSettings={handleUpdateVatSettings}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onResetToDemoData={handleResetToDemo}
        onOpenVendorPins={() => handleOpenVendorPins()}
      />

      <VendorPinsModal
        isOpen={isVendorPinsModalOpen}
        onClose={() => {
          setIsVendorPinsModalOpen(false);
          setPinTargetVendor(null);
        }}
        securityConfig={securityConfig}
        vendors={ledger.vendors}
        onSaveSecurityConfig={handleSaveSecurityConfig}
        targetVendorName={pinTargetVendor}
      />

    </div>
  );
}
