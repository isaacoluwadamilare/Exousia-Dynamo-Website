import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ExousiaLogo } from './ExousiaLogo';
import {
  LayoutDashboard,
  AlertOctagon,
  Eye,
  ClipboardCheck,
  CheckSquare,
  ShieldCheck,
  FileBarChart,
  BarChart3,
  Users,
  Settings,
  History,
  HelpCircle,
  ArrowLeft,
  X,
  Sparkles,
  Database,
  Building,
  Tag,
  Sliders
} from 'lucide-react';

interface WorkspaceSidebarProps {
  onCloseMobile?: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ onCloseMobile }) => {
  const location = useLocation();

  // Primary HSE Operations
  const operationsNavItems = [
    { label: 'Overview', path: '/app', icon: LayoutDashboard },
    { label: 'Incidents & Near Misses', path: '/app/incidents', icon: AlertOctagon },
    { label: 'Hazard Observations', path: '/app/hazards', icon: Eye },
    { label: 'Inspections', path: '/app/inspections', icon: ClipboardCheck },
    { label: 'Corrective & Preventive Actions', path: '/app/actions', icon: CheckSquare },
    { label: 'Compliance Register', path: '/app/compliance', icon: ShieldCheck },
  ];

  // Administration Screens
  const adminNavItems = [
    { label: 'Users & Proposed Roles', path: '/app/users', icon: Users },
    { label: 'Operational Sites', path: '/app/settings?tab=sites', icon: Building, tab: 'sites' },
    { label: 'Inspection Templates', path: '/app/settings?tab=templates', icon: ClipboardCheck, tab: 'templates' },
    { label: 'Finding Categories', path: '/app/settings?tab=categories', icon: Tag, tab: 'categories' },
    { label: '5×5 Risk Matrix', path: '/app/settings?tab=matrix', icon: Sliders, tab: 'matrix' },
  ];

  // Governance & Reporting
  const reportingNavItems = [
    { label: 'Analytics', path: '/app/analytics', icon: BarChart3 },
    { label: 'Management Reports', path: '/app/management-reports', icon: FileBarChart },
    { label: 'Audit History', path: '/app/audit', icon: History },
    { label: 'Help', path: '/app/help', icon: HelpCircle },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#DDE5DF] flex flex-col h-full shrink-0 select-none">
      {/* Sidebar Header with Brand Logo */}
      <div className="p-5 border-b border-[#DDE5DF] flex items-center justify-between">
        <Link to="/" className="block">
          <ExousiaLogo variant="full" theme="light" height={36} />
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-[#5D6961] hover:text-[#15251C] rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#007A44]"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Demo Mode Notice Banner */}
      <div className="mx-3 mt-3 p-2.5 rounded-lg bg-[#FEF6EE] border border-[#F9DBAF] text-[11px] text-[#B54708]">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#F79009] animate-pulse"></span>
          <span>DEMO REPOSITORY</span>
        </div>
        <p className="text-[10px] text-[#8C3A00] mt-0.5 leading-tight">
          Contract spec data with linked records & stable IDs.
        </p>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        <div>
          <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-[#5D6961] uppercase">
            HSE Operations
          </div>
          <nav className="space-y-0.5" aria-label="Operations Navigation">
            {operationsNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/app'
                  ? location.pathname === '/app' || location.pathname === '/app/'
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#007A44] ${
                    isActive
                      ? 'bg-[#EEF7F2] text-[#007A44] font-semibold shadow-2xs'
                      : 'text-[#37473F] hover:text-[#15251C] hover:bg-[#F7F9F7]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#007A44]' : 'text-[#5D6961]'}`} />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-[#5D6961] uppercase">
            Administration
          </div>
          <nav className="space-y-0.5" aria-label="Administration Navigation">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const searchParams = new URLSearchParams(location.search);
              const currentTab = searchParams.get('tab');
              const isSettings = location.pathname.startsWith('/app/settings') || location.pathname.startsWith('/app/admin/settings');
              const isActive =
                item.tab
                  ? isSettings && (currentTab === item.tab || (!currentTab && item.tab === 'sites'))
                  : location.pathname.startsWith('/app/users') || location.pathname.startsWith('/app/admin/users');

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#007A44] ${
                    isActive
                      ? 'bg-[#EEF7F2] text-[#007A44] font-semibold shadow-2xs'
                      : 'text-[#37473F] hover:text-[#15251C] hover:bg-[#F7F9F7]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#007A44]' : 'text-[#5D6961]'}`} />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-[#5D6961] uppercase">
            Governance & Reporting
          </div>
          <nav className="space-y-0.5" aria-label="Governance Navigation">
            {reportingNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#007A44] ${
                    isActive
                      ? 'bg-[#EEF7F2] text-[#007A44] font-semibold shadow-2xs'
                      : 'text-[#37473F] hover:text-[#15251C] hover:bg-[#F7F9F7]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#007A44]' : 'text-[#5D6961]'}`} />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-[#DDE5DF] bg-[#F7F9F7] text-xs space-y-1">
        <Link
          to="/"
          className="flex items-center gap-2 text-[#15251C] hover:text-[#007A44] font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Public Portal</span>
        </Link>
        <p className="text-[10px] text-[#5D6961]">
          Exousia Dynamo Energy Ltd · HSE System
        </p>
      </div>
    </aside>
  );
};
