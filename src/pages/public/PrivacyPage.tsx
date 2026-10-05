import React from 'react';
import { Link } from 'react-router-dom';
import { ExousiaLogo } from '../../components/ExousiaLogo';
import { Shield, Lock, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { CONTRACT_CLIENT_DISPLAY, DELIVERY_CONTRACTOR } from '../../constants/contractScope';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F9F7] py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#DDE5DF]">
          <Link to="/">
            <ExousiaLogo variant="full" theme="light" height={40} />
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold text-[#007A44] hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Platform Home</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-[#DDE5DF] p-8 space-y-6 text-xs text-[#15251C]">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#15251C]">
              Operational Data Privacy & Confidentiality Notice
            </h1>
            <p className="text-[#5D6961]">
              Contractual governance under Award Agreement Clause 6 with {CONTRACT_CLIENT_DISPLAY}.
            </p>
          </div>

          <div className="p-4 bg-[#EEF7F2] border border-[#BDE3CE] rounded-lg text-[#007A44] space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Contractual Confidentiality Mandate (Clause 6)</span>
            </div>
            <p className="leading-relaxed">
              "{DELIVERY_CONTRACTOR} shall maintain strict confidentiality regarding all business information, operational information, documents, data and materials provided by {CONTRACT_CLIENT_DISPLAY} during the execution of the contract."
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#15251C]">1. Evidence & Incident Photograph Protection</h2>
            <p className="text-[#5D6961] leading-relaxed">
              Incident evidence photos and witness statements contain sensitive operational and personal data. Under system architecture Section 9, attachments are stored in private tenant-isolated repositories. No public URLs are ever issued. Access is restricted to authorized HSE investigators and verified supervisors.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#15251C]">2. Independent Audit Immutability</h2>
            <p className="text-[#5D6961] leading-relaxed">
              All state transitions (incident logging, risk re-rating, CAPA assignment, evidence review, and verification closure) generate append-only audit events. Records cannot be retroactively modified or purged without administrative provenance.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#15251C]">3. Spreadsheet Formula Injection Protection</h2>
            <p className="text-[#5D6961] leading-relaxed">
              In accordance with contract cybersecurity specifications, all CSV report exports automatically sanitize leading spreadsheet executable operators (including '=', '+', '-', and '@') to protect managerial workstations from CSV injection attacks.
            </p>
          </div>

          <div className="pt-6 border-t border-[#DDE5DF] text-[#5D6961] text-[11px] flex justify-between items-center">
            <span>Effective: 02 October 2026 · Version 1.0</span>
            <span>Exousia Dynamo Energy Ltd</span>
          </div>
        </div>
      </div>
    </div>
  );
};
