import React, { useMemo, useState } from 'react';
import { useChanges } from '../context/ChangeContext';
import { ChangeRequest } from '../types/changeRequest';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  Plus,
  ChevronRight,
  ShieldAlert,
  Play,
  CheckCircle2,
} from 'lucide-react';

interface ScheduleTimelineViewProps {
  onSelectChange: (changeId: string) => void;
  onOpenNewModal: () => void;
}

export const ScheduleTimelineView: React.FC<ScheduleTimelineViewProps> = ({
  onSelectChange,
  onOpenNewModal,
}) => {
  const { changes, getSiteById } = useChanges();
  const [selectedWindowFilter, setSelectedWindowFilter] = useState<string>('all');

  // Group changes by scheduledDate
  const groupedByDate = useMemo(() => {
    // Filter active or scheduled or recently completed
    const list = changes.filter((c) => {
      if (selectedWindowFilter === 'all') return true;
      return c.maintenanceWindow === selectedWindowFilter;
    });

    const groups: { [date: string]: ChangeRequest[] } = {};

    list.forEach((c) => {
      if (!groups[c.scheduledDate]) {
        groups[c.scheduledDate] = [];
      }
      groups[c.scheduledDate].push(c);
    });

    // Sort dates
    const sortedDates = Object.keys(groups).sort();
    return sortedDates.map((date) => ({
      date,
      items: groups[date].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)),
    }));
  }, [changes, selectedWindowFilter]);

  const formatDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const d = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = d.toLocaleDateString(undefined, { weekday: 'long' });
    const formatted = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    if (dateStr === today) {
      return { relative: 'Today', date: formatted, dayOfWeek, isToday: true };
    }
    if (dateStr === tomorrowStr) {
      return { relative: 'Tomorrow', date: formatted, dayOfWeek, isToday: false };
    }
    return { relative: dayOfWeek, date: formatted, dayOfWeek, isToday: false };
  };

  return (
    <div className="space-y-6">
      {/* Schedule Header & Window Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">District Maintenance Windows & Schedule</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Planned change timeline organized by school maintenance windows to prevent classroom disruption
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedWindowFilter}
            onChange={(e) => setSelectedWindowFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
          >
            <option value="all">All Maintenance Windows</option>
            <option value="After Hours (5 PM - 10 PM)">After Hours (5 PM - 10 PM)</option>
            <option value="Early Morning (5 AM - 7 AM)">Early Morning (5 AM - 7 AM)</option>
            <option value="Weekend Window">Weekend Window</option>
            <option value="During School (Non-Disruptive)">During School (Non-Disruptive)</option>
            <option value="School Break / In-Service">School Break / In-Service</option>
          </select>

          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Change</span>
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      {groupedByDate.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No scheduled changes found for this window</h3>
          <p className="text-xs text-slate-500 mt-1">Try switching to all maintenance windows.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map(({ date, items }) => {
            const dateMeta = formatDateLabel(date);

            // Check if multiple items at the same site on this date (overlap check)
            const siteCounts: { [siteId: string]: number } = {};
            items.forEach((it) => {
              siteCounts[it.siteId] = (siteCounts[it.siteId] || 0) + 1;
            });
            const hasMultipleOnSameSite = Object.values(siteCounts).some((c) => c > 1);

            return (
              <div key={date} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                {/* Date Header */}
                <div className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${
                  dateMeta.isToday ? 'bg-blue-50/70 border-blue-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      dateMeta.isToday ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {dateMeta.relative}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 tabular-nums">
                      {dateMeta.date} ({dateMeta.dayOfWeek})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {hasMultipleOnSameSite && (
                      <span className="flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Multiple changes at same campus today</span>
                      </span>
                    )}
                    <span className="text-slate-500 tabular-nums">{items.length} {items.length === 1 ? 'change' : 'changes'}</span>
                  </div>
                </div>

                {/* Items in this date */}
                <div className="divide-y divide-slate-100">
                  {items.map((change) => {
                    const site = getSiteById(change.siteId);

                    return (
                      <div
                        key={change.id}
                        onClick={() => onSelectChange(change.id)}
                        className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        {/* Time & Title info */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Time block */}
                          <div className="w-20 shrink-0 text-left">
                            <span className="font-mono text-xs font-bold text-slate-900 tabular-nums block">
                              {change.scheduledTime}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              ~{change.estimatedDurationMinutes}m
                            </span>
                          </div>

                          {/* Content */}
                          <div className="space-y-1 min-w-0 flex-1">
                            {/* Unboxed metadata */}
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className="font-mono font-semibold text-slate-700 tabular-nums">{change.id}</span>
                              <span aria-hidden="true" className="text-slate-300">·</span>
                              <span className="font-medium text-slate-800">{site?.name || 'District Site'}</span>
                              <span aria-hidden="true" className="text-slate-300">·</span>
                              <span>{change.category}</span>
                              <span aria-hidden="true" className="text-slate-300">·</span>
                              <span>{change.maintenanceWindow}</span>
                            </div>

                            <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {change.title}
                            </h4>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className="truncate max-w-[220px]">{change.locationDetail}</span>
                              <span aria-hidden="true" className="text-slate-300">·</span>
                              <span>Assigned: <strong className="font-medium text-slate-700">{change.assignedTo.name}</strong></span>
                              {change.requiresDowntime && (
                                <>
                                  <span aria-hidden="true" className="text-slate-300">·</span>
                                  <span className="text-amber-700 font-medium tabular-nums">Downtime ~{change.estimatedDowntimeMinutes}m</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status & chevron */}
                        <div className="flex items-center gap-3 shrink-0 sm:self-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            change.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-800'
                              : change.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : change.status === 'Rolled Back'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {change.status}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
