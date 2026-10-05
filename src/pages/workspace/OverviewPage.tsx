import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HSEAppState, hseDataService, isActionOverdue, getActionDueDateStatus } from '../../services/hseDataService';
import { MetricCard } from '../../components/MetricCard';
import { Badge, RiskBadge, ComplianceStateBadge, DueDateHorizonBadge, ActionStatusBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { ContractReferenceModal } from '../../components/ContractReferenceModal';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Building,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  Clock,
  Eye,
  Filter,
  Info,
  Layers,
  MapPin,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  XCircle
} from 'lucide-react';

interface OverviewPageProps {
  appState: HSEAppState;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ appState }) => {
  const navigate = useNavigate();
  const [showContractModal, setShowContractModal] = useState(false);

  // Site and Date Filter State
  const [selectedSite, setSelectedSite] = useState<string>(appState.activeSiteFilter);
  const [referenceDate, setReferenceDate] = useState<string>('2026-10-02');

  const handleSiteChange = (siteId: string) => {
    setSelectedSite(siteId);
    hseDataService.setActiveSiteFilter(siteId);
  };

  const handleResetFilters = () => {
    setSelectedSite('all');
    setReferenceDate('2026-10-02');
    hseDataService.setActiveSiteFilter('all');
  };

  // Base filtered collections by selected site
  const filteredReports = appState.reports.filter(r => {
    if (selectedSite !== 'all' && r.siteId !== selectedSite) return false;
    return true;
  });

  const filteredActions = appState.actions.filter(a => {
    if (selectedSite !== 'all' && a.siteId !== selectedSite) return false;
    return true;
  });

  const filteredInspections = appState.inspections.filter(i => {
    if (selectedSite !== 'all' && i.siteId !== selectedSite) return false;
    return true;
  });

  const filteredCompliance = appState.compliance.filter(c => {
    if (selectedSite !== 'all' && !c.applicableSiteIds.includes(selectedSite)) return false;
    return true;
  });

  // =========================================================================
  // 8 CORE OVERVIEW METRICS (Strictly Grounded in Specification Definitions)
  // =========================================================================

  // 1. Open Incidents: Asset damage / process upset events not closed or dismissed
  const openIncidents = filteredReports.filter(
    r => r.type === 'incident' && r.status !== 'closed' && r.status !== 'dismissed'
  );

  // 2. Near Misses Awaiting Review: Retained distinctly per contract scope
  const nearMissesAwaitingReview = filteredReports.filter(
    r => r.type === 'near_miss' && (r.status === 'submitted' || r.status === 'under_review')
  );

  // 3. Hazards Awaiting Review: Proactive unsafe act/condition reports needing evaluation
  const hazardsAwaitingReview = filteredReports.filter(
    r => r.type === 'hazard' && (r.status === 'submitted' || r.status === 'under_review')
  );

  // 4. Upcoming Inspections: Scheduled or in-progress facility checklist audits
  const upcomingInspections = filteredInspections.filter(
    i => i.status === 'scheduled' || i.status === 'in_progress'
  );

  // 5. Open Corrective and Preventive Actions: All active CAPA items not closed
  const openActions = filteredActions.filter(a => a.status !== 'closed');

  // 6. Overdue Actions: Derived strictly from due date and lifecycle state (evidence submission != closure)
  const overdueActions = filteredActions.filter(a => isActionOverdue(a, referenceDate));

  // 7. Actions Awaiting Verification: Evidence submitted, pending independent reviewer sign-off
  const actionsAwaitingVerification = filteredActions.filter(
    a => a.status === 'awaiting_verification' || a.status === 'evidence_submitted'
  );

  // 8. Compliance Obligations Due Soon or Overdue: Calendar horizon <= 30d, overdue, or non-compliant
  const complianceDueSoonOrOverdue = filteredCompliance.filter(c => {
    const daysDiff = Math.floor(
      (new Date(c.dueDate).getTime() - new Date(referenceDate).getTime()) / (1000 * 3600 * 24)
    );
    return daysDiff < 0 || (daysDiff >= 0 && daysDiff <= 30) || c.complianceState === 'non_compliant';
  });

  // =========================================================================
  // PRIORITIZED ATTENTION QUEUE (Ranked Workload Engine)
  // =========================================================================

  interface AttentionQueueItem {
    id: string;
    domain: 'incident' | 'near_miss' | 'hazard' | 'action' | 'inspection' | 'compliance';
    title: string;
    code: string;
    siteName: string;
    ownerOrActor: string;
    priorityBand: 'critical' | 'high' | 'medium' | 'low';
    urgencyScore: number; // Higher number = top of queue
    dueDateOrDate: string;
    statusLabel: string;
    statusBadgeVariant: 'danger' | 'warning' | 'info' | 'success';
    actionText: string;
    actionLink: string;
    detailNote: string;
  }

  const attentionQueue: AttentionQueueItem[] = [];

  // Overdue Actions (Urgency 100 - 90)
  overdueActions.forEach(a => {
    const daysOverdue = Math.max(
      1,
      Math.floor((new Date(referenceDate).getTime() - new Date(a.dueDate).getTime()) / (1000 * 3600 * 24))
    );
    const isCritical = a.priority === 'critical' || a.priority === 'high';
    attentionQueue.push({
      id: `att-act-${a.id}`,
      domain: 'action',
      title: a.title,
      code: a.actionNumber,
      siteName: a.siteName,
      ownerOrActor: `Owner: ${a.ownerName}`,
      priorityBand: a.priority,
      urgencyScore: isCritical ? 100 + daysOverdue : 85 + daysOverdue,
      dueDateOrDate: `${daysOverdue}d overdue (Due ${a.dueDate})`,
      statusLabel: 'Overdue Action',
      statusBadgeVariant: 'danger',
      actionText: 'Review Action',
      actionLink: `/app/actions/${a.id}`,
      detailNote: `Target completion date elapsed. Evidence submission does not waive overdue status until verified.`
    });
  });

  // Non-compliant Compliance Obligations (Urgency 95)
  filteredCompliance
    .filter(c => c.complianceState === 'non_compliant')
    .forEach(c => {
      attentionQueue.push({
        id: `att-cmp-${c.id}`,
        domain: 'compliance',
        title: c.title,
        code: c.obligationNumber,
        siteName: `${c.applicableSiteIds.length} Facilities`,
        ownerOrActor: `Custodian: ${c.ownerName}`,
        priorityBand: 'high',
        urgencyScore: 95,
        dueDateOrDate: `Target: ${c.dueDate}`,
        statusLabel: 'Non-Compliant (Audit Defect)',
        statusBadgeVariant: 'danger',
        actionText: 'Remediate Defect',
        actionLink: `/app/compliance/${c.id}`,
        detailNote: c.reviewNotes || 'Audit findings documented non-conformance. Corrective action required.'
      });
    });

  // Open Incidents Awaiting Review/Investigation (Urgency 90 - 80)
  openIncidents.forEach(inc => {
    attentionQueue.push({
      id: `att-inc-${inc.id}`,
      domain: 'incident',
      title: inc.title,
      code: inc.reportNumber,
      siteName: inc.siteName,
      ownerOrActor: `Reporter: ${inc.reporterName}`,
      priorityBand: inc.classification?.band || 'high',
      urgencyScore: 88,
      dueDateOrDate: `Reported: ${new Date(inc.reportedAt).toLocaleDateString('en-GB')}`,
      statusLabel: inc.status === 'submitted' ? 'Awaiting Technical Review' : 'Active Investigation',
      statusBadgeVariant: 'warning',
      actionText: 'Investigate',
      actionLink: `/app/incidents/${inc.id}`,
      detailNote: inc.immediateActionTaken || 'Process upset / asset event requires investigation and root cause analysis.'
    });
  });

  // Actions Awaiting Independent Verification (Urgency 80)
  actionsAwaitingVerification.forEach(a => {
    attentionQueue.push({
      id: `att-ver-${a.id}`,
      domain: 'action',
      title: a.title,
      code: a.actionNumber,
      siteName: a.siteName,
      ownerOrActor: `Owner: ${a.ownerName}`,
      priorityBand: a.priority,
      urgencyScore: 80,
      dueDateOrDate: `Due: ${a.dueDate}`,
      statusLabel: 'Awaiting Independent Verification',
      statusBadgeVariant: 'info',
      actionText: 'Verify Evidence',
      actionLink: `/app/actions/${a.id}`,
      detailNote: 'Evidence has been submitted. Requires independent HSE sign-off (two-person separation rule).'
    });
  });

  // Near Misses Awaiting Review (Urgency 75)
  nearMissesAwaitingReview.forEach(nm => {
    attentionQueue.push({
      id: `att-nm-${nm.id}`,
      domain: 'near_miss',
      title: nm.title,
      code: nm.reportNumber,
      siteName: nm.siteName,
      ownerOrActor: `Reporter: ${nm.reporterName}`,
      priorityBand: nm.classification?.band || 'medium',
      urgencyScore: 75,
      dueDateOrDate: `Reported: ${new Date(nm.reportedAt).toLocaleDateString('en-GB')}`,
      statusLabel: 'Near Miss Pending Review',
      statusBadgeVariant: 'warning',
      actionText: 'Evaluate Risk',
      actionLink: `/app/incidents/${nm.id}`,
      detailNote: 'High potential barrier failure recorded; requires 5x5 risk matrix scoring.'
    });
  });

  // Hazards Awaiting Review (Urgency 70)
  hazardsAwaitingReview.forEach(hz => {
    attentionQueue.push({
      id: `att-hz-${hz.id}`,
      domain: 'hazard',
      title: hz.title,
      code: hz.reportNumber,
      siteName: hz.siteName,
      ownerOrActor: `Reporter: ${hz.reporterName}`,
      priorityBand: hz.classification?.band || 'medium',
      urgencyScore: 70,
      dueDateOrDate: `Reported: ${new Date(hz.reportedAt).toLocaleDateString('en-GB')}`,
      statusLabel: 'Hazard Awaiting Classification',
      statusBadgeVariant: 'warning',
      actionText: 'Review Hazard',
      actionLink: `/app/hazards/${hz.id}`,
      detailNote: hz.specificLocation
    });
  });

  // Scheduled Inspections Due Today or Next (Urgency 65)
  upcomingInspections
    .filter(ins => ins.scheduledDate <= referenceDate)
    .forEach(ins => {
      attentionQueue.push({
        id: `att-ins-${ins.id}`,
        domain: 'inspection',
        title: ins.title,
        code: ins.inspectionNumber,
        siteName: ins.siteName,
        ownerOrActor: `Inspector: ${ins.inspectorName}`,
        priorityBand: 'medium',
        urgencyScore: 65,
        dueDateOrDate: `Scheduled: ${ins.scheduledDate}`,
        statusLabel: ins.status === 'in_progress' ? 'Audit In Progress' : 'Scheduled for Execution',
        statusBadgeVariant: 'info',
        actionText: 'Execute Checklist',
        actionLink: `/app/inspections/${ins.id}`,
        detailNote: `${ins.items.length} verification checklist questions awaiting field audit.`
      });
    });

  // Sort Attention Queue by urgencyScore descending
  attentionQueue.sort((a, b) => b.urgencyScore - a.urgencyScore);

  return (
    <div className="space-y-6">
      {/* Top Governance Notice & Contract Reference */}
      <div className="bg-[#EEF7F2] border border-[#BDE3CE] rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#15251C]">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-[#007A44] shrink-0" />
          <span>
            <strong>Central Demo Repository:</strong> Dashboard metrics reconcile live across all operational registers. Overdue actions strictly require verified sign-off before closure.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowContractModal(true)}
            className="text-[#007A44] hover:text-[#005D35] font-semibold underline"
          >
            Contract Reference
          </button>
        </div>
      </div>

      {/* Hero Header with Site & Date Controls */}
      <div className="bg-white p-5 rounded-xl border border-[#DDE5DF] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[#15251C]">
              Operational Overview & Workload
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EEF7F2] text-[#007A44] border border-[#BDE3CE]">
              Central Repository
            </span>
          </div>
          <p className="text-xs text-[#5D6961] mt-1">
            Real-time status across Nigerian energy operations · Reference Date: <strong>{new Date(referenceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
          </p>
        </div>

        {/* Global Overview Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Site Selector */}
          <div className="flex items-center gap-1.5 bg-[#F7F9F7] px-2.5 py-1.5 rounded-lg border border-[#DDE5DF] text-xs">
            <Building className="w-3.5 h-3.5 text-[#007A44] shrink-0" />
            <select
              value={selectedSite}
              onChange={(e) => handleSiteChange(e.target.value)}
              className="bg-transparent font-semibold text-[#15251C] focus:outline-hidden text-xs cursor-pointer"
              title="Filter overview metrics by operating facility"
            >
              <option value="all">All Operating Facilities ({appState.sites.length})</option>
              {appState.sites.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          {/* Reference Date Picker */}
          <div className="flex items-center gap-1.5 bg-[#F7F9F7] px-2.5 py-1.5 rounded-lg border border-[#DDE5DF] text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#5D6961] shrink-0" />
            <input
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
              className="bg-transparent font-mono text-[#15251C] focus:outline-hidden text-xs cursor-pointer"
              title="Evaluation horizon reference date"
            />
          </div>

          {(selectedSite !== 'all' || referenceDate !== '2026-10-02') && (
            <button
              onClick={handleResetFilters}
              className="p-2 border border-[#DDE5DF] text-[#5D6961] hover:text-[#15251C] rounded-lg bg-white"
              title="Reset site and date filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <Link
            to="/app/reports/new"
            className="inline-flex items-center gap-1.5 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Observation</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8 CORE METRIC TILES WITH DRILL-THROUGH LINKS                              */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <span className="text-xs font-bold text-[#5D6961] uppercase tracking-wider">
            Operational Key Metrics ({selectedSite === 'all' ? 'All Sites' : appState.sites.find(s => s.id === selectedSite)?.name})
          </span>
          <span className="text-[11px] text-[#5D6961]">
            Click any metric to drill through to filtered register
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* 1. Open Incidents */}
          <Link
            to="/app/incidents?type=incident&status=open"
            className="group block p-3 bg-white rounded-xl border border-[#DDE5DF] hover:border-[#007A44] hover:shadow-2xs transition-all"
            title="View open incidents register"
          >
            <div className="flex items-center justify-between text-[#5D6961] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Open Incidents</span>
              <AlertOctagon className="w-3.5 h-3.5 text-[#B42318] group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-bold text-[#15251C] block">{openIncidents.length}</span>
            <span className="text-[10px] text-[#5D6961] block mt-0.5 group-hover:text-[#007A44]">
              Damage & Process →
            </span>
          </Link>

          {/* 2. Near Misses Awaiting Review */}
          <Link
            to="/app/incidents?type=near_miss&status=awaiting_review"
            className="group block p-3 bg-white rounded-xl border border-[#DDE5DF] hover:border-[#007A44] hover:shadow-2xs transition-all"
            title="View near misses awaiting technical review"
          >
            <div className="flex items-center justify-between text-[#5D6961] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Near Misses</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#B54708] group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-bold text-[#15251C] block">{nearMissesAwaitingReview.length}</span>
            <span className="text-[10px] text-[#5D6961] block mt-0.5 group-hover:text-[#007A44]">
              Awaiting Review →
            </span>
          </Link>

          {/* 3. Hazards Awaiting Review */}
          <Link
            to="/app/hazards?status=awaiting_review"
            className="group block p-3 bg-white rounded-xl border border-[#DDE5DF] hover:border-[#007A44] hover:shadow-2xs transition-all"
            title="View hazard observations awaiting evaluation"
          >
            <div className="flex items-center justify-between text-[#5D6961] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Hazards</span>
              <Eye className="w-3.5 h-3.5 text-[#007A44] group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-bold text-[#15251C] block">{hazardsAwaitingReview.length}</span>
            <span className="text-[10px] text-[#5D6961] block mt-0.5 group-hover:text-[#007A44]">
              Awaiting Review →
            </span>
          </Link>

          {/* 4. Upcoming Inspections */}
          <Link
            to="/app/inspections?status=scheduled"
            className="group block p-3 bg-white rounded-xl border border-[#DDE5DF] hover:border-[#007A44] hover:shadow-2xs transition-all"
            title="View scheduled inspection audits"
          >
            <div className="flex items-center justify-between text-[#5D6961] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Inspections</span>
              <ClipboardCheck className="w-3.5 h-3.5 text-[#007A44] group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-bold text-[#15251C] block">{upcomingInspections.length}</span>
            <span className="text-[10px] text-[#5D6961] block mt-0.5 group-hover:text-[#007A44]">
              Scheduled Audits →
            </span>
          </Link>

          {/* 5. Open CAPA Actions */}
          <Link
            to="/app/actions?tab=all&status=open"
            className="group block p-3 bg-white rounded-xl border border-[#DDE5DF] hover:border-[#007A44] hover:shadow-2xs transition-all"
            title="View all open corrective actions"
          >
            <div className="flex items-center justify-between text-[#5D6961] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Open Actions</span>
              <CheckSquare className="w-3.5 h-3.5 text-[#007A44] group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-bold text-[#15251C] block">{openActions.length}</span>
            <span className="text-[10px] text-[#5D6961] block mt-0.5 group-hover:text-[#007A44]">
              Remediation Active →
            </span>
          </Link>

          {/* 6. Overdue Actions (Derived) */}
          <Link
            to="/app/actions?tab=overdue"
            className={`group block p-3 rounded-xl border transition-all ${
              overdueActions.length > 0
                ? 'bg-[#FFF0ED] border-[#FECDCA] hover:border-[#B42318]'
                : 'bg-white border-[#DDE5DF] hover:border-[#007A44]'
            }`}
            title="View overdue actions requiring immediate escalation"
          >
            <div className="flex items-center justify-between text-[#B42318] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Overdue Actions</span>
              <Clock className="w-3.5 h-3.5 text-[#B42318] group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-bold text-[#B42318] block">{overdueActions.length}</span>
            <span className="text-[10px] text-[#B42318] block mt-0.5 font-medium">
              Target Elapsed →
            </span>
          </Link>

          {/* 7. Actions Awaiting Verification */}
          <Link
            to="/app/actions?tab=awaiting"
            className="group block p-3 bg-white rounded-xl border border-[#DDE5DF] hover:border-[#007A44] hover:shadow-2xs transition-all"
            title="View actions with evidence awaiting independent sign-off"
          >
            <div className="flex items-center justify-between text-[#5D6961] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Verification</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#026AA2] group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-bold text-[#026AA2] block">{actionsAwaitingVerification.length}</span>
            <span className="text-[10px] text-[#5D6961] block mt-0.5 group-hover:text-[#007A44]">
              Evidence Submitted →
            </span>
          </Link>

          {/* 8. Compliance Due Soon or Overdue */}
          <Link
            to="/app/compliance?horizon=due_soon_or_overdue"
            className="group block p-3 bg-white rounded-xl border border-[#DDE5DF] hover:border-[#007A44] hover:shadow-2xs transition-all"
            title="View compliance obligations due soon or overdue"
          >
            <div className="flex items-center justify-between text-[#5D6961] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Compliance</span>
              <ShieldAlert className="w-3.5 h-3.5 text-[#B54708] group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-bold text-[#15251C] block">{complianceDueSoonOrOverdue.length}</span>
            <span className="text-[10px] text-[#5D6961] block mt-0.5 group-hover:text-[#007A44]">
              Due Soon / Overdue →
            </span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN TWO-COLUMN WORKSPACE: ATTENTION QUEUE & SIDE PANELS                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Prioritized Attention Queue (Span 8) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#B42318]" />
              <div>
                <h2 className="text-base font-semibold text-[#15251C]">
                  Prioritized Attention Queue ({attentionQueue.length})
                </h2>
                <p className="text-xs text-[#5D6961]">
                  Dynamically ranked by risk severity, regulatory criticality, and target completion deadlines.
                </p>
              </div>
            </div>

            <span className="text-[11px] font-mono font-semibold text-[#5D6961] bg-[#F7F9F7] px-2.5 py-1 rounded border border-[#DDE5DF]">
              ISO 45001 Risk Order
            </span>
          </div>

          {/* Attention Queue Items */}
          {attentionQueue.length === 0 ? (
            <div className="py-8 text-center bg-[#F7F9F7] rounded-xl border border-[#DDE5DF] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#007A44] mx-auto" />
              <h3 className="font-semibold text-sm text-[#15251C]">No Immediate Attention Items</h3>
              <p className="text-xs text-[#5D6961] max-w-sm mx-auto">
                No overdue actions, pending technical investigations, or non-compliant obligations for this operational site selection.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {attentionQueue.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-[#DDE5DF] hover:border-[#BDE3CE] bg-[#F7F9F7] hover:bg-white transition-all space-y-2.5 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-5 h-5 rounded-full bg-white border border-[#DDE5DF] text-[10px] font-bold text-[#15251C] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#15251C] bg-white px-2 py-0.5 rounded border border-[#DDE5DF]">
                        {item.code}
                      </span>
                      <Badge variant={item.statusBadgeVariant} size="sm">
                        {item.statusLabel}
                      </Badge>
                      <RiskBadge band={item.priorityBand} />
                    </div>

                    <span className="font-mono text-xs font-semibold text-[#B42318] bg-white px-2 py-0.5 rounded border border-[#DDE5DF] self-start sm:self-auto">
                      {item.dueDateOrDate}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-xs text-[#15251C] group-hover:text-[#007A44] transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#5D6961] mt-1 leading-relaxed">
                      {item.detailNote}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#DDE5DF]/70 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3 text-[#5D6961]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#007A44]" />
                        <span>{item.siteName}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-[#5D6961]" />
                        <span>{item.ownerOrActor}</span>
                      </span>
                    </div>

                    <Link
                      to={item.actionLink}
                      className="font-semibold text-[#007A44] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{item.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Inspections & Compliance Outlook (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming Inspection Audits */}
          <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
              <h2 className="text-sm font-semibold text-[#15251C] flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-[#007A44]" />
                <span>Upcoming Scheduled Inspections</span>
              </h2>
              <Link
                to="/app/inspections"
                className="text-xs font-semibold text-[#007A44] hover:underline"
              >
                All
              </Link>
            </div>

            {upcomingInspections.length === 0 ? (
              <div className="p-4 bg-[#F7F9F7] rounded-lg text-center text-xs text-[#5D6961] italic">
                No inspections currently scheduled for this site selection.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingInspections.map((ins) => (
                  <Link
                    key={ins.id}
                    to={`/app/inspections/${ins.id}`}
                    className="block p-3 rounded-lg border border-[#DDE5DF] hover:border-[#007A44] bg-[#F7F9F7] hover:bg-white transition-all space-y-1.5 group text-xs"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-bold text-[#15251C]">{ins.inspectionNumber}</span>
                      <span className="font-mono text-[11px] font-semibold text-[#007A44]">
                        {ins.scheduledDate}
                      </span>
                    </div>
                    <div className="font-semibold text-[#15251C] group-hover:text-[#007A44] transition-colors line-clamp-1">
                      {ins.title}
                    </div>
                    <div className="text-[11px] text-[#5D6961] flex items-center justify-between pt-1">
                      <span>{ins.siteName}</span>
                      <span>{ins.inspectorName}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <Link
              to="/app/inspections/new"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#007A44] hover:bg-[#EEF7F2] rounded-lg border border-[#BDE3CE] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule New Inspection</span>
            </Link>
          </div>

          {/* Compliance Register Outlook */}
          <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
              <h2 className="text-sm font-semibold text-[#15251C] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#007A44]" />
                <span>Compliance Health Snapshot</span>
              </h2>
              <Link
                to="/app/compliance"
                className="text-xs font-semibold text-[#007A44] hover:underline"
              >
                Register
              </Link>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-[#EEF7F2] rounded-lg border border-[#BDE3CE] flex items-center justify-between">
                <span className="font-semibold text-[#007A44]">Audited Compliant</span>
                <span className="font-bold text-sm text-[#007A44]">
                  {filteredCompliance.filter(c => c.complianceState === 'compliant').length}
                </span>
              </div>

              <div className="p-3 bg-[#FFF0ED] rounded-lg border border-[#FECDCA] flex items-center justify-between">
                <span className="font-semibold text-[#B42318]">Non-Compliant Deficiencies</span>
                <span className="font-bold text-sm text-[#B42318]">
                  {filteredCompliance.filter(c => c.complianceState === 'non_compliant').length}
                </span>
              </div>

              <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF] flex items-center justify-between">
                <span className="font-semibold text-[#5D6961]">Not Yet Assessed</span>
                <span className="font-bold text-sm text-[#15251C]">
                  {filteredCompliance.filter(c => c.complianceState === 'not_assessed').length}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-[#5D6961] leading-relaxed border-t border-[#DDE5DF]">
              <strong>Rule 1.8:</strong> Future deadlines do not imply compliance. Verified audit proof is strictly required.
            </div>
          </div>
        </div>
      </div>

      <ContractReferenceModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
      />
    </div>
  );
};
