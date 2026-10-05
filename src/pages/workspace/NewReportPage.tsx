import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { hseDataService, HSEAppState } from '../../services/hseDataService';
import {
  AlertTriangle,
  Upload,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  FileText,
  Camera,
  Paperclip,
  Trash2,
  Info,
  Clock,
  MapPin,
  Building,
  ShieldAlert
} from 'lucide-react';
import { ReportType } from '../../types/hse';

interface NewReportPageProps {
  appState: HSEAppState;
}

interface SimulatedEvidenceItem {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  label: string;
}

export const NewReportPage: React.FC<NewReportPageProps> = ({ appState }) => {
  const navigate = useNavigate();

  const [type, setType] = useState<ReportType>('incident');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [siteId, setSiteId] = useState(appState.sites[0]?.id || '');
  const [specificLocation, setSpecificLocation] = useState('');
  const [occurredAt, setOccurredAt] = useState('2026-10-04T10:30');
  const [immediateActionTaken, setImmediateActionTaken] = useState('');
  const [severityEstimate, setSeverityEstimate] = useState<number>(2);
  const [evidenceList, setEvidenceList] = useState<SimulatedEvidenceItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Quick Demo Presets
  const applyPreset = (presetType: ReportType) => {
    setType(presetType);
    setValidationErrors({});

    if (presetType === 'incident') {
      setTitle('Hydrostatic test pump manifold seal rupture during pressure test');
      setDescription('During scheduled hydrostatic pressure qualification test at 240 bar on high-pressure manifold spool MP-04, the primary elastomeric seal ruptured. Hydraulic fluid discharged onto the testing bay bund floor (approx 15 litres). All safety interlocks functioned as designed; emergency kill-switch was activated within 4 seconds. No personnel injuries or hydrocarbon releases.');
      setSiteId(appState.sites[0]?.id || 'site-1');
      setSpecificLocation('Bay 4 Hydrostatic Test Cell & High-Pressure Bunker');
      setOccurredAt('2026-10-04T09:15');
      setImmediateActionTaken('Test cycle stopped via emergency kill switch. High-pressure pump de-energized. Sorbent booms deployed around bund perimeter. Isolation tags hung.');
      setSeverityEstimate(3);
      setEvidenceList([
        {
          id: 'ev-1',
          name: 'hydrostatic_test_ruptured_seal_04Oct.jpg',
          sizeBytes: 1024 * 720,
          mimeType: 'image/jpeg',
          label: 'Photographic evidence: Ruptured elastomeric seal face'
        },
        {
          id: 'ev-2',
          name: 'pressure_chart_log_test_run_4B.pdf',
          sizeBytes: 1024 * 410,
          mimeType: 'application/pdf',
          label: 'Telemetry log: Pressure surge chart record'
        }
      ]);
    } else if (presetType === 'near_miss') {
      setTitle('Dropped tubular lifting clamp during deck transit at crane berth');
      setDescription('While slewing a casing string over the main pipe deck, a 6.2kg auxiliary latch clamp detached from the lifting yoke at an elevation of 5.5 metres. The clamp struck the timber-padded deck grating 2.5 metres away from a deck crew member. No contact or injury occurred. Near miss retained distinctly per contract scope clause 1.2.');
      setSiteId(appState.sites[2]?.id || 'site-3');
      setSpecificLocation('Main Pipe Deck Quayside Crane Radius, Grid C-4');
      setOccurredAt('2026-10-04T11:00');
      setImmediateActionTaken('Crane operation suspended immediately. Red exclusion zone barrier tape erected. Crew assembled for immediate safety stand-down.');
      setSeverityEstimate(4);
      setEvidenceList([
        {
          id: 'ev-3',
          name: 'dropped_clamp_impact_point_deck.jpg',
          sizeBytes: 1024 * 610,
          mimeType: 'image/jpeg',
          label: 'Photographic evidence: Deck grating impact point'
        }
      ]);
    } else {
      setTitle('Severely corroded emergency eyewash station isolation valve');
      setDescription('Routine pre-shift walkaround revealed that the supply valve stem for Emergency Eyewash Station EW-09 in the chemical storage compound has experienced galvanic corrosion and will not actuate to the full open position. Immediate flushing water pressure is insufficient for regulatory eye decontamination.');
      setSiteId(appState.sites[1]?.id || 'site-2');
      setSpecificLocation('Chemical Storage Compound East Corridor near Dosing Skids');
      setOccurredAt('2026-10-04T08:00');
      setImmediateActionTaken('Temporary portable gravity-fed eyewash unit staged immediately adjacent. Tagged main station out of service. Work orders flagged to plumbing team.');
      setSeverityEstimate(2);
      setEvidenceList([
        {
          id: 'ev-4',
          name: 'corroded_eyewash_stem_macro.jpg',
          sizeBytes: 1024 * 540,
          mimeType: 'image/jpeg',
          label: 'Photographic evidence: Corroded valve stem'
        }
      ]);
    }
  };

  const addSimulatedEvidence = (name: string, label: string) => {
    const newItem: SimulatedEvidenceItem = {
      id: `ev-${Date.now()}`,
      name,
      sizeBytes: Math.floor(1024 * (300 + Math.random() * 800)),
      mimeType: name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
      label
    };
    setEvidenceList(prev => [...prev, newItem]);
  };

  const removeEvidence = (id: string) => {
    setEvidenceList(prev => prev.filter(e => e.id !== id));
  };

  const handleCustomFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      addSimulatedEvidence(file.name, `Local file: ${file.name}`);
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Title / brief summary is mandatory.';
    } else if (title.trim().length < 6) {
      errors.title = 'Title must be at least 6 characters.';
    }

    if (!occurredAt) {
      errors.occurredAt = 'Occurrence date and time are required.';
    }

    if (!siteId) {
      errors.siteId = 'Please select the operational site.';
    }

    if (!specificLocation.trim()) {
      errors.specificLocation = 'Specific location inside the facility is mandatory.';
    }

    if (!description.trim()) {
      errors.description = 'Detailed description is mandatory.';
    } else if (description.trim().length < 20) {
      errors.description = 'Please provide sufficient detail (at least 20 characters).';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const created = hseDataService.createReport({
        type,
        title: title.trim(),
        description: description.trim(),
        siteId,
        specificLocation: specificLocation.trim(),
        occurredAt: new Date(occurredAt).toISOString(),
        immediateActionTaken: immediateActionTaken.trim() || undefined,
        severityEstimate,
        attachments: evidenceList.map(ev => ({
          name: ev.name,
          sizeBytes: ev.sizeBytes,
          mimeType: ev.mimeType
        }))
      });

      if (type === 'hazard') {
        navigate(`/app/hazards/${created.id}`);
      } else {
        navigate(`/app/incidents/${created.id}`);
      }
    } catch (err: any) {
      setValidationErrors({ form: err?.message || 'Failed to submit report. Please retry.' });
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
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
            <h1 className="text-2xl font-semibold text-[#15251C]">Log HSE Report / Observation</h1>
            <p className="text-xs text-[#5D6961] mt-0.5">
              Authoritative reporting interface with distinct categorization, audit trace, and evidence simulation.
            </p>
          </div>
        </div>

        <Link
          to={type === 'hazard' ? '/app/hazards' : '/app/incidents'}
          className="text-xs font-semibold text-[#007A44] hover:underline"
        >
          View Register
        </Link>
      </div>

      {/* Quick Demo Demonstration Presets */}
      <div className="bg-[#F4F8F5] border border-[#BDE3CE] rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#007A44] uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Interactive Demo Quick Presets</span>
        </div>
        <p className="text-xs text-[#37473F]">
          Click any preset to automatically populate verified industrial sample data, simulated photographic evidence, and test register separation:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => applyPreset('incident')}
            className={`p-2.5 rounded-lg border text-left transition-all text-xs ${
              type === 'incident' && title.includes('Hydrostatic')
                ? 'bg-white border-[#B42318] text-[#B42318] font-bold shadow-2xs'
                : 'bg-white/80 border-[#DDE5DF] text-[#15251C] hover:bg-white'
            }`}
          >
            <div className="font-semibold flex items-center gap-1.5 text-[#B42318]">
              <span className="w-2 h-2 rounded-full bg-[#B42318]" />
              <span>1. Demo Incident</span>
            </div>
            <div className="text-[11px] text-[#5D6961] truncate mt-0.5">Hydrostatic test pump rupture</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('near_miss')}
            className={`p-2.5 rounded-lg border text-left transition-all text-xs ${
              type === 'near_miss' && title.includes('Dropped')
                ? 'bg-white border-[#007A44] text-[#007A44] font-bold shadow-2xs'
                : 'bg-white/80 border-[#DDE5DF] text-[#15251C] hover:bg-white'
            }`}
          >
            <div className="font-semibold flex items-center gap-1.5 text-[#007A44]">
              <span className="w-2 h-2 rounded-full bg-[#007A44]" />
              <span>2. Demo Near Miss</span>
            </div>
            <div className="text-[11px] text-[#5D6961] truncate mt-0.5">Dropped tubular clamp</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('hazard')}
            className={`p-2.5 rounded-lg border text-left transition-all text-xs ${
              type === 'hazard' && title.includes('eyewash')
                ? 'bg-white border-[#B54708] text-[#B54708] font-bold shadow-2xs'
                : 'bg-white/80 border-[#DDE5DF] text-[#15251C] hover:bg-white'
            }`}
          >
            <div className="font-semibold flex items-center gap-1.5 text-[#B54708]">
              <span className="w-2 h-2 rounded-full bg-[#B54708]" />
              <span>3. Demo Hazard</span>
            </div>
            <div className="text-[11px] text-[#5D6961] truncate mt-0.5">Corroded eyewash valve</div>
          </button>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#DDE5DF] p-6 sm:p-8 space-y-6 shadow-xs">
        {validationErrors.form && (
          <div className="p-3.5 rounded-lg bg-[#FFF0ED] border border-[#FECDCA] text-xs text-[#B42318] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{validationErrors.form}</span>
          </div>
        )}

        {/* 1. Distinct Report Type Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#15251C] mb-2">
            1. Report Classification Type <span className="text-[#B42318]">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setType('incident');
                if (validationErrors.type) setValidationErrors(prev => ({ ...prev, type: '' }));
              }}
              className={`p-4 rounded-xl border text-left transition-all relative ${
                type === 'incident'
                  ? 'border-[#B42318] bg-[#FFF0ED]/40 ring-2 ring-[#B42318]/20'
                  : 'border-[#DDE5DF] bg-[#FAFCFA] hover:bg-[#F7F9F7]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#15251C]">Incident</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white border border-[#DDE5DF] text-[#B42318]">
                  INC-prefix
                </span>
              </div>
              <p className="text-xs text-[#5D6961] mt-1.5 leading-relaxed">
                Actual event causing injury, environmental release, asset damage, or process upset.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('near_miss');
                if (validationErrors.type) setValidationErrors(prev => ({ ...prev, type: '' }));
              }}
              className={`p-4 rounded-xl border text-left transition-all relative ${
                type === 'near_miss'
                  ? 'border-[#007A44] bg-[#EEF7F2]/60 ring-2 ring-[#007A44]/20'
                  : 'border-[#DDE5DF] bg-[#FAFCFA] hover:bg-[#F7F9F7]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#15251C]">Near Miss</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white border border-[#DDE5DF] text-[#007A44]">
                  NM-prefix
                </span>
              </div>
              <p className="text-xs text-[#5D6961] mt-1.5 leading-relaxed">
                Unplanned occurrence with harm potential, but without resulting injury or loss.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('hazard');
                if (validationErrors.type) setValidationErrors(prev => ({ ...prev, type: '' }));
              }}
              className={`p-4 rounded-xl border text-left transition-all relative ${
                type === 'hazard'
                  ? 'border-[#B54708] bg-[#FFFAEB]/60 ring-2 ring-[#B54708]/20'
                  : 'border-[#DDE5DF] bg-[#FAFCFA] hover:bg-[#F7F9F7]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#15251C]">Hazard Observation</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white border border-[#DDE5DF] text-[#B54708]">
                  HZ-prefix
                </span>
              </div>
              <p className="text-xs text-[#5D6961] mt-1.5 leading-relaxed">
                Unsafe act, structural condition, or mechanical defect observed proactively.
              </p>
            </button>
          </div>
        </div>

        {/* 2. Title */}
        <div>
          <label className="block text-xs font-semibold text-[#15251C] mb-1">
            2. Report Title / Operational Summary <span className="text-[#B42318]">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (validationErrors.title) setValidationErrors(prev => ({ ...prev, title: '' }));
            }}
            placeholder="e.g. Scaffolding clamp detachment at pipe rack level 2"
            className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#007A44] ${
              validationErrors.title ? 'border-[#B42318] bg-[#FFF0ED]/20' : 'border-[#DDE5DF] bg-white'
            }`}
          />
          {validationErrors.title && (
            <p className="text-xs text-[#B42318] mt-1">{validationErrors.title}</p>
          )}
        </div>

        {/* 3. Operational Site & Occurrence Timestamp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#15251C] mb-1">
              3. Operational Facility / Site <span className="text-[#B42318]">*</span>
            </label>
            <div className="relative">
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#DDE5DF] rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#007A44]"
              >
                {appState.sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} ({site.location})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#15251C] mb-1">
              4. Occurrence Date & Time <span className="text-[#B42318]">*</span>
            </label>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => {
                setOccurredAt(e.target.value);
                if (validationErrors.occurredAt) setValidationErrors(prev => ({ ...prev, occurredAt: '' }));
              }}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#007A44] ${
                validationErrors.occurredAt ? 'border-[#B42318]' : 'border-[#DDE5DF]'
              }`}
            />
            {validationErrors.occurredAt && (
              <p className="text-xs text-[#B42318] mt-1">{validationErrors.occurredAt}</p>
            )}
          </div>
        </div>

        {/* 4. Exact Physical Location */}
        <div>
          <label className="block text-xs font-semibold text-[#15251C] mb-1">
            5. Exact Location Details <span className="text-[#B42318]">*</span>
          </label>
          <input
            type="text"
            value={specificLocation}
            onChange={(e) => {
              setSpecificLocation(e.target.value);
              if (validationErrors.specificLocation) setValidationErrors(prev => ({ ...prev, specificLocation: '' }));
            }}
            placeholder="e.g. Wellhead Cellar Bay 3, Production Deck Bravo, Grid 4B"
            className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#007A44] ${
              validationErrors.specificLocation ? 'border-[#B42318]' : 'border-[#DDE5DF]'
            }`}
          />
          {validationErrors.specificLocation && (
            <p className="text-xs text-[#B42318] mt-1">{validationErrors.specificLocation}</p>
          )}
        </div>

        {/* 5. Detailed Description */}
        <div>
          <label className="block text-xs font-semibold text-[#15251C] mb-1">
            6. Detailed Description of the Observation / Occurrence <span className="text-[#B42318]">*</span>
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (validationErrors.description) setValidationErrors(prev => ({ ...prev, description: '' }));
            }}
            placeholder="Describe exactly what occurred, equipment involved, environmental conditions, and sequence of events..."
            className={`w-full p-3.5 text-xs sm:text-sm border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#007A44] ${
              validationErrors.description ? 'border-[#B42318]' : 'border-[#DDE5DF]'
            }`}
          />
          {validationErrors.description && (
            <p className="text-xs text-[#B42318] mt-1">{validationErrors.description}</p>
          )}
        </div>

        {/* 6. Immediate Action Taken */}
        <div>
          <label className="block text-xs font-semibold text-[#15251C] mb-1">
            7. Immediate Action Taken (Safeguarding & Mitigation)
          </label>
          <input
            type="text"
            value={immediateActionTaken}
            onChange={(e) => setImmediateActionTaken(e.target.value)}
            placeholder="e.g. Work halted, equipment isolated, warning signage erected, toolbox talk conducted"
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#DDE5DF] rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#007A44]"
          />
          <p className="text-[11px] text-[#5D6961] mt-1">
            Record instant containment steps executed on-site prior to supervisor review.
          </p>
        </div>

        {/* 7. Severity Indicator */}
        <div className="p-4 rounded-xl bg-[#F7F9F7] border border-[#DDE5DF] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#15251C]">
              8. Initial Severity Indicator (Field reporter estimate)
            </label>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-white border border-[#DDE5DF] text-[#15251C]">
              Level {severityEstimate} of 5
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={severityEstimate}
            onChange={(e) => setSeverityEstimate(Number(e.target.value))}
            className="w-full accent-[#007A44]"
          />
          <div className="flex justify-between text-[10px] text-[#5D6961]">
            <span>1 - Minor / Negligible</span>
            <span>2 - Moderate</span>
            <span>3 - Significant</span>
            <span>4 - Major</span>
            <span>5 - Catastrophic</span>
          </div>
        </div>

        {/* 8. Evidence & Attachment Simulation */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#15251C]">
              9. Supporting Evidence Selection & Attachments
            </label>
            <p className="text-xs text-[#5D6961] mt-0.5">
              Simulated demonstration attachments. Files are tracked locally in state and clearly labelled as simulated records.
            </p>
          </div>

          {/* Quick preset evidence buttons */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => addSimulatedEvidence('field_photo_macro_inspection.jpg', 'Close-up photo of component')}
              className="px-3 py-1.5 rounded-lg border border-[#DDE5DF] bg-white hover:border-[#007A44] hover:text-[#007A44] flex items-center gap-1.5 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-[#007A44]" />
              <span>+ Add Macro Photo (Simulated)</span>
            </button>
            <button
              type="button"
              onClick={() => addSimulatedEvidence('isolation_permit_ptw_signoff.pdf', 'Permit to Work copy')}
              className="px-3 py-1.5 rounded-lg border border-[#DDE5DF] bg-white hover:border-[#007A44] hover:text-[#007A44] flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#007A44]" />
              <span>+ Add PTW Permit PDF (Simulated)</span>
            </button>
          </div>

          {/* Dropzone with real file input or click */}
          <div className="border-2 border-dashed border-[#DDE5DF] rounded-xl p-5 text-center bg-[#FAFCFA] hover:bg-[#F7F9F7] transition-colors relative">
            <input
              type="file"
              multiple
              onChange={handleCustomFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Upload file (simulated locally)"
            />
            <Upload className="w-6 h-6 text-[#5D6961] mx-auto mb-1.5" />
            <div className="text-xs font-semibold text-[#15251C]">
              Select device files or drop photos here
            </div>
            <div className="text-[11px] text-[#5D6961] mt-0.5">
              (Files remain strictly in local browser state; not transmitted to remote servers)
            </div>
          </div>

          {/* Attached Files List */}
          {evidenceList.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-[#15251C]">
                Attached Evidence Files ({evidenceList.length}):
              </span>
              <div className="divide-y divide-[#DDE5DF] border border-[#DDE5DF] rounded-lg bg-white overflow-hidden">
                {evidenceList.map((ev) => (
                  <div key={ev.id} className="p-3 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded bg-[#EEF7F2] text-[#007A44] flex items-center justify-center shrink-0">
                        <Paperclip className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-[#15251C] truncate">{ev.name}</div>
                        <div className="text-[10px] text-[#5D6961] flex items-center gap-2">
                          <span>{(ev.sizeBytes / 1024).toFixed(0)} KB</span>
                          <span>·</span>
                          <span className="text-[#007A44] font-medium">SIMULATED ATTACHMENT</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeEvidence(ev.id)}
                      className="p-1 text-[#5D6961] hover:text-[#B42318] rounded-md transition-colors"
                      title="Remove evidence"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer Notice */}
        <div className="p-3.5 rounded-lg bg-[#FFFAEB] border border-[#FEDF89] text-[11px] text-[#B54708] flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Audit Trace Notice:</strong> Submitting this record creates an immutable log event under your active profile (<strong>{appState.currentUser.name}</strong>, {appState.currentUser.roleTitle}). Original submitted facts are locked; future reviewer adjustments are tracked in dedicated audit logs.
          </span>
        </div>

        {/* Action Controls */}
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
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Recording Report...' : `Submit ${type.replace('_', ' ').toUpperCase()} Report`}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
