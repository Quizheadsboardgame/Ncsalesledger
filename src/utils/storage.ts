/**
 * Cloud and Local Storage Manager for Pokémon Stall Sales Ledger
 * Provides real-time synchronization to Firestore cloud database so data
 * persists across multiple devices (phones, tablets, laptops) seamlessly,
 * while maintaining instant local cache fallback.
 */

import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StallSettings, VendorEntry, WeekLedger } from '../types';
import { getISOWeekAndYear } from './dateUtils';

const SETTINGS_KEY = 'pokemon_stall_settings_v2';
const LEDGERS_KEY = 'pokemon_stall_ledgers_v2';

export const DEFAULT_VENDOR_NAMES = [
  'Pete',
  'Kieron',
  'Roy',
  'Charlie',
  'Connor',
  'Newton Collectables',
];

export const DEFAULT_SETTINGS: StallSettings = {
  stallName: "Newtons Collectables Pokémon Stall",
  ownerName: 'Stall Manager',
  email: 'stall@newtonscollectables.com',
  phone: '',
  payoutDetails: 'Bank Transfer / Cash at Stall Close',
  currency: '£',
  defaultCommissionRate: 10, // 10%
  vatRate: 20, // 20% standard rate
  vatTreatment: 'exclusive', // VAT charged on commission (Commission * 20%)
};

export function createBlankVendor(name: string, defaultComm: number = 10): VendorEntry {
  return {
    id: `ven-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    vendorName: name,
    boothOrSpace: '',
    contactInfo: '',
    grossSales: 0,
    commissionRate: defaultComm,
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
  };
}

export function getCleanInitialLedger(year: number, weekNumber: number, defaultComm: number = 10): WeekLedger {
  return {
    year,
    weekNumber,
    notes: '',
    vatSavedConfirmed: false,
    vendors: DEFAULT_VENDOR_NAMES.map((name) => createBlankVendor(name, defaultComm)),
  };
}

/**
 * Normalizes a week ledger to ensure Connor and Newton Collectables are separate people/vendors,
 * seamlessly migrating any legacy records that had "Connor Newtons Collectables" combined.
 */
export function normalizeWeekLedger(ledger: WeekLedger, defaultComm: number = 10): { ledger: WeekLedger; changed: boolean } {
  if (!ledger || !Array.isArray(ledger.vendors)) {
    return { ledger, changed: false };
  }

  let changed = false;
  const updatedVendors: VendorEntry[] = [];

  for (const v of ledger.vendors) {
    if (v.vendorName === 'Connor Newtons Collectables') {
      changed = true;
      // Retain existing metrics, ID, and data under Connor
      updatedVendors.push({
        ...v,
        vendorName: 'Connor',
      });
      // Check if Newton Collectables is already in the list
      const hasNewton = ledger.vendors.some(
        (other) => other.vendorName.toLowerCase().includes('newton') && other.vendorName !== 'Connor Newtons Collectables'
      );
      if (!hasNewton) {
        updatedVendors.push(createBlankVendor('Newton Collectables', defaultComm));
      }
    } else {
      updatedVendors.push(v);
    }
  }

  if (changed) {
    return {
      ledger: { ...ledger, vendors: updatedVendors },
      changed: true,
    };
  }

  return { ledger, changed: false };
}

// ----------------- LOCAL STORAGE HELPERS -----------------

export function loadSettingsLocal(): StallSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load settings from storage', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettingsLocal(settings: StallSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export function loadAllLedgersLocal(): Record<string, WeekLedger> {
  try {
    const raw = localStorage.getItem(LEDGERS_KEY);
    if (raw) {
      const parsed: Record<string, WeekLedger> = JSON.parse(raw);
      if (Object.keys(parsed).length > 0) {
        let anyChanged = false;
        for (const key of Object.keys(parsed)) {
          const { ledger: norm, changed } = normalizeWeekLedger(parsed[key]);
          if (changed) {
            parsed[key] = norm;
            anyChanged = true;
          }
        }
        if (anyChanged) {
          saveAllLedgersLocal(parsed);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load ledgers from localStorage', e);
  }

  const current = getISOWeekAndYear();
  const ledgerKey = `${current.year}-W${current.week}`;
  const initialData: Record<string, WeekLedger> = {
    [ledgerKey]: getCleanInitialLedger(current.year, current.week),
  };
  saveAllLedgersLocal(initialData);
  return initialData;
}

export function saveAllLedgersLocal(ledgers: Record<string, WeekLedger>): void {
  try {
    localStorage.setItem(LEDGERS_KEY, JSON.stringify(ledgers));
  } catch (e) {
    console.error('Failed to save ledgers to localStorage', e);
  }
}

export function getWeekLedgerLocal(year: number, week: number): WeekLedger {
  const ledgers = loadAllLedgersLocal();
  const key = `${year}-W${week}`;
  if (ledgers[key]) {
    const { ledger: norm, changed } = normalizeWeekLedger(ledgers[key]);
    if (changed) {
      ledgers[key] = norm;
      saveAllLedgersLocal(ledgers);
    }
    return norm;
  }
  const blankLedger = getCleanInitialLedger(year, week);
  ledgers[key] = blankLedger;
  saveAllLedgersLocal(ledgers);
  return blankLedger;
}

export function saveWeekLedgerLocal(ledger: WeekLedger): void {
  const ledgers = loadAllLedgersLocal();
  const key = `${ledger.year}-W${ledger.weekNumber}`;
  ledgers[key] = ledger;
  saveAllLedgersLocal(ledgers);
}

// ----------------- FIRESTORE CLOUD PERSISTENCE -----------------

const SETTINGS_DOC_REF = doc(db, 'stall_config', 'global_settings');

/**
 * Subscribe to cloud settings changes for real-time multi-device sync
 */
export function subscribeToCloudSettings(
  onData: (settings: StallSettings) => void,
  onError?: (err: Error) => void
): () => void {
  return onSnapshot(
    SETTINGS_DOC_REF,
    (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data() as StallSettings;
        const merged = { ...DEFAULT_SETTINGS, ...cloudData };
        saveSettingsLocal(merged);
        onData(merged);
      } else {
        // If doc doesn't exist in cloud yet, seed it with current local settings
        const current = loadSettingsLocal();
        setDoc(SETTINGS_DOC_REF, current).catch(console.error);
        onData(current);
      }
    },
    (error) => {
      console.warn('Firestore settings subscription error:', error);
      onError?.(error);
    }
  );
}

/**
 * Save settings to both cloud Firestore and localStorage
 */
export async function saveSettings(settings: StallSettings): Promise<void> {
  saveSettingsLocal(settings);
  try {
    await setDoc(SETTINGS_DOC_REF, settings, { merge: true });
  } catch (error) {
    console.warn('Could not sync settings to cloud immediately:', error);
  }
}

/**
 * Get doc reference for a week ledger
 */
function getWeekDocRef(year: number, week: number) {
  const docId = `${year}-W${week}`;
  return doc(db, 'week_ledgers', docId);
}

/**
 * Subscribe to a specific week's ledger in real time across multiple devices
 */
export function subscribeToCloudWeekLedger(
  year: number,
  week: number,
  onData: (ledger: WeekLedger) => void,
  onError?: (err: Error) => void
): () => void {
  const weekRef = getWeekDocRef(year, week);

  return onSnapshot(
    weekRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const cloudLedger = snapshot.data() as WeekLedger;
        const { ledger: normLedger, changed } = normalizeWeekLedger(cloudLedger);
        if (changed) {
          setDoc(weekRef, normLedger).catch(console.error);
        }
        saveWeekLedgerLocal(normLedger);
        onData(normLedger);
      } else {
        // Document does not exist in cloud yet for this week
        const local = getWeekLedgerLocal(year, week);
        const { ledger: normLocal } = normalizeWeekLedger(local);
        // Upload the clean week structure to cloud so other devices immediately see it
        setDoc(weekRef, normLocal).catch(console.error);
        onData(normLocal);
      }
    },
    (error) => {
      console.warn(`Firestore week ${year}-W${week} subscription error:`, error);
      onError?.(error);
    }
  );
}

/**
 * Save week ledger to Firestore cloud and local backup
 */
export async function saveWeekLedger(ledger: WeekLedger): Promise<void> {
  saveWeekLedgerLocal(ledger);
  try {
    const weekRef = getWeekDocRef(ledger.year, ledger.weekNumber);
    await setDoc(weekRef, ledger);
  } catch (error) {
    console.warn(`Failed to sync week ${ledger.year}-W${ledger.weekNumber} to cloud:`, error);
  }
}

// Copy vendors from previous week
export async function copyVendorsFromWeek(
  targetYear: number,
  targetWeek: number,
  sourceYear: number,
  sourceWeek: number
): Promise<WeekLedger> {
  const sourceLedger = getWeekLedgerLocal(sourceYear, sourceWeek);
  const targetLedger = getWeekLedgerLocal(targetYear, targetWeek);

  const copiedVendors: VendorEntry[] = sourceLedger.vendors.map((v) => ({
    id: `ven-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    vendorName: v.vendorName,
    boothOrSpace: v.boothOrSpace,
    contactInfo: v.contactInfo,
    grossSales: 0,
    commissionRate: v.commissionRate,
    tradeTakenIn: 0,
    tradeNotes: '',
    cashWithdrawal: 0,
    cashWithdrawalNotes: '',
    otherDeductions: 0,
    deductionNotes: '',
    paymentStatus: 'pending',
    notes: '',
  }));

  const updated: WeekLedger = {
    ...targetLedger,
    vendors: copiedVendors,
  };

  await saveWeekLedger(updated);
  return updated;
}

// Aliases for initial synchronous load
export const loadSettings = loadSettingsLocal;
export const getWeekLedger = getWeekLedgerLocal;
