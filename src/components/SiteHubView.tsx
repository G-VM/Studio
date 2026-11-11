import React, { useState } from 'react';
import { useChanges } from '../context/ChangeContext';
import { Site } from '../types/changeRequest';
import {
  MapPin,
  Plus,
  Building2,
  ChevronRight,
  Globe,
  Radio,
  School,
  GraduationCap,
  BookOpen,
} from 'lucide-react';

interface SiteHubViewProps {
  onSelectChange: (changeId: string) => void;
  onOpenNewModalWithSite: (siteId: string) => void;
  onFilterBySite: (siteId: string) => void;
}

export const SiteHubView: React.FC<SiteHubViewProps> = ({
  onSelectChange,
  onOpenNewModalWithSite,
  onFilterBySite,
}) => {
  const { sites, changes } = useChanges();
  const [filterType, setFilterType] = useState<string>('all');

  const filteredSites = sites.filter((s) => {
    if (filterType === 'all') return true;
    if (filterType === 'trust-central') return s.type === 'Trust-Wide' || s.type === 'Central Office';
    if (filterType === 'secondary') return s.type === 'Secondary Academy';
    if (filterType === 'primary') return s.type === 'Primary School';
    if (filterType === 'infant') return s.type === 'Infant / Junior';
    return true;
  });

  const getSiteIcon = (type: string) => {
    switch (type) {
      case 'Trust-Wide':
        return <Globe className="w-4 h-4 text-purple-600" />;
      case 'Central Office':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'Secondary Academy':
        return <GraduationCap className="w-4 h-4 text-indigo-600" />;
      case 'Primary School':
        return <School className="w-4 h-4 text-emerald-600" />;
      case 'Infant / Junior':
        return <BookOpen className="w-4 h-4 text-amber-600" />;
      default:
        return <MapPin className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Site Hub Intro & Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Schools, Trust-Wide & Central Office</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active IT maintenance and systems across all 14 academies, primary schools, and trust infrastructure
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto overflow-x-auto text-xs font-medium">
          {[
            { id: 'all', label: 'All (16)' },
            { id: 'trust-central', label: 'Trust-Wide & Central' },
            { id: 'secondary', label: 'Secondary' },
            { id: 'primary', label: 'Primary' },
            { id: 'infant', label: 'Infant & Junior' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filterType === tab.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSites.map((site) => {
          const siteChanges = changes.filter((c) => c.siteId === site.id);
          const scheduled = siteChanges.filter((c) => c.status === 'Scheduled');
          const completed = siteChanges.filter((c) => c.status === 'Completed' || c.status === 'In Progress');
          const isTrustWide = site.type === 'Trust-Wide';

          return (
            <div
              key={site.id}
              className={`bg-white rounded-xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                isTrustWide
                  ? 'border-purple-300 ring-1 ring-purple-100'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Site Card Header */}
              <div className={`p-4 border-b border-slate-100 ${isTrustWide ? 'bg-purple-50/40' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                      {getSiteIcon(site.type)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{site.name}</span>
                        <span className="font-mono text-[11px] font-normal text-slate-400 tabular-nums">
                          ({site.code})
                        </span>
                      </h3>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>{site.type}</span>
                        {site.studentCount && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{site.studentCount.toLocaleString()} pupils</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{site.location}</span>
                </div>
              </div>

              {/* Site Body: Recent & Upcoming Changes */}
              <div className="p-4 space-y-2.5 flex-1 text-xs">
                {/* Upcoming Scheduled */}
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Upcoming Maintenance ({scheduled.length})</span>
                    {scheduled.length > 1 && (
                      <span className="text-amber-600 font-medium">Multiple scheduled</span>
                    )}
                  </div>

                  {scheduled.length === 0 ? (
                    <div className="text-slate-400 italic text-[11px] py-0.5">
                      No upcoming changes scheduled
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {scheduled.slice(0, 2).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => onSelectChange(c.id)}
                          className="w-full p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-medium text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                              {c.title}
                            </div>
                            <div className="text-[10px] text-slate-500 tabular-nums">
                              {c.scheduledDate} at {c.scheduledTime} · {c.assignedTo.name}
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Completed */}
                {completed.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                    <span className="truncate max-w-[190px]">Completed: {completed[0].title}</span>
                    <span className="text-slate-400 shrink-0 tabular-nums">{completed[0].scheduledDate}</span>
                  </div>
                )}
              </div>

              {/* Site Card Footer Actions */}
              <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => onFilterBySite(site.id)}
                  className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                >
                  View all ({siteChanges.length})
                </button>

                <button
                  onClick={() => onOpenNewModalWithSite(site.id)}
                  className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isTrustWide ? 'New Trust-Wide' : 'Add Change'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
