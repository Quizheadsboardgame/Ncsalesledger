import { ConsolidatedWeekSummary, StallSettings, VendorEntry, VendorFinancialCalculations } from '../types';

export function calculateVendorFinancials(
  vendor: VendorEntry,
  settings: StallSettings
): VendorFinancialCalculations {
  const grossSales = Math.max(0, Number(vendor.grossSales) || 0);
  const commissionRate = Math.max(0, Number(vendor.commissionRate) || 0);
  const tradeTakenIn = Math.max(0, Number(vendor.tradeTakenIn) || 0);
  const cashWithdrawal = Math.max(0, Number(vendor.cashWithdrawal) || 0);
  const otherDeductions = Math.max(0, Number(vendor.otherDeductions) || 0);

  // Commission earned by the stall owner
  const commissionAmount = Number(((grossSales * commissionRate) / 100).toFixed(2));

  // Net sales after commission deduction
  const netSalesAfterCommission = Number((grossSales - commissionAmount).toFixed(2));

  // Final vendor balance / payout:
  // Gross Sales - Commission - Trade Taken In - Cash Withdrawal - Other Deductions
  const finalBalance = Number(
    (netSalesAfterCommission - tradeTakenIn - cashWithdrawal - otherDeductions).toFixed(2)
  );

  // VAT to save from stall commission
  // UK VAT rate (default 20%)
  const vatRate = Math.max(0, Number(settings.vatRate) || 0);
  let vatAmount = 0;
  if (settings.vatTreatment === 'inclusive') {
    // If the commission includes VAT: VAT portion is Commission * (Rate / (100 + Rate))
    vatAmount = Number(((commissionAmount * vatRate) / (100 + vatRate)).toFixed(2));
  } else {
    // If VAT is calculated directly on top of commission: Commission * (Rate / 100)
    vatAmount = Number(((commissionAmount * vatRate) / 100).toFixed(2));
  }

  const netStallIncome = Number((commissionAmount - vatAmount).toFixed(2));
  const netCashIncome = netStallIncome;
  const stockIncome = tradeTakenIn; // Stock income only, NOT cash income or profit

  return {
    grossSales,
    commissionRate,
    commissionAmount,
    tradeTakenIn,
    cashWithdrawal,
    otherDeductions,
    netSalesAfterCommission,
    finalBalance,
    vatAmount,
    netStallIncome,
    netCashIncome,
    stockIncome,
  };
}

export function calculateConsolidatedSummary(
  vendors: VendorEntry[],
  settings: StallSettings
): ConsolidatedWeekSummary {
  let totalGrossSales = 0;
  let totalTradeTakenIn = 0;
  let totalCashWithdrawals = 0;
  let totalOtherDeductions = 0;
  let totalCommissionMade = 0;
  let totalVendorPayouts = 0;
  let totalVatToSave = 0;

  for (const vendor of vendors) {
    const calc = calculateVendorFinancials(vendor, settings);
    totalGrossSales += calc.grossSales;
    totalTradeTakenIn += calc.tradeTakenIn;
    totalCashWithdrawals += calc.cashWithdrawal;
    totalOtherDeductions += calc.otherDeductions;
    totalCommissionMade += calc.commissionAmount;
    totalVendorPayouts += calc.finalBalance;
    totalVatToSave += calc.vatAmount;
  }

  // Clean rounding
  totalGrossSales = Number(totalGrossSales.toFixed(2));
  totalTradeTakenIn = Number(totalTradeTakenIn.toFixed(2));
  totalCashWithdrawals = Number(totalCashWithdrawals.toFixed(2));
  totalOtherDeductions = Number(totalOtherDeductions.toFixed(2));
  totalCommissionMade = Number(totalCommissionMade.toFixed(2));
  totalVendorPayouts = Number(totalVendorPayouts.toFixed(2));
  totalVatToSave = Number(totalVatToSave.toFixed(2));

  // Cash profit is Commission minus VAT only.
  // Trade-ins are strictly stock income (inventory value), NOT cash income, and do NOT count towards cash profit.
  const netCashProfit = Number((totalCommissionMade - totalVatToSave).toFixed(2));
  const netStallProfit = netCashProfit;
  const totalStockIncome = totalTradeTakenIn;

  return {
    totalGrossSales,
    totalTradeTakenIn,
    totalCashWithdrawals,
    totalOtherDeductions,
    totalCommissionMade,
    totalVendorPayouts,
    totalVatToSave,
    netCashProfit,
    netStallProfit,
    totalStockIncome,
    vendorCount: vendors.length,
  };
}

export function formatCurrency(amount: number, currency: string = '£'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-${currency}${formatted}` : `${currency}${formatted}`;
}
