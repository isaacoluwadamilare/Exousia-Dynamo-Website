import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HSEAppState, hseDataService } from '../services/hseDataService';
import {
  ShieldCheck,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  AlertTriangle,
  Upload,
  Calendar,
  Sparkles
} from 'lucide-react';
import { ActionStatusBadge, ActionTypeBadge, Badge } from './Badge';

interface DemonstrationSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: HSEAppState;
}

export const DemonstrationSimulatorModal: React.FC<DemonstrationSimulatorModalProps> = ({
  isOpen,
  onClose,
  appState
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: 'Action Assignment & Source Linkage',
      actor: 'Josephine Yese (HSE Manager)',
      role: 'Assigner / HSE Authority',
      status: 'open' as const,
      timestamp: '29 Sep 2026 09:30',
      badge: 'Assignment',
      summary:
        'Triggered by High-Pressure Rupture incident INC-2026-081. Action assigned to Workshop Supervisor Emeka Nwosu.',
      details: [
        'Mandatory fields enforced: Source (INC-2026-081), Title, Corrective Type, Description, Owner (Emeka Nwosu), and Due Date (2026-10-10).',
        'System logs audit trail entry ACTION_ASSIGNED.',
        'Separation of duty rule registered: Emeka Nwosu is blocked from ever approving his own closure.'
      ]
    },
    {
      step: 2,
      title: 'Progress Logging & Remediation Work',
      actor: 'Emeka Nwosu (Fabrication Supervisor)',
      role: 'Action Owner',
      status: 'in_progress' as const,
      timestamp: '30 Sep 2026 11:00',
      badge: 'In Progress',
      summary:
        'Action owner logs operational progress: completed physical measurements and raised vendor purchase order PR-2026-441.',
      details: [
        'Status transitions to "in_progress".',
        'Owner documents lead-time for OEM ballistic shroud and requests due-date extension to 2026-10-15.',
        'System retains justification reason in dueDateHistory audit record.'
      ]
    },
    {
      step: 3,
      title: 'Initial Evidence Submission (Not Closed!)',
      actor: 'Emeka Nwosu (Fabrication Supervisor)',
      role: 'Action Owner',
      status: 'awaiting_verification' as const,
      timestamp: '01 Oct 2026 16:00',
      badge: 'Evidence Submitted',
      summary:
        'Owner mounts shroud and submits installation photo. Critical rule: Evidence submission does NOT count as closure!',
      details: [
        'Status transitions to "awaiting_verification".',
        'Deadline remains active: If the target date passes before sign-off, action is overdue.',
        'Action owner cannot verify completion; independent HSE review is required.'
      ]
    },
    {
      step: 4,
      title: 'HSE Audit & Rejection (Returned for Rework)',
      actor: 'Ibrahim Olatunji (HSE Officer)',
      role: 'Independent Verifier',
      status: 'returned_for_rework' as const,
      timestamp: '02 Oct 2026 09:00',
      badge: 'Returned for Rework',
      summary:
        'HSE Officer performs physical bunker inspection and discovers vendor ASME B31.3 proof test certificate is missing. Evidence REJECTED.',
      details: [
        'Reviewer inputs mandatory rejection comments detailing missing calibration tag & pressure certificate.',
        'Status transitions to "returned_for_rework".',
        'Feedback is immediately routed back to action owner Emeka Nwosu to execute required rework.'
      ]
    },
    {
      step: 5,
      title: 'Rework Execution & Evidence Resubmission',
      actor: 'Emeka Nwosu (Fabrication Supervisor)',
      role: 'Action Owner',
      status: 'awaiting_verification' as const,
      timestamp: '02 Oct 2026 14:10',
      badge: 'Resubmitted',
      summary:
        'Supervisor procures ASME certificate #BP-9982, rivets calibration tag, and resubmits complete proof package.',
      details: [
        'Attached documents: ballistic_shield_installed_tag.jpg and asme_hydro_proof_cert_BP9982.pdf.',
        'Status returns to "awaiting_verification" for second-person review.',
        'Full timeline of rejection and resubmission is retained in action activity updates.'
      ]
    },
    {
      step: 6,
      title: 'Independent Verification & Verified Closure',
      actor: 'Josephine Yese (HSE Manager)',
      role: 'Authorized Independent Verifier',
      status: 'closed' as const,
      timestamp: '02 Oct 2026 16:30',
      badge: 'Verified & Closed',
      summary:
        'HSE Manager audits vendor cert against ASME B31.3 codes, inspects physical tag, and formally closes action.',
      details: [
        'Two-person rule verified: Verifier (Josephine Yese) is different from action owner (Emeka Nwosu).',
        'Action status set to "closed" with verifiedById, verifiedByName, and technical sign-off notes.',
        'Overdue status neutralized; source incident report INC-2026-081 updated to closure review.'
      ]
    }
  ];

  const current = steps[currentStep - 1];

  const handleOpenDemoAction = () => {
    // Ensure demo action is in state
    hseDataService.demonstrateActionLifecycle();
    onClose();
    navigate('/app/actions/act-demo');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-xl shadow-2xl border border-[#DDE5DF] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5DF] bg-[#F7F9F7]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#007A44]/10 text-[#007A44] rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#15251C]">
                  CAPA Full Lifecycle Demonstration Simulator
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#007A44] text-white">
                  6-Stage Standard
                </span>
              </div>
              <p className="text-xs text-[#5D6961]">
                Demonstrating assignment, progress, evidence submission, rejection, resubmission, and verified closure.
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

        {/* Stepper Progress Bar */}
        <div className="px-6 py-3 bg-[#EEF7F2] border-b border-[#BDE3CE]">
          <div className="flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
            {steps.map((s) => (
              <button
                key={s.step}
                onClick={() => setCurrentStep(s.step)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                  currentStep === s.step
                    ? 'bg-[#007A44] text-white shadow-xs font-semibold'
                    : currentStep > s.step
                    ? 'bg-[#BDE3CE] text-[#005D35]'
                    : 'bg-white/80 text-[#5D6961] hover:bg-white'
                }`}
              >
                <span>{s.step}.</span>
                <span>{s.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stage Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Card Header */}
          <div className="p-4 rounded-xl border border-[#DDE5DF] bg-[#F7F9F7] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#007A44]">
                  Stage {current.step} of 6
                </span>
                <span className="text-[#5D6961]">·</span>
                <h3 className="text-sm font-semibold text-[#15251C]">{current.title}</h3>
              </div>
              <ActionStatusBadge status={current.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#DDE5DF] text-xs">
              <div>
                <span className="text-[#5D6961] block">Actor:</span>
                <span className="font-semibold text-[#15251C] mt-0.5 block">{current.actor}</span>
              </div>
              <div>
                <span className="text-[#5D6961] block">Governance Role:</span>
                <span className="font-semibold text-[#15251C] mt-0.5 block">{current.role}</span>
              </div>
              <div>
                <span className="text-[#5D6961] block">Timestamp:</span>
                <span className="font-mono text-[#5D6961] mt-0.5 block">{current.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Operational Summary */}
          <div>
            <h4 className="font-semibold text-[#15251C] mb-1.5">Stage Summary & Operational Narrative:</h4>
            <div className="p-3.5 bg-white border border-[#DDE5DF] rounded-lg text-[#15251C] leading-relaxed">
              {current.summary}
            </div>
          </div>

          {/* Governance Requirements Enforced */}
          <div>
            <h4 className="font-semibold text-[#15251C] mb-1.5">Compliance Rules & System Enforcements:</h4>
            <ul className="space-y-2">
              {current.details.map((d, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF] text-[#15251C]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#007A44] shrink-0 mt-0.5" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Spec Callout Box */}
          {current.step === 3 && (
            <div className="p-3.5 bg-[#FFFAEB] border border-[#FEDF89] rounded-lg text-[#B54708] flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Critical Specification Rule:</strong> Evidence submission does NOT count as closure.
                The action status moves to awaiting_verification, but remains subject to the original deadline.
                Overdue status is derived from the due date until independent verification is completed.
              </div>
            </div>
          )}

          {current.step === 4 && (
            <div className="p-3.5 bg-[#FFF0ED] border border-[#FECDCA] rounded-lg text-[#B42318] flex items-start gap-2.5">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Returned for Rework Workflow:</strong> When verification evidence is inadequate or missing certificates,
                the verifier must provide objective technical notes. The action transitions to "returned_for_rework"
                so the action owner can rectify deficiencies and resubmit without losing historical records.
              </div>
            </div>
          )}

          {current.step === 6 && (
            <div className="p-3.5 bg-[#EEF7F2] border border-[#BDE3CE] rounded-lg text-[#007A44] flex items-start gap-2.5">
              <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Separation of Duty Enforced:</strong> Action owner (Emeka Nwosu) was prevented from approving his own work.
                HSE Manager Josephine Yese completed the independent verification and closure sign-off, fulfilling Contract Award Spec 1.10.
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 border-t border-[#DDE5DF] bg-[#F7F9F7] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              className="px-3.5 py-2 border border-[#DDE5DF] rounded-lg text-[#5D6961] hover:text-[#15251C] font-semibold bg-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Stage</span>
            </button>

            <button
              type="button"
              disabled={currentStep === 6}
              onClick={() => setCurrentStep(prev => Math.min(6, prev + 1))}
              className="px-3.5 py-2 bg-[#15251C] hover:bg-black text-white font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span>Next Stage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenDemoAction}
            className="px-4 py-2 bg-[#007A44] hover:bg-[#005D35] text-white font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Verified Record (ACT-2026-DEMO)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
