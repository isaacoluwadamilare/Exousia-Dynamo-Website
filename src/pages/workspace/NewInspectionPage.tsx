import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { hseDataService, HSEAppState } from '../../services/hseDataService';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Calendar,
  Building,
  User,
  Sparkles,
  Info,
  ShieldCheck
} from 'lucide-react';

interface NewInspectionPageProps {
  appState: HSEAppState;
}

export const NewInspectionPage: React.FC<NewInspectionPageProps> = ({ appState }) => {
  const navigate = useNavigate();

  const [templateId, setTemplateId] = useState(appState.templates[0]?.id || '');
  const [siteId, setSiteId] = useState(appState.sites[3]?.id || appState.sites[0]?.id || '');
  const [inspectorId, setInspectorId] = useState(appState.users[1]?.id || '');
  const [scheduledDate, setScheduledDate] = useState('2026-10-06');
  const [customTitle, setCustomTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedTemplate = appState.templates.find(t => t.id === templateId) || appState.templates[0];
  const selectedSite = appState.sites.find(s => s.id === siteId) || appState.sites[0];

  const applyPreset = (presetKey: 'workshop' | 'offshore') => {
    if (presetKey === 'workshop') {
      const tmpl = appState.templates.find(t => t.id.includes('workshop')) || appState.templates[0];
      const site = appState.sites.find(s => s.id.includes('site-4') || s.name.includes('Workshop')) || appState.sites[0];
      const inspector = appState.users.find(u => u.role === 'hse_officer') || appState.users[1];
      setTemplateId(tmpl.id);
      setSiteId(site.id);
      setInspectorId(inspector.id);
      setScheduledDate('2026-10-06');
      setCustomTitle('Maintenance Workshop & Rigging Equipment Audit - Week 41');
    } else {
      const tmpl = appState.templates.find(t => t.id.includes('offshore')) || appState.templates[0];
      const site = appState.sites.find(s => s.id.includes('site-3') || s.name.includes('Offshore')) || appState.sites[0];
      const inspector = appState.users.find(u => u.role === 'hse_officer') || appState.users[1];
      setTemplateId(tmpl.id);
      setSiteId(site.id);
      setInspectorId(inspector.id);
      setScheduledDate('2026-10-08');
      setCustomTitle('Platform Alpha Hydrocarbon & Life Safety Deck Survey');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const created = hseDataService.scheduleInspection({
        templateId,
        siteId,
        inspectorId,
        scheduledDate,
        title: customTitle.trim() ? customTitle.trim() : `${selectedTemplate.title} - ${selectedSite.name}`
      });

      navigate(`/app/inspections/${created.id}`);
    } catch (err) {
      alert('Failed to schedule inspection');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg border border-[#DDE5DF] bg-white text-[#5D6961] hover:text-[#15251C] transition-colors focus-visible:ring-2 focus-visible:ring-[#007A44]"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-[#15251C]">Schedule HSE Inspection</h1>
            <p className="text-xs text-[#5D6961] mt-0.5">
              Assign standardized checklist templates with version-locked governance and action linking.
            </p>
          </div>
        </div>

        <Link
          to="/app/inspections"
          className="text-xs font-semibold text-[#007A44] hover:underline"
        >
          View Register
        </Link>
      </div>

      {/* Demo Walkthrough Presets */}
      <div className="bg-[#F4F8F5] border border-[#BDE3CE] rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#007A44] uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Demonstration Quick Presets</span>
        </div>
        <p className="text-xs text-[#37473F]">
          Pre-populate verified operational data to demonstrate the scheduling and checklist execution lifecycle:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => applyPreset('workshop')}
            className={`p-3 rounded-lg border text-left transition-all text-xs ${
              customTitle.includes('Workshop')
                ? 'bg-white border-[#007A44] text-[#007A44] font-bold shadow-2xs'
                : 'bg-white/80 border-[#DDE5DF] text-[#15251C] hover:bg-white'
            }`}
          >
            <div className="font-semibold flex items-center gap-1.5 text-[#007A44]">
              <span className="w-2 h-2 rounded-full bg-[#007A44]" />
              <span>Workshop Safety Checklist (v2.1)</span>
            </div>
            <div className="text-[11px] text-[#5D6961] mt-0.5">
              Maintenance Fabrication Workshop · 5 Checklist Items
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('offshore')}
            className={`p-3 rounded-lg border text-left transition-all text-xs ${
              customTitle.includes('Platform')
                ? 'bg-white border-[#007A44] text-[#007A44] font-bold shadow-2xs'
                : 'bg-white/80 border-[#DDE5DF] text-[#15251C] hover:bg-white'
            }`}
          >
            <div className="font-semibold flex items-center gap-1.5 text-[#007A44]">
              <span className="w-2 h-2 rounded-full bg-[#007A44]" />
              <span>Offshore Wellhead & Deck (v1.4)</span>
            </div>
            <div className="text-[11px] text-[#5D6961] mt-0.5">
              Offshore Platform Alpha · 3 Critical Safety Items
            </div>
          </button>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#DDE5DF] p-6 sm:p-8 space-y-6 shadow-xs text-xs">
        {/* Template Selector */}
        <div>
          <label className="block font-bold uppercase tracking-wider text-[#15251C] mb-1.5">
            1. Standardized Checklist Template <span className="text-[#B42318]">*</span>
          </label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#DDE5DF] rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#007A44]"
          >
            {appState.templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} — Version {t.version} ({t.category} · {t.items.length} items)
              </option>
            ))}
          </select>
          <div className="mt-2 p-3 rounded-lg bg-[#F7F9F7] border border-[#DDE5DF] text-[#5D6961] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#007A44] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#15251C]">Governance Rule:</span> The checklist template version (<strong>v{selectedTemplate.version}</strong>) will be locked to this inspection record. Any subsequent template updates will not alter historical completed inspections.
            </div>
          </div>
        </div>

        {/* Custom Title */}
        <div>
          <label className="block font-semibold text-[#15251C] mb-1">
            2. Inspection Title / Target Designation
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder={`Default: ${selectedTemplate.title} - ${selectedSite.name}`}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#DDE5DF] rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#007A44]"
          />
        </div>

        {/* Operational Site & Scheduled Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-[#15251C] mb-1">
              3. Operational Facility / Site <span className="text-[#B42318]">*</span>
            </label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#DDE5DF] rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#007A44]"
            >
              {appState.sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#15251C] mb-1">
              4. Scheduled Date <span className="text-[#B42318]">*</span>
            </label>
            <input
              type="date"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#DDE5DF] rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#007A44]"
            />
          </div>
        </div>

        {/* Assigned Lead Inspector */}
        <div>
          <label className="block font-semibold text-[#15251C] mb-1">
            5. Assigned Lead Inspector <span className="text-[#B42318]">*</span>
          </label>
          <select
            value={inspectorId}
            onChange={(e) => setInspectorId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#DDE5DF] rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#007A44]"
          >
            {appState.users
              .filter((u) => ['hse_officer', 'hse_manager', 'admin'].includes(u.role))
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.roleTitle} ({u.department})
                </option>
              ))}
          </select>
          <p className="text-[11px] text-[#5D6961] mt-1">
            Only authorized HSE Officers, Inspectors, and HSE Managers are permitted to sign off operational safety inspections.
          </p>
        </div>

        {/* Submit Bar */}
        <div className="pt-4 border-t border-[#DDE5DF] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-[#5D6961] hover:text-[#15251C] border border-[#DDE5DF] hover:bg-[#F7F9F7] rounded-lg transition-colors"
          >
            Cancel & Return
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-7 py-3 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>{submitting ? 'Scheduling Inspection...' : 'Confirm & Schedule Inspection'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
