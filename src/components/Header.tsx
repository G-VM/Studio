import React, { useState, useRef, useEffect } from 'react';
import { useChanges } from '../context/ChangeContext';
import { User, Check, ChevronDown } from 'lucide-react';

interface HeaderProps {
  activeTab: 'changes' | 'sites' | 'timeline';
  setActiveTab: (tab: 'changes' | 'sites' | 'timeline') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { team, currentUser, setCurrentUser } = useChanges();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element, no subtitle) */}
        <button
          onClick={() => setActiveTab('changes')}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-blue-600 transition-colors text-left"
        >
          EduChange IT
        </button>

        {/* Zone 2: Nav Links (Clean, simple navigation) */}
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('changes')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'changes'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Change Tracker
          </button>
          <button
            onClick={() => setActiveTab('sites')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'sites'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Schools & Sites
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'timeline'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Schedule
          </button>
        </nav>

        {/* Zone 3: Primary Actions (User profile switch) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* User selector dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              title="Switch active technician"
            >
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                {currentUser.initials}
              </div>
              <span className="hidden sm:inline max-w-[110px] truncate">{currentUser.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Logged in technician
                </div>
                {team.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setCurrentUser(member);
                      setUserDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-slate-800">{member.name}</div>
                      <div className="text-[11px] text-slate-500">{member.role}</div>
                    </div>
                    {currentUser.id === member.id && (
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
