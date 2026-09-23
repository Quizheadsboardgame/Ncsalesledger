import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StallSettings, VendorEntry, WeekLedger } from '../types';
import { calculateConsolidatedSummary, calculateVendorFinancials, formatCurrency } from './calculations';
import { formatFullDate, formatWeekLabel, getWeekDateRange } from './dateUtils';

// Colors for professional PDF styling
const COLOR_PRIMARY = [30, 41, 59] as const; // Slate-800
const COLOR_ACCENT = [217, 119, 6] as const; // Amber-600 (Pikachu gold)
const COLOR_RED = [220, 38, 38] as const; // Crimson-600
const COLOR_LIGHT_BG = [248, 250, 252] as const; // Slate-50
const COLOR_MUTED = [100, 116, 139] as const; // Slate-500

/**
 * Generate Individual Vendor Settlement Statement PDF
 */
export function generateVendorStatementPDF(
  vendor: VendorEntry,
  ledger: WeekLedger,
  settings: StallSettings
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const calc = calculateVendorFinancials(vendor, settings);
  const { startDate, endDate } = getWeekDateRange(ledger.year, ledger.weekNumber);
  const weekLabel = formatWeekLabel(ledger.year, ledger.weekNumber);
  const curr = settings.currency;

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 210, 32, 'F');

  // Accent Line
  doc.setFillColor(217, 119, 6); // Amber gold
  doc.rect(0, 32, 210, 2.5, 'F');

  // Stall Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(settings.stallName || 'POKÉMON STALL', 15, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text('Vendor Settlement & Sales Statement', 15, 23);

  // Statement Meta right side
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Week: ${ledger.weekNumber} (${ledger.year})`, 195, 14, { align: 'right' });
  doc.setTextColor(203, 213, 225);
  doc.text(`Date: ${formatFullDate(new Date())}`, 195, 22, { align: 'right' });

  // Vendor Information Card Box
  let y = 43;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y, 180, 26, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, y, 180, 26, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Vendor: ${vendor.vendorName}`, 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  if (vendor.boothOrSpace) {
    doc.text(`Booth / Space: ${vendor.boothOrSpace}`, 20, y + 16);
  }
  if (vendor.contactInfo) {
    doc.text(`Contact: ${vendor.contactInfo}`, 20, y + 22);
  }

  // Right side of vendor box: Period & Status
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Period: Week ${ledger.weekNumber}`, 140, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${formatFullDate(startDate)} - ${formatFullDate(endDate)}`, 140, y + 14);

  // Status Badge
  const statusColor =
    vendor.paymentStatus === 'paid' || vendor.paymentStatus === 'settled'
      ? [22, 163, 74] // green
      : [217, 119, 6]; // amber
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${vendor.paymentStatus.toUpperCase()}`, 140, y + 21);

  // Financial Breakdown Table
  y = 76;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Sales & Settlement Calculation', 15, y);

  const tableBody = [
    [
      'Gross Sales Sold (Pokémon Cards & Merch)',
      'Total retail sales made through stall',
      formatCurrency(calc.grossSales, curr),
    ],
    [
      calc.commissionRate === 0
        ? 'Stall Commission (0% - No Commission)'
        : `Stall Commission (${calc.commissionRate}% deduction)`,
      calc.commissionRate === 0
        ? 'Zero commission agreed - 100% sales retained by vendor'
        : 'Commission fee retained by stall operator',
      calc.commissionAmount > 0
        ? `-${formatCurrency(calc.commissionAmount, curr)}`
        : `${curr}0.00`,
    ],
    [
      'Subtotal (Vendor Net from Sales)',
      'Gross sales minus stall commission',
      formatCurrency(calc.netSalesAfterCommission, curr),
    ],
    [
      'Trade-in Cards Taken In (Stock Income)',
      'Customer card trades / inventory accepted on vendor behalf (stock income, not cash)',
      calc.tradeTakenIn > 0 ? `-${formatCurrency(calc.tradeTakenIn, curr)}` : `${curr}0.00`,
    ],
    [
      'Cash Withdrawal (Deduction)',
      vendor.cashWithdrawalNotes || 'Cash withdrawn from stall till during event',
      calc.cashWithdrawal > 0 ? `-${formatCurrency(calc.cashWithdrawal, curr)}` : `${curr}0.00`,
    ],
  ];

  if (calc.otherDeductions > 0) {
    tableBody.push([
      'Other Deductions / Fees',
      vendor.deductionNotes || 'Display rack fee or operational deduction',
      `-${formatCurrency(calc.otherDeductions, curr)}`,
    ]);
  }

  autoTable(doc, {
    startY: y + 4,
    margin: { left: 15, right: 15 },
    head: [['Item Description', 'Details / Note', 'Amount']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9.5,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 75, textColor: [100, 116, 139] },
      2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
    },
    styles: {
      fontSize: 9,
      cellPadding: 3.5,
    },
  });

  // Final Balance Highlight Box
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastTable = (doc as any).lastAutoTable;
  y = lastTable ? lastTable.finalY + 8 : 145;

  const isPositiveBalance = calc.finalBalance >= 0;
  doc.setFillColor(isPositiveBalance ? 240 : 254, isPositiveBalance ? 253 : 242, isPositiveBalance ? 244 : 242);
  doc.roundedRect(15, y, 180, 22, 2, 2, 'F');
  doc.setDrawColor(isPositiveBalance ? 34 : 239, isPositiveBalance ? 197 : 68, isPositiveBalance ? 94 : 68);
  doc.setLineWidth(0.6);
  doc.roundedRect(15, y, 180, 22, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(isPositiveBalance ? 22 : 185, isPositiveBalance ? 101 : 28, isPositiveBalance ? 52 : 28);
  doc.text(
    isPositiveBalance ? 'NET PAYOUT DUE TO VENDOR:' : 'AMOUNT VENDOR OWES STALL:',
    22,
    y + 14
  );

  doc.setFontSize(16);
  doc.text(
    formatCurrency(calc.finalBalance, curr),
    185,
    y + 14,
    { align: 'right' }
  );

  y += 28;

  // Trade Details breakdown (if any notes provided)
  if (vendor.tradeNotes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Trade-in Itemization Notes:', 15, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    const splitTradeNotes = doc.splitTextToSize(vendor.tradeNotes, 180);
    doc.text(splitTradeNotes, 15, y);
    y += splitTradeNotes.length * 4.5 + 4;
  }

  // Cash Withdrawal breakdown (if any notes provided)
  if (vendor.cashWithdrawalNotes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Cash Withdrawal Notes:', 15, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    const splitCashNotes = doc.splitTextToSize(vendor.cashWithdrawalNotes, 180);
    doc.text(splitCashNotes, 15, y);
    y += splitCashNotes.length * 4.5 + 4;
  }

  // Payment & Settlement Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Payout & Settlement Instructions:', 15, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  if (settings.payoutDetails) {
    doc.text(`Payment Details: ${settings.payoutDetails}`, 15, y);
    y += 5;
  }
  if (vendor.paymentReference) {
    doc.text(`Payment Ref: ${vendor.paymentReference}`, 15, y);
    y += 5;
  }
  if (vendor.paymentDate) {
    doc.text(`Settlement Date: ${vendor.paymentDate}`, 15, y);
    y += 5;
  }

  // Stall Contact Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 275, 195, 275);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${settings.stallName} • Contact: ${settings.email || settings.phone || 'Stall Management'} • Generated: ${new Date().toLocaleString()}`,
    105,
    281,
    { align: 'center' }
  );

  // Save the PDF
  const safeVendorName = vendor.vendorName.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${safeVendorName}_Week_${ledger.weekNumber}_${ledger.year}_Statement.pdf`);
}

/**
 * Generate Consolidated Report PDF for All Vendors in the Week with VAT to Save
 */
export function generateConsolidatedReportPDF(
  ledger: WeekLedger,
  settings: StallSettings
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const summary = calculateConsolidatedSummary(ledger.vendors, settings);
  const { startDate, endDate } = getWeekDateRange(ledger.year, ledger.weekNumber);
  const curr = settings.currency;

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 297, 28, 'F');

  // Accent Line
  doc.setFillColor(217, 119, 6); // Amber gold
  doc.rect(0, 28, 297, 2.5, 'F');

  // Stall Title & Heading
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.stallName || 'POKÉMON STALL', 15, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `CONSOLIDATED VENDORS SALES & VAT REPORT • Week ${ledger.weekNumber}, ${ledger.year} (${formatFullDate(startDate)} – ${formatFullDate(endDate)})`,
    15,
    21
  );

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${formatFullDate(new Date())}`, 282, 13, { align: 'right' });
  doc.setTextColor(203, 213, 225);
  doc.text(`${summary.vendorCount} Active Vendors`, 282, 21, { align: 'right' });

  // Summary Metrics Tiles (5 Cards)
  const cardY = 36;
  const cardW = 50.5;
  const cardH = 22;
  const gap = 4;
  let startX = 15;

  // Card 1: Total Gross Sales
  renderKpiCard(
    doc,
    startX,
    cardY,
    cardW,
    cardH,
    'TOTAL GROSS SALES',
    formatCurrency(summary.totalGrossSales, curr),
    [248, 250, 252],
    [30, 41, 59]
  );

  // Card 2: Total Trade Taken In (Stock Income)
  startX += cardW + gap;
  renderKpiCard(
    doc,
    startX,
    cardY,
    cardW,
    cardH,
    'STOCK INCOME (TRADE)',
    formatCurrency(summary.totalTradeTakenIn, curr),
    [250, 245, 255],
    [126, 34, 206]
  );

  // Card 3: Total Vendor Payouts
  startX += cardW + gap;
  renderKpiCard(
    doc,
    startX,
    cardY,
    cardW,
    cardH,
    'TOTAL VENDOR PAYOUTS',
    formatCurrency(summary.totalVendorPayouts, curr),
    [240, 253, 244],
    [22, 101, 52]
  );

  // Card 4: TOTAL CASH COMMISSION MADE
  startX += cardW + gap;
  renderKpiCard(
    doc,
    startX,
    cardY,
    cardW,
    cardH,
    'CASH COMMISSION MADE',
    formatCurrency(summary.totalCommissionMade, curr),
    [254, 243, 199], // Amber-100
    [180, 83, 9] // Amber-700
  );

  // Card 5: THE VAT YOU NEED TO SAVE (Tax Pot)
  startX += cardW + gap;
  renderKpiCard(
    doc,
    startX,
    cardY,
    cardW,
    cardH,
    `VAT TO SAVE (${settings.vatRate}%)`,
    formatCurrency(summary.totalVatToSave, curr),
    [239, 246, 255], // Blue-50
    [29, 78, 216] // Blue-700
  );

  // Consolidated Vendor Ledger Table
  const tableY = 64;
  const rows = ledger.vendors.map((vendor, index) => {
    const calc = calculateVendorFinancials(vendor, settings);
    return [
      `#${index + 1}`,
      vendor.vendorName,
      vendor.boothOrSpace || '—',
      formatCurrency(calc.grossSales, curr),
      `${calc.commissionRate}%`,
      formatCurrency(calc.commissionAmount, curr),
      calc.tradeTakenIn > 0 ? `-${formatCurrency(calc.tradeTakenIn, curr)}` : `${curr}0.00`,
      calc.cashWithdrawal > 0 ? `-${formatCurrency(calc.cashWithdrawal, curr)}` : `${curr}0.00`,
      calc.otherDeductions > 0 ? `-${formatCurrency(calc.otherDeductions, curr)}` : `${curr}0.00`,
      formatCurrency(calc.finalBalance, curr),
      formatCurrency(calc.vatAmount, curr),
      vendor.paymentStatus.toUpperCase(),
    ];
  });

  // Add Totals row
  rows.push([
    '',
    'TOTALS',
    `${summary.vendorCount} Vendors`,
    formatCurrency(summary.totalGrossSales, curr),
    '—',
    formatCurrency(summary.totalCommissionMade, curr),
    `-${formatCurrency(summary.totalTradeTakenIn, curr)}`,
    `-${formatCurrency(summary.totalCashWithdrawals, curr)}`,
    `-${formatCurrency(summary.totalOtherDeductions, curr)}`,
    formatCurrency(summary.totalVendorPayouts, curr),
    formatCurrency(summary.totalVatToSave, curr),
    '—',
  ]);

  autoTable(doc, {
    startY: tableY,
    margin: { left: 15, right: 15 },
    head: [
      [
        '#',
        'Vendor Name',
        'Space / Booth',
        'Gross Sales',
        'Comm %',
        'Comm Earned',
        'Trade (Stock)',
        'Cash Out',
        'Deductions',
        'Net Payout',
        'VAT to Save',
        'Status',
      ],
    ],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 22 },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 23, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 22, halign: 'right', textColor: [185, 28, 28] },
      7: { cellWidth: 22, halign: 'right', textColor: [180, 83, 9] },
      8: { cellWidth: 20, halign: 'right' },
      9: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
      10: { cellWidth: 24, halign: 'right', textColor: [29, 78, 216], fontStyle: 'bold' },
      11: { cellWidth: 19, halign: 'center' },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
    },
    didParseCell: (data) => {
      // Highlight the totals row
      if (data.row.index === rows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
      }
    },
  });

  // VAT Breakdown & Tax Reserve Notes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastTable = (doc as any).lastAutoTable;
  const noteY = lastTable ? lastTable.finalY + 6 : 170;

  // Box for VAT Reserve instructions
  doc.setFillColor(239, 246, 255); // Blue-50
  doc.roundedRect(15, noteY, 267, 22, 2, 2, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(15, noteY, 267, 22, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(29, 78, 216);
  doc.text(`VAT TAX RESERVE ADVISORY (VAT CHARGED ON COMMISSION ONLY):`, 20, noteY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const vatModeText =
    settings.vatTreatment === 'inclusive'
      ? `Based on ${settings.vatRate}% VAT inclusive in stall commission income. Transfer ${formatCurrency(summary.totalVatToSave, curr)} to your separate VAT tax pot.`
      : `Based on ${settings.vatRate}% VAT applied to commission revenue. Transfer ${formatCurrency(summary.totalVatToSave, curr)} to your separate VAT tax pot.`;
  doc.text(vatModeText, 20, noteY + 12);
  
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `*Note: VAT is charged on your commission (${formatCurrency(summary.totalCommissionMade, curr)}). Trade-ins (${formatCurrency(summary.totalTradeTakenIn, curr)}) are stock income, not cash profit.`,
    20,
    noteY + 17
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Net Cash Profit: ${formatCurrency(summary.netCashProfit, curr)}`,
    200,
    noteY + 12
  );

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Consolidated report for internal accounting • Pokémon Stall Management • Page 1 of 1`,
    148,
    202,
    { align: 'center' }
  );

  doc.save(`Pokemon_Stall_Consolidated_Week_${ledger.weekNumber}_${ledger.year}.pdf`);
}

function renderKpiCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  value: string,
  bgColor: readonly [number, number, number],
  textColor: readonly [number, number, number]
): void {
  doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, w, h, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(title, x + 4, y + 6);

  doc.setFontSize(11);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(value, x + 4, y + 15);
}
