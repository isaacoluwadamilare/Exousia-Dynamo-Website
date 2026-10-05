import React, { useState } from 'react';
import { HSEAppState, hseDataService } from '../../services/hseDataService';
import { MetricCard } from '../../components/MetricCard';
import { Badge, RiskBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import {
  BarChart3,
  TrendingUp,
  AlertOctagon,
  Eye,
  CheckSquare,
  ShieldCheck,
  Calendar,
  Filter,
  Info,
  Download,
  Building,
  RotateCcw,
  Table as TableIcon,
  PieChart,
  Layers,
  Clock,
  ShieldAlert,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Tag
} from 'lucide-react';

interface AnalyticsPageProps {
  appState: HSEAppState;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ appState }) => {
  const [selectedSite, setSelectedSite] = useState<string>(appState.activeSiteFilter);
  const [viewMode, setViewMode] = useState<'visual' | 'tables'>('visual');
  const referenceDate = '2026-10-02';

  // Base filter by site
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

  // =========================================================================
  // 1. REPORTING TRENDS COMPUTATIONS
  // =========================================================================
  const incidents = filteredReports.filter(r => r.type === 'incident');
  const nearMisses = filteredReports.filter(r => r.type === 'near_miss');
  const hazards = filteredReports.filter(r => r.type === 'hazard');
  const totalReports = filteredReports.length;

  // Monthly buckets: July, August, September, October 2026
  const months = ['2026-07', '2026-08', '2026-09', '2026-10'];
  const monthLabels: Record<string, string> = {
    '2026-07': 'Jul 2026',
    '2026-08': 'Aug 2026',
    '2026-09': 'Sep 2026',
    '2026-10': 'Oct 2026'
  };

  const monthlyReportingTrends = months.map(m => {
    const mIncidents = incidents.filter(r => (r.occurredAt || r.reportedAt).startsWith(m)).length;
    const mNearMisses = nearMisses.filter(r => (r.occurredAt || r.reportedAt).startsWith(m)).length;
    const mHazards = hazards.filter(r => (r.occurredAt || r.reportedAt).startsWith(m)).length;
    const mTotal = mIncidents + mNearMisses + mHazards;
    return {
      monthKey: m,
      monthLabel: monthLabels[m],
      incidents: mIncidents,
      nearMisses: mNearMisses,
      hazards: mHazards,
      total: mTotal
    };
  });

  // Site Distribution
  const siteDistribution = appState.sites.map(s => {
    const sReports = appState.reports.filter(r => r.siteId === s.id);
    return {
      siteId: s.id,
      siteName: s.name,
      siteCode: s.code,
      incidents: sReports.filter(r => r.type === 'incident').length,
      nearMisses: sReports.filter(r => r.type === 'near_miss').length,
      hazards: sReports.filter(r => r.type === 'hazard').length,
      total: sReports.length
    };
  });

  // =========================================================================
  // 2. CAPA ACTION LIFECYCLE STATES COMPUTATIONS
  // =========================================================================
  const openActions = filteredActions.filter(a => a.status !== 'closed');
  const closedActions = filteredActions.filter(a => a.status === 'closed');
  const overdueActions = openActions.filter(a => a.dueDate < referenceDate);
  const awaitingVerificationActions = filteredActions.filter(
    a => a.status === 'awaiting_verification' || a.status === 'evidence_submitted'
  );
  const returnedForReworkActions = filteredActions.filter(a => a.status === 'returned_for_rework');
  const inProgressActions = filteredActions.filter(a => a.status === 'in_progress');
  const assignedOpenActions = filteredActions.filter(a => a.status === 'open');

  const correctiveActions = filteredActions.filter(a => a.actionType === 'corrective');
  const preventiveActions = filteredActions.filter(a => a.actionType === 'preventive');

  const priorityBreakdown = {
    critical: filteredActions.filter(a => a.priority === 'critical').length,
    high: filteredActions.filter(a => a.priority === 'high').length,
    medium: filteredActions.filter(a => a.priority === 'medium').length,
    low: filteredActions.filter(a => a.priority === 'low').length
  };

  // =========================================================================
  // 3. INSPECTION COMPLETION & AUDIT YIELD COMPUTATIONS
  // =========================================================================
  const totalInspections = filteredInspections.length;
  const completedInspections = filteredInspections.filter(i => i.status === 'completed');
  const scheduledInspections = filteredInspections.filter(i => i.status === 'scheduled');
  const inProgressInspections = filteredInspections.filter(i => i.status === 'in_progress');
  const cancelledInspections = filteredInspections.filter(i => i.status === 'cancelled');

  let totalQuestionsAudited = 0;
  let passedQuestions = 0;
  let failedFindings = 0;
  let naQuestions = 0;

  filteredInspections.forEach(i => {
    i.items.forEach(it => {
      totalQuestionsAudited++;
      if (it.result === 'pass') passedQuestions++;
      if (it.result === 'fail') failedFindings++;
      if (it.result === 'na') naQuestions++;
    });
  });

  const inspectionCompletionRate =
    totalInspections > 0 ? Math.round((completedInspections.length / totalInspections) * 100) : 0;
  const checklistPassRate =
    totalQuestionsAudited > 0 ? Math.round((passedQuestions / totalQuestionsAudited) * 100) : 0;

  // =========================================================================
  // 4. RISK CLASSIFICATION (5×5 MATRIX) COMPUTATIONS
  // =========================================================================
  const classifiedReports = filteredReports.filter(r => r.classification?.band);
  const criticalRiskCount = classifiedReports.filter(r => r.classification?.band === 'critical').length;
  const highRiskCount = classifiedReports.filter(r => r.classification?.band === 'high').length;
  const mediumRiskCount = classifiedReports.filter(r => r.classification?.band === 'medium').length;
  const lowRiskCount = classifiedReports.filter(r => r.classification?.band === 'low').length;
  const unclassifiedCount = filteredReports.length - classifiedReports.length;

  const provisionalEstimates = classifiedReports.filter(r => r.classification?.isProvisional).length;
  const verifiedClassifications = classifiedReports.filter(r => !r.classification?.isProvisional).length;

  // Category distribution
  const categoryStats = appState.matrixConfig.findingCategories.map(cat => {
    const reportCatCount = filteredReports.filter(r => r.classification?.category === cat).length;
    const actionCatCount = filteredActions.filter(a => a.findingCategory === cat).length;
    return {
      category: cat,
      reportsCount: reportCatCount,
      actionsCount: actionCatCount,
      total: reportCatCount + actionCatCount
    };
  });

  // =========================================================================
  // CSV EXPORT GENERATOR WITH SPREADSHEET-FORMULA ESCAPING
  // =========================================================================
  const handleExportAnalyticsCSV = () => {
    const sanitize = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str}"`;
    };

    const lines: string[] = [];
    lines.push(['EXOUSIA HSE INTEGRATED MANAGEMENT SYSTEM - OPERATIONAL ANALYTICS SUMMARY'].map(sanitize).join(','));
    lines.push([`Generated: ${new Date().toISOString()}`, `Operating Facility: ${selectedSite === 'all' ? 'All Operating Facilities' : appState.sites.find(s => s.id === selectedSite)?.name}`].map(sanitize).join(','));
    lines.push([]);

    // 1. Reporting Trends
    lines.push(['1. REPORTING TRENDS BY OCCURRENCE MONTH'].map(sanitize).join(','));
    lines.push(['Month', 'Incidents', 'Near Misses (Distinct)', 'Hazard Observations', 'Total Occurrences'].map(sanitize).join(','));
    monthlyReportingTrends.forEach(m => {
      lines.push([m.monthLabel, m.incidents, m.nearMisses, m.hazards, m.total].map(sanitize).join(','));
    });
    lines.push([]);

    // 2. Action States
    lines.push(['2. CORRECTIVE & PREVENTIVE ACTION LIFECYCLE STATES'].map(sanitize).join(','));
    lines.push(['Status Category', 'Count', 'Percentage of Total Actions'].map(sanitize).join(','));
    const totAct = Math.max(1, filteredActions.length);
    lines.push(['Verified & Closed', closedActions.length, `${Math.round((closedActions.length / totAct) * 100)}%`].map(sanitize).join(','));
    lines.push(['Awaiting Independent Verification', awaitingVerificationActions.length, `${Math.round((awaitingVerificationActions.length / totAct) * 100)}%`].map(sanitize).join(','));
    lines.push(['In Progress', inProgressActions.length, `${Math.round((inProgressActions.length / totAct) * 100)}%`].map(sanitize).join(','));
    lines.push(['Open / Assigned', assignedOpenActions.length, `${Math.round((assignedOpenActions.length / totAct) * 100)}%`].map(sanitize).join(','));
    lines.push(['Returned for Rework', returnedForReworkActions.length, `${Math.round((returnedForReworkActions.length / totAct) * 100)}%`].map(sanitize).join(','));
    lines.push(['Calendar Overdue (Derived)', overdueActions.length, `${Math.round((overdueActions.length / totAct) * 100)}%`].map(sanitize).join(','));
    lines.push([]);

    // 3. Inspection Audit Yield
    lines.push(['3. INSPECTION AUDIT COMPLETION & CHECKLIST FINDINGS'].map(sanitize).join(','));
    lines.push(['Metric', 'Value'].map(sanitize).join(','));
    lines.push(['Total Scheduled Audits', totalInspections].map(sanitize).join(','));
    lines.push(['Completed Audits', completedInspections.length].map(sanitize).join(','));
    lines.push(['Inspection Completion Rate', `${inspectionCompletionRate}%`].map(sanitize).join(','));
    lines.push(['Checklist Items Audited', totalQuestionsAudited].map(sanitize).join(','));
    lines.push(['Pass Rate', `${checklistPassRate}%`].map(sanitize).join(','));
    lines.push(['Non-Conformance Findings Flagged', failedFindings].map(sanitize).join(','));
    lines.push([]);

    // 4. Risk Classification
    lines.push(['4. 5×5 RISK MATRIX CLASSIFICATION BREAKDOWN'].map(sanitize).join(','));
    lines.push(['Risk Band', 'Score Range', 'Classified Occurrences'].map(sanitize).join(','));
    lines.push(['Critical Risk', '17 - 25', criticalRiskCount].map(sanitize).join(','));
    lines.push(['High Risk', '10 - 16', highRiskCount].map(sanitize).join(','));
    lines.push(['Medium Risk', '5 - 9', mediumRiskCount].map(sanitize).join(','));
    lines.push(['Low Risk', '1 - 4', lowRiskCount].map(sanitize).join(','));
    lines.push(['Unclassified (Pending Review)', 'N/A', unclassifiedCount].map(sanitize).join(','));

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Exousia_HSE_Analytics_Summary_${selectedSite}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-[#15251C]">HSE Performance Analytics</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EEF7F2] text-[#007A44] border border-[#BDE3CE]">
              Contract Reconciled
            </span>
          </div>
          <p className="text-xs text-[#5D6961] mt-1">
            Operational trends, CAPA progression, audit completion, and 5×5 risk classification breakdowns.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Site Selector */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-[#DDE5DF] text-xs">
            <Building className="w-3.5 h-3.5 text-[#007A44] shrink-0" />
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="bg-transparent font-semibold text-[#15251C] focus:outline-hidden text-xs cursor-pointer"
            >
              <option value="all">All Facilities ({appState.sites.length})</option>
              {appState.sites.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle: Visual vs Accessible Tables */}
          <div className="inline-flex rounded-lg border border-[#DDE5DF] bg-white p-0.5 text-xs">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                viewMode === 'visual'
                  ? 'bg-[#EEF7F2] text-[#007A44]'
                  : 'text-[#5D6961] hover:text-[#15251C]'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Visual Dashboard</span>
            </button>
            <button
              onClick={() => setViewMode('tables')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                viewMode === 'tables'
                  ? 'bg-[#EEF7F2] text-[#007A44]'
                  : 'text-[#5D6961] hover:text-[#15251C]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Accessible Data Tables</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportAnalyticsCSV}
            className="px-3.5 py-1.5 bg-white border border-[#DDE5DF] hover:bg-[#F7F9F7] text-xs font-semibold text-[#15251C] rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Download complete operational analytics dataset as sanitized CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#007A44]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Contract Reporting Integrity Notice */}
      <div className="p-4 bg-[#F0F9FF] border border-[#B9E6FE] rounded-xl text-xs text-[#026AA2] flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-semibold">
            Contract Specification Section 10 · Reporting Integrity Standard:
          </strong>
          <p className="leading-relaxed">
            All metric counts strictly reconcile against confirmed records in the central demo repository. Conforming to specification governance, injury frequency ratios (LTIFR / TRIR) and automated "safety improvement" projections are strictly withheld until verified man-hour exposure logs and agreed calculation formulas are formally ratified by the operating client.
          </p>
        </div>
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Total Operational Reports"
          value={totalReports}
          subtitle={`${incidents.length} Inc · ${nearMisses.length} NM · ${hazards.length} Haz`}
        />
        <MetricCard
          label="CAPA Action Remediation"
          value={filteredActions.length}
          subtitle={`${closedActions.length} closed · ${overdueActions.length} overdue`}
          isAlert={overdueActions.length > 0}
        />
        <MetricCard
          label="Inspection Audit Rate"
          value={`${inspectionCompletionRate}%`}
          subtitle={`${completedInspections.length} of ${totalInspections} audits executed`}
        />
        <MetricCard
          label="Classified Occurrences"
          value={classifiedReports.length}
          subtitle={`${criticalRiskCount + highRiskCount} High/Critical ratings`}
          isAlert={criticalRiskCount > 0}
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. REPORTING TRENDS MODULE                                                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#DDE5DF] gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#15251C] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#007A44]" />
              <span>1. Reporting Trends & Event Distribution</span>
            </h2>
            <p className="text-xs text-[#5D6961] mt-0.5">
              Monthly occurrence rate of incidents, near misses, and proactive hazard observations.
            </p>
          </div>
          <span className="font-mono text-xs text-[#5D6961] bg-[#F7F9F7] px-2.5 py-1 rounded border border-[#DDE5DF]">
            Q3 - Q4 2026 Trend
          </span>
        </div>

        {viewMode === 'visual' ? (
          <div className="space-y-5">
            {/* Visual Bars */}
            <div className="space-y-4">
              {monthlyReportingTrends.map((m) => {
                const maxVal = Math.max(1, ...monthlyReportingTrends.map(x => x.total));
                return (
                  <div key={m.monthKey} className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-semibold text-[#15251C]">
                      <span>{m.monthLabel}</span>
                      <span className="font-mono text-[#5D6961]">
                        {m.incidents} Incidents · {m.nearMisses} Near Misses · {m.hazards} Hazards ({m.total} Total)
                      </span>
                    </div>

                    <div className="h-6 w-full bg-[#F7F9F7] rounded-lg overflow-hidden flex border border-[#DDE5DF]">
                      {m.incidents > 0 && (
                        <div
                          style={{ width: `${(m.incidents / maxVal) * 100}%` }}
                          className="bg-[#B42318] h-full flex items-center justify-center text-[10px] text-white font-bold px-1"
                          title={`${m.incidents} Incidents`}
                        >
                          {m.incidents}
                        </div>
                      )}
                      {m.nearMisses > 0 && (
                        <div
                          style={{ width: `${(m.nearMisses / maxVal) * 100}%` }}
                          className="bg-[#B54708] h-full flex items-center justify-center text-[10px] text-white font-bold px-1"
                          title={`${m.nearMisses} Near Misses`}
                        >
                          {m.nearMisses}
                        </div>
                      )}
                      {m.hazards > 0 && (
                        <div
                          style={{ width: `${(m.hazards / maxVal) * 100}%` }}
                          className="bg-[#007A44] h-full flex items-center justify-center text-[10px] text-white font-bold px-1"
                          title={`${m.hazards} Hazards`}
                        >
                          {m.hazards}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-[#DDE5DF] flex items-center justify-center gap-6 text-xs text-[#5D6961] flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#B42318]" />
                <span className="font-medium text-[#15251C]">Incidents ({incidents.length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#B54708]" />
                <span className="font-medium text-[#15251C]">Near Misses ({nearMisses.length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#007A44]" />
                <span className="font-medium text-[#15251C]">Hazard Observations ({hazards.length})</span>
              </span>
            </div>
          </div>
        ) : (
          /* Accessible Table Alternative */
          <div className="overflow-x-auto border border-[#DDE5DF] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <caption className="sr-only">Monthly occurrence trend data table</caption>
              <thead>
                <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                  <th scope="col" className="py-2.5 px-4">Reporting Period</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Incidents</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Near Misses</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Hazard Observations</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Total Occurrences</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE5DF]">
                {monthlyReportingTrends.map((m) => (
                  <tr key={m.monthKey} className="hover:bg-[#F7F9F7]">
                    <td className="py-2.5 px-4 font-semibold text-[#15251C]">{m.monthLabel}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#B42318] font-bold">{m.incidents}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#B54708] font-bold">{m.nearMisses}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#007A44] font-bold">{m.hazards}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-[#15251C]">{m.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F7F9F7] font-bold text-[#15251C] border-t border-[#DDE5DF]">
                  <td className="py-2.5 px-4">Total Occurrences</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#B42318]">{incidents.length}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#B54708]">{nearMisses.length}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#007A44]">{hazards.length}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{totalReports}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. CAPA ACTION LIFECYCLE STATES MODULE                                    */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#DDE5DF] gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#15251C] flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#007A44]" />
              <span>2. Corrective & Preventive Action (CAPA) Lifecycle States</span>
            </h2>
            <p className="text-xs text-[#5D6961] mt-0.5">
              Tracking through 6 stages: Assignment → Progress → Evidence → Rework → Verified Closure.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-[#007A44] bg-[#EEF7F2] px-2.5 py-1 rounded border border-[#BDE3CE]">
            {filteredActions.length} Total Tracked Actions
          </span>
        </div>

        {viewMode === 'visual' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Status Breakdown Grid */}
            <div className="space-y-2.5">
              <span className="font-semibold text-[#15251C] block text-xs">Lifecycle State Distribution</span>

              <div className="p-3 bg-[#EEF7F2] rounded-lg border border-[#BDE3CE] flex items-center justify-between">
                <span className="font-semibold text-[#007A44]">Verified & Closed (Two-person signoff)</span>
                <span className="font-bold text-sm text-[#007A44] font-mono">{closedActions.length}</span>
              </div>

              <div className="p-3 bg-[#F0F9FF] rounded-lg border border-[#B9E6FE] flex items-center justify-between">
                <span className="font-semibold text-[#026AA2]">Awaiting Independent Verification</span>
                <span className="font-bold text-sm text-[#026AA2] font-mono">{awaitingVerificationActions.length}</span>
              </div>

              <div className="p-3 bg-[#FFFAEB] rounded-lg border border-[#FEDF89] flex items-center justify-between">
                <span className="font-semibold text-[#B54708]">In Progress (Executing remediation)</span>
                <span className="font-bold text-sm text-[#B54708] font-mono">{inProgressActions.length}</span>
              </div>

              <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF] flex items-center justify-between">
                <span className="font-semibold text-[#5D6961]">Open / Assigned (Pending kickoff)</span>
                <span className="font-bold text-sm text-[#15251C] font-mono">{assignedOpenActions.length}</span>
              </div>

              <div className="p-3 bg-[#FFF0ED] rounded-lg border border-[#FECDCA] flex items-center justify-between">
                <span className="font-semibold text-[#B42318]">Returned for Rework (Evidence rejected)</span>
                <span className="font-bold text-sm text-[#B42318] font-mono">{returnedForReworkActions.length}</span>
              </div>

              <div className="p-3 bg-[#FFF0ED] rounded-lg border-2 border-[#B42318] flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-[#B42318] block">Calendar Overdue (Derived)</span>
                  <span className="text-[10px] text-[#5D6961]">Due date passed & lifecycle state is not closed</span>
                </div>
                <span className="font-bold text-base text-[#B42318] font-mono">{overdueActions.length}</span>
              </div>
            </div>

            {/* Action Classification & Priority Split */}
            <div className="space-y-4">
              <div>
                <span className="font-semibold text-[#15251C] block text-xs mb-2">Action Type Split</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF] text-center space-y-1">
                    <span className="text-[11px] text-[#5D6961]">Corrective Actions</span>
                    <span className="text-xl font-bold text-[#15251C] block">{correctiveActions.length}</span>
                    <span className="text-[10px] text-[#5D6961]">Fixes identified faults</span>
                  </div>
                  <div className="p-3.5 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF] text-center space-y-1">
                    <span className="text-[11px] text-[#5D6961]">Preventive Actions</span>
                    <span className="text-xl font-bold text-[#007A44] block">{preventiveActions.length}</span>
                    <span className="text-[10px] text-[#5D6961]">Proactive prevention</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-semibold text-[#15251C] block text-xs mb-2">Action Priority Breakdown</span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-[#7A271A]/10 rounded border border-[#7A271A]/30">
                    <span className="font-bold text-[#7A271A] text-xs">Critical Priority</span>
                    <span className="font-mono font-bold text-sm text-[#7A271A]">{priorityBreakdown.critical}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[#FFF0ED] rounded border border-[#FECDCA]">
                    <span className="font-bold text-[#B42318] text-xs">High Priority</span>
                    <span className="font-mono font-bold text-sm text-[#B42318]">{priorityBreakdown.high}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[#FFFAEB] rounded border border-[#FEDF89]">
                    <span className="font-bold text-[#B54708] text-xs">Medium Priority</span>
                    <span className="font-mono font-bold text-sm text-[#B54708]">{priorityBreakdown.medium}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[#EEF7F2] rounded border border-[#BDE3CE]">
                    <span className="font-bold text-[#007A44] text-xs">Low Priority</span>
                    <span className="font-mono font-bold text-sm text-[#007A44]">{priorityBreakdown.low}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Accessible Table Alternative */
          <div className="overflow-x-auto border border-[#DDE5DF] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <caption className="sr-only">CAPA lifecycle states and priority distribution table</caption>
              <thead>
                <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                  <th scope="col" className="py-2.5 px-4">Lifecycle State</th>
                  <th scope="col" className="py-2.5 px-4">Governing Definition</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Count</th>
                  <th scope="col" className="py-2.5 px-4 text-right">% of Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE5DF]">
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-[#007A44]">Verified & Closed</td>
                  <td className="py-2.5 px-4 text-[#5D6961]">Independently verified by authorized non-owner reviewer</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-[#007A44]">{closedActions.length}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{Math.round((closedActions.length / Math.max(1, filteredActions.length)) * 100)}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-[#026AA2]">Awaiting Verification</td>
                  <td className="py-2.5 px-4 text-[#5D6961]">Evidence submitted by owner; awaiting sign-off</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-[#026AA2]">{awaitingVerificationActions.length}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{Math.round((awaitingVerificationActions.length / Math.max(1, filteredActions.length)) * 100)}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-[#B54708]">In Progress</td>
                  <td className="py-2.5 px-4 text-[#5D6961]">Active remediation underway; parts or testing booked</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-[#B54708]">{inProgressActions.length}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{Math.round((inProgressActions.length / Math.max(1, filteredActions.length)) * 100)}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-[#5D6961]">Open / Assigned</td>
                  <td className="py-2.5 px-4 text-[#5D6961]">Assigned to owner; field remediation not yet commenced</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-[#15251C]">{assignedOpenActions.length}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{Math.round((assignedOpenActions.length / Math.max(1, filteredActions.length)) * 100)}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-[#B42318]">Returned for Rework</td>
                  <td className="py-2.5 px-4 text-[#5D6961]">Submitted evidence rejected by reviewer; revision required</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-[#B42318]">{returnedForReworkActions.length}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{Math.round((returnedForReworkActions.length / Math.max(1, filteredActions.length)) * 100)}%</td>
                </tr>
                <tr className="bg-[#FFF0ED]/40 font-bold">
                  <td className="py-2.5 px-4 text-[#B42318]">Calendar Overdue (Derived)</td>
                  <td className="py-2.5 px-4 text-[#5D6961] font-normal">Target completion date elapsed while action is not closed</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#B42318]">{overdueActions.length}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#B42318]">{Math.round((overdueActions.length / Math.max(1, filteredActions.length)) * 100)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. INSPECTION COMPLETION & AUDIT YIELD MODULE                             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#DDE5DF] gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#15251C] flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#007A44]" />
              <span>3. Inspection Audit Completion & Finding Yield</span>
            </h2>
            <p className="text-xs text-[#5D6961] mt-0.5">
              Checklist verification metrics, question compliance ratios, and corrective action generation.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-[#007A44] bg-[#EEF7F2] px-2.5 py-1 rounded border border-[#BDE3CE]">
            {inspectionCompletionRate}% Execution Rate
          </span>
        </div>

        {viewMode === 'visual' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#F7F9F7] rounded-xl border border-[#DDE5DF] space-y-2">
              <span className="font-semibold text-[#5D6961] block">Audit Execution Ratio</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#15251C]">{completedInspections.length}</span>
                <span className="text-sm text-[#5D6961]">of {totalInspections} audits executed</span>
              </div>
              <div className="w-full h-2.5 bg-[#DDE5DF] rounded-full overflow-hidden">
                <div
                  style={{ width: `${inspectionCompletionRate}%` }}
                  className="bg-[#007A44] h-full rounded-full transition-all"
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#5D6961] pt-1">
                <span>{scheduledInspections.length} Scheduled</span>
                <span>{completedInspections.length} Completed</span>
              </div>
            </div>

            <div className="p-4 bg-[#F7F9F7] rounded-xl border border-[#DDE5DF] space-y-2">
              <span className="font-semibold text-[#5D6961] block">Checklist Questions Audited</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#007A44]">{passedQuestions}</span>
                <span className="text-sm text-[#5D6961]">passed of {totalQuestionsAudited} questions</span>
              </div>
              <div className="w-full h-2.5 bg-[#DDE5DF] rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${checklistPassRate}%` }}
                  className="bg-[#007A44] h-full"
                  title="Passed"
                />
                <div
                  style={{ width: `${100 - checklistPassRate}%` }}
                  className="bg-[#B42318] h-full"
                  title="Failed Findings"
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#5D6961] pt-1">
                <span className="text-[#007A44] font-semibold">{checklistPassRate}% Pass</span>
                <span className="text-[#B42318] font-semibold">{failedFindings} Findings</span>
              </div>
            </div>

            <div className="p-4 bg-[#F7F9F7] rounded-xl border border-[#DDE5DF] space-y-2">
              <span className="font-semibold text-[#5D6961] block">Findings Linked to CAPA</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#B42318]">{failedFindings}</span>
                <span className="text-sm text-[#5D6961]">deficiencies flagged</span>
              </div>
              <p className="text-[11px] text-[#5D6961] leading-relaxed pt-1">
                Completing an inspection does <strong>not</strong> close outstanding corrective actions. Findings require independent verification before closure.
              </p>
            </div>
          </div>
        ) : (
          /* Accessible Table */
          <div className="overflow-x-auto border border-[#DDE5DF] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <caption className="sr-only">Inspection checklist performance table</caption>
              <thead>
                <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                  <th scope="col" className="py-2.5 px-4">Inspection Audit Ref</th>
                  <th scope="col" className="py-2.5 px-4">Operating Facility</th>
                  <th scope="col" className="py-2.5 px-4">Audit Status</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Items Audited</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Passed</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Findings (Failed)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE5DF]">
                {filteredInspections.map((ins) => {
                  const passCount = ins.items.filter(it => it.result === 'pass').length;
                  const failCount = ins.items.filter(it => it.result === 'fail').length;

                  return (
                    <tr key={ins.id} className="hover:bg-[#F7F9F7]">
                      <td className="py-2.5 px-4 font-mono font-bold text-[#15251C]">
                        {ins.inspectionNumber}
                        <span className="block font-normal text-[11px] text-[#5D6961] font-sans">{ins.title}</span>
                      </td>
                      <td className="py-2.5 px-4 text-[#5D6961]">{ins.siteName}</td>
                      <td className="py-2.5 px-4">
                        <Badge variant={ins.status === 'completed' ? 'success' : 'neutral'} size="sm">
                          {ins.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold">{ins.items.length}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#007A44] font-bold">{passCount}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#B42318] font-bold">{failCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. RISK CLASSIFICATION MODULE (5×5 MATRIX DISTRIBUTION)                   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#DDE5DF] gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#15251C] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#007A44]" />
              <span>4. Risk Classification & 5×5 Matrix Governance Breakdown</span>
            </h2>
            <p className="text-xs text-[#5D6961] mt-0.5">
              Score = Severity (1-5) × Likelihood (1-5). Evaluated exclusively by human HSE professionals.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-[#007A44] bg-[#EEF7F2] px-2.5 py-1 rounded border border-[#BDE3CE]">
            Scheme {appState.matrixConfig.version}
          </span>
        </div>

        {viewMode === 'visual' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Risk Band Tiles */}
            <div className="space-y-3">
              <span className="font-semibold text-[#15251C] block text-xs">Risk Band Distribution</span>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3.5 bg-[#7A271A]/10 rounded-lg border border-[#7A271A]/30 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#7A271A] block">Critical Risk</span>
                    <span className="text-[10px] text-[#5D6961]">Score 17 - 25</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-[#7A271A]">{criticalRiskCount}</span>
                </div>

                <div className="p-3.5 bg-[#FFF0ED] rounded-lg border border-[#FECDCA] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#B42318] block">High Risk</span>
                    <span className="text-[10px] text-[#5D6961]">Score 10 - 16</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-[#B42318]">{highRiskCount}</span>
                </div>

                <div className="p-3.5 bg-[#FFFAEB] rounded-lg border border-[#FEDF89] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#B54708] block">Medium Risk</span>
                    <span className="text-[10px] text-[#5D6961]">Score 5 - 9</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-[#B54708]">{mediumRiskCount}</span>
                </div>

                <div className="p-3.5 bg-[#EEF7F2] rounded-lg border border-[#BDE3CE] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#007A44] block">Low Risk</span>
                    <span className="text-[10px] text-[#5D6961]">Score 1 - 4</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-[#007A44]">{lowRiskCount}</span>
                </div>
              </div>

              {/* Reviewer Governance Strip */}
              <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF] flex items-center justify-between text-[11px] text-[#5D6961]">
                <span>Human HSE Sign-off Status:</span>
                <span className="font-semibold text-[#15251C]">
                  {verifiedClassifications} Verified Classifications · {provisionalEstimates} Provisional
                </span>
              </div>
            </div>

            {/* Standard Finding Categories */}
            <div className="space-y-2.5">
              <span className="font-semibold text-[#15251C] block text-xs">Category Taxonomy Frequency</span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {categoryStats.map((cs) => (
                  <div
                    key={cs.category}
                    className="p-2.5 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF] flex items-center justify-between"
                  >
                    <span className="font-medium text-[#15251C] truncate max-w-xs">{cs.category}</span>
                    <span className="font-mono font-bold text-[#007A44] shrink-0 text-xs">
                      {cs.total} tag{cs.total === 1 ? '' : 's'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Accessible Table */
          <div className="overflow-x-auto border border-[#DDE5DF] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <caption className="sr-only">5x5 risk matrix classification frequency table</caption>
              <thead>
                <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                  <th scope="col" className="py-2.5 px-4">Risk Classification Band</th>
                  <th scope="col" className="py-2.5 px-4">Mathematical Range</th>
                  <th scope="col" className="py-2.5 px-4">Required Action Protocol</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Classified Events</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE5DF]">
                <tr>
                  <td className="py-2.5 px-4 font-bold text-[#7A271A]">Critical Risk</td>
                  <td className="py-2.5 px-4 font-mono text-[#5D6961]">17 to 25</td>
                  <td className="py-2.5 px-4 text-[#5D6961]">Immediate work halt; stop work authority invoked</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-[#7A271A]">{criticalRiskCount}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-[#B42318]">High Risk</td>
                  <td className="py-2.5 px-4 font-mono text-[#5D6961]">10 to 16</td>
                  <td className="py-2.5 px-4 text-[#5D6961]">Urgent mitigation; formal CAPA mandatory within 24h</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-[#B42318]">{highRiskCount}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-[#B54708]">Medium Risk</td>
                  <td className="py-2.5 px-4 font-mono text-[#5D6961]">5 to 9</td>
                  <td className="py-2.5 px-4 text-[#5D6961]">Planned remediation; supervisor follow-up required</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-[#B54708]">{mediumRiskCount}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-[#007A44]">Low Risk</td>
                  <td className="py-2.5 px-4 font-mono text-[#5D6961]">1 to 4</td>
                  <td className="py-2.5 px-4 text-[#5D6961]">Routine housekeeping & local maintenance controls</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-[#007A44]">{lowRiskCount}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
