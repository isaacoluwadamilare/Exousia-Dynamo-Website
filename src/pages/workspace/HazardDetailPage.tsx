import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { hseDataService, HSEAppState, calculateRisk } from '../../services/hseDataService';
import { StatusBadge, RiskBadge, Badge } from '../../components/Badge';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Paperclip,
  History,
  Edit3,
  Lock,
  Info,
  ShieldCheck
} from 'lucide-react';

interface HazardDetailPageProps {
  appState: HSEAppState;
}

export const HazardDetailPage: React.FC<HazardDetailPageProps> = ({ appState }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const hazard = appState.reports.find(r => r.id === id && r.type === 'hazard');

  // Classification state
  const [severity, setSeverity] = useState(hazard?.classification?.severity || 2);
  const [likelihood, setLikelihood] = useState(hazard?.classification?.likelihood || 3);
  const [rationale, setRationale] = useState(hazard?.classification?.rationale || '');
  const [category, setCategory] = useState(hazard?.classification?.category || appState.matrixConfig.findingCategories[0]);
  const [isEditingRisk, setIsEditingRisk] = useState(false);

  // Correction state
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionField, setCorrectionField] = useState('title');
  const [correctedValue, setCorrectedValue] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  // Quick Action creation modal state
  const [showCreateAction, setShowCreateAction] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionOwnerId, setActionOwnerId] = useState(appState.users[2]?.id || '');
  const [actionDueDate, setActionDueDate] = useState('2026-10-15');

  if (!hazard) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[#DDE5DF] max-w-lg mx-auto">
        <h2 className="text-lg font-semibold text-[#15251C]">Observation not found</h2>
        <p className="text-xs text-[#5D6961] mt-1">The requested hazard record does not exist or has been removed.</p>
        <Link to="/app/hazards" className="mt-4 inline-block text-xs text-[#007A44] font-semibold underline">
          Return to Hazard Observations Register
        </Link>
      </div>
    );
  }

  const linkedActions = appState.actions.filter(a => a.sourceId === hazard.id || hazard.linkedActionIds.includes(a.id));
  const currentRisk = calculateRisk(severity, likelihood);
  const canManageHSE = ['hse_officer', 'hse_manager', 'admin'].includes(appState.currentUser.role);

  const hazardAuditLogs = appState.auditLogs.filter(
    l => l.entityId === hazard.id || l.entityNumber === hazard.reportNumber
  );

  const handleSaveRisk = () => {
    const res = hseDataService.updateReportClassification(hazard.id, severity, likelihood, rationale, category);
    if (!res?.success && res?.error) {
      alert(res.error);
    } else {
      setIsEditingRisk(false);
    }
  };

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTitle.trim()) return;

    hseDataService.createAction({
      title: actionTitle,
      description: `Remediation action for hazard observation ${hazard.reportNumber}: ${hazard.title}`,
      actionType: 'corrective',
      sourceType: 'hazard',
      sourceId: hazard.id,
      sourceNumber: hazard.reportNumber,
      siteId: hazard.siteId,
      ownerId: actionOwnerId,
      dueDate: actionDueDate,
      priority: currentRisk.band
    });

    setShowCreateAction(false);
    setActionTitle('');
  };

  const handleRecordCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctedValue.trim() || !correctionReason.trim()) return;

    const originalVal =
      correctionField === 'title'
        ? hazard.title
        : correctionField === 'specificLocation'
        ? hazard.specificLocation
        : correctionField === 'description'
        ? hazard.description
        : hazard.immediateActionTaken || '';

    hseDataService.recordCorrection(hazard.id, {
      field: correctionField,
      originalValue: originalVal,
      correctedValue: correctedValue.trim(),
      reason: correctionReason.trim()
    });

    setShowCorrectionModal(false);
    setCorrectedValue('');
    setCorrectionReason('');
  };

  const handleCloseHazard = () => {
    if (window.confirm('Close this hazard observation as remediated?')) {
      hseDataService.closeReport(hazard.id, 'Hazard eliminated / mitigated following supervisory verification.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg border border-[#DDE5DF] bg-white text-[#5D6961] hover:text-[#15251C] transition-colors focus-visible:ring-2 focus-visible:ring-[#007A44]"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#15251C]">{hazard.reportNumber}</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]">
                HAZARD OBSERVATION
              </span>
              <StatusBadge status={hazard.status} />
              {hazard.corrections && hazard.corrections.length > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FEF6EE] text-[#B54708] border border-[#F9DBAF]">
                  {hazard.corrections.length} Amendment{hazard.corrections.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-[#15251C] mt-1">{hazard.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManageHSE && hazard.status !== 'closed' && (
            <>
              <button
                onClick={() => setShowCorrectionModal(true)}
                className="px-3 py-2 bg-white border border-[#DDE5DF] hover:border-[#007A44] text-[#15251C] hover:text-[#007A44] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#007A44]" />
                <span>Record Correction</span>
              </button>
              <button
                onClick={handleCloseHazard}
                className="px-4 py-2 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Remediated</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 1. Submitted Facts Card (Locked) */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#007A44]" />
            <h2 className="text-sm font-semibold text-[#15251C]">
              Original Submitted Facts
            </h2>
          </div>
          <span className="text-[11px] text-[#5D6961] bg-[#F7F9F7] px-2.5 py-0.5 rounded border border-[#DDE5DF]">
            Locked Baseline Observation
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-[#5D6961] block">Operational Site:</span>
            <span className="font-semibold text-[#15251C] flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#007A44]" />
              {hazard.siteName}
            </span>
          </div>
          <div>
            <span className="text-[#5D6961] block">Specific Location:</span>
            <span className="font-semibold text-[#15251C] mt-0.5 block">{hazard.specificLocation}</span>
          </div>
          <div>
            <span className="text-[#5D6961] block">Observation Date & Time:</span>
            <span className="font-semibold text-[#15251C] flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-[#5D6961]" />
              {new Date(hazard.occurredAt).toLocaleString('en-GB')}
            </span>
          </div>
        </div>

        <div>
          <span className="text-xs text-[#5D6961] block mb-1">Observation Description:</span>
          <div className="p-3.5 bg-[#F7F9F7] rounded-lg text-xs text-[#15251C] border border-[#DDE5DF] leading-relaxed">
            {hazard.description}
          </div>
        </div>

        {hazard.immediateActionTaken && (
          <div>
            <span className="text-xs text-[#5D6961] block mb-1">Immediate Actions Taken:</span>
            <div className="p-3 bg-[#EEF7F2] rounded-lg text-xs text-[#007A44] border border-[#BDE3CE]">
              {hazard.immediateActionTaken}
            </div>
          </div>
        )}

        <div className="pt-2 text-[11px] text-[#5D6961] flex flex-wrap items-center justify-between gap-2 border-t border-[#DDE5DF]">
          <span>Logged by: <strong>{hazard.reporterName}</strong> on {new Date(hazard.reportedAt).toLocaleDateString('en-GB')}</span>
          <span className="font-mono text-[10px] text-[#5D6961]">ID: {hazard.id}</span>
        </div>
      </div>

      {/* Corrections Log (if any exist) */}
      {hazard.corrections && hazard.corrections.length > 0 && (
        <div className="bg-white rounded-xl border border-[#FEDF89] bg-[#FFFAEB]/30 p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-[#FEDF89] text-xs font-semibold text-[#B54708]">
            <Edit3 className="w-4 h-4" />
            <span>Technical Corrections & Amendments Log</span>
          </div>
          <div className="space-y-2">
            {hazard.corrections.map((cor) => (
              <div key={cor.id} className="p-3 rounded-lg bg-white border border-[#FEDF89] text-xs space-y-1">
                <div className="flex items-center justify-between text-[#5D6961]">
                  <span className="font-semibold text-[#15251C]">Field: {cor.field}</span>
                  <span className="text-[10px]">{new Date(cor.timestamp).toLocaleString('en-GB')} by {cor.authorName} ({cor.authorRole})</span>
                </div>
                <div className="text-[11px]">
                  <span className="text-[#5D6961] line-through mr-2">{cor.originalValue}</span>
                  <span className="text-[#007A44] font-semibold">→ {cor.correctedValue}</span>
                </div>
                <div className="text-[11px] text-[#B54708]">
                  <strong>Justification:</strong> {cor.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Risk Classification */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
          <div>
            <h2 className="text-sm font-semibold text-[#15251C] flex items-center gap-2">
              <span>5 × 5 Risk Matrix & Finding Classification</span>
              <span className="text-[10px] bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89] px-2 py-0.5 rounded font-mono">
                {hazard.classification?.matrixVersion || appState.matrixConfig.version} (Provisional Scheme)
              </span>
            </h2>
            <p className="text-xs text-[#5D6961]">
              Severity (1–5) × Likelihood (1–5) = Score (1–25). Evaluated against approved industrial consequence criteria.
            </p>
          </div>
          {canManageHSE && !isEditingRisk && (
            <button
              onClick={() => setIsEditingRisk(true)}
              className="text-xs font-semibold text-[#007A44] hover:underline"
            >
              Update Classification
            </button>
          )}
        </div>

        {!isEditingRisk ? (
          <div className="p-4 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-[11px] text-[#5D6961]">Calculated Score</div>
                  <div className="text-2xl font-mono font-bold text-[#15251C]">
                    {hazard.classification?.score || 'Not Scored'} <span className="text-xs text-[#5D6961]">/ 25</span>
                  </div>
                </div>
                <div className="border-l border-[#DDE5DF] pl-4">
                  <div className="text-[11px] text-[#5D6961] mb-1">Risk Band</div>
                  <RiskBadge
                    band={hazard.classification?.band}
                    score={hazard.classification?.score}
                    matrixVersion={hazard.classification?.matrixVersion}
                    showDetails
                  />
                </div>
              </div>

              {hazard.classification?.category && (
                <div className="sm:text-right">
                  <div className="text-[11px] text-[#5D6961]">Finding Category</div>
                  <span className="inline-block mt-0.5 text-xs font-semibold px-2.5 py-0.5 rounded bg-white border border-[#DDE5DF] text-[#15251C]">
                    {hazard.classification.category}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#DDE5DF] text-xs">
              <span className="text-[#5D6961] block mb-0.5">Classification Rationale:</span>
              <div className="text-[#15251C] leading-relaxed">
                {hazard.classification?.rationale || 'Awaiting formal review by authorized HSE Officer.'}
              </div>
            </div>

            <div className="pt-2 border-t border-[#DDE5DF] flex flex-wrap items-center justify-between text-[11px] text-[#5D6961]">
              <span>
                Classified by: <strong>{hazard.classification?.classifiedBy || 'Pending HSE confirmation'}</strong>
                {hazard.classification?.classifiedAt && ` on ${new Date(hazard.classification.classifiedAt).toLocaleDateString('en-GB')}`}
              </span>
              <span className="text-[#B54708] font-medium">
                {hazard.classification?.isProvisional ? 'Provisional Baseline (Pending Client Committee Sign-Off)' : 'Client Committee Approved'}
              </span>
            </div>

            <div className="pt-2 border-t border-[#DDE5DF] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5D6961]">
              <span className="font-mono text-[10px] bg-white border border-[#DDE5DF] px-2 py-0.5 rounded text-[#15251C]">
                Scheme Retained: <strong>{hazard.classification?.matrixVersion || appState.matrixConfig.version}</strong>
              </span>
              <span className="text-[10px] text-[#5D6961]">
                Formula Verified: <strong>Severity ({hazard.classification?.severity}) × Likelihood ({hazard.classification?.likelihood}) = Score {hazard.classification?.score}</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[#EEF7F2]/50 border border-[#BDE3CE] rounded-lg space-y-4 text-xs">
            <div className="p-2.5 bg-white rounded-lg border border-[#BDE3CE] text-[#007A44] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                <strong>Human HSE Reviewer Mandate:</strong> Confirmed by authorized human HSE reviewer (<strong>{appState.currentUser.name}</strong>, {appState.currentUser.roleTitle}). Automated AI evaluations strictly prohibited.
              </span>
            </div>

            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                Finding Defect Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE5DF] rounded-lg bg-white text-xs"
              >
                {appState.matrixConfig.findingCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-[#15251C] block mb-1">
                  Severity: {severity} — {appState.matrixConfig.severities.find(s => s.level === severity)?.label}
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full accent-[#007A44]"
                />
                <p className="text-[11px] text-[#5D6961] mt-0.5">
                  {appState.matrixConfig.severities.find(s => s.level === severity)?.description}
                </p>
              </div>

              <div>
                <label className="font-semibold text-[#15251C] block mb-1">
                  Likelihood: {likelihood} — {appState.matrixConfig.likelihoods.find(l => l.level === likelihood)?.label}
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={likelihood}
                  onChange={(e) => setLikelihood(Number(e.target.value))}
                  className="w-full accent-[#007A44]"
                />
                <p className="text-[11px] text-[#5D6961] mt-0.5">
                  {appState.matrixConfig.likelihoods.find(l => l.level === likelihood)?.description}
                </p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#BDE3CE] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                Calculated Score: <strong>{severity} × {likelihood} = {currentRisk.score}</strong> / 25
              </span>
              <RiskBadge band={currentRisk.band} score={currentRisk.score} showDetails />
            </div>

            <div>
              <label className="font-semibold text-[#15251C] block mb-1">Classification Rationale *</label>
              <textarea
                rows={2}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Explain justification for risk score based on observed conditions, engineering controls, and personnel exposure..."
                className="w-full p-2.5 border border-[#DDE5DF] rounded-lg bg-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#BDE3CE]">
              <button
                type="button"
                onClick={() => setIsEditingRisk(false)}
                className="px-3 py-1.5 text-xs text-[#5D6961] hover:text-[#15251C]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRisk}
                className="px-4 py-1.5 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold rounded-lg shadow-2xs"
              >
                Confirm Human Review Rating
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Assigned Remediation Actions */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
          <div>
            <h2 className="text-sm font-semibold text-[#15251C]">
              Linked Remediation Actions ({linkedActions.length})
            </h2>
            <p className="text-xs text-[#5D6961]">
              Contract requirement 1.6 & 1.7: Corrective tasks linked directly to observed hazard conditions.
            </p>
          </div>
          {canManageHSE && (
            <button
              onClick={() => setShowCreateAction(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#007A44] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Remediation Action</span>
            </button>
          )}
        </div>

        {showCreateAction && (
          <form onSubmit={handleCreateAction} className="p-4 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF] space-y-3 text-xs">
            <h3 className="font-semibold text-[#15251C]">Assign Corrective Action</h3>
            <div>
              <label className="block text-[#5D6961] mb-1">Action Title *</label>
              <input
                type="text"
                required
                value={actionTitle}
                onChange={(e) => setActionTitle(e.target.value)}
                placeholder="e.g. Fabricate and install replacement valve guard"
                className="w-full px-3 py-1.5 border border-[#DDE5DF] rounded bg-white text-xs"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#5D6961] mb-1">Assignee / Owner *</label>
                <select
                  value={actionOwnerId}
                  onChange={(e) => setActionOwnerId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#DDE5DF] rounded bg-white text-xs"
                >
                  {appState.users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.roleTitle})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#5D6961] mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={actionDueDate}
                  onChange={(e) => setActionDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#DDE5DF] rounded bg-white text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateAction(false)}
                className="px-3 py-1 text-xs text-[#5D6961]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold rounded"
              >
                Assign Action
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-[#DDE5DF]">
          {linkedActions.length === 0 ? (
            <div className="py-4 text-xs text-[#5D6961] text-center">
              No remediation actions currently linked to this observation.
            </div>
          ) : (
            linkedActions.map((act) => (
              <div key={act.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-[#15251C]">{act.actionNumber}</span>
                    <StatusBadge status={act.status} />
                  </div>
                  <div className="font-medium text-[#15251C] mt-1">{act.title}</div>
                  <div className="text-[#5D6961] text-[11px] mt-0.5">
                    Owner: <strong>{act.ownerName}</strong> · Due: {act.dueDate}
                  </div>
                </div>

                <Link
                  to={`/app/actions/${act.id}`}
                  className="px-3 py-1 rounded border border-[#DDE5DF] hover:bg-[#F7F9F7] font-semibold text-[#007A44] self-start sm:self-auto"
                >
                  Manage
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Simulated Evidence & Attachments */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-[#007A44]" />
            <h2 className="text-sm font-semibold text-[#15251C]">
              Supporting Evidence ({hazard.attachments.length})
            </h2>
          </div>
          <span className="text-[10px] font-bold text-[#B54708] bg-[#FEF6EE] border border-[#F9DBAF] px-2 py-0.5 rounded">
            SIMULATED EVIDENCE
          </span>
        </div>

        {hazard.attachments.length === 0 ? (
          <div className="text-xs text-[#5D6961] italic py-3 text-center">
            No photographic evidence attached to this observation.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hazard.attachments.map((att) => (
              <div key={att.id} className="p-3 rounded-lg border border-[#DDE5DF] bg-[#F7F9F7] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded bg-white border border-[#DDE5DF] text-[#007A44] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-[#15251C] truncate">{att.name}</div>
                    <div className="text-[10px] text-[#5D6961]">
                      {(att.sizeBytes / 1024).toFixed(0)} KB · Logged by {att.uploadedBy}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-[#DDE5DF] text-[#5D6961] shrink-0">
                  Local Record
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Chronological History & Audit Log */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#007A44]" />
            <h2 className="text-sm font-semibold text-[#15251C]">
              Operational History & Audit Trail
            </h2>
          </div>
          <span className="text-xs text-[#5D6961]">{hazardAuditLogs.length} Events</span>
        </div>

        {hazardAuditLogs.length === 0 ? (
          <div className="text-xs text-[#5D6961] italic py-2">No separate audit events recorded.</div>
        ) : (
          <div className="relative border-l border-[#DDE5DF] ml-3 space-y-4 text-xs">
            {hazardAuditLogs.map((log) => (
              <div key={log.id} className="relative pl-6">
                <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#007A44] ring-4 ring-white" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-semibold text-[#15251C]">{log.action}</span>
                  <span className="text-[10px] text-[#5D6961] font-mono">
                    {new Date(log.timestamp).toLocaleString('en-GB')}
                  </span>
                </div>
                <div className="text-[#37473F] mt-0.5">{log.summary}</div>
                <div className="text-[10px] text-[#5D6961] mt-0.5">
                  Actor: <strong>{log.actorName}</strong> ({log.actorRole.replace('_', ' ')})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Recording Formal Correction */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <form
            onSubmit={handleRecordCorrectionSubmit}
            className="bg-white rounded-xl border border-[#DDE5DF] p-6 max-w-lg w-full space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
              <h3 className="text-sm font-semibold text-[#15251C] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#007A44]" />
                <span>Record Meaningful Technical Correction</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCorrectionModal(false)}
                className="text-[#5D6961] hover:text-[#15251C]"
              >
                ✕
              </button>
            </div>

            <p className="text-[#5D6961] leading-relaxed">
              Original submitted observation facts are preserved. Technical amendments are logged with author and reason.
            </p>

            <div>
              <label className="block font-semibold text-[#15251C] mb-1">Target Field to Correct *</label>
              <select
                value={correctionField}
                onChange={(e) => setCorrectionField(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE5DF] rounded-lg bg-white"
              >
                <option value="title">Title / Brief Summary</option>
                <option value="specificLocation">Specific Location</option>
                <option value="description">Observation Description</option>
                <option value="immediateActionTaken">Immediate Actions Taken</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#15251C] mb-1">Corrected Value *</label>
              <textarea
                rows={3}
                required
                value={correctedValue}
                onChange={(e) => setCorrectedValue(e.target.value)}
                placeholder="Enter rectified technical details..."
                className="w-full p-2.5 border border-[#DDE5DF] rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#15251C] mb-1">Operational Justification / Reason *</label>
              <input
                type="text"
                required
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="e.g. Updated exact valve number following physical verification"
                className="w-full px-3 py-2 border border-[#DDE5DF] rounded-lg"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#DDE5DF]">
              <button
                type="button"
                onClick={() => setShowCorrectionModal(false)}
                className="px-4 py-2 border border-[#DDE5DF] rounded-lg font-semibold text-[#5D6961]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#007A44] hover:bg-[#005D35] text-white rounded-lg font-semibold"
              >
                Commit Amendment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
