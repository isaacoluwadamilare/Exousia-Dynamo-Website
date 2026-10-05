/**
 * Explicit separation between Confirmed Contract Requirements
 * (from CONTRACT_AWARD_FOR_THE_DEVELOPMENT_AND_IMPLEMENTATION_OF_AN_INTE(2).pdf)
 * and Proposed Workflow Decisions (from Exousia_HSE_Build_Specification.md).
 */

export interface ContractScopeItem {
  id: string;
  category: 'confirmed_contract' | 'proposed_decision';
  title: string;
  source: string;
  description: string;
  statusInApp: 'Implemented' | 'Configurable' | 'Pending Client Sign-off';
  notes: string;
}

export const CONTRACT_CLIENT = '[COMPANY 2]';
export const CONTRACT_CLIENT_DISPLAY = '[COMPANY 2] (Operating Client - Unspecified in Award Letter)';
export const DELIVERY_CONTRACTOR = 'Exousia Dynamo Energy Ltd';
export const CONTRACT_DURATION = '5 Months from agreed commencement';
export const CONTRACT_DATE = 'July 30, 2026 (Award Letter Date)';

export const CONTRACT_SCOPE_ITEMS: ContractScopeItem[] = [
  {
    id: 'req-1',
    category: 'confirmed_contract',
    title: 'HSE Incident Reporting and Management',
    source: 'Award Letter Section 1.1',
    description: 'Systematic recording, review, classification, and investigation of HSE incidents with root cause analysis.',
    statusInApp: 'Implemented',
    notes: 'Includes dedicated incident register, investigation workflow, and linked corrective actions.'
  },
  {
    id: 'req-2',
    category: 'confirmed_contract',
    title: 'Near-Miss Reporting (Retained Distinctly)',
    source: 'Award Letter Section 1.2',
    description: 'Distinct classification for near-miss events with no injury/damage outcome, isolated from incident counts.',
    statusInApp: 'Implemented',
    notes: 'Preserves near-miss integrity with dedicated filters and separate metric calculations.'
  },
  {
    id: 'req-3',
    category: 'confirmed_contract',
    title: 'Hazard Observation Management',
    source: 'Award Letter Section 1.3',
    description: 'Observation logging, risk assessment, supervisor disposition, and conversion to CAPA items.',
    statusInApp: 'Implemented',
    notes: 'Supports unsafe acts, conditions, housekeeping, and immediate disposition workflows.'
  },
  {
    id: 'req-4',
    category: 'confirmed_contract',
    title: 'HSE Inspection Management & Scheduling',
    source: 'Award Letter Section 1.4 & 1.9',
    description: 'Scheduled inspections, checklist execution, finding generation, and inspector sign-off.',
    statusInApp: 'Implemented',
    notes: 'Versioned checklist execution with automatic CAPA generation from failed inspection items.'
  },
  {
    id: 'req-5',
    category: 'confirmed_contract',
    title: 'Risk and Finding Classification',
    source: 'Award Letter Section 1.5',
    description: 'Approved scoring methodology to classify incident and observation risk severity consistently.',
    statusInApp: 'Implemented',
    notes: 'Implemented via 5x5 matrix marked provisionally until operating client formally approves bands.'
  },
  {
    id: 'req-6',
    category: 'confirmed_contract',
    title: 'Corrective & Preventive Action (CAPA) Tracking',
    source: 'Award Letter Section 1.6, 1.7 & 1.10',
    description: 'Tracking actions from source issues to owner assignment, evidence submission, and closure verification.',
    statusInApp: 'Implemented',
    notes: 'Enforces strict separation: Action owner cannot verify or close their own assigned action.'
  },
  {
    id: 'req-7',
    category: 'confirmed_contract',
    title: 'Compliance Monitoring Register',
    source: 'Award Letter Section 1.8',
    description: 'Obligation registry tracking statutory regulations, permits, and standards with due date status.',
    statusInApp: 'Implemented',
    notes: 'Strictly distinguishes compliance review state (Compliant/Non-compliant) from calendar due date state.'
  },
  {
    id: 'req-8',
    category: 'confirmed_contract',
    title: 'HSE Performance Dashboards & Visualizations',
    source: 'Award Letter Section 1.11 & 1.12',
    description: 'Operational analytics, status distribution charts, inspection completion ratios, and drill-downs.',
    statusInApp: 'Implemented',
    notes: 'Reconciles exact register counts without misleading injury frequency claims or simulated vanity stats.'
  },
  {
    id: 'req-9',
    category: 'confirmed_contract',
    title: 'Management Reporting & Secure Export',
    source: 'Award Letter Section 1.13',
    description: 'Filtered management reports and sanitized CSV/printable PDF outputs.',
    statusInApp: 'Implemented',
    notes: 'CSV export implements spreadsheet formula injection escaping (=, +, -, @).'
  },
  {
    id: 'req-10',
    category: 'confirmed_contract',
    title: 'User Management & Role-Based Access Controls',
    source: 'Award Letter Section 1.14',
    description: 'Role-based access boundaries for Employees, Supervisors, HSE Officers, Managers, and Executives.',
    statusInApp: 'Implemented',
    notes: 'Site scoping and role checks with quick persona switcher for interactive testing.'
  },
  // Proposed decisions
  {
    id: 'prop-1',
    category: 'proposed_decision',
    title: '5x5 Risk Scoring Matrix Bands',
    source: 'Specification Section 7 (Proposed)',
    description: 'Likelihood (1-5) × Severity (1-5): Low (1-4), Medium (5-9), High (10-16), Critical (17-25).',
    statusInApp: 'Configurable',
    notes: 'Marked as provisional. Must be formally ratified by operating client before live commissioning.'
  },
  {
    id: 'prop-2',
    category: 'proposed_decision',
    title: 'Six-Tier Role Architecture',
    source: 'Specification Section 6 (Proposed)',
    description: 'Reporter, Action Owner, HSE Officer, HSE Manager, Management Viewer, Administrator.',
    statusInApp: 'Configurable',
    notes: 'Separates field reporters from verified closure authorities; client can adjust role names.'
  },
  {
    id: 'prop-3',
    category: 'proposed_decision',
    title: '30-Day Compliance Lookahead Window',
    source: 'Specification Section 10 (Proposed)',
    description: 'Obligations due within 30 calendar days are classified as "Due soon".',
    statusInApp: 'Configurable',
    notes: 'Configurable in system settings based on client internal audit cycles.'
  },
  {
    id: 'prop-4',
    category: 'proposed_decision',
    title: 'Default Operational Timezone: Africa/Lagos (UTC+1)',
    source: 'Specification Section 8 (Proposed)',
    description: 'Base timezone for daily date cutoffs, overdue action evaluation, and audit records.',
    statusInApp: 'Configurable',
    notes: 'Matches Exousia Port Harcourt headquarters; site-specific timezone adjustments supported.'
  },
  {
    id: 'prop-5',
    category: 'proposed_decision',
    title: 'Inspection Pass / Fail / N-A Grading',
    source: 'Specification Section 7 (Proposed)',
    description: 'Checklist grading scheme requiring mandatory finding commentary for any Fail outcome.',
    statusInApp: 'Implemented',
    notes: 'Prevents silent inspection failures without actionable documentation.'
  }
];
