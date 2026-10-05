/**
 * Core types for the Exousia Integrated HSE Management System
 * Based on CONTRACT_AWARD_FOR_THE_DEVELOPMENT_AND_IMPLEMENTATION_OF_AN_INTE(2).pdf
 * and Exousia_HSE_Build_Specification.md
 */

export type ReportType = 'incident' | 'near_miss' | 'hazard';

export type ReportStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'under_investigation'
  | 'actions_in_progress'
  | 'pending_closure_review'
  | 'closed'
  | 'dismissed';

export type ActionStatus =
  | 'open'
  | 'in_progress'
  | 'evidence_submitted'
  | 'awaiting_verification'
  | 'closed'
  | 'returned_for_rework';

export type InspectionStatus =
  | 'scheduled'
  | 'in_progress'
  | 'submitted'
  | 'completed'
  | 'cancelled';

export type ChecklistItemResult = 'pass' | 'fail' | 'na';

export type ComplianceState =
  | 'compliant'
  | 'non_compliant'
  | 'not_assessed'
  | 'not_applicable';

export type DueDateStatus = 'current' | 'due_soon' | 'overdue';

export type RiskBand = 'low' | 'medium' | 'high' | 'critical';

export type UserRole =
  | 'reporter'          // Employee: submit reports, view own permitted reports
  | 'action_owner'      // Supervisor: see assigned actions, submit progress & evidence
  | 'hse_officer'       // Inspector: review reports, execute inspections, classify findings
  | 'hse_manager'       // Manager: supervise workflows, verify CAPA closures, manage compliance
  | 'management_viewer' // Executive: read-only dashboards and management reports
  | 'admin';            // Administrator: system settings, sites, users

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  siteIds: string[];
  active: boolean;
  avatar?: string;
}

export interface Site {
  id: string;
  name: string;
  location: string;
  code: string;
  active: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  dataUrl?: string;
}

export interface RiskClassification {
  severity: number;    // 1 - 5
  likelihood: number;  // 1 - 5
  score: number;       // severity * likelihood (1 - 25)
  band: RiskBand;
  category?: string;
  rationale?: string;
  matrixVersion: string; // Retains the scheme version at classification time
  classifiedBy?: string;
  classifiedAt?: string;
  isProvisional: boolean; // Proposed decision per spec requiring client approval
  clientApprovalStatus?: 'pending_client_approval' | 'client_approved';
}

export interface SeverityScaleItem {
  level: number;
  label: string;
  description: string;
}

export interface LikelihoodScaleItem {
  level: number;
  label: string;
  description: string;
}

export interface RiskBandDefinition {
  band: RiskBand;
  label: string;
  minScore: number;
  maxScore: number;
  actionProtocol: string;
  readableIdentifier: string;
}

export interface RiskMatrixConfig {
  version: string;
  name: string;
  isProvisional: boolean;
  approvalStatus: 'pending_client_approval' | 'client_approved';
  clientApprovalNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  severities: SeverityScaleItem[];
  likelihoods: LikelihoodScaleItem[];
  bands: RiskBandDefinition[];
  findingCategories: string[];
}

export interface ReportCorrection {
  id: string;
  timestamp: string;
  authorName: string;
  authorRole: string;
  field: string;
  originalValue: string;
  correctedValue: string;
  reason: string;
}

export interface HSEReport {
  id: string;
  reportNumber: string; // e.g. INC-2026-081 or NM-2026-042 or HZ-2026-014
  type: ReportType;
  title: string;
  description: string;
  siteId: string;
  siteName: string;
  specificLocation: string;
  occurredAt: string; // ISO string
  reportedAt: string;
  reporterId: string;
  reporterName: string;
  immediateActionTaken?: string;
  status: ReportStatus;
  classification?: RiskClassification;
  reviewerId?: string;
  reviewerName?: string;
  reviewerNotes?: string;
  rootCauseAnalysis?: string;
  investigationFindings?: string[];
  linkedActionIds: string[];
  attachments: Attachment[];
  corrections?: ReportCorrection[];
  closedAt?: string;
  closedBy?: string;
}

export interface ChecklistItem {
  id: string;
  section: string;
  question: string;
  guidance?: string;
  result?: ChecklistItemResult;
  findingNote?: string;
  findingCategory?: string;
  findingClassification?: RiskClassification;
  evidenceName?: string;
  evidenceUrl?: string;
  linkedActionId?: string;
}

export interface InspectionTemplate {
  id: string;
  title: string;
  version: string;
  category: string;
  items: Omit<ChecklistItem, 'result' | 'findingNote' | 'findingCategory' | 'findingClassification' | 'evidenceName' | 'evidenceUrl' | 'linkedActionId'>[];
}

export interface Inspection {
  id: string;
  inspectionNumber: string; // e.g. INS-2026-022
  title: string;
  templateId: string;
  templateVersion: string;
  siteId: string;
  siteName: string;
  scheduledDate: string;
  inspectorId: string;
  inspectorName: string;
  status: InspectionStatus;
  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  items: ChecklistItem[];
  findingsCount: number;
  linkedActionIds: string[];
  summaryNotes?: string;
}

export interface ReassignmentRecord {
  id: string;
  timestamp: string;
  previousOwnerId: string;
  previousOwnerName: string;
  newOwnerId: string;
  newOwnerName: string;
  reason: string;
  actorId: string;
  actorName: string;
}

export interface DueDateExtensionRecord {
  id: string;
  timestamp: string;
  previousDueDate: string;
  newDueDate: string;
  reason: string;
  actorId: string;
  actorName: string;
}

export interface ReopenRecord {
  id: string;
  timestamp: string;
  previousClosedAt?: string;
  reason: string;
  actorId: string;
  actorName: string;
}

export interface ActionUpdate {
  id: string;
  authorId: string;
  authorName: string;
  timestamp: string;
  note: string;
  statusChange?: ActionStatus;
  attachments?: Attachment[];
}

export interface ActionItem {
  id: string;
  actionNumber: string; // e.g. ACT-2026-054
  title: string;
  description: string;
  actionType: 'corrective' | 'preventive';
  sourceType: 'incident' | 'near_miss' | 'hazard' | 'inspection' | 'compliance';
  sourceId: string;
  sourceNumber: string;
  checklistItemId?: string;
  findingCategory?: string;
  siteId: string;
  siteName: string;
  ownerId: string;
  ownerName: string;
  assignedById: string;
  assignedByName: string;
  dueDate: string; // YYYY-MM-DD
  originalDueDate: string;
  extensionReason?: string;
  dueDateHistory?: DueDateExtensionRecord[];
  reassignmentHistory?: ReassignmentRecord[];
  reopenHistory?: ReopenRecord[];
  status: ActionStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  evidenceDescription?: string;
  evidenceAttachments: Attachment[];
  submittedAt?: string;
  verifiedById?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  updates: ActionUpdate[];
  createdAt: string;
}

export interface ComplianceReviewRecord {
  id: string;
  timestamp: string;
  reviewerId: string;
  reviewerName: string;
  previousState: ComplianceState;
  newState: ComplianceState;
  notes: string;
  evidenceAttachments?: Attachment[];
}

export interface ComplianceObligation {
  id: string;
  obligationNumber: string; // e.g. CMP-2026-003
  title: string;
  sourceReference: string; // Regulation, Standard, Permit or Internal Rule
  regulatorOrAuthority: string;
  applicableSiteIds: string[];
  ownerId: string;
  ownerName: string;
  dueDate: string;
  complianceState: ComplianceState;
  isInternalStandard?: boolean;
  category?: string;
  lastReviewedAt?: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewNotes?: string;
  evidenceAttachments: Attachment[];
  reviewHistory?: ComplianceReviewRecord[];
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  entityType: 'report' | 'inspection' | 'action' | 'compliance' | 'user' | 'setting';
  entityId: string;
  entityNumber: string;
  action: string;
  summary: string;
  details?: Record<string, any>;
}
