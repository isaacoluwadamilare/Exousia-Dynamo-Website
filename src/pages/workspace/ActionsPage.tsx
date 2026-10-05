import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HSEAppState, hseDataService, isActionOverdue, getActionDueDateStatus } from '../../services/hseDataService';
import { ActionStatusBadge, ActionTypeBadge, Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { CreateActionModal } from '../../components/CreateActionModal';
import { DemonstrationSimulatorModal } from '../../components/DemonstrationSimulatorModal';
import { ActionItem, RiskBand } from '../../types/hse';
import {
  CheckSquare,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  User,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

interface ActionsPageProps {
  appState: HSEAppState;
}

export const ActionsPage: React.FC<ActionsPageProps> = ({ appState }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'all' | 'my' | 'overdue' | 'awaiting' | 'rework' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'corrective' | 'preventive'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | RiskBand>('all');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<'all' | ActionItem['sourceType']>('all');
  const [statusFilterParam, setStatusFilterParam] = useState<string>('all');
  const [siteFilter, setSiteFilter] = useState<string>(appState.activeSiteFilter);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);

  const currentDate = '2026-10-02';

  useEffect(() => {
    const tParam = searchParams.get('tab') as any;
    if (tParam && ['all', 'my', 'overdue', 'awaiting', 'rework', 'closed'].includes(tParam)) {
      setTab(tParam);
    }
    const statParam = searchParams.get('status');
    if (statParam) {
      setStatusFilterParam(statParam);
    }
  }, [searchParams]);

  // Apply filters
  const filteredActions = appState.actions.filter(a => {
    // Site filter
    const activeSite = siteFilter !== 'all' ? siteFilter : appState.activeSiteFilter;
    if (activeSite !== 'all' && a.siteId !== activeSite) return false;

    // Status query filter
    if (statusFilterParam === 'open' && a.status === 'closed') return false;

    // Type filter
    if (typeFilter !== 'all' && a.actionType !== typeFilter) return false;

    // Priority filter
    if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;

    // Source type filter
    if (sourceTypeFilter !== 'all' && a.sourceType !== sourceTypeFilter) return false;

    // Tabs
    if (tab === 'my' && a.ownerId !== appState.currentUser.id) return false;
    if (tab === 'overdue' && !isActionOverdue(a, currentDate)) return false;
    if (tab === 'awaiting' && a.status !== 'awaiting_verification' && a.status !== 'evidence_submitted') return false;
    if (tab === 'rework' && a.status !== 'returned_for_rework') return false;
    if (tab === 'closed' && a.status !== 'closed') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        a.title.toLowerCase().includes(q) ||
        a.actionNumber.toLowerCase().includes(q) ||
        a.ownerName.toLowerCase().includes(q) ||
        a.sourceNumber.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        (a.findingCategory && a.findingCategory.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Calculate summary counts
  const totalCount = appState.actions.length;
  const myActionsCount = appState.actions.filter(a => a.ownerId === appState.currentUser.id && a.status !== 'closed').length;
  const overdueCount = appState.actions.filter(a => isActionOverdue(a, currentDate)).length;
  const awaitingCount = appState.actions.filter(a => a.status === 'awaiting_verification' || a.status === 'evidence_submitted').length;
  const reworkCount = appState.actions.filter(a => a.status === 'returned_for_rework').length;
  const closedCount = appState.actions.filter(a => a.status === 'closed').length;

  const handleActionCreated = (newAction: ActionItem) => {
    navigate(`/app/actions/${newAction.id}`);
  };

  const handleRunDemo = () => {
    hseDataService.demonstrateActionLifecycle();
    navigate('/app/actions/act-demo');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    typeFilter !== 'all' ||
    priorityFilter !== 'all' ||
    sourceTypeFilter !== 'all' ||
    siteFilter !== 'all';

  const resetFilters = () => {
    setTab('all');
    setSearchQuery('');
    setTypeFilter('all');
    setPriorityFilter('all');
    setSourceTypeFilter('all');
    setSiteFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-[#15251C]">
              Corrective & Preventive Actions (CAPA)
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EEF7F2] text-[#007A44] border border-[#BDE3CE]">
              ISO 45001 Compliant
            </span>
          </div>
          <p className="text-xs text-[#5D6961] mt-1">
            Central accountability register tracking corrective and preventive actions from root-cause identification to independent verification and closed-loop sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsSimulatorModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#007A44] text-[#007A44] bg-white hover:bg-[#EEF7F2] transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#007A44]" />
            <span>6-Stage Lifecycle Simulator</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#007A44] hover:bg-[#005D35] text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New CAPA Action</span>
          </button>
        </div>
      </div>

      {/* Demonstration Banner */}
      <div className="p-4 bg-[#F7F9F7] rounded-xl border border-[#DDE5DF] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#007A44]/10 text-[#007A44] rounded-lg shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-[#15251C]">
                Specification Workflow Demonstration:
              </span>
              <span className="text-[11px] font-mono text-[#007A44] font-bold">
                Assignment → Progress → Evidence → Rejection → Resubmission → Verified Closure
              </span>
            </div>
            <p className="text-[11px] text-[#5D6961] mt-0.5">
              Rule 1.10 enforced: Action owners cannot verify their own closure. Overdue is derived from deadline and lifecycle state (evidence submission does not count as closure). Reassignments, extensions, and reopenings retain full reason histories.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRunDemo}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#15251C] hover:bg-black text-white flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#007A44]" />
            <span>View Demo (ACT-2026-DEMO)</span>
          </button>
          <button
            onClick={() => setIsSimulatorModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#DDE5DF] bg-white text-[#15251C] hover:bg-[#F7F9F7]"
          >
            Interactive Walkthrough
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setTab('all')}
          className={`p-3 rounded-xl border cursor-pointer transition-colors ${
            tab === 'all' ? 'bg-[#EEF7F2] border-[#007A44]' : 'bg-white border-[#DDE5DF] hover:border-[#BDE3CE]'
          }`}
        >
          <span className="text-[11px] text-[#5D6961] block font-medium">All Actions</span>
          <span className="text-xl font-bold text-[#15251C] block mt-0.5">{totalCount}</span>
          <span className="text-[10px] text-[#5D6961]">Total register</span>
        </div>

        <div
          onClick={() => setTab('my')}
          className={`p-3 rounded-xl border cursor-pointer transition-colors ${
            tab === 'my' ? 'bg-[#EEF7F2] border-[#007A44]' : 'bg-white border-[#DDE5DF] hover:border-[#BDE3CE]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#5D6961] font-medium">My Actions</span>
            <User className="w-3 h-3 text-[#007A44]" />
          </div>
          <span className="text-xl font-bold text-[#007A44] block mt-0.5">{myActionsCount}</span>
          <span className="text-[10px] text-[#5D6961]">Assigned to you</span>
        </div>

        <div
          onClick={() => setTab('overdue')}
          className={`p-3 rounded-xl border cursor-pointer transition-colors ${
            tab === 'overdue' ? 'bg-[#FFF0ED] border-[#B42318]' : 'bg-white border-[#DDE5DF] hover:border-[#FECDCA]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#B42318] font-bold">Overdue</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#B42318]" />
          </div>
          <span className="text-xl font-bold text-[#B42318] block mt-0.5">{overdueCount}</span>
          <span className="text-[10px] text-[#5D6961]">Deadline passed</span>
        </div>

        <div
          onClick={() => setTab('awaiting')}
          className={`p-3 rounded-xl border cursor-pointer transition-colors ${
            tab === 'awaiting' ? 'bg-[#FFFAEB] border-[#B54708]' : 'bg-white border-[#DDE5DF] hover:border-[#FEDF89]'
          }`}
        >
          <span className="text-[11px] text-[#B54708] block font-medium">Awaiting Verification</span>
          <span className="text-xl font-bold text-[#B54708] block mt-0.5">{awaitingCount}</span>
          <span className="text-[10px] text-[#5D6961]">Evidence submitted</span>
        </div>

        <div
          onClick={() => setTab('rework')}
          className={`p-3 rounded-xl border cursor-pointer transition-colors ${
            tab === 'rework' ? 'bg-[#FFF0ED] border-[#B42318]' : 'bg-white border-[#DDE5DF] hover:border-[#FECDCA]'
          }`}
        >
          <span className="text-[11px] text-[#B42318] block font-medium">Returned for Rework</span>
          <span className="text-xl font-bold text-[#B42318] block mt-0.5">{reworkCount}</span>
          <span className="text-[10px] text-[#5D6961]">Feedback to owner</span>
        </div>

        <div
          onClick={() => setTab('closed')}
          className={`p-3 rounded-xl border cursor-pointer transition-colors ${
            tab === 'closed' ? 'bg-[#EEF7F2] border-[#007A44]' : 'bg-white border-[#DDE5DF] hover:border-[#BDE3CE]'
          }`}
        >
          <span className="text-[11px] text-[#007A44] block font-medium">Verified & Closed</span>
          <span className="text-xl font-bold text-[#007A44] block mt-0.5">{closedCount}</span>
          <span className="text-[10px] text-[#5D6961]">Formally signed off</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#DDE5DF] pb-2 text-xs flex-wrap">
        <button
          onClick={() => setTab('all')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            tab === 'all' ? 'bg-[#EEF7F2] text-[#007A44]' : 'text-[#5D6961] hover:text-[#15251C]'
          }`}
        >
          All Actions ({totalCount})
        </button>

        <button
          onClick={() => setTab('my')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
            tab === 'my' ? 'bg-[#EEF7F2] text-[#007A44]' : 'text-[#5D6961] hover:text-[#15251C]'
          }`}
        >
          <span>My Actions</span>
          {myActionsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#007A44] text-white rounded-full text-[10px]">
              {myActionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('overdue')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
            tab === 'overdue' ? 'bg-[#FFF0ED] text-[#B42318]' : 'text-[#5D6961] hover:text-[#B42318]'
          }`}
        >
          <span>Overdue</span>
          {overdueCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#B42318] text-white rounded-full text-[10px]">
              {overdueCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('awaiting')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
            tab === 'awaiting' ? 'bg-[#FFFAEB] text-[#B54708]' : 'text-[#5D6961] hover:text-[#B54708]'
          }`}
        >
          <span>Awaiting Verification</span>
          {awaitingCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#B54708] text-white rounded-full text-[10px]">
              {awaitingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('rework')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
            tab === 'rework' ? 'bg-[#FFF0ED] text-[#B42318]' : 'text-[#5D6961] hover:text-[#B42318]'
          }`}
        >
          <span>Returned for Rework</span>
          {reworkCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#B42318] text-white rounded-full text-[10px]">
              {reworkCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('closed')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            tab === 'closed' ? 'bg-[#EEF7F2] text-[#007A44]' : 'text-[#5D6961] hover:text-[#15251C]'
          }`}
        >
          Closed & Verified ({closedCount})
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-[#DDE5DF] space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5D6961] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by action title, ACT number, owner, source (INC/HZ/INS), or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#DDE5DF] rounded-lg focus:outline-hidden focus:border-[#007A44]"
            />
          </div>

          {/* Filter Selects */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Action Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-2 bg-white text-[#15251C]"
            >
              <option value="all">All Action Types</option>
              <option value="corrective">Corrective Only</option>
              <option value="preventive">Preventive Only</option>
            </select>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-2 bg-white text-[#15251C]"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            {/* Source Type */}
            <select
              value={sourceTypeFilter}
              onChange={(e) => setSourceTypeFilter(e.target.value as any)}
              className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-2 bg-white text-[#15251C]"
            >
              <option value="all">All Source Records</option>
              <option value="incident">Incidents Only</option>
              <option value="near_miss">Near Misses Only</option>
              <option value="hazard">Hazards Only</option>
              <option value="inspection">Inspections Only</option>
              <option value="compliance">Compliance Only</option>
            </select>

            {/* Site */}
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-2 bg-white text-[#15251C]"
            >
              <option value="all">All Sites</option>
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

        {/* Informative Governance Callout */}
        <div className="flex items-center justify-between text-[11px] text-[#5D6961] pt-1">
          <span>
            Showing <strong>{filteredActions.length}</strong> of {totalCount} action items.
          </span>
          <span className="italic">
            ISO 45001 Rule: Evidence submission does NOT count as closure. Actions require independent sign-off.
          </span>
        </div>
      </div>

      {/* Actions Table */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                <th className="py-3 px-4">Action Ref</th>
                <th className="py-3 px-4">Title & Remediation Scope</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Source Record</th>
                <th className="py-3 px-4">Assigned Owner</th>
                <th className="py-3 px-4">Target Due Date</th>
                <th className="py-3 px-4">Lifecycle Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE5DF]">
              {filteredActions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <EmptyState
                      icon={CheckSquare}
                      title="No matching actions found"
                      description="No corrective or preventive action items match your active tab, filter criteria, or search term."
                      actionLabel="Reset all filters"
                      onAction={resetFilters}
                    />
                  </td>
                </tr>
              ) : (
                filteredActions.map((act) => {
                  const isOverdue = isActionOverdue(act, currentDate);
                  const dueInfo = getActionDueDateStatus(act, currentDate);
                  const isOwner = act.ownerId === appState.currentUser.id;

                  // Source link target
                  const sourceLink =
                    act.sourceType === 'inspection'
                      ? `/app/inspections/${act.sourceId}`
                      : act.sourceType === 'compliance'
                      ? `/app/compliance/${act.sourceId}`
                      : act.sourceType === 'hazard'
                      ? `/app/hazards/${act.sourceId}`
                      : `/app/incidents/${act.sourceId}`;

                  return (
                    <tr
                      key={act.id}
                      onClick={() => navigate(`/app/actions/${act.id}`)}
                      className={`hover:bg-[#F7F9F7] transition-colors group cursor-pointer ${
                        act.id === 'act-demo' ? 'bg-[#EEF7F2]/30' : ''
                      }`}
                    >
                      {/* Action Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#15251C]">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/app/actions/${act.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline hover:text-[#007A44]"
                          >
                            {act.actionNumber}
                          </Link>
                          {act.id === 'act-demo' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#007A44] text-white">
                              DEMO
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Title & Category */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <Link
                          to={`/app/actions/${act.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-[#15251C] group-hover:text-[#007A44] transition-colors block line-clamp-1"
                        >
                          {act.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          {act.findingCategory && (
                            <span className="text-[10px] text-[#5D6961] bg-[#F7F9F7] px-1.5 py-0.2 rounded border border-[#DDE5DF]">
                              {act.findingCategory}
                            </span>
                          )}
                          <span className="text-[10px] text-[#5D6961] truncate">
                            {act.siteName}
                          </span>
                        </div>
                      </td>

                      {/* Action Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <ActionTypeBadge type={act.actionType} size="sm" />
                      </td>

                      {/* Source Reference */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link
                          to={sourceLink}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-xs text-[#007A44] font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <span>{act.sourceNumber}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Link>
                        <span className="capitalize block text-[10px] text-[#5D6961]">
                          {act.sourceType.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Assigned Owner */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs ${isOwner ? 'font-bold text-[#007A44]' : 'text-[#15251C]'}`}>
                            {act.ownerName}
                          </span>
                          {isOwner && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#EEF7F2] text-[#007A44] border border-[#BDE3CE]">
                              You
                            </span>
                          )}
                        </div>
                        {act.reassignmentHistory && act.reassignmentHistory.length > 0 && (
                          <span className="text-[10px] text-[#B54708] block">
                            Reassigned ({act.reassignmentHistory.length}x)
                          </span>
                        )}
                      </td>

                      {/* Target Due Date & Overdue */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            {isOverdue && (
                              <span className="w-2 h-2 rounded-full bg-[#B42318] shrink-0" title="Action Overdue" />
                            )}
                            <span className={`font-mono text-xs ${isOverdue ? 'text-[#B42318] font-bold' : 'text-[#15251C]'}`}>
                              {act.dueDate}
                            </span>
                          </div>

                          <div className="text-[10px]">
                            {isOverdue ? (
                              <span className="font-bold text-[#B42318]">{dueInfo.label}</span>
                            ) : act.status === 'closed' ? (
                              <span className="text-[#007A44]">Closed on time</span>
                            ) : (
                              <span className="text-[#5D6961]">{dueInfo.label}</span>
                            )}
                            {act.dueDateHistory && act.dueDateHistory.length > 0 && (
                              <span className="text-[#B54708] ml-1 font-semibold">
                                (+{act.dueDateHistory.length} ext)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Lifecycle Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <ActionStatusBadge status={act.status} size="sm" />
                      </td>

                      {/* View Action Link */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          to={`/app/actions/${act.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#007A44] font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <span>Manage</span>
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

      {/* Modals */}
      <CreateActionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        appState={appState}
        onActionCreated={handleActionCreated}
      />

      <DemonstrationSimulatorModal
        isOpen={isSimulatorModalOpen}
        onClose={() => setIsSimulatorModalOpen(false)}
        appState={appState}
      />
    </div>
  );
};
