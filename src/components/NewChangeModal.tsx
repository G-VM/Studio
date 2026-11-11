import React, { useState, useEffect } from 'react';
import { useChanges } from '../context/ChangeContext';
import { CHANGE_TEMPLATES } from '../data/initialData';
import { Category, RiskLevel, MaintenanceWindow, ChangeTemplate } from '../types/changeRequest';
import { X, Sparkles, AlertTriangle, Check, Clock, Laptop, Wifi, ShieldAlert, Tv, Network, Bell, Key } from 'lucide-react';

interface NewChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSiteId?: string;
  onCreated?: (changeId: string) => void;
}

export const NewChangeModal: React.FC<NewChangeModalProps> = ({
  isOpen,
  onClose,
  preselectedSiteId,
  onCreated,
}) => {
  const { sites, team, currentUser, addChange, findSiteConflicts } = useChanges();

  // Mode: log change now vs schedule upcoming
  const [isQuickLog, setIsQuickLog] = useState(true);

  // Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [siteId, setSiteId] = useState(preselectedSiteId || sites[0]?.id || '');
  const [locationDetail, setLocationDetail] = useState('');
  const [category, setCategory] = useState<Category>('Network & Wi-Fi');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [scheduledDate, setScheduledDate] = useState(todayStr);
  const [scheduledTime, setScheduledTime] = useState('17:00');
  const [assignedToId, setAssignedToId] = useState(currentUser.id);
  const [notes, setNotes] = useState('');

  // Update site if preselected changes
  useEffect(() => {
    if (preselectedSiteId) {
      setSiteId(preselectedSiteId);
    }
  }, [preselectedSiteId]);

  // Site Conflict Detection (simple non-blocking alert)
  const siteConflicts = findSiteConflicts(siteId, scheduledDate, scheduledTime);

  // Template quick-apply
  const handleApplyTemplate = (tpl: ChangeTemplate) => {
    setSelectedTemplateId(tpl.id);
    setTitle(tpl.defaultTitle);
    setCategory(tpl.category);
    setNotes(tpl.rollbackPlan ? `Rollback: ${tpl.rollbackPlan}` : '');
  };

  const handleQuickTime = (type: 'tonight' | 'tomorrow' | 'now') => {
    const today = new Date();
    if (type === 'tonight') {
      setScheduledDate(today.toISOString().split('T')[0]);
      setScheduledTime('17:00');
      setIsQuickLog(false);
    } else if (type === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(tomorrow.toISOString().split('T')[0]);
      setScheduledTime('06:00');
      setIsQuickLog(false);
    } else if (type === 'now') {
      setScheduledDate(today.toISOString().split('T')[0]);
      const nowTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
      setScheduledTime(nowTime);
      setIsQuickLog(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !siteId) return;

    const assignedMember = team.find((t) => t.id === assignedToId) || currentUser;

    const newChange = addChange({
      title: title.trim(),
      description: title.trim(),
      siteId,
      locationDetail: locationDetail.trim() || 'General Campus',
      category,
      riskLevel: 'Low',
      maintenanceWindow: isQuickLog ? 'Emergency (Immediate)' : 'After Hours (5 PM - 10 PM)',
      scheduledDate,
      scheduledTime,
      estimatedDurationMinutes: 30,
      assignedTo: assignedMember,
      requiresDowntime: false,
      impactedUsers: 'Standard maintenance window',
      rollbackPlan: notes.trim() || 'Revert to previous settings if needed',
      verificationChecks: [
        { id: 'vc-1', label: 'Verify normal operation & connectivity', checked: isQuickLog },
        { id: 'vc-2', label: 'Confirm teacher/student access test passed', checked: isQuickLog },
      ],
      quickComplete: isQuickLog,
      initialNote: notes.trim() || (isQuickLog ? 'Completed on site.' : undefined),
    });

    onClose();
    if (onCreated) {
      onCreated(newChange.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Simple Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900">
              {isQuickLog ? 'Add Change' : 'Schedule Change'}
            </h2>
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setIsQuickLog(true)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  isQuickLog ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Add Change (Now)
              </button>
              <button
                type="button"
                onClick={() => setIsQuickLog(false)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  !isQuickLog ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Scheduled Change
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Templates Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100">
          <div className="text-[11px] font-medium text-slate-500 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>Fast templates (click to auto-fill):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CHANGE_TEMPLATES.slice(0, 5).map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                  selectedTemplateId === tpl.id
                    ? 'bg-blue-600 text-white border-blue-600 font-medium'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                }`}
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Site Conflict Notice (Only if overlap exists) */}
        {siteConflicts.length > 0 && (
          <div className="px-5 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Note:</strong> {siteConflicts[0].assignedTo.name} already has a change at this campus on {scheduledDate}.
            </span>
          </div>
        )}

        {/* Fast, Clean Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              What is changing?
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Reboot core switch, Replace AP in Room 102, Push Chromebook policy"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* School & Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Site / Scope
              </label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location / Details
              </label>
              <input
                type="text"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                placeholder="e.g. Comms Room Rack 1, Central Office, or specific school area"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date, Time & Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                When
              </label>
              <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-medium">
                <button
                  type="button"
                  onClick={() => handleQuickTime('tonight')}
                  className="hover:underline"
                >
                  Tonight (5 PM)
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => handleQuickTime('tomorrow')}
                  className="hover:underline"
                >
                  Tomorrow (6 AM)
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => handleQuickTime('now')}
                  className="hover:underline"
                >
                  Right Now
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
              />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
              />
            </div>
          </div>

          {/* Assigned Tech & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technician
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                System Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Network & Wi-Fi">Network & Wi-Fi</option>
                <option value="Classroom Audio/Visual">Classroom A/V</option>
                <option value="Chromebooks & Fleet">Chromebooks & Fleet</option>
                <option value="Firewall & Security">Firewall & Security</option>
                <option value="Student SIS & Cloud">SIS & Cloud</option>
                <option value="Servers & Storage">Servers & Storage</option>
                <option value="Access Control & Cameras">Door Access & Cameras</option>
                <option value="VoIP & PA Systems">VoIP & Bell Schedules</option>
              </select>
            </div>
          </div>

          {/* Quick Note / Rollback (Optional) */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Notes or Rollback Info (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Config backup saved to TFTP; restore previous partition if switch fails"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              {isQuickLog ? 'Add Change' : 'Schedule Change'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
