import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { hseDataService, HSEAppState } from '../../services/hseDataService';
import { ComplianceStateBadge, DueDateHorizonBadge, Badge } from '../../components/Badge';
import { ComplianceState } from '../../types/hse';
import {
  ArrowLeft,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  FileText,
  Clock,
  User,
  Paperclip,
  Plus,
  ExternalLink,
  History,
  Check,
  Building,
  RotateCcw
} from 'lucide-react';

interface ComplianceDetailPageProps {
  appState: HSEAppState;
}

export const ComplianceDetailPage: React.FC<ComplianceDetailPageProps> = ({ appState }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const obligation = appState.compliance.find(c => c.id === id);

  const [complianceState, setComplianceState] = useState<ComplianceState>(
    obligation?.complianceState || 'compliant'
  );
  const [reviewNotes, setReviewNotes] = useState('');
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const [customEvidenceName, setCustomEvidenceName] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!obligation) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[#DDE5DF] max-w-xl mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-[#15251C]">Compliance Obligation Not Found</h2>
        <p className="text-xs text-[#5D6961]">
          The compliance record identifier does not match any current or archived obligation.
        </p>
        <Link
          to="/app/compliance"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#007A44] text-white text-xs font-semibold rounded-lg hover:bg-[#005D35]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Compliance Register</span>
        </Link>
      </div>
    );
  }

  const currentDate = '2026-10-02';
  const canReview = ['hse_officer', 'hse_manager', 'admin'].includes(appState.currentUser.role);

  // Applicable sites objects
  const applicableSites = appState.sites.filter(s => obligation.applicableSiteIds.includes(s.id));

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewNotes.trim()) {
      setFeedbackMessage('Mandatory: Technical review and verification notes are required.');
      return;
    }

    const res = hseDataService.updateComplianceReview(
      obligation.id,
      complianceState,
      reviewNotes.trim(),
      evidenceFileName.trim() || undefined
    );

    if (res.success) {
      setFeedbackMessage('Compliance assessment and review history updated successfully.');
      setReviewNotes('');
      setEvidenceFileName('');
    }
  };

  const handleAddEvidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEvidenceName.trim()) return;

    hseDataService.addComplianceEvidence(obligation.id, customEvidenceName.trim());
    setCustomEvidenceName('');
    setIsAddingEvidence(false);
    setFeedbackMessage('Evidentiary document attached successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/compliance')}
            className="p-1.5 rounded-lg border border-[#DDE5DF] bg-white text-[#5D6961] hover:text-[#15251C] transition-colors"
            title="Back to compliance register"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#15251C] bg-[#F7F9F7] px-2 py-0.5 rounded border border-[#DDE5DF]">
                {obligation.obligationNumber}
              </span>
              <ComplianceStateBadge state={obligation.complianceState} size="sm" />
              <DueDateHorizonBadge dueDate={obligation.dueDate} referenceDate={currentDate} size="sm" />
              {obligation.isInternalStandard && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0F9FF] text-[#026AA2] border border-[#B9E6FE]">
                  Sample Internal Obligation
                </span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-[#15251C] mt-1.5">{obligation.title}</h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {obligation.complianceState === 'non_compliant' && (
            <Link
              to="/app/actions"
              className="px-3.5 py-1.5 bg-[#B42318] hover:bg-[#912018] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Raise Corrective Action</span>
            </Link>
          )}
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-[#EEF7F2] border border-[#BDE3CE] text-xs text-[#007A44] flex items-start gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{feedbackMessage}</div>
          <button onClick={() => setFeedbackMessage(null)} className="text-[#007A44] hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Dual-State Principle Card */}
      <div className="p-4 bg-[#F0F9FF] border border-[#B9E6FE] rounded-xl text-xs text-[#026AA2] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-semibold">
            Compliance State vs. Due-Date Horizon Governance (Contract Clause 1.8):
          </strong>
          A future deadline alone does not confirm compliance. An obligation can have a future calendar target
          while assessed <em>Non-Compliant</em> due to field audit findings (as in CMP-2026-003). Conversely, an
          obligation can be verified <em>Compliant</em> while its recertification calendar deadline is pending.
        </div>
      </div>

      {/* Facts Card */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-4 border-b border-[#DDE5DF]">
          <div>
            <span className="text-[#5D6961] block font-medium">Standard / Source:</span>
            <span className="font-semibold text-[#15251C] mt-0.5 block font-mono">
              {obligation.sourceReference}
            </span>
          </div>

          <div>
            <span className="text-[#5D6961] block font-medium">Governing Authority / Body:</span>
            <span className="font-semibold text-[#15251C] mt-0.5 block">
              {obligation.regulatorOrAuthority}
            </span>
          </div>

          <div>
            <span className="text-[#5D6961] block font-medium">Accountable Custodian:</span>
            <span className="font-semibold text-[#15251C] mt-0.5 block">
              {obligation.ownerName}
            </span>
          </div>

          <div>
            <span className="text-[#5D6961] block font-medium">Recertification Due Date:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-semibold font-mono text-[#15251C]">{obligation.dueDate}</span>
            </div>
            <span className="text-[10px] text-[#5D6961] block mt-0.5">
              Calendar Horizon: <DueDateHorizonBadge dueDate={obligation.dueDate} referenceDate={currentDate} size="sm" />
            </span>
          </div>
        </div>

        {/* Applicable Operational Facilities */}
        <div>
          <span className="text-[#5D6961] block font-medium mb-1.5">
            Applicable Operational Facilities:
          </span>
          <div className="flex flex-wrap gap-2">
            {applicableSites.map(s => (
              <span
                key={s.id}
                className="px-2.5 py-1 bg-[#F7F9F7] border border-[#DDE5DF] rounded text-xs text-[#15251C] font-medium flex items-center gap-1.5"
              >
                <Building className="w-3.5 h-3.5 text-[#007A44]" />
                <span>{s.name} ({s.code})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Category & Scope */}
        {obligation.category && (
          <div className="pt-3 border-t border-[#DDE5DF] flex items-center gap-2">
            <span className="text-[#5D6961] font-medium">Obligation Category:</span>
            <span className="font-semibold text-[#15251C]">{obligation.category}</span>
          </div>
        )}
      </div>

      {/* Audited Evidentiary Records */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
          <div>
            <h2 className="text-sm font-semibold text-[#15251C] flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-[#007A44]" />
              <span>Audited Evidentiary Records ({obligation.evidenceAttachments.length})</span>
            </h2>
            <p className="text-xs text-[#5D6961]">
              Verified certificates, inspection sheets, laboratory test results, and audit proof documents.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingEvidence(!isAddingEvidence)}
            className="text-xs font-semibold text-[#007A44] hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Attach Proof Document</span>
          </button>
        </div>

        {/* Add Evidence Form */}
        {isAddingEvidence && (
          <form onSubmit={handleAddEvidenceSubmit} className="p-3.5 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF] space-y-2 animate-in fade-in">
            <label className="font-semibold text-[#15251C] block">
              Document File Name / Reference:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customEvidenceName}
                onChange={(e) => setCustomEvidenceName(e.target.value)}
                placeholder="e.g. quarterly_groundwater_lab_analysis_report.pdf"
                className="flex-1 p-2 text-xs border border-[#DDE5DF] rounded-lg bg-white font-mono"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#007A44] text-white font-semibold rounded-lg hover:bg-[#005D35]"
              >
                Attach
              </button>
              <button
                type="button"
                onClick={() => setIsAddingEvidence(false)}
                className="px-3 py-2 border border-[#DDE5DF] bg-white text-[#5D6961] rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Documents List */}
        {obligation.evidenceAttachments.length === 0 ? (
          <div className="p-4 bg-[#F7F9F7] rounded-lg text-center text-[#5D6961] italic">
            No evidentiary certificates currently uploaded. Attach audit proof using the button above.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {obligation.evidenceAttachments.map((att) => (
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
                      {Math.round(att.sizeBytes / 1024)} KB · Uploaded by {att.uploadedBy} · {new Date(att.uploadedAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-[#007A44] font-semibold underline shrink-0 cursor-pointer">
                  View Proof
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conduct Compliance Assessment Form */}
      {canReview && (
        <form onSubmit={handleSaveReview} className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 text-xs">
          <div className="pb-3 border-b border-[#DDE5DF] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#15251C] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#007A44]" />
                <span>Conduct Compliance Assessment Review</span>
              </h2>
              <p className="text-xs text-[#5D6961]">
                Authorized review signed off by {appState.currentUser.name} ({appState.currentUser.roleTitle}).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                Assessed Compliance Outcome *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label
                  className={`p-2.5 rounded-lg border cursor-pointer text-center ${
                    complianceState === 'compliant'
                      ? 'bg-[#EEF7F2] border-[#007A44] text-[#007A44] font-bold'
                      : 'bg-white border-[#DDE5DF] text-[#5D6961]'
                  }`}
                >
                  <input
                    type="radio"
                    name="evalState"
                    value="compliant"
                    checked={complianceState === 'compliant'}
                    onChange={() => setComplianceState('compliant')}
                    className="sr-only"
                  />
                  Compliant - Evidence Confirmed
                </label>

                <label
                  className={`p-2.5 rounded-lg border cursor-pointer text-center ${
                    complianceState === 'non_compliant'
                      ? 'bg-[#FFF0ED] border-[#B42318] text-[#B42318] font-bold'
                      : 'bg-white border-[#DDE5DF] text-[#5D6961]'
                  }`}
                >
                  <input
                    type="radio"
                    name="evalState"
                    value="non_compliant"
                    checked={complianceState === 'non_compliant'}
                    onChange={() => setComplianceState('non_compliant')}
                    className="sr-only"
                  />
                  Non-Compliant - Deficiency Found
                </label>

                <label
                  className={`p-2.5 rounded-lg border cursor-pointer text-center ${
                    complianceState === 'not_assessed'
                      ? 'bg-[#F7F9F7] border-[#5D6961] text-[#15251C] font-bold'
                      : 'bg-white border-[#DDE5DF] text-[#5D6961]'
                  }`}
                >
                  <input
                    type="radio"
                    name="evalState"
                    value="not_assessed"
                    checked={complianceState === 'not_assessed'}
                    onChange={() => setComplianceState('not_assessed')}
                    className="sr-only"
                  />
                  Not Assessed - Pending Testing
                </label>
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                Verification Notes & Audit Findings *
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Document physical observations, certificate numbers audited, testing agency credentials, or specific non-conformances identified..."
                className="w-full p-2.5 border border-[#DDE5DF] rounded-lg bg-white focus:outline-hidden focus:border-[#007A44]"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-[#15251C] block mb-1">
                Attach Supporting Certificate / Audit Sheet (Optional)
              </label>
              <input
                type="text"
                value={evidenceFileName}
                onChange={(e) => setEvidenceFileName(e.target.value)}
                placeholder="e.g. audit_signoff_certificate_oct2026.pdf"
                className="w-full p-2.5 border border-[#DDE5DF] rounded-lg bg-white font-mono"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 bg-[#007A44] hover:bg-[#005D35] text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Assessment Audit Log</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Assessment and Review History Timeline */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 text-xs">
        <h2 className="text-sm font-semibold text-[#15251C] pb-3 border-b border-[#DDE5DF] flex items-center gap-2">
          <History className="w-4 h-4 text-[#007A44]" />
          <span>Assessment & Verification History ({obligation.reviewHistory?.length || 0})</span>
        </h2>

        {!obligation.reviewHistory || obligation.reviewHistory.length === 0 ? (
          <div className="p-4 bg-[#F7F9F7] rounded-lg text-center text-[#5D6961] italic">
            No formal review assessments recorded yet. Use the review form above to log periodic verification.
          </div>
        ) : (
          <div className="space-y-3">
            {obligation.reviewHistory.map((rev) => (
              <div
                key={rev.id}
                className="p-4 bg-[#F7F9F7] rounded-xl border border-[#DDE5DF] space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#15251C]">{rev.reviewerName}</span>
                    <span className="text-[#5D6961]">assessed status as</span>
                    <ComplianceStateBadge state={rev.newState} size="sm" />
                  </div>
                  <span className="font-mono text-[#5D6961] text-[11px]">
                    {new Date(rev.timestamp).toLocaleString('en-GB')}
                  </span>
                </div>

                <p className="text-[#15251C] leading-relaxed whitespace-pre-wrap">{rev.notes}</p>

                {rev.evidenceAttachments && rev.evidenceAttachments.length > 0 && (
                  <div className="pt-2 border-t border-[#DDE5DF] flex items-center gap-2">
                    <span className="text-[#5D6961]">Attached Evidence:</span>
                    <span className="font-mono text-[#007A44] font-semibold underline">
                      {rev.evidenceAttachments[0].name}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
