import React, { useState } from 'react';
import { HSEAppState, hseDataService } from '../services/hseDataService';
import { UserRole, UserProfile } from '../types/hse';
import { X, UserPlus, Shield, Building, AlertCircle } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: HSEAppState;
  onCreated?: (user: UserProfile) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  appState,
  onCreated
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('reporter');
  const [roleTitle, setRoleTitle] = useState('');
  const [department, setDepartment] = useState('Operations');
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>(['site-1', 'site-2']);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const roleOptions: { role: UserRole; title: string; desc: string }[] = [
    {
      role: 'reporter',
      title: 'Reporter / Field Technician',
      desc: 'Submit incident, near-miss, and hazard reports; view own permitted records.'
    },
    {
      role: 'action_owner',
      title: 'Action Owner / Operations Supervisor',
      desc: 'Assigned corrective actions; logs remediation progress and submits closure evidence.'
    },
    {
      role: 'hse_officer',
      title: 'HSE Safety Officer / Lead Inspector',
      desc: 'Executes checklist inspections, classifies findings, and reviews reports.'
    },
    {
      role: 'hse_manager',
      title: 'HSE Manager',
      desc: 'Supervises all workflows, verifies evidence closure, manages compliance register.'
    },
    {
      role: 'management_viewer',
      title: 'Management Viewer / Executive',
      desc: 'Executive read-only access to dashboards, registers, and certified reports.'
    },
    {
      role: 'admin',
      title: 'Platform System Administrator',
      desc: 'Configures operational sites, user membership, and matrix scoring schemes.'
    }
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
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Full name is required.';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid corporate email is required.';
    if (!department.trim()) newErrors.department = 'Department is required.';
    if (selectedSiteIds.length === 0) newErrors.sites = 'At least one operating facility must be assigned.';

    // Check duplicate email
    if (appState.users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      newErrors.email = 'A user with this email address already exists in the system.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newUser = hseDataService.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      roleTitle: roleTitle.trim() || undefined,
      department: department.trim(),
      siteIds: selectedSiteIds
    });

    if (onCreated) onCreated(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-xl shadow-2xl border border-[#DDE5DF] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5DF] bg-[#F7F9F7]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#007A44]/10 text-[#007A44] rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#15251C]">
                Provision New User Account
              </h2>
              <p className="text-xs text-[#5D6961]">
                Assign approved role, departmental grouping, and operational site boundaries.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chinedu Okafor"
                className={`w-full p-2.5 rounded-lg border bg-white ${
                  errors.name ? 'border-[#B42318]' : 'border-[#DDE5DF]'
                } focus:border-[#007A44] focus:outline-hidden`}
              />
              {errors.name && <p className="text-[#B42318] text-[11px] mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                Corporate Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. c.okafor@exousiadynamoenergy.com"
                className={`w-full p-2.5 rounded-lg border bg-white ${
                  errors.email ? 'border-[#B42318]' : 'border-[#DDE5DF]'
                } focus:border-[#007A44] focus:outline-hidden`}
              />
              {errors.email && <p className="text-[#B42318] text-[11px] mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Department & Role Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                Department / Functional Unit *
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Mechanical Maintenance, Field Ops, HSE"
                className={`w-full p-2.5 rounded-lg border bg-white ${
                  errors.department ? 'border-[#B42318]' : 'border-[#DDE5DF]'
                } focus:border-[#007A44] focus:outline-hidden`}
              />
              {errors.department && (
                <p className="text-[#B42318] text-[11px] mt-1">{errors.department}</p>
              )}
            </div>

            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                Custom Role Title (Optional)
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Fabrication Workshop Lead"
                className="w-full p-2.5 rounded-lg border border-[#DDE5DF] bg-white focus:border-[#007A44] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Proposed Role Selection */}
          <div>
            <label className="font-semibold text-[#15251C] block mb-1.5">
              Assigned Proposed Governance Role (Specification Section 6) *
            </label>
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
                    name="proposedRole"
                    value={opt.role}
                    checked={role === opt.role}
                    onChange={() => setRole(opt.role)}
                    className="mt-0.5 text-[#007A44] focus:ring-[#007A44]"
                  />
                  <div>
                    <span className="font-semibold text-xs text-[#15251C] block">
                      {opt.title}
                    </span>
                    <span className="text-[11px] text-[#5D6961] block leading-tight mt-0.5">
                      {opt.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Site Assignments */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-[#15251C]">
                Authorized Facility Site Assignments *
              </label>
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
            {errors.sites && <p className="text-[#B42318] text-[11px] mt-1">{errors.sites}</p>}
          </div>

          {/* Modal Footer */}
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
              className="px-5 py-2 text-xs bg-[#007A44] hover:bg-[#005D35] text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create User Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
