import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { hseDataService, HSEAppState, calculateRisk } from '../../services/hseDataService';
import { StatusBadge, RiskBadge, Badge } from '../../components/Badge';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Plus,
  FileText,
  Clock,
  Sparkles,
  Paperclip,
  History,
  Edit3,
  Lock,
  ExternalLink,
  Info,
  ShieldCheck
} from 'lucide-react';

interface IncidentDetailPageProps {
  appState: HSEAppState;
}

export const IncidentDetailPage: React.FC<IncidentDetailPageProps> = ({ appState }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const report = appState.reports.find(r => r.id === id);

  // States for classification editor
  const [severity, setSeverity] = useState(report?.classification?.severity || 3);
  const [likelihood, setLikelihood] = useState(report?.classification?.likelihood || 3);
  const [rationale, setRationale] = useState(report?.classification?.rationale || '');
  const [category, setCategory] = useState(report?.classification?.category || appState.matrixConfig.findingCategories[0]);
  const [isEditingRisk, setIsEditingRisk] = useState(false);

  // States for investigation editor
  const [rootCause, setRootCause] = useState(report?.rootCauseAnalysis || '');
  const [newFindingText, setNewFindingText] = useState('');
  const [findingsList, setFindingsList] = useState<string[]>(report?.investigationFindings || []);

  // State for recording correction
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionField, setCorrectionField] = useState('title');
  const [correctedValue, setCorrectedValue] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  // Quick Action creation modal state
  const [showCreateAction, setShowCreateAction] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionOwnerId, setActionOwnerId] = useState(appState.users[2]?.id || '');
  const [actionDueDate, setActionDueDate] = useState('2026-10-18');
  const [actionType, setActionType] = useState<'corrective' | 'preventive'>('corrective');

  if (!report) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[#DDE5DF] max-w-lg mx-auto">
        <h2 className="text-lg font-semibold text-[#15251C]">Report not found</h2>
        <p className="text-xs text-[#5D6961] mt-1">The requested HSE record does not exist or has been removed.</p>
        <Link to="/app/incidents" className="mt-4 inline-block text-xs text-[#007A44] font-semibold underline">
          Return to Incidents & Near Misses Register
        </Link>
      </div>
    );
  }

  const linkedActions = appState.actions.filter(a => a.sourceId === report.id || report.linkedActionIds.includes(a.id));
  const currentRisk = calculateRisk(severity, likelihood);

  // Audit history for this specific record
  const reportAuditLogs = appState.auditLogs.filter(
    l => l.entityId === report.id || l.entityNumber === report.reportNumber
  );

  const canManageHSE = ['hse_officer', 'hse_manager', 'admin'].includes(appState.currentUser.role);

  const handleSaveRisk = () => {
    const res = hseDataService.updateReportClassification(report.id, severity, likelihood, rationale, category);
    if (!res?.success && res?.error) {
      alert(res.error);
    } else {
      setIsEditingRisk(false);
    }
  };

  const handleAddFinding = () => {
    if (!newFindingText.trim()) return;
    const updated = [...findingsList, newFindingText.trim()];
    setFindingsList(updated);
    setNewFindingText('');
    hseDataService.updateInvestigation(report.id, updated, rootCause);
  };

  const handleSaveInvestigation = () => {
    hseDataService.updateInvestigation(report.id, findingsList, rootCause);
    alert('Investigation findings & root cause analysis recorded.');
  };

  const handleCreateLinkedAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTitle.trim()) return;

    hseDataService.createAction({
      title: actionTitle,
      description: `Follow-up ${actionType} action resulting from ${report.reportNumber} (${report.title}).`,
      actionType,
      sourceType: report.type === 'hazard' ? 'hazard' : report.type === 'near_miss' ? 'near_miss' : 'incident',
      sourceId: report.id,
      sourceNumber: report.reportNumber,
      siteId: report.siteId,
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
        ? report.title
        : correctionField === 'specificLocation'
        ? report.specificLocation
        : correctionField === 'description'
        ? report.description
        : report.immediateActionTaken || '';

    hseDataService.recordCorrection(report.id, {
      field: correctionField,
      originalValue: originalVal,
      correctedValue: correctedValue.trim(),
      reason: correctionReason.trim()
    });

    setShowCorrectionModal(false);
    setCorrectedValue('');
    setCorrectionReason('');
  };

  const handleCloseReport = () => {
    if (window.confirm('Are you sure you want to formally close this report? Linked actions and findings will be permanently archived.')) {
      hseDataService.closeReport(report.id, 'Formally closed following technical review and corrective action verification.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button & Title header */}
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
              <span className="font-mono text-xs font-bold text-[#15251C]">
                {report.reportNumber}
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                  report.type === 'incident'
                    ? 'bg-[#FFF0ED] text-[#B42318] border-[#FECDCA]'
                    : report.type === 'near_miss'
                    ? 'bg-[#EEF7F2] text-[#007A44] border-[#BDE3CE]'
                    : 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]'
                }`}
              >
                {report.type === 'incident' ? 'INCIDENT' : report.type === 'near_miss' ? 'NEAR MISS' : 'HAZARD OBSERVATION'}
              </span>
              <StatusBadge status={report.status} />
              {report.corrections && report.corrections.length > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FEF6EE] text-[#B54708] border border-[#F9DBAF]">
                  {report.corrections.length} Technical Amendment{report.corrections.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-[#15251C] mt-1">{report.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManageHSE && report.status !== 'closed' && (
            <>
              <button
                onClick={() => setShowCorrectionModal(true)}
                className="px-3.5 py-2 bg-white border border-[#DDE5DF] hover:border-[#007A44] text-[#15251C] hover:text-[#007A44] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#007A44]" />
                <span>Record Correction</span>
              </button>
              <button
                onClick={handleCloseReport}
                className="px-4 py-2 bg-[#15251C] hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00A651]" />
                <span>Close Report</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 1. Submitted Facts Section (Preserved and Locked) */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#007A44]" />
            <h2 className="text-sm font-semibold text-[#15251C]">
              Original Submitted Facts
            </h2>
          </div>
          <span className="text-[11px] text-[#5D6961] bg-[#F7F9F7] px-2.5 py-0.5 rounded border border-[#DDE5DF]">
            Locked Baseline Facts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-[#5D6961] block">Operational Site:</span>
            <span className="font-semibold text-[#15251C] flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#007A44]" />
              {report.siteName}
            </span>
          </div>
          <div>
            <span className="text-[#5D6961] block">Specific Location:</span>
            <span className="font-semibold text-[#15251C] mt-0.5 block">{report.specificLocation}</span>
          </div>
          <div>
            <span className="text-[#5D6961] block">Occurred At:</span>
            <span className="font-semibold text-[#15251C] flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-[#5D6961]" />
              {new Date(report.occurredAt).toLocaleString('en-GB')}
            </span>
          </div>
        </div>

        <div>
          <span className="text-xs text-[#5D6961] block mb-1">Detailed Description:</span>
          <div className="p-3.5 bg-[#F7F9F7] rounded-lg text-xs text-[#15251C] leading-relaxed border border-[#DDE5DF]">
            {report.description}
          </div>
        </div>

        {report.immediateActionTaken && (
          <div>
            <span className="text-xs text-[#5D6961] block mb-1">Immediate Actions Taken:</span>
            <div className="p-3 bg-[#EEF7F2] rounded-lg text-xs text-[#007A44] border border-[#BDE3CE]">
              {report.immediateActionTaken}
            </div>
          </div>
        )}

        <div className="pt-2 text-[11px] text-[#5D6961] flex flex-wrap items-center justify-between gap-2 border-t border-[#DDE5DF]">
          <span>Reported by: <strong>{report.reporterName}</strong> on {new Date(report.reportedAt).toLocaleDateString('en-GB')}</span>
          <span className="font-mono text-[10px] text-[#5D6961]">ID: {report.id}</span>
        </div>
      </div>

      {/* Meaningful Corrections Log (if any exist) */}
      {report.corrections && report.corrections.length > 0 && (
        <div className="bg-white rounded-xl border border-[#FEDF89] bg-[#FFFAEB]/30 p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-[#FEDF89] text-xs font-semibold text-[#B54708]">
            <Edit3 className="w-4 h-4" />
            <span>Technical Corrections & Amendments Log (Audit Trail)</span>
          </div>
          <div className="space-y-2">
            {report.corrections.map((cor) => (
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

      {/* 2. Risk Classification (5x5 Matrix) Section */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
          <div>
            <h2 className="text-sm font-semibold text-[#15251C] flex items-center gap-2">
              <span>5 × 5 Risk Matrix & Finding Classification</span>
              <span className="text-[10px] bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89] px-2 py-0.5 rounded font-mono">
                {report.classification?.matrixVersion || appState.matrixConfig.version} (Provisional Scheme)
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
                    {report.classification?.score || 'Not Scored'} <span className="text-xs text-[#5D6961]">/ 25</span>
                  </div>
                </div>
                <div className="border-l border-[#DDE5DF] pl-4">
                  <div className="text-[11px] text-[#5D6961] mb-1">Risk Band</div>
                  <RiskBadge
                    band={report.classification?.band}
                    score={report.classification?.score}
                    matrixVersion={report.classification?.matrixVersion}
                    showDetails
                  />
                </div>
              </div>

              {report.classification?.category && (
                <div className="sm:text-right">
                  <div className="text-[11px] text-[#5D6961]">Finding Category</div>
                  <span className="inline-block mt-0.5 text-xs font-semibold px-2.5 py-0.5 rounded bg-white border border-[#DDE5DF] text-[#15251C]">
                    {report.classification.category}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#DDE5DF] text-xs">
              <span className="text-[#5D6961] block mb-0.5">Classification Rationale:</span>
              <div className="text-[#15251C] leading-relaxed">
                {report.classification?.rationale || 'Awaiting formal review by authorized HSE Officer.'}
              </div>
            </div>

            <div className="pt-2 border-t border-[#DDE5DF] flex flex-wrap items-center justify-between text-[11px] text-[#5D6961]">
              <span>
                Classified by: <strong>{report.classification?.classifiedBy || 'Pending HSE confirmation'}</strong>
                {report.classification?.classifiedAt && ` on ${new Date(report.classification.classifiedAt).toLocaleDateString('en-GB')}`}
              </span>
              <span className="text-[#B54708] font-medium">
                {report.classification?.isProvisional ? 'Provisional Baseline (Pending Client Committee Sign-Off)' : 'Client Committee Approved'}
              </span>
            </div>

            <div className="pt-2 border-t border-[#DDE5DF] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5D6961]">
              <span className="font-mono text-[10px] bg-white border border-[#DDE5DF] px-2 py-0.5 rounded text-[#15251C]">
                Scheme Retained: <strong>{report.classification?.matrixVersion || appState.matrixConfig.version}</strong>
              </span>
              <span className="text-[10px] text-[#5D6961]">
                Formula Verified: <strong>Severity ({report.classification?.severity}) × Likelihood ({report.classification?.likelihood}) = Score {report.classification?.score}</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[#EEF7F2]/50 border border-[#BDE3CE] rounded-lg space-y-4 text-xs">
            <div className="p-2.5 bg-white rounded-lg border border-[#BDE3CE] text-[#007A44] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                <strong>Human HSE Reviewer Mandate:</strong> Confirmed by authorized human HSE reviewer (<strong>{appState.currentUser.name}</strong>, {appState.currentUser.roleTitle}). AI automated determinations are strictly prohibited.
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

      {/* 3. Investigation & Root Cause Findings (Where Applicable) */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <h2 className="text-sm font-semibold text-[#15251C] pb-3 border-b border-[#DDE5DF]">
          Investigation & Root Cause Analysis
        </h2>

        <div>
          <label className="block text-xs font-semibold text-[#15251C] mb-1">
            Root Cause Assessment:
          </label>
          <textarea
            rows={3}
            value={rootCause}
            disabled={!canManageHSE}
            onChange={(e) => setRootCause(e.target.value)}
            placeholder="Document underlying organizational, mechanical, environmental or procedural factors..."
            className="w-full p-3 text-xs border border-[#DDE5DF] rounded-lg focus:outline-hidden focus:border-[#007A44] disabled:bg-[#F7F9F7]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#15251C] mb-2">
            Identified Causal Findings ({findingsList.length}):
          </label>
          {findingsList.length === 0 ? (
            <div className="text-xs text-[#5D6961] italic py-2">No causal findings added yet.</div>
          ) : (
            <ul className="space-y-1.5">
              {findingsList.map((f, i) => (
                <li key={i} className="text-xs text-[#15251C] flex items-start gap-2 bg-[#F7F9F7] p-2.5 rounded border border-[#DDE5DF]">
                  <span className="font-semibold text-[#007A44]">{i + 1}.</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}

          {canManageHSE && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newFindingText}
                onChange={(e) => setNewFindingText(e.target.value)}
                placeholder="Add new finding item..."
                className="flex-1 px-3 py-1.5 text-xs border border-[#DDE5DF] rounded-lg"
              />
              <button
                type="button"
                onClick={handleAddFinding}
                className="px-3.5 py-1.5 bg-[#EEF7F2] text-[#007A44] hover:bg-[#BDE3CE] text-xs font-semibold rounded-lg"
              >
                Add Finding
              </button>
            </div>
          )}
        </div>

        {canManageHSE && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveInvestigation}
              className="px-4 py-2 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold rounded-lg"
            >
              Save Investigation Details
            </button>
          </div>
        )}
      </div>

      {/* 4. Linked Corrective & Preventive Actions (CAPA) */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
          <div>
            <h2 className="text-sm font-semibold text-[#15251C]">
              Linked Corrective & Preventive Actions ({linkedActions.length})
            </h2>
            <p className="text-xs text-[#5D6961]">
              Contract requirement 1.6 & 1.7: Corrective actions are traced directly to source occurrences.
            </p>
          </div>
          {canManageHSE && (
            <button
              onClick={() => setShowCreateAction(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#007A44] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign CAPA Action</span>
            </button>
          )}
        </div>

        {showCreateAction && (
          <form onSubmit={handleCreateLinkedAction} className="p-4 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF] space-y-3 text-xs">
            <h3 className="font-semibold text-[#15251C]">Assign Action to Close This Occurrence</h3>
            <div>
              <label className="block text-[#5D6961] mb-1">Action Title *</label>
              <input
                type="text"
                required
                value={actionTitle}
                onChange={(e) => setActionTitle(e.target.value)}
                placeholder="e.g. Inspect and recertify hydrostatic blast shield"
                className="w-full px-3 py-1.5 border border-[#DDE5DF] rounded bg-white text-xs"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#5D6961] mb-1">Action Type</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-[#DDE5DF] rounded bg-white text-xs"
                >
                  <option value="corrective">Corrective</option>
                  <option value="preventive">Preventive</option>
                </select>
              </div>
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
              No corrective actions currently linked to this occurrence.
            </div>
          ) : (
            linkedActions.map((act) => (
              <div key={act.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-[#15251C]">{act.actionNumber}</span>
                    <span className="capitalize text-[11px] px-2 py-0.5 rounded bg-[#F7F9F7] border border-[#DDE5DF]">
                      {act.actionType}
                    </span>
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

      {/* 5. Simulated Evidence & Attachments Section */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-[#007A44]" />
            <h2 className="text-sm font-semibold text-[#15251C]">
              Supporting Evidence ({report.attachments.length})
            </h2>
          </div>
          <span className="text-[10px] font-bold text-[#B54708] bg-[#FEF6EE] border border-[#F9DBAF] px-2 py-0.5 rounded">
            SIMULATED EVIDENCE
          </span>
        </div>

        {report.attachments.length === 0 ? (
          <div className="text-xs text-[#5D6961] italic py-3 text-center">
            No photographic or document evidence attached to this occurrence.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.attachments.map((att) => (
              <div key={att.id} className="p-3 rounded-lg border border-[#DDE5DF] bg-[#F7F9F7] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded bg-white border border-[#DDE5DF] text-[#007A44] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-[#15251C] truncate">{att.name}</div>
                    <div className="text-[10px] text-[#5D6961]">
                      {(att.sizeBytes / 1024).toFixed(0)} KB · Uploaded by {att.uploadedBy}
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
        <div className="text-[11px] text-[#5D6961] bg-[#F7F9F7] p-2.5 rounded-lg border border-[#DDE5DF] flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#007A44] shrink-0" />
          <span>Notice: Evidence attachments are simulated and stored in browser memory only for platform qualification.</span>
        </div>
      </div>

      {/* 6. Comprehensive Chronological History & Audit Log */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#007A44]" />
            <h2 className="text-sm font-semibold text-[#15251C]">
              Operational History & Audit Trail
            </h2>
          </div>
          <span className="text-xs text-[#5D6961]">{reportAuditLogs.length} Events</span>
        </div>

        {reportAuditLogs.length === 0 ? (
          <div className="text-xs text-[#5D6961] italic py-2">No separate audit entries recorded.</div>
        ) : (
          <div className="relative border-l border-[#DDE5DF] ml-3 space-y-4 text-xs">
            {reportAuditLogs.map((log) => (
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
              In compliance with specification Section 4, original submitted facts are preserved. Technical amendments are logged with author and reason.
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
                <option value="description">Description</option>
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
                placeholder="Enter the rectified technical information..."
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
                placeholder="e.g. Corrected valve tag after physical tag verification"
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
