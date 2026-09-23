/**
 * Date and Week utilities for the Pokémon Stall Sales Ledger
 */

// Returns the ISO 8601 week number and year for a given date
export function getISOWeekAndYear(date: Date = new Date()): { week: number; year: number } {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7; // Monday is 0, Sunday is 6
  target.setDate(target.getDate() - dayNr + 3); // Thursday of current week
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return { week: weekNumber, year: new Date(firstThursday).getFullYear() };
}

// Get the Monday (start) and Sunday (end) dates for a given ISO week and year
export function getWeekDateRange(year: number, week: number): { startDate: Date; endDate: Date } {
  // ISO week 1 is the week with the first Thursday of the year
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7; // Monday = 0
  const mondayWeek1 = new Date(year, 0, 4 - dayOfWeek);
  
  const monday = new Date(mondayWeek1.getTime() + (week - 1) * 7 * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  
  return { startDate: monday, endDate: sunday };
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatWeekLabel(year: number, week: number): string {
  const { startDate, endDate } = getWeekDateRange(year, week);
  const startStr = formatShortDate(startDate);
  const endStr = formatFullDate(endDate);
  return `Week ${week}, ${year} (${startStr} – ${endStr})`;
}
