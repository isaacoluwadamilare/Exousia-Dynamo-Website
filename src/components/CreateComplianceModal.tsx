import React, { useState } from 'react';
import { HSEAppState, hseDataService } from '../services/hseDataService';
import { ComplianceObligation, ComplianceState } from '../types/hse';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, FileText, Plus } from 'lucide-react';

interface CreateComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: HSEAppState;
  onCreated?: (obligation: ComplianceObligation) => void;
}

export const CreateComplianceModal: React.FC<CreateComplianceModalProps> = ({
  isOpen,
  onClose,
  appState,
  onCreated
}) => {
  const [title, setTitle] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [regulatorOrAuthority, setRegulatorOrAuthority] = useState('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>(['site-1', 'site-2']);
  const [ownerId, setOwnerId] = useState(appState.users[0]?.id || '');
  const [dueDate, setDueDate] = useState('2026-11-30');
  const [complianceState, setComplianceState] = useState<ComplianceState>('not_assessed');
  const [isInternalStandard, setIsInternalStandard] = useState(false);
  const [category, setCategory] = useState('Operational Standard');
  const [reviewNotes, setReviewNotes] = useState('');
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleToggleSite = (siteId: string) => {
    setSelectedSiteIds(prev =>
      prev.includes(siteId) ? prev.filter(id => id !== siteId) : [...prev, siteId]
    );
  };

  const handleSelectAllSites = () => {
    setSelectedSiteIds(appState.sites.map(s => s.id));
  };

  const handlePresetInternal = () => {
    setIsInternalStandard(true);
    setTitle('[Sample Internal Obligation] Pressure Line Clamp Cyclic Recalibration Verification');
    setSourceReference('Exousia Maintenance Operating Directive MOD-09');
    setRegulatorOrAuthority('Exousia Internal Asset Integrity Department');
    setCategory('Internal Company Maintenance Standard');
    setComplianceState('not_assessed');
    setDueDate('2026-11-20');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Obligation title is required.';
    if (!sourceReference.trim()) newErrors.sourceReference = 'Source standard or policy reference is required.';
    if (!regulatorOrAuthority.trim()) newErrors.regulatorOrAuthority = 'Authority or governing body is required.';
    if (selectedSiteIds.length === 0) newErrors.sites = 'At least one operating site must be assigned.';
    if (!ownerId) newErrors.owner = 'Accountable custodian is required.';
    if (!dueDate) newErrors.dueDate = 'Recertification or review due date is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const created = hseDataService.createComplianceObligation({
      title: title.trim(),
      sourceReference: sourceReference.trim(),
      regulatorOrAuthority: regulatorOrAuthority.trim(),
      applicableSiteIds: selectedSiteIds,
      ownerId,
      dueDate,
      complianceState,
      isInternalStandard,
      category,
      reviewNotes: reviewNotes.trim() || undefined,
      evidenceFileName: evidenceFileName.trim() || undefined
    });

    if (onCreated) onCreated(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-xl shadow-2xl border border-[#DDE5DF] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5DF] bg-[#F7F9F7]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#007A44]/10 text-[#007A44] rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#15251C]">
                Register Compliance Obligation
              </h2>
              <p className="text-xs text-[#5D6961]">
                Track statutory permits, regulations, or clearly labeled internal operational standards.
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

        {/* Preset Helper Strip */}
        <div className="px-6 py-2.5 bg-[#EEF7F2] border-b border-[#BDE3CE] flex items-center justify-between text-xs">
          <span className="text-[#007A44]">
            Grounded standards only: Do not invent external laws. Use sample internal company standards.
          </span>
          <button
            type="button"
            onClick={handlePresetInternal}
            className="text-xs font-semibold text-[#007A44] hover:underline"
          >
            + Load Sample Internal Obligation
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Obligation Title */}
          <div>
            <label className="font-semibold text-[#15251C] block mb-1">
              Obligation Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. [Sample Internal Obligation] Pressure Relief Valve Bench Test & Tagging Protocol"
              className={`w-full p-2.5 rounded-lg border bg-white ${
                errors.title ? 'border-[#B42318]' : 'border-[#DDE5DF]'
              } focus:border-[#007A44] focus:outline-hidden`}
            />
            {errors.title && <p className="text-[#B42318] text-[11px] mt-1">{errors.title}</p>}
          </div>

          {/* Reference & Authority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                Source Reference (Standard / Directive / Permit) *
              </label>
              <input
                type="text"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                placeholder="e.g. Exousia Corporate HSE Standard SOP-HSE-014"
                className={`w-full p-2.5 rounded-lg border bg-white ${
                  errors.sourceReference ? 'border-[#B42318]' : 'border-[#DDE5DF]'
                } focus:border-[#007A44] focus:outline-hidden`}
              />
              {errors.sourceReference && (
                <p className="text-[#B42318] text-[11px] mt-1">{errors.sourceReference}</p>
              )}
            </div>

            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                Governing Authority / Department *
              </label>
              <input
                type="text"
                value={regulatorOrAuthority}
                onChange={(e) => setRegulatorOrAuthority(e.target.value)}
                placeholder="e.g. Exousia Internal Asset Integrity Department"
                className={`w-full p-2.5 rounded-lg border bg-white ${
                  errors.regulatorOrAuthority ? 'border-[#B42318]' : 'border-[#DDE5DF]'
                } focus:border-[#007A44] focus:outline-hidden`}
              />
              {errors.regulatorOrAuthority && (
                <p className="text-[#B42318] text-[11px] mt-1">{errors.regulatorOrAuthority}</p>
              )}
            </div>
          </div>

          {/* Category & Internal Flag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                Standard Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Internal Safety Policy, Asset Integrity, Permitting"
                className="w-full p-2.5 rounded-lg border border-[#DDE5DF] bg-white focus:border-[#007A44] focus:outline-hidden"
              />
            </div>

            <div className="pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternalStandard}
                  onChange={(e) => setIsInternalStandard(e.target.checked)}
                  className="rounded text-[#007A44] focus:ring-[#007A44]"
                />
                <span className="font-semibold text-[#15251C]">
                  Mark as Sample Internal Obligation (Company Policy / SOP)
                </span>
              </label>
              <span className="text-[10px] text-[#5D6961] block ml-6 mt-0.5">
                Clearly distinguishes company operational standards from statutory decrees.
              </span>
            </div>
          </div>

          {/* Applicable Sites */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-[#15251C]">
                Applicable Operational Sites *
              </label>
              <button
                type="button"
                onClick={handleSelectAllSites}
                className="text-[11px] text-[#007A44] font-semibold hover:underline"
              >
                Select All Sites
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

          {/* Owner & Due Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                Assigned Custodian / Owner *
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className={`w-full p-2.5 rounded-lg border bg-white ${
                  errors.owner ? 'border-[#B42318]' : 'border-[#DDE5DF]'
                }`}
              >
                {appState.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.roleTitle})
                  </option>
                ))}
              </select>
              {errors.owner && <p className="text-[#B42318] text-[11px] mt-1">{errors.owner}</p>}
            </div>

            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                Recertification / Review Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full p-2.5 rounded-lg border bg-white ${
                  errors.dueDate ? 'border-[#B42318]' : 'border-[#DDE5DF]'
                }`}
              />
              {errors.dueDate && <p className="text-[#B42318] text-[11px] mt-1">{errors.dueDate}</p>}
              <span className="text-[10px] text-[#5D6961] block mt-1">
                Notice: A future deadline does NOT automatically imply compliance.
              </span>
            </div>
          </div>

          {/* Initial Assessed Compliance State */}
          <div className="p-3.5 bg-[#F0F9FF] border border-[#B9E6FE] rounded-lg space-y-2">
            <span className="font-semibold text-[#026AA2] block">
              Separation of State: Assessed Compliance Outcome
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`p-2.5 rounded-lg border cursor-pointer text-center ${
                  complianceState === 'compliant'
                    ? 'bg-white border-[#007A44] text-[#007A44] font-bold shadow-2xs'
                    : 'bg-white/60 border-[#DDE5DF] text-[#5D6961]'
                }`}
              >
                <input
                  type="radio"
                  name="complianceState"
                  value="compliant"
                  checked={complianceState === 'compliant'}
                  onChange={() => setComplianceState('compliant')}
                  className="sr-only"
                />
                Compliant (Audited)
              </label>

              <label
                className={`p-2.5 rounded-lg border cursor-pointer text-center ${
                  complianceState === 'non_compliant'
                    ? 'bg-white border-[#B42318] text-[#B42318] font-bold shadow-2xs'
                    : 'bg-white/60 border-[#DDE5DF] text-[#5D6961]'
                }`}
              >
                <input
                  type="radio"
                  name="complianceState"
                  value="non_compliant"
                  checked={complianceState === 'non_compliant'}
                  onChange={() => setComplianceState('non_compliant')}
                  className="sr-only"
                />
                Non-Compliant (Deficiency)
              </label>

              <label
                className={`p-2.5 rounded-lg border cursor-pointer text-center ${
                  complianceState === 'not_assessed'
                    ? 'bg-white border-[#5D6961] text-[#15251C] font-bold shadow-2xs'
                    : 'bg-white/60 border-[#DDE5DF] text-[#5D6961]'
                }`}
              >
                <input
                  type="radio"
                  name="complianceState"
                  value="not_assessed"
                  checked={complianceState === 'not_assessed'}
                  onChange={() => setComplianceState('not_assessed')}
                  className="sr-only"
                />
                Not Assessed (Pending)
              </label>
            </div>
          </div>

          {/* Initial Review Notes & Evidence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                Baseline Assessment Notes
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Record baseline inspection observations or audit trail notes..."
                className="w-full p-2 text-xs border border-[#DDE5DF] rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                Initial Evidence Certificate / Document Name
              </label>
              <input
                type="text"
                value={evidenceFileName}
                onChange={(e) => setEvidenceFileName(e.target.value)}
                placeholder="e.g. pressure_relief_valve_calib_cert_2026.pdf"
                className="w-full p-2 text-xs border border-[#DDE5DF] rounded-lg bg-white font-mono"
              />
              <span className="text-[10px] text-[#5D6961] block mt-1">
                Mock attachment added to evidentiary archive.
              </span>
            </div>
          </div>

          {/* Footer Controls */}
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
              <Plus className="w-4 h-4" />
              <span>Register Obligation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
