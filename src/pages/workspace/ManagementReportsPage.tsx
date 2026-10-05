import React, { useState } from 'react';
import { HSEAppState, hseDataService } from '../../services/hseDataService';
import {
  FileBarChart,
  Download,
  Printer,
  FileText,
  Calendar,
  Building,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Info,
  Table as TableIcon
} from 'lucide-react';
import { ExousiaLogo } from '../../components/ExousiaLogo';
import { CONTRACT_CLIENT_DISPLAY, DELIVERY_CONTRACTOR } from '../../constants/contractScope';
import { Badge, RiskBadge, ComplianceStateBadge, ActionStatusBadge } from '../../components/Badge';

interface ManagementReportsPageProps {
  appState: HSEAppState;
}

type ReportSubject = 'executive' | 'incidents' | 'hazards' | 'actions' | 'inspections' | 'compliance';

export const ManagementReportsPage: React.FC<ManagementReportsPageProps> = ({ appState }) => {
  const [reportType, setReportType] = useState<ReportSubject>('executive');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [reportDate, setReportDate] = useState<string>('2026-10-02');

  // Filter records by selected site
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

  // Calculate live metrics for selected scope
  const openIncidents = filteredReports.filter(r => r.type === 'incident' && r.status !== 'closed' && r.status !== 'dismissed');
  const nearMisses = filteredReports.filter(r => r.type === 'near_miss');
  const hazards = filteredReports.filter(r => r.type === 'hazard');
  const openActions = filteredActions.filter(a => a.status !== 'closed');
  const overdueActions = openActions.filter(a => a.dueDate < reportDate);
  const awaitingVerificationActions = filteredActions.filter(a => a.status === 'awaiting_verification' || a.status === 'evidence_submitted');
  const closedActions = filteredActions.filter(a => a.status === 'closed');
  const completedInspections = filteredInspections.filter(i => i.status === 'completed');
  const scheduledInspections = filteredInspections.filter(i => i.status === 'scheduled');
  const compliantObligations = filteredCompliance.filter(c => c.complianceState === 'compliant');
  const nonCompliantObligations = filteredCompliance.filter(c => c.complianceState === 'non_compliant');

  // CSV Export Handler with Formula Escaping
  const handleDownloadCSV = () => {
    const sanitize = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      // Escaping spreadsheet formula injection characters: = + - @ \t \r
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str}"`;
    };

    const lines: string[] = [];
    lines.push([`EXOUSIA INTEGRATED HSE MANAGEMENT SYSTEM - OFFICIAL REPORT EXTRACT`].map(sanitize).join(','));
    lines.push([`Subject: ${reportType.toUpperCase()}`, `Operating Facility: ${selectedSite === 'all' ? 'All Operating Facilities' : appState.sites.find(s => s.id === selectedSite)?.name}`, `Date: ${reportDate}`].map(sanitize).join(','));
    lines.push([]);

    if (reportType === 'executive') {
      lines.push(['METRIC SUMMARY', 'VALUE'].map(sanitize).join(','));
      lines.push(['Open Incidents', openIncidents.length].map(sanitize).join(','));
      lines.push(['Near Misses (Distinct)', nearMisses.length].map(sanitize).join(','));
      lines.push(['Hazard Observations', hazards.length].map(sanitize).join(','));
      lines.push(['Total Actions Tracked', filteredActions.length].map(sanitize).join(','));
      lines.push(['Verified & Closed Actions', closedActions.length].map(sanitize).join(','));
      lines.push(['Awaiting Verification Actions', awaitingVerificationActions.length].map(sanitize).join(','));
      lines.push(['Calendar Overdue Actions', overdueActions.length].map(sanitize).join(','));
      lines.push(['Scheduled Inspection Audits', scheduledInspections.length].map(sanitize).join(','));
      lines.push(['Completed Inspection Audits', completedInspections.length].map(sanitize).join(','));
      lines.push(['Assessed Compliant Obligations', compliantObligations.length].map(sanitize).join(','));
      lines.push(['Non-Compliant Deficiencies', nonCompliantObligations.length].map(sanitize).join(','));
    } else if (reportType === 'incidents') {
      lines.push(['Report Number', 'Type', 'Title', 'Facility', 'Specific Location', 'Occurred Date', 'Status', 'Risk Score', 'Risk Band', 'Reporter', 'Immediate Action'].map(sanitize).join(','));
      filteredReports.filter(r => r.type === 'incident' || r.type === 'near_miss').forEach(r => {
        lines.push([
          r.reportNumber,
          r.type.replace('_', ' ').toUpperCase(),
          r.title,
          r.siteName,
          r.specificLocation,
          r.occurredAt,
          r.status,
          r.classification?.score || 'Unrated',
          r.classification?.band || 'Unclassified',
          r.reporterName,
          r.immediateActionTaken || ''
        ].map(sanitize).join(','));
      });
    } else if (reportType === 'hazards') {
      lines.push(['Hazard Number', 'Title', 'Facility', 'Specific Location', 'Reported Date', 'Status', 'Risk Score', 'Risk Band', 'Reporter', 'Immediate Action'].map(sanitize).join(','));
      hazards.forEach(h => {
        lines.push([
          h.reportNumber,
          h.title,
          h.siteName,
          h.specificLocation,
          h.reportedAt,
          h.status,
          h.classification?.score || 'Unrated',
          h.classification?.band || 'Unclassified',
          h.reporterName,
          h.immediateActionTaken || ''
        ].map(sanitize).join(','));
      });
    } else if (reportType === 'actions') {
      lines.push(['Action Number', 'Type', 'Title', 'Source Number', 'Facility', 'Owner', 'Due Date', 'Status', 'Is Overdue', 'Priority', 'Assigned By'].map(sanitize).join(','));
      filteredActions.forEach(a => {
        lines.push([
          a.actionNumber,
          a.actionType.toUpperCase(),
          a.title,
          a.sourceNumber,
          a.siteName,
          a.ownerName,
          a.dueDate,
          a.status,
          a.dueDate < reportDate && a.status !== 'closed' ? 'YES' : 'NO',
          a.priority.toUpperCase(),
          a.assignedByName
        ].map(sanitize).join(','));
      });
    } else if (reportType === 'inspections') {
      lines.push(['Inspection Number', 'Title', 'Category', 'Facility', 'Scheduled Date', 'Status', 'Findings Count', 'Inspector', 'Completed Date'].map(sanitize).join(','));
      filteredInspections.forEach(i => {
        lines.push([
          i.inspectionNumber,
          i.title,
          i.templateVersion,
          i.siteName,
          i.scheduledDate,
          i.status,
          i.findingsCount,
          i.inspectorName,
          i.completedAt || 'Pending'
        ].map(sanitize).join(','));
      });
    } else if (reportType === 'compliance') {
      lines.push(['Obligation Ref', 'Title', 'Source Reference', 'Governing Body', 'Custodian', 'Due Date', 'Compliance State', 'Evidence Docs Count'].map(sanitize).join(','));
      filteredCompliance.forEach(c => {
        lines.push([
          c.obligationNumber,
          c.title,
          c.sourceReference,
          c.regulatorOrAuthority,
          c.ownerName,
          c.dueDate,
          c.complianceState.toUpperCase(),
          c.evidenceAttachments.length
        ].map(sanitize).join(','));
      });
    }

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Exousia_HSE_Report_${reportType}_${selectedSite}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Controls Bar (Hidden during Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-[#15251C]">Management Reports & Formal Extracts</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EEF7F2] text-[#007A44] border border-[#BDE3CE]">
              Official Document Engine
            </span>
          </div>
          <p className="text-xs text-[#5D6961] mt-1">
            Produce printable executive summaries, audit logs, and formula-sanitized CSV register files.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-white border border-[#DDE5DF] hover:bg-[#F7F9F7] text-xs font-semibold text-[#15251C] rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Download formatted CSV with formula-injection sanitization"
          >
            <Download className="w-4 h-4 text-[#007A44]" />
            <span>Download CSV (Sanitized)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Scope Selectors & Subject Tabs (Hidden during Print) */}
      <div className="bg-white p-4 rounded-xl border border-[#DDE5DF] space-y-3 print:hidden text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Report Subject Selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <span className="font-semibold text-[#15251C] mr-2 shrink-0">Report Subject:</span>
            {[
              { id: 'executive', label: 'Executive Summary' },
              { id: 'incidents', label: 'Incidents & Near Misses' },
              { id: 'hazards', label: 'Hazard Observations' },
              { id: 'actions', label: 'CAPA Action Register' },
              { id: 'inspections', label: 'Inspection Audit Log' },
              { id: 'compliance', label: 'Compliance Register' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id as ReportSubject)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  reportType === tab.id
                    ? 'bg-[#EEF7F2] text-[#007A44] shadow-2xs'
                    : 'text-[#5D6961] hover:text-[#15251C] hover:bg-black/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Facility Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-[#F7F9F7] px-2.5 py-1.5 rounded-lg border border-[#DDE5DF]">
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
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FORMAL PRINTABLE DOCUMENT CONTAINER                                       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-8 space-y-6 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 text-xs">
        {/* Document Header with Logo and Institutional Context */}
        <div className="flex items-start justify-between pb-6 border-b-2 border-[#15251C] gap-4">
          <div className="space-y-1">
            <ExousiaLogo variant="full" theme="light" height={44} />
            <div className="text-[11px] text-[#5D6961] pt-2">
              <strong>Delivery Contractor:</strong> {DELIVERY_CONTRACTOR}
            </div>
            <div className="text-[11px] text-[#5D6961]">
              <strong>Operating Client:</strong> {CONTRACT_CLIENT_DISPLAY}
            </div>
            <div className="text-[11px] text-[#5D6961]">
              <strong>Scope Facility:</strong> {selectedSite === 'all' ? 'All Operating Facilities (Corporate Scope)' : appState.sites.find(s => s.id === selectedSite)?.name}
            </div>
          </div>

          <div className="text-right text-xs space-y-1">
            <div className="font-bold text-sm text-[#15251C] uppercase tracking-wide">
              {reportType === 'executive' && 'HSE Monthly Executive Management Report'}
              {reportType === 'incidents' && 'Incident & Near Miss Monitoring Register'}
              {reportType === 'hazards' && 'Proactive Hazard Observation Register'}
              {reportType === 'actions' && 'Corrective & Preventive Action (CAPA) Log'}
              {reportType === 'inspections' && 'Checklist Inspection & Audit Log'}
              {reportType === 'compliance' && 'Statutory & Corporate Compliance Status'}
            </div>
            <div className="text-[#5D6961]">Generated Date: <strong>{new Date(reportDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></div>
            <div className="text-[#5D6961]">Timezone: Africa/Lagos (UTC+1 WAT)</div>
            <div className="inline-block mt-1 font-bold text-[10px] text-[#007A44] bg-[#EEF7F2] px-2 py-0.5 rounded border border-[#BDE3CE]">
              Official Record Extract
            </div>
          </div>
        </div>

        {/* Executive KPI Summary Grid (Included on Executive report, or top strip) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#15251C]">
              Operational Key Metric Summary
            </h2>
            <span className="text-[10px] text-[#5D6961] italic">
              Governed by Exousia HSE Build Specification Section 10
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-[#F7F9F7] rounded border border-[#DDE5DF]">
              <span className="text-[#5D6961] text-[10px] block font-semibold uppercase">Open Incidents</span>
              <span className="text-xl font-bold text-[#15251C] mt-0.5 block font-mono">{openIncidents.length}</span>
              <span className="text-[9px] text-[#5D6961]">Asset / Process</span>
            </div>
            <div className="p-3 bg-[#EEF7F2] rounded border border-[#BDE3CE]">
              <span className="text-[#007A44] text-[10px] block font-semibold uppercase">Near Misses</span>
              <span className="text-xl font-bold text-[#007A44] mt-0.5 block font-mono">{nearMisses.length}</span>
              <span className="text-[9px] text-[#5D6961]">Barrier failures</span>
            </div>
            <div className="p-3 bg-[#F7F9F7] rounded border border-[#DDE5DF]">
              <span className="text-[#5D6961] text-[10px] block font-semibold uppercase">Hazards Flagged</span>
              <span className="text-xl font-bold text-[#15251C] mt-0.5 block font-mono">{hazards.length}</span>
              <span className="text-[9px] text-[#5D6961]">Proactive catches</span>
            </div>
            <div className="p-3 bg-[#FFFAEB] rounded border border-[#FEDF89]">
              <span className="text-[#B54708] text-[10px] block font-semibold uppercase">Open Actions</span>
              <span className="text-xl font-bold text-[#B54708] mt-0.5 block font-mono">{openActions.length}</span>
              <span className="text-[9px] text-[#5D6961]">Remediation active</span>
            </div>
            <div className="p-3 bg-[#FFF0ED] rounded border border-[#FECDCA]">
              <span className="text-[#B42318] text-[10px] block font-semibold uppercase">Overdue Actions</span>
              <span className="text-xl font-bold text-[#B42318] mt-0.5 block font-mono">{overdueActions.length}</span>
              <span className="text-[9px] text-[#5D6961]">Target elapsed</span>
            </div>
            <div className="p-3 bg-[#EEF7F2] rounded border border-[#BDE3CE]">
              <span className="text-[#007A44] text-[10px] block font-semibold uppercase">Audits Executed</span>
              <span className="text-xl font-bold text-[#007A44] mt-0.5 block font-mono">{completedInspections.length}</span>
              <span className="text-[9px] text-[#5D6961]">Checklist audits</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DETAILED ACCESSIBLE DATA TABLES FOR EACH REPORT TYPE                     */}
        {/* ========================================================================= */}

        {/* 1. EXECUTIVE REPORT COMBINED TABLE */}
        {reportType === 'executive' && (
          <div className="space-y-6 pt-2">
            <div>
              <h3 className="text-sm font-semibold text-[#15251C] mb-2">Priority Attention Queue Items</h3>
              <div className="overflow-x-auto border border-[#DDE5DF] rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <caption className="sr-only">Executive summary attention queue table</caption>
                  <thead>
                    <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                      <th scope="col" className="py-2 px-3">Ref ID</th>
                      <th scope="col" className="py-2 px-3">Subject / Event Title</th>
                      <th scope="col" className="py-2 px-3">Facility</th>
                      <th scope="col" className="py-2 px-3">Priority / Risk</th>
                      <th scope="col" className="py-2 px-3">Due / Occurrence</th>
                      <th scope="col" className="py-2 px-3">Current Operational Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE5DF]">
                    {overdueActions.map((a) => (
                      <tr key={a.id} className="hover:bg-[#F7F9F7]">
                        <td className="py-2 px-3 font-mono font-bold text-[#B42318]">{a.actionNumber}</td>
                        <td className="py-2 px-3 font-semibold text-[#15251C]">{a.title}</td>
                        <td className="py-2 px-3 text-[#5D6961]">{a.siteName}</td>
                        <td className="py-2 px-3"><RiskBadge band={a.priority} /></td>
                        <td className="py-2 px-3 font-mono text-[#B42318] font-bold">{a.dueDate} (Overdue)</td>
                        <td className="py-2 px-3"><ActionStatusBadge status={a.status} isOverdue={true} /></td>
                      </tr>
                    ))}
                    {openIncidents.map((inc) => (
                      <tr key={inc.id} className="hover:bg-[#F7F9F7]">
                        <td className="py-2 px-3 font-mono font-bold text-[#15251C]">{inc.reportNumber}</td>
                        <td className="py-2 px-3 font-semibold text-[#15251C]">{inc.title}</td>
                        <td className="py-2 px-3 text-[#5D6961]">{inc.siteName}</td>
                        <td className="py-2 px-3"><RiskBadge band={inc.classification?.band} /></td>
                        <td className="py-2 px-3 font-mono text-[#5D6961]">{new Date(inc.occurredAt).toLocaleDateString('en-GB')}</td>
                        <td className="py-2 px-3"><Badge variant="warning">{inc.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#15251C] mb-2">Compliance Governance Snapshot</h3>
              <div className="overflow-x-auto border border-[#DDE5DF] rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <caption className="sr-only">Executive summary compliance obligations table</caption>
                  <thead>
                    <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                      <th scope="col" className="py-2 px-3">Ref ID</th>
                      <th scope="col" className="py-2 px-3">Obligation Title & Standard Reference</th>
                      <th scope="col" className="py-2 px-3">Authority</th>
                      <th scope="col" className="py-2 px-3">Target Due Date</th>
                      <th scope="col" className="py-2 px-3">Assessed State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE5DF]">
                    {filteredCompliance.map((c) => (
                      <tr key={c.id} className="hover:bg-[#F7F9F7]">
                        <td className="py-2 px-3 font-mono font-bold text-[#15251C]">{c.obligationNumber}</td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-[#15251C] block">{c.title}</span>
                          <span className="font-mono text-[10px] text-[#5D6961]">{c.sourceReference}</span>
                        </td>
                        <td className="py-2 px-3 text-[#5D6961]">{c.regulatorOrAuthority}</td>
                        <td className="py-2 px-3 font-mono">{c.dueDate}</td>
                        <td className="py-2 px-3"><ComplianceStateBadge state={c.complianceState} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. INCIDENTS & NEAR MISSES REGISTER */}
        {reportType === 'incidents' && (
          <div className="overflow-x-auto border border-[#DDE5DF] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <caption className="sr-only">Incident and near miss official register table</caption>
              <thead>
                <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                  <th scope="col" className="py-2.5 px-3">Report Ref</th>
                  <th scope="col" className="py-2.5 px-3">Type</th>
                  <th scope="col" className="py-2.5 px-3">Title & Location</th>
                  <th scope="col" className="py-2.5 px-3">Facility</th>
                  <th scope="col" className="py-2.5 px-3">Date</th>
                  <th scope="col" className="py-2.5 px-3">Risk Band</th>
                  <th scope="col" className="py-2.5 px-3">Immediate Action Taken</th>
                  <th scope="col" className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE5DF]">
                {filteredReports.filter(r => r.type === 'incident' || r.type === 'near_miss').map((r) => (
                  <tr key={r.id} className="hover:bg-[#F7F9F7]">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#15251C]">{r.reportNumber}</td>
                    <td className="py-2.5 px-3 font-bold uppercase text-[10px]">
                      {r.type === 'incident' ? (
                        <span className="text-[#B42318]">Incident</span>
                      ) : (
                        <span className="text-[#B54708]">Near Miss</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 max-w-xs">
                      <span className="font-semibold text-[#15251C] block">{r.title}</span>
                      <span className="text-[10px] text-[#5D6961]">{r.specificLocation}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#5D6961]">{r.siteName}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{new Date(r.occurredAt).toLocaleDateString('en-GB')}</td>
                    <td className="py-2.5 px-3"><RiskBadge band={r.classification?.band} /></td>
                    <td className="py-2.5 px-3 text-[#5D6961] max-w-xs truncate">{r.immediateActionTaken || 'None logged'}</td>
                    <td className="py-2.5 px-3"><Badge variant="neutral">{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. HAZARDS REGISTER */}
        {reportType === 'hazards' && (
          <div className="overflow-x-auto border border-[#DDE5DF] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <caption className="sr-only">Hazard observation official register table</caption>
              <thead>
                <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                  <th scope="col" className="py-2.5 px-3">Hazard Ref</th>
                  <th scope="col" className="py-2.5 px-3">Observation Title & Location</th>
                  <th scope="col" className="py-2.5 px-3">Facility</th>
                  <th scope="col" className="py-2.5 px-3">Reported By</th>
                  <th scope="col" className="py-2.5 px-3">Risk Band</th>
                  <th scope="col" className="py-2.5 px-3">Category</th>
                  <th scope="col" className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE5DF]">
                {hazards.map((h) => (
                  <tr key={h.id} className="hover:bg-[#F7F9F7]">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#007A44]">{h.reportNumber}</td>
                    <td className="py-2.5 px-3 max-w-xs">
                      <span className="font-semibold text-[#15251C] block">{h.title}</span>
                      <span className="text-[10px] text-[#5D6961]">{h.specificLocation}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#5D6961]">{h.siteName}</td>
                    <td className="py-2.5 px-3 text-[#5D6961]">{h.reporterName}</td>
                    <td className="py-2.5 px-3"><RiskBadge band={h.classification?.band} /></td>
                    <td className="py-2.5 px-3 text-[#5D6961]">{h.classification?.category || 'General Safety'}</td>
                    <td className="py-2.5 px-3"><Badge variant="neutral">{h.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. CAPA ACTIONS REGISTER */}
        {reportType === 'actions' && (
          <div className="overflow-x-auto border border-[#DDE5DF] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <caption className="sr-only">CAPA action register table</caption>
              <thead>
                <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                  <th scope="col" className="py-2.5 px-3">Action Ref</th>
                  <th scope="col" className="py-2.5 px-3">Type</th>
                  <th scope="col" className="py-2.5 px-3">Action Title & Source</th>
                  <th scope="col" className="py-2.5 px-3">Facility</th>
                  <th scope="col" className="py-2.5 px-3">Owner</th>
                  <th scope="col" className="py-2.5 px-3">Due Date</th>
                  <th scope="col" className="py-2.5 px-3">Priority</th>
                  <th scope="col" className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE5DF]">
                {filteredActions.map((a) => {
                  const isOverdue = a.dueDate < reportDate && a.status !== 'closed';
                  return (
                    <tr key={a.id} className="hover:bg-[#F7F9F7]">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#15251C]">{a.actionNumber}</td>
                      <td className="py-2.5 px-3 font-semibold uppercase text-[10px]">
                        {a.actionType === 'corrective' ? (
                          <span className="text-[#B42318]">Corrective</span>
                        ) : (
                          <span className="text-[#007A44]">Preventive</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <span className="font-semibold text-[#15251C] block">{a.title}</span>
                        <span className="text-[10px] text-[#5D6961]">Source: {a.sourceNumber}</span>
                      </td>
                      <td className="py-2.5 px-3 text-[#5D6961]">{a.siteName}</td>
                      <td className="py-2.5 px-3 font-medium text-[#15251C]">{a.ownerName}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold">
                        <span className={isOverdue ? 'text-[#B42318]' : 'text-[#15251C]'}>
                          {a.dueDate} {isOverdue && '(Overdue)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3"><RiskBadge band={a.priority} /></td>
                      <td className="py-2.5 px-3"><ActionStatusBadge status={a.status} isOverdue={isOverdue} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. INSPECTION AUDIT LOG */}
        {reportType === 'inspections' && (
          <div className="overflow-x-auto border border-[#DDE5DF] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <caption className="sr-only">Checklist inspection audit log table</caption>
              <thead>
                <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                  <th scope="col" className="py-2.5 px-3">Audit Ref</th>
                  <th scope="col" className="py-2.5 px-3">Checklist Template Title</th>
                  <th scope="col" className="py-2.5 px-3">Facility</th>
                  <th scope="col" className="py-2.5 px-3">Inspector</th>
                  <th scope="col" className="py-2.5 px-3">Scheduled Date</th>
                  <th scope="col" className="py-2.5 px-3">Findings</th>
                  <th scope="col" className="py-2.5 px-3">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE5DF]">
                {filteredInspections.map((i) => (
                  <tr key={i.id} className="hover:bg-[#F7F9F7]">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#15251C]">{i.inspectionNumber}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#15251C]">{i.title}</td>
                    <td className="py-2.5 px-3 text-[#5D6961]">{i.siteName}</td>
                    <td className="py-2.5 px-3 text-[#5D6961]">{i.inspectorName}</td>
                    <td className="py-2.5 px-3 font-mono">{i.scheduledDate}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#B42318]">{i.findingsCount} Deficiencies</td>
                    <td className="py-2.5 px-3"><Badge variant={i.status === 'completed' ? 'success' : 'neutral'}>{i.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. COMPLIANCE REGISTER */}
        {reportType === 'compliance' && (
          <div className="overflow-x-auto border border-[#DDE5DF] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <caption className="sr-only">Compliance obligations register table</caption>
              <thead>
                <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                  <th scope="col" className="py-2.5 px-3">Ref Code</th>
                  <th scope="col" className="py-2.5 px-3">Obligation Title & Standard Reference</th>
                  <th scope="col" className="py-2.5 px-3">Governing Authority</th>
                  <th scope="col" className="py-2.5 px-3">Custodian</th>
                  <th scope="col" className="py-2.5 px-3">Recertification Due</th>
                  <th scope="col" className="py-2.5 px-3">Assessed Compliance State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE5DF]">
                {filteredCompliance.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F7F9F7]">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#15251C]">{c.obligationNumber}</td>
                    <td className="py-2.5 px-3 max-w-xs">
                      <span className="font-semibold text-[#15251C] block">{c.title}</span>
                      <span className="font-mono text-[10px] text-[#5D6961]">{c.sourceReference}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#5D6961]">{c.regulatorOrAuthority}</td>
                    <td className="py-2.5 px-3 text-[#15251C] font-medium">{c.ownerName}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold">{c.dueDate}</td>
                    <td className="py-2.5 px-3"><ComplianceStateBadge state={c.complianceState} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Formal Document Sign-Off Box */}
        <div className="pt-8 border-t-2 border-[#15251C] grid grid-cols-2 sm:grid-cols-3 gap-6 text-[11px] text-[#5D6961]">
          <div>
            <span className="block font-bold text-[#15251C]">Prepared By:</span>
            <span className="block mt-1">{appState.currentUser.name} ({appState.currentUser.roleTitle})</span>
            <span className="block font-mono text-[10px] text-[#5D6961] mt-0.5">{appState.currentUser.email}</span>
          </div>

          <div>
            <span className="block font-bold text-[#15251C]">HSE Management Verification:</span>
            <span className="block mt-1">Josephine Yese (HSE General Manager)</span>
            <span className="block text-[10px] text-[#007A44] font-semibold mt-0.5">Certified Authentic Record</span>
          </div>

          <div>
            <span className="block font-bold text-[#15251C]">Operating Client Delivery:</span>
            <span className="block mt-1">{CONTRACT_CLIENT_DISPLAY}</span>
            <span className="block font-mono text-[10px] text-[#5D6961] mt-0.5">Contract Clause 10 Verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};
