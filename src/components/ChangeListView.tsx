import React, { useState, useMemo } from 'react';
import { useChanges } from '../context/ChangeContext';
import { ChangeRequest, ChangeStatus } from '../types/changeRequest';
import {
  Search,
  Clock,
  Play,
  CheckCircle2,
  Calendar,
  MapPin,
  User,
  Plus,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

interface ChangeListViewProps {
  onSelectChange: (changeId: string) => void;
  onOpenNewModal: (siteId?: string) => void;
  initialSiteFilter?: string;
}

export const ChangeListView: React.FC<ChangeListViewProps> = ({
  onSelectChange,
  onOpenNewModal,
  initialSiteFilter,
}) => {
  const { changes, sites, getSiteById, startChange, completeChange } = useChanges();

  // Simple Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteFilter || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Filter logic
  const filteredChanges = useMemo(() => {
    return changes.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const site = getSiteById(c.siteId);
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchId = c.id.toLowerCase().includes(q);
        const matchTech = c.assignedTo.name.toLowerCase().includes(q);
        const matchSite = site ? site.name.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchId && !matchTech && !matchSite) {
          return false;
        }
      }

      if (selectedSiteId !== 'all' && c.siteId !== selectedSiteId) {
        return false;
      }

      if (selectedStatus === 'scheduled' && c.status !== 'Scheduled') return false;

      return true;
    });
  }, [changes, searchQuery, selectedSiteId, selectedStatus, getSiteById]);

  // Counts
  const scheduledCount = changes.filter((c) => c.status === 'Scheduled').length;

  return (
    <div className="space-y-4">
      {/* Streamlined Controls Row */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                selectedStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Changes <span className="tabular-nums text-slate-400">({changes.length})</span>
            </button>

            <button
              onClick={() => setSelectedStatus('scheduled')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                selectedStatus === 'scheduled'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scheduled <span className="tabular-nums text-slate-400">({scheduledCount})</span>
            </button>
          </div>
        </div>

        {/* Search & Site Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search changes or techs..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 max-w-[170px]"
          >
            <option value="all">All Sites & Scopes</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Change Requests List */}
      {filteredChanges.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-slate-200">
          <Clock className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No changes found</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting your search or filter.</p>
          <button
            onClick={() => onOpenNewModal()}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Change</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
          {filteredChanges.map((change) => {
            const site = getSiteById(change.siteId);

            return (
              <div
                key={change.id}
                onClick={() => onSelectChange(change.id)}
                className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Main Info */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    {change.status === 'Scheduled' && (
                      <span className="px-2 py-0.5 text-[11px] font-medium text-slate-600 bg-slate-100 rounded">
                        Scheduled
                      </span>
                    )}
                    {(change.status === 'Completed' || change.status === 'In Progress') && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 rounded">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Completed
                      </span>
                    )}
                    {change.status === 'Rolled Back' && (
                      <span className="px-2 py-0.5 text-[11px] font-semibold text-rose-700 bg-rose-50 rounded">
                        Reverted
                      </span>
                    )}

                    {/* Site name */}
                    <span className="text-xs font-semibold text-slate-800">
                      {site?.name || 'District Site'}
                    </span>

                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">{change.category}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {change.title}
                  </h3>

                  {/* Clean unboxed secondary text */}
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                    <span className="tabular-nums font-mono text-[11px] text-slate-400">{change.id}</span>
                    <span>·</span>
                    <span>{change.locationDetail}</span>
                    <span>·</span>
                    <span className="tabular-nums">{change.scheduledDate} at {change.scheduledTime}</span>
                    <span>·</span>
                    <span>Tech: {change.assignedTo.name}</span>
                  </div>
                </div>

                {/* Inline Action Buttons */}
                <div
                  className="flex items-center gap-2 shrink-0 sm:self-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {change.status === 'Scheduled' && (
                    <button
                      onClick={() => completeChange(change.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Completed</span>
                    </button>
                  )}

                  <button
                    onClick={() => onSelectChange(change.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    title="View details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
