import React, { useState, useEffect } from 'react';
import { HSEAppState, hseDataService } from '../services/hseDataService';
import { ActionItem, RiskBand } from '../types/hse';
import { X, CheckSquare, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

interface CreateActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: HSEAppState;
  preselectedSource?: {
    type: ActionItem['sourceType'];
    id: string;
    number: string;
    title: string;
    siteId?: string;
    category?: string;
  };
  onActionCreated?: (newAction: ActionItem) => void;
}

export const CreateActionModal: React.FC<CreateActionModalProps> = ({
  isOpen,
  onClose,
  appState,
  preselectedSource,
  onActionCreated
}) => {
  const [sourceType, setSourceType] = useState<ActionItem['sourceType']>('incident');
  const [sourceId, setSourceId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState<'corrective' | 'preventive'>('corrective');
  const [ownerId, setOwnerId] = useState('');
  const [dueDate, setDueDate] = useState('2026-10-15');
  const [priority, setPriority] = useState<RiskBand>('medium');
  const [siteId, setSiteId] = useState('');
  const [findingCategory, setFindingCategory] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (preselectedSource) {
      setSourceType(preselectedSource.type);
      setSourceId(preselectedSource.id);
      if (preselectedSource.siteId) setSiteId(preselectedSource.siteId);
      if (preselectedSource.category) setFindingCategory(preselectedSource.category);
    } else {
      // Default to first report if available
      const firstReport = appState.reports[0];
      if (firstReport) {
        setSourceType(firstReport.type === 'incident' ? 'incident' : firstReport.type === 'near_miss' ? 'near_miss' : 'hazard');
        setSourceId(firstReport.id);
        setSiteId(firstReport.siteId);
      }
    }

    // Default owner to first action_owner or supervisor
    const defaultOwner = appState.users.find(u => u.role === 'action_owner') || appState.users[0];
    if (defaultOwner) setOwnerId(defaultOwner.id);

    setErrors({});
  }, [isOpen, preselectedSource, appState]);

  // Update site automatically when source changes
  const handleSourceSelect = (selectedId: string) => {
    setSourceId(selectedId);
    if (sourceType === 'inspection') {
      const insp = appState.inspections.find(i => i.id === selectedId);
      if (insp) setSiteId(insp.siteId);
    } else if (sourceType === 'compliance') {
      const cmp = appState.compliance.find(c => c.id === selectedId);
      if (cmp && cmp.applicableSiteIds.length > 0) setSiteId(cmp.applicableSiteIds[0]);
    } else {
      const rep = appState.reports.find(r => r.id === selectedId);
      if (rep) {
        setSiteId(rep.siteId);
        if (rep.classification?.band) {
          setPriority(rep.classification.band);
        }
        if (rep.classification?.category) {
          setFindingCategory(rep.classification.category);
        }
      }
    }
  };

  if (!isOpen) return null;

  // Filter sources based on sourceType
  const sourceOptions = (() => {
    if (sourceType === 'inspection') {
      return appState.inspections.map(i => ({
        id: i.id,
        number: i.inspectionNumber,
        title: i.title,
        siteId: i.siteId
      }));
    }
    if (sourceType === 'compliance') {
      return appState.compliance.map(c => ({
        id: c.id,
        number: c.obligationNumber,
        title: c.title,
        siteId: c.applicableSiteIds[0] || 'site-4'
      }));
    }
    // incidents, near_miss, hazard
    return appState.reports
      .filter(r => r.type === sourceType)
      .map(r => ({
        id: r.id,
        number: r.reportNumber,
        title: r.title,
        siteId: r.siteId,
        band: r.classification?.band,
        category: r.classification?.category
      }));
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!sourceId) newErrors.sourceId = 'Source record is mandatory.';
    if (!title.trim()) newErrors.title = 'Action title is required.';
    if (!description.trim()) newErrors.description = 'Remediation description is required.';
    if (!ownerId) newErrors.ownerId = 'Assigned action owner is mandatory.';
    if (!dueDate) newErrors.dueDate = 'Target completion due date is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedSource = sourceOptions.find(s => s.id === sourceId);
    const sourceNumber = selectedSource ? selectedSource.number : `${sourceType.toUpperCase()}-REF`;

    const effectiveSiteId = siteId || selectedSource?.siteId || appState.sites[0].id;

    const newAction = hseDataService.createAction({
      title: title.trim(),
      description: description.trim(),
      actionType,
      sourceType,
      sourceId,
      sourceNumber,
      siteId: effectiveSiteId,
      ownerId,
      dueDate,
      priority,
      findingCategory: findingCategory || undefined
    });

    if (onActionCreated) {
      onActionCreated(newAction);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-[#DDE5DF] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5DF] bg-[#F7F9F7]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#007A44]/10 text-[#007A44] rounded-lg">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#15251C]">
                Create Corrective or Preventive Action (CAPA)
              </h2>
              <p className="text-xs text-[#5D6961]">
                Assign accountable remediation tasks linked to verified HSE observations, inspections, or obligations.
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
          {/* Source Selection Banner */}
          <div className="bg-[#EEF7F2] p-3.5 rounded-lg border border-[#BDE3CE] space-y-2">
            <span className="font-semibold text-[#007A44] block">
              1. Source Record Relationship (Mandatory Governance Requirement)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[#5D6961] block mb-1 font-medium">Source Type:</label>
                <select
                  value={sourceType}
                  onChange={(e) => {
                    const newType = e.target.value as ActionItem['sourceType'];
                    setSourceType(newType);
                    setSourceId('');
                  }}
                  className="w-full text-xs p-2 rounded-lg border border-[#DDE5DF] bg-white text-[#15251C]"
                >
                  <option value="incident">Incident Report</option>
                  <option value="near_miss">Near Miss Observation</option>
                  <option value="hazard">Hazard Identification</option>
                  <option value="inspection">Inspection Finding</option>
                  <option value="compliance">Compliance Obligation</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[#5D6961] block mb-1 font-medium">Linked Source Record:</label>
                <select
                  value={sourceId}
                  onChange={(e) => handleSourceSelect(e.target.value)}
                  className={`w-full text-xs p-2 rounded-lg border bg-white text-[#15251C] ${
                    errors.sourceId ? 'border-[#B42318]' : 'border-[#DDE5DF]'
                  }`}
                >
                  <option value="">Select source record...</option>
                  {sourceOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.number}: {s.title}
                    </option>
                  ))}
                </select>
                {errors.sourceId && (
                  <p className="text-[#B42318] text-[11px] mt-1">{errors.sourceId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Type Toggle */}
          <div>
            <label className="font-semibold text-[#15251C] block mb-1.5">
              2. Action Type (Mandatory):
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  actionType === 'corrective'
                    ? 'border-[#007A44] bg-[#EEF7F2]/50 text-[#15251C]'
                    : 'border-[#DDE5DF] bg-white text-[#5D6961]'
                }`}
              >
                <input
                  type="radio"
                  name="actionType"
                  value="corrective"
                  checked={actionType === 'corrective'}
                  onChange={() => setActionType('corrective')}
                  className="mt-0.5 text-[#007A44] focus:ring-[#007A44]"
                />
                <div>
                  <span className="font-semibold block text-xs">Corrective Action</span>
                  <span className="text-[11px] text-[#5D6961] block">
                    Remediate existing deficiency, hazard, non-conformance, or failure.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  actionType === 'preventive'
                    ? 'border-[#007A44] bg-[#EEF7F2]/50 text-[#15251C]'
                    : 'border-[#DDE5DF] bg-white text-[#5D6961]'
                }`}
              >
                <input
                  type="radio"
                  name="actionType"
                  value="preventive"
                  checked={actionType === 'preventive'}
                  onChange={() => setActionType('preventive')}
                  className="mt-0.5 text-[#007A44] focus:ring-[#007A44]"
                />
                <div>
                  <span className="font-semibold block text-xs">Preventive Action</span>
                  <span className="text-[11px] text-[#5D6961] block">
                    Proactive control to eliminate root cause and prevent recurrence.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Action Title */}
          <div>
            <label className="font-semibold text-[#15251C] block mb-1">
              3. Action Title (Clear, Remediable Scope) *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Procure and fit ASME-rated ballistic shield wrap on Hydro Cell #1"
              className={`w-full p-2.5 text-xs rounded-lg border bg-white ${
                errors.title ? 'border-[#B42318]' : 'border-[#DDE5DF]'
              } focus:border-[#007A44] focus:outline-hidden`}
            />
            {errors.title && <p className="text-[#B42318] text-[11px] mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="font-semibold text-[#15251C] block mb-1">
              4. Detailed Remediation Description & Acceptance Criteria *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify the engineering steps, procurement specifications, testing protocol, and documentation required for closure sign-off..."
              className={`w-full p-2.5 text-xs rounded-lg border bg-white ${
                errors.description ? 'border-[#B42318]' : 'border-[#DDE5DF]'
              } focus:border-[#007A44] focus:outline-hidden`}
            />
            {errors.description && (
              <p className="text-[#B42318] text-[11px] mt-1">{errors.description}</p>
            )}
          </div>

          {/* Owner & Due Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                5. Assigned Action Owner *
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className={`w-full text-xs p-2.5 rounded-lg border bg-white ${
                  errors.ownerId ? 'border-[#B42318]' : 'border-[#DDE5DF]'
                }`}
              >
                <option value="">Select accountable owner...</option>
                {appState.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.roleTitle} · {u.department})
                  </option>
                ))}
              </select>
              {errors.ownerId && (
                <p className="text-[#B42318] text-[11px] mt-1">{errors.ownerId}</p>
              )}
              <span className="text-[10px] text-[#5D6961] mt-1 block">
                Two-person rule: Assigned owner cannot self-verify action closure.
              </span>
            </div>

            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                6. Target Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full text-xs p-2.5 rounded-lg border bg-white ${
                  errors.dueDate ? 'border-[#B42318]' : 'border-[#DDE5DF]'
                }`}
              />
              {errors.dueDate && (
                <p className="text-[#B42318] text-[11px] mt-1">{errors.dueDate}</p>
              )}
              <span className="text-[10px] text-[#5D6961] mt-1 block">
                Actions past deadline without verified closure are flagged Overdue.
              </span>
            </div>
          </div>

          {/* Priority & Site */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#DDE5DF]">
            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                Action Priority / Risk Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as RiskBand)}
                className="w-full text-xs p-2.5 rounded-lg border border-[#DDE5DF] bg-white text-[#15251C]"
              >
                <option value="low">Low Priority (Routine controls)</option>
                <option value="medium">Medium Priority (Specific action required)</option>
                <option value="high">High Priority (Expedited CAPA)</option>
                <option value="critical">Critical Priority (Immediate stop-work)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#15251C] block mb-1">Operating Facility / Site</label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[#DDE5DF] bg-white text-[#15251C]"
              >
                {appState.sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
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
              <CheckSquare className="w-4 h-4" />
              <span>Create Action Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
