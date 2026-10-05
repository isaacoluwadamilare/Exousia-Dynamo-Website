import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HSEAppState } from '../../services/hseDataService';
import { StatusBadge, RiskBadge } from '../../components/Badge';
import { Eye, Search, Plus, ArrowRight, MapPin, Clock, ShieldCheck, AlertCircle, Tag } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';
import { RiskBand } from '../../types/hse';

interface HazardsPageProps {
  appState: HSEAppState;
}

export const HazardsPage: React.FC<HazardsPageProps> = ({ appState }) => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskBand | 'unrated'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const sParam = searchParams.get('status');
    if (sParam) {
      setStatusFilter(sParam);
    }
  }, [searchParams]);

  const hazards = appState.reports.filter(r => r.type === 'hazard');

  const filteredHazards = hazards.filter(h => {
    if (appState.activeSiteFilter !== 'all' && h.siteId !== appState.activeSiteFilter) return false;
    
    // Status filter handling (including 'open' and 'awaiting_review')
    if (statusFilter !== 'all') {
      if (statusFilter === 'open') {
        if (h.status === 'closed' || h.status === 'dismissed') return false;
      } else if (statusFilter === 'awaiting_review') {
        if (h.status !== 'submitted' && h.status !== 'under_review') return false;
      } else if (h.status !== statusFilter) {
        return false;
      }
    }

    if (categoryFilter !== 'all' && h.classification?.category !== categoryFilter) return false;
    if (riskFilter !== 'all') {
      if (riskFilter === 'unrated') {
        if (h.classification?.band) return false;
      } else {
        if (h.classification?.band !== riskFilter) return false;
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        h.title.toLowerCase().includes(q) ||
        h.reportNumber.toLowerCase().includes(q) ||
        h.specificLocation.toLowerCase().includes(q) ||
        (h.classification?.category && h.classification.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalCount = hazards.length;
  const underReviewCount = hazards.filter(h => h.status === 'submitted' || h.status === 'under_review').length;
  const closedCount = hazards.filter(h => h.status === 'closed').length;
  const highRiskCount = hazards.filter(h => h.classification?.band === 'critical' || h.classification?.band === 'high').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#15251C]">Hazard Observations</h1>
          <p className="text-xs text-[#5D6961] mt-1">
            Capture, classify, and remediate unsafe acts and conditions before incidents occur.
          </p>
        </div>

        <Link
          to="/app/reports/new"
          className="inline-flex items-center gap-2 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Log Hazard Observation</span>
        </Link>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[#DDE5DF] bg-white shadow-2xs">
          <div className="text-xs text-[#5D6961]">Total Observations</div>
          <div className="text-2xl font-semibold text-[#15251C] mt-1">{totalCount}</div>
          <div className="text-[11px] text-[#5D6961] mt-0.5">Unsafe conditions or acts logged</div>
        </div>

        <div className="p-4 rounded-xl border border-[#DDE5DF] bg-white shadow-2xs">
          <div className="text-xs text-[#5D6961]">Awaiting Triage & Action</div>
          <div className="text-2xl font-semibold text-[#B54708] mt-1">{underReviewCount}</div>
          <div className="text-[11px] text-[#5D6961] mt-0.5">Pending supervisor review</div>
        </div>

        <div className="p-4 rounded-xl border border-[#DDE5DF] bg-white shadow-2xs">
          <div className="text-xs text-[#5D6961]">High & Critical Priority</div>
          <div className="text-2xl font-semibold text-[#B42318] mt-1">{highRiskCount}</div>
          <div className="text-[11px] text-[#5D6961] mt-0.5">Score ≥ 10 on 5×5 matrix</div>
        </div>

        <div className="p-4 rounded-xl border border-[#DDE5DF] bg-white shadow-2xs">
          <div className="text-xs text-[#5D6961]">Remediated & Closed</div>
          <div className="text-2xl font-semibold text-[#007A44] mt-1">{closedCount}</div>
          <div className="text-[11px] text-[#5D6961] mt-0.5">Verified hazard elimination</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-[#DDE5DF] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5D6961] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hazard observations by title, HZ-number, location, or finding category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#DDE5DF] rounded-lg focus:outline-hidden focus:border-[#007A44] focus:ring-1 focus:ring-[#007A44]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-2 bg-white text-[#15251C] outline-hidden cursor-pointer"
          >
            <option value="all">All Dispositions</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="actions_in_progress">Action Assigned</option>
            <option value="closed">Closed / Remediated</option>
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

          {(searchQuery || statusFilter !== 'all' || riskFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setRiskFilter('all');
                setCategoryFilter('all');
              }}
              className="text-xs text-[#007A44] hover:underline font-semibold px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Hazards Grid */}
      <div>
        {filteredHazards.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#DDE5DF] shadow-xs">
            <EmptyState
              icon={Eye}
              title="No hazard observations match filters"
              description="No hazard condition or unsafe act reports match your selected criteria. Try adjusting your search query, risk band, or disposition filter."
              actionLabel="Reset filters"
              onAction={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setRiskFilter('all');
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHazards.map((hazard) => (
              <Link
                key={hazard.id}
                to={`/app/hazards/${hazard.id}`}
                className="p-5 rounded-xl border border-[#DDE5DF] bg-white hover:border-[#007A44]/40 hover:shadow-xs transition-all flex flex-col justify-between group space-y-3"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-semibold text-[#5D6961]">
                      {hazard.reportNumber}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <RiskBadge
                        band={hazard.classification?.band}
                        score={hazard.classification?.score}
                        matrixVersion={hazard.classification?.matrixVersion}
                        showDetails
                      />
                      <StatusBadge status={hazard.status} />
                    </div>
                  </div>

                  <h3 className="font-semibold text-sm text-[#15251C] group-hover:text-[#007A44] transition-colors">
                    {hazard.title}
                  </h3>

                  <p className="text-xs text-[#5D6961] mt-1 line-clamp-2">
                    {hazard.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {hazard.classification?.category && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#007A44] bg-[#EEF7F2] border border-[#BDE3CE] px-2 py-0.5 rounded">
                        <Tag className="w-3 h-3" />
                        <span>{hazard.classification.category}</span>
                      </span>
                    )}
                    {hazard.classification?.matrixVersion && (
                      <span className="font-mono text-[9px] text-[#5D6961] bg-[#F7F9F7] px-2 py-0.5 rounded border border-[#DDE5DF]">
                        Scheme: {hazard.classification.matrixVersion}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#DDE5DF] flex items-center justify-between text-xs text-[#5D6961]">
                  <span className="flex items-center gap-1 truncate max-w-[200px]">
                    <MapPin className="w-3.5 h-3.5 text-[#007A44] shrink-0" />
                    <span className="truncate">{hazard.specificLocation}</span>
                  </span>
                  <span className="text-[#007A44] font-semibold flex items-center gap-1 shrink-0">
                    Review <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
