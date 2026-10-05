import React, { useState, useEffect } from 'react';
import { HSEAppState, hseDataService } from '../services/hseDataService';
import { Site } from '../types/hse';
import { X, Building, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: HSEAppState;
  siteToEdit?: Site | null;
  onSaved?: (site: Site) => void;
}

export const SiteModal: React.FC<SiteModalProps> = ({
  isOpen,
  onClose,
  appState,
  siteToEdit,
  onSaved
}) => {
  const isEditing = !!siteToEdit;
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (siteToEdit) {
      setName(siteToEdit.name);
      setCode(siteToEdit.code);
      setLocation(siteToEdit.location);
      setActive(siteToEdit.active);
      setErrors({});
    } else {
      setName('');
      setCode('');
      setLocation('');
      setActive(true);
      setErrors({});
    }
  }, [siteToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedLocation = location.trim();

    if (!trimmedName) {
      newErrors.name = 'Operational facility name is required.';
    } else if (trimmedName.length < 3) {
      newErrors.name = 'Facility name must be at least 3 characters.';
    }

    if (!trimmedCode) {
      newErrors.code = 'Facility code is required (e.g. PHC-WKSH).';
    } else if (trimmedCode.length < 2 || trimmedCode.length > 12) {
      newErrors.code = 'Code must be between 2 and 12 characters.';
    } else {
      // Uniqueness check
      const duplicate = appState.sites.find(
        s => s.code.toUpperCase() === trimmedCode && (!isEditing || s.id !== siteToEdit.id)
      );
      if (duplicate) {
        newErrors.code = `Code "${trimmedCode}" is already in use by ${duplicate.name}.`;
      }
    }

    if (!trimmedLocation) {
      newErrors.location = 'Physical location / geographical state is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isEditing && siteToEdit) {
      const res = hseDataService.updateSite(siteToEdit.id, {
        name: trimmedName,
        code: trimmedCode,
        location: trimmedLocation,
        active
      });
      if (!res.success) {
        setErrors({ general: res.error || 'Failed to update site.' });
        return;
      }
      if (onSaved) {
        onSaved({ ...siteToEdit, name: trimmedName, code: trimmedCode, location: trimmedLocation, active });
      }
    } else {
      const created = hseDataService.createSite({
        name: trimmedName,
        code: trimmedCode,
        location: trimmedLocation
      });
      if (onSaved) onSaved(created);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#DDE5DF] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5DF] bg-[#F7F9F7]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#007A44]/10 text-[#007A44] rounded-lg">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#15251C]">
                {isEditing ? 'Edit Operational Facility Site' : 'Register New Operational Facility Site'}
              </h2>
              <p className="text-xs text-[#5D6961]">
                {isEditing ? `Updating facility record ${siteToEdit?.code}` : 'Define physical site parameters for incident mapping and user assignment.'}
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errors.general && (
            <div className="p-3 bg-[#FFF0ED] border border-[#FECDCA] rounded-lg text-xs text-[#B42318] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Facility Name */}
          <div>
            <label className="font-semibold text-[#15251C] block mb-1">
              Facility / Site Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Warri Logistics & Marine Terminal"
              className={`w-full p-2.5 rounded-lg border bg-white ${
                errors.name ? 'border-[#B42318]' : 'border-[#DDE5DF]'
              } focus:border-[#007A44] focus:outline-hidden`}
            />
            {errors.name && <p className="text-[#B42318] text-[11px] mt-1">{errors.name}</p>}
          </div>

          {/* Site Code */}
          <div>
            <label className="font-semibold text-[#15251C] block mb-1">
              Facility Identifier Code *
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. WRI-LOG"
                maxLength={12}
                className={`w-full p-2.5 rounded-lg border bg-white font-mono uppercase ${
                  errors.code ? 'border-[#B42318]' : 'border-[#DDE5DF]'
                } focus:border-[#007A44] focus:outline-hidden`}
              />
            </div>
            <p className="text-[10px] text-[#5D6961] mt-0.5">
              Short alphanumeric code used on field labels, inspection tags, and reports.
            </p>
            {errors.code && <p className="text-[#B42318] text-[11px] mt-1">{errors.code}</p>}
          </div>

          {/* Physical Location */}
          <div>
            <label className="font-semibold text-[#15251C] block mb-1">
              Physical Location & Administrative Zone *
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Warri River Basin, Delta State, Nigeria"
                className={`w-full p-2.5 rounded-lg border bg-white ${
                  errors.location ? 'border-[#B42318]' : 'border-[#DDE5DF]'
                } focus:border-[#007A44] focus:outline-hidden`}
              />
            </div>
            {errors.location && <p className="text-[#B42318] text-[11px] mt-1">{errors.location}</p>}
          </div>

          {/* Active Status */}
          {isEditing && (
            <div className="pt-2">
              <label className="flex items-center gap-2 text-[#15251C] cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-[#DDE5DF] text-[#007A44] focus:ring-[#007A44]"
                />
                <span className="font-semibold">Facility is currently active in HSE operations</span>
              </label>
              <p className="text-[10px] text-[#5D6961] mt-0.5 ml-5">
                Deactivated facilities are hidden from standard reporting dropdowns but retain historical records.
              </p>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#DDE5DF]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#DDE5DF] rounded-lg text-[#5D6961] hover:text-[#15251C] hover:bg-black/5 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#007A44] hover:bg-[#005D35] text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Save Facility Changes' : 'Register Facility Site'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
