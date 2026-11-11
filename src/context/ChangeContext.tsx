import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChangeRequest, Site, TeamMember, ChangeStatus } from '../types/changeRequest';
import { INITIAL_CHANGES, INITIAL_SITES, INITIAL_TEAM } from '../data/initialData';

interface ChangeContextType {
  changes: ChangeRequest[];
  sites: Site[];
  team: TeamMember[];
  currentUser: TeamMember;
  setCurrentUser: (member: TeamMember) => void;
  addChange: (data: Partial<ChangeRequest> & { quickComplete?: boolean; initialNote?: string }) => ChangeRequest;
  updateChange: (id: string, updates: Partial<ChangeRequest>) => void;
  deleteChange: (id: string) => void;
  addNote: (changeId: string, text: string, type?: 'update' | 'rollback' | 'verification' | 'note') => void;
  toggleVerificationCheck: (changeId: string, checkId: string) => void;
  startChange: (changeId: string) => void;
  completeChange: (changeId: string, summaryNote?: string) => void;
  rollbackChange: (changeId: string, reason: string) => void;
  resetToSampleData: () => void;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;
  getSiteById: (siteId: string) => Site | undefined;
  findSiteConflicts: (siteId: string, date: string, time: string, excludeId?: string) => ChangeRequest[];
}

const STORAGE_KEY = 'mitre_change_records_v5';
const USER_KEY = 'mitre_current_user_v5';
const SITES_KEY = 'mitre_sites_v5';

const ChangeContext = createContext<ChangeContextType | undefined>(undefined);

export const ChangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [changes, setChanges] = useState<ChangeRequest[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse stored changes', e);
    }
    return INITIAL_CHANGES;
  });

  const [sites] = useState<Site[]>(() => {
    try {
      const stored = localStorage.getItem(SITES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse stored sites', e);
    }
    return INITIAL_SITES;
  });

  const [team] = useState<TeamMember[]>(INITIAL_TEAM);

  const [currentUser, setCurrentUser] = useState<TeamMember>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        const found = INITIAL_TEAM.find((u) => u.id === stored);
        if (found) return found;
      }
    } catch (e) {
      console.error('Failed to read user', e);
    }
    return INITIAL_TEAM[0]; // Gavin Barkley by default
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(changes));
    } catch (e) {
      console.error('Failed to save changes to storage', e);
    }
  }, [changes]);

  useEffect(() => {
    try {
      localStorage.setItem(USER_KEY, currentUser.id);
    } catch (e) {
      console.error('Failed to save current user', e);
    }
  }, [currentUser]);

  const getSiteById = (siteId: string): Site | undefined => {
    return sites.find((s) => s.id === siteId);
  };

  const findSiteConflicts = (siteId: string, date: string, time: string, excludeId?: string): ChangeRequest[] => {
    if (!siteId || !date) return [];
    
    return changes.filter((c) => {
      if (c.id === excludeId) return false;
      if (c.siteId !== siteId) return false;
      if (c.scheduledDate !== date) return false;
      if (c.status === 'Completed' || c.status === 'Canceled') return false;

      // Check within same date (if time available, check approx window)
      return true;
    });
  };

  const addChange = (data: Partial<ChangeRequest> & { quickComplete?: boolean; initialNote?: string }): ChangeRequest => {
    const nextNum = changes.length + 1052;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newId = `CR-${nextNum}`;
    const isQuick = data.quickComplete || false;
    const initialStatus: ChangeStatus = isQuick ? 'Completed' : (data.status || 'Scheduled');

    const createdChange: ChangeRequest = {
      id: newId,
      title: data.title || 'Untitled Change Request',
      description: data.description || '',
      siteId: data.siteId || sites[0].id,
      locationDetail: data.locationDetail || 'Main Campus',
      category: data.category || 'Network & Wi-Fi',
      riskLevel: data.riskLevel || 'Low',
      status: initialStatus,
      maintenanceWindow: data.maintenanceWindow || 'After Hours (5 PM - 10 PM)',
      scheduledDate: data.scheduledDate || now.toISOString().split('T')[0],
      scheduledTime: data.scheduledTime || timeStr,
      estimatedDurationMinutes: data.estimatedDurationMinutes || 30,
      assignedTo: data.assignedTo || currentUser,
      peerReviewerName: data.peerReviewerName || undefined,
      requiresDowntime: data.requiresDowntime || false,
      estimatedDowntimeMinutes: data.estimatedDowntimeMinutes || 0,
      impactedUsers: data.impactedUsers || 'None / Minimal expected',
      rollbackPlan: data.rollbackPlan || 'Revert settings to previous snapshot.',
      verificationChecks: data.verificationChecks || [
        { id: 'vc-1', label: 'Verify basic network and power connectivity', checked: isQuick },
        { id: 'vc-2', label: 'Confirm normal end-user service operation', checked: isQuick },
      ],
      actualStartTime: isQuick ? timeStr : undefined,
      actualEndTime: isQuick ? timeStr : undefined,
      notes: data.initialNote
        ? [
            {
              id: `note-${Date.now()}`,
              authorName: currentUser.name,
              authorRole: currentUser.role,
              timestamp: timeStr,
              text: data.initialNote,
              type: isQuick ? 'verification' : 'note',
            },
          ]
        : [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      isQuickChange: isQuick,
    };

    setChanges((prev) => [createdChange, ...prev]);
    return createdChange;
  };

  const updateChange = (id: string, updates: Partial<ChangeRequest>) => {
    setChanges((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const deleteChange = (id: string) => {
    setChanges((prev) => prev.filter((c) => c.id !== id));
  };

  const addNote = (changeId: string, text: string, type: 'update' | 'rollback' | 'verification' | 'note' = 'note') => {
    if (!text.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newNote = {
      id: `note-${Date.now()}`,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      timestamp: timeStr,
      text: text.trim(),
      type,
    };

    setChanges((prev) =>
      prev.map((c) =>
        c.id === changeId
          ? {
              ...c,
              notes: [newNote, ...c.notes],
              updatedAt: now.toISOString(),
            }
          : c
      )
    );
  };

  const toggleVerificationCheck = (changeId: string, checkId: string) => {
    setChanges((prev) =>
      prev.map((c) => {
        if (c.id !== changeId) return c;
        const updatedChecks = c.verificationChecks.map((chk) =>
          chk.id === checkId ? { ...chk, checked: !chk.checked } : chk
        );
        return {
          ...c,
          verificationChecks: updatedChecks,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const startChange = (changeId: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setChanges((prev) =>
      prev.map((c) => {
        if (c.id !== changeId) return c;
        return {
          ...c,
          status: 'In Progress',
          actualStartTime: c.actualStartTime || timeStr,
          notes: [
            {
              id: `note-${Date.now()}`,
              authorName: currentUser.name,
              authorRole: currentUser.role,
              timestamp: timeStr,
              text: `Change window initiated by ${currentUser.name}. Site work in progress.`,
              type: 'update',
            },
            ...c.notes,
          ],
          updatedAt: now.toISOString(),
        };
      })
    );
  };

  const completeChange = (changeId: string, summaryNote?: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setChanges((prev) =>
      prev.map((c) => {
        if (c.id !== changeId) return c;
        // Also check all verification steps as completed
        const completedChecks = c.verificationChecks.map((chk) => ({ ...chk, checked: true }));

        const newNotes = [...c.notes];
        newNotes.unshift({
          id: `note-${Date.now()}`,
          authorName: currentUser.name,
          authorRole: currentUser.role,
          timestamp: timeStr,
          text: summaryNote
            ? `Change completed and verified by ${currentUser.name}: ${summaryNote}`
            : `Change completed successfully. Post-change tests passed and service confirmed operational by ${currentUser.name}.`,
          type: 'verification',
        });

        return {
          ...c,
          status: 'Completed',
          actualEndTime: timeStr,
          verificationChecks: completedChecks,
          notes: newNotes,
          updatedAt: now.toISOString(),
        };
      })
    );
  };

  const rollbackChange = (changeId: string, reason: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setChanges((prev) =>
      prev.map((c) => {
        if (c.id !== changeId) return c;
        const newNotes = [...c.notes];
        newNotes.unshift({
          id: `note-${Date.now()}`,
          authorName: currentUser.name,
          authorRole: currentUser.role,
          timestamp: timeStr,
          text: `ROLLBACK TRIGGERED by ${currentUser.name}. Reason: ${reason}. Executed rollback procedure: ${c.rollbackPlan}`,
          type: 'rollback',
        });

        return {
          ...c,
          status: 'Rolled Back',
          actualEndTime: timeStr,
          notes: newNotes,
          updatedAt: now.toISOString(),
        };
      })
    );
  };

  const resetToSampleData = () => {
    setChanges(INITIAL_CHANGES);
    localStorage.removeItem(STORAGE_KEY);
  };

  const exportDataJson = (): string => {
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        district: 'Unified School District IT',
        changes,
        sites,
      },
      null,
      2
    );
  };

  const importDataJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.changes)) {
        setChanges(parsed.changes);
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON import', e);
    }
    return false;
  };

  return (
    <ChangeContext.Provider
      value={{
        changes,
        sites,
        team,
        currentUser,
        setCurrentUser,
        addChange,
        updateChange,
        deleteChange,
        addNote,
        toggleVerificationCheck,
        startChange,
        completeChange,
        rollbackChange,
        resetToSampleData,
        exportDataJson,
        importDataJson,
        getSiteById,
        findSiteConflicts,
      }}
    >
      {children}
    </ChangeContext.Provider>
  );
};

export const useChanges = () => {
  const context = useContext(ChangeContext);
  if (!context) {
    throw new Error('useChanges must be used within a ChangeProvider');
  }
  return context;
};
