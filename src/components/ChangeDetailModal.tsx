import React, { useState } from 'react';
import { useChanges } from '../context/ChangeContext';
import {
  X,
  Play,
  CheckCircle2,
  AlertOctagon,
  Clock,
  MapPin,
  User,
  Send,
  Calendar,
  RotateCcw,
  CheckSquare,
  Square,
  Trash2,
} from 'lucide-react';

interface ChangeDetailModalProps {
  changeId: string | null;
  onClose: () => void;
}

export const ChangeDetailModal: React.FC<ChangeDetailModalProps> = ({ changeId, onClose }) => {
  const {
    changes,
    getSiteById,
    startChange,
    completeChange,
    rollbackChange,
    addNote,
    toggleVerificationCheck,
    deleteChange,
  } = useChanges();

  const [noteInput, setNoteInput] = useState('');
  const [showRollbackPrompt, setShowRollbackPrompt] = useState(false);
  const [rollbackReason, setRollbackReason] = useState('');

  if (!changeId) return null;

  const change = changes.find((c) => c.id === changeId);
  if (!change) return null;

  const site = getSiteById(change.siteId);

  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteInput.trim()) {
      addNote(change.id, noteInput.trim(), 'note');
      setNoteInput('');
    }
  };

  const handleConfirmRollback = () => {
    if (rollbackReason.trim()) {
      rollbackChange(change.id, rollbackReason.trim());
      setShowRollbackPrompt(false);
      setRollbackReason('');
    }
  };

  const handleDelete = () => {
    if (confirm(`Delete change ${change.id}?`)) {
      deleteChange(change.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Simple Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-mono font-bold text-slate-700">{change.id}</span>
              <span>·</span>
              <span className="font-semibold text-slate-800">{site?.name}</span>
              <span>·</span>
              <span>{change.category}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">
              {change.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Toolbar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {change.status === 'Scheduled' && (
              <button
                onClick={() => completeChange(change.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Completed</span>
              </button>
            )}

            {(change.status === 'Completed' || change.status === 'In Progress') && (
              <>
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Completed
                </span>
                <button
                  onClick={() => setShowRollbackPrompt(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors ml-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Revert / Rollback</span>
                </button>
              </>
            )}

            {change.status === 'Rolled Back' && (
              <span className="text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                Rolled Back
              </span>
            )}
          </div>

          <button
            onClick={handleDelete}
            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
            title="Delete this change"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[calc(80vh-120px)] overflow-y-auto space-y-4">
          
          {/* Rollback Prompt if triggered */}
          {showRollbackPrompt && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-2 text-xs">
              <span className="font-semibold text-rose-900 block">State reason for rollback:</span>
              <input
                type="text"
                autoFocus
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                placeholder="e.g. Firmware crashed, restored previous image from TFTP"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowRollbackPrompt(false)}
                  className="px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRollback}
                  disabled={!rollbackReason.trim()}
                  className="px-3 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded disabled:opacity-50"
                >
                  Confirm Rollback
                </button>
              </div>
            </div>
          )}

          {/* Quick Context Details */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg text-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Location</span>
              <span className="font-medium text-slate-800">{change.locationDetail || 'Campus wide'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Scheduled Time</span>
              <span className="font-medium text-slate-800 tabular-nums">
                {change.scheduledDate} at {change.scheduledTime}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Lead Tech</span>
              <span className="font-medium text-slate-800">{change.assignedTo.name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Status</span>
              <span className="font-medium text-slate-800">{change.status}</span>
            </div>
          </div>

          {/* Rollback note */}
          {change.rollbackPlan && (
            <div className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded border border-slate-150">
              <span className="font-semibold text-slate-700 block mb-0.5">Rollback / Fallback:</span>
              <span>{change.rollbackPlan}</span>
            </div>
          )}

          {/* Verification Checklist */}
          {change.verificationChecks.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-800 block mb-1.5">
                Quick Verification
              </span>
              <div className="space-y-1">
                {change.verificationChecks.map((check) => (
                  <button
                    key={check.id}
                    onClick={() => toggleVerificationCheck(change.id, check.id)}
                    className="w-full flex items-center gap-2 p-2 rounded text-left text-xs bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    {check.checked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={check.checked ? 'line-through text-slate-400' : 'text-slate-700'}>
                      {check.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tech Log & Field Notes */}
          <div>
            <span className="text-xs font-semibold text-slate-800 block mb-1.5">
              Team Field Notes
            </span>

            <form onSubmit={handlePostNote} className="flex gap-2 mb-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Post a quick field update..."
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!noteInput.trim()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors shrink-0"
              >
                Post
              </button>
            </form>

            <div className="space-y-1.5">
              {change.notes.map((note) => (
                <div key={note.id} className="p-2 rounded bg-slate-50 text-xs text-slate-700">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span className="font-semibold text-slate-600">{note.authorName}</span>
                    <span className="tabular-nums font-mono">{note.timestamp}</span>
                  </div>
                  <p>{note.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Simple Footer */}
        <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
