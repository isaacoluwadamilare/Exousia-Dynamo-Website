import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ContractReferenceModal } from '../../components/ContractReferenceModal';
import {
  HelpCircle,
  AlertTriangle,
  FileText,
  ClipboardCheck,
  CheckSquare,
  ShieldCheck,
  Users,
  Search,
  BookOpen,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ExternalLink,
  Shield
} from 'lucide-react';

export const HelpWorkspacePage: React.FC = () => {
  const [showContractModal, setShowContractModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is the distinction between an Incident and a Near Miss?',
      a: 'Per Contract Scope Clause 1.2, an Incident involves actual injury, occupational illness, environmental release, or asset damage. A Near Miss is an unplanned event that did not result in injury or damage, but had the realistic potential to do so under slightly altered circumstances. Near misses must never be minimized or omitted.'
    },
    {
      q: 'What is the "Two-Person Rule" for Corrective Action closure?',
      a: 'To guarantee operational integrity and prevent conflicts of interest, an Action Owner who executes remediation work cannot approve or verify their own closure evidence. An independent HSE Officer or HSE Manager must review before/after photographic proof and certify completion.'
    },
    {
      q: 'How does the 5 × 5 Risk Matrix calculate severity and likelihood?',
      a: 'The risk score is calculated as Severity (1 to 5) × Likelihood (1 to 5), yielding a score between 1 and 25. Scores of 1–4 are Low risk, 5–9 are Medium risk, 10–16 are High risk, and 17–25 are Critical risk. Critical items require instant operational suspension and senior management notification.'
    },
    {
      q: 'When are Corrective Actions considered overdue?',
      a: 'Overdue status is derived automatically based on the scheduled completion date evaluated at 23:59:59 West Africa Time (Africa/Lagos, UTC+1). The system automatically flags overdue items across all dashboard views without requiring manual batch updates.'
    },
    {
      q: 'How do statutory compliance evaluations operate?',
      a: 'Statutory compliance maintains strict separation between calendar review dates and assessed compliance status. Even if a permit is valid for another 6 months, if field audits detect non-conformance, its evaluated compliance status will reflect the non-conformity immediately.'
    }
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#007A44] uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>OPERATIONAL KNOWLEDGE BASE</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#15251C] mt-1">
            User Guidance & Operational Workflows
          </h1>
          <p className="text-xs text-[#5D6961] mt-1">
            Standard operating procedures, duty separation rules, and emergency guidelines for Exousia HSE platform users.
          </p>
        </div>

        <button
          onClick={() => setShowContractModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-[#007A44] text-[#007A44] hover:bg-[#EEF7F2] text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Shield className="w-4 h-4" />
          <span>View Contract Scope</span>
        </button>
      </div>

      {/* Critical Emergency Banner */}
      <div className="bg-[#FFF0ED] border border-[#FECDCA] rounded-xl p-5 text-xs text-[#B42318] space-y-2">
        <div className="font-bold flex items-center gap-2 text-sm text-[#B42318]">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>CRITICAL SAFETY NOTICE: Emergencies & Imminent Danger</span>
        </div>
        <p className="leading-relaxed">
          This digital portal is built for formal documentation, regulatory auditing, and corrective action follow-through. <strong>Online reporting is never a substitute for instant emergency response.</strong> In case of active fire, gas release (H2S), hydrocarbon spill, explosion, or medical emergency:
        </p>
        <ul className="list-disc pl-5 space-y-1 font-medium">
          <li>Immediately evacuate the danger zone to your assigned Muster Station.</li>
          <li>Sound the nearest physical alarm or activate the break-glass station.</li>
          <li>Notify the On-Scene Commander / HSE Radio Dispatch (VHF Ch 16 / UHF Ch 1).</li>
          <li>Do not attempt to record or upload photos until the area is declared safe.</li>
        </ul>
      </div>

      {/* Workflow Guidance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-xl border border-[#DDE5DF] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#007A44] font-semibold text-sm">
            <FileText className="w-4 h-4" />
            <span>1. Reporting Observations</span>
          </div>
          <p className="text-xs text-[#5D6961] leading-relaxed">
            Record incidents, near misses, or hazard conditions as soon as safety permits. Provide exact physical coordinates, immediate actions taken to isolate danger, and objective description without subjective blame.
          </p>
          <div className="pt-2">
            <Link
              to="/app/reports/new"
              className="text-xs font-semibold text-[#007A44] hover:underline inline-flex items-center gap-1"
            >
              <span>Submit a new report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-[#DDE5DF] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#007A44] font-semibold text-sm">
            <ClipboardCheck className="w-4 h-4" />
            <span>2. Executing Inspections</span>
          </div>
          <p className="text-xs text-[#5D6961] leading-relaxed">
            Complete assigned inspection checklists using Pass, Fail, or N/A options. Failed checkpoints immediately prompt creation of linked Corrective Actions with assigned supervisory owners.
          </p>
          <div className="pt-2">
            <Link
              to="/app/inspections"
              className="text-xs font-semibold text-[#007A44] hover:underline inline-flex items-center gap-1"
            >
              <span>View scheduled inspections</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-[#DDE5DF] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#007A44] font-semibold text-sm">
            <CheckSquare className="w-4 h-4" />
            <span>3. Corrective Action Follow-Through</span>
          </div>
          <p className="text-xs text-[#5D6961] leading-relaxed">
            Action owners submit photographic evidence of completed remediations. An independent HSE Officer must sign off before the action can transition from "Awaiting Verification" to "Closed".
          </p>
          <div className="pt-2">
            <Link
              to="/app/actions"
              className="text-xs font-semibold text-[#007A44] hover:underline inline-flex items-center gap-1"
            >
              <span>Track corrective actions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-[#DDE5DF] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#007A44] font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>4. Regulatory Compliance Audit Trails</span>
          </div>
          <p className="text-xs text-[#5D6961] leading-relaxed">
            Obligations under NUPRC/DPR, Federal Ministry of Environment, and client safety charters are tracked with full version history and formula-sanitized CSV export capabilities.
          </p>
          <div className="pt-2">
            <Link
              to="/app/compliance"
              className="text-xs font-semibold text-[#007A44] hover:underline inline-flex items-center gap-1"
            >
              <span>Inspect compliance register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DDE5DF]">
          <div>
            <h2 className="text-base font-semibold text-[#15251C]">Frequently Asked Questions</h2>
            <p className="text-xs text-[#5D6961] mt-0.5">Quick answers to common operational and policy inquiries.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#5D6961] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F9F7] border border-[#DDE5DF] rounded-lg text-[#15251C] placeholder-[#5D6961] outline-hidden focus:border-[#007A44]"
            />
          </div>
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#5D6961]">
            No help topics matched "{searchQuery}". Clear your search or contact support.
          </div>
        ) : (
          <div className="divide-y divide-[#DDE5DF]">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="py-3.5">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-4 text-left text-xs font-semibold text-[#15251C] hover:text-[#007A44] transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#007A44] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#5D6961] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs text-[#5D6961] leading-relaxed pr-6">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Operational Contacts */}
      <div className="bg-[#F7F9F7] rounded-xl border border-[#DDE5DF] p-6 text-xs text-[#15251C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-sm">Need direct operational support?</div>
          <div className="text-[#5D6961] mt-0.5">
            Exousia Dynamo Energy Ltd HSE Technical Support Desk · Port Harcourt, Nigeria
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="mailto:info@exousiadynamoenergy.com"
            className="px-3.5 py-2 rounded-lg bg-white border border-[#DDE5DF] text-[#15251C] hover:text-[#007A44] font-medium flex items-center gap-1.5 shadow-xs"
          >
            <Mail className="w-3.5 h-3.5 text-[#007A44]" />
            <span>info@exousiadynamoenergy.com</span>
          </a>
        </div>
      </div>

      <ContractReferenceModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
      />
    </div>
  );
};
