/**
 * Central Data-Service Layer for the Exousia HSE Management System
 * Provides observable state, persistent storage, business rules enforcement,
 * and contract-aligned calculations for incidents, near misses, hazards,
 * inspections, corrective actions, compliance, and audit logs.
 */

import {
  HSEReport,
  ActionItem,
  Inspection,
  ComplianceObligation,
  AuditEvent,
  UserProfile,
  Site,
  InspectionTemplate,
  UserRole,
  RiskBand,
  ChecklistItemResult,
  ActionStatus,
  ReportCorrection,
  Attachment,
  RiskMatrixConfig,
  SeverityScaleItem,
  LikelihoodScaleItem,
  RiskBandDefinition,
  RiskClassification,
  ReassignmentRecord,
  DueDateExtensionRecord,
  ReopenRecord,
  DueDateStatus,
  ComplianceState,
  ComplianceReviewRecord
} from '../types/hse';
import { INITIAL_SITES, INITIAL_USERS } from '../constants/tokens';

const STORAGE_KEY = 'exousia_hse_app_state_v1';
const CURRENT_DATE_STRING = '2026-10-02';

// 5x5 Risk Matrix & Finding Classification Scheme
// Contract Section 4: Treated as PROVISIONAL setting requiring Client Operating Committee approval
export const DEFAULT_MATRIX_CONFIG: RiskMatrixConfig = {
  version: '5x5-v1.0-provisional',
  name: 'Standard 5×5 Industrial Risk Matrix (Proposed Scheme)',
  isProvisional: true,
  approvalStatus: 'pending_client_approval',
  clientApprovalNotes: 'Provisional baseline demonstration scheme presented in Contract Award & HSE Build Specification Section 4. Awaiting formal Client Operating Committee sign-off.',
  severities: [
    { level: 1, label: '1 - Minor', description: 'First aid treatment only; minor scratch/bruise; negligible equipment or environmental impact.' },
    { level: 2, label: '2 - Moderate', description: 'Medical treatment case (MTC); minor localized release contained immediately; asset damage < $5k.' },
    { level: 3, label: '3 - Significant', description: 'Lost Time Injury (LTI) with restricted duty; localized environmental breach; equipment downtime 4-24h.' },
    { level: 4, label: '4 - Major', description: 'Single permanent disability or severe critical injury; major hydrocarbon spill; severe asset impairment.' },
    { level: 5, label: '5 - Catastrophic', description: 'Multiple fatalities; widespread uncontained toxic release; catastrophic facility destruction.' }
  ],
  likelihoods: [
    { level: 1, label: '1 - Rare', description: 'Conceivable only under extreme, freak combinations of events; heard of in industry (< 1 in 10 years).' },
    { level: 2, label: '2 - Unlikely', description: 'Has occurred in the upstream/energy sector; not expected during normal operations (1 in 5 years).' },
    { level: 3, label: '3 - Possible', description: 'Could occur occasionally at this facility; documented in past operating campaigns (annual occurrence).' },
    { level: 4, label: '4 - Likely', description: 'High probability; occurs several times per year under similar operating parameters or weather conditions.' },
    { level: 5, label: '5 - Almost Certain', description: 'Expected to occur regularly or continuously unless active intervention is maintained (monthly / weekly).' }
  ],
  bands: [
    { band: 'low', label: 'Low Risk', minScore: 1, maxScore: 4, actionProtocol: 'Managed by routine operational controls and standard operating procedures (SOPs).', readableIdentifier: 'LOW RISK (Score: 1-4) - Routine Controls' },
    { band: 'medium', label: 'Medium Risk', minScore: 5, maxScore: 9, actionProtocol: 'Specific mitigating action required; Area Supervisor oversight and HSE Officer verification.', readableIdentifier: 'MEDIUM RISK (Score: 5-9) - Specific Action Required' },
    { band: 'high', label: 'High Risk', minScore: 10, maxScore: 16, actionProtocol: 'Detailed risk assessment, expedited CAPA within 7 days, and Operations Manager sign-off.', readableIdentifier: 'HIGH RISK (Score: 10-16) - Expedited CAPA Within 7 Days' },
    { band: 'critical', label: 'Critical Risk', minScore: 17, maxScore: 25, actionProtocol: 'Immediate stop-work order, emergency isolation, 24h CAPA deadline, and Executive Director briefing.', readableIdentifier: 'CRITICAL RISK (Score: 17-25) - Stop Work & Immediate Escalation' }
  ],
  findingCategories: [
    'Mechanical Integrity & Pressure Systems',
    'Electrical Safety & Earthing',
    'Fire Protection & Muster Systems',
    'Housekeeping & Accessways',
    'Lifting Equipment & Rigging Gear',
    'PPE & Personnel Safeguards',
    'Permit to Work & Isolation Controls',
    'Environmental & Hazardous Substance Containment'
  ]
};

// 5x5 Risk Matrix Calculation verifying score = Severity × Likelihood
export function calculateRisk(
  severity: number,
  likelihood: number,
  matrixConfig?: RiskMatrixConfig
): {
  score: number;
  band: RiskBand;
  label: string;
  readableIdentifier: string;
} {
  const safeSeverity = Math.min(Math.max(severity, 1), 5);
  const safeLikelihood = Math.min(Math.max(likelihood, 1), 5);
  const score = safeSeverity * safeLikelihood;

  const bands = matrixConfig?.bands || DEFAULT_MATRIX_CONFIG.bands;
  const match = bands.find(b => score >= b.minScore && score <= b.maxScore) || bands[0];

  return {
    score,
    band: match.band,
    label: match.label,
    readableIdentifier: match.readableIdentifier
  };
}

/**
 * Overdue derivation rule:
 * Overdue is derived from the due date and lifecycle state.
 * CRITICAL SPEC RULE: Evidence submission does NOT count as closure!
 * Even if an action is awaiting verification or has evidence submitted, if the
 * due date has passed, it remains active and overdue until an authorized verifier
 * formally verifies and CLOSES the action.
 */
export function isActionOverdue(action: ActionItem, referenceDate: string = '2026-10-02'): boolean {
  if (action.status === 'closed') {
    return false;
  }
  return action.dueDate < referenceDate;
}

export function getActionDueDateStatus(
  action: ActionItem,
  referenceDate: string = '2026-10-02'
): {
  status: DueDateStatus;
  daysRemaining: number;
  isOverdue: boolean;
  label: string;
} {
  if (action.status === 'closed') {
    return {
      status: 'current',
      daysRemaining: 0,
      isOverdue: false,
      label: 'Verified & Closed'
    };
  }

  const ref = new Date(referenceDate).getTime();
  const due = new Date(action.dueDate).getTime();
  const diffDays = Math.ceil((due - ref) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'overdue',
      daysRemaining: diffDays,
      isOverdue: true,
      label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`
    };
  }

  if (diffDays === 0) {
    return {
      status: 'due_soon',
      daysRemaining: 0,
      isOverdue: false,
      label: 'Due today (02 Oct 2026)'
    };
  }

  if (diffDays <= 3) {
    return {
      status: 'due_soon',
      daysRemaining: diffDays,
      isOverdue: false,
      label: `Due soon (${diffDays} day${diffDays === 1 ? '' : 's'} remaining)`
    };
  }

  return {
    status: 'current',
    daysRemaining: diffDays,
    isOverdue: false,
    label: `Due on ${action.dueDate}`
  };
}

// Initial sample data grounded in Exousia_HSE_Build_Specification and screenshot fixtures
const DEFAULT_REPORTS: HSEReport[] = [
  {
    id: 'rep-1',
    reportNumber: 'NM-2026-042',
    type: 'near_miss',
    title: 'Manual handling near miss during manifold staging',
    description: 'During offloading of auxiliary valve spools at the loading bay, a rigging strap slipped 15cm on the crane hook. The load swung toward two technicians. Both workers stepped clear; no contact or injury occurred.',
    siteId: 'site-4',
    siteName: 'Maintenance Fabrication Workshop',
    specificLocation: 'Bay 2 Heavy Staging & Crane Way',
    occurredAt: '2026-10-01T14:20:00Z',
    reportedAt: '2026-10-01T15:05:00Z',
    reporterId: 'user-reporter',
    reporterName: 'Tari Amadi',
    immediateActionTaken: 'Crane operations suspended immediately. Rigging gear inspected and sling tag verified. Toolbox talk convened with loading crew.',
    status: 'under_review',
    classification: {
      severity: 3,
      likelihood: 3,
      score: 9,
      band: 'medium',
      category: 'Lifting Equipment & Rigging Gear',
      rationale: 'Potential moderate pinch/crush risk if rigging failure occurred under full suspended load.',
      matrixVersion: '5x5-v1.0-provisional',
      classifiedBy: 'Ibrahim Olatunji',
      classifiedAt: '2026-10-01T17:00:00Z',
      isProvisional: true,
      clientApprovalStatus: 'pending_client_approval'
    },
    reviewerId: 'user-officer',
    reviewerName: 'Ibrahim Olatunji',
    reviewerNotes: 'Incident retained strictly as near miss per contract scope clause 1.2. Requires review of sling friction pads.',
    investigationFindings: [
      'Synthetic sling had minor grease coating reducing friction coefficient on the painted spool body.',
      'Ground spotter was distracted by simultaneous forklift transit in the adjacent bay corridor.'
    ],
    linkedActionIds: ['act-2'],
    attachments: [
      {
        id: 'att-1',
        name: 'crane_hook_sling_inspection_01Oct.jpg',
        sizeBytes: 1024 * 480,
        mimeType: 'image/jpeg',
        uploadedAt: '2026-10-01T15:10:00Z',
        uploadedBy: 'Tari Amadi'
      }
    ]
  },
  {
    id: 'rep-2',
    reportNumber: 'HZ-2026-014',
    type: 'hazard',
    title: 'Obstructed emergency access corridor at welding bay',
    description: 'Stack of raw steel pipe segments left obstructing the primary fire evacuation corridor and eyewash station approach.',
    siteId: 'site-4',
    siteName: 'Maintenance Fabrication Workshop',
    specificLocation: 'Corridor 3 between Fabrication Bay & Tool Crib',
    occurredAt: '2026-10-02T08:15:00Z',
    reportedAt: '2026-10-02T08:30:00Z',
    reporterId: 'user-supervisor',
    reporterName: 'Emeka Nwosu',
    immediateActionTaken: 'Fabrication crew notified; marked clear perimeter with high-vis cones while forklift was summoned.',
    status: 'under_review',
    classification: {
      severity: 2,
      likelihood: 4,
      score: 8,
      band: 'medium',
      category: 'Housekeeping & Accessways',
      rationale: 'High likelihood of trip hazard and delayed exit in case of workshop fire or chemical splash.',
      matrixVersion: '5x5-v1.0-provisional',
      classifiedBy: 'Ibrahim Olatunji',
      classifiedAt: '2026-10-02T09:10:00Z',
      isProvisional: true,
      clientApprovalStatus: 'pending_client_approval'
    },
    reviewerId: 'user-officer',
    reviewerName: 'Ibrahim Olatunji',
    reviewerNotes: 'Housekeeping non-conformance. Linked to workshop supervisor follow-up.',
    linkedActionIds: [],
    attachments: []
  },
  {
    id: 'rep-3',
    reportNumber: 'INC-2026-081',
    type: 'incident',
    title: 'Hydraulic hose guard rupture during hydrostatic test pump cycle',
    description: 'During routine 5,000 psi hydrostatic pressure test of refurbished manifold section, a high-pressure burst shield split along the seam clamp. Spray of test water (potable with rust inhibitor) reached the containment trench. No personnel injuries.',
    siteId: 'site-4',
    siteName: 'Maintenance Fabrication Workshop',
    specificLocation: 'Hydrostatic Test Cell #1',
    occurredAt: '2026-09-28T11:45:00Z',
    reportedAt: '2026-09-28T12:10:00Z',
    reporterId: 'user-reporter',
    reporterName: 'Tari Amadi',
    immediateActionTaken: 'System emergency stop tripped within 3 seconds. Pressure bled off. Area cordoned with warning tape.',
    status: 'actions_in_progress',
    classification: {
      severity: 4,
      likelihood: 2,
      score: 8,
      band: 'medium',
      category: 'Mechanical Integrity & Pressure Systems',
      rationale: 'High pressure energy release potential; mitigation by enclosure prevented personal injury.',
      matrixVersion: '5x5-v1.0-provisional',
      classifiedBy: 'Josephine Yese',
      classifiedAt: '2026-09-29T09:00:00Z',
      isProvisional: true,
      clientApprovalStatus: 'pending_client_approval'
    },
    reviewerId: 'user-manager',
    reviewerName: 'Josephine Yese',
    reviewerNotes: 'Requires replacement of hose guard assemblies across all 3 hydro cells with certified 10,000 psi ballistic wrap.',
    rootCauseAnalysis: 'Fatigue cracking on legacy bracket weld coupled with harmonic vibration from high-displacement triplex pump.',
    investigationFindings: [
      'Hose guard clamp had exceeded recommended 2,000-cycle inspection interval.',
      'Containment sump operated as designed to retain test fluids without ground contamination.'
    ],
    linkedActionIds: ['act-1'],
    attachments: []
  }
];

const DEFAULT_ACTIONS: ActionItem[] = [
  {
    id: 'act-1',
    actionNumber: 'ACT-2026-051',
    title: 'Replace damaged hose guard and recalibrate pressure shield clamps',
    description: 'Procure and install rated ballistic nylon hose guard on Hydro Cell #1 pump discharge manifold. Inspect clamps on Cells #2 & #3.',
    actionType: 'corrective',
    sourceType: 'incident',
    sourceId: 'rep-3',
    sourceNumber: 'INC-2026-081',
    siteId: 'site-4',
    siteName: 'Maintenance Fabrication Workshop',
    ownerId: 'user-supervisor',
    ownerName: 'Emeka Nwosu',
    assignedById: 'user-manager',
    assignedByName: 'Josephine Yese',
    dueDate: '2026-09-30', // Overdue relative to 2026-10-02!
    originalDueDate: '2026-09-30',
    status: 'in_progress',
    priority: 'high',
    evidenceAttachments: [],
    updates: [
      {
        id: 'upd-1',
        authorId: 'user-supervisor',
        authorName: 'Emeka Nwosu',
        timestamp: '2026-09-29T16:00:00Z',
        note: 'Ordered heavy-duty wrap from approved procurement vendor. Delivery delayed by 48 hours due to regional transit checks.'
      }
    ],
    createdAt: '2026-09-28T14:00:00Z'
  },
  {
    id: 'act-2',
    actionNumber: 'ACT-2026-052',
    title: 'Review manual handling and sling rigging safety briefing with all staging crews',
    description: 'Conduct mandatory 20-minute safety stand-down for loading bay crews. Re-verify sling inspection tags and crane spotter protocols.',
    actionType: 'preventive',
    sourceType: 'near_miss',
    sourceId: 'rep-1',
    sourceNumber: 'NM-2026-042',
    siteId: 'site-4',
    siteName: 'Maintenance Fabrication Workshop',
    ownerId: 'user-supervisor',
    ownerName: 'Emeka Nwosu',
    assignedById: 'user-officer',
    assignedByName: 'Ibrahim Olatunji',
    dueDate: '2026-10-02', // Today!
    originalDueDate: '2026-10-02',
    status: 'awaiting_verification',
    priority: 'medium',
    submittedAt: '2026-10-02T08:00:00Z',
    evidenceDescription: 'Conducted stand-down briefing at 07:15 with 14 riggers and crane operators. Signed attendance roster attached.',
    evidenceAttachments: [
      {
        id: 'att-2',
        name: 'manual_handling_briefing_roster_02Oct.pdf',
        sizeBytes: 1024 * 320,
        mimeType: 'application/pdf',
        uploadedAt: '2026-10-02T08:00:00Z',
        uploadedBy: 'Emeka Nwosu'
      }
    ],
    updates: [
      {
        id: 'upd-2',
        authorId: 'user-supervisor',
        authorName: 'Emeka Nwosu',
        timestamp: '2026-10-02T08:02:00Z',
        note: 'Submitted sign-off sheet for verification by HSE Officer.',
        statusChange: 'awaiting_verification'
      }
    ],
    createdAt: '2026-10-01T18:00:00Z'
  },
  {
    id: 'act-3',
    actionNumber: 'ACT-2026-053',
    title: 'Install permanent secondary barrier chain at chemical dosing skid',
    description: 'Erect high-visibility safety rail and secondary containment barrier around poly-electrolyte tank to prevent forklift impact.',
    actionType: 'preventive',
    sourceType: 'hazard',
    sourceId: 'rep-2',
    sourceNumber: 'HZ-2026-014',
    siteId: 'site-2',
    siteName: 'Warri Flowstation 4B',
    ownerId: 'user-supervisor',
    ownerName: 'Emeka Nwosu',
    assignedById: 'user-officer',
    assignedByName: 'Ibrahim Olatunji',
    dueDate: '2026-10-15',
    originalDueDate: '2026-10-15',
    status: 'open',
    priority: 'medium',
    evidenceAttachments: [],
    updates: [],
    createdAt: '2026-10-01T10:00:00Z'
  },
  {
    id: 'act-demo',
    actionNumber: 'ACT-2026-DEMO',
    title: 'Procure and install rated ballistic shield with hydro test certificate',
    description: 'Fabricate and mount 10,000 psi ballistic wrap on Hydro Cell #1 manifold; verify ASME B31.3 proof test tag.',
    actionType: 'corrective',
    sourceType: 'incident',
    sourceId: 'rep-3',
    sourceNumber: 'INC-2026-081',
    siteId: 'site-4',
    siteName: 'Maintenance Fabrication Workshop',
    ownerId: 'user-supervisor',
    ownerName: 'Emeka Nwosu',
    assignedById: 'user-manager',
    assignedByName: 'Josephine Yese',
    dueDate: '2026-10-15',
    originalDueDate: '2026-10-10',
    extensionReason: 'Supply chain lead-time for OEM certified ballistic nylon shroud wrap.',
    dueDateHistory: [
      {
        id: 'ext-demo-1',
        timestamp: '2026-10-01T10:00:00Z',
        previousDueDate: '2026-10-10',
        newDueDate: '2026-10-15',
        reason: 'Supply chain lead-time for OEM certified ballistic nylon shroud wrap.',
        actorId: 'user-manager',
        actorName: 'Josephine Yese'
      }
    ],
    reassignmentHistory: [
      {
        id: 'rea-demo-1',
        timestamp: '2026-09-29T14:00:00Z',
        previousOwnerId: 'user-officer',
        previousOwnerName: 'Ibrahim Olatunji',
        newOwnerId: 'user-supervisor',
        newOwnerName: 'Emeka Nwosu',
        reason: 'Mechanical fabrication work package transferred to Workshop Supervisor.',
        actorId: 'user-manager',
        actorName: 'Josephine Yese'
      }
    ],
    reopenHistory: [],
    status: 'closed',
    priority: 'high',
    evidenceDescription: 'Installed certified 10,000 psi ballistic nylon shield. Affixed stainless OEM verification tag #BP-9982. Witnessed hydrostatic proof cycle at 7,500 psi.',
    evidenceAttachments: [
      {
        id: 'att-demo-1',
        name: 'ballistic_shield_installed_tag.jpg',
        sizeBytes: 1024 * 420,
        mimeType: 'image/jpeg',
        uploadedAt: '2026-10-02T14:00:00Z',
        uploadedBy: 'Emeka Nwosu'
      },
      {
        id: 'att-demo-2',
        name: 'asme_hydro_proof_cert_BP9982.pdf',
        sizeBytes: 1024 * 680,
        mimeType: 'application/pdf',
        uploadedAt: '2026-10-02T14:05:00Z',
        uploadedBy: 'Emeka Nwosu'
      }
    ],
    submittedAt: '2026-10-02T14:10:00Z',
    verifiedById: 'user-manager',
    verifiedByName: 'Josephine Yese',
    verifiedAt: '2026-10-02T16:30:00Z',
    verificationNotes: 'Physical inspection performed in Hydro Bunker #1. Proof test certificate #BP-9982 cross-referenced against vendor log. Shield properly clamped and verified. Action signed off and officially CLOSED.',
    updates: [
      {
        id: 'upd-demo-1',
        authorId: 'user-manager',
        authorName: 'Josephine Yese',
        timestamp: '2026-09-29T09:30:00Z',
        note: 'Stage 1 [Assignment]: Assigned high-priority corrective action following incident INC-2026-081 review.'
      },
      {
        id: 'upd-demo-2',
        authorId: 'user-supervisor',
        authorName: 'Emeka Nwosu',
        timestamp: '2026-09-30T11:00:00Z',
        note: 'Stage 2 [Progress]: Completed physical measurements. Raised purchase requisition PR-2026-441 with OEM safety shroud vendor.',
        statusChange: 'in_progress'
      },
      {
        id: 'upd-demo-3',
        authorId: 'user-supervisor',
        authorName: 'Emeka Nwosu',
        timestamp: '2026-10-01T16:00:00Z',
        note: 'Stage 3 [Evidence Submission]: Initial installation completed. Shroud fitted over manifold. (Note: Evidence submission does NOT close the action).',
        statusChange: 'awaiting_verification'
      },
      {
        id: 'upd-demo-4',
        authorId: 'user-officer',
        authorName: 'Ibrahim Olatunji',
        timestamp: '2026-10-02T09:00:00Z',
        note: 'Stage 4 [Rejection / Returned for Rework]: Physical shroud is mounted, but vendor hydrostatic certificate #BP-9982 was missing from submission. Calibration tag must be riveted and test certificate uploaded before closure approval.',
        statusChange: 'returned_for_rework'
      },
      {
        id: 'upd-demo-5',
        authorId: 'user-supervisor',
        authorName: 'Emeka Nwosu',
        timestamp: '2026-10-02T14:10:00Z',
        note: 'Stage 5 [Resubmission]: Affixed stainless steel tag #BP-9982 and attached vendor certificate sheet asme_hydro_proof_cert_BP9982.pdf. Resubmitted for formal sign-off.',
        statusChange: 'awaiting_verification'
      },
      {
        id: 'upd-demo-6',
        authorId: 'user-manager',
        authorName: 'Josephine Yese',
        timestamp: '2026-10-02T16:30:00Z',
        note: 'Stage 6 [Verified Closure]: Independent verification performed. Certificates audited against ASME B31.3 standards. Physical tag inspected. Two-person rule satisfied. Closure APPROVED.',
        statusChange: 'closed'
      }
    ],
    createdAt: '2026-09-29T09:30:00Z'
  }
];

const DEFAULT_INSPECTION_TEMPLATES: InspectionTemplate[] = [
  {
    id: 'tmpl-workshop',
    title: 'Weekly Maintenance Workshop Safety Checklist',
    version: '2.1',
    category: 'Facility & Equipment',
    items: [
      { id: 'item-1', section: 'Housekeeping & Walkways', question: 'Are all emergency evacuation routes, fire exits, and walkways unobstructed and clearly marked?' },
      { id: 'item-2', section: 'Housekeeping & Walkways', question: 'Are flammable solvent storage cabinets grounded and locked when unattended?' },
      { id: 'item-3', section: 'PPE & Eye Protection', question: 'Are eye wash stations and emergency deluge showers inspected, tagged, and clear of obstacles?' },
      { id: 'item-4', section: 'Machinery & Electrical', question: 'Do all grinding wheels, lathes, and high-pressure test pumps have operational machine guards in place?' },
      { id: 'item-5', section: 'Lifting & Rigging', question: 'Are overhead crane hoist limit switches functional and rigging slings inspected with valid color tags?' }
    ]
  },
  {
    id: 'tmpl-offshore',
    title: 'Offshore Wellhead & Platform Deck Inspection',
    version: '1.4',
    category: 'Offshore Operations',
    items: [
      { id: 'off-1', section: 'Wellhead Bay', question: 'Is wellhead cellar free of standing hydrocarbons and grating firmly secured?' },
      { id: 'off-2', section: 'Fire & Gas Detection', question: 'Are toxic H2S and combustible gas detector heads unblocked and showing normal status?' },
      { id: 'off-3', section: 'Life Safety', question: 'Are life rafts, escape chutes, and muster station call points fully equipped and illuminated?' }
    ]
  }
];

const DEFAULT_INSPECTIONS: Inspection[] = [
  {
    id: 'ins-1',
    inspectionNumber: 'INS-2026-022',
    title: 'Weekly workshop safety inspection - Week 40',
    templateId: 'tmpl-workshop',
    templateVersion: '2.1',
    siteId: 'site-4',
    siteName: 'Maintenance Fabrication Workshop',
    scheduledDate: '2026-10-02',
    inspectorId: 'user-officer',
    inspectorName: 'Ibrahim Olatunji',
    status: 'scheduled',
    items: [
      { id: 'item-1', section: 'Housekeeping & Walkways', question: 'Are all emergency evacuation routes, fire exits, and walkways unobstructed and clearly marked?', result: undefined },
      { id: 'item-2', section: 'Housekeeping & Walkways', question: 'Are flammable solvent storage cabinets grounded and locked when unattended?', result: undefined },
      { id: 'item-3', section: 'PPE & Eye Protection', question: 'Are eye wash stations and emergency deluge showers inspected, tagged, and clear of obstacles?', result: undefined },
      { id: 'item-4', section: 'Machinery & Electrical', question: 'Do all grinding wheels, lathes, and high-pressure test pumps have operational machine guards in place?', result: undefined },
      { id: 'item-5', section: 'Lifting & Rigging', question: 'Are overhead crane hoist limit switches functional and rigging slings inspected with valid color tags?', result: undefined }
    ],
    findingsCount: 0,
    linkedActionIds: []
  },
  {
    id: 'ins-0',
    inspectionNumber: 'INS-2026-021',
    title: 'Weekly workshop safety inspection - Week 39',
    templateId: 'tmpl-workshop',
    templateVersion: '2.1',
    siteId: 'site-4',
    siteName: 'Maintenance Fabrication Workshop',
    scheduledDate: '2026-09-25',
    inspectorId: 'user-officer',
    inspectorName: 'Ibrahim Olatunji',
    status: 'completed',
    startedAt: '2026-09-25T09:00:00Z',
    completedAt: '2026-09-25T11:30:00Z',
    items: [
      { id: 'item-1', section: 'Housekeeping & Walkways', question: 'Are all emergency evacuation routes, fire exits, and walkways unobstructed and clearly marked?', result: 'pass' },
      { id: 'item-2', section: 'Housekeeping & Walkways', question: 'Are flammable solvent storage cabinets grounded and locked when unattended?', result: 'pass' },
      { id: 'item-3', section: 'PPE & Eye Protection', question: 'Are eye wash stations and emergency deluge showers inspected, tagged, and clear of obstacles?', result: 'pass' },
      {
        id: 'item-4',
        section: 'Machinery & Electrical',
        question: 'Do all grinding wheels, lathes, and high-pressure test pumps have operational machine guards in place?',
        result: 'fail',
        findingNote: 'Hydro Cell 1 hose guard clamp loose; see subsequent replacement action.',
        findingCategory: 'Mechanical Integrity & Pressure Systems',
        findingClassification: {
          severity: 4,
          likelihood: 2,
          score: 8,
          band: 'medium',
          rationale: 'Loose bracket on high pressure line presents strike risk during cyclic test cycles.',
          matrixVersion: '5x5-v1.0-provisional',
          classifiedBy: 'Ibrahim Olatunji',
          classifiedAt: '2026-09-25T10:15:00Z',
          isProvisional: true
        },
        linkedActionId: 'act-1'
      },
      { id: 'item-5', section: 'Lifting & Rigging', question: 'Are overhead crane hoist limit switches functional and rigging slings inspected with valid color tags?', result: 'pass' }
    ],
    findingsCount: 1,
    linkedActionIds: ['act-1'],
    summaryNotes: 'Completed successfully with 1 mechanical guard finding flagged for supervisor corrective action.'
  }
];

const DEFAULT_COMPLIANCE: ComplianceObligation[] = [
  {
    id: 'cmp-1',
    obligationNumber: 'CMP-2026-001',
    title: 'Statutory Factory & Pressure Vessel Recertification (Factories Act Cap F1)',
    sourceReference: 'Factories Act Cap F1 LFN 2004, Section 32',
    regulatorOrAuthority: 'Federal Ministry of Labour & Employment / NUPRC',
    applicableSiteIds: ['site-4', 'site-2'],
    ownerId: 'user-manager',
    ownerName: 'Josephine Yese',
    dueDate: '2026-10-24', // Due in 22 days -> "due_soon"
    complianceState: 'compliant',
    isInternalStandard: false,
    category: 'Statutory Asset Recertification',
    lastReviewedAt: '2026-08-15T10:00:00Z',
    reviewedById: 'user-manager',
    reviewedByName: 'Josephine Yese',
    reviewNotes: 'Authorized third-party inspection agency booked for 18 Oct. Prior certificates verified current.',
    evidenceAttachments: [
      {
        id: 'att-cmp-1',
        name: 'prior_boiler_vessel_cert_2025.pdf',
        sizeBytes: 1024 * 780,
        mimeType: 'application/pdf',
        uploadedAt: '2026-08-15T10:00:00Z',
        uploadedBy: 'Josephine Yese'
      }
    ],
    reviewHistory: [
      {
        id: 'rev-cmp-1-1',
        timestamp: '2026-08-15T10:00:00Z',
        reviewerId: 'user-manager',
        reviewerName: 'Josephine Yese',
        previousState: 'not_assessed',
        newState: 'compliant',
        notes: 'Annual statutory audit completed. Third-party testing agency booked for 18 Oct. Prior hydrostatic certificates verified current.'
      }
    ]
  },
  {
    id: 'cmp-2',
    obligationNumber: 'CMP-2026-002',
    title: 'Environmental Effluent & Discharge Compliance Permit',
    sourceReference: 'NESREA National Environmental Regulations S.I. 28 / EGASPIN 2018',
    regulatorOrAuthority: 'NESREA / NOSDRA',
    applicableSiteIds: ['site-2', 'site-1'],
    ownerId: 'user-officer',
    ownerName: 'Ibrahim Olatunji',
    dueDate: '2026-12-15', // Due in 74 days -> "current"
    complianceState: 'compliant',
    isInternalStandard: false,
    category: 'Environmental Permitting',
    lastReviewedAt: '2026-09-10T14:00:00Z',
    reviewedById: 'user-officer',
    reviewedByName: 'Ibrahim Olatunji',
    reviewNotes: 'Quarterly discharge lab analysis verified within permissible heavy metal thresholds.',
    evidenceAttachments: [
      {
        id: 'att-cmp-2',
        name: 'nesrea_q3_discharge_lab_report.pdf',
        sizeBytes: 1024 * 512,
        mimeType: 'application/pdf',
        uploadedAt: '2026-09-10T14:00:00Z',
        uploadedBy: 'Ibrahim Olatunji'
      }
    ],
    reviewHistory: [
      {
        id: 'rev-cmp-2-1',
        timestamp: '2026-09-10T14:00:00Z',
        reviewerId: 'user-officer',
        reviewerName: 'Ibrahim Olatunji',
        previousState: 'not_assessed',
        newState: 'compliant',
        notes: 'Quarterly discharge lab analysis verified within permissible heavy metal thresholds. Test certificate approved.'
      }
    ]
  },
  {
    id: 'cmp-3',
    obligationNumber: 'CMP-2026-003',
    title: '[Sample Internal Obligation] Mandatory Lockout-Tagout (LOTO) & Energy Isolation Audit',
    sourceReference: 'Exousia Corporate HSE Standard SOP-HSE-014 (Section 4.2)',
    regulatorOrAuthority: 'Exousia Internal HSE Corporate Governance',
    applicableSiteIds: ['site-4', 'site-2', 'site-3'],
    ownerId: 'user-supervisor',
    ownerName: 'Emeka Nwosu',
    dueDate: '2026-11-15', // Calendar deadline is 44 days out ("current" horizon)
    complianceState: 'non_compliant', // Demonstrates: future deadline != compliant!
    isInternalStandard: true,
    category: 'Internal Safety Policy',
    lastReviewedAt: '2026-09-28T16:00:00Z',
    reviewedById: 'user-manager',
    reviewedByName: 'Josephine Yese',
    reviewNotes: 'Surveillance audit in Fabrication Workshop Hydro Cell #1 found 2 padlock lockout stations missing isolation log sheets. Assessed Non-Compliant pending corrective action remediation.',
    evidenceAttachments: [
      {
        id: 'att-cmp-3',
        name: 'loto_station_deficiency_photo.jpg',
        sizeBytes: 1024 * 380,
        mimeType: 'image/jpeg',
        uploadedAt: '2026-09-28T16:00:00Z',
        uploadedBy: 'Josephine Yese'
      }
    ],
    reviewHistory: [
      {
        id: 'rev-cmp-3-1',
        timestamp: '2026-07-01T09:00:00Z',
        reviewerId: 'user-manager',
        reviewerName: 'Josephine Yese',
        previousState: 'not_assessed',
        newState: 'compliant',
        notes: 'Initial policy rollout audit passed across all production sites with all 4 lockout stations fully stocked.'
      },
      {
        id: 'rev-cmp-3-2',
        timestamp: '2026-09-28T16:00:00Z',
        reviewerId: 'user-manager',
        reviewerName: 'Josephine Yese',
        previousState: 'compliant',
        newState: 'non_compliant',
        notes: 'Surveillance audit in Fabrication Workshop Hydro Cell #1 found 2 padlock lockout stations missing isolation log sheets. Assessed Non-Compliant pending corrective action remediation.'
      }
    ]
  },
  {
    id: 'cmp-4',
    obligationNumber: 'CMP-2026-004',
    title: '[Sample Internal Obligation] Monthly Deluge & Emergency Eyewash Station Functionality Testing',
    sourceReference: 'Exousia Facility Maintenance Directive FMD-08',
    regulatorOrAuthority: 'Exousia Internal Asset Integrity Department',
    applicableSiteIds: ['site-1', 'site-2', 'site-4'],
    ownerId: 'user-officer',
    ownerName: 'Ibrahim Olatunji',
    dueDate: '2026-10-31', // 29 days out -> "due_soon"
    complianceState: 'not_assessed', // Demonstrates: deadline active, but not yet assessed!
    isInternalStandard: true,
    category: 'Internal Maintenance Standard',
    reviewNotes: 'Scheduled for monthly physical flow rate inspection and water pressure tag audit on 15 October.',
    evidenceAttachments: [],
    reviewHistory: []
  },
  {
    id: 'cmp-5',
    obligationNumber: 'CMP-2026-005',
    title: '[Sample Internal Obligation] Offshore Hot Work Secondary Fire Watch Roster & Gas Test Verification',
    sourceReference: 'Exousia High-Risk Activity Governance HRA-03',
    regulatorOrAuthority: 'Exousia Internal Operations Safety Review',
    applicableSiteIds: ['site-3'],
    ownerId: 'user-officer',
    ownerName: 'Ibrahim Olatunji',
    dueDate: '2026-09-30', // Deadline passed (2 days ago -> overdue horizon)
    complianceState: 'compliant', // Demonstrates: past review passed compliant, even though recertification date is now overdue!
    isInternalStandard: true,
    category: 'Internal Operational Safety Protocol',
    lastReviewedAt: '2026-09-20T11:00:00Z',
    reviewedById: 'user-officer',
    reviewedByName: 'Ibrahim Olatunji',
    reviewNotes: 'Fire watch personnel training records and multigas detector bump calibration sheets verified compliant for Platform Alpha welding campaign.',
    evidenceAttachments: [
      {
        id: 'att-cmp-5',
        name: 'fire_watch_roster_platform_alpha.pdf',
        sizeBytes: 1024 * 340,
        mimeType: 'application/pdf',
        uploadedAt: '2026-09-20T11:00:00Z',
        uploadedBy: 'Ibrahim Olatunji'
      }
    ],
    reviewHistory: [
      {
        id: 'rev-cmp-5-1',
        timestamp: '2026-09-20T11:00:00Z',
        reviewerId: 'user-officer',
        reviewerName: 'Ibrahim Olatunji',
        previousState: 'not_assessed',
        newState: 'compliant',
        notes: 'Fire watch personnel training records and multigas detector bump calibration sheets verified compliant for Platform Alpha welding campaign.'
      }
    ]
  }
];

const DEFAULT_AUDIT: AuditEvent[] = [
  {
    id: 'aud-1',
    timestamp: '2026-09-28T12:10:00Z',
    actorId: 'user-reporter',
    actorName: 'Tari Amadi',
    actorRole: 'reporter',
    entityType: 'report',
    entityId: 'rep-3',
    entityNumber: 'INC-2026-081',
    action: 'REPORT_SUBMITTED',
    summary: 'Submitted incident report: Hydraulic hose guard rupture during hydrostatic test pump cycle'
  },
  {
    id: 'aud-2',
    timestamp: '2026-09-29T09:00:00Z',
    actorId: 'user-manager',
    actorName: 'Josephine Yese',
    actorRole: 'hse_manager',
    entityType: 'report',
    entityId: 'rep-3',
    entityNumber: 'INC-2026-081',
    action: 'CLASSIFICATION_ASSIGNED',
    summary: 'Assigned 5x5 risk rating: Severity 4 × Likelihood 2 = Score 8 (Medium Band)'
  },
  {
    id: 'aud-3',
    timestamp: '2026-09-29T09:15:00Z',
    actorId: 'user-manager',
    actorName: 'Josephine Yese',
    actorRole: 'hse_manager',
    entityType: 'action',
    entityId: 'act-1',
    entityNumber: 'ACT-2026-051',
    action: 'CAPA_ASSIGNED',
    summary: 'Assigned corrective action to Maintenance Workshop Supervisor (Emeka Nwosu)'
  },
  {
    id: 'aud-4',
    timestamp: '2026-10-01T15:05:00Z',
    actorId: 'user-reporter',
    actorName: 'Tari Amadi',
    actorRole: 'reporter',
    entityType: 'report',
    entityId: 'rep-1',
    entityNumber: 'NM-2026-042',
    action: 'NEAR_MISS_SUBMITTED',
    summary: 'Submitted near-miss report: Manual handling near miss during manifold staging'
  },
  {
    id: 'aud-5',
    timestamp: '2026-10-02T08:00:00Z',
    actorId: 'user-supervisor',
    actorName: 'Emeka Nwosu',
    actorRole: 'action_owner',
    entityType: 'action',
    entityId: 'act-2',
    entityNumber: 'ACT-2026-052',
    action: 'EVIDENCE_SUBMITTED',
    summary: 'Submitted closure evidence and stand-down roster for verification'
  }
];

export interface HSEAppState {
  reports: HSEReport[];
  actions: ActionItem[];
  inspections: Inspection[];
  templates: InspectionTemplate[];
  compliance: ComplianceObligation[];
  auditLogs: AuditEvent[];
  users: UserProfile[];
  sites: Site[];
  currentUser: UserProfile;
  activeSiteFilter: string; // 'all' or siteId
  matrixConfig: RiskMatrixConfig;
  matrixHistory?: RiskMatrixConfig[];
}

class HSEDataService {
  private state: HSEAppState;
  private listeners: Set<(state: HSEAppState) => void> = new Set();

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): HSEAppState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.reports && parsed.actions && parsed.inspections) {
          if (!parsed.matrixConfig) {
            parsed.matrixConfig = DEFAULT_MATRIX_CONFIG;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load HSE state from storage, falling back to defaults', e);
    }

    return {
      reports: DEFAULT_REPORTS,
      actions: DEFAULT_ACTIONS,
      inspections: DEFAULT_INSPECTIONS,
      templates: DEFAULT_INSPECTION_TEMPLATES,
      compliance: DEFAULT_COMPLIANCE,
      auditLogs: DEFAULT_AUDIT,
      users: INITIAL_USERS,
      sites: INITIAL_SITES,
      currentUser: INITIAL_USERS[0], // Default to Josephine Yese (HSE General Manager)
      activeSiteFilter: 'all',
      matrixConfig: DEFAULT_MATRIX_CONFIG
    };
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist HSE state', e);
    }
    this.notify();
  }

  private notify() {
    const snapshot = this.getState();
    this.listeners.forEach(fn => fn(snapshot));
  }

  public subscribe(listener: (state: HSEAppState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public getState(): HSEAppState {
    return { ...this.state };
  }

  public resetToContractSampleData() {
    this.state = {
      reports: DEFAULT_REPORTS,
      actions: DEFAULT_ACTIONS,
      inspections: DEFAULT_INSPECTIONS,
      templates: DEFAULT_INSPECTION_TEMPLATES,
      compliance: DEFAULT_COMPLIANCE,
      auditLogs: DEFAULT_AUDIT,
      users: INITIAL_USERS,
      sites: INITIAL_SITES,
      currentUser: INITIAL_USERS[0],
      activeSiteFilter: 'all',
      matrixConfig: DEFAULT_MATRIX_CONFIG
    };
    this.persist();
  }

  public updateMatrixApproval(
    status: 'pending_client_approval' | 'client_approved',
    notes?: string
  ): { success: boolean; error?: string } {
    const isAuthorized = ['hse_manager', 'admin'].includes(this.state.currentUser.role);
    if (!isAuthorized) {
      return {
        success: false,
        error: 'Safety Governance Restriction: Only an authorized HSE General Manager or Administrator can confirm or update client risk matrix approval.'
      };
    }

    this.state.matrixConfig.approvalStatus = status;
    this.state.matrixConfig.isProvisional = status === 'pending_client_approval';
    if (notes) this.state.matrixConfig.clientApprovalNotes = notes;
    if (status === 'client_approved') {
      this.state.matrixConfig.approvedBy = this.state.currentUser.name;
      this.state.matrixConfig.approvedAt = new Date().toISOString();
    }

    this.logAuditEvent({
      entityType: 'compliance',
      entityId: `matrix-${this.state.matrixConfig.version}`,
      entityNumber: this.state.matrixConfig.version,
      action: 'RISK_MATRIX_GOVERNANCE_UPDATED',
      summary: `Risk matrix governance updated to ${status.toUpperCase()} by ${this.state.currentUser.name}. Notes: ${notes || 'Status confirmed'}`
    });

    this.persist();
    return { success: true };
  }

  public updateMatrixConfig(updates: Partial<RiskMatrixConfig>): { success: boolean; error?: string } {
    const isAuthorized = ['hse_manager', 'admin'].includes(this.state.currentUser.role);
    if (!isAuthorized) {
      return {
        success: false,
        error: 'Safety Governance Restriction: Only an authorized HSE General Manager or Administrator can modify matrix configuration parameters.'
      };
    }

    this.state.matrixConfig = {
      ...this.state.matrixConfig,
      ...updates
    };

    this.logAuditEvent({
      entityType: 'compliance',
      entityId: `matrix-${this.state.matrixConfig.version}`,
      entityNumber: this.state.matrixConfig.version,
      action: 'RISK_MATRIX_CONFIG_UPDATED',
      summary: `Risk matrix parameters updated for scheme ${this.state.matrixConfig.version} by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true };
  }

  public publishNewMatrixVersion(
    newVersion: string,
    name: string,
    notes?: string
  ): { success: boolean; error?: string } {
    const isAuthorized = ['hse_manager', 'admin'].includes(this.state.currentUser.role);
    if (!isAuthorized) {
      return {
        success: false,
        error: 'Safety Governance Restriction: Only an authorized HSE General Manager or Administrator can publish a new risk matrix version.'
      };
    }

    if (!newVersion || !newVersion.trim()) {
      return { success: false, error: 'A valid matrix version identifier is required (e.g. 5x5-v2.0-provisional).' };
    }

    // Archive current active configuration to history
    if (!this.state.matrixHistory) {
      this.state.matrixHistory = [];
    }
    this.state.matrixHistory.push({ ...this.state.matrixConfig });

    // Switch active matrix to new version requiring client committee approval
    this.state.matrixConfig = {
      ...this.state.matrixConfig,
      version: newVersion.trim(),
      name: name.trim() || `5×5 Risk Matrix Scheme (${newVersion.trim()})`,
      isProvisional: true,
      approvalStatus: 'pending_client_approval',
      clientApprovalNotes: notes || `New revision ${newVersion.trim()} published. Awaiting formal Client Operating Committee sign-off.`,
      approvedBy: undefined,
      approvedAt: undefined
    };

    this.logAuditEvent({
      entityType: 'compliance',
      entityId: `matrix-${newVersion.trim()}`,
      entityNumber: newVersion.trim(),
      action: 'NEW_MATRIX_VERSION_PUBLISHED',
      summary: `Published new matrix version ${newVersion.trim()} (Provisional scheme requiring client sign-off) by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true };
  }

  public addFindingCategory(category: string): { success: boolean; error?: string } {
    const trimmed = category.trim();
    if (!trimmed) {
      return { success: false, error: 'Category name cannot be blank.' };
    }
    if (this.state.matrixConfig.findingCategories.includes(trimmed)) {
      return { success: false, error: 'Finding category already exists.' };
    }

    this.state.matrixConfig.findingCategories.push(trimmed);
    this.logAuditEvent({
      entityType: 'compliance',
      entityId: `cat-${Date.now()}`,
      entityNumber: trimmed,
      action: 'FINDING_CATEGORY_ADDED',
      summary: `Added standard finding category "${trimmed}" by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true };
  }

  public updateFindingCategory(oldCategory: string, newCategory: string): { success: boolean; error?: string } {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      return { success: false, error: 'Category name cannot be blank.' };
    }
    const idx = this.state.matrixConfig.findingCategories.indexOf(oldCategory);
    if (idx === -1) {
      return { success: false, error: 'Finding category not found.' };
    }
    if (trimmed !== oldCategory && this.state.matrixConfig.findingCategories.includes(trimmed)) {
      return { success: false, error: 'A finding category with this name already exists.' };
    }

    this.state.matrixConfig.findingCategories[idx] = trimmed;

    // Propagate to reports
    this.state.reports.forEach(r => {
      if (r.classification?.category === oldCategory) {
        r.classification.category = trimmed;
      }
    });

    // Propagate to actions
    this.state.actions.forEach(a => {
      if (a.findingCategory === oldCategory) {
        a.findingCategory = trimmed;
      }
    });

    // Propagate to inspections
    this.state.inspections.forEach(ins => {
      ins.items.forEach(it => {
        if (it.findingCategory === oldCategory) {
          it.findingCategory = trimmed;
        }
      });
    });

    this.logAuditEvent({
      entityType: 'compliance',
      entityId: `cat-${Date.now()}`,
      entityNumber: trimmed,
      action: 'FINDING_CATEGORY_UPDATED',
      summary: `Renamed finding category from "${oldCategory}" to "${trimmed}" by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true };
  }

  public removeFindingCategory(category: string): { success: boolean; error?: string } {
    const idx = this.state.matrixConfig.findingCategories.indexOf(category);
    if (idx === -1) {
      return { success: false, error: 'Finding category not found.' };
    }
    if (this.state.matrixConfig.findingCategories.length <= 1) {
      return { success: false, error: 'At least one finding category must remain active.' };
    }

    this.state.matrixConfig.findingCategories.splice(idx, 1);
    this.logAuditEvent({
      entityType: 'compliance',
      entityId: `cat-${Date.now()}`,
      entityNumber: category,
      action: 'FINDING_CATEGORY_REMOVED',
      summary: `Removed finding category "${category}" by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true };
  }

  public demonstrateClassification(): {
    success: boolean;
    incidentId: string;
    hazardId: string;
    inspectionId: string;
    summary: string;
  } {
    // 1. Ensure Incident demonstration record has verified S:4 x L:3 = 12 (High Risk)
    let incident = this.state.reports.find(r => r.type === 'incident' && r.id === 'rep-3');
    if (incident) {
      const calc = calculateRisk(4, 3, this.state.matrixConfig);
      incident.classification = {
        severity: 4,
        likelihood: 3,
        score: calc.score,
        band: calc.band,
        category: 'Mechanical Integrity & Pressure Systems',
        rationale: 'Hydrostatic test manifold burst shield failure at 5,000 psi; potential severe blunt force impact if personnel within arc of trajectory.',
        matrixVersion: this.state.matrixConfig.version,
        classifiedBy: 'Josephine Yese (Authorized HSE Manager)',
        classifiedAt: new Date().toISOString(),
        isProvisional: this.state.matrixConfig.isProvisional,
        clientApprovalStatus: this.state.matrixConfig.approvalStatus
      };
      incident.status = 'under_investigation';
    }

    // 2. Ensure Hazard demonstration record has verified S:3 x L:2 = 6 (Medium Risk)
    let hazard = this.state.reports.find(r => r.type === 'hazard' && r.id === 'rep-2');
    if (hazard) {
      const calc = calculateRisk(3, 2, this.state.matrixConfig);
      hazard.classification = {
        severity: 3,
        likelihood: 2,
        score: calc.score,
        band: calc.band,
        category: 'Housekeeping & Accessways',
        rationale: 'Heavy steel pipe bundles obstructing primary fire escape path and eye-wash access corridor; delay in emergency egress.',
        matrixVersion: this.state.matrixConfig.version,
        classifiedBy: 'Ibrahim Olatunji (Authorized HSE Officer)',
        classifiedAt: new Date().toISOString(),
        isProvisional: this.state.matrixConfig.isProvisional,
        clientApprovalStatus: this.state.matrixConfig.approvalStatus
      };
    }

    // 3. Ensure Inspection Checkpoint Finding has verified S:4 x L:4 = 16 (High Risk)
    let inspection = this.state.inspections.find(i => i.id === 'ins-1' || i.id === 'ins-0');
    if (inspection && inspection.items.length >= 4) {
      const targetItem = inspection.items[3]; // Item 4: Machinery & Electrical
      const calc = calculateRisk(4, 4, this.state.matrixConfig);
      targetItem.result = 'fail';
      targetItem.findingNote = 'Hydro test pump secondary burst shield safety latch missing lock pin; clamp loose under vibration.';
      targetItem.findingCategory = 'Mechanical Integrity & Pressure Systems';
      targetItem.findingClassification = {
        severity: 4,
        likelihood: 4,
        score: calc.score,
        band: calc.band,
        rationale: 'High probability of shield detachment during cyclic pulsation tests; risk of major localized blast energy release.',
        matrixVersion: this.state.matrixConfig.version,
        classifiedBy: 'Ibrahim Olatunji (Lead Inspector)',
        classifiedAt: new Date().toISOString(),
        isProvisional: this.state.matrixConfig.isProvisional,
        clientApprovalStatus: this.state.matrixConfig.approvalStatus
      };
      targetItem.evidenceName = 'burst_shield_loose_clamp_photo.jpg';
      inspection.findingsCount = inspection.items.filter(it => it.result === 'fail').length;
      if (inspection.status === 'scheduled') {
        inspection.status = 'in_progress';
      }
    }

    this.logAuditEvent({
      entityType: 'compliance',
      entityId: `demo-class-${Date.now()}`,
      entityNumber: this.state.matrixConfig.version,
      action: 'CLASSIFICATION_DEMONSTRATION_EXECUTED',
      summary: `Executed verified 5×5 risk classification demonstration across incident, hazard, and inspection finding by ${this.state.currentUser.name}`
    });

    this.persist();

    return {
      success: true,
      incidentId: incident ? incident.id : 'rep-3',
      hazardId: hazard ? hazard.id : 'rep-2',
      inspectionId: inspection ? inspection.id : 'ins-1',
      summary: `Verified 5×5 score calculations demonstrated: Incident (S4×L3 = 12, HIGH), Hazard (S3×L2 = 6, MEDIUM), Inspection Finding (S4×L4 = 16, HIGH).`
    };
  }

  public setCurrentUser(userId: string) {
    const user = this.state.users.find(u => u.id === userId);
    if (user) {
      this.state.currentUser = user;
      this.persist();
    }
  }

  public setActiveSiteFilter(siteId: string) {
    this.state.activeSiteFilter = siteId;
    this.persist();
  }

  // --- REPORTING (Incidents, Near Misses, Hazards) ---

  public createReport(data: {
    type: 'incident' | 'near_miss' | 'hazard';
    title: string;
    description: string;
    siteId: string;
    specificLocation: string;
    occurredAt: string;
    immediateActionTaken?: string;
    severityEstimate?: number;
    attachments?: { name: string; sizeBytes?: number; mimeType?: string }[];
  }): HSEReport {
    const site = this.state.sites.find(s => s.id === data.siteId) || this.state.sites[0];
    const prefix = data.type === 'incident' ? 'INC' : data.type === 'near_miss' ? 'NM' : 'HZ';
    const num = Math.floor(100 + Math.random() * 900);
    const reportNumber = `${prefix}-2026-${num}`;
    const id = `rep-${Date.now()}`;

    const formattedAttachments: Attachment[] = (data.attachments || []).map((att, idx) => ({
      id: `att-${Date.now()}-${idx}`,
      name: att.name,
      sizeBytes: att.sizeBytes || 1024 * 340,
      mimeType: att.mimeType || (att.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      uploadedAt: new Date().toISOString(),
      uploadedBy: this.state.currentUser.name
    }));

    const newReport: HSEReport = {
      id,
      reportNumber,
      type: data.type,
      title: data.title,
      description: data.description,
      siteId: site.id,
      siteName: site.name,
      specificLocation: data.specificLocation,
      occurredAt: data.occurredAt || new Date().toISOString(),
      reportedAt: new Date().toISOString(),
      reporterId: this.state.currentUser.id,
      reporterName: this.state.currentUser.name,
      immediateActionTaken: data.immediateActionTaken,
      status: 'submitted',
      linkedActionIds: [],
      attachments: formattedAttachments,
      corrections: []
    };

    if (data.severityEstimate) {
      const { score, band } = calculateRisk(data.severityEstimate, 2, this.state.matrixConfig);
      newReport.classification = {
        severity: data.severityEstimate,
        likelihood: 2,
        score,
        band,
        rationale: 'Initial field risk indicator provided by reporter (Subject to authorized human HSE review).',
        matrixVersion: this.state.matrixConfig.version,
        classifiedBy: `${this.state.currentUser.name} (Field Estimate)`,
        classifiedAt: new Date().toISOString(),
        isProvisional: true,
        clientApprovalStatus: this.state.matrixConfig.approvalStatus
      };
    }

    this.state.reports = [newReport, ...this.state.reports];

    this.logAuditEvent({
      entityType: 'report',
      entityId: id,
      entityNumber: reportNumber,
      action: `${data.type.toUpperCase()}_REPORTED`,
      summary: `Logged new ${data.type.replace('_', ' ')} report: ${data.title}`
    });

    this.persist();
    return newReport;
  }

  public recordCorrection(
    reportId: string,
    correction: {
      field: string;
      originalValue: string;
      correctedValue: string;
      reason: string;
    }
  ) {
    const report = this.state.reports.find(r => r.id === reportId);
    if (!report) return;

    const record: ReportCorrection = {
      id: `cor-${Date.now()}`,
      timestamp: new Date().toISOString(),
      authorName: this.state.currentUser.name,
      authorRole: this.state.currentUser.roleTitle,
      field: correction.field,
      originalValue: correction.originalValue,
      correctedValue: correction.correctedValue,
      reason: correction.reason
    };

    if (!report.corrections) report.corrections = [];
    report.corrections.push(record);

    if (correction.field === 'title') report.title = correction.correctedValue;
    if (correction.field === 'specificLocation') report.specificLocation = correction.correctedValue;
    if (correction.field === 'description') report.description = correction.correctedValue;
    if (correction.field === 'immediateActionTaken') report.immediateActionTaken = correction.correctedValue;

    this.logAuditEvent({
      entityType: 'report',
      entityId: report.id,
      entityNumber: report.reportNumber,
      action: 'CORRECTION_LOGGED',
      summary: `Technical correction on ${correction.field}: "${correction.originalValue}" -> "${correction.correctedValue}". Reason: ${correction.reason}`
    });

    this.persist();
  }

  public updateReportClassification(
    reportId: string,
    severity: number,
    likelihood: number,
    rationale: string,
    category?: string
  ): { success: boolean; error?: string } {
    const report = this.state.reports.find(r => r.id === reportId);
    if (!report) return { success: false, error: 'Report not found' };

    // Human HSE Reviewer Governance Rule:
    // "Authorized HSE reviewers assign or confirm classifications. Do not use AI to make final safety decisions."
    const isAuthorized = ['hse_officer', 'hse_manager', 'admin'].includes(this.state.currentUser.role);
    if (!isAuthorized) {
      return {
        success: false,
        error: 'Safety Governance Restriction: Only an authorized human HSE Officer or Manager can confirm or update technical risk classification.'
      };
    }

    const { score, band, readableIdentifier } = calculateRisk(severity, likelihood, this.state.matrixConfig);
    report.classification = {
      severity,
      likelihood,
      score,
      band,
      category: category || report.classification?.category,
      rationale,
      matrixVersion: this.state.matrixConfig.version,
      classifiedBy: this.state.currentUser.name,
      classifiedAt: new Date().toISOString(),
      isProvisional: this.state.matrixConfig.isProvisional,
      clientApprovalStatus: this.state.matrixConfig.approvalStatus
    };
    report.status = report.status === 'submitted' ? 'under_review' : report.status;
    report.reviewerId = this.state.currentUser.id;
    report.reviewerName = this.state.currentUser.name;

    this.logAuditEvent({
      entityType: 'report',
      entityId: report.id,
      entityNumber: report.reportNumber,
      action: 'RISK_CLASSIFIED',
      summary: `Assigned risk score ${score} (${readableIdentifier}) using matrix ${this.state.matrixConfig.version} by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true };
  }

  public updateInvestigation(reportId: string, findings: string[], rootCause: string) {
    const report = this.state.reports.find(r => r.id === reportId);
    if (!report) return;

    report.investigationFindings = findings;
    report.rootCauseAnalysis = rootCause;
    report.status = 'under_investigation';

    this.logAuditEvent({
      entityType: 'report',
      entityId: report.id,
      entityNumber: report.reportNumber,
      action: 'INVESTIGATION_UPDATED',
      summary: `Investigation findings recorded with ${findings.length} causal items`
    });

    this.persist();
  }

  public closeReport(reportId: string, notes?: string) {
    const report = this.state.reports.find(r => r.id === reportId);
    if (!report) return;

    report.status = 'closed';
    report.closedAt = new Date().toISOString();
    report.closedBy = this.state.currentUser.name;
    if (notes) {
      report.reviewerNotes = (report.reviewerNotes ? report.reviewerNotes + '\n' : '') + notes;
    }

    this.logAuditEvent({
      entityType: 'report',
      entityId: report.id,
      entityNumber: report.reportNumber,
      action: 'REPORT_CLOSED',
      summary: `Closed report ${report.reportNumber} by ${this.state.currentUser.name}`
    });

    this.persist();
  }

  // --- ACTIONS (CAPA) ---

  public createAction(data: {
    title: string;
    description: string;
    actionType: 'corrective' | 'preventive';
    sourceType: ActionItem['sourceType'];
    sourceId: string;
    sourceNumber: string;
    siteId: string;
    ownerId: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    findingCategory?: string;
    checklistItemId?: string;
  }): ActionItem {
    const owner = this.state.users.find(u => u.id === data.ownerId) || this.state.users[0];
    const site = this.state.sites.find(s => s.id === data.siteId) || this.state.sites[0];
    const num = Math.floor(100 + Math.random() * 900);
    const actionNumber = `ACT-2026-${num}`;
    const id = `act-${Date.now()}`;

    const newAction: ActionItem = {
      id,
      actionNumber,
      title: data.title,
      description: data.description,
      actionType: data.actionType,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      sourceNumber: data.sourceNumber,
      findingCategory: data.findingCategory,
      checklistItemId: data.checklistItemId,
      siteId: site.id,
      siteName: site.name,
      ownerId: owner.id,
      ownerName: owner.name,
      assignedById: this.state.currentUser.id,
      assignedByName: this.state.currentUser.name,
      dueDate: data.dueDate,
      originalDueDate: data.dueDate,
      status: 'open',
      priority: data.priority,
      evidenceAttachments: [],
      updates: [
        {
          id: `upd-${Date.now()}`,
          authorId: this.state.currentUser.id,
          authorName: this.state.currentUser.name,
          timestamp: new Date().toISOString(),
          note: `Action created and assigned to ${owner.name} (Due: ${data.dueDate}). Source: ${data.sourceNumber}`
        }
      ],
      createdAt: new Date().toISOString()
    };

    this.state.actions = [newAction, ...this.state.actions];

    // Link action to source if report exists
    const report = this.state.reports.find(r => r.id === data.sourceId);
    if (report && !report.linkedActionIds.includes(id)) {
      report.linkedActionIds.push(id);
      if (report.status === 'under_review' || report.status === 'submitted') {
        report.status = 'actions_in_progress';
      }
    }

    // Link action to inspection if source is inspection
    const inspection = this.state.inspections.find(i => i.id === data.sourceId);
    if (inspection && !inspection.linkedActionIds.includes(id)) {
      inspection.linkedActionIds.push(id);
      if (data.checklistItemId) {
        const item = inspection.items.find(it => it.id === data.checklistItemId);
        if (item) item.linkedActionId = id;
      }
    }

    this.logAuditEvent({
      entityType: 'action',
      entityId: id,
      entityNumber: actionNumber,
      action: 'ACTION_ASSIGNED',
      summary: `Created ${data.actionType} action assigned to ${owner.name} (Due: ${data.dueDate})`
    });

    this.persist();
    return newAction;
  }

  public updateActionProgress(actionId: string, note: string, newStatus?: ActionStatus) {
    const action = this.state.actions.find(a => a.id === actionId);
    if (!action) return;

    const update = {
      id: `upd-${Date.now()}`,
      authorId: this.state.currentUser.id,
      authorName: this.state.currentUser.name,
      timestamp: new Date().toISOString(),
      note,
      statusChange: newStatus
    };

    action.updates.push(update);
    if (newStatus) {
      action.status = newStatus;
    }

    this.logAuditEvent({
      entityType: 'action',
      entityId: action.id,
      entityNumber: action.actionNumber,
      action: 'ACTION_PROGRESS_LOGGED',
      summary: `Progress note added by ${this.state.currentUser.name}`
    });

    this.persist();
  }

  public submitActionEvidence(actionId: string, description: string, evidenceFileName?: string) {
    const action = this.state.actions.find(a => a.id === actionId);
    if (!action) return;

    action.status = 'awaiting_verification';
    action.submittedAt = new Date().toISOString();
    action.evidenceDescription = description;

    if (evidenceFileName) {
      action.evidenceAttachments.push({
        id: `att-${Date.now()}`,
        name: evidenceFileName,
        sizeBytes: 1024 * 512,
        mimeType: evidenceFileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        uploadedAt: new Date().toISOString(),
        uploadedBy: this.state.currentUser.name
      });
    }

    action.updates.push({
      id: `upd-${Date.now()}`,
      authorId: this.state.currentUser.id,
      authorName: this.state.currentUser.name,
      timestamp: new Date().toISOString(),
      note: `Submitted completion evidence for review: "${description}"`,
      statusChange: 'awaiting_verification'
    });

    this.logAuditEvent({
      entityType: 'action',
      entityId: action.id,
      entityNumber: action.actionNumber,
      action: 'EVIDENCE_SUBMITTED',
      summary: `Closure evidence submitted by ${this.state.currentUser.name}`
    });

    this.persist();
  }

  /**
   * Verify and Close Action
   * Enforces Contract/Spec Rule: Owner CANNOT verify their own action!
   */
  public verifyActionClosure(
    actionId: string,
    decision: 'accept' | 'return_for_rework',
    notes: string
  ): { success: boolean; error?: string } {
    const action = this.state.actions.find(a => a.id === actionId);
    if (!action) return { success: false, error: 'Action not found' };

    // Enforce 2-person separation of duty:
    if (action.ownerId === this.state.currentUser.id) {
      return {
        success: false,
        error: 'Separation of Duty Violation: The assigned action owner cannot verify or close their own action. An HSE Officer or HSE Manager must verify evidence.'
      };
    }

    if (decision === 'accept') {
      action.status = 'closed';
      action.verifiedById = this.state.currentUser.id;
      action.verifiedByName = this.state.currentUser.name;
      action.verifiedAt = new Date().toISOString();
      action.verificationNotes = notes;

      action.updates.push({
        id: `upd-${Date.now()}`,
        authorId: this.state.currentUser.id,
        authorName: this.state.currentUser.name,
        timestamp: new Date().toISOString(),
        note: `Evidence verified and action officially CLOSED. Verification note: ${notes}`,
        statusChange: 'closed'
      });

      this.logAuditEvent({
        entityType: 'action',
        entityId: action.id,
        entityNumber: action.actionNumber,
        action: 'ACTION_VERIFIED_CLOSED',
        summary: `Action closure verified and approved by ${this.state.currentUser.name}`
      });
    } else {
      action.status = 'returned_for_rework';
      action.updates.push({
        id: `upd-${Date.now()}`,
        authorId: this.state.currentUser.id,
        authorName: this.state.currentUser.name,
        timestamp: new Date().toISOString(),
        note: `Evidence returned for rework. Reviewer feedback: ${notes}`,
        statusChange: 'returned_for_rework'
      });

      this.logAuditEvent({
        entityType: 'action',
        entityId: action.id,
        entityNumber: action.actionNumber,
        action: 'ACTION_RETURNED_FOR_REWORK',
        summary: `Closure evidence rejected by ${this.state.currentUser.name}. Returned for rework.`
      });
    }

    this.persist();
    return { success: true };
  }

  public reopenAction(actionId: string, reason: string): { success: boolean; error?: string } {
    const action = this.state.actions.find(a => a.id === actionId);
    if (!action) return { success: false, error: 'Action not found' };

    const isAuthorized = ['hse_officer', 'hse_manager', 'admin'].includes(this.state.currentUser.role);
    if (!isAuthorized) {
      return {
        success: false,
        error: 'Safety Governance Restriction: Only an authorized HSE Officer or Manager can reopen a closed corrective action.'
      };
    }

    if (action.status !== 'closed') {
      return { success: false, error: 'Only formally closed actions can be reopened.' };
    }

    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      return { success: false, error: 'Mandatory Governance Rule: A detailed reason is required to reopen an action.' };
    }

    const prevClosedAt = action.verifiedAt || new Date().toISOString();

    if (!action.reopenHistory) action.reopenHistory = [];
    action.reopenHistory.push({
      id: `reo-${Date.now()}`,
      timestamp: new Date().toISOString(),
      previousClosedAt: prevClosedAt,
      reason: trimmedReason,
      actorId: this.state.currentUser.id,
      actorName: this.state.currentUser.name
    });

    action.status = 'in_progress';
    action.verifiedAt = undefined;
    action.verifiedById = undefined;
    action.verifiedByName = undefined;
    action.verificationNotes = undefined;

    action.updates.push({
      id: `upd-${Date.now()}`,
      authorId: this.state.currentUser.id,
      authorName: this.state.currentUser.name,
      timestamp: new Date().toISOString(),
      note: `Action REOPENED by ${this.state.currentUser.name}. Justification: ${trimmedReason}`,
      statusChange: 'in_progress'
    });

    this.logAuditEvent({
      entityType: 'action',
      entityId: action.id,
      entityNumber: action.actionNumber,
      action: 'ACTION_REOPENED',
      summary: `Action ${action.actionNumber} reopened by ${this.state.currentUser.name}. Reason: ${trimmedReason}`
    });

    this.persist();
    return { success: true };
  }

  public extendActionDueDate(actionId: string, newDueDate: string, reason: string): { success: boolean; error?: string } {
    const action = this.state.actions.find(a => a.id === actionId);
    if (!action) return { success: false, error: 'Action not found' };

    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      return { success: false, error: 'Mandatory Rule: A justification reason is required for due date extension.' };
    }
    if (!newDueDate) {
      return { success: false, error: 'A valid new due date is required.' };
    }

    if (!action.dueDateHistory) action.dueDateHistory = [];
    action.dueDateHistory.push({
      id: `ext-${Date.now()}`,
      timestamp: new Date().toISOString(),
      previousDueDate: action.dueDate,
      newDueDate,
      reason: trimmedReason,
      actorId: this.state.currentUser.id,
      actorName: this.state.currentUser.name
    });

    const prevDate = action.dueDate;
    action.dueDate = newDueDate;
    action.extensionReason = trimmedReason;

    action.updates.push({
      id: `upd-${Date.now()}`,
      authorId: this.state.currentUser.id,
      authorName: this.state.currentUser.name,
      timestamp: new Date().toISOString(),
      note: `Target completion date extended from ${prevDate} to ${newDueDate}. Reason: ${trimmedReason}`
    });

    this.logAuditEvent({
      entityType: 'action',
      entityId: action.id,
      entityNumber: action.actionNumber,
      action: 'ACTION_DUE_DATE_EXTENDED',
      summary: `Extended due date for ${action.actionNumber} from ${prevDate} to ${newDueDate} by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true };
  }

  public reassignAction(actionId: string, newOwnerId: string, reason: string): { success: boolean; error?: string } {
    const action = this.state.actions.find(a => a.id === actionId);
    if (!action) return { success: false, error: 'Action not found' };

    const targetUser = this.state.users.find(u => u.id === newOwnerId);
    if (!targetUser) return { success: false, error: 'Selected target owner does not exist.' };

    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      return { success: false, error: 'Mandatory Rule: A reason must be documented when reassigning action ownership.' };
    }

    if (action.ownerId === targetUser.id) {
      return { success: false, error: 'Action is already assigned to this user.' };
    }

    if (!action.reassignmentHistory) action.reassignmentHistory = [];
    action.reassignmentHistory.push({
      id: `rea-${Date.now()}`,
      timestamp: new Date().toISOString(),
      previousOwnerId: action.ownerId,
      previousOwnerName: action.ownerName,
      newOwnerId: targetUser.id,
      newOwnerName: targetUser.name,
      reason: trimmedReason,
      actorId: this.state.currentUser.id,
      actorName: this.state.currentUser.name
    });

    const prevOwner = action.ownerName;
    action.ownerId = targetUser.id;
    action.ownerName = targetUser.name;

    action.updates.push({
      id: `upd-${Date.now()}`,
      authorId: this.state.currentUser.id,
      authorName: this.state.currentUser.name,
      timestamp: new Date().toISOString(),
      note: `Action reassigned from ${prevOwner} to ${targetUser.name}. Reason: ${trimmedReason}`
    });

    this.logAuditEvent({
      entityType: 'action',
      entityId: action.id,
      entityNumber: action.actionNumber,
      action: 'ACTION_REASSIGNED',
      summary: `Reassigned ${action.actionNumber} from ${prevOwner} to ${targetUser.name} by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true };
  }

  public demonstrateActionLifecycle(): {
    success: boolean;
    actionId: string;
    summary: string;
  } {
    const demoActionId = 'act-demo';
    let action = this.state.actions.find(a => a.id === demoActionId);

    const fullDemoAction: ActionItem = {
      id: demoActionId,
      actionNumber: 'ACT-2026-DEMO',
      title: 'Procure and install rated ballistic shield with hydro test certificate',
      description: 'Fabricate and mount 10,000 psi ballistic wrap on Hydro Cell #1 manifold; verify ASME B31.3 proof test tag.',
      actionType: 'corrective',
      sourceType: 'incident',
      sourceId: 'rep-3',
      sourceNumber: 'INC-2026-081',
      siteId: 'site-4',
      siteName: 'Maintenance Fabrication Workshop',
      ownerId: 'user-supervisor',
      ownerName: 'Emeka Nwosu',
      assignedById: 'user-manager',
      assignedByName: 'Josephine Yese',
      dueDate: '2026-10-15',
      originalDueDate: '2026-10-10',
      extensionReason: 'Supply chain lead-time for OEM certified ballistic nylon shroud wrap.',
      dueDateHistory: [
        {
          id: 'ext-demo-1',
          timestamp: '2026-10-01T10:00:00Z',
          previousDueDate: '2026-10-10',
          newDueDate: '2026-10-15',
          reason: 'Supply chain lead-time for OEM certified ballistic nylon shroud wrap.',
          actorId: 'user-manager',
          actorName: 'Josephine Yese'
        }
      ],
      reassignmentHistory: [
        {
          id: 'rea-demo-1',
          timestamp: '2026-09-29T14:00:00Z',
          previousOwnerId: 'user-officer',
          previousOwnerName: 'Ibrahim Olatunji',
          newOwnerId: 'user-supervisor',
          newOwnerName: 'Emeka Nwosu',
          reason: 'Mechanical fabrication work package transferred to Workshop Supervisor.',
          actorId: 'user-manager',
          actorName: 'Josephine Yese'
        }
      ],
      reopenHistory: [],
      status: 'closed',
      priority: 'high',
      evidenceDescription: 'Installed certified 10,000 psi ballistic nylon shield. Affixed stainless OEM verification tag #BP-9982. Witnessed hydrostatic proof cycle at 7,500 psi.',
      evidenceAttachments: [
        {
          id: 'att-demo-1',
          name: 'ballistic_shield_installed_tag.jpg',
          sizeBytes: 1024 * 420,
          mimeType: 'image/jpeg',
          uploadedAt: '2026-10-02T14:00:00Z',
          uploadedBy: 'Emeka Nwosu'
        },
        {
          id: 'att-demo-2',
          name: 'asme_hydro_proof_cert_BP9982.pdf',
          sizeBytes: 1024 * 680,
          mimeType: 'application/pdf',
          uploadedAt: '2026-10-02T14:05:00Z',
          uploadedBy: 'Emeka Nwosu'
        }
      ],
      submittedAt: '2026-10-02T14:10:00Z',
      verifiedById: 'user-manager',
      verifiedByName: 'Josephine Yese',
      verifiedAt: '2026-10-02T16:30:00Z',
      verificationNotes: 'Physical inspection performed in Hydro Bunker #1. Proof test certificate #BP-9982 cross-referenced against vendor log. Shield properly clamped and verified. Action signed off and officially CLOSED.',
      updates: [
        {
          id: 'upd-demo-1',
          authorId: 'user-manager',
          authorName: 'Josephine Yese',
          timestamp: '2026-09-29T09:30:00Z',
          note: 'Assigned high-priority corrective action following incident INC-2026-081 review.'
        },
        {
          id: 'upd-demo-2',
          authorId: 'user-supervisor',
          authorName: 'Emeka Nwosu',
          timestamp: '2026-09-30T11:00:00Z',
          note: 'Completed physical measurements. Raised purchase requisition PR-2026-441 with OEM safety shroud vendor.',
          statusChange: 'in_progress'
        },
        {
          id: 'upd-demo-3',
          authorId: 'user-supervisor',
          authorName: 'Emeka Nwosu',
          timestamp: '2026-10-01T16:00:00Z',
          note: 'Initial installation completed. Shroud fitted over manifold.',
          statusChange: 'awaiting_verification'
        },
        {
          id: 'upd-demo-4',
          authorId: 'user-officer',
          authorName: 'Ibrahim Olatunji',
          timestamp: '2026-10-02T09:00:00Z',
          note: 'REJECTED FOR REWORK: Physical shroud is mounted, but vendor hydrostatic certificate #BP-9982 was missing from submission. Calibration tag must be riveted and test certificate uploaded before closure approval.',
          statusChange: 'returned_for_rework'
        },
        {
          id: 'upd-demo-5',
          authorId: 'user-supervisor',
          authorName: 'Emeka Nwosu',
          timestamp: '2026-10-02T14:10:00Z',
          note: 'Affixed stainless steel tag and attached vendor certificate sheet asme_hydro_proof_cert_BP9982.pdf. Resubmitted for formal sign-off.',
          statusChange: 'awaiting_verification'
        },
        {
          id: 'upd-demo-6',
          authorId: 'user-manager',
          authorName: 'Josephine Yese',
          timestamp: '2026-10-02T16:30:00Z',
          note: 'Independent verification performed. Certificates audited against ASME B31.3 standards. Physical tag inspected. Closure APPROVED.',
          statusChange: 'closed'
        }
      ],
      createdAt: '2026-09-29T09:30:00Z'
    };

    if (action) {
      const idx = this.state.actions.findIndex(a => a.id === demoActionId);
      this.state.actions[idx] = fullDemoAction;
    } else {
      this.state.actions = [fullDemoAction, ...this.state.actions];
    }

    this.logAuditEvent({
      entityType: 'action',
      entityId: demoActionId,
      entityNumber: 'ACT-2026-DEMO',
      action: 'ACTION_LIFECYCLE_DEMONSTRATED',
      summary: `Executed complete CAPA lifecycle demonstration (Assignment -> Progress -> Evidence -> Rejection -> Resubmission -> Verified Closure) by ${this.state.currentUser.name}`
    });

    this.persist();

    return {
      success: true,
      actionId: demoActionId,
      summary: 'Demonstrated complete 6-stage CAPA lifecycle: Assignment, Field Progress, Evidence Submission, Rejection (Return for Rework), Evidence Resubmission, and Verified Independent Closure.'
    };
  }

  // --- INSPECTIONS ---

  public scheduleInspection(data: {
    templateId: string;
    siteId: string;
    inspectorId: string;
    scheduledDate: string;
    title?: string;
  }): Inspection {
    const template = this.state.templates.find(t => t.id === data.templateId) || this.state.templates[0];
    const site = this.state.sites.find(s => s.id === data.siteId) || this.state.sites[0];
    const inspector = this.state.users.find(u => u.id === data.inspectorId) || this.state.users[1];
    const num = Math.floor(100 + Math.random() * 900);
    const inspectionNumber = `INS-2026-${num}`;
    const id = `ins-${Date.now()}`;

    const newInspection: Inspection = {
      id,
      inspectionNumber,
      title: data.title || `${template.title} - ${site.name}`,
      templateId: template.id,
      templateVersion: template.version,
      siteId: site.id,
      siteName: site.name,
      scheduledDate: data.scheduledDate,
      inspectorId: inspector.id,
      inspectorName: inspector.name,
      status: 'scheduled',
      items: template.items.map(item => ({
        ...item,
        result: undefined,
        findingNote: undefined
      })),
      findingsCount: 0,
      linkedActionIds: []
    };

    this.state.inspections = [newInspection, ...this.state.inspections];

    this.logAuditEvent({
      entityType: 'inspection',
      entityId: id,
      entityNumber: inspectionNumber,
      action: 'INSPECTION_SCHEDULED',
      summary: `Inspection scheduled for ${data.scheduledDate} assigned to ${inspector.name}`
    });

    this.persist();
    return newInspection;
  }

  public updateChecklistItem(
    inspectionId: string,
    itemId: string,
    result: ChecklistItemResult,
    details?: {
      findingNote?: string;
      findingCategory?: string;
      findingClassification?: RiskClassification;
      evidenceName?: string;
    }
  ) {
    const inspection = this.state.inspections.find(i => i.id === inspectionId);
    if (!inspection) return;

    const item = inspection.items.find(it => it.id === itemId);
    if (!item) return;

    item.result = result;
    if (details) {
      if (details.findingNote !== undefined) item.findingNote = details.findingNote;
      if (details.findingCategory !== undefined) item.findingCategory = details.findingCategory;
      if (details.findingClassification !== undefined) item.findingClassification = details.findingClassification;
      if (details.evidenceName !== undefined) item.evidenceName = details.evidenceName;
    }

    if (inspection.status === 'scheduled') {
      inspection.status = 'in_progress';
      inspection.startedAt = new Date().toISOString();
    }

    // Count failed items as findings
    inspection.findingsCount = inspection.items.filter(it => it.result === 'fail').length;

    this.persist();
  }

  public saveInspectionDraft(inspectionId: string, summaryNotes?: string) {
    const inspection = this.state.inspections.find(i => i.id === inspectionId);
    if (!inspection) return;

    if (summaryNotes !== undefined) {
      inspection.summaryNotes = summaryNotes;
    }
    if (inspection.status === 'scheduled') {
      inspection.status = 'in_progress';
      inspection.startedAt = new Date().toISOString();
    }

    this.logAuditEvent({
      entityType: 'inspection',
      entityId: inspection.id,
      entityNumber: inspection.inspectionNumber,
      action: 'INSPECTION_DRAFT_SAVED',
      summary: `Draft progress saved for ${inspection.inspectionNumber} by ${this.state.currentUser.name}`
    });

    this.persist();
  }

  public submitInspectionForReview(inspectionId: string, notes?: string) {
    const inspection = this.state.inspections.find(i => i.id === inspectionId);
    if (!inspection) return;

    inspection.status = 'submitted';
    inspection.submittedAt = new Date().toISOString();
    if (notes) {
      inspection.summaryNotes = notes;
    }

    this.logAuditEvent({
      entityType: 'inspection',
      entityId: inspection.id,
      entityNumber: inspection.inspectionNumber,
      action: 'INSPECTION_SUBMITTED_FOR_REVIEW',
      summary: `Inspection submitted for supervisor sign-off by ${this.state.currentUser.name} (${inspection.findingsCount} findings documented)`
    });

    this.persist();
  }

  public cancelInspection(inspectionId: string, reason: string) {
    const inspection = this.state.inspections.find(i => i.id === inspectionId);
    if (!inspection) return;

    inspection.status = 'cancelled';
    inspection.cancelledAt = new Date().toISOString();
    inspection.cancellationReason = reason;

    this.logAuditEvent({
      entityType: 'inspection',
      entityId: inspection.id,
      entityNumber: inspection.inspectionNumber,
      action: 'INSPECTION_CANCELLED',
      summary: `Inspection ${inspection.inspectionNumber} cancelled. Reason: ${reason}`
    });

    this.persist();
  }

  public completeInspection(inspectionId: string, summaryNotes: string) {
    const inspection = this.state.inspections.find(i => i.id === inspectionId);
    if (!inspection) return;

    inspection.status = 'completed';
    inspection.completedAt = new Date().toISOString();
    inspection.summaryNotes = summaryNotes;

    // RULE: Completing an inspection must NOT automatically close outstanding actions!
    // Linked actions remain in their active status (open, awaiting_verification, etc.)
    // until independently verified and signed off.

    this.logAuditEvent({
      entityType: 'inspection',
      entityId: inspection.id,
      entityNumber: inspection.inspectionNumber,
      action: 'INSPECTION_COMPLETED',
      summary: `Completed inspection ${inspection.inspectionNumber} with ${inspection.findingsCount} findings. Outstanding corrective actions remain active.`
    });

    this.persist();
  }

  public createActionFromFinding(data: {
    inspectionId: string;
    checklistItemId: string;
    title: string;
    description: string;
    actionType: 'corrective' | 'preventive';
    ownerId: string;
    dueDate: string;
    priority: RiskBand;
    findingCategory?: string;
  }): ActionItem {
    const inspection = this.state.inspections.find(i => i.id === data.inspectionId);
    if (!inspection) throw new Error('Inspection not found');

    const item = inspection.items.find(it => it.id === data.checklistItemId);

    const action = this.createAction({
      title: data.title,
      description: data.description,
      actionType: data.actionType,
      sourceType: 'inspection',
      sourceId: inspection.id,
      sourceNumber: inspection.inspectionNumber,
      siteId: inspection.siteId,
      ownerId: data.ownerId,
      dueDate: data.dueDate,
      priority: data.priority
    });

    action.checklistItemId = data.checklistItemId;
    action.findingCategory = data.findingCategory;

    // Link back to checklist item and inspection
    if (item) {
      item.linkedActionId = action.id;
    }
    if (!inspection.linkedActionIds.includes(action.id)) {
      inspection.linkedActionIds.push(action.id);
    }

    this.persist();
    return action;
  }

  // --- COMPLIANCE ---

  public createComplianceObligation(data: {
    title: string;
    sourceReference: string;
    regulatorOrAuthority: string;
    applicableSiteIds: string[];
    ownerId: string;
    dueDate: string;
    complianceState: ComplianceState;
    isInternalStandard?: boolean;
    category?: string;
    reviewNotes?: string;
    evidenceFileName?: string;
  }): ComplianceObligation {
    const owner = this.state.users.find(u => u.id === data.ownerId) || this.state.users[0];
    const num = Math.floor(100 + Math.random() * 900);
    const obligationNumber = `CMP-2026-${num}`;
    const id = `cmp-${Date.now()}`;

    const evidenceAttachments: Attachment[] = [];
    if (data.evidenceFileName) {
      evidenceAttachments.push({
        id: `att-cmp-${Date.now()}`,
        name: data.evidenceFileName,
        sizeBytes: 1024 * 450,
        mimeType: data.evidenceFileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        uploadedAt: new Date().toISOString(),
        uploadedBy: this.state.currentUser.name
      });
    }

    const reviewHistory: ComplianceReviewRecord[] = [];
    if (data.complianceState !== 'not_assessed' || data.reviewNotes) {
      reviewHistory.push({
        id: `rev-${Date.now()}`,
        timestamp: new Date().toISOString(),
        reviewerId: this.state.currentUser.id,
        reviewerName: this.state.currentUser.name,
        previousState: 'not_assessed',
        newState: data.complianceState,
        notes: data.reviewNotes || 'Initial baseline compliance registration assessment.',
        evidenceAttachments: evidenceAttachments.length > 0 ? [...evidenceAttachments] : undefined
      });
    }

    const newObligation: ComplianceObligation = {
      id,
      obligationNumber,
      title: data.title,
      sourceReference: data.sourceReference,
      regulatorOrAuthority: data.regulatorOrAuthority,
      applicableSiteIds: data.applicableSiteIds,
      ownerId: owner.id,
      ownerName: owner.name,
      dueDate: data.dueDate,
      complianceState: data.complianceState,
      isInternalStandard: data.isInternalStandard ?? false,
      category: data.category,
      lastReviewedAt: data.complianceState !== 'not_assessed' ? new Date().toISOString() : undefined,
      reviewedById: data.complianceState !== 'not_assessed' ? this.state.currentUser.id : undefined,
      reviewedByName: data.complianceState !== 'not_assessed' ? this.state.currentUser.name : undefined,
      reviewNotes: data.reviewNotes,
      evidenceAttachments,
      reviewHistory
    };

    this.state.compliance = [newObligation, ...this.state.compliance];

    this.logAuditEvent({
      entityType: 'compliance',
      entityId: id,
      entityNumber: obligationNumber,
      action: 'OBLIGATION_CREATED',
      summary: `Registered compliance obligation ${obligationNumber}: "${data.title}" assigned to ${owner.name}`
    });

    this.persist();
    return newObligation;
  }

  public updateComplianceReview(
    obligationId: string,
    complianceState: ComplianceObligation['complianceState'],
    notes: string,
    evidenceFileName?: string
  ): { success: boolean; error?: string } {
    const obligation = this.state.compliance.find(c => c.id === obligationId);
    if (!obligation) return { success: false, error: 'Obligation not found' };

    const previousState = obligation.complianceState;
    obligation.complianceState = complianceState;
    obligation.lastReviewedAt = new Date().toISOString();
    obligation.reviewedById = this.state.currentUser.id;
    obligation.reviewedByName = this.state.currentUser.name;
    obligation.reviewNotes = notes;

    let attachedItem: Attachment | undefined = undefined;
    if (evidenceFileName) {
      attachedItem = {
        id: `att-cmp-${Date.now()}`,
        name: evidenceFileName,
        sizeBytes: 1024 * 512,
        mimeType: evidenceFileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        uploadedAt: new Date().toISOString(),
        uploadedBy: this.state.currentUser.name
      };
      obligation.evidenceAttachments.push(attachedItem);
    }

    if (!obligation.reviewHistory) obligation.reviewHistory = [];
    obligation.reviewHistory.push({
      id: `rev-${Date.now()}`,
      timestamp: new Date().toISOString(),
      reviewerId: this.state.currentUser.id,
      reviewerName: this.state.currentUser.name,
      previousState,
      newState: complianceState,
      notes,
      evidenceAttachments: attachedItem ? [attachedItem] : undefined
    });

    this.logAuditEvent({
      entityType: 'compliance',
      entityId: obligation.id,
      entityNumber: obligation.obligationNumber,
      action: 'COMPLIANCE_REVIEWED',
      summary: `Reviewed obligation ${obligation.obligationNumber}: State changed from ${previousState.toUpperCase()} to ${complianceState.toUpperCase()} by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true };
  }

  public addComplianceEvidence(
    obligationId: string,
    fileName: string,
    sizeBytes: number = 1024 * 400
  ): { success: boolean; error?: string } {
    const obligation = this.state.compliance.find(c => c.id === obligationId);
    if (!obligation) return { success: false, error: 'Obligation not found' };

    const newAtt: Attachment = {
      id: `att-cmp-${Date.now()}`,
      name: fileName,
      sizeBytes,
      mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
      uploadedAt: new Date().toISOString(),
      uploadedBy: this.state.currentUser.name
    };

    obligation.evidenceAttachments.push(newAtt);

    this.logAuditEvent({
      entityType: 'compliance',
      entityId: obligation.id,
      entityNumber: obligation.obligationNumber,
      action: 'COMPLIANCE_EVIDENCE_ATTACHED',
      summary: `Attached audit evidence ${fileName} to obligation ${obligation.obligationNumber} by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true };
  }

  // --- USER ADMINISTRATION ---

  public createUser(userData: {
    name: string;
    email: string;
    role: UserRole;
    roleTitle?: string;
    department: string;
    siteIds: string[];
  }): UserProfile {
    const id = `user-${Date.now()}`;
    const initials = userData.name
      .split(' ')
      .map(p => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const defaultRoleTitles: Record<UserRole, string> = {
      reporter: 'Field Operator / Technician',
      action_owner: 'Operations Supervisor',
      hse_officer: 'HSE Safety Officer',
      hse_manager: 'HSE Manager',
      management_viewer: 'Management Executive',
      admin: 'HSE System Administrator'
    };

    const newUser: UserProfile = {
      id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      roleTitle: userData.roleTitle || defaultRoleTitles[userData.role],
      department: userData.department,
      siteIds: userData.siteIds.length > 0 ? userData.siteIds : this.state.sites.map(s => s.id),
      active: true,
      avatar: initials
    };

    this.state.users.push(newUser);

    this.logAuditEvent({
      entityType: 'user',
      entityId: id,
      entityNumber: userData.email,
      action: 'USER_CREATED',
      summary: `Provisioned user ${userData.name} with role ${userData.role} by ${this.state.currentUser.name}`
    });

    this.persist();
    return newUser;
  }

  public updateUser(
    userId: string,
    updates: Partial<UserProfile>
  ): { success: boolean; error?: string } {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    Object.assign(user, updates);

    this.logAuditEvent({
      entityType: 'user',
      entityId: user.id,
      entityNumber: user.email,
      action: 'USER_UPDATED',
      summary: `Updated account settings for ${user.name} (${user.email}) by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true };
  }

  public toggleUserActive(userId: string): { success: boolean; active?: boolean; error?: string } {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    // Prevent deactivating own account
    if (user.id === this.state.currentUser.id) {
      return { success: false, error: 'Safety Governance Restriction: You cannot deactivate your currently active session account.' };
    }

    user.active = !user.active;

    this.logAuditEvent({
      entityType: 'user',
      entityId: user.id,
      entityNumber: user.email,
      action: user.active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      summary: `Account for ${user.name} set to ${user.active ? 'ACTIVE' : 'DEACTIVATED'} by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true, active: user.active };
  }

  public updateUserSites(userId: string, siteIds: string[]): { success: boolean; error?: string } {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    user.siteIds = siteIds;

    this.logAuditEvent({
      entityType: 'user',
      entityId: user.id,
      entityNumber: user.email,
      action: 'USER_SITES_UPDATED',
      summary: `Updated authorized site assignments (${siteIds.length} sites) for ${user.name} by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true };
  }

  // --- SITES ADMINISTRATION ---

  public createSite(siteData: {
    name: string;
    code: string;
    location: string;
  }): Site {
    const id = `site-${Date.now()}`;
    const newSite: Site = {
      id,
      name: siteData.name,
      code: siteData.code.toUpperCase(),
      location: siteData.location,
      active: true
    };

    this.state.sites.push(newSite);

    this.logAuditEvent({
      entityType: 'setting',
      entityId: id,
      entityNumber: newSite.code,
      action: 'SITE_CREATED',
      summary: `Created operational facility site "${newSite.name}" (${newSite.code}) by ${this.state.currentUser.name}`
    });

    this.persist();
    return newSite;
  }

  public updateSite(siteId: string, updates: Partial<Site>): { success: boolean; error?: string } {
    const site = this.state.sites.find(s => s.id === siteId);
    if (!site) return { success: false, error: 'Site not found' };

    Object.assign(site, updates);

    this.logAuditEvent({
      entityType: 'setting',
      entityId: site.id,
      entityNumber: site.code,
      action: 'SITE_UPDATED',
      summary: `Updated site record "${site.name}" (${site.code}) by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true };
  }

  public toggleSiteActive(siteId: string): { success: boolean; error?: string } {
    const site = this.state.sites.find(s => s.id === siteId);
    if (!site) return { success: false, error: 'Site not found' };

    site.active = !site.active;

    this.logAuditEvent({
      entityType: 'setting',
      entityId: site.id,
      entityNumber: site.code,
      action: site.active ? 'SITE_ACTIVATED' : 'SITE_DEACTIVATED',
      summary: `Site "${site.name}" marked ${site.active ? 'ACTIVE' : 'DEACTIVATED'} by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true };
  }

  // --- INSPECTION TEMPLATES ADMINISTRATION ---

  public createInspectionTemplate(data: {
    title: string;
    version: string;
    category: string;
    items: { id: string; section: string; question: string; guidance?: string }[];
  }): InspectionTemplate {
    const id = `tmpl-${Date.now()}`;
    const newTemplate: InspectionTemplate = {
      id,
      title: data.title,
      version: data.version || '1.0',
      category: data.category,
      items: data.items
    };

    this.state.templates.push(newTemplate);

    this.logAuditEvent({
      entityType: 'setting',
      entityId: id,
      entityNumber: newTemplate.title,
      action: 'INSPECTION_TEMPLATE_CREATED',
      summary: `Published inspection checklist template "${newTemplate.title}" v${newTemplate.version} with ${newTemplate.items.length} items by ${this.state.currentUser.name}`
    });

    this.persist();
    return newTemplate;
  }

  public updateInspectionTemplate(
    templateId: string,
    updates: Partial<InspectionTemplate>
  ): { success: boolean; error?: string } {
    const tmpl = this.state.templates.find(t => t.id === templateId);
    if (!tmpl) return { success: false, error: 'Inspection template not found' };

    Object.assign(tmpl, updates);

    this.logAuditEvent({
      entityType: 'setting',
      entityId: tmpl.id,
      entityNumber: tmpl.title,
      action: 'INSPECTION_TEMPLATE_UPDATED',
      summary: `Updated inspection template "${tmpl.title}" by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true };
  }

  public deleteInspectionTemplate(templateId: string): { success: boolean; error?: string } {
    const idx = this.state.templates.findIndex(t => t.id === templateId);
    if (idx === -1) return { success: false, error: 'Inspection template not found' };

    const title = this.state.templates[idx].title;
    this.state.templates.splice(idx, 1);

    this.logAuditEvent({
      entityType: 'setting',
      entityId: templateId,
      entityNumber: title,
      action: 'INSPECTION_TEMPLATE_DELETED',
      summary: `Deleted inspection template "${title}" by ${this.state.currentUser.name}`
    });

    this.persist();
    return { success: true };
  }

  // --- AUDIT TRAIL HELPER ---

  private logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'actorId' | 'actorName' | 'actorRole'>) {
    const newEvent: AuditEvent = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actorId: this.state.currentUser.id,
      actorName: this.state.currentUser.name,
      actorRole: this.state.currentUser.role,
      ...event
    };

    this.state.auditLogs = [newEvent, ...this.state.auditLogs];
  }

  // --- DERIVED METRICS & SCOPE CHECKS ---

  public getDerivedMetrics() {
    const siteFilter = this.state.activeSiteFilter;
    const filterBySite = <T extends { siteId?: string; applicableSiteIds?: string[] }>(items: T[]) => {
      if (siteFilter === 'all') return items;
      return items.filter(item => {
        if (item.siteId) return item.siteId === siteFilter;
        if (item.applicableSiteIds) return item.applicableSiteIds.includes(siteFilter);
        return true;
      });
    };

    const filteredActions = filterBySite(this.state.actions);
    const filteredReports = filterBySite(this.state.reports);
    const filteredInspections = filterBySite(this.state.inspections);
    const filteredCompliance = filterBySite(this.state.compliance);

    // Open corrective actions: all actions not Closed or Returned
    const openActions = filteredActions.filter(a => a.status !== 'closed');
    const awaitingVerificationActions = filteredActions.filter(a => a.status === 'awaiting_verification');

    // Overdue is derived: dueDate < CURRENT_DATE_STRING and status != closed
    const overdueActions = openActions.filter(a => a.dueDate < CURRENT_DATE_STRING);

    // Inspections scheduled
    const scheduledInspections = filteredInspections.filter(i => i.status === 'scheduled');

    // Reports awaiting review: incidents/near misses/hazards submitted or under review
    const reportsAwaitingReview = filteredReports.filter(r => r.status === 'submitted' || r.status === 'under_review');

    // Compliance outlook
    const complianceDueSoon = filteredCompliance.filter(c => {
      // Due within 30 days
      const days = Math.floor((new Date(c.dueDate).getTime() - new Date(CURRENT_DATE_STRING).getTime()) / (1000 * 3600 * 24));
      return days >= 0 && days <= 30;
    });

    const complianceCurrent = filteredCompliance.filter(c => {
      const days = Math.floor((new Date(c.dueDate).getTime() - new Date(CURRENT_DATE_STRING).getTime()) / (1000 * 3600 * 24));
      return days > 30 && c.complianceState === 'compliant';
    });

    const complianceOverdue = filteredCompliance.filter(c => {
      return c.dueDate < CURRENT_DATE_STRING && c.complianceState !== 'compliant';
    });

    return {
      openActionsCount: openActions.length,
      awaitingVerificationCount: awaitingVerificationActions.length,
      overdueActionsCount: overdueActions.length,
      inspectionsScheduledCount: scheduledInspections.length,
      reportsAwaitingReviewCount: reportsAwaitingReview.length,
      complianceDueSoonCount: complianceDueSoon.length,
      complianceCurrentCount: complianceCurrent.length,
      complianceOverdueCount: complianceOverdue.length,
      totalIncidents: filteredReports.filter(r => r.type === 'incident').length,
      totalNearMisses: filteredReports.filter(r => r.type === 'near_miss').length,
      totalHazards: filteredReports.filter(r => r.type === 'hazard').length,
      totalCompletedInspections: filteredInspections.filter(i => i.status === 'completed').length,
      totalOpenInvestigations: filteredReports.filter(r => r.status === 'under_investigation').length
    };
  }

  // --- CSV EXPORT GENERATOR WITH FORMULA ESCAPING ---

  public exportRegisterCSV(entityType: 'incidents' | 'actions' | 'inspections' | 'compliance'): string {
    const sanitize = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      // Escaping spreadsheet formula injection characters: = + - @ \t \r
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str}"`;
    };

    if (entityType === 'incidents') {
      const headers = ['Report Number', 'Type', 'Title', 'Site', 'Specific Location', 'Occurred Date', 'Status', 'Risk Score', 'Risk Band', 'Reporter', 'Immediate Action'];
      const rows = this.state.reports.map(r => [
        r.reportNumber,
        r.type,
        r.title,
        r.siteName,
        r.specificLocation,
        r.occurredAt,
        r.status,
        r.classification?.score || 'N/A',
        r.classification?.band || 'N/A',
        r.reporterName,
        r.immediateActionTaken || ''
      ]);
      return [headers.map(sanitize).join(','), ...rows.map(r => r.map(sanitize).join(','))].join('\n');
    }

    if (entityType === 'actions') {
      const headers = ['Action Number', 'Title', 'Type', 'Source', 'Site', 'Owner', 'Due Date', 'Status', 'Is Overdue', 'Priority', 'Assigned By'];
      const rows = this.state.actions.map(a => [
        a.actionNumber,
        a.title,
        a.actionType,
        a.sourceNumber,
        a.siteName,
        a.ownerName,
        a.dueDate,
        a.status,
        a.dueDate < CURRENT_DATE_STRING && a.status !== 'closed' ? 'YES' : 'NO',
        a.priority,
        a.assignedByName
      ]);
      return [headers.map(sanitize).join(','), ...rows.map(r => r.map(sanitize).join(','))].join('\n');
    }

    if (entityType === 'inspections') {
      const headers = ['Inspection Number', 'Title', 'Template Version', 'Site', 'Inspector', 'Scheduled Date', 'Status', 'Findings Count', 'Completed Date'];
      const rows = this.state.inspections.map(i => [
        i.inspectionNumber,
        i.title,
        i.templateVersion,
        i.siteName,
        i.inspectorName,
        i.scheduledDate,
        i.status,
        i.findingsCount,
        i.completedAt || 'Pending'
      ]);
      return [headers.map(sanitize).join(','), ...rows.map(r => r.map(sanitize).join(','))].join('\n');
    }

    const headers = ['Obligation Number', 'Title', 'Source Reference', 'Regulator', 'Owner', 'Due Date', 'Compliance State', 'Last Reviewed'];
    const rows = this.state.compliance.map(c => [
      c.obligationNumber,
      c.title,
      c.sourceReference,
      c.regulatorOrAuthority,
      c.ownerName,
      c.dueDate,
      c.complianceState,
      c.lastReviewedAt || 'Never'
    ]);
    return [headers.map(sanitize).join(','), ...rows.map(r => r.map(sanitize).join(','))].join('\n');
  }
}

export const hseDataService = new HSEDataService();
