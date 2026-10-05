import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { hseDataService } from '../services/hseDataService';
import { HSEAppState } from '../services/hseDataService';
import { ContractReferenceModal } from './ContractReferenceModal';
import {
  Menu,
  Shield,
  MapPin,
  UserCheck,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Info
} from 'lucide-react';

interface WorkspaceHeaderProps {
  appState: HSEAppState;
  onOpenMobileSidebar: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  appState,
  onOpenMobileSidebar
}) => {
  const location = useLocation();
  const [showContractModal, setShowContractModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Generate breadcrumb text
  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path === '/app' || path === '/app/') return 'Overview';
    if (path.includes('/reports/new')) return 'New Report';
    if (path.includes('/incidents')) return 'Incidents & Near Misses';
    if (path.includes('/hazards')) return 'Hazard Observations';
    if (path.includes('/inspections/new')) return 'Schedule Inspection';
    if (path.includes('/inspections')) return 'Inspections';
    if (path.includes('/actions')) return 'Corrective & Preventive Actions';
    if (path.includes('/compliance')) return 'Compliance';
    if (path.includes('/management-reports')) return 'Management Reports';
    if (path.includes('/analytics')) return 'Analytics';
    if (path.includes('/users') || path.includes('/admin/users')) return 'Users & Access';
    if (path.includes('/settings') || path.includes('/admin/settings')) return 'Settings';
    if (path.includes('/audit')) return 'Audit History';
    if (path.includes('/help')) return 'Help';
    return 'Workspace';
  };

  const handleRoleChange = (userId: string) => {
    hseDataService.setCurrentUser(userId);
    setShowUserDropdown(false);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo operational data back to the clean contract reference state?')) {
      hseDataService.resetToContractSampleData();
    }
  };

  return (
    <>
      <header className="h-16 border-b border-[#DDE5DF] bg-white px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
        {/* Left: Mobile Toggle & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 text-[#5D6961] hover:text-[#15251C] rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#007A44]"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-[#5D6961] hidden sm:inline">Exousia HSE</span>
            <span className="text-[#5D6961] hidden sm:inline">/</span>
            <span className="text-[#15251C] font-semibold">{getBreadcrumbTitle()}</span>
          </nav>

          {/* Prominent Demo Mode Badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF6EE] text-[#B54708] border border-[#F9DBAF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F79009] animate-pulse"></span>
            <span>DEMO MODE</span>
          </span>
        </div>

        {/* Right: Controls & Persona Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Site Selector */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#5D6961] bg-[#F7F9F7] px-2.5 py-1.5 rounded-lg border border-[#DDE5DF]">
            <MapPin className="w-3.5 h-3.5 text-[#007A44]" />
            <select
              value={appState.activeSiteFilter}
              onChange={(e) => hseDataService.setActiveSiteFilter(e.target.value)}
              className="bg-transparent text-[#15251C] font-medium outline-hidden cursor-pointer text-xs"
            >
              <option value="all">All Operational Sites</option>
              {appState.sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {/* Contract Scope Checker Button */}
          <button
            onClick={() => setShowContractModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#FEDF89] bg-[#FFFAEB] text-[#B54708] hover:bg-[#FEF0C7] transition-colors"
            title="Separation of confirmed requirements and proposed workflow decisions"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Contract Scope</span>
          </button>

          {/* Role Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#F7F9F7] border border-transparent hover:border-[#DDE5DF] transition-all text-left"
            >
              <div className="w-7 h-7 rounded-full bg-[#007A44] text-white flex items-center justify-center text-xs font-bold">
                {appState.currentUser.avatar || 'US'}
              </div>
              <div className="hidden xl:block text-xs">
                <div className="font-semibold text-[#15251C] leading-none">
                  {appState.currentUser.name}
                </div>
                <div className="text-[10px] text-[#5D6961] leading-tight mt-0.5">
                  {appState.currentUser.roleTitle}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#5D6961]" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-[#DDE5DF] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-[#DDE5DF] text-xs">
                  <div className="text-[#5D6961] font-medium">Switch Active Persona:</div>
                  <div className="text-[11px] text-[#5D6961]">
                    Test permission boundaries & duty separation
                  </div>
                </div>
                <div className="py-1 space-y-0.5 max-h-64 overflow-y-auto">
                  {appState.users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleRoleChange(user.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        user.id === appState.currentUser.id
                          ? 'bg-[#EEF7F2] text-[#007A44] font-semibold'
                          : 'text-[#15251C] hover:bg-[#F7F9F7]'
                      }`}
                    >
                      <div>
                        <div>{user.name}</div>
                        <div className="text-[10px] text-[#5D6961]">{user.roleTitle}</div>
                      </div>
                      {user.id === appState.currentUser.id && (
                        <UserCheck className="w-4 h-4 text-[#007A44]" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#DDE5DF] px-2 flex justify-between gap-2">
                  <button
                    onClick={handleResetData}
                    className="text-[11px] text-[#5D6961] hover:text-[#B42318] flex items-center gap-1 py-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Data
                  </button>
                  <Link
                    to="/"
                    onClick={() => setShowUserDropdown(false)}
                    className="text-[11px] text-[#007A44] hover:underline py-1 font-medium"
                  >
                    Public portal
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <ContractReferenceModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
      />
    </>
  );
};
