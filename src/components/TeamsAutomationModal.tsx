import React, { useState, useEffect, useMemo } from 'react';
import { useChanges } from '../context/ChangeContext';
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  Clock,
  Calendar,
  AlertCircle,
  HelpCircle,
  X,
  Settings,
  Bell,
  CheckCircle2,
} from 'lucide-react';

interface TeamsAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEAMS_WEBHOOK_KEY = 'mitre_teams_webhook_url';
const TEAMS_AUTO_TIME_KEY = 'mitre_teams_auto_time';
const TEAMS_ENABLED_KEY = 'mitre_teams_auto_enabled';
const TEAMS_LAST_SENT_KEY = 'mitre_teams_last_sent_date';

export const TeamsAutomationModal: React.FC<TeamsAutomationModalProps> = ({ isOpen, onClose }) => {
  const { changes, getSiteById } = useChanges();

  // Settings state
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem(TEAMS_WEBHOOK_KEY) || '';
  });
  const [dispatchTime, setDispatchTime] = useState(() => {
    return localStorage.getItem(TEAMS_AUTO_TIME_KEY) || '07:30';
  });
  const [isEnabled, setIsEnabled] = useState(() => {
    return localStorage.getItem(TEAMS_ENABLED_KEY) === 'true';
  });
  const [lastSentDate, setLastSentDate] = useState(() => {
    return localStorage.getItem(TEAMS_LAST_SENT_KEY) || '';
  });

  // UI state
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Dates
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const [targetDate, setTargetDate] = useState<string>(yesterdayStr);

  // Changes for target date
  const selectedChanges = useMemo(() => {
    return changes.filter((c) => c.scheduledDate === targetDate);
  }, [changes, targetDate]);

  // Formatted date label
  const formattedDate = useMemo(() => {
    const d = new Date(targetDate + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [targetDate]);

  // Save settings
  const handleSaveSettings = () => {
    localStorage.setItem(TEAMS_WEBHOOK_KEY, webhookUrl.trim());
    localStorage.setItem(TEAMS_AUTO_TIME_KEY, dispatchTime);
    localStorage.setItem(TEAMS_ENABLED_KEY, String(isEnabled));
    setStatusMessage({ type: 'success', text: 'Teams automation settings saved.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Build Teams MessageCard payload
  const teamsPayload = useMemo(() => {
    const facts = [
      { name: 'Report Date', value: `${formattedDate} (${targetDate === yesterdayStr ? 'Yesterday' : 'Historical'})` },
      { name: 'Total Changes', value: `${selectedChanges.length}` },
      { name: 'Completed', value: `${selectedChanges.filter((c) => c.status === 'Completed').length}` },
      { name: 'In Progress', value: `${selectedChanges.filter((c) => c.status === 'In Progress').length}` },
    ];

    const changeSections = selectedChanges.map((c) => {
      const site = getSiteById(c.siteId);
      return {
        activityTitle: `**${c.title}** (${c.id})`,
        activitySubtitle: `${site?.name || 'Trust-Wide'} · ${c.locationDetail}`,
        facts: [
          { name: 'Status', value: c.status },
          { name: 'Category', value: c.category },
          { name: 'Time', value: `${c.scheduledTime} (${c.maintenanceWindow})` },
          { name: 'Tech', value: c.assignedTo.name },
          ...(c.requiresDowntime ? [{ name: 'Downtime', value: `~${c.estimatedDowntimeMinutes}m` }] : []),
          ...(c.rollbackPlan ? [{ name: 'Rollback', value: c.rollbackPlan }] : []),
          ...(c.notes.length > 0 ? [{ name: 'Latest Note', value: c.notes[0].text }] : []),
        ],
        markdown: true,
      };
    });

    return {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: '0078D4', // Microsoft Teams Blue
      summary: `Minster Trust IT Change Digest - ${targetDate === yesterdayStr ? "Yesterday's Changes" : formattedDate}`,
      sections: [
        {
          activityTitle: '🏫 **Minster Trust for Education — Daily IT Change Digest**',
          activitySubtitle: `Daily summary of changes from ${targetDate === yesterdayStr ? 'yesterday' : formattedDate}`,
          facts,
          markdown: true,
        },
        ...changeSections,
      ],
    };
  }, [selectedChanges, formattedDate, targetDate, yesterdayStr, getSiteById]);

  // Build Markdown text representation (for clipboard copy into Teams)
  const markdownText = useMemo(() => {
    const lines: string[] = [
      `### 🏫 Minster Trust for Education — IT Change Digest`,
      `**Date:** ${formattedDate} (${targetDate === yesterdayStr ? 'Yesterday' : 'Historical'})`,
      `**Total Changes:** ${selectedChanges.length}`,
      '',
    ];

    if (selectedChanges.length === 0) {
      lines.push('*No change requests were scheduled or completed on this day.*');
    } else {
      selectedChanges.forEach((c, idx) => {
        const site = getSiteById(c.siteId);
        lines.push(`**${idx + 1}. [${c.id}] ${c.title}**`);
        lines.push(`* **Status:** ${c.status}`);
        lines.push(`* **School / Site:** ${site?.name || 'Trust-Wide'} (${c.locationDetail})`);
        lines.push(`* **Category:** ${c.category} · **Tech:** ${c.assignedTo.name}`);
        lines.push(`* **Time:** ${c.scheduledTime} (${c.maintenanceWindow})`);
        if (c.rollbackPlan) lines.push(`* **Rollback:** ${c.rollbackPlan}`);
        if (c.notes.length > 0) lines.push(`* **Note:** "${c.notes[0].text}"`);
        lines.push('');
      });
    }

    lines.push('---');
    lines.push('*Minster Trust for Education IT Automated Change Tracker*');
    return lines.join('\n');
  }, [selectedChanges, formattedDate, targetDate, yesterdayStr, getSiteById]);

  // Trigger Send to Teams
  const handleSendToTeams = async () => {
    if (!webhookUrl.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please paste your Microsoft Teams Webhook URL below first.',
      });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      // Send directly to Teams webhook
      await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors', // Teams incoming webhooks accept POST with no-cors or standard CORS
        body: JSON.stringify(teamsPayload),
      });

      // Mark as sent
      localStorage.setItem(TEAMS_LAST_SENT_KEY, todayStr);
      setLastSentDate(todayStr);

      setStatusMessage({
        type: 'success',
        text: `Message dispatched to Microsoft Teams for ${selectedChanges.length} changes!`,
      });
    } catch (err: any) {
      console.error('Failed to dispatch to Teams', err);
      setStatusMessage({
        type: 'error',
        text: 'Failed to dispatch to Teams webhook. Please check the URL or use "Copy for Teams" to paste.',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Copy to clipboard
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Auto morning scheduler effect
  useEffect(() => {
    if (!isEnabled || !webhookUrl.trim()) return;

    const checkMorningSchedule = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMins}`;
      const storedLastDate = localStorage.getItem(TEAMS_LAST_SENT_KEY);

      // If scheduled time has arrived today and we haven't sent today's digest yet
      if (currentTime >= dispatchTime && storedLastDate !== todayStr) {
        handleSendToTeams();
      }
    };

    const interval = setInterval(checkMorningSchedule, 60000);
    return () => clearInterval(interval);
  }, [isEnabled, webhookUrl, dispatchTime, todayStr]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Microsoft Teams Morning Digest</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Daily Automation
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Automate sending yesterday's changes directly into your Teams chat or channel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`px-5 py-2.5 text-xs flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-b border-rose-200'
            }`}
          >
            <span className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs opacity-70 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 max-h-[calc(85vh-140px)] overflow-y-auto space-y-4">
          
          {/* Section 1: Teams Webhook Configuration */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                Teams Webhook & Schedule
              </span>
              <button
                type="button"
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showSetupGuide ? 'Hide instructions' : 'How to get a Teams Webhook URL'}</span>
              </button>
            </div>

            {/* Quick Setup Instructions Accordion */}
            {showSetupGuide && (
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs text-indigo-950 space-y-1.5 leading-relaxed">
                <span className="font-semibold block text-indigo-900">How to get your Webhook in Microsoft Teams (60 seconds):</span>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-indigo-900">
                  <li>In Microsoft Teams, go to your <strong>IT Team Channel</strong> or chat.</li>
                  <li>Click the <strong>••• (More options)</strong> next to the channel name and select <strong>Workflows</strong> (or <em>Connectors</em>).</li>
                  <li>Search for <strong>"Post to a channel when a webhook request is received"</strong>.</li>
                  <li>Click <strong>Next</strong>, give it a name (e.g. <em>IT Change Digest</em>), and copy the generated URL.</li>
                  <li>Paste the URL into the box below and click <strong>Save</strong>!</li>
                </ol>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teams Webhook URL (Power Automate or Incoming Webhook)
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://mitretrust.webhook.office.com/webhookb2/... or Power Automate URL"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Morning Trigger Time</span>
                </label>
                <input
                  type="time"
                  value={dispatchTime}
                  onChange={(e) => setDispatchTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 tabular-nums bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-slate-400" />
                  <span>Automated Morning Dispatch</span>
                </label>
                <label className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-800">
                    {isEnabled ? 'Active (Sends every morning)' : 'Disabled'}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
              >
                Save Settings
              </button>
            </div>
          </div>

          {/* Section 2: Preview & Immediate Trigger */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900">Digest Date:</span>
                <div className="flex items-center p-0.5 bg-slate-100 rounded-md text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setTargetDate(yesterdayStr)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      targetDate === yesterdayStr ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetDate(todayStr)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      targetDate === todayStr ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    Today
                  </button>
                </div>
              </div>

              <span className="text-xs text-slate-500">
                Found <strong className="text-slate-800 tabular-nums">{selectedChanges.length}</strong> changes
              </span>
            </div>

            {/* Formatted Markdown Preview */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Teams Message Preview:</span>
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Markdown!' : 'Copy Text'}</span>
                </button>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-2 max-h-[220px] overflow-y-auto">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>🏫 Minster Trust for Education — IT Change Digest</span>
                  <span className="text-[10px] text-slate-400 font-normal">({formattedDate})</span>
                </div>

                {selectedChanges.length === 0 ? (
                  <p className="text-slate-400 italic text-xs py-2">
                    No change requests were logged for this day.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {selectedChanges.map((c, i) => {
                      const site = getSiteById(c.siteId);
                      return (
                        <div key={c.id} className="py-2 first:pt-0 last:pb-0 space-y-0.5">
                          <div className="font-semibold text-slate-800">
                            {i + 1}. [{c.id}] {c.title}
                          </div>
                          <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-2">
                            <span>Status: <strong>{c.status}</strong></span>
                            <span>·</span>
                            <span>Site: {site?.name}</span>
                            <span>·</span>
                            <span>Tech: {c.assignedTo.name}</span>
                          </div>
                          {c.notes.length > 0 && (
                            <div className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded mt-1">
                              Note: "{c.notes[0].text}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied!' : 'Copy for Teams Chat'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSendToTeams}
              disabled={isSending}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending to Teams...' : 'Send to Teams Now'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
