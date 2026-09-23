import { StallSettings, WeekLedger } from '../types';
import { calculateConsolidatedSummary, calculateVendorFinancials } from './calculations';
import { getWeekDateRange } from './dateUtils';

export function exportWeekToCSV(ledger: WeekLedger, settings: StallSettings): void {
  const { startDate, endDate } = getWeekDateRange(ledger.year, ledger.weekNumber);
  const summary = calculateConsolidatedSummary(ledger.vendors, settings);

  const rows: string[][] = [
    ['POKEMON STALL SALES LEDGER - CONSOLIDATED REPORT'],
    ['Stall Name', settings.stallName],
    ['Week Number', `Week ${ledger.weekNumber}`],
    ['Year', `${ledger.year}`],
    ['Date Range', `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`],
    ['Currency', settings.currency],
    ['VAT Rate', `${settings.vatRate}% (${settings.vatTreatment})`],
    [],
    [
      'Vendor Name',
      'Booth / Space',
      'Contact',
      `Gross Sales (${settings.currency})`,
      'Commission %',
      `Commission Made (${settings.currency})`,
      `Net Sales After Comm (${settings.currency})`,
      `Trade Taken In [Stock Income] (${settings.currency})`,
      'Trade Notes',
      `Cash Withdrawal (${settings.currency})`,
      'Cash Withdrawal Notes',
      `Other Deductions (${settings.currency})`,
      'Deduction Notes',
      `Final Vendor Payout (${settings.currency})`,
      `VAT to Save (${settings.currency})`,
      'Payment Status',
      'Payment Reference',
    ],
  ];

  for (const v of ledger.vendors) {
    const calc = calculateVendorFinancials(v, settings);
    rows.push([
      `"${v.vendorName.replace(/"/g, '""')}"`,
      `"${(v.boothOrSpace || '').replace(/"/g, '""')}"`,
      `"${(v.contactInfo || '').replace(/"/g, '""')}"`,
      calc.grossSales.toFixed(2),
      calc.commissionRate.toFixed(2),
      calc.commissionAmount.toFixed(2),
      calc.netSalesAfterCommission.toFixed(2),
      calc.tradeTakenIn.toFixed(2),
      `"${(v.tradeNotes || '').replace(/"/g, '""')}"`,
      calc.cashWithdrawal.toFixed(2),
      `"${(v.cashWithdrawalNotes || '').replace(/"/g, '""')}"`,
      calc.otherDeductions.toFixed(2),
      `"${(v.deductionNotes || '').replace(/"/g, '""')}"`,
      calc.finalBalance.toFixed(2),
      calc.vatAmount.toFixed(2),
      v.paymentStatus,
      `"${(v.paymentReference || '').replace(/"/g, '""')}"`,
    ]);
  }

  rows.push([]);
  rows.push([
    'CONSOLIDATED TOTALS',
    '',
    '',
    summary.totalGrossSales.toFixed(2),
    '',
    summary.totalCommissionMade.toFixed(2),
    '',
    summary.totalTradeTakenIn.toFixed(2),
    '',
    summary.totalCashWithdrawals.toFixed(2),
    '',
    summary.totalOtherDeductions.toFixed(2),
    '',
    summary.totalVendorPayouts.toFixed(2),
    summary.totalVatToSave.toFixed(2),
    '',
    '',
  ]);
  rows.push([
    'NET CASH PROFIT (Commission - VAT)',
    '',
    '',
    '',
    '',
    summary.netCashProfit.toFixed(2),
  ]);
  rows.push([
    'TOTAL STOCK INCOME (Trade-Ins Acquired - Non-Cash)',
    '',
    '',
    '',
    '',
    summary.totalTradeTakenIn.toFixed(2),
  ]);

  const csvContent = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Pokemon_Stall_Week_${ledger.weekNumber}_${ledger.year}_Report.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
