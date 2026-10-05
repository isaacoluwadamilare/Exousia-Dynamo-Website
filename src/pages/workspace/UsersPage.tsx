import React, { useState } from 'react';
import { HSEAppState, hseDataService } from '../../services/hseDataService';
import { UserRole, UserProfile } from '../../types/hse';
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  MapPin,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Edit2,
  Power,
  Search,
  Filter,
  Check,
  X,
  Sparkles,
  Info,
  Building
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { CreateUserModal } from '../../components/CreateUserModal';
import { EditUserModal } from '../../components/EditUserModal';

interface UsersPageProps {
  appState: HSEAppState;
}

export const UsersPage: React.FC<UsersPageProps> = ({ appState }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated'>('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const roleConfigs: Record<UserRole, { title: string; badgeColor: string; desc: string }> = {
    reporter: {
      title: 'Reporter / Field Technician',
      badgeColor: 'bg-[#F0F9FF] text-[#026AA2] border-[#B9E6FE]',
      desc: 'Can submit incident, near-miss, and hazard reports; view permitted records.'
    },
    action_owner: {
      title: 'Action Owner / Operations Supervisor',
      badgeColor: 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]',
      desc: 'Assigned corrective actions; logs remediation progress and submits closure evidence.'
    },
    hse_officer: {
      title: 'Inspector / HSE Officer',
      badgeColor: 'bg-[#EEF7F2] text-[#007A44] border-[#BDE3CE]',
      desc: 'Conducts inspections, evaluates 5×5 risk scores, and classifies findings.'
    },
    hse_manager: {
      title: 'HSE Manager',
      badgeColor: 'bg-[#EEF7F2] text-[#007A44] border-[#BDE3CE]',
      desc: 'Supervises all workflows, verifies evidence closure, manages compliance register.'
    },
    management_viewer: {
      title: 'Management Viewer / Executive',
      badgeColor: 'bg-[#F7F9F7] text-[#5D6961] border-[#DDE5DF]',
      desc: 'Executive read-only access to dashboards, registers, and certified reports.'
    },
    admin: {
      title: 'Platform System Administrator',
      badgeColor: 'bg-[#15251C] text-white border-black',
      desc: 'Configures operational sites, user membership, and matrix scoring schemes.'
    }
  };

  const handleSwitchActivePersona = (userId: string) => {
    hseDataService.setCurrentUser(userId);
    const u = appState.users.find(user => user.id === userId);
    setActionFeedback(`Switched active demonstration persona to ${u?.name} (${roleConfigs[u?.role || 'reporter'].title}).`);
  };

  const handleToggleActive = (user: UserProfile) => {
    setActionFeedback(null);
    const res = hseDataService.toggleUserActive(user.id);
    if (!res.success) {
      setActionFeedback(`Error: ${res.error}`);
    } else {
      setActionFeedback(`Account for ${user.name} is now ${res.active ? 'ACTIVE' : 'DEACTIVATED'}.`);
    }
  };

  const filteredUsers = appState.users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter === 'active' && !u.active) return false;
    if (statusFilter === 'deactivated' && u.active) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.roleTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-[#15251C]">Users & Access Control Administration</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EEF7F2] text-[#007A44] border border-[#BDE3CE]">
              Role-Based Access
            </span>
          </div>
          <p className="text-xs text-[#5D6961] mt-1">
            Enterprise user directory, proposed roles, operational site assignments, and account status controls.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#007A44] hover:bg-[#005D35] text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New User</span>
        </button>
      </div>

      {/* Mandatory Demonstration Disclaimer Banner */}
      <div className="p-4 bg-[#FFFAEB] border border-[#FEDF89] rounded-xl text-xs text-[#B54708] flex items-start gap-3">
        <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-[#B54708]" />
        <div className="space-y-1">
          <strong className="block font-semibold">
            Demonstration Persona Notice (Contract Specification Section 6):
          </strong>
          <p className="leading-relaxed">
            Role switching in this demonstration workspace is strictly intended to allow evaluators to verify the proposed permission matrix, separation of duty rules (e.g. action owners cannot verify closure), and operational user experiences. In production deployment, authentication and roles are strictly managed and enforced server-side.
          </p>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-[#EEF7F2] border border-[#BDE3CE] text-xs text-[#007A44] flex items-start gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{actionFeedback}</div>
          <button onClick={() => setActionFeedback(null)} className="text-[#007A44] hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#DDE5DF] pb-2 text-xs">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-[#EEF7F2] text-[#007A44]'
              : 'text-[#5D6961] hover:text-[#15251C]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Directory ({appState.users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-3.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'matrix'
              ? 'bg-[#EEF7F2] text-[#007A44]'
              : 'text-[#5D6961] hover:text-[#15251C]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Proposed Permission Matrix (6 Roles)</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#DDE5DF] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#5D6961] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users by name, email, department, or role title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#DDE5DF] rounded-lg focus:outline-hidden focus:border-[#007A44]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-2 bg-white text-[#15251C]"
              >
                <option value="all">All Roles</option>
                <option value="reporter">Reporters Only</option>
                <option value="action_owner">Action Owners Only</option>
                <option value="hse_officer">HSE Officers Only</option>
                <option value="hse_manager">HSE Managers Only</option>
                <option value="management_viewer">Management Viewers</option>
                <option value="admin">Administrators</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-2 bg-white text-[#15251C]"
              >
                <option value="all">All Account Statuses</option>
                <option value="active">Active Accounts Only</option>
                <option value="deactivated">Deactivated Accounts</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-[#DDE5DF] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Proposed Role & Title</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Site Assignments</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Demo Persona</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE5DF]">
                  {filteredUsers.map((u) => {
                    const isCurrent = u.id === appState.currentUser.id;
                    const config = roleConfigs[u.role] || roleConfigs.reporter;

                    return (
                      <tr
                        key={u.id}
                        className={`transition-colors ${
                          isCurrent ? 'bg-[#EEF7F2]/40' : 'hover:bg-[#F7F9F7]'
                        }`}
                      >
                        {/* User Identity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#007A44] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {u.avatar || u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-[#15251C] flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#007A44] text-white">
                                    Current Session
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#5D6961] font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${config.badgeColor} mb-0.5`}>
                            {config.title}
                          </span>
                          <div className="text-[11px] text-[#5D6961]">{u.roleTitle}</div>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4 text-[#5D6961] whitespace-nowrap">
                          {u.department}
                        </td>

                        {/* Site Assignments */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-[#15251C]">
                              {u.siteIds.length === appState.sites.length
                                ? 'All Sites (Corporate-wide)'
                                : `${u.siteIds.length} Assigned Facilities`}
                            </span>
                            <div className="text-[10px] text-[#5D6961] truncate max-w-xs">
                              {u.siteIds.map(sid => appState.sites.find(s => s.id === sid)?.code).filter(Boolean).join(', ')}
                            </div>
                          </div>
                        </td>

                        {/* Account Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge variant={u.active ? 'success' : 'neutral'} size="sm">
                            {u.active ? 'Active' : 'Deactivated'}
                          </Badge>
                        </td>

                        {/* Demo Switcher */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1 text-[#007A44] font-bold text-xs bg-[#EEF7F2] px-2.5 py-1 rounded-lg border border-[#BDE3CE]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Active (Demo)</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSwitchActivePersona(u.id)}
                              className="px-2.5 py-1 text-xs border border-[#DDE5DF] hover:border-[#007A44] hover:bg-[#EEF7F2] text-[#15251C] hover:text-[#007A44] rounded-lg font-semibold transition-colors flex items-center gap-1"
                              title="Switch to this persona for interactive simulation"
                            >
                              <Sparkles className="w-3 h-3 text-[#007A44]" />
                              <span>Switch Persona</span>
                            </button>
                          )}
                        </td>

                        {/* Admin Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingUser(u)}
                              className="p-1.5 text-[#5D6961] hover:text-[#007A44] hover:bg-black/5 rounded-md transition-colors"
                              title="Edit user role and site assignments"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleActive(u)}
                              disabled={isCurrent}
                              className={`p-1.5 rounded-md transition-colors ${
                                isCurrent
                                  ? 'text-[#DDE5DF] cursor-not-allowed'
                                  : u.active
                                  ? 'text-[#5D6961] hover:text-[#B42318] hover:bg-[#FFF0ED]'
                                  : 'text-[#007A44] hover:bg-[#EEF7F2]'
                              }`}
                              title={
                                isCurrent
                                  ? 'Cannot deactivate currently active session'
                                  : u.active
                                  ? 'Deactivate user account'
                                  : 'Reactivate user account'
                              }
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Proposed Permission Matrix Tab */
        <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-6 text-xs">
          <div>
            <h2 className="text-base font-semibold text-[#15251C] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#007A44]" />
              <span>Proposed 6-Role Permission & Governance Matrix</span>
            </h2>
            <p className="text-xs text-[#5D6961] mt-1">
              Based on Exousia HSE Build Specification Section 6 and Contract Award Clause 1.10.
            </p>
          </div>

          <div className="overflow-x-auto border border-[#DDE5DF] rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold text-[11px]">
                  <th className="py-3 px-4">Role Title</th>
                  <th className="py-3 px-3 text-center">Submit Reports (Incidents/Near Misses/Hazards)</th>
                  <th className="py-3 px-3 text-center">Execute Checklist Inspections</th>
                  <th className="py-3 px-3 text-center">Own Actions (Progress/Evidence)</th>
                  <th className="py-3 px-3 text-center">Verify & Close CAPA (2-Person Rule)</th>
                  <th className="py-3 px-3 text-center">Audit Compliance Register</th>
                  <th className="py-3 px-3 text-center">System Administration (Sites, Users, Templates)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE5DF]">
                {/* 1. Reporter */}
                <tr>
                  <td className="py-3 px-4 font-semibold text-[#15251C]">
                    Reporter / Employee
                    <span className="block font-normal text-[10px] text-[#5D6961]">Field Operator / Technician</span>
                  </td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Allowed</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#F7F9F7] text-[#5D6961] text-[10px]">No</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#F7F9F7] text-[#5D6961] text-[10px]">No</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#FFF0ED] text-[#B42318] font-bold text-[10px]">Restricted</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#F7F9F7] text-[#5D6961] text-[10px]">Read Own</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#F7F9F7] text-[#5D6961] text-[10px]">No</span></td>
                </tr>

                {/* 2. Action Owner */}
                <tr>
                  <td className="py-3 px-4 font-semibold text-[#15251C]">
                    Action Owner
                    <span className="block font-normal text-[10px] text-[#5D6961]">Area Supervisor / Lead</span>
                  </td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Allowed</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#F7F9F7] text-[#5D6961] text-[10px]">No</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Allowed</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#FFF0ED] text-[#B42318] font-bold text-[10px]">BLOCKED (Self-Closure)</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#F7F9F7] text-[#5D6961] text-[10px]">Read</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#F7F9F7] text-[#5D6961] text-[10px]">No</span></td>
                </tr>

                {/* 3. HSE Officer */}
                <tr>
                  <td className="py-3 px-4 font-semibold text-[#15251C]">
                    HSE Officer
                    <span className="block font-normal text-[10px] text-[#5D6961]">Safety Inspector & Reviewer</span>
                  </td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Allowed</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Allowed</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Allowed</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Authorized (If Not Owner)</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Allowed</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#F7F9F7] text-[#5D6961] text-[10px]">No</span></td>
                </tr>

                {/* 4. HSE Manager */}
                <tr>
                  <td className="py-3 px-4 font-semibold text-[#15251C]">
                    HSE General Manager
                    <span className="block font-normal text-[10px] text-[#5D6961]">Workflow Supervisor</span>
                  </td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Allowed</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Allowed</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Allowed</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Authorized (If Not Owner)</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Full Sign-off</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Categories & Templates</span></td>
                </tr>

                {/* 5. Management Viewer */}
                <tr>
                  <td className="py-3 px-4 font-semibold text-[#15251C]">
                    Management Viewer
                    <span className="block font-normal text-[10px] text-[#5D6961]">Operating Client Director</span>
                  </td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#F7F9F7] text-[#5D6961] text-[10px]">Read Only</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#F7F9F7] text-[#5D6961] text-[10px]">Read Only</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#F7F9F7] text-[#5D6961] text-[10px]">Read Only</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#FFF0ED] text-[#B42318] font-bold text-[10px]">Restricted</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#F7F9F7] text-[#5D6961] text-[10px]">Read Only</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#F7F9F7] text-[#5D6961] text-[10px]">No</span></td>
                </tr>

                {/* 6. Admin */}
                <tr>
                  <td className="py-3 px-4 font-semibold text-[#15251C]">
                    Platform Administrator
                    <span className="block font-normal text-[10px] text-[#5D6961]">Digital Solutions Admin</span>
                  </td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Allowed</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Allowed</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Allowed</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Authorized (If Not Owner)</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Full Sign-off</span></td>
                  <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] font-bold text-[10px]">Full Administration</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        appState={appState}
        onCreated={(u) => setActionFeedback(`User account ${u.name} provisioned successfully.`)}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        appState={appState}
        user={editingUser}
        onUpdated={() => setActionFeedback('User details updated successfully.')}
      />
    </div>
  );
};
