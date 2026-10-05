import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  hseDataService,
  HSEAppState,
  isActionOverdue,
  getActionDueDateStatus
} from '../../services/hseDataService';
import { ActionStatusBadge, ActionTypeBadge, Badge } from '../../components/Badge';
import { ActionItem, RiskBand, UserProfile } from '../../types/hse';
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Upload,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
  Send,
  ExternalLink,
  RotateCcw,
  Sparkles,
  FileText,
  UserCheck,
  History,
  Paperclip,
  Check,
  Lock,
  RefreshCw
} from 'lucide-react';

interface ActionDetailPageProps {
  appState: HSEAppState;
}

export const ActionDetailPage: React.FC<ActionDetailPageProps> = ({ appState }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const action = appState.actions.find(a => a.id === id);

  const [activeHistoryTab, setActiveHistoryTab] = useState<'timeline' | 'reassignment' | 'extensions' | 'reopening' | 'attachments'>('timeline');

  // Form states
  const [progressNote, setProgressNote] = useState('');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [evidenceFile, setEvidenceFile] = useState('asme_hydro_proof_cert_BP9982.pdf');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal states
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  const [showExtendModal, setShowExtendModal] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [extendReason, setExtendReason] = useState('');

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  if (!action) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[#DDE5DF] max-w-xl mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-[#15251C]">Action item not found</h2>
        <p className="text-xs text-[#5D6961]">
          The action reference does not exist or may have been archived.
        </p>
        <Link
          to="/app/actions"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#007A44] text-white text-xs font-semibold rounded-lg hover:bg-[#005D35]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Actions Register</span>
        </Link>
      </div>
    );
  }

  const currentDate = '2026-10-02';
  const isOverdue = isActionOverdue(action, currentDate);
  const dueInfo = getActionDueDateStatus(action, currentDate);
  const isOwner = appState.currentUser.id === action.ownerId;
  const isHSEAuthority = ['hse_officer', 'hse_manager', 'admin'].includes(appState.currentUser.role);
  const canVerify = isHSEAuthority && !isOwner; // Strict Separation of Duty!

  // Source navigation link
  const sourceLink =
    action.sourceType === 'inspection'
      ? `/app/inspections/${action.sourceId}`
      : action.sourceType === 'compliance'
      ? `/app/compliance/${action.sourceId}`
      : action.sourceType === 'hazard'
      ? `/app/hazards/${action.sourceId}`
      : `/app/incidents/${action.sourceId}`;

  // Handlers
  const handleAddProgress = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!progressNote.trim()) {
      setErrorMessage('Please provide a progress update note.');
      return;
    }

    hseDataService.updateActionProgress(action.id, progressNote.trim(), 'in_progress');
    setProgressNote('');
    setSuccessMessage('Progress update recorded in action audit trail.');
  };

  const handleSubmitEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!evidenceDesc.trim()) {
      setErrorMessage('Please provide a description of the closure evidence.');
      return;
    }

    const fileName = evidenceFile || `evidence_proof_${Date.now().toString().slice(-4)}.pdf`;
    hseDataService.submitActionEvidence(action.id, evidenceDesc.trim(), fileName);
    setEvidenceDesc('');
    setSuccessMessage('Evidence submitted successfully. Action transitioned to Awaiting Verification.');
  };

  const handleVerifyDecision = (decision: 'accept' | 'return_for_rework') => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!verificationNotes.trim()) {
      setErrorMessage('Mandatory: Technical verification audit notes are required to document your decision.');
      return;
    }

    const result = hseDataService.verifyActionClosure(action.id, decision, verificationNotes.trim());
    if (!result.success) {
      setErrorMessage(result.error || 'Failed to record verification decision.');
    } else {
      setVerificationNotes('');
      setSuccessMessage(
        decision === 'accept'
          ? 'Action verified and officially CLOSED. Two-person rule satisfied.'
          : 'Action returned for rework with technical feedback to the owner.'
      );
    }
  };

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!newOwnerId) {
      setErrorMessage('Please select a new owner.');
      return;
    }
    if (!reassignReason.trim()) {
      setErrorMessage('Mandatory: A documented reason is required to reassign action ownership.');
      return;
    }

    const res = hseDataService.reassignAction(action.id, newOwnerId, reassignReason.trim());
    if (!res.success) {
      setErrorMessage(res.error || 'Reassignment failed.');
    } else {
      setShowReassignModal(false);
      setReassignReason('');
      setNewOwnerId('');
      setSuccessMessage('Action owner successfully reassigned and history recorded.');
    }
  };

  const handleExtendDueDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!newDueDate) {
      setErrorMessage('Please select a new target due date.');
      return;
    }
    if (!extendReason.trim()) {
      setErrorMessage('Mandatory: A justified operational reason is required for due-date extension.');
      return;
    }

    const res = hseDataService.extendActionDueDate(action.id, newDueDate, extendReason.trim());
    if (!res.success) {
      setErrorMessage(res.error || 'Due date extension failed.');
    } else {
      setShowExtendModal(false);
      setExtendReason('');
      setNewDueDate('');
      setSuccessMessage('Target due date extended and justification archived in audit history.');
    }
  };

  const handleReopenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!reopenReason.trim()) {
      setErrorMessage('Mandatory: A detailed safety reason is required to reopen a closed corrective action.');
      return;
    }

    const res = hseDataService.reopenAction(action.id, reopenReason.trim());
    if (!res.success) {
      setErrorMessage(res.error || 'Reopening action failed.');
    } else {
      setShowReopenModal(false);
      setReopenReason('');
      setSuccessMessage('Action reopened and returned to In Progress state for remediation.');
    }
  };

  const handleResetDemo = () => {
    hseDataService.demonstrateActionLifecycle();
    setSuccessMessage('Demo action reset to standard 6-stage verified closure.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/actions')}
            className="p-1.5 rounded-lg border border-[#DDE5DF] bg-white text-[#5D6961] hover:text-[#15251C] transition-colors"
            title="Back to actions list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#15251C] bg-[#F7F9F7] px-2 py-0.5 rounded border border-[#DDE5DF]">
                {action.actionNumber}
              </span>
              <ActionTypeBadge type={action.actionType} size="sm" />
              <ActionStatusBadge status={action.status} size="sm" />
              {isOverdue && (
                <Badge variant="danger" size="sm" className="font-bold">
                  {dueInfo.label}
                </Badge>
              )}
              {action.id === 'act-demo' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#007A44] text-white">
                  6-STAGE SPEC DEMO
                </span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-[#15251C] mt-1.5">{action.title}</h1>
          </div>
        </div>

        {/* Toolbar & Demo Actor Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Reassign Button */}
          <button
            onClick={() => {
              setNewOwnerId(action.ownerId);
              setShowReassignModal(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#DDE5DF] bg-white text-[#5D6961] hover:text-[#15251C] hover:bg-[#F7F9F7]"
          >
            Reassign
          </button>

          {/* Extend Due Date Button */}
          {action.status !== 'closed' && (
            <button
              onClick={() => {
                setNewDueDate(action.dueDate);
                setShowExtendModal(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#DDE5DF] bg-white text-[#5D6961] hover:text-[#15251C] hover:bg-[#F7F9F7]"
            >
              Extend Due Date
            </button>
          )}

          {/* Reopen Button (if closed) */}
          {action.status === 'closed' && isHSEAuthority && (
            <button
              onClick={() => setShowReopenModal(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#B54708] bg-[#FFFAEB] text-[#B54708] hover:bg-[#FEDF89]/50 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reopen Action</span>
            </button>
          )}

          {/* Demo User Switcher */}
          <div className="flex items-center gap-1 pl-2 border-l border-[#DDE5DF]">
            <span className="text-[10px] text-[#5D6961]">Act as:</span>
            <select
              value={appState.currentUser.id}
              onChange={(e) => hseDataService.setCurrentUser(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-[#007A44] bg-[#EEF7F2] text-[#007A44] font-semibold"
              title="Switch user to test separation of duty permissions"
            >
              {appState.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.roleTitle.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-[#FFF0ED] border border-[#FECDCA] text-xs text-[#B42318] flex items-start gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button onClick={() => setErrorMessage('')} className="text-[#B42318] hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-[#EEF7F2] border border-[#BDE3CE] text-xs text-[#007A44] flex items-start gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
          <button onClick={() => setSuccessMessage('')} className="text-[#007A44] hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Visual Workflow Lifecycle Stepper */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-4">
        <span className="text-[11px] font-semibold text-[#5D6961] block mb-2 uppercase tracking-wide">
          Specification Action Lifecycle Workflow:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {/* Step 1: Open */}
          <div
            className={`p-2.5 rounded-lg border flex flex-col justify-between ${
              action.status === 'open'
                ? 'bg-[#EEF7F2] border-[#007A44] text-[#007A44]'
                : 'bg-[#F7F9F7] border-[#DDE5DF] text-[#15251C]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">1. Assigned</span>
              <Check className="w-3.5 h-3.5 text-[#007A44]" />
            </div>
            <span className="text-[10px] text-[#5D6961] mt-1">Source linked</span>
          </div>

          {/* Step 2: In Progress */}
          <div
            className={`p-2.5 rounded-lg border flex flex-col justify-between ${
              action.status === 'in_progress'
                ? 'bg-[#EEF7F2] border-[#007A44] text-[#007A44]'
                : ['evidence_submitted', 'awaiting_verification', 'closed'].includes(action.status)
                ? 'bg-[#F7F9F7] border-[#DDE5DF] text-[#15251C]'
                : 'bg-white border-[#DDE5DF] text-[#5D6961]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">2. In Progress</span>
              {['in_progress', 'evidence_submitted', 'awaiting_verification', 'closed'].includes(action.status) && (
                <Check className="w-3.5 h-3.5 text-[#007A44]" />
              )}
            </div>
            <span className="text-[10px] text-[#5D6961] mt-1">Work executing</span>
          </div>

          {/* Step 3: Evidence Submitted */}
          <div
            className={`p-2.5 rounded-lg border flex flex-col justify-between ${
              action.status === 'awaiting_verification' || action.status === 'evidence_submitted'
                ? 'bg-[#FFFAEB] border-[#FEDF89] text-[#B54708]'
                : action.status === 'closed'
                ? 'bg-[#F7F9F7] border-[#DDE5DF] text-[#15251C]'
                : 'bg-white border-[#DDE5DF] text-[#5D6961]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">3. Evidence</span>
              {action.status === 'closed' && <Check className="w-3.5 h-3.5 text-[#007A44]" />}
            </div>
            <span className="text-[10px] text-[#5D6961] mt-1">Proof uploaded</span>
          </div>

          {/* Step 4: Verification Review */}
          <div
            className={`p-2.5 rounded-lg border flex flex-col justify-between ${
              action.status === 'returned_for_rework'
                ? 'bg-[#FFF0ED] border-[#FECDCA] text-[#B42318]'
                : action.status === 'closed'
                ? 'bg-[#F7F9F7] border-[#DDE5DF] text-[#15251C]'
                : 'bg-white border-[#DDE5DF] text-[#5D6961]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">4. Review</span>
              {action.status === 'returned_for_rework' ? (
                <XCircle className="w-3.5 h-3.5 text-[#B42318]" />
              ) : action.status === 'closed' ? (
                <Check className="w-3.5 h-3.5 text-[#007A44]" />
              ) : null}
            </div>
            <span className="text-[10px] text-[#5D6961] mt-1">
              {action.status === 'returned_for_rework' ? 'Rework requested' : '2-person rule'}
            </span>
          </div>

          {/* Step 5: Verified Closure */}
          <div
            className={`p-2.5 rounded-lg border flex flex-col justify-between ${
              action.status === 'closed'
                ? 'bg-[#EEF7F2] border-[#007A44] text-[#007A44]'
                : 'bg-white border-[#DDE5DF] text-[#5D6961]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">5. Closed</span>
              {action.status === 'closed' && <CheckCircle2 className="w-3.5 h-3.5 text-[#007A44]" />}
            </div>
            <span className="text-[10px] text-[#5D6961] mt-1">Formally verified</span>
          </div>
        </div>
      </div>

      {/* Special Demo Inspector Banner if ACT-2026-DEMO */}
      {action.id === 'act-demo' && (
        <div className="bg-[#F7F9F7] border border-[#007A44] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#007A44]" />
              <h3 className="text-sm font-bold text-[#15251C]">
                Verified 6-Stage Specification Demonstration Record
              </h3>
            </div>
            <button
              onClick={handleResetDemo}
              className="text-xs px-2.5 py-1 text-[#007A44] border border-[#007A44] rounded bg-white hover:bg-[#EEF7F2] font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Demo State</span>
            </button>
          </div>
          <p className="text-xs text-[#5D6961]">
            This record demonstrates the complete ISO 45001 CAPA lifecycle mandated in Contract Award Spec 1.10:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
            <div className="p-2.5 bg-white rounded border border-[#DDE5DF]">
              <strong>1. Assignment & Progress:</strong> Josephine Yese assigned action to Emeka Nwosu. Emeka logged PO PR-2026-441.
            </div>
            <div className="p-2.5 bg-white rounded border border-[#DDE5DF]">
              <strong>2. Rejection & Resubmission:</strong> Ibrahim Olatunji rejected initial submission due to missing ASME cert. Emeka attached cert and resubmitted.
            </div>
            <div className="p-2.5 bg-white rounded border border-[#DDE5DF]">
              <strong>3. Verified Closure:</strong> Josephine Yese independently verified physical tag & cert. Two-person rule satisfied.
            </div>
          </div>
        </div>
      )}

      {/* Facts Card */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-4 border-b border-[#DDE5DF]">
          <div>
            <span className="text-[#5D6961] block font-medium">Assigned Owner:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-semibold text-[#15251C]">{action.ownerName}</span>
              {isOwner && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#EEF7F2] text-[#007A44] font-bold">
                  (You)
                </span>
              )}
            </div>
            {action.reassignmentHistory && action.reassignmentHistory.length > 0 && (
              <span className="text-[10px] text-[#B54708] font-medium block mt-0.5">
                Reassigned ({action.reassignmentHistory.length} times)
              </span>
            )}
          </div>

          <div>
            <span className="text-[#5D6961] block font-medium">Target Due Date:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`font-semibold font-mono ${isOverdue ? 'text-[#B42318]' : 'text-[#15251C]'}`}>
                {action.dueDate}
              </span>
              {isOverdue && <span className="w-2 h-2 rounded-full bg-[#B42318]" />}
            </div>
            <span className={`text-[10px] block mt-0.5 ${isOverdue ? 'text-[#B42318] font-bold' : 'text-[#5D6961]'}`}>
              {dueInfo.label}
            </span>
            {action.dueDateHistory && action.dueDateHistory.length > 0 && (
              <span className="text-[10px] text-[#B54708] font-medium block mt-0.5">
                Extended ({action.dueDateHistory.length} times)
              </span>
            )}
          </div>

          <div>
            <span className="text-[#5D6961] block font-medium">Source Trigger:</span>
            <Link
              to={sourceLink}
              className="font-mono font-semibold text-[#007A44] hover:underline mt-0.5 inline-flex items-center gap-1"
            >
              <span>{action.sourceNumber}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <span className="capitalize block text-[10px] text-[#5D6961] mt-0.5">
              {action.sourceType.replace('_', ' ')}
            </span>
          </div>

          <div>
            <span className="text-[#5D6961] block font-medium">Assigned By:</span>
            <span className="font-semibold text-[#15251C] mt-0.5 block">{action.assignedByName}</span>
            <span className="text-[10px] text-[#5D6961] block mt-0.5">
              {new Date(action.createdAt).toLocaleDateString('en-GB')}
            </span>
          </div>
        </div>

        {/* Remediation Scope */}
        <div>
          <span className="text-[#5D6961] block font-medium mb-1">
            Remediation Description & Verification Acceptance Criteria:
          </span>
          <div className="p-3.5 bg-[#F7F9F7] rounded-lg text-[#15251C] border border-[#DDE5DF] leading-relaxed whitespace-pre-wrap">
            {action.description}
          </div>
        </div>
      </div>

      {/* Separation of Duties & Independent Verification Card */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
          <div>
            <h2 className="text-sm font-semibold text-[#15251C] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#007A44]" />
              <span>Independent Verification & Closure (ISO 45001 Rule 1.10)</span>
            </h2>
            <p className="text-xs text-[#5D6961]">
              Mandatory two-person rule: The assigned action owner cannot verify or close their own action.
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-[#5D6961]">Current Actor:</span>
            <span className="text-xs font-semibold text-[#15251C] block">
              {appState.currentUser.name} ({appState.currentUser.roleTitle})
            </span>
          </div>
        </div>

        {/* Closed State Display */}
        {action.status === 'closed' ? (
          <div className="p-4 bg-[#EEF7F2] border border-[#BDE3CE] rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-[#007A44]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Action Officially Verified and CLOSED</span>
              </div>
              <span className="font-mono text-[#5D6961] text-[11px]">
                {new Date(action.verifiedAt || '').toLocaleString('en-GB')}
              </span>
            </div>

            <div className="text-[#15251C]">
              Verified and signed off by <strong>{action.verifiedByName}</strong>. Separation of duty validated (Verifier ≠ Owner).
            </div>

            {action.verificationNotes && (
              <div className="text-[#15251C] mt-2 pt-2 border-t border-[#BDE3CE]/60">
                <span className="font-semibold text-[#007A44] block mb-0.5">Verification Audit Notes:</span>
                <p className="italic">{action.verificationNotes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Rejection / Returned for Rework Banner */}
            {action.status === 'returned_for_rework' && (
              <div className="p-4 bg-[#FFF0ED] border border-[#FECDCA] rounded-lg text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-[#B42318]">
                  <XCircle className="w-4 h-4" />
                  <span>Returned for Rework by Reviewer</span>
                </div>
                <p className="text-[#15251C]">
                  The closure evidence submitted was reviewed and determined to be insufficient or incomplete.
                  Please review the reviewer's audit feedback below, execute required remedial adjustments, and submit updated evidence.
                </p>
              </div>
            )}

            {/* Submitted Evidence Preview */}
            {action.evidenceDescription && (
              <div className="p-4 bg-[#F0F9FF] border border-[#B9E6FE] rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#026AA2]">Submitted Completion Evidence:</span>
                  <span className="text-[#5D6961] text-[11px]">
                    Submitted {action.submittedAt ? new Date(action.submittedAt).toLocaleString('en-GB') : ''}
                  </span>
                </div>
                <p className="text-[#15251C]">{action.evidenceDescription}</p>

                {action.evidenceAttachments.length > 0 && (
                  <div className="pt-2 border-t border-[#B9E6FE]/60 space-y-1">
                    <span className="text-[#5D6961] block font-medium">Uploaded Proof Documents:</span>
                    <div className="flex flex-wrap gap-2">
                      {action.evidenceAttachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#B9E6FE] rounded text-xs text-[#026AA2]"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span className="font-mono">{att.name}</span>
                          <span className="text-[10px] text-[#5D6961]">
                            ({Math.round(att.sizeBytes / 1024)} KB)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Verification Form (Authorized Verifier vs Owner) */}
            {isOwner ? (
              <div className="p-4 bg-[#FFFAEB] border border-[#FEDF89] rounded-lg text-xs text-[#B54708] flex items-start gap-3">
                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[#B54708]" />
                <div>
                  <strong className="block font-semibold">Separation of Duty Enforced:</strong>
                  You are currently logged in as <strong>{appState.currentUser.name}</strong>, who is the assigned action owner.
                  Per Contract Award Spec 1.10 and ISO 45001, action owners cannot self-verify or approve their own actions.
                  Please switch users above to an HSE Officer or Manager to verify evidence and close this action.
                </div>
              </div>
            ) : isHSEAuthority ? (
              <div className="p-4 bg-[#F7F9F7] border border-[#DDE5DF] rounded-lg space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#15251C] block">
                    HSE Verification Decision (Sign-off as {appState.currentUser.name}):
                  </label>
                  <span className="text-[10px] text-[#007A44] font-semibold bg-[#EEF7F2] px-2 py-0.5 rounded border border-[#BDE3CE]">
                    Independent Verifier Authorized
                  </span>
                </div>

                <textarea
                  rows={2}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Record objective evidence review notes (e.g. proof test certificate #BP-9982 verified, physical tag inspected, compliance confirmed)..."
                  className="w-full p-2.5 border border-[#DDE5DF] rounded-lg bg-white focus:outline-hidden focus:border-[#007A44]"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-[#5D6961]">
                    Accepting officially closes the action. Returning for rework routes feedback back to owner.
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleVerifyDecision('return_for_rework')}
                      className="px-4 py-2 bg-white border border-[#B42318] text-[#B42318] hover:bg-[#FFF0ED] font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Return for Rework</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVerifyDecision('accept')}
                      className="px-4 py-2 bg-[#007A44] hover:bg-[#005D35] text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Close Action</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#F7F9F7] rounded text-xs text-[#5D6961] italic">
                Only authorized HSE Officers or HSE Managers can verify closure evidence. Action owners cannot self-verify.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Logging & Evidence Submission (Action Owner Controls) */}
      {action.status !== 'closed' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section A: Log Progress Notes */}
          <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#15251C]">Log Progress Update</h3>
              <span className="text-[10px] text-[#5D6961]">Action Owner & Team</span>
            </div>
            <form onSubmit={handleAddProgress} className="space-y-3 text-xs">
              <textarea
                rows={3}
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                placeholder="Log work completed, parts ordered, contractor timeline, or operational updates..."
                className="w-full p-2.5 border border-[#DDE5DF] rounded-lg focus:outline-hidden focus:border-[#007A44]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#15251C] hover:bg-black text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Record Progress Note</span>
              </button>
            </form>
          </div>

          {/* Section B: Submit Evidence for Closure */}
          <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#15251C]">
                {action.status === 'returned_for_rework' ? 'Resubmit Revised Evidence' : 'Submit Closure Evidence'}
              </h3>
              <span className="text-[10px] text-[#5D6961]">For HSE Verification</span>
            </div>

            <p className="text-[11px] text-[#5D6961]">
              <strong>Rule Reminder:</strong> Evidence submission transitions the action to Awaiting Verification, but does NOT count as closure.
            </p>

            <form onSubmit={handleSubmitEvidence} className="space-y-3 text-xs">
              <textarea
                rows={2}
                value={evidenceDesc}
                onChange={(e) => setEvidenceDesc(e.target.value)}
                placeholder="Describe remediation work performed, physical tags verified, or attached certificates..."
                className="w-full p-2.5 border border-[#DDE5DF] rounded-lg focus:outline-hidden focus:border-[#007A44]"
              />

              <div className="flex items-center justify-between text-[11px] text-[#5D6961]">
                <span>Attached Proof Document:</span>
                <select
                  value={evidenceFile}
                  onChange={(e) => setEvidenceFile(e.target.value)}
                  className="text-xs p-1 rounded border border-[#DDE5DF] bg-white font-mono"
                >
                  <option value="asme_hydro_proof_cert_BP9982.pdf">asme_hydro_proof_cert_BP9982.pdf</option>
                  <option value="ballistic_shield_installed_tag.jpg">ballistic_shield_installed_tag.jpg</option>
                  <option value="work_order_signoff_inspection.pdf">work_order_signoff_inspection.pdf</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#007A44] hover:bg-[#005D35] text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {action.status === 'returned_for_rework'
                    ? 'Resubmit Corrected Evidence for Verification'
                    : 'Submit Evidence for Independent Sign-off'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Retained Governance History & Audit Trail Tabs */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center gap-1 border-b border-[#DDE5DF] bg-[#F7F9F7] px-4 pt-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveHistoryTab('timeline')}
            className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeHistoryTab === 'timeline'
                ? 'border-[#007A44] text-[#007A44] bg-white rounded-t'
                : 'border-transparent text-[#5D6961] hover:text-[#15251C]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity & Updates ({action.updates.length})</span>
          </button>

          <button
            onClick={() => setActiveHistoryTab('reassignment')}
            className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeHistoryTab === 'reassignment'
                ? 'border-[#007A44] text-[#007A44] bg-white rounded-t'
                : 'border-transparent text-[#5D6961] hover:text-[#15251C]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Reassignment History ({action.reassignmentHistory?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveHistoryTab('extensions')}
            className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeHistoryTab === 'extensions'
                ? 'border-[#007A44] text-[#007A44] bg-white rounded-t'
                : 'border-transparent text-[#5D6961] hover:text-[#15251C]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Due-Date Extensions ({action.dueDateHistory?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveHistoryTab('reopening')}
            className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeHistoryTab === 'reopening'
                ? 'border-[#007A44] text-[#007A44] bg-white rounded-t'
                : 'border-transparent text-[#5D6961] hover:text-[#15251C]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reopen History ({action.reopenHistory?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveHistoryTab('attachments')}
            className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeHistoryTab === 'attachments'
                ? 'border-[#007A44] text-[#007A44] bg-white rounded-t'
                : 'border-transparent text-[#5D6961] hover:text-[#15251C]'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Evidence Files ({action.evidenceAttachments.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 text-xs">
          {/* Tab 1: Updates Timeline */}
          {activeHistoryTab === 'timeline' && (
            <div className="space-y-3">
              {action.updates.length === 0 ? (
                <p className="text-[#5D6961] italic">No updates recorded yet.</p>
              ) : (
                action.updates.map((upd) => (
                  <div key={upd.id} className="p-3.5 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF] space-y-1.5">
                    <div className="flex items-center justify-between text-[#5D6961]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#15251C]">{upd.authorName}</span>
                        {upd.statusChange && <ActionStatusBadge status={upd.statusChange} size="sm" />}
                      </div>
                      <span className="font-mono text-[11px]">
                        {new Date(upd.timestamp).toLocaleString('en-GB')}
                      </span>
                    </div>
                    <p className="text-[#15251C] leading-relaxed whitespace-pre-wrap">{upd.note}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Reassignment History */}
          {activeHistoryTab === 'reassignment' && (
            <div className="space-y-3">
              {!action.reassignmentHistory || action.reassignmentHistory.length === 0 ? (
                <div className="text-center py-6 text-[#5D6961]">
                  <p>No reassignments have occurred. Action remains with original owner ({action.ownerName}).</p>
                </div>
              ) : (
                <div className="border border-[#DDE5DF] rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Previous Owner</th>
                        <th className="py-2.5 px-3">New Owner</th>
                        <th className="py-2.5 px-3">Reassigned By</th>
                        <th className="py-2.5 px-3">Mandatory Justification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDE5DF]">
                      {action.reassignmentHistory.map((rea) => (
                        <tr key={rea.id}>
                          <td className="py-2.5 px-3 font-mono text-[#5D6961]">
                            {new Date(rea.timestamp).toLocaleDateString('en-GB')}
                          </td>
                          <td className="py-2.5 px-3 text-[#15251C]">{rea.previousOwnerName}</td>
                          <td className="py-2.5 px-3 font-semibold text-[#007A44]">{rea.newOwnerName}</td>
                          <td className="py-2.5 px-3 text-[#5D6961]">{rea.actorName}</td>
                          <td className="py-2.5 px-3 text-[#15251C] italic">{rea.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Due-Date Extensions */}
          {activeHistoryTab === 'extensions' && (
            <div className="space-y-3">
              {!action.dueDateHistory || action.dueDateHistory.length === 0 ? (
                <div className="text-center py-6 text-[#5D6961]">
                  <p>Original deadline preserved. Target due date: {action.dueDate} (Original: {action.originalDueDate}).</p>
                </div>
              ) : (
                <div className="border border-[#DDE5DF] rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Date Extended</th>
                        <th className="py-2.5 px-3">Previous Target</th>
                        <th className="py-2.5 px-3">New Target Due Date</th>
                        <th className="py-2.5 px-3">Authorized By</th>
                        <th className="py-2.5 px-3">Operational Justification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDE5DF]">
                      {action.dueDateHistory.map((ext) => (
                        <tr key={ext.id}>
                          <td className="py-2.5 px-3 font-mono text-[#5D6961]">
                            {new Date(ext.timestamp).toLocaleDateString('en-GB')}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[#5D6961]">{ext.previousDueDate}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-[#007A44]">{ext.newDueDate}</td>
                          <td className="py-2.5 px-3 text-[#5D6961]">{ext.actorName}</td>
                          <td className="py-2.5 px-3 text-[#15251C] italic">{ext.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Reopening History */}
          {activeHistoryTab === 'reopening' && (
            <div className="space-y-3">
              {!action.reopenHistory || action.reopenHistory.length === 0 ? (
                <div className="text-center py-6 text-[#5D6961]">
                  <p>This action has not been reopened.</p>
                </div>
              ) : (
                <div className="border border-[#DDE5DF] rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Reopened At</th>
                        <th className="py-2.5 px-3">Previous Closure Date</th>
                        <th className="py-2.5 px-3">Reopened By</th>
                        <th className="py-2.5 px-3">Mandatory Justification Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDE5DF]">
                      {action.reopenHistory.map((reo) => (
                        <tr key={reo.id}>
                          <td className="py-2.5 px-3 font-mono text-[#5D6961]">
                            {new Date(reo.timestamp).toLocaleString('en-GB')}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[#5D6961]">
                            {reo.previousClosedAt ? new Date(reo.previousClosedAt).toLocaleDateString('en-GB') : 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-[#15251C]">{reo.actorName}</td>
                          <td className="py-2.5 px-3 text-[#15251C] italic">{reo.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Evidence Attachments */}
          {activeHistoryTab === 'attachments' && (
            <div className="space-y-3">
              {action.evidenceAttachments.length === 0 ? (
                <div className="text-center py-6 text-[#5D6961]">
                  <p>No proof documents uploaded yet. Use the evidence submission form above to upload sign-offs or certificates.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {action.evidenceAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 bg-[#F7F9F7] border border-[#DDE5DF] rounded-lg flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-2 bg-white rounded border border-[#DDE5DF] text-[#007A44]">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="font-mono text-xs font-semibold text-[#15251C] block truncate">
                            {att.name}
                          </span>
                          <span className="text-[10px] text-[#5D6961]">
                            {Math.round(att.sizeBytes / 1024)} KB · {att.uploadedBy} · {new Date(att.uploadedAt).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-[#007A44] font-semibold underline shrink-0">
                        View Mock
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reassign Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#DDE5DF] p-6 space-y-4 text-xs animate-in fade-in">
            <h3 className="text-sm font-semibold text-[#15251C]">Reassign Action Ownership</h3>
            <p className="text-[#5D6961]">
              Mandatory Governance Rule: Reassigning an action transfers operational accountability and must include a documented reason.
            </p>

            <form onSubmit={handleReassignSubmit} className="space-y-3">
              <div>
                <label className="text-[#5D6961] block mb-1 font-medium">New Action Owner:</label>
                <select
                  value={newOwnerId}
                  onChange={(e) => setNewOwnerId(e.target.value)}
                  className="w-full p-2 text-xs border border-[#DDE5DF] rounded-lg bg-white"
                >
                  {appState.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.roleTitle} · {u.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#5D6961] block mb-1 font-medium">
                  Reassignment Justification Reason *
                </label>
                <textarea
                  rows={3}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="e.g. Work package transferred to Fabrication Workshop Supervisor due to shift rotation and mechanical tooling requirement..."
                  className="w-full p-2 text-xs border border-[#DDE5DF] rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="px-3.5 py-2 border border-[#DDE5DF] rounded-lg text-[#5D6961] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#007A44] text-white font-semibold rounded-lg hover:bg-[#005D35]"
                >
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Due Date Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#DDE5DF] p-6 space-y-4 text-xs animate-in fade-in">
            <h3 className="text-sm font-semibold text-[#15251C]">Extend Target Due Date</h3>
            <p className="text-[#5D6961]">
              Mandatory Governance Rule: Due date extensions must be accompanied by an operational justification. Prior deadlines are preserved in audit history.
            </p>

            <form onSubmit={handleExtendDueDateSubmit} className="space-y-3">
              <div>
                <label className="text-[#5D6961] block mb-1 font-medium">Current Due Date:</label>
                <span className="font-mono font-semibold text-[#15251C]">{action.dueDate}</span>
              </div>

              <div>
                <label className="text-[#5D6961] block mb-1 font-medium">New Target Due Date *</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full p-2 text-xs border border-[#DDE5DF] rounded-lg bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[#5D6961] block mb-1 font-medium">
                  Operational Justification Reason *
                </label>
                <textarea
                  rows={3}
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  placeholder="e.g. Supply chain lead-time for OEM certified ballistic nylon shroud wrap; customs delay acknowledged..."
                  className="w-full p-2 text-xs border border-[#DDE5DF] rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  className="px-3.5 py-2 border border-[#DDE5DF] rounded-lg text-[#5D6961] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#007A44] text-white font-semibold rounded-lg hover:bg-[#005D35]"
                >
                  Confirm Extension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#DDE5DF] p-6 space-y-4 text-xs animate-in fade-in">
            <h3 className="text-sm font-semibold text-[#15251C]">Reopen Corrective Action</h3>
            <p className="text-[#5D6961]">
              Mandatory Governance Rule: Only an authorized HSE reviewer can reopen a closed action. Reopening resets the status to In Progress and requires documented justification.
            </p>

            <form onSubmit={handleReopenSubmit} className="space-y-3">
              <div>
                <label className="text-[#5D6961] block mb-1 font-medium">
                  Reopening Justification & Re-audit Finding *
                </label>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Post-closure surveillance audit discovered clamp tension dropped below ASME specification during cyclic pressure runs..."
                  className="w-full p-2 text-xs border border-[#DDE5DF] rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-3.5 py-2 border border-[#DDE5DF] rounded-lg text-[#5D6961] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#B54708] text-white font-semibold rounded-lg hover:bg-[#93370D]"
                >
                  Reopen Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
