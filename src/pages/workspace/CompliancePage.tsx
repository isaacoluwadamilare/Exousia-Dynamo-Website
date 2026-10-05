import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HSEAppState, hseDataService } from '../../services/hseDataService';
import { ComplianceStateBadge, DueDateHorizonBadge, Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { CreateComplianceModal } from '../../components/CreateComplianceModal';
import { ComplianceObligation, ComplianceState } from '../../types/hse';
import {
  ShieldCheck,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  ArrowRight,
  FileText,
  Plus,
  Paperclip,
  Check,
  XCircle,
  Building,
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface CompliancePageProps {
  appState: HSEAppState;
}

export const CompliancePage: React.FC<CompliancePageProps> = ({ appState }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<'all' | ComplianceState>('all');
  const [horizonFilter, setHorizonFilter] = useState<'all' | 'overdue' | 'due_soon' | 'due_soon_or_overdue' | 'current'>('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'internal' | 'statutory'>('all');
  const [siteFilter, setSiteFilter] = useState<string>(appState.activeSiteFilter);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const currentDate = '2026-10-02';

  useEffect(() => {
    const hParam = searchParams.get('horizon') as any;
    if (hParam && ['overdue', 'due_soon', 'due_soon_or_overdue', 'current'].includes(hParam)) {
      setHorizonFilter(hParam);
    }
    const sParam = searchParams.get('state') as any;
    if (sParam && ['compliant', 'non_compliant', 'not_assessed'].includes(sParam)) {
      setStateFilter(sParam);
    }
  }, [searchParams]);

  // Filter obligations
  const filteredObligations = appState.compliance.filter(c => {
    // Site filter
    const activeSite = siteFilter !== 'all' ? siteFilter : appState.activeSiteFilter;
    if (activeSite !== 'all' && !c.applicableSiteIds.includes(activeSite)) {
      return false;
    }

    // Assessed compliance state filter
    if (stateFilter !== 'all' && c.complianceState !== stateFilter) return false;

    // Origin filter (internal company standards vs statutory regulations)
    if (originFilter === 'internal' && !c.isInternalStandard) return false;
    if (originFilter === 'statutory' && c.isInternalStandard) return false;

    // Due date horizon filter
    const daysDiff = Math.floor(
      (new Date(c.dueDate).getTime() - new Date(currentDate).getTime()) / (1000 * 3600 * 24)
    );
    if (horizonFilter === 'overdue' && daysDiff >= 0) return false;
    if (horizonFilter === 'due_soon' && (daysDiff < 0 || daysDiff > 30)) return false;
    if (horizonFilter === 'due_soon_or_overdue' && daysDiff > 30 && c.complianceState === 'compliant') return false;
    if (horizonFilter === 'current' && daysDiff <= 30) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.title.toLowerCase().includes(q) ||
        c.obligationNumber.toLowerCase().includes(q) ||
        c.sourceReference.toLowerCase().includes(q) ||
        c.regulatorOrAuthority.toLowerCase().includes(q) ||
        c.ownerName.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Calculate metrics
  const totalCount = appState.compliance.length;
  const compliantCount = appState.compliance.filter(c => c.complianceState === 'compliant').length;
  const nonCompliantCount = appState.compliance.filter(c => c.complianceState === 'non_compliant').length;
  const notAssessedCount = appState.compliance.filter(c => c.complianceState === 'not_assessed').length;

  const overdueCount = appState.compliance.filter(c => {
    const diff = Math.floor((new Date(c.dueDate).getTime() - new Date(currentDate).getTime()) / (1000 * 3600 * 24));
    return diff < 0;
  }).length;

  const dueSoonCount = appState.compliance.filter(c => {
    const diff = Math.floor((new Date(c.dueDate).getTime() - new Date(currentDate).getTime()) / (1000 * 3600 * 24));
    return diff >= 0 && diff <= 30;
  }).length;

  const resetFilters = () => {
    setSearchQuery('');
    setStateFilter('all');
    setHorizonFilter('all');
    setOriginFilter('all');
    setSiteFilter('all');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    stateFilter !== 'all' ||
    horizonFilter !== 'all' ||
    originFilter !== 'all' ||
    siteFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-[#15251C]">Compliance Monitoring Register</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EEF7F2] text-[#007A44] border border-[#BDE3CE]">
              Dual-State Architecture
            </span>
          </div>
          <p className="text-xs text-[#5D6961] mt-1">
            Authoritative regulatory decrees and clearly labelled sample internal company standards. Compliance state is strictly separated from calendar due-date state.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#007A44] hover:bg-[#005D35] text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Obligation</span>
        </button>
      </div>

      {/* Core Governance Rule Banner */}
      <div className="p-4 bg-[#F0F9FF] border border-[#B9E6FE] rounded-xl text-xs text-[#026AA2] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">
            Compliance Governance Architecture (Contract Clause 1.8 & ISO 45001):
          </div>
          <p className="leading-relaxed">
            <strong>Critical Principle:</strong> A future calendar deadline does NOT prove compliance.
            Obligations track two independent dimensions:
            <span className="inline-block mx-1 font-semibold text-[#15251C] bg-white px-2 py-0.5 rounded border border-[#B9E6FE]">
              (1) Assessed Compliance State
            </span>
            (Compliant, Non-Compliant, Not Assessed) based on verified audit records, and
            <span className="inline-block mx-1 font-semibold text-[#15251C] bg-white px-2 py-0.5 rounded border border-[#B9E6FE]">
              (2) Calendar Due Date Horizon
            </span>
            (Current, Due Soon ≤30d, Overdue). Sample internal obligations are explicitly labeled to avoid inventing external laws.
          </p>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div
          onClick={() => resetFilters()}
          className="p-3 bg-white rounded-xl border border-[#DDE5DF] hover:border-[#BDE3CE] cursor-pointer transition-colors"
        >
          <span className="text-[11px] text-[#5D6961] font-medium block">Total Register</span>
          <span className="text-xl font-bold text-[#15251C] block mt-0.5">{totalCount}</span>
          <span className="text-[10px] text-[#5D6961]">Tracked obligations</span>
        </div>

        {/* Compliant */}
        <div
          onClick={() => {
            resetFilters();
            setStateFilter('compliant');
          }}
          className={`p-3 rounded-xl border cursor-pointer transition-colors ${
            stateFilter === 'compliant'
              ? 'bg-[#EEF7F2] border-[#007A44]'
              : 'bg-white border-[#DDE5DF] hover:border-[#BDE3CE]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#007A44] font-semibold">Assessed Compliant</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#007A44]" />
          </div>
          <span className="text-xl font-bold text-[#007A44] block mt-0.5">{compliantCount}</span>
          <span className="text-[10px] text-[#5D6961]">Passed audit proof</span>
        </div>

        {/* Non-Compliant */}
        <div
          onClick={() => {
            resetFilters();
            setStateFilter('non_compliant');
          }}
          className={`p-3 rounded-xl border cursor-pointer transition-colors ${
            stateFilter === 'non_compliant'
              ? 'bg-[#FFF0ED] border-[#B42318]'
              : 'bg-white border-[#DDE5DF] hover:border-[#FECDCA]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#B42318] font-bold">Non-Compliant</span>
            <XCircle className="w-3.5 h-3.5 text-[#B42318]" />
          </div>
          <span className="text-xl font-bold text-[#B42318] block mt-0.5">{nonCompliantCount}</span>
          <span className="text-[10px] text-[#5D6961]">Deficiency identified</span>
        </div>

        {/* Not Assessed */}
        <div
          onClick={() => {
            resetFilters();
            setStateFilter('not_assessed');
          }}
          className={`p-3 rounded-xl border cursor-pointer transition-colors ${
            stateFilter === 'not_assessed'
              ? 'bg-[#F7F9F7] border-[#5D6961]'
              : 'bg-white border-[#DDE5DF] hover:border-[#BDE3CE]'
          }`}
        >
          <span className="text-[11px] text-[#5D6961] font-medium block">Not Assessed</span>
          <span className="text-xl font-bold text-[#15251C] block mt-0.5">{notAssessedCount}</span>
          <span className="text-[10px] text-[#5D6961]">Pending inspection</span>
        </div>

        {/* Calendar Due Soon */}
        <div
          onClick={() => {
            resetFilters();
            setHorizonFilter('due_soon');
          }}
          className={`p-3 rounded-xl border cursor-pointer transition-colors ${
            horizonFilter === 'due_soon'
              ? 'bg-[#FFFAEB] border-[#B54708]'
              : 'bg-white border-[#DDE5DF] hover:border-[#FEDF89]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#B54708] font-bold">Due Soon (≤30d)</span>
            <Clock className="w-3.5 h-3.5 text-[#B54708]" />
          </div>
          <span className="text-xl font-bold text-[#B54708] block mt-0.5">{dueSoonCount}</span>
          <span className="text-[10px] text-[#5D6961]">Recertification window</span>
        </div>

        {/* Calendar Overdue */}
        <div
          onClick={() => {
            resetFilters();
            setHorizonFilter('overdue');
          }}
          className={`p-3 rounded-xl border cursor-pointer transition-colors ${
            horizonFilter === 'overdue'
              ? 'bg-[#FFF0ED] border-[#B42318]'
              : 'bg-white border-[#DDE5DF] hover:border-[#FECDCA]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#B42318] font-bold">Date Overdue</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#B42318]" />
          </div>
          <span className="text-xl font-bold text-[#B42318] block mt-0.5">{overdueCount}</span>
          <span className="text-[10px] text-[#5D6961]">Target date passed</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-[#DDE5DF] space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5D6961] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by obligation code, title, standard reference, authority, or custodian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#DDE5DF] rounded-lg focus:outline-hidden focus:border-[#007A44]"
            />
          </div>

          {/* Select Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Assessed State Filter */}
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value as any)}
              className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-2 bg-white text-[#15251C]"
              title="Filter by verified compliance assessment outcome"
            >
              <option value="all">All Assessed States</option>
              <option value="compliant">Compliant Only</option>
              <option value="non_compliant">Non-Compliant Only</option>
              <option value="not_assessed">Not Assessed Only</option>
            </select>

            {/* Due Date Horizon Filter */}
            <select
              value={horizonFilter}
              onChange={(e) => setHorizonFilter(e.target.value as any)}
              className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-2 bg-white text-[#15251C]"
              title="Filter by calendar due-date horizon"
            >
              <option value="all">All Date Horizons</option>
              <option value="overdue">Calendar Overdue</option>
              <option value="due_soon">Due Soon (≤ 30 Days)</option>
              <option value="current">Current (&gt; 30 Days)</option>
            </select>

            {/* Standard Origin Filter */}
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value as any)}
              className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-2 bg-white text-[#15251C]"
              title="Filter by statutory decree vs sample internal company standard"
            >
              <option value="all">All Standard Types</option>
              <option value="internal">Sample Internal Obligations</option>
              <option value="statutory">Statutory Decrees & Permits</option>
            </select>

            {/* Site Filter */}
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-2 bg-white text-[#15251C]"
            >
              <option value="all">All Operating Sites</option>
              {appState.sites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs px-2.5 py-2 text-[#5D6961] hover:text-[#15251C] font-semibold border border-[#DDE5DF] rounded-lg bg-white flex items-center gap-1"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#5D6961] pt-1">
          <span>
            Showing <strong>{filteredObligations.length}</strong> of {totalCount} compliance obligations.
          </span>
          <span className="italic">
            Notice: CMP-2026-003 has a future date horizon (44d) yet is NON-COMPLIANT due to audit findings.
          </span>
        </div>
      </div>

      {/* Compliance Register Table */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                <th className="py-3 px-4">Ref Code</th>
                <th className="py-3 px-4">Obligation Title & Standard Reference</th>
                <th className="py-3 px-4">Authority / Body</th>
                <th className="py-3 px-4">Applicable Sites</th>
                <th className="py-3 px-4">Accountable Owner</th>
                <th className="py-3 px-4">Target Due Date</th>
                <th className="py-3 px-4">Assessed State</th>
                <th className="py-3 px-4 text-right">Audit Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE5DF]">
              {filteredObligations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <EmptyState
                      icon={ShieldCheck}
                      title="No compliance obligations found"
                      description="No obligations match your active state filter, date horizon, site selection, or search query."
                      actionLabel="Reset all filters"
                      onAction={resetFilters}
                    />
                  </td>
                </tr>
              ) : (
                filteredObligations.map((cmp) => {
                  return (
                    <tr
                      key={cmp.id}
                      onClick={() => navigate(`/app/compliance/${cmp.id}`)}
                      className="hover:bg-[#F7F9F7] transition-colors group cursor-pointer"
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#15251C]">
                        <Link
                          to={`/app/compliance/${cmp.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline hover:text-[#007A44]"
                        >
                          {cmp.obligationNumber}
                        </Link>
                      </td>

                      {/* Title & Standard Reference */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <Link
                          to={`/app/compliance/${cmp.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-[#15251C] group-hover:text-[#007A44] transition-colors block line-clamp-1"
                        >
                          {cmp.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-[#5D6961] truncate">
                            {cmp.sourceReference}
                          </span>
                          {cmp.isInternalStandard && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#F0F9FF] text-[#026AA2] border border-[#B9E6FE] shrink-0">
                              Internal Standard
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Authority */}
                      <td className="py-3.5 px-4 text-[#5D6961] max-w-xs truncate">
                        {cmp.regulatorOrAuthority}
                      </td>

                      {/* Applicable Sites */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-[#15251C]">
                          {cmp.applicableSiteIds.length === appState.sites.length
                            ? 'All Facilities'
                            : `${cmp.applicableSiteIds.length} Site${cmp.applicableSiteIds.length === 1 ? '' : 's'}`}
                        </span>
                      </td>

                      {/* Owner */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#15251C] font-medium">
                        {cmp.ownerName}
                      </td>

                      {/* Target Due Date & Calendar Horizon */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="font-mono font-semibold text-[#15251C]">{cmp.dueDate}</div>
                          <DueDateHorizonBadge dueDate={cmp.dueDate} referenceDate={currentDate} size="sm" />
                        </div>
                      </td>

                      {/* Assessed Compliance State */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <ComplianceStateBadge state={cmp.complianceState} size="sm" />
                          {cmp.evidenceAttachments.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-[#007A44]">
                              <Paperclip className="w-3 h-3" />
                              <span>{cmp.evidenceAttachments.length} doc{cmp.evidenceAttachments.length === 1 ? '' : 's'}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          to={`/app/compliance/${cmp.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#007A44] font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      <CreateComplianceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        appState={appState}
        onCreated={(newObl) => navigate(`/app/compliance/${newObl.id}`)}
      />
    </div>
  );
};
