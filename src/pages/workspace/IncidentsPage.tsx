import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HSEAppState } from '../../services/hseDataService';
import { StatusBadge, RiskBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import {
  AlertOctagon,
  Search,
  Filter,
  Plus,
  ShieldAlert,
  ArrowRight,
  Clock,
  Calendar,
  Sliders
} from 'lucide-react';
import { RiskBand } from '../../types/hse';

interface IncidentsPageProps {
  appState: HSEAppState;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({ appState }) => {
  const [searchParams] = useSearchParams();
  const [typeFilter, setTypeFilter] = useState<'all' | 'incident' | 'near_miss'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskBand | 'unrated'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const tParam = searchParams.get('type');
    if (tParam === 'incident' || tParam === 'near_miss') {
      setTypeFilter(tParam);
    }
    const sParam = searchParams.get('status');
    if (sParam) {
      setStatusFilter(sParam);
    }
  }, [searchParams]);

  // Exclude hazards from this register (hazards have their own dedicated register)
  const baseReports = appState.reports.filter(r => r.type === 'incident' || r.type === 'near_miss');

  const filteredReports = baseReports.filter(r => {
    if (appState.activeSiteFilter !== 'all' && r.siteId !== appState.activeSiteFilter) return false;
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    
    // Status filter handling (including 'open' and 'awaiting_review')
    if (statusFilter !== 'all') {
      if (statusFilter === 'open') {
        if (r.status === 'closed' || r.status === 'dismissed') return false;
      } else if (statusFilter === 'awaiting_review') {
        if (r.status !== 'submitted' && r.status !== 'under_review') return false;
      } else if (r.status !== statusFilter) {
        return false;
      }
    }

    if (categoryFilter !== 'all' && r.classification?.category !== categoryFilter) return false;
    if (riskFilter !== 'all') {
      if (riskFilter === 'unrated') {
        if (r.classification?.band) return false;
      } else {
        if (r.classification?.band !== riskFilter) return false;
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.reportNumber.toLowerCase().includes(q) ||
        r.specificLocation.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.classification?.category && r.classification.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const incidentCount = baseReports.filter(r => r.type === 'incident').length;
  const nearMissCount = baseReports.filter(r => r.type === 'near_miss').length;
  const underInvestigationCount = baseReports.filter(r => r.status === 'under_investigation').length;
  const criticalHighCount = baseReports.filter(
    r => r.classification?.band === 'critical' || r.classification?.band === 'high'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#15251C]">Incidents & Near Misses</h1>
          <p className="text-xs text-[#5D6961] mt-1">
            Authoritative register of reported occurrences with 5×5 risk classification and accessible text labeling.
          </p>
        </div>

        <Link
          to="/app/reports/new"
          className="inline-flex items-center gap-2 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Report Incident / Near Miss</span>
        </Link>
      </div>

      {/* Contract Scope Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[#DDE5DF] bg-white shadow-2xs">
          <div className="text-xs text-[#5D6961]">Total Incident Reports</div>
          <div className="text-2xl font-semibold text-[#15251C] mt-1">{incidentCount}</div>
          <div className="text-[11px] text-[#5D6961] mt-0.5">Asset damage or process upset</div>
        </div>

        <div className="p-4 rounded-xl border border-[#DDE5DF] bg-white shadow-2xs">
          <div className="text-xs text-[#5D6961]">Near Miss Events</div>
          <div className="text-2xl font-semibold text-[#007A44] mt-1">{nearMissCount}</div>
          <div className="text-[11px] text-[#5D6961] mt-0.5">Retained distinct per clause 1.2</div>
        </div>

        <div className="p-4 rounded-xl border border-[#DDE5DF] bg-white shadow-2xs">
          <div className="text-xs text-[#5D6961]">Under Active Investigation</div>
          <div className="text-2xl font-semibold text-[#B54708] mt-1">{underInvestigationCount}</div>
          <div className="text-[11px] text-[#5D6961] mt-0.5">Root cause analysis underway</div>
        </div>

        <div className="p-4 rounded-xl border border-[#DDE5DF] bg-white shadow-2xs">
          <div className="text-xs text-[#5D6961]">Critical / High Risk</div>
          <div className="text-2xl font-semibold text-[#B42318] mt-1">{criticalHighCount}</div>
          <div className="text-[11px] text-[#5D6961] mt-0.5">Score ≥ 10 on 5×5 matrix</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-[#DDE5DF] space-y-3 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5D6961] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, reference code, location, or finding category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#DDE5DF] rounded-lg focus:outline-hidden focus:border-[#007A44] focus:ring-1 focus:ring-[#007A44]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Filter */}
            <div className="flex items-center rounded-lg border border-[#DDE5DF] p-0.5 bg-[#F7F9F7] text-xs">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  typeFilter === 'all' ? 'bg-white shadow-xs text-[#15251C]' : 'text-[#5D6961]'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setTypeFilter('incident')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  typeFilter === 'incident' ? 'bg-white shadow-xs text-[#B42318] font-bold' : 'text-[#5D6961]'
                }`}
              >
                Incidents
              </button>
              <button
                onClick={() => setTypeFilter('near_miss')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  typeFilter === 'near_miss' ? 'bg-white shadow-xs text-[#007A44] font-bold' : 'text-[#5D6961]'
                }`}
              >
                Near Misses
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-2 bg-white text-[#15251C] outline-hidden cursor-pointer"
            >
              <option value="all">All Review Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="under_investigation">Under Investigation</option>
              <option value="actions_in_progress">Actions in Progress</option>
              <option value="closed">Closed</option>
            </select>

            {/* Risk Band Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-2 bg-white text-[#15251C] outline-hidden cursor-pointer"
            >
              <option value="all">All Risk Bands</option>
              <option value="critical">Critical Risk (17–25)</option>
              <option value="high">High Risk (10–16)</option>
              <option value="medium">Medium Risk (5–9)</option>
              <option value="low">Low Risk (1–4)</option>
              <option value="unrated">Unclassified</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-2 bg-white text-[#15251C] outline-hidden cursor-pointer max-w-[160px] truncate"
            >
              <option value="all">All Defect Categories</option>
              {appState.matrixConfig.findingCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {(typeFilter !== 'all' || statusFilter !== 'all' || riskFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setRiskFilter('all');
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs text-[#007A44] hover:underline font-semibold px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                <th className="py-3 px-4">Ref Code</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Title & Specific Location</th>
                <th className="py-3 px-4">Facility</th>
                <th className="py-3 px-4">Occurred</th>
                <th className="py-3 px-4">Risk Rating (Score & Band)</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE5DF]">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <EmptyState
                      icon={AlertOctagon}
                      title="No incident or near-miss records match filters"
                      description="No records match your selected type, review status, risk band, or search query. Reset filters or log a new occurrence."
                      actionLabel="Reset filters"
                      onAction={() => {
                        setTypeFilter('all');
                        setStatusFilter('all');
                        setRiskFilter('all');
                        setSearchQuery('');
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-[#F7F9F7] transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#15251C]">
                      <Link to={`/app/incidents/${report.id}`} className="hover:underline">
                        {report.reportNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          report.type === 'incident'
                            ? 'bg-[#FFF0ED] text-[#B42318] border border-[#FECDCA]'
                            : 'bg-[#EEF7F2] text-[#007A44] border border-[#BDE3CE]'
                        }`}
                      >
                        {report.type === 'incident' ? 'Incident' : 'Near Miss'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <Link to={`/app/incidents/${report.id}`} className="block">
                        <div className="font-semibold text-[#15251C] group-hover:text-[#007A44] transition-colors truncate">
                          {report.title}
                        </div>
                        <div className="text-[11px] text-[#5D6961] truncate mt-0.5">
                          {report.specificLocation}
                        </div>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-[#5D6961]">{report.siteName}</td>
                    <td className="py-3.5 px-4 text-[#5D6961] whitespace-nowrap">
                      {new Date(report.occurredAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <RiskBadge
                        band={report.classification?.band}
                        score={report.classification?.score}
                        matrixVersion={report.classification?.matrixVersion}
                        showDetails
                      />
                      {report.classification?.category && (
                        <div className="text-[10px] text-[#5D6961] font-medium truncate max-w-[200px]">
                          {report.classification.category}
                        </div>
                      )}
                      {report.classification?.matrixVersion && (
                        <div className="font-mono text-[9px] text-[#5D6961]">
                          Scheme: {report.classification.matrixVersion}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/app/incidents/${report.id}`}
                        className="inline-flex items-center gap-1 text-[#007A44] hover:underline font-semibold"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
