import React, { useState, useMemo } from 'react';
import { useChanges } from '../context/ChangeContext';
import { Mail, Copy, Check, ExternalLink, X, Calendar, ArrowRight } from 'lucide-react';

interface DailyDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export const DailyDigestModal: React.FC<DailyDigestModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = 'gavinbarkley@gmail.com',
}) => {
  const { changes, getSiteById } = useChanges();
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [copied, setCopied] = useState(false);

  // Compute yesterday and today dates
  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split('T')[0];

  const yesterdayObj = new Date(todayObj);
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(yesterdayStr);

  // Filter changes for the selected date
  const dayChanges = useMemo(() => {
    return changes.filter((c) => c.scheduledDate === selectedDate);
  }, [changes, selectedDate]);

  // Format human date
  const formattedDate = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [selectedDate]);

  // Build the email body text
  const emailSubject = `Minster Trust IT Change Digest - ${selectedDate === yesterdayStr ? "Yesterday's Changes" : formattedDate}`;

  const emailBody = useMemo(() => {
    const lines: string[] = [
      `Minster Trust for Education (MITRE) IT Change Digest`,
      `Report Date: ${formattedDate} (${selectedDate === yesterdayStr ? 'Yesterday' : selectedDate === todayStr ? 'Today' : 'Historical'})`,
      `Total Changes Recorded: ${dayChanges.length}`,
      `--------------------------------------------------`,
      '',
    ];

    if (dayChanges.length === 0) {
      lines.push('No IT change requests were recorded for this day.');
    } else {
      dayChanges.forEach((c, index) => {
        const site = getSiteById(c.siteId);
        lines.push(`${index + 1}. [${c.id}] ${c.title}`);
        lines.push(`   Status: ${c.status}`);
        lines.push(`   School / Site: ${site?.name || 'Trust-Wide'}`);
        lines.push(`   Location: ${c.locationDetail}`);
        lines.push(`   Category: ${c.category} (Risk: ${c.riskLevel})`);
        lines.push(`   Execution Time: ${c.scheduledTime} (${c.maintenanceWindow})`);
        lines.push(`   Assigned Tech: ${c.assignedTo.name}`);
        if (c.requiresDowntime) {
          lines.push(`   Downtime: ~${c.estimatedDowntimeMinutes} min`);
        }
        if (c.rollbackPlan) {
          lines.push(`   Rollback Plan: ${c.rollbackPlan}`);
        }
        if (c.notes.length > 0) {
          lines.push(`   Latest Field Note: ${c.notes[0].authorName}: "${c.notes[0].text}"`);
        }
        lines.push('');
      });
    }

    lines.push('--------------------------------------------------');
    lines.push('Generated automatically by EduChange IT');
    lines.push('Minster Trust for Education IT Services');
    return lines.join('\n');
  }, [dayChanges, formattedDate, selectedDate, yesterdayStr, todayStr, getSiteById]);

  // Construct mailto link
  const mailtoHref = useMemo(() => {
    const encodedSubject = encodeURIComponent(emailSubject);
    const encodedBody = encodeURIComponent(emailBody);
    return `mailto:${recipientEmail}?subject=${encodedSubject}&body=${encodedBody}`;
  }, [recipientEmail, emailSubject, emailBody]);

  const handleCopy = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Email Daily Change Digest</h2>
              <p className="text-xs text-slate-500">
                Summary of changes recorded on the previous day
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

        {/* Date Selector Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Report Date:</span>
            <div className="flex items-center p-0.5 bg-slate-200/80 rounded-md">
              <button
                type="button"
                onClick={() => setSelectedDate(yesterdayStr)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  selectedDate === yesterdayStr ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  selectedDate === todayStr ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Today
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded bg-white tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Recipient Input */}
        <div className="px-5 py-3 border-b border-slate-100 bg-white">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Recipient Email
          </label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="e.g. gavinbarkley@gmail.com"
            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Preview of Email Content */}
        <div className="p-5 max-h-[260px] overflow-y-auto space-y-2 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium text-slate-700">Preview ({dayChanges.length} changes found):</span>
            <button
              onClick={handleCopy}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
            </button>
          </div>

          <pre className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
            {emailBody}
          </pre>
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <a
              href={mailtoHref}
              onClick={() => {
                setTimeout(onClose, 500);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Send in Email Client</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
