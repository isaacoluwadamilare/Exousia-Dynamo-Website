import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { hseDataService, HSEAppState, calculateRisk } from '../../services/hseDataService';
import { StatusBadge, RiskBadge, Badge } from '../../components/Badge';
import { ChecklistItemResult, RiskBand, InspectionStatus, ChecklistItem } from '../../types/hse';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  AlertTriangle,
  ClipboardCheck,
  Plus,
  Save,
  MapPin,
  Calendar,
  User,
  Sparkles,
  Paperclip,
  Camera,
  History,
  Info,
  ShieldCheck,
  Send,
  Ban,
  ExternalLink
} from 'lucide-react';

interface InspectionDetailPageProps {
  appState: HSEAppState;
}

export const InspectionDetailPage: React.FC<InspectionDetailPageProps> = ({ appState }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const inspection = appState.inspections.find(i => i.id === id);

  // Inspection-level state
  const [summaryNotes, setSummaryNotes] = useState(inspection?.summaryNotes || '');
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [completionModalOpen, setCompletionModalOpen] = useState(false);

  // Active failure item finding editor state
  const [activeFailureItemId, setActiveFailureItemId] = useState<string | null>(null);
  const [failureNote, setFailureNote] = useState('');
  const [failureCategory, setFailureCategory] = useState(
    appState.matrixConfig.findingCategories[0] || 'Mechanical Integrity & Pressure Systems'
  );
  const [failureSeverity, setFailureSeverity] = useState(3);
  const [failureLikelihood, setFailureLikelihood] = useState(3);
  const [failureRationale, setFailureRationale] = useState('');
  const [failureEvidence, setFailureEvidence] = useState('');

  // Action creation modal state
  const [actionModalItem, setActionModalItem] = useState<ChecklistItem | null>(null);
  const [actionTitle, setActionTitle] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [actionOwnerId, setActionOwnerId] = useState(appState.users[2]?.id || appState.users[0]?.id || '');
  const [actionDueDate, setActionDueDate] = useState('2026-10-16');

  if (!inspection) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[#DDE5DF] max-w-lg mx-auto">
        <h2 className="text-lg font-semibold text-[#15251C]">Inspection not found</h2>
        <p className="text-xs text-[#5D6961] mt-1">The requested inspection record does not exist or has been removed.</p>
        <Link to="/app/inspections" className="mt-4 inline-block text-xs text-[#007A44] font-semibold underline">
          Return to Inspections Register
        </Link>
      </div>
    );
  }

  const isCompleted = inspection.status === 'completed';
  const isCancelled = inspection.status === 'cancelled';
  const isReadOnly = isCompleted || isCancelled;
  const canExecute = ['hse_officer', 'hse_manager', 'admin'].includes(appState.currentUser.role);

  const linkedActions = appState.actions.filter(
    a => inspection.linkedActionIds.includes(a.id) || a.sourceId === inspection.id
  );

  const inspectionAuditLogs = appState.auditLogs.filter(
    l => l.entityId === inspection.id || l.entityNumber === inspection.inspectionNumber
  );

  // Interactive Demonstration Walkthrough
  const handleRunDemoWalkthrough = () => {
    // 1. Mark item-1 and item-2 as pass
    // 2. Mark item-3 as na
    // 3. Mark item-4 as fail with category and 5x5 risk
    // 4. Mark item-5 as pass
    const items = [...inspection.items];

    items.forEach((it, index) => {
      if (index === 0) {
        it.result = 'pass';
        it.findingNote = 'Evacuation corridors and signage verified 100% compliant.';
      } else if (index === 1) {
        it.result = 'pass';
        it.findingNote = 'Solvent lockers locked and verified grounded with earth clamp.';
      } else if (index === 2) {
        it.result = 'na';
        it.findingNote = 'Deluge shower test scheduled for separate third-party calibration cycle.';
      } else if (index === 3) {
        it.result = 'fail';
        it.findingNote = 'High-pressure test bunker guard clamp loose; elastomeric buffer worn 40% beyond OEM replacement threshold.';
        it.findingCategory = 'Mechanical Integrity & Pressure Systems';
        it.findingClassification = {
          severity: 4,
          likelihood: 3,
          score: 12,
          band: 'high',
          rationale: 'High potential for high-pressure fluid splash and operator projectile injury if clamp fractures under test pressure.',
          matrixVersion: appState.matrixConfig.version,
          classifiedBy: `${appState.currentUser.name} (${appState.currentUser.roleTitle})`,
          classifiedAt: new Date().toISOString(),
          isProvisional: appState.matrixConfig.isProvisional
        };
        it.evidenceName = 'hydro_pump_guard_loose_clamp_04Oct.jpg';
      } else {
        it.result = 'pass';
        it.findingNote = 'Overhead crane hoist limit switches and monthly green sling color tags verified.';
      }

      hseDataService.updateChecklistItem(inspection.id, it.id, it.result!, {
        findingNote: it.findingNote,
        findingCategory: it.findingCategory,
        findingClassification: it.findingClassification,
        evidenceName: it.evidenceName
      });
    });

    // Auto open action modal for the failed item
    const failedItem = items[3] || items.find(it => it.result === 'fail');
    if (failedItem) {
      openActionModal(failedItem);
    }
  };

  const handleSetItemResult = (itemId: string, result: ChecklistItemResult) => {
    if (isReadOnly || !canExecute) return;

    if (result === 'fail') {
      const item = inspection.items.find(it => it.id === itemId);
      setActiveFailureItemId(itemId);
      setFailureNote(item?.findingNote || '');
      setFailureCategory(item?.findingCategory || appState.matrixConfig.findingCategories[0] || 'Mechanical Integrity & Pressure Systems');
      setFailureSeverity(item?.findingClassification?.severity || 3);
      setFailureLikelihood(item?.findingClassification?.likelihood || 3);
      setFailureRationale(item?.findingClassification?.rationale || '');
      setFailureEvidence(item?.evidenceName || '');
    } else {
      hseDataService.updateChecklistItem(inspection.id, itemId, result, {
        findingNote: undefined,
        findingCategory: undefined,
        findingClassification: undefined,
        evidenceName: undefined
      });
      if (activeFailureItemId === itemId) {
        setActiveFailureItemId(null);
      }
    }
  };

  const handleSaveFailureDetails = (itemId: string) => {
    if (!failureNote.trim()) {
      alert('Mandatory Rule: You must provide finding notes detailing why this checklist item failed.');
      return;
    }

    const { score, band } = calculateRisk(failureSeverity, failureLikelihood, appState.matrixConfig);

    hseDataService.updateChecklistItem(inspection.id, itemId, 'fail', {
      findingNote: failureNote.trim(),
      findingCategory: failureCategory,
      findingClassification: {
        severity: failureSeverity,
        likelihood: failureLikelihood,
        score,
        band,
        rationale: failureRationale.trim() || `Classified ${band.toUpperCase()} based on severity ${failureSeverity} and likelihood ${failureLikelihood}`,
        matrixVersion: appState.matrixConfig.version,
        isProvisional: appState.matrixConfig.isProvisional
      },
      evidenceName: failureEvidence.trim() || undefined
    });

    setActiveFailureItemId(null);
  };

  const handleSaveDraft = () => {
    hseDataService.saveInspectionDraft(inspection.id, summaryNotes);
    alert('Inspection draft progress saved. Status is now In Progress.');
  };

  const handleSubmitForReview = () => {
    hseDataService.submitInspectionForReview(
      inspection.id,
      summaryNotes || 'Inspection completed by field inspector; submitted for management sign-off.'
    );
  };

  const handleCompleteInspection = () => {
    hseDataService.completeInspection(
      inspection.id,
      summaryNotes || 'Safety inspection concluded. Checklist findings recorded; linked corrective actions remain active.'
    );
    setCompletionModalOpen(false);
  };

  const handleConfirmCancellation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellationReason.trim()) return;

    hseDataService.cancelInspection(inspection.id, cancellationReason.trim());
    setCancellationModalOpen(false);
  };

  const openActionModal = (item: ChecklistItem) => {
    setActionModalItem(item);
    setActionTitle(`Remediate inspection finding: ${item.question.slice(0, 50)}...`);
    setActionDescription(
      `Deficiency detected during inspection ${inspection.inspectionNumber} (${inspection.title}): ${item.findingNote || 'Checklist item failed inspection.'} Category: ${item.findingCategory || 'General Safety'}.`
    );
    setActionDueDate('2026-10-16');
  };

  const handleCreateActionFromFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModalItem || !actionTitle.trim()) return;

    const priorityBand = actionModalItem.findingClassification?.band || 'medium';

    hseDataService.createActionFromFinding({
      inspectionId: inspection.id,
      checklistItemId: actionModalItem.id,
      title: actionTitle.trim(),
      description: actionDescription.trim(),
      actionType: 'corrective',
      ownerId: actionOwnerId,
      dueDate: actionDueDate,
      priority: priorityBand,
      findingCategory: actionModalItem.findingCategory
    });

    setActionModalItem(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
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
                {inspection.inspectionNumber}
              </span>
              <StatusBadge status={inspection.status} />
              <span className="text-[11px] font-semibold text-[#007A44] bg-[#EEF7F2] px-2 py-0.5 rounded border border-[#BDE3CE]">
                Template Version {inspection.templateVersion}
              </span>
              {inspection.findingsCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FFF0ED] text-[#B42318] border border-[#FECDCA]">
                  {inspection.findingsCount} Defect Finding{inspection.findingsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-[#15251C] mt-1">{inspection.title}</h1>
          </div>
        </div>

        {/* Workflow Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isReadOnly && canExecute && (
            <>
              <button
                onClick={handleSaveDraft}
                className="px-3.5 py-2 bg-white border border-[#DDE5DF] hover:border-[#007A44] text-[#15251C] hover:text-[#007A44] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Save partial checklist progress"
              >
                <Save className="w-3.5 h-3.5 text-[#007A44]" />
                <span>Save Draft</span>
              </button>

              {inspection.status !== 'submitted' && (
                <button
                  onClick={handleSubmitForReview}
                  className="px-3.5 py-2 bg-white border border-[#DDE5DF] hover:border-[#026AA2] text-[#026AA2] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5 text-[#026AA2]" />
                  <span>Submit for Review</span>
                </button>
              )}

              <button
                onClick={() => setCompletionModalOpen(true)}
                className="px-4 py-2 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Complete Inspection</span>
              </button>

              <button
                onClick={() => setCancellationModalOpen(true)}
                className="p-2 text-[#5D6961] hover:text-[#B42318] hover:bg-[#FFF0ED] rounded-lg transition-colors"
                title="Cancel Inspection"
              >
                <Ban className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Demonstration Flow Banner */}
      {!isReadOnly && (
        <div className="bg-[#F4F8F5] border border-[#BDE3CE] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#007A44] uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Demonstration Checklist Execution</span>
            </div>
            <p className="text-xs text-[#37473F] mt-0.5">
              Click below to simulate field checklist evaluation with a <strong>Failed Finding</strong> (loose machine guard) and immediately assign a linked Corrective Action.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunDemoWalkthrough}
            className="px-4 py-2 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Demo Execution & Action Link</span>
          </button>
        </div>
      )}

      {/* Inspection Metadata Bar */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs shadow-xs">
        <div>
          <span className="text-[#5D6961] block">Operational Facility:</span>
          <span className="font-semibold text-[#15251C] flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-[#007A44]" />
            {inspection.siteName}
          </span>
        </div>
        <div>
          <span className="text-[#5D6961] block">Scheduled Audit Date:</span>
          <span className="font-semibold text-[#15251C] flex items-center gap-1 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-[#5D6961]" />
            {inspection.scheduledDate}
          </span>
        </div>
        <div>
          <span className="text-[#5D6961] block">Assigned Lead Inspector:</span>
          <span className="font-semibold text-[#15251C] flex items-center gap-1 mt-0.5">
            <User className="w-3.5 h-3.5 text-[#5D6961]" />
            {inspection.inspectorName}
          </span>
        </div>
        <div>
          <span className="text-[#5D6961] block">Template Lock:</span>
          <span className="font-mono font-semibold text-[#007A44] mt-0.5 block">
            {inspection.templateId} (v{inspection.templateVersion})
          </span>
        </div>
      </div>

      {/* Cancellation Notice if Cancelled */}
      {isCancelled && (
        <div className="bg-[#FFF0ED] border border-[#FECDCA] rounded-xl p-4 text-xs text-[#B42318] space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <Ban className="w-4 h-4" />
            <span>Inspection Cancelled on {new Date(inspection.cancelledAt || '').toLocaleString('en-GB')}</span>
          </div>
          <p>Reason: {inspection.cancellationReason || 'No cancellation reason provided.'}</p>
        </div>
      )}

      {/* Checklist Items Execution Card */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#DDE5DF] gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#15251C]">
              Safety Checklist Questions ({inspection.items.length})
            </h2>
            <p className="text-xs text-[#5D6961] mt-0.5">
              Evaluate each checkpoint as Pass, Fail, or N/A. Failed items require category, risk rating, and remediation actions.
            </p>
          </div>
          <div className="text-xs font-semibold text-[#5D6961]">
            Evaluated:{' '}
            <span className="text-[#15251C]">
              {inspection.items.filter(it => it.result).length} of {inspection.items.length}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {inspection.items.map((item, index) => {
            const isFailed = item.result === 'fail';
            const isEditingThisFailure = activeFailureItemId === item.id;
            const hasLinkedAction = !!item.linkedActionId;
            const linkedActionItem = appState.actions.find(a => a.id === item.linkedActionId);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all text-xs space-y-3 ${
                  isFailed
                    ? 'border-[#FECDCA] bg-[#FFF0ED]/20'
                    : item.result === 'pass'
                    ? 'border-[#BDE3CE] bg-[#EEF7F2]/20'
                    : item.result === 'na'
                    ? 'border-[#DDE5DF] bg-[#F7F9F7]'
                    : 'border-[#DDE5DF] bg-white'
                }`}
              >
                {/* Item Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 text-[11px] text-[#5D6961]">
                      <span className="font-semibold text-[#007A44]">Checkpoint {index + 1}</span>
                      <span>·</span>
                      <span className="font-medium bg-[#F7F9F7] px-2 py-0.5 rounded border border-[#DDE5DF] text-[#15251C]">
                        {item.section}
                      </span>
                      {item.findingCategory && (
                        <span className="text-[10px] font-semibold text-[#B54708] bg-[#FFFAEB] border border-[#FEDF89] px-2 py-0.5 rounded">
                          {item.findingCategory}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-[#15251C]">{item.question}</div>
                    {item.guidance && (
                      <p className="text-[11px] text-[#5D6961] italic">{item.guidance}</p>
                    )}
                  </div>

                  {/* Result Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={isReadOnly || !canExecute}
                      onClick={() => handleSetItemResult(item.id, 'pass')}
                      className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                        item.result === 'pass'
                          ? 'bg-[#007A44] text-white shadow-2xs'
                          : 'bg-[#F7F9F7] text-[#5D6961] hover:bg-[#EEF7F2] hover:text-[#007A44] border border-[#DDE5DF]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pass</span>
                    </button>

                    <button
                      type="button"
                      disabled={isReadOnly || !canExecute}
                      onClick={() => handleSetItemResult(item.id, 'fail')}
                      className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                        item.result === 'fail'
                          ? 'bg-[#B42318] text-white shadow-2xs'
                          : 'bg-[#F7F9F7] text-[#5D6961] hover:bg-[#FFF0ED] hover:text-[#B42318] border border-[#DDE5DF]'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Fail</span>
                    </button>

                    <button
                      type="button"
                      disabled={isReadOnly || !canExecute}
                      onClick={() => handleSetItemResult(item.id, 'na')}
                      className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                        item.result === 'na'
                          ? 'bg-[#15251C] text-white shadow-2xs'
                          : 'bg-[#F7F9F7] text-[#5D6961] hover:bg-[#F0F2F0] hover:text-[#15251C] border border-[#DDE5DF]'
                      }`}
                    >
                      <MinusCircle className="w-3.5 h-3.5" />
                      <span>N/A</span>
                    </button>
                  </div>
                </div>

                {/* Finding Details when Marked as Fail */}
                {isFailed && !isEditingThisFailure && (
                  <div className="p-3.5 rounded-lg bg-white border border-[#FECDCA] space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="font-semibold text-[#B42318] flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Documented Failure Finding</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.findingClassification && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <RiskBadge
                              band={item.findingClassification.band}
                              score={item.findingClassification.score}
                              matrixVersion={item.findingClassification.matrixVersion}
                              showDetails
                            />
                            {item.findingClassification.matrixVersion && (
                              <span className="font-mono text-[10px] text-[#5D6961] bg-[#F7F9F7] px-2 py-0.5 rounded border border-[#DDE5DF]">
                                Scheme: {item.findingClassification.matrixVersion}
                              </span>
                            )}
                          </div>
                        )}
                        {!isReadOnly && canExecute && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveFailureItemId(item.id);
                              setFailureNote(item.findingNote || '');
                              setFailureCategory(item.findingCategory || appState.matrixConfig.findingCategories[0] || 'Mechanical Integrity & Pressure Systems');
                              setFailureSeverity(item.findingClassification?.severity || 3);
                              setFailureLikelihood(item.findingClassification?.likelihood || 3);
                              setFailureRationale(item.findingClassification?.rationale || '');
                              setFailureEvidence(item.evidenceName || '');
                            }}
                            className="text-[#007A44] hover:underline font-semibold ml-2"
                          >
                            Edit Finding
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-[#15251C] leading-relaxed">
                      <strong>Observation:</strong> {item.findingNote}
                    </div>

                    {item.findingClassification?.rationale && (
                      <div className="text-[11px] text-[#5D6961]">
                        <strong>Risk Rationale:</strong> {item.findingClassification.rationale}
                      </div>
                    )}

                    {item.evidenceName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#007A44]">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Attached Evidence: {item.evidenceName} (Simulated)</span>
                      </div>
                    )}

                    {/* Linked Action Status or Create Button */}
                    <div className="pt-2 border-t border-[#FECDCA] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {hasLinkedAction && linkedActionItem ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#15251C]">Corrective Action:</span>
                          <span className="font-mono font-bold text-[#007A44]">{linkedActionItem.actionNumber}</span>
                          <StatusBadge status={linkedActionItem.status} />
                          <span className="text-[11px] text-[#5D6961]">Owner: {linkedActionItem.ownerName}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#B42318] italic">
                          No corrective action linked yet to this failed finding.
                        </span>
                      )}

                      {!hasLinkedAction && canExecute && (
                        <button
                          type="button"
                          onClick={() => openActionModal(item)}
                          className="px-3 py-1 rounded bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create Corrective Action</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Active Failure Details Editor (When clicking Fail or Edit) */}
                {isEditingThisFailure && (
                  <div className="p-4 rounded-xl bg-white border border-[#B42318] space-y-4">
                    <div className="font-bold text-sm text-[#B42318] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Document Defect Finding & Risk Classification</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#15251C] mb-1">
                        1. Finding Observation Notes <span className="text-[#B42318]">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={failureNote}
                        onChange={(e) => setFailureNote(e.target.value)}
                        placeholder="Detail the exact non-conformance, physical measurements, or compromised condition..."
                        className="w-full p-2.5 border border-[#DDE5DF] rounded-lg text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#15251C] mb-1">
                          2. Finding Defect Category <span className="text-[#B42318]">*</span>
                        </label>
                        <select
                          value={failureCategory}
                          onChange={(e) => setFailureCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-[#DDE5DF] rounded-lg text-xs bg-white"
                        >
                          {appState.matrixConfig.findingCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#15251C] mb-1">
                          3. Simulated Evidence Attachment
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={failureEvidence}
                            onChange={(e) => setFailureEvidence(e.target.value)}
                            placeholder="e.g. photo_loose_guard_inspection.jpg"
                            className="flex-1 px-3 py-2 border border-[#DDE5DF] rounded-lg text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setFailureEvidence(`inspection_photo_${Date.now().toString().slice(-4)}.jpg`)}
                            className="px-2.5 py-1 bg-[#EEF7F2] text-[#007A44] border border-[#BDE3CE] rounded-lg text-[11px] font-semibold"
                          >
                            + Photo
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 5x5 Risk Matrix Evaluation for Finding */}
                    <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#15251C]">4. Finding Risk Evaluation (5 × 5 Matrix)</span>
                        <RiskBadge
                          band={calculateRisk(failureSeverity, failureLikelihood, appState.matrixConfig).band}
                          score={calculateRisk(failureSeverity, failureLikelihood, appState.matrixConfig).score}
                          matrixVersion={appState.matrixConfig.version}
                          showDetails
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between text-[11px] text-[#5D6961] mb-1">
                            <span>Severity:</span>
                            <span className="font-bold text-[#15251C]">{failureSeverity} of 5</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={5}
                            value={failureSeverity}
                            onChange={(e) => setFailureSeverity(Number(e.target.value))}
                            className="w-full accent-[#007A44]"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] text-[#5D6961] mb-1">
                            <span>Likelihood:</span>
                            <span className="font-bold text-[#15251C]">{failureLikelihood} of 5</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={5}
                            value={failureLikelihood}
                            onChange={(e) => setFailureLikelihood(Number(e.target.value))}
                            className="w-full accent-[#007A44]"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        value={failureRationale}
                        onChange={(e) => setFailureRationale(e.target.value)}
                        placeholder="Risk classification rationale..."
                        className="w-full px-2.5 py-1.5 border border-[#DDE5DF] rounded bg-white text-xs mt-1"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-[#DDE5DF]">
                      <button
                        type="button"
                        onClick={() => setActiveFailureItemId(null)}
                        className="px-3 py-1.5 border border-[#DDE5DF] rounded-lg text-[#5D6961]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveFailureDetails(item.id)}
                        className="px-4 py-1.5 bg-[#B42318] hover:bg-[#912018] text-white rounded-lg font-semibold"
                      >
                        Save Finding & Classification
                      </button>
                    </div>
                  </div>
                )}

                {/* Standard Comment / Note for Pass or N/A */}
                {!isFailed && (
                  <div className="pt-1">
                    <input
                      type="text"
                      disabled={isReadOnly || !canExecute}
                      value={item.findingNote || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        hseDataService.updateChecklistItem(inspection.id, item.id, item.result || 'pass', {
                          findingNote: val
                        });
                      }}
                      placeholder="Add verification note or observation comment (optional)..."
                      className="w-full px-3 py-1.5 text-xs border border-[#DDE5DF] rounded-lg bg-white text-[#15251C] disabled:bg-[#F7F9F7]"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Linked Corrective Actions Section */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
          <div>
            <h2 className="text-sm font-semibold text-[#15251C]">
              Linked Corrective Actions ({linkedActions.length})
            </h2>
            <p className="text-xs text-[#5D6961]">
              Contract requirement: Actions created from inspection findings preserve source relationships and remain open until verified.
            </p>
          </div>
          <span className="text-[10px] font-bold text-[#007A44] bg-[#EEF7F2] border border-[#BDE3CE] px-2 py-0.5 rounded">
            INDEPENDENT CLOSURE ENFORCED
          </span>
        </div>

        {linkedActions.length === 0 ? (
          <div className="text-xs text-[#5D6961] italic py-3 text-center">
            No corrective actions currently linked to this inspection.
          </div>
        ) : (
          <div className="divide-y divide-[#DDE5DF]">
            {linkedActions.map((act) => (
              <div key={act.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#15251C]">{act.actionNumber}</span>
                    <span className="capitalize text-[11px] px-2 py-0.5 rounded bg-[#F7F9F7] border border-[#DDE5DF]">
                      {act.actionType}
                    </span>
                    <StatusBadge status={act.status} />
                    {act.priority && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FFF0ED] text-[#B42318] border border-[#FECDCA]">
                        {act.priority.toUpperCase()} PRIORITY
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-[#15251C] mt-1">{act.title}</div>
                  <div className="text-[#5D6961] text-[11px] mt-0.5">
                    Owner: <strong>{act.ownerName}</strong> · Due Date: {act.dueDate}
                  </div>
                </div>

                <Link
                  to={`/app/actions/${act.id}`}
                  className="px-3 py-1 rounded border border-[#DDE5DF] hover:bg-[#F7F9F7] font-semibold text-[#007A44] self-start sm:self-auto flex items-center gap-1"
                >
                  <span>Manage Action</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Notes Card */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-3 shadow-xs">
        <h2 className="text-sm font-semibold text-[#15251C] pb-2 border-b border-[#DDE5DF]">
          Executive Inspection Summary & Closing Remarks
        </h2>
        <textarea
          rows={3}
          disabled={isReadOnly || !canExecute}
          value={summaryNotes}
          onChange={(e) => setSummaryNotes(e.target.value)}
          placeholder="Record final observations, overall housekeeping posture, and supervisor feedback..."
          className="w-full p-3 text-xs border border-[#DDE5DF] rounded-lg bg-white disabled:bg-[#F7F9F7]"
        />
      </div>

      {/* Operational History & Audit Log */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#007A44]" />
            <h2 className="text-sm font-semibold text-[#15251C]">
              Operational History & Audit Trail
            </h2>
          </div>
          <span className="text-xs text-[#5D6961]">{inspectionAuditLogs.length} Events</span>
        </div>

        {inspectionAuditLogs.length === 0 ? (
          <div className="text-xs text-[#5D6961] italic py-2">No separate audit entries recorded.</div>
        ) : (
          <div className="relative border-l border-[#DDE5DF] ml-3 space-y-4 text-xs">
            {inspectionAuditLogs.map((log) => (
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

      {/* Modal: Create Corrective Action from Finding */}
      {actionModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <form
            onSubmit={handleCreateActionFromFinding}
            className="bg-white rounded-xl border border-[#DDE5DF] p-6 max-w-lg w-full space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
              <h3 className="text-sm font-semibold text-[#15251C] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#007A44]" />
                <span>Create Corrective Action from Finding</span>
              </h3>
              <button
                type="button"
                onClick={() => setActionModalItem(null)}
                className="text-[#5D6961] hover:text-[#15251C]"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FFFAEB] border border-[#FEDF89] text-[#B54708]">
              <strong>Source Finding:</strong> {actionModalItem.question}
              <div className="text-[11px] mt-0.5">Category: {actionModalItem.findingCategory || 'General Safety'}</div>
            </div>

            <div>
              <label className="block font-semibold text-[#15251C] mb-1">Action Title *</label>
              <input
                type="text"
                required
                value={actionTitle}
                onChange={(e) => setActionTitle(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE5DF] rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#15251C] mb-1">Remediation Scope & Requirements</label>
              <textarea
                rows={3}
                value={actionDescription}
                onChange={(e) => setActionDescription(e.target.value)}
                className="w-full p-2.5 border border-[#DDE5DF] rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#15251C] mb-1">Assigned Action Owner *</label>
                <select
                  value={actionOwnerId}
                  onChange={(e) => setActionOwnerId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DDE5DF] rounded-lg bg-white"
                >
                  {appState.users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.roleTitle})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#15251C] mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={actionDueDate}
                  onChange={(e) => setActionDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DDE5DF] rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#DDE5DF]">
              <button
                type="button"
                onClick={() => setActionModalItem(null)}
                className="px-4 py-2 border border-[#DDE5DF] rounded-lg text-[#5D6961]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#007A44] hover:bg-[#005D35] text-white rounded-lg font-semibold"
              >
                Create & Link Action
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Complete Inspection Confirmation */}
      {completionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 max-w-md w-full space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-semibold text-[#15251C] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#007A44]" />
              <span>Complete & Sign Off Inspection</span>
            </h3>
            <p className="text-[#5D6961] leading-relaxed">
              Are you sure you want to conclude and lock this inspection?
            </p>

            <div className="p-3 rounded-lg bg-[#EEF7F2] border border-[#BDE3CE] text-[#007A44] text-[11px] leading-relaxed">
              <strong>Contract Governance Guarantee:</strong> Completing this inspection does <em>not</em> close any outstanding corrective actions. Linked actions ({linkedActions.length}) remain active and require independent physical evidence verification.
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#DDE5DF]">
              <button
                type="button"
                onClick={() => setCompletionModalOpen(false)}
                className="px-4 py-2 border border-[#DDE5DF] rounded-lg text-[#5D6961]"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleCompleteInspection}
                className="px-4 py-2 bg-[#007A44] hover:bg-[#005D35] text-white rounded-lg font-semibold"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cancel Inspection */}
      {cancellationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <form
            onSubmit={handleConfirmCancellation}
            className="bg-white rounded-xl border border-[#DDE5DF] p-6 max-w-md w-full space-y-4 shadow-xl text-xs"
          >
            <h3 className="text-sm font-semibold text-[#B42318] flex items-center gap-2">
              <Ban className="w-4 h-4 text-[#B42318]" />
              <span>Cancel Inspection</span>
            </h3>
            <p className="text-[#5D6961]">
              Provide an operational rationale for cancelling this scheduled inspection.
            </p>

            <textarea
              rows={3}
              required
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="e.g. Facility shutdown rescheduled due to severe adverse weather conditions..."
              className="w-full p-2.5 border border-[#DDE5DF] rounded-lg text-xs"
            />

            <div className="pt-2 flex justify-end gap-2 border-t border-[#DDE5DF]">
              <button
                type="button"
                onClick={() => setCancellationModalOpen(false)}
                className="px-4 py-2 border border-[#DDE5DF] rounded-lg text-[#5D6961]"
              >
                Dismiss
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#B42318] hover:bg-[#912018] text-white rounded-lg font-semibold"
              >
                Confirm Cancellation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
