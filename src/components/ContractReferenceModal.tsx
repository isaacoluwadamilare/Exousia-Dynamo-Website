import React, { useState } from 'react';
import {
  CONTRACT_CLIENT_DISPLAY,
  DELIVERY_CONTRACTOR,
  CONTRACT_DURATION,
  CONTRACT_DATE,
  CONTRACT_SCOPE_ITEMS
} from '../constants/contractScope';
import { FileText, CheckCircle2, AlertTriangle, ShieldCheck, ExternalLink, X, Info } from 'lucide-react';

interface ContractReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContractReferenceModal: React.FC<ContractReferenceModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'confirmed' | 'proposed'>('all');

  if (!isOpen) return null;

  const confirmedItems = CONTRACT_SCOPE_ITEMS.filter(i => i.category === 'confirmed_contract');
  const proposedItems = CONTRACT_SCOPE_ITEMS.filter(i => i.category === 'proposed_decision');

  const displayedItems =
    activeTab === 'all'
      ? CONTRACT_SCOPE_ITEMS
      : activeTab === 'confirmed'
      ? confirmedItems
      : proposedItems;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-[#DDE5DF] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5DF] bg-[#F7F9F7]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#007A44]/10 text-[#007A44] rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#15251C]">
                Contract Scope & Implementation Governance
              </h2>
              <p className="text-xs text-[#5D6961]">
                Authoritative breakdown: Confirmed Award Letter Requirements vs. Proposed Operational Decisions
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

        {/* Metadata Strip */}
        <div className="px-6 py-3 bg-[#EEF7F2] border-b border-[#BDE3CE] grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[#5D6961] block font-medium">Operating Client:</span>
            <span className="font-semibold text-[#15251C]">{CONTRACT_CLIENT_DISPLAY}</span>
          </div>
          <div>
            <span className="text-[#5D6961] block font-medium">Delivery Contractor:</span>
            <span className="font-semibold text-[#15251C]">{DELIVERY_CONTRACTOR}</span>
          </div>
          <div>
            <span className="text-[#5D6961] block font-medium">Contract Duration:</span>
            <span className="font-semibold text-[#007A44]">{CONTRACT_DURATION}</span>
          </div>
          <div>
            <span className="text-[#5D6961] block font-medium">Award Letter Date:</span>
            <span className="font-semibold text-[#15251C]">{CONTRACT_DATE}</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pt-4 flex gap-2 border-b border-[#DDE5DF]">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-[#007A44] text-[#007A44] font-semibold'
                : 'border-transparent text-[#5D6961] hover:text-[#15251C]'
            }`}
          >
            All Scope Items ({CONTRACT_SCOPE_ITEMS.length})
          </button>
          <button
            onClick={() => setActiveTab('confirmed')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'confirmed'
                ? 'border-[#007A44] text-[#007A44] font-semibold'
                : 'border-transparent text-[#5D6961] hover:text-[#15251C]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#007A44]" />
            Confirmed Contract Requirements ({confirmedItems.length})
          </button>
          <button
            onClick={() => setActiveTab('proposed')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'proposed'
                ? 'border-[#B42318] text-[#B42318] font-semibold'
                : 'border-transparent text-[#5D6961] hover:text-[#15251C]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#B42318]" />
            Proposed Workflow Decisions ({proposedItems.length})
          </button>
        </div>

        {/* Scrollable Scope List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {displayedItems.map((item) => {
            const isConfirmed = item.category === 'confirmed_contract';
            return (
              <div
                key={item.id}
                className={`p-4 rounded-lg border transition-all ${
                  isConfirmed
                    ? 'border-[#DDE5DF] bg-white hover:border-[#BDE3CE]'
                    : 'border-[#FEDF89] bg-[#FFFAEB]/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2.5">
                    {isConfirmed ? (
                      <span className="p-1 rounded bg-[#EEF7F2] text-[#007A44] mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-1 rounded bg-[#FFFAEB] text-[#B54708] mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-[#15251C]">{item.title}</h4>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                            isConfirmed
                              ? 'bg-[#EEF7F2] text-[#007A44] border border-[#BDE3CE]'
                              : 'bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]'
                          }`}
                        >
                          {isConfirmed ? 'Contractually Stipulated' : 'Proposed Decision (Subject to Client)'}
                        </span>
                        <span className="text-[11px] text-[#5D6961] bg-[#F7F9F7] px-2 py-0.5 rounded border border-[#DDE5DF]">
                          {item.source}
                        </span>
                      </div>
                      <p className="text-xs text-[#15251C] mt-1.5 leading-relaxed">{item.description}</p>
                      <div className="mt-2 text-xs flex items-center gap-1.5 text-[#5D6961]">
                        <Info className="w-3.5 h-3.5 shrink-0 text-[#007A44]" />
                        <span><strong>Implementation status:</strong> {item.notes}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-1 rounded shrink-0 ${
                      item.statusInApp === 'Implemented'
                        ? 'bg-[#EEF7F2] text-[#007A44]'
                        : item.statusInApp === 'Configurable'
                        ? 'bg-[#F0F9FF] text-[#026AA2]'
                        : 'bg-[#FFFAEB] text-[#B54708]'
                    }`}
                  >
                    {item.statusInApp}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-[#F7F9F7] border-t border-[#DDE5DF] flex items-center justify-between text-xs text-[#5D6961]">
          <span>
            Contract Award Reference: [Insert Reference Number] | Delivery Milestone Track: Month 1-5
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#007A44] hover:bg-[#005D35] text-white font-medium rounded-md transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
