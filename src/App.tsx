import React, { useState } from 'react';
import { ChangeProvider, useChanges } from './context/ChangeContext';
import { Header } from './components/Header';
import { ChangeListView } from './components/ChangeListView';
import { SiteHubView } from './components/SiteHubView';
import { ScheduleTimelineView } from './components/ScheduleTimelineView';
import { NewChangeModal } from './components/NewChangeModal';
import { ChangeDetailModal } from './components/ChangeDetailModal';
import { TeamsAutomationModal } from './components/TeamsAutomationModal';
import { DailyDigestModal } from './components/DailyDigestModal';
import { Plus, MessageSquare, Mail } from 'lucide-react';

function AppContent() {
  const { sites, changes, currentUser } = useChanges();
  const [activeTab, setActiveTab] = useState<'changes' | 'sites' | 'timeline'>('changes');
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
  const [isEmailDigestOpen, setIsEmailDigestOpen] = useState(false);
  const [preselectedSiteId, setPreselectedSiteId] = useState<string | undefined>(undefined);
  const [siteFilterForList, setSiteFilterForList] = useState<string | undefined>(undefined);

  const handleOpenNewModal = (siteId?: string) => {
    setPreselectedSiteId(siteId);
    setIsNewModalOpen(true);
  };

  const handleFilterBySite = (siteId: string) => {
    setSiteFilterForList(siteId);
    setActiveTab('changes');
  };

  const activeCount = changes.filter((c) => c.status === 'In Progress').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab !== 'changes') setSiteFilterForList(undefined);
          setActiveTab(tab);
        }}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        
        {/* Simple Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {activeTab === 'changes' && 'Change Tracker'}
              {activeTab === 'sites' && 'Schools & Sites'}
              {activeTab === 'timeline' && 'Maintenance Schedule'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'changes' && 'Tracking IT changes across Minster Trust schools, Central Office & Trust-Wide'}
              {activeTab === 'sites' && 'View active maintenance scopes across all schools, Central Office & Trust-Wide'}
              {activeTab === 'timeline' && 'Upcoming maintenance windows to prevent school disruption'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Teams Morning Chat Automation Trigger */}
            <button
              onClick={() => setIsTeamsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs"
              title="Automate or send daily digest of yesterday's changes to Microsoft Teams"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Teams Morning Digest</span>
            </button>

            <button
              onClick={() => handleOpenNewModal()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Change</span>
            </button>
          </div>
        </div>

        {/* Views */}
        {activeTab === 'changes' && (
          <ChangeListView
            onSelectChange={(id) => setSelectedChangeId(id)}
            onOpenNewModal={handleOpenNewModal}
            initialSiteFilter={siteFilterForList}
          />
        )}

        {activeTab === 'sites' && (
          <SiteHubView
            onSelectChange={(id) => setSelectedChangeId(id)}
            onOpenNewModalWithSite={(siteId) => handleOpenNewModal(siteId)}
            onFilterBySite={handleFilterBySite}
          />
        )}

        {activeTab === 'timeline' && (
          <ScheduleTimelineView
            onSelectChange={(id) => setSelectedChangeId(id)}
            onOpenNewModal={() => handleOpenNewModal()}
          />
        )}

      </main>

      {/* Clean, Quiet Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-3 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div>EduChange IT · Minster Trust for Education (MITRE) IT Team</div>
          <div>All schools synced</div>
        </div>
      </footer>

      {/* Modals */}
      <NewChangeModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        preselectedSiteId={preselectedSiteId}
        onCreated={(id) => setSelectedChangeId(id)}
      />

      <ChangeDetailModal
        changeId={selectedChangeId}
        onClose={() => setSelectedChangeId(null)}
      />

      {/* Teams Automation & Digest Modal */}
      <TeamsAutomationModal
        isOpen={isTeamsModalOpen}
        onClose={() => setIsTeamsModalOpen(false)}
      />

      {/* Email Digest Modal */}
      <DailyDigestModal
        isOpen={isEmailDigestOpen}
        onClose={() => setIsEmailDigestOpen(false)}
        defaultEmail="gavinbarkley@gmail.com"
      />
    </div>
  );
}

export default function App() {
  return (
    <ChangeProvider>
      <AppContent />
    </ChangeProvider>
  );
}
