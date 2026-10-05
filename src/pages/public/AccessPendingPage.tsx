import React from 'react';
import { Link } from 'react-router-dom';
import { ExousiaLogo } from '../../components/ExousiaLogo';
import { Lock, Clock, Mail, ShieldAlert, ArrowLeft } from 'lucide-react';
import { CONTRACT_CLIENT_DISPLAY, DELIVERY_CONTRACTOR } from '../../constants/contractScope';

export const AccessPendingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F9F7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block mb-4">
          <ExousiaLogo variant="full" theme="light" height={44} />
        </Link>
        <div className="w-12 h-12 rounded-full bg-[#FFFAEB] border border-[#FEDF89] text-[#B54708] flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#15251C]">
          Account Access Pending Approval
        </h2>
        <p className="mt-2 text-xs text-[#5D6961] max-w-sm mx-auto">
          Your authenticated identity is verified, but organizational membership and site authorization have not yet been granted.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-6 px-6 sm:px-8 rounded-xl shadow-xs border border-[#DDE5DF] space-y-4 text-xs">
          <div className="p-3 bg-[#EEF7F2] rounded-lg border border-[#BDE3CE] text-[#007A44]">
            <strong>Security Governance Protocol:</strong> Per Section 6 of the platform specification, signing in with an enterprise identity does not automatically confer organizational access. Roles must be granted explicitly by an authorized administrator.
          </div>

          <div className="space-y-2 text-[#5D6961]">
            <p>
              To request provisioning for your operational facility, contact the HSE Administrator:
            </p>
            <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF] text-[#15251C]">
              <div className="font-semibold">Josephine Yese (Managing Director & HSE Lead)</div>
              <div className="text-[11px] text-[#5D6961]">Exousia Dynamo Energy Ltd</div>
              <a
                href="mailto:info@exousiadynamoenergy.com"
                className="text-[#007A44] hover:underline font-medium block mt-1"
              >
                info@exousiadynamoenergy.com
              </a>
            </div>
          </div>

          <div className="pt-3 border-t border-[#DDE5DF] flex items-center justify-between">
            <Link
              to="/login"
              className="text-[#007A44] font-semibold hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
            <Link to="/" className="text-[#5D6961] hover:underline">
              Public Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
