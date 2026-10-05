import React from 'react';
import { Link } from 'react-router-dom';
import { ExousiaLogo } from '../../components/ExousiaLogo';
import {
  HelpCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  ClipboardCheck,
  ShieldCheck,
  Users
} from 'lucide-react';

export const HelpPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F9F7] py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-6">
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

        {/* Emergency Callout Banner */}
        <div className="bg-[#FFF0ED] border border-[#FECDCA] rounded-xl p-5 text-xs text-[#B42318] space-y-2">
          <div className="font-bold flex items-center gap-2 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>CRITICAL SAFETY NOTICE: Imminent Danger & Emergencies</span>
          </div>
          <p className="leading-relaxed">
            This digital platform is designed for documentation, investigation, and compliance tracking. <strong>Online reporting is not a substitute for immediate emergency response.</strong> In case of active fire, toxic gas leak (H2S), hydrocarbon blowout, explosion, or severe medical trauma:
          </p>
          <ul className="list-disc pl-5 space-y-1 font-medium">
            <li>Immediately evacuate the immediate hazard area.</li>
            <li>Sound the facility alarm or activate the nearest manual break-glass call point.</li>
            <li>Proceed directly to your designated Site Muster Station.</li>
            <li>Report in person to the Site Incident Commander / On-Scene Commander.</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-[#DDE5DF] p-8 space-y-8 text-xs text-[#15251C]">
          <div>
            <h1 className="text-2xl font-bold text-[#15251C]">
              User Help & Operational Workflow Guide
            </h1>
            <p className="text-[#5D6961] mt-1">
              Field guidance for personnel logging reports, conducting inspections, and verifying CAPA items.
            </p>
          </div>

          {/* Workflow Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-[#F7F9F7] rounded-xl border border-[#DDE5DF] space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#007A44] text-sm">
                <FileText className="w-4 h-4" />
                <span>1. Reporting Incidents vs. Near Misses</span>
              </div>
              <p className="text-[#5D6961] leading-relaxed">
                An <strong>Incident</strong> involves actual injury, illness, environmental release, or asset damage. A <strong>Near Miss</strong> is an unplanned event where, under slightly different conditions, injury or damage could have occurred, but did not. Always log near misses to eliminate root hazards before injuries occur.
              </p>
            </div>

            <div className="p-4 bg-[#F7F9F7] rounded-xl border border-[#DDE5DF] space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#007A44] text-sm">
                <ClipboardCheck className="w-4 h-4" />
                <span>2. Executing HSE Inspections</span>
              </div>
              <p className="text-[#5D6961] leading-relaxed">
                Inspectors must evaluate every item using <strong>Pass</strong>, <strong>Fail</strong>, or <strong>N/A</strong>. Any failed item requires an objective finding note and allows immediate generation of a corrective action assigned to the facility supervisor.
              </p>
            </div>

            <div className="p-4 bg-[#F7F9F7] rounded-xl border border-[#DDE5DF] space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#007A44] text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>3. CAPA Two-Person Verification Rule</span>
              </div>
              <p className="text-[#5D6961] leading-relaxed">
                To maintain regulatory rigor, action owners can upload progress logs and attach closure certificates, but <strong>cannot self-verify</strong> their own actions. An independent HSE Officer or Manager must verify the evidence before formal closure.
              </p>
            </div>

            <div className="p-4 bg-[#F7F9F7] rounded-xl border border-[#DDE5DF] space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#007A44] text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>4. Compliance Monitoring</span>
              </div>
              <p className="text-[#5D6961] leading-relaxed">
                Statutory permits and boiler recertifications must be reviewed periodically. The system categorizes obligations into <em>Current</em>, <em>Due Soon</em> (within 30 days), or <em>Overdue</em>.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#DDE5DF] flex items-center justify-between text-[#5D6961]">
            <span>Need additional assistance? Email info@exousiadynamoenergy.com</span>
            <Link to="/app" className="text-[#007A44] font-semibold hover:underline">
              Enter Workspace →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
