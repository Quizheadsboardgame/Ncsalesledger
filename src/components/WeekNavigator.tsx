import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Copy, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { getISOWeekAndYear, getWeekDateRange, formatShortDate, formatFullDate } from '../utils/dateUtils';

interface WeekNavigatorProps {
  year: number;
  weekNumber: number;
  vendorCount: number;
  onSelectWeek: (year: number, week: number) => void;
  onCopyFromPreviousWeek: () => void;
  canCopyFromPrevious: boolean;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  year,
  weekNumber,
  vendorCount,
  onSelectWeek,
  onCopyFromPreviousWeek,
  canCopyFromPrevious,
}) => {
  const currentWeekInfo = getISOWeekAndYear();
  const isCurrentWeek = currentWeekInfo.year === year && currentWeekInfo.week === weekNumber;

  const { startDate, endDate } = getWeekDateRange(year, weekNumber);

  const handlePrevWeek = () => {
    if (weekNumber === 1) {
      onSelectWeek(year - 1, 52);
    } else {
      onSelectWeek(year, weekNumber - 1);
    }
  };

  const handleNextWeek = () => {
    if (weekNumber >= 52) {
      onSelectWeek(year + 1, 1);
    } else {
      onSelectWeek(year, weekNumber + 1);
    }
  };

  const handleCurrentWeek = () => {
    onSelectWeek(currentWeekInfo.year, currentWeekInfo.week);
  };

  // Generate weeks array (1 to 52)
  const weeks = Array.from({ length: 52 }, (_, i) => i + 1);
  const years = [2024, 2025, 2026, 2027];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Week Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Prev Week */}
          <button
            id="prev-week-btn"
            onClick={handlePrevWeek}
            type="button"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
            title="Previous Week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Week Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select
              id="week-select"
              value={weekNumber}
              onChange={(e) => onSelectWeek(year, parseInt(e.target.value, 10))}
              className="bg-transparent font-bold text-slate-800 text-sm focus:outline-hidden cursor-pointer"
            >
              {weeks.map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
          </div>

          {/* Year Dropdown */}
          <select
            id="year-select"
            value={year}
            onChange={(e) => onSelectWeek(parseInt(e.target.value, 10), weekNumber)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 text-sm focus:outline-hidden cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Next Week */}
          <button
            id="next-week-btn"
            onClick={handleNextWeek}
            type="button"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
            title="Next Week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Jump to Current Week if not current */}
          {!isCurrentWeek && (
            <button
              id="today-week-btn"
              onClick={handleCurrentWeek}
              type="button"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Current Week ({currentWeekInfo.week})</span>
            </button>
          )}

          {isCurrentWeek && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Week
            </span>
          )}
        </div>

        {/* Center/Right: Date range text and Rollover button */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <div className="text-xs sm:text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Dates: </span>
            <span className="text-slate-700 font-medium">
              {formatShortDate(startDate)} – {formatFullDate(endDate)}
            </span>
            <span className="ml-2 text-xs text-slate-400 font-normal">
              ({vendorCount} {vendorCount === 1 ? 'vendor' : 'vendors'} registered)
            </span>
          </div>

          {/* Copy from Previous Week */}
          {canCopyFromPrevious && (
            <button
              id="copy-prev-week-vendors-btn"
              onClick={onCopyFromPreviousWeek}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
              title="Copy active vendor names & commission rates from previous week"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Rollover Last Week&apos;s Vendors</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
