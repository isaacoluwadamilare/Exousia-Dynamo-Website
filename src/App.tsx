import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { hseDataService, HSEAppState } from './services/hseDataService';

// Components
import { WorkspaceSidebar } from './components/WorkspaceSidebar';
import { WorkspaceHeader } from './components/WorkspaceHeader';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { AccessPendingPage } from './pages/public/AccessPendingPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { HelpPage } from './pages/public/HelpPage';

// Workspace Pages
import { OverviewPage } from './pages/workspace/OverviewPage';
import { NewReportPage } from './pages/workspace/NewReportPage';
import { IncidentsPage } from './pages/workspace/IncidentsPage';
import { IncidentDetailPage } from './pages/workspace/IncidentDetailPage';
import { HazardsPage } from './pages/workspace/HazardsPage';
import { HazardDetailPage } from './pages/workspace/HazardDetailPage';
import { InspectionsPage } from './pages/workspace/InspectionsPage';
import { NewInspectionPage } from './pages/workspace/NewInspectionPage';
import { InspectionDetailPage } from './pages/workspace/InspectionDetailPage';
import { ActionsPage } from './pages/workspace/ActionsPage';
import { ActionDetailPage } from './pages/workspace/ActionDetailPage';
import { CompliancePage } from './pages/workspace/CompliancePage';
import { ComplianceDetailPage } from './pages/workspace/ComplianceDetailPage';
import { AnalyticsPage } from './pages/workspace/AnalyticsPage';
import { ManagementReportsPage } from './pages/workspace/ManagementReportsPage';
import { UsersPage } from './pages/workspace/UsersPage';
import { SettingsPage } from './pages/workspace/SettingsPage';
import { AuditPage } from './pages/workspace/AuditPage';
import { HelpWorkspacePage } from './pages/workspace/HelpWorkspacePage';

// Workspace Layout Shell
const WorkspaceLayout: React.FC<{ appState: HSEAppState }> = ({ appState }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F9F7]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <WorkspaceSidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10 animate-in slide-in-from-left duration-200">
            <WorkspaceSidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <WorkspaceHeader
          appState={appState}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const [appState, setAppState] = useState<HSEAppState>(hseDataService.getState());

  useEffect(() => {
    const unsubscribe = hseDataService.subscribe((newState) => {
      setAppState(newState);
    });
    return unsubscribe;
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage appState={appState} />} />
        <Route path="/access-pending" element={<AccessPendingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/help" element={<HelpPage />} />

        {/* Private Workspace Routes */}
        <Route path="/app" element={<WorkspaceLayout appState={appState} />}>
          <Route index element={<OverviewPage appState={appState} />} />
          <Route path="reports/new" element={<NewReportPage appState={appState} />} />
          <Route path="incidents" element={<IncidentsPage appState={appState} />} />
          <Route path="incidents/:id" element={<IncidentDetailPage appState={appState} />} />
          <Route path="hazards" element={<HazardsPage appState={appState} />} />
          <Route path="hazards/:id" element={<HazardDetailPage appState={appState} />} />
          <Route path="inspections" element={<InspectionsPage appState={appState} />} />
          <Route path="inspections/new" element={<NewInspectionPage appState={appState} />} />
          <Route path="inspections/:id" element={<InspectionDetailPage appState={appState} />} />
          <Route path="actions" element={<ActionsPage appState={appState} />} />
          <Route path="actions/:id" element={<ActionDetailPage appState={appState} />} />
          <Route path="compliance" element={<CompliancePage appState={appState} />} />
          <Route path="compliance/:id" element={<ComplianceDetailPage appState={appState} />} />
          <Route path="analytics" element={<AnalyticsPage appState={appState} />} />
          <Route path="management-reports" element={<ManagementReportsPage appState={appState} />} />
          <Route path="users" element={<UsersPage appState={appState} />} />
          <Route path="admin/users" element={<UsersPage appState={appState} />} />
          <Route path="settings" element={<SettingsPage appState={appState} />} />
          <Route path="admin/settings" element={<SettingsPage appState={appState} />} />
          <Route path="audit" element={<AuditPage appState={appState} />} />
          <Route path="help" element={<HelpWorkspacePage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
