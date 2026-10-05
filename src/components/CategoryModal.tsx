import React, { useState, useEffect } from 'react';
import { HSEAppState, hseDataService } from '../services/hseDataService';
import { X, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: HSEAppState;
  categoryToEdit?: string | null;
  onSaved?: (categoryName: string) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  appState,
  categoryToEdit,
  onSaved
}) => {
  const isEditing = !!categoryToEdit;
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit);
      setError(null);
    } else {
      setName('');
      setError(null);
    }
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Category name cannot be blank.');
      return;
    }
    if (trimmed.length < 3) {
      setError('Category name must be at least 3 characters.');
      return;
    }

    if (isEditing && categoryToEdit) {
      const res = hseDataService.updateFindingCategory(categoryToEdit, trimmed);
      if (!res.success) {
        setError(res.error || 'Failed to update category.');
        return;
      }
      if (onSaved) onSaved(trimmed);
    } else {
      const res = hseDataService.addFindingCategory(trimmed);
      if (!res.success) {
        setError(res.error || 'Failed to add category.');
        return;
      }
      if (onSaved) onSaved(trimmed);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#DDE5DF] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5DF] bg-[#F7F9F7]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#007A44]/10 text-[#007A44] rounded-lg">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#15251C]">
                {isEditing ? 'Rename Finding Category' : 'Add Standard Finding Category'}
              </h2>
              <p className="text-xs text-[#5D6961]">
                Standardized classification taxonomy for hazards, findings, and CAPA.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-[#FFF0ED] border border-[#FECDCA] rounded-lg text-xs text-[#B42318] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="font-semibold text-[#15251C] block mb-1">
              Category Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chemical Handling & Secondary Containment"
              className="w-full p-2.5 rounded-lg border border-[#DDE5DF] bg-white focus:border-[#007A44] focus:outline-hidden"
              autoFocus
            />
            <p className="text-[10px] text-[#5D6961] mt-1">
              {isEditing
                ? 'Renaming will update this category on all historical reports, actions, and inspection records.'
                : 'This category will immediately become available in hazard reporting, inspection reviews, and action tracking.'}
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#DDE5DF]">
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
              <span>{isEditing ? 'Save Changes' : 'Add Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
