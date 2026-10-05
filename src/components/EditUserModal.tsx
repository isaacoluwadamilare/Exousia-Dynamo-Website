import React, { useState, useEffect } from 'react';
import { HSEAppState, hseDataService } from '../services/hseDataService';
import { UserRole, UserProfile } from '../types/hse';
import { X, UserCheck, Shield, Building, AlertCircle } from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: HSEAppState;
  user: UserProfile | null;
  onUpdated?: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  appState,
  user,
  onUpdated
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('reporter');
  const [roleTitle, setRoleTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role);
      setRoleTitle(user.roleTitle);
      setDepartment(user.department);
      setSelectedSiteIds(user.siteIds);
      setError(null);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const roleOptions: { role: UserRole; title: string; desc: string }[] = [
    { role: 'reporter', title: 'Reporter / Field Technician', desc: 'Submits reports and observations.' },
    { role: 'action_owner', title: 'Action Owner / Operations Supervisor', desc: 'Executes corrective actions.' },
    { role: 'hse_officer', title: 'HSE Safety Officer / Lead Inspector', desc: 'Conducts inspections, reviews findings.' },
    { role: 'hse_manager', title: 'HSE Manager', desc: 'Supervises workflows, verifies CAPA closure.' },
    { role: 'management_viewer', title: 'Management Viewer / Executive', desc: 'Read-only dashboard access.' },
    { role: 'admin', title: 'Platform System Administrator', desc: 'Administers system settings, sites, users.' }
  ];

  const handleToggleSite = (siteId: string) => {
    setSelectedSiteIds(prev =>
      prev.includes(siteId) ? prev.filter(id => id !== siteId) : [...prev, siteId]
    );
  };

  const handleSelectAllSites = () => {
    setSelectedSiteIds(appState.sites.map(s => s.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('User name cannot be empty.');
      return;
    }
    if (selectedSiteIds.length === 0) {
      setError('User must be assigned to at least one operational site.');
      return;
    }

    const res = hseDataService.updateUser(user.id, {
      name: name.trim(),
      role,
      roleTitle: roleTitle.trim() || undefined,
      department: department.trim(),
      siteIds: selectedSiteIds
    });

    if (!res.success) {
      setError(res.error || 'Failed to update user.');
      return;
    }

    if (onUpdated) onUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-xl shadow-2xl border border-[#DDE5DF] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5DF] bg-[#F7F9F7]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#007A44]/10 text-[#007A44] rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#15251C]">
                Edit User Account & Role Permissions
              </h2>
              <p className="text-xs text-[#5D6961]">
                Managing {user.name} ({user.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5D6961] hover:text-[#15251C] hover:bg-black/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-[#FFF0ED] border border-[#FECDCA] rounded-lg text-xs text-[#B42318] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-[#15251C] block mb-1">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#DDE5DF] bg-white"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-[#15251C] block mb-1">Email Address</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full p-2.5 rounded-lg border border-[#DDE5DF] bg-[#F7F9F7] text-[#5D6961] cursor-not-allowed font-mono"
              />
              <span className="text-[10px] text-[#5D6961] mt-0.5 block">Email address cannot be changed.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-[#15251C] block mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#DDE5DF] bg-white"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-[#15251C] block mb-1">Custom Role Title</label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#DDE5DF] bg-white"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="font-semibold text-[#15251C] block mb-1.5">Assigned Governance Role *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roleOptions.map((opt) => (
                <label
                  key={opt.role}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start gap-2.5 ${
                    role === opt.role
                      ? 'border-[#007A44] bg-[#EEF7F2]/50 text-[#15251C]'
                      : 'border-[#DDE5DF] bg-white text-[#5D6961]'
                  }`}
                >
                  <input
                    type="radio"
                    name="editRole"
                    value={opt.role}
                    checked={role === opt.role}
                    onChange={() => setRole(opt.role)}
                    className="mt-0.5 text-[#007A44] focus:ring-[#007A44]"
                  />
                  <div>
                    <span className="font-semibold text-xs text-[#15251C] block">{opt.title}</span>
                    <span className="text-[11px] text-[#5D6961] block leading-tight mt-0.5">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Site Assignments */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-[#15251C]">Assigned Facility Sites *</label>
              <button
                type="button"
                onClick={handleSelectAllSites}
                className="text-[11px] text-[#007A44] font-semibold hover:underline"
              >
                Assign All Sites
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF]">
              {appState.sites.map((s) => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={selectedSiteIds.includes(s.id)}
                    onChange={() => handleToggleSite(s.id)}
                    className="rounded text-[#007A44] focus:ring-[#007A44]"
                  />
                  <span className="font-medium text-[#15251C] truncate">{s.name} ({s.code})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#DDE5DF] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs border border-[#DDE5DF] rounded-lg text-[#5D6961] hover:text-[#15251C] font-semibold bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs bg-[#007A44] hover:bg-[#005D35] text-white font-semibold rounded-lg shadow-xs transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
