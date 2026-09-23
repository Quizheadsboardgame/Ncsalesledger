export interface StallSettings {
  stallName: string;
  ownerName: string;
  email: string;
  phone: string;
  payoutDetails: string; // Bank account, PayPal, or cash note
  currency: string;
  defaultCommissionRate: number; // e.g. 10%
  vatRate: number; // e.g. 20% standard rate in UK
  vatTreatment: 'inclusive' | 'exclusive'; // whether commission includes VAT or VAT is added/calculated
}

export interface TradeItemNote {
  id: string;
  description: string;
  amount: number;
}

export interface VendorEntry {
  id: string;
  vendorName: string;
  boothOrSpace?: string;
  contactInfo?: string;
  grossSales: number; // Amount vendor has sold (£)
  commissionRate: number; // e.g. 10 for 10%
  tradeTakenIn: number; // How much trade they took in (£)
  tradeNotes?: string; // e.g. "Charizard EX slab £80, Vintage binder £40"
  cashWithdrawal?: number; // Cash withdrawn by vendor from till during event (£)
  cashWithdrawalNotes?: string; // e.g. "Withdrew £50 cash at 2pm"
  otherDeductions?: number; // e.g. table rent fee or supplies (£)
  deductionNotes?: string;
  paymentStatus: 'pending' | 'paid' | 'settled';
  paymentDate?: string;
  paymentReference?: string;
  notes?: string;
}

export interface WeekLedger {
  year: number;
  weekNumber: number; // 1 - 53
  vendors: VendorEntry[];
  notes?: string;
  vatSavedConfirmed?: boolean;
}

export interface VendorFinancialCalculations {
  grossSales: number;
  commissionRate: number;
  commissionAmount: number; // Stall owner cash commission revenue
  tradeTakenIn: number; // Stock income (inventory acquired, NOT cash profit)
  cashWithdrawal: number; // Cash given out to vendor from till
  otherDeductions: number;
  netSalesAfterCommission: number; // Gross Sales - Commission
  finalBalance: number; // (Gross Sales - Commission) - Trade Taken In - Cash Withdrawal - otherDeductions
  vatAmount: number; // VAT on stall's commission to save
  netStallIncome: number; // Net cash income/profit: Commission - VAT (strictly excludes stock trade-ins)
  netCashIncome?: number; // Alias for netStallIncome
  stockIncome?: number; // Value of trade-in stock acquired
}

export interface ConsolidatedWeekSummary {
  totalGrossSales: number;
  totalTradeTakenIn: number; // Total stock income (inventory intake, NOT cash profit)
  totalCashWithdrawals: number;
  totalOtherDeductions: number;
  totalCommissionMade: number; // Total cash commission earned
  totalVendorPayouts: number; // Total net cash owed/paid to vendors
  totalVatToSave: number; // VAT stall owner must keep aside
  netCashProfit: number; // Cash profit: Commission - VAT to save (Trade-ins excluded)
  netStallProfit: number; // Standard alias for netCashProfit
  totalStockIncome: number; // Total inventory value acquired from trade-ins
  vendorCount: number;
}
