import React, { useState, useEffect } from 'react';
import { HSEAppState, hseDataService } from '../services/hseDataService';
import { InspectionTemplate } from '../types/hse';
import { X, ClipboardCheck, Plus, Trash2, AlertCircle, CheckCircle2, GripVertical } from 'lucide-react';

interface InspectionTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: HSEAppState;
  templateToEdit?: InspectionTemplate | null;
  onSaved?: (template: InspectionTemplate) => void;
}

interface ChecklistItemDraft {
  id: string;
  section: string;
  question: string;
  guidance: string;
}

export const InspectionTemplateModal: React.FC<InspectionTemplateModalProps> = ({
  isOpen,
  onClose,
  appState,
  templateToEdit,
  onSaved
}) => {
  const isEditing = !!templateToEdit;
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('1.0');
  const [category, setCategory] = useState(appState.matrixConfig.findingCategories[0] || 'Facility & Equipment');
  const [items, setItems] = useState<ChecklistItemDraft[]>([
    { id: 'draft-1', section: 'General Safety', question: 'Are emergency exits and walkways clear?', guidance: '' }
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (templateToEdit) {
      setTitle(templateToEdit.title);
      setVersion(templateToEdit.version);
      setCategory(templateToEdit.category);
      setItems(
        templateToEdit.items.map(it => ({
          id: it.id,
          section: it.section,
          question: it.question,
          guidance: it.guidance || ''
        }))
      );
      setErrors({});
    } else {
      setTitle('');
      setVersion('1.0');
      setCategory(appState.matrixConfig.findingCategories[0] || 'Facility & Equipment');
      setItems([
        { id: `draft-${Date.now()}-1`, section: 'Housekeeping & Work Environment', question: '', guidance: '' },
        { id: `draft-${Date.now()}-2`, section: 'PPE & Emergency Equipment', question: '', guidance: '' }
      ]);
      setErrors({});
    }
  }, [templateToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddItem = (sectionName?: string) => {
    const newItem: ChecklistItemDraft = {
      id: `draft-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      section: sectionName || (items.length > 0 ? items[items.length - 1].section : 'General Safety'),
      question: '',
      guidance: ''
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setErrors({ items: 'At least one checklist inspection item is required.' });
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof ChecklistItemDraft, value: string) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const trimmedTitle = title.trim();
    const trimmedVersion = version.trim();

    if (!trimmedTitle) {
      newErrors.title = 'Inspection template title is required.';
    } else if (trimmedTitle.length < 5) {
      newErrors.title = 'Title must be at least 5 characters.';
    }

    if (!trimmedVersion) {
      newErrors.version = 'Template version is required (e.g. 1.0 or 2.1).';
    }

    if (items.length === 0) {
      newErrors.items = 'At least one checklist item is required.';
    }

    // Check item questions and sections
    for (let i = 0; i < items.length; i++) {
      if (!items[i].section.trim()) {
        newErrors.items = `Section title is required for question #${i + 1}.`;
        break;
      }
      if (!items[i].question.trim()) {
        newErrors.items = `Question text is required for question #${i + 1}.`;
        break;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formattedItems = items.map((it, idx) => ({
      id: it.id.startsWith('draft-') ? `item-${Date.now()}-${idx + 1}` : it.id,
      section: it.section.trim(),
      question: it.question.trim(),
      guidance: it.guidance.trim() || undefined
    }));

    if (isEditing && templateToEdit) {
      const res = hseDataService.updateInspectionTemplate(templateToEdit.id, {
        title: trimmedTitle,
        version: trimmedVersion,
        category,
        items: formattedItems
      });
      if (!res.success) {
        setErrors({ general: res.error || 'Failed to update template.' });
        return;
      }
      if (onSaved) {
        onSaved({
          ...templateToEdit,
          title: trimmedTitle,
          version: trimmedVersion,
          category,
          items: formattedItems
        });
      }
    } else {
      const created = hseDataService.createInspectionTemplate({
        title: trimmedTitle,
        version: trimmedVersion,
        category,
        items: formattedItems
      });
      if (onSaved) onSaved(created);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-xl shadow-2xl border border-[#DDE5DF] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5DF] bg-[#F7F9F7]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#007A44]/10 text-[#007A44] rounded-lg">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#15251C]">
                {isEditing ? 'Edit Inspection Checklist Template' : 'Create Inspection Checklist Template'}
              </h2>
              <p className="text-xs text-[#5D6961]">
                Author standardized checklist protocols, section headers, and field guidance.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {errors.general && (
            <div className="p-3 bg-[#FFF0ED] border border-[#FECDCA] rounded-lg text-xs text-[#B42318] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Template Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="font-semibold text-[#15251C] block mb-1">
                Template Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Monthly High-Pressure Hydrostatic Bunker Inspection"
                className={`w-full p-2.5 rounded-lg border bg-white ${
                  errors.title ? 'border-[#B42318]' : 'border-[#DDE5DF]'
                } focus:border-[#007A44] focus:outline-hidden`}
              />
              {errors.title && <p className="text-[#B42318] text-[11px] mt-1">{errors.title}</p>}
            </div>

            <div className="sm:col-span-3">
              <label className="font-semibold text-[#15251C] block mb-1">
                Version *
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 1.0"
                className={`w-full p-2.5 rounded-lg border bg-white font-mono ${
                  errors.version ? 'border-[#B42318]' : 'border-[#DDE5DF]'
                } focus:border-[#007A44] focus:outline-hidden`}
              />
              {errors.version && <p className="text-[#B42318] text-[11px] mt-1">{errors.version}</p>}
            </div>

            <div className="sm:col-span-3">
              <label className="font-semibold text-[#15251C] block mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#DDE5DF] bg-white text-[#15251C]"
              >
                {appState.matrixConfig.findingCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Checklist Items Builder */}
          <div className="space-y-3 pt-2 border-t border-[#DDE5DF]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#15251C] text-sm flex items-center gap-2">
                  <span>Checklist Questions ({items.length})</span>
                </h3>
                <p className="text-[#5D6961] text-[11px]">
                  Group questions by operational sections. Field inspectors will evaluate each item as Pass, Fail, or N/A.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAddItem()}
                className="px-3 py-1.5 bg-[#EEF7F2] hover:bg-[#BDE3CE] text-[#007A44] font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            {errors.items && (
              <p className="text-[#B42318] text-xs font-semibold p-2 bg-[#FFF0ED] rounded-lg border border-[#FECDCA]">
                {errors.items}
              </p>
            )}

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-[#F7F9F7] rounded-xl border border-[#DDE5DF] space-y-2.5 relative group hover:border-[#BDE3CE] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-5 h-5 rounded-full bg-white border border-[#DDE5DF] font-bold text-[#007A44] text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={item.section}
                        onChange={(e) => handleUpdateItem(idx, 'section', e.target.value)}
                        placeholder="Section Heading (e.g. Electrical Safety)"
                        className="px-2.5 py-1 text-xs font-bold text-[#15251C] bg-white border border-[#DDE5DF] rounded-md focus:border-[#007A44] focus:outline-hidden w-full max-w-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length <= 1}
                      className={`p-1.5 text-[#5D6961] hover:text-[#B42318] hover:bg-white rounded transition-colors ${
                        items.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                      title="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Question Prompt */}
                  <div>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => handleUpdateItem(idx, 'question', e.target.value)}
                      placeholder="Enter verification question / test criteria (e.g. Are pressure relief valves calibrated and tagged within valid inspection date?)"
                      className="w-full p-2 text-xs bg-white border border-[#DDE5DF] rounded-lg focus:border-[#007A44] focus:outline-hidden font-medium"
                    />
                  </div>

                  {/* Field Guidance Note */}
                  <div>
                    <input
                      type="text"
                      value={item.guidance}
                      onChange={(e) => handleUpdateItem(idx, 'guidance', e.target.value)}
                      placeholder="Optional inspector guidance / reference tag requirements (e.g. Check stainless steel tag for ASME stamp)"
                      className="w-full p-1.5 text-[11px] bg-white/70 border border-[#DDE5DF] rounded text-[#5D6961] focus:border-[#007A44] focus:outline-hidden"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => handleAddItem()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#007A44] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add another question to this template</span>
              </button>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#DDE5DF]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#DDE5DF] rounded-lg text-[#5D6961] hover:text-[#15251C] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#007A44] hover:bg-[#005D35] text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Save Template Updates' : 'Publish Checklist Template'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
