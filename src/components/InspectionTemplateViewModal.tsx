import React from 'react';
import { InspectionTemplate } from '../types/hse';
import { X, ClipboardCheck, Tag, Info, CheckCircle2 } from 'lucide-react';

interface InspectionTemplateViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: InspectionTemplate | null;
  onEdit?: (template: InspectionTemplate) => void;
}

export const InspectionTemplateViewModal: React.FC<InspectionTemplateViewModalProps> = ({
  isOpen,
  onClose,
  template,
  onEdit
}) => {
  if (!isOpen || !template) return null;

  // Group items by section
  const sections = template.items.reduce<Record<string, typeof template.items>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-[#DDE5DF] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5DF] bg-[#F7F9F7]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#007A44]/10 text-[#007A44] rounded-lg">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#15251C]">
                  {template.title}
                </h2>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-[#DDE5DF] text-[#007A44]">
                  v{template.version}
                </span>
              </div>
              <p className="text-xs text-[#5D6961] mt-0.5">
                Category: <strong>{template.category}</strong> · {template.items.length} Checklist Questions
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {Object.entries(sections).map(([sectionTitle, items], sIdx) => (
            <div key={sectionTitle} className="space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-[#DDE5DF]">
                <span className="text-[11px] font-bold text-[#007A44] uppercase tracking-wider">
                  Section {sIdx + 1}:
                </span>
                <span className="font-semibold text-sm text-[#15251C]">{sectionTitle}</span>
                <span className="text-[#5D6961] text-[11px] ml-auto">({items.length} items)</span>
              </div>

              <div className="space-y-2.5">
                {items.map((item, qIdx) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF] space-y-1"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white border border-[#DDE5DF] font-bold text-[#007A44] text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {qIdx + 1}
                      </span>
                      <div className="flex-1">
                        <span className="font-medium text-[#15251C] block leading-relaxed">
                          {item.question}
                        </span>
                        {item.guidance && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#5D6961] mt-1 bg-white p-1.5 rounded border border-[#E8ECE9]">
                            <Info className="w-3.5 h-3.5 text-[#007A44] shrink-0" />
                            <span>{item.guidance}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#DDE5DF] bg-[#F7F9F7] flex items-center justify-between text-xs">
          <span className="text-[#5D6961]">
            Used by inspectors across scheduled workshop and offshore facility audits.
          </span>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(template);
                }}
                className="px-3.5 py-1.5 bg-[#007A44] hover:bg-[#005D35] text-white font-semibold rounded-lg transition-colors"
              >
                Edit Template
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-[#DDE5DF] bg-white rounded-lg text-[#5D6961] hover:text-[#15251C]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
