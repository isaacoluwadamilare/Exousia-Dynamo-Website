import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HSEAppState } from '../../services/hseDataService';
import { StatusBadge, RiskBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import {
  ClipboardCheck,
  Calendar,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  Search,
  Filter,
  Ban,
  Tag
} from 'lucide-react';
import { InspectionStatus, RiskBand } from '../../types/hse';

interface InspectionsPageProps {
  appState: HSEAppState;
}

export const InspectionsPage: React.FC<InspectionsPageProps> = ({ appState }) => {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'all' | InspectionStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [findingRiskFilter, setFindingRiskFilter] = useState<'all' | 'critical_high' | 'medium_low' | 'any_findings' | 'no_findings'>('all');

  useEffect(() => {
    const sParam = searchParams.get('status') as InspectionStatus;
    if (sParam && ['scheduled', 'in_progress', 'completed', 'cancelled'].includes(sParam)) {
      setTab(sParam);
    }
  }, [searchParams]);

  const baseInspections = appState.inspections.filter(i => {
    if (appState.activeSiteFilter !== 'all' && i.siteId !== appState.activeSiteFilter) return false;
    return true;
  });

  const filteredInspections = baseInspections.filter(i => {
    if (tab !== 'all' && i.status !== tab) return false;

    if (findingRiskFilter !== 'all') {
      const failedItems = i.items.filter(it => it.result === 'fail');
      if (findingRiskFilter === 'no_findings' && failedItems.length > 0) return false;
      if (findingRiskFilter === 'any_findings' && failedItems.length === 0) return false;
      if (findingRiskFilter === 'critical_high') {
        const hasCritHigh = failedItems.some(it => it.findingClassification?.band === 'critical' || it.findingClassification?.band === 'high');
        if (!hasCritHigh) return false;
      }
      if (findingRiskFilter === 'medium_low') {
        const hasMedLow = failedItems.some(it => it.findingClassification?.band === 'medium' || it.findingClassification?.band === 'low');
        if (!hasMedLow) return false;
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchBasic = (
        i.title.toLowerCase().includes(q) ||
        i.inspectionNumber.toLowerCase().includes(q) ||
        i.siteName.toLowerCase().includes(q) ||
        i.inspectorName.toLowerCase().includes(q)
      );
      const matchFindings = i.items.some(it =>
        (it.findingNote && it.findingNote.toLowerCase().includes(q)) ||
        (it.findingCategory && it.findingCategory.toLowerCase().includes(q))
      );
      return matchBasic || matchFindings;
    }
    return true;
  });

  const totalCount = baseInspections.length;
  const activeCount = baseInspections.filter(i => i.status === 'scheduled' || i.status === 'in_progress').length;
  const submittedCount = baseInspections.filter(i => i.status === 'submitted').length;
  const completedCount = baseInspections.filter(i => i.status === 'completed').length;
  const cancelledCount = baseInspections.filter(i => i.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#15251C]">HSE Inspections & Audits</h1>
          <p className="text-xs text-[#5D6961] mt-1">
            Standardized checklist inspections with version locking, finding classification, and linked action governance.
          </p>
        </div>

        <Link
          to="/app/inspections/new"
          className="inline-flex items-center gap-2 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Inspection</span>
        </Link>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[#DDE5DF] bg-white shadow-2xs">
          <div className="text-xs text-[#5D6961]">Total Inspections</div>
          <div className="text-2xl font-semibold text-[#15251C] mt-1">{totalCount}</div>
          <div className="text-[11px] text-[#5D6961] mt-0.5">Audits across authorized sites</div>
        </div>

        <div className="p-4 rounded-xl border border-[#DDE5DF] bg-white shadow-2xs">
          <div className="text-xs text-[#5D6961]">Active / In Progress</div>
          <div className="text-2xl font-semibold text-[#B54708] mt-1">{activeCount}</div>
          <div className="text-[11px] text-[#5D6961] mt-0.5">Scheduled or executing</div>
        </div>

        <div className="p-4 rounded-xl border border-[#DDE5DF] bg-white shadow-2xs">
          <div className="text-xs text-[#5D6961]">Submitted for Review</div>
          <div className="text-2xl font-semibold text-[#026AA2] mt-1">{submittedCount}</div>
          <div className="text-[11px] text-[#5D6961] mt-0.5">Awaiting supervisor sign-off</div>
        </div>

        <div className="p-4 rounded-xl border border-[#DDE5DF] bg-white shadow-2xs">
          <div className="text-xs text-[#5D6961]">Completed Audits</div>
          <div className="text-2xl font-semibold text-[#007A44] mt-1">{completedCount}</div>
          <div className="text-[11px] text-[#5D6961] mt-0.5">Signed off with findings logged</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#DDE5DF] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5D6961] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inspections by title, INS-code, site, or inspector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#DDE5DF] rounded-lg focus:outline-hidden focus:border-[#007A44] focus:ring-1 focus:ring-[#007A44]"
          />
        </div>

        {/* State Tabs & Risk Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={findingRiskFilter}
            onChange={(e) => setFindingRiskFilter(e.target.value as any)}
            className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-1.5 bg-white text-[#15251C] outline-hidden cursor-pointer"
          >
            <option value="all">All Finding Dispositions</option>
            <option value="critical_high">Critical / High Risk Findings</option>
            <option value="medium_low">Medium / Low Risk Findings</option>
            <option value="any_findings">With Findings</option>
            <option value="no_findings">Zero Non-conformances</option>
          </select>

          <div className="flex items-center gap-1 overflow-x-auto text-xs p-0.5 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF]">
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                tab === 'all' ? 'bg-white shadow-2xs text-[#15251C]' : 'text-[#5D6961] hover:text-[#15251C]'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setTab('scheduled')}
              className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                tab === 'scheduled' ? 'bg-white shadow-2xs text-[#15251C]' : 'text-[#5D6961] hover:text-[#15251C]'
              }`}
            >
              Scheduled
            </button>
            <button
              onClick={() => setTab('in_progress')}
              className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                tab === 'in_progress' ? 'bg-white shadow-2xs text-[#15251C]' : 'text-[#5D6961] hover:text-[#15251C]'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setTab('submitted')}
              className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                tab === 'submitted' ? 'bg-white shadow-2xs text-[#026AA2]' : 'text-[#5D6961] hover:text-[#15251C]'
              }`}
            >
              Submitted ({submittedCount})
            </button>
            <button
              onClick={() => setTab('completed')}
              className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                tab === 'completed' ? 'bg-white shadow-2xs text-[#007A44]' : 'text-[#5D6961] hover:text-[#15251C]'
              }`}
            >
              Completed ({completedCount})
            </button>
            {cancelledCount > 0 && (
              <button
                onClick={() => setTab('cancelled')}
                className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                  tab === 'cancelled' ? 'bg-white shadow-2xs text-[#B42318]' : 'text-[#5D6961] hover:text-[#15251C]'
                }`}
              >
                Cancelled ({cancelledCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inspections List */}
      <div className="space-y-3">
        {filteredInspections.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#DDE5DF] shadow-xs">
            <EmptyState
              icon={ClipboardCheck}
              title="No inspections found"
              description="No inspection records match the current status filter, findings risk criteria, or search query."
              actionLabel="Reset filters"
              onAction={() => {
                setTab('all');
                setFindingRiskFilter('all');
                setSearchQuery('');
              }}
            />
          </div>
        ) : (
          filteredInspections.map((ins) => {
            const failedItems = ins.items.filter(it => it.result === 'fail' && it.findingClassification);
            const highestFinding = [...failedItems].sort(
              (a, b) => (b.findingClassification?.score || 0) - (a.findingClassification?.score || 0)
            )[0];

            return (
              <div
                key={ins.id}
                className="p-5 rounded-xl border border-[#DDE5DF] bg-white hover:border-[#007A44]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#15251C]">
                      {ins.inspectionNumber}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#EEF7F2] text-[#007A44] border border-[#BDE3CE]">
                      Template v{ins.templateVersion}
                    </span>
                    <StatusBadge status={ins.status} />
                    {ins.findingsCount > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[#FFF0ED] text-[#B42318] font-bold border border-[#FECDCA]">
                        {ins.findingsCount} Defect Finding{ins.findingsCount === 1 ? '' : 's'}
                      </span>
                    )}
                    {highestFinding?.findingClassification && (
                      <RiskBadge
                        band={highestFinding.findingClassification.band}
                        score={highestFinding.findingClassification.score}
                        matrixVersion={highestFinding.findingClassification.matrixVersion}
                        showDetails
                      />
                    )}
                    {ins.linkedActionIds.length > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[#F7F9F7] text-[#5D6961] border border-[#DDE5DF]">
                        {ins.linkedActionIds.length} Linked Action{ins.linkedActionIds.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-[#15251C]">{ins.title}</h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#5D6961]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#007A44]" />
                    {ins.siteName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#5D6961]" />
                    Date: {ins.scheduledDate}
                  </span>
                  <span>Inspector: <strong>{ins.inspectorName}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to={`/app/inspections/${ins.id}`}
                  className="px-4 py-2 bg-[#EEF7F2] hover:bg-[#BDE3CE] text-[#007A44] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <span>{ins.status === 'completed' ? 'View Results' : ins.status === 'cancelled' ? 'View Record' : 'Execute Checklist'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
};
