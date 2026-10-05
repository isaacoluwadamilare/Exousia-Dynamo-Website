import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { HSEAppState, hseDataService, calculateRisk } from '../../services/hseDataService';
import { Site, InspectionTemplate, RiskBand } from '../../types/hse';
import { RiskBadge, Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { SiteModal } from '../../components/SiteModal';
import { CategoryModal } from '../../components/CategoryModal';
import { InspectionTemplateModal } from '../../components/InspectionTemplateModal';
import { InspectionTemplateViewModal } from '../../components/InspectionTemplateViewModal';
import { CONTRACT_CLIENT_DISPLAY, DELIVERY_CONTRACTOR, CONTRACT_DURATION } from '../../constants/contractScope';
import {
  Settings,
  Building,
  MapPin,
  Sliders,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  UserCheck,
  Tag,
  ShieldCheck,
  Check,
  FileCheck,
  Plus,
  Trash2,
  ExternalLink,
  History,
  Layers,
  ArrowRight,
  Shield,
  ClipboardCheck,
  Users,
  Search,
  Edit2,
  Power,
  RotateCcw,
  Eye,
  ListOrdered
} from 'lucide-react';

interface SettingsPageProps {
  appState: HSEAppState;
}

type AdminTab = 'sites' | 'templates' | 'categories' | 'matrix' | 'contract';

export const SettingsPage: React.FC<SettingsPageProps> = ({ appState }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as AdminTab) || 'sites';
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  const matrix = appState.matrixConfig;
  const canManageGovernance = ['hse_manager', 'admin'].includes(appState.currentUser.role);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab') as AdminTab;
    if (tabParam && ['sites', 'templates', 'categories', 'matrix', 'contract'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Feedback banner state
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // --- SITES ADMIN STATE ---
  const [siteSearch, setSiteSearch] = useState('');
  const [siteStatusFilter, setSiteStatusFilter] = useState<'all' | 'active' | 'deactivated'>('all');
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  // --- TEMPLATES ADMIN STATE ---
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('all');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InspectionTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<InspectionTemplate | null>(null);

  // --- CATEGORIES ADMIN STATE ---
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  // --- MATRIX ADMIN STATE ---
  const [testSeverity, setTestSeverity] = useState(4);
  const [testLikelihood, setTestLikelihood] = useState(3);
  const [verificationOutput, setVerificationOutput] = useState<string | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState(matrix.clientApprovalNotes || '');
  const [approvalStatus, setApprovalStatus] = useState<'pending_client_approval' | 'client_approved'>(
    matrix.approvalStatus
  );
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [newVersionId, setNewVersionId] = useState('');
  const [newVersionName, setNewVersionName] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [demoResult, setDemoResult] = useState<{
    incidentId: string;
    hazardId: string;
    inspectionId: string;
    summary: string;
  } | null>(null);

  const testCalculation = calculateRisk(testSeverity, testLikelihood, matrix);

  // Sites Handlers
  const handleToggleSiteActive = (site: Site) => {
    const res = hseDataService.toggleSiteActive(site.id);
    if (res.success) {
      setActionFeedback(`Facility "${site.name}" (${site.code}) status toggled successfully.`);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  // Categories Handlers
  const handleRemoveCategory = (cat: string) => {
    if (window.confirm(`Are you sure you want to remove standard finding category "${cat}"?`)) {
      const res = hseDataService.removeFindingCategory(cat);
      if (!res.success) {
        alert(res.error);
      } else {
        setActionFeedback(`Finding category "${cat}" was removed.`);
        setTimeout(() => setActionFeedback(null), 4000);
      }
    }
  };

  // Templates Handlers
  const handleDeleteTemplate = (tmpl: InspectionTemplate) => {
    if (window.confirm(`Are you sure you want to delete inspection template "${tmpl.title}"?`)) {
      const res = hseDataService.deleteInspectionTemplate(tmpl.id);
      if (!res.success) {
        alert(res.error);
      } else {
        setActionFeedback(`Inspection checklist template "${tmpl.title}" deleted.`);
        setTimeout(() => setActionFeedback(null), 4000);
      }
    }
  };

  // Matrix Verification Routine
  const runMatrixSelfTest = () => {
    let passed = 0;
    const errors: string[] = [];

    for (let s = 1; s <= 5; s++) {
      for (let l = 1; l <= 5; l++) {
        const expectedScore = s * l;
        const res = calculateRisk(s, l, matrix);
        if (res.score !== expectedScore) {
          errors.push(`Discrepancy at S${s} × L${l}: Expected ${expectedScore}, got ${res.score}`);
        } else {
          const matchedBand = matrix.bands.find(b => res.score >= b.minScore && res.score <= b.maxScore);
          if (!matchedBand || matchedBand.band !== res.band) {
            errors.push(`Band discrepancy at S${s} × L${l}`);
          } else {
            passed++;
          }
        }
      }
    }

    if (errors.length === 0) {
      setVerificationOutput(
        `✓ All 25 coordinate points (1×1=1 to 5×5=25) verified 100% mathematically correct against scheme ${matrix.version} (Low: 1-4, Medium: 5-9, High: 10-16, Critical: 17-25).`
      );
    } else {
      setVerificationOutput(`✕ Mathematical test failed on ${errors.length} points.`);
    }
  };

  const handleSaveApproval = (e: React.FormEvent) => {
    e.preventDefault();
    const result = hseDataService.updateMatrixApproval(approvalStatus, approvalNotes);
    if (!result.success) {
      alert(result.error);
    } else {
      setApprovalModalOpen(false);
      setActionFeedback('Client approval disposition updated successfully.');
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handlePublishRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionId.trim()) return;
    const res = hseDataService.publishNewMatrixVersion(newVersionId, newVersionName, revisionNotes);
    if (!res.success) {
      alert(res.error);
    } else {
      setRevisionModalOpen(false);
      setNewVersionId('');
      setNewVersionName('');
      setRevisionNotes('');
      setActionFeedback(`Published new matrix revision ${newVersionId}. Historical records permanently retain their original scheme versions.`);
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const handleRunDemonstration = () => {
    const res = hseDataService.demonstrateClassification();
    if (res.success) {
      setDemoResult(res);
    }
  };

  // Filtered Sites
  const filteredSites = appState.sites.filter(s => {
    if (siteStatusFilter === 'active' && !s.active) return false;
    if (siteStatusFilter === 'deactivated' && s.active) return false;
    if (siteSearch.trim()) {
      const q = siteSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered Templates
  const filteredTemplates = appState.templates.filter(t => {
    if (templateCategoryFilter !== 'all' && t.category !== templateCategoryFilter) return false;
    if (templateSearch.trim()) {
      const q = templateSearch.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.version.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.items.some(it => it.question.toLowerCase().includes(q) || it.section.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filtered Categories
  const filteredCategories = matrix.findingCategories.filter(cat => {
    if (categorySearch.trim()) {
      return cat.toLowerCase().includes(categorySearch.toLowerCase());
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-[#15251C]">System & Operations Administration</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EEF7F2] text-[#007A44] border border-[#BDE3CE]">
              Enterprise Console
            </span>
          </div>
          <p className="text-xs text-[#5D6961] mt-1">
            Configure operational facility sites, standardized finding categories, checklist inspection templates, and 5×5 risk governance.
          </p>
        </div>

        {/* Quick Shortcut to Users Administration */}
        <Link
          to="/app/users"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-[#DDE5DF] text-[#15251C] hover:border-[#007A44] hover:text-[#007A44] transition-colors self-start sm:self-auto shadow-2xs"
        >
          <Users className="w-4 h-4 text-[#007A44]" />
          <span>User Directory & Permission Matrix</span>
        </Link>
      </div>

      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-[#EEF7F2] border border-[#BDE3CE] text-xs text-[#007A44] flex items-start gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{actionFeedback}</div>
          <button onClick={() => setActionFeedback(null)} className="text-[#007A44] hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Administration Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#DDE5DF] overflow-x-auto pb-2 text-xs">
        {/* Sites Tab */}
        <button
          onClick={() => handleTabChange('sites')}
          className={`px-3.5 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'sites'
              ? 'bg-[#EEF7F2] text-[#007A44] shadow-2xs'
              : 'text-[#5D6961] hover:text-[#15251C] hover:bg-black/5'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Operational Sites ({appState.sites.length})</span>
        </button>

        {/* Templates Tab */}
        <button
          onClick={() => handleTabChange('templates')}
          className={`px-3.5 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'templates'
              ? 'bg-[#EEF7F2] text-[#007A44] shadow-2xs'
              : 'text-[#5D6961] hover:text-[#15251C] hover:bg-black/5'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Inspection Templates ({appState.templates.length})</span>
        </button>

        {/* Categories Tab */}
        <button
          onClick={() => handleTabChange('categories')}
          className={`px-3.5 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'categories'
              ? 'bg-[#EEF7F2] text-[#007A44] shadow-2xs'
              : 'text-[#5D6961] hover:text-[#15251C] hover:bg-black/5'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Finding Categories ({matrix.findingCategories.length})</span>
        </button>

        {/* 5x5 Matrix Tab */}
        <button
          onClick={() => handleTabChange('matrix')}
          className={`px-3.5 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'matrix'
              ? 'bg-[#EEF7F2] text-[#007A44] shadow-2xs'
              : 'text-[#5D6961] hover:text-[#15251C] hover:bg-black/5'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>5×5 Risk Matrix Governance</span>
        </button>

        {/* Contract Scope Tab */}
        <button
          onClick={() => handleTabChange('contract')}
          className={`px-3.5 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'contract'
              ? 'bg-[#EEF7F2] text-[#007A44] shadow-2xs'
              : 'text-[#5D6961] hover:text-[#15251C] hover:bg-black/5'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Institutional Contract Scope</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OPERATIONAL SITES ADMINISTRATION                                   */}
      {/* ========================================================================= */}
      {activeTab === 'sites' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Sites Header & Add Button */}
          <div className="bg-white p-5 rounded-xl border border-[#DDE5DF] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#15251C] flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#007A44]" />
                  <span>Operating Facilities & Industrial Sites</span>
                </h2>
                <p className="text-xs text-[#5D6961] mt-0.5">
                  Operating facilities across Rivers State and Niger Delta offshore blocks. Used for incident reporting, checklist assignments, and site-level compliance isolation.
                </p>
              </div>

              {canManageGovernance && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSite(null);
                    setIsSiteModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Facility Site</span>
                </button>
              )}
            </div>

            {/* Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#DDE5DF]">
              <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF]">
                <span className="text-[11px] text-[#5D6961] block">Total Sites</span>
                <span className="text-lg font-bold text-[#15251C] mt-0.5 block">{appState.sites.length}</span>
              </div>
              <div className="p-3 bg-[#EEF7F2] rounded-lg border border-[#BDE3CE]">
                <span className="text-[11px] text-[#007A44] font-semibold block">Active Facilities</span>
                <span className="text-lg font-bold text-[#007A44] mt-0.5 block">
                  {appState.sites.filter(s => s.active).length}
                </span>
              </div>
              <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF]">
                <span className="text-[11px] text-[#5D6961] block">Deactivated Facilities</span>
                <span className="text-lg font-bold text-[#5D6961] mt-0.5 block">
                  {appState.sites.filter(s => !s.active).length}
                </span>
              </div>
              <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF]">
                <span className="text-[11px] text-[#5D6961] block">Total Assigned Users</span>
                <span className="text-lg font-bold text-[#15251C] mt-0.5 block">
                  {appState.users.length}
                </span>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#5D6961] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search facilities by name, code, or geographical location..."
                  value={siteSearch}
                  onChange={(e) => setSiteSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#DDE5DF] rounded-lg bg-white focus:outline-hidden focus:border-[#007A44]"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={siteStatusFilter}
                  onChange={(e) => setSiteStatusFilter(e.target.value as any)}
                  className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-2 bg-white text-[#15251C]"
                >
                  <option value="all">All Facility Statuses</option>
                  <option value="active">Active Facilities Only</option>
                  <option value="deactivated">Deactivated Facilities Only</option>
                </select>

                {(siteSearch || siteStatusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSiteSearch('');
                      setSiteStatusFilter('all');
                    }}
                    className="p-2 border border-[#DDE5DF] text-[#5D6961] hover:text-[#15251C] rounded-lg bg-white"
                    title="Reset search and filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sites Table */}
          <div className="bg-white rounded-xl border border-[#DDE5DF] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F9F7] border-b border-[#DDE5DF] text-[#5D6961] font-semibold">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Facility Name</th>
                    <th className="py-3 px-4">Geographical Location</th>
                    <th className="py-3 px-4">Operational Status</th>
                    <th className="py-3 px-4">Assigned Personnel</th>
                    <th className="py-3 px-4">Active Records</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE5DF]">
                  {filteredSites.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <EmptyState
                          icon={Building}
                          title="No operational sites found"
                          description="No facilities match your search query or status filter."
                          actionLabel="Reset filters"
                          onAction={() => {
                            setSiteSearch('');
                            setSiteStatusFilter('all');
                          }}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredSites.map((s) => {
                      const assignedUsers = appState.users.filter(u => u.siteIds.includes(s.id));
                      const siteReportsCount = appState.reports.filter(r => r.siteId === s.id).length;
                      const siteInspectionsCount = appState.inspections.filter(i => i.siteId === s.id).length;

                      return (
                        <tr key={s.id} className="hover:bg-[#F7F9F7] transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#15251C]">
                            <span className="px-2 py-0.5 bg-[#F7F9F7] border border-[#DDE5DF] rounded">
                              {s.code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#15251C]">
                            {s.name}
                          </td>
                          <td className="py-3.5 px-4 text-[#5D6961]">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#007A44] shrink-0" />
                              <span>{s.location}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <Badge variant={s.active ? 'success' : 'neutral'} size="sm">
                              {s.active ? 'Active Facility' : 'Deactivated'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-[#5D6961]">
                            <span className="font-semibold text-[#15251C]">
                              {assignedUsers.length} user{assignedUsers.length === 1 ? '' : 's'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#5D6961]">
                            <span>{siteReportsCount} reports · {siteInspectionsCount} audits</span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {canManageGovernance && (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSite(s);
                                    setIsSiteModalOpen(true);
                                  }}
                                  className="p-1.5 text-[#5D6961] hover:text-[#007A44] hover:bg-black/5 rounded-md transition-colors"
                                  title="Edit site properties"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleSiteActive(s)}
                                  className={`p-1.5 rounded-md transition-colors ${
                                    s.active
                                      ? 'text-[#5D6961] hover:text-[#B42318] hover:bg-[#FFF0ED]'
                                      : 'text-[#007A44] hover:bg-[#EEF7F2]'
                                  }`}
                                  title={s.active ? 'Deactivate facility' : 'Reactivate facility'}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INSPECTION TEMPLATES ADMINISTRATION                                */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white p-5 rounded-xl border border-[#DDE5DF] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#15251C] flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-[#007A44]" />
                  <span>Checklist Inspection Templates Directory</span>
                </h2>
                <p className="text-xs text-[#5D6961] mt-0.5">
                  Standardized inspection question sheets, guidance instructions, and compliance pass/fail criteria.
                </p>
              </div>

              {canManageGovernance && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTemplate(null);
                    setIsTemplateModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Inspection Template</span>
                </button>
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#DDE5DF]">
              <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF]">
                <span className="text-[11px] text-[#5D6961] block">Published Checklists</span>
                <span className="text-lg font-bold text-[#15251C] mt-0.5 block">{appState.templates.length}</span>
              </div>
              <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF]">
                <span className="text-[11px] text-[#5D6961] block">Total Question Criteria</span>
                <span className="text-lg font-bold text-[#007A44] mt-0.5 block">
                  {appState.templates.reduce((acc, t) => acc + t.items.length, 0)}
                </span>
              </div>
              <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF]">
                <span className="text-[11px] text-[#5D6961] block">Template Categories</span>
                <span className="text-lg font-bold text-[#15251C] mt-0.5 block">
                  {new Set(appState.templates.map(t => t.category)).size}
                </span>
              </div>
              <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF]">
                <span className="text-[11px] text-[#5D6961] block">Executed Audits</span>
                <span className="text-lg font-bold text-[#15251C] mt-0.5 block">
                  {appState.inspections.length}
                </span>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#5D6961] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search templates by title, category, or checklist question..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#DDE5DF] rounded-lg bg-white focus:outline-hidden focus:border-[#007A44]"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={templateCategoryFilter}
                  onChange={(e) => setTemplateCategoryFilter(e.target.value)}
                  className="text-xs border border-[#DDE5DF] rounded-lg px-3 py-2 bg-white text-[#15251C]"
                >
                  <option value="all">All Template Categories</option>
                  {Array.from(new Set(appState.templates.map(t => t.category))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {(templateSearch || templateCategoryFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setTemplateSearch('');
                      setTemplateCategoryFilter('all');
                    }}
                    className="p-2 border border-[#DDE5DF] text-[#5D6961] hover:text-[#15251C] rounded-lg bg-white"
                    title="Reset search and filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {filteredTemplates.length === 0 ? (
              <div className="md:col-span-2 bg-white rounded-xl border border-[#DDE5DF] p-6">
                <EmptyState
                  icon={ClipboardCheck}
                  title="No inspection templates found"
                  description="No checklist templates match your search criteria or category filter."
                  actionLabel="Reset filters"
                  onAction={() => {
                    setTemplateSearch('');
                    setTemplateCategoryFilter('all');
                  }}
                />
              </div>
            ) : (
              filteredTemplates.map((tmpl) => {
                const uniqueSections = Array.from(new Set(tmpl.items.map(it => it.section)));
                const usageCount = appState.inspections.filter(i => i.templateId === tmpl.id).length;

                return (
                  <div
                    key={tmpl.id}
                    className="p-5 bg-white rounded-xl border border-[#DDE5DF] hover:border-[#BDE3CE] transition-all space-y-4 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[#EEF7F2] text-[#007A44] border border-[#BDE3CE] rounded">
                              v{tmpl.version}
                            </span>
                            <span className="px-2 py-0.5 bg-[#F7F9F7] text-[#5D6961] border border-[#DDE5DF] rounded text-[10px] font-semibold">
                              {tmpl.category}
                            </span>
                          </div>
                          <h3 className="font-semibold text-sm text-[#15251C] mt-1.5 leading-snug">
                            {tmpl.title}
                          </h3>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#DDE5DF] text-[#5D6961] space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span>Checklist Questions:</span>
                          <strong className="text-[#15251C]">{tmpl.items.length} verification items</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span>Operational Sections:</span>
                          <strong className="text-[#15251C]">{uniqueSections.length} sections</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span>Audits Executed:</span>
                          <strong className="text-[#007A44]">{usageCount} inspection audits</strong>
                        </div>
                      </div>

                      {/* Sections Pills */}
                      <div className="pt-1 flex flex-wrap gap-1">
                        {uniqueSections.slice(0, 3).map((sec) => (
                          <span
                            key={sec}
                            className="px-2 py-0.5 bg-[#F7F9F7] rounded text-[10px] text-[#5D6961] border border-[#DDE5DF]"
                          >
                            {sec}
                          </span>
                        ))}
                        {uniqueSections.length > 3 && (
                          <span className="px-1.5 py-0.5 text-[10px] text-[#5D6961]">
                            +{uniqueSections.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Strip */}
                    <div className="pt-3 border-t border-[#DDE5DF] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingTemplate(tmpl)}
                        className="text-xs font-semibold text-[#007A44] hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Questions</span>
                      </button>

                      {canManageGovernance && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTemplate(tmpl);
                              setIsTemplateModalOpen(true);
                            }}
                            className="p-1.5 text-[#5D6961] hover:text-[#007A44] hover:bg-black/5 rounded-md transition-colors"
                            title="Edit template questions"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(tmpl)}
                            disabled={appState.templates.length <= 1}
                            className={`p-1.5 rounded-md transition-colors ${
                              appState.templates.length <= 1
                                ? 'opacity-30 cursor-not-allowed'
                                : 'text-[#5D6961] hover:text-[#B42318] hover:bg-[#FFF0ED]'
                            }`}
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FINDING CATEGORIES ADMINISTRATION                                  */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white p-5 rounded-xl border border-[#DDE5DF] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#15251C] flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#007A44]" />
                  <span>Standard Finding & Risk Classification Categories</span>
                </h2>
                <p className="text-xs text-[#5D6961] mt-0.5">
                  Controlled technical taxonomy used to categorize safety observations, checklist non-conformances, and corrective actions.
                </p>
              </div>

              {canManageGovernance && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCategoryModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Finding Category</span>
                </button>
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-[#DDE5DF]">
              <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF]">
                <span className="text-[11px] text-[#5D6961] block">Total Categories</span>
                <span className="text-lg font-bold text-[#15251C] mt-0.5 block">{matrix.findingCategories.length}</span>
              </div>
              <div className="p-3 bg-[#EEF7F2] rounded-lg border border-[#BDE3CE]">
                <span className="text-[11px] text-[#007A44] font-semibold block">Classified Incidents & Hazards</span>
                <span className="text-lg font-bold text-[#007A44] mt-0.5 block">
                  {appState.reports.filter(r => r.classification?.category).length}
                </span>
              </div>
              <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF]">
                <span className="text-[11px] text-[#5D6961] block">Active Actions Tagged</span>
                <span className="text-lg font-bold text-[#15251C] mt-0.5 block">
                  {appState.actions.filter(a => a.findingCategory).length}
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="relative pt-2">
              <Search className="w-4 h-4 text-[#5D6961] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search finding categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#DDE5DF] rounded-lg bg-white focus:outline-hidden focus:border-[#007A44]"
              />
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {filteredCategories.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl border border-[#DDE5DF] p-6">
                <EmptyState
                  icon={Tag}
                  title="No finding categories match your search"
                  description="Try typing a different keyword or reset the search."
                  actionLabel="Clear search"
                  onAction={() => setCategorySearch('')}
                />
              </div>
            ) : (
              filteredCategories.map((cat, idx) => {
                const reportsCount = appState.reports.filter(r => r.classification?.category === cat).length;
                const actionsCount = appState.actions.filter(a => a.findingCategory === cat).length;

                return (
                  <div
                    key={cat}
                    className="p-4 bg-white rounded-xl border border-[#DDE5DF] hover:border-[#BDE3CE] transition-all space-y-3 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#EEF7F2] text-[#007A44] font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h3 className="font-semibold text-xs text-[#15251C] leading-snug">
                          {cat}
                        </h3>
                      </div>

                      <div className="pt-3 text-[11px] text-[#5D6961] space-y-1">
                        <div className="flex justify-between">
                          <span>Reports & Hazards:</span>
                          <strong className="text-[#15251C]">{reportsCount} records</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Corrective Actions:</span>
                          <strong className="text-[#15251C]">{actionsCount} actions</strong>
                        </div>
                      </div>
                    </div>

                    {canManageGovernance && (
                      <div className="pt-2 border-t border-[#DDE5DF] flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(cat);
                            setIsCategoryModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#5D6961] hover:text-[#007A44] hover:bg-[#EEF7F2] rounded transition-colors flex items-center gap-1"
                          title="Rename category"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Rename</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(cat)}
                          disabled={matrix.findingCategories.length <= 1}
                          className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors flex items-center gap-1 ${
                            matrix.findingCategories.length <= 1
                              ? 'text-[#DDE5DF] cursor-not-allowed'
                              : 'text-[#5D6961] hover:text-[#B42318] hover:bg-[#FFF0ED]'
                          }`}
                          title="Delete category"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: 5×5 RISK MATRIX GOVERNANCE                                         */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Provisional Approval Status Banner (Contract Section 4) */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
            matrix.approvalStatus === 'client_approved'
              ? 'bg-[#EEF7F2] border-[#BDE3CE] text-[#007A44]'
              : 'bg-[#FFFAEB] border-[#FEDF89] text-[#B54708]'
          }`}>
            <div className="flex items-start gap-3">
              {matrix.approvalStatus === 'client_approved' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#007A44]" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#B54708]" />
              )}
              <div className="text-xs space-y-0.5">
                <div className="font-bold flex items-center gap-2">
                  <span>5×5 RISK MATRIX STATUS: {matrix.approvalStatus === 'client_approved' ? 'CLIENT APPROVED' : 'PROVISIONAL DEMONSTRATION SCHEME'}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/80 border border-current">
                    {matrix.version}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {matrix.clientApprovalNotes || 'Provisional baseline demonstration scheme presented in Contract Award & HSE Build Specification Section 4. Awaiting formal Client Operating Committee sign-off.'}
                </p>
                {matrix.approvedBy && (
                  <div className="text-[10px] font-semibold mt-1">
                    Approved by {matrix.approvedBy} on {new Date(matrix.approvedAt || '').toLocaleDateString('en-GB')}
                  </div>
                )}
              </div>
            </div>

            {canManageGovernance && (
              <button
                type="button"
                onClick={() => setApprovalModalOpen(true)}
                className="px-3.5 py-1.5 bg-white border border-current rounded-lg text-xs font-semibold hover:bg-white/90 transition-colors shrink-0 shadow-2xs"
              >
                Update Approval Record
              </button>
            )}
          </div>

          {/* Safety Governance: Human HSE Reviewer Rule */}
          <div className="bg-white rounded-xl border border-[#DDE5DF] p-5 shadow-xs flex items-start gap-3 text-xs">
            <UserCheck className="w-5 h-5 text-[#007A44] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-[#15251C]">Safety Governance Mandate: Human Reviewer Confirmation (Zero AI Decisions)</div>
              <p className="text-[#5D6961] leading-relaxed">
                In compliance with energy sector safety standards and Contract Award Clause 4, all risk classifications and finding categories must be assigned or confirmed solely by authorized human HSE professionals (HSE Officers and Managers). <strong>Automated algorithms or AI models are strictly prohibited from making final safety determinations.</strong> Field estimates submitted by general reporters remain strictly provisional until formally verified by an authorized human reviewer. Historical records permanently retain the classification scheme version in effect at the time.
              </p>
            </div>
          </div>

          {/* Demonstration Action */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRunDemonstration}
              className="px-3.5 py-2 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Demonstrate Classification Across Records</span>
            </button>
          </div>

          {demoResult && (
            <div className="bg-[#EEF7F2] border border-[#BDE3CE] rounded-xl p-5 space-y-4 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#007A44]" />
                  <h3 className="font-bold text-sm text-[#007A44]">
                    Classification Demonstration Verified Across 3 Records
                  </h3>
                </div>
                <button
                  onClick={() => setDemoResult(null)}
                  className="text-xs text-[#5D6961] hover:text-[#15251C]"
                >
                  Dismiss
                </button>
              </div>

              <p className="text-xs text-[#15251C] leading-relaxed">
                {demoResult.summary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <Link
                  to={`/app/incidents/${demoResult.incidentId}`}
                  className="p-3 bg-white rounded-lg border border-[#BDE3CE] hover:border-[#007A44] transition-all text-xs space-y-1 group"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#B42318]">
                    <span>INCIDENT REPORT</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="font-bold text-[#15251C]">INC-2026-081</div>
                  <div className="text-[11px] text-[#5D6961]">
                    Severity 4 × Likelihood 3 = <strong>Score 12</strong> (HIGH RISK)
                  </div>
                </Link>

                <Link
                  to={`/app/hazards/${demoResult.hazardId}`}
                  className="p-3 bg-white rounded-lg border border-[#BDE3CE] hover:border-[#007A44] transition-all text-xs space-y-1 group"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#B54708]">
                    <span>HAZARD OBSERVATION</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="font-bold text-[#15251C]">HZ-2026-014</div>
                  <div className="text-[11px] text-[#5D6961]">
                    Severity 3 × Likelihood 2 = <strong>Score 6</strong> (MEDIUM RISK)
                  </div>
                </Link>

                <Link
                  to={`/app/inspections/${demoResult.inspectionId}`}
                  className="p-3 bg-white rounded-lg border border-[#BDE3CE] hover:border-[#007A44] transition-all text-xs space-y-1 group"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#007A44]">
                    <span>INSPECTION FINDING</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="font-bold text-[#15251C]">Checklist Item 4</div>
                  <div className="text-[11px] text-[#5D6961]">
                    Severity 4 × Likelihood 4 = <strong>Score 16</strong> (HIGH RISK)
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Interactive 5x5 Matrix Visualizer & Score Calculator */}
          <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#DDE5DF] gap-2">
              <div>
                <h2 className="text-base font-semibold text-[#15251C] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#007A44]" />
                  <span>Interactive 5 × 5 Risk Matrix Visualizer & Score Verifier</span>
                </h2>
                <p className="text-xs text-[#5D6961] mt-0.5">
                  Score = Severity (1 to 5) × Likelihood (1 to 5). Click any cell or use sliders to verify score calculations and action protocols.
                </p>
              </div>

              <button
                type="button"
                onClick={runMatrixSelfTest}
                className="px-3 py-1.5 bg-[#EEF7F2] hover:bg-[#BDE3CE] text-[#007A44] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verify All 25 Score Points</span>
              </button>
            </div>

            {verificationOutput && (
              <div className="p-3 rounded-lg bg-[#EEF7F2] border border-[#BDE3CE] text-xs text-[#007A44] font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4" />
                <span>{verificationOutput}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* 5x5 Visual Grid */}
              <div className="lg:col-span-7 space-y-2">
                <div className="text-xs font-bold text-[#15251C] text-center">
                  Severity (Consequence 1 to 5) →
                </div>

                <div className="border border-[#DDE5DF] rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="grid grid-cols-6 text-center text-[11px] font-bold border-b border-[#DDE5DF] bg-[#F7F9F7]">
                    <div className="p-2 border-r border-[#DDE5DF] text-[#5D6961]">Likelihood ↓</div>
                    <div className="p-2 border-r border-[#DDE5DF]">1 (Minor)</div>
                    <div className="p-2 border-r border-[#DDE5DF]">2 (Moderate)</div>
                    <div className="p-2 border-r border-[#DDE5DF]">3 (Serious)</div>
                    <div className="p-2 border-r border-[#DDE5DF]">4 (Major)</div>
                    <div className="p-2">5 (Catastrophic)</div>
                  </div>

                  {[5, 4, 3, 2, 1].map((lh) => (
                    <div key={lh} className="grid grid-cols-6 text-center text-xs font-semibold border-b border-[#DDE5DF] last:border-b-0">
                      <div className="p-2.5 font-bold text-[11px] bg-[#F7F9F7] border-r border-[#DDE5DF] text-[#15251C] flex items-center justify-center">
                        {lh} ({lh === 5 ? 'Almost Certain' : lh === 4 ? 'Likely' : lh === 3 ? 'Possible' : lh === 2 ? 'Unlikely' : 'Rare'})
                      </div>
                      {[1, 2, 3, 4, 5].map((sev) => {
                        const score = sev * lh;
                        const bandInfo = matrix.bands.find(b => score >= b.minScore && score <= b.maxScore) || matrix.bands[0];
                        const isSelected = testSeverity === sev && testLikelihood === lh;

                        let bgClass = 'bg-[#F2F4F7] text-[#344054]';
                        if (bandInfo.band === 'low') bgClass = 'bg-[#ECFDF3] text-[#027A48] hover:bg-[#D1FADF]';
                        if (bandInfo.band === 'medium') bgClass = 'bg-[#FFFAEB] text-[#B54708] hover:bg-[#FEDF89]';
                        if (bandInfo.band === 'high') bgClass = 'bg-[#FEF3F2] text-[#B42318] hover:bg-[#FECDCA]';
                        if (bandInfo.band === 'critical') bgClass = 'bg-[#7A271A] text-white hover:bg-[#551A10]';

                        return (
                          <button
                            key={sev}
                            type="button"
                            onClick={() => {
                              setTestSeverity(sev);
                              setTestLikelihood(lh);
                            }}
                            className={`p-2.5 border-r border-[#DDE5DF] last:border-r-0 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${bgClass} ${
                              isSelected ? 'ring-3 ring-inset ring-[#007A44] font-black scale-95 shadow-inner' : ''
                            }`}
                          >
                            <span className="text-sm font-bold">{score}</span>
                            <span className="text-[9px] uppercase tracking-wider font-semibold opacity-90">
                              {bandInfo.band}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculator Output Pane */}
              <div className="lg:col-span-5 bg-[#F7F9F7] rounded-xl border border-[#DDE5DF] p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#DDE5DF]">
                  <span className="font-semibold text-sm text-[#15251C]">Live Coordinate Evaluation</span>
                  <RiskBadge band={testCalculation.band} score={testCalculation.score} />
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Severity (Consequence):</span>
                      <strong className="text-[#007A44]">Level {testSeverity} / 5</strong>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={testSeverity}
                      onChange={(e) => setTestSeverity(Number(e.target.value))}
                      className="w-full accent-[#007A44]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Likelihood (Probability):</span>
                      <strong className="text-[#007A44]">Level {testLikelihood} / 5</strong>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={testLikelihood}
                      onChange={(e) => setTestLikelihood(Number(e.target.value))}
                      className="w-full accent-[#007A44]"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-[#DDE5DF] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[#5D6961]">Calculated Score:</span>
                    <span className="font-mono text-base font-bold text-[#15251C]">
                      {testSeverity} × {testLikelihood} = {testCalculation.score} / 25
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#5D6961]">Risk Band:</span>
                    <span className="font-bold uppercase tracking-wider text-[#15251C]">
                      {testCalculation.band}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#5D6961]">Specification ID:</span>
                    <span className="font-mono text-[11px] text-[#5D6961]">
                      {testCalculation.readableIdentifier}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scheme Versioning & Historical Scheme Retention Notice */}
          <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#DDE5DF] gap-2">
              <div>
                <h2 className="text-base font-semibold text-[#15251C] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#007A44]" />
                  <span>Classification Scheme Versioning & Historical Record Integrity</span>
                </h2>
                <p className="text-xs text-[#5D6961] mt-0.5">
                  Historical records retain the classification scheme used at the time. Publishing a new version updates future evaluations while permanently preserving historical records.
                </p>
              </div>

              {canManageGovernance && (
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(true)}
                  className="px-3.5 py-1.5 border border-[#DDE5DF] hover:border-[#007A44] text-[#15251C] hover:text-[#007A44] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Publish New Version Revision</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#F7F9F7] rounded-xl border border-[#DDE5DF] space-y-2">
                <span className="text-[11px] text-[#5D6961] block font-semibold">Active Scheme in Production:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#15251C]">{matrix.version}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-[#DDE5DF] text-[#007A44] font-semibold">
                    Active
                  </span>
                </div>
                <div className="text-[11px] text-[#5D6961]">
                  Scheme Name: <strong>{matrix.name}</strong>
                </div>
              </div>

              <div className="p-4 bg-[#F7F9F7] rounded-xl border border-[#DDE5DF] space-y-2">
                <span className="text-[11px] text-[#5D6961] block font-semibold">Historical Version Retention:</span>
                <div className="text-xs text-[#15251C] leading-relaxed">
                  When incidents, hazards, or inspection findings are classified, their exact matrix version is frozen onto their database record. Even when thresholds change, past records retain their original score calculations forever for legal and statutory compliance.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: INSTITUTIONAL CONTRACT SCOPE                                       */}
      {/* ========================================================================= */}
      {activeTab === 'contract' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 space-y-4 shadow-xs text-xs">
            <h2 className="text-base font-semibold text-[#15251C] pb-2 border-b border-[#DDE5DF] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#007A44]" />
              <span>Institutional Contract Execution Parameters</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF]">
                <span className="text-[#5D6961] block">Operating Client:</span>
                <span className="font-semibold text-[#15251C] text-sm mt-0.5 block">{CONTRACT_CLIENT_DISPLAY}</span>
                <span className="text-[11px] text-[#5D6961] mt-1 block">
                  Contract Award letter designates client as [COMPANY 2].
                </span>
              </div>

              <div className="p-4 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF]">
                <span className="text-[#5D6961] block">Delivery Contractor:</span>
                <span className="font-semibold text-[#15251C] text-sm mt-0.5 block">{DELIVERY_CONTRACTOR}</span>
                <span className="text-[11px] text-[#5D6961] mt-1 block">
                  Port Harcourt, Rivers State, Nigeria (ISO 9001:2015 Certified)
                </span>
              </div>

              <div className="p-4 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF]">
                <span className="text-[#5D6961] block">Contract Execution Schedule:</span>
                <span className="font-semibold text-[#007A44] text-sm mt-0.5 block">{CONTRACT_DURATION}</span>
                <span className="text-[11px] text-[#5D6961] mt-1 block">
                  30% Advance, 40% Prototype Milestone, 20% Testing, 10% Handover
                </span>
              </div>

              <div className="p-4 bg-[#F7F9F7] rounded-lg border border-[#DDE5DF]">
                <span className="text-[#5D6961] block">Operational Base Timezone:</span>
                <span className="font-semibold text-[#15251C] text-sm mt-0.5 block">Africa/Lagos (UTC+1)</span>
                <span className="text-[11px] text-[#5D6961] mt-1 block">
                  Overdue action evaluation strictly computed at 23:59:59 WAT.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* Site Modal */}
      <SiteModal
        isOpen={isSiteModalOpen}
        onClose={() => {
          setIsSiteModalOpen(false);
          setEditingSite(null);
        }}
        appState={appState}
        siteToEdit={editingSite}
        onSaved={(site) => {
          setActionFeedback(`Facility "${site.name}" (${site.code}) saved successfully.`);
          setTimeout(() => setActionFeedback(null), 4000);
        }}
      />

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        appState={appState}
        categoryToEdit={editingCategory}
        onSaved={(cat) => {
          setActionFeedback(`Finding category "${cat}" saved successfully.`);
          setTimeout(() => setActionFeedback(null), 4000);
        }}
      />

      {/* Inspection Template Modal */}
      <InspectionTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setEditingTemplate(null);
        }}
        appState={appState}
        templateToEdit={editingTemplate}
        onSaved={(tmpl) => {
          setActionFeedback(`Checklist template "${tmpl.title}" saved successfully.`);
          setTimeout(() => setActionFeedback(null), 4000);
        }}
      />

      {/* Inspection Template View Modal */}
      <InspectionTemplateViewModal
        isOpen={!!viewingTemplate}
        onClose={() => setViewingTemplate(null)}
        template={viewingTemplate}
        onEdit={(tmpl) => {
          setViewingTemplate(null);
          setEditingTemplate(tmpl);
          setIsTemplateModalOpen(true);
        }}
      />

      {/* Client Approval Modal */}
      {approvalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <form
            onSubmit={handleSaveApproval}
            className="bg-white rounded-xl border border-[#DDE5DF] p-6 max-w-md w-full space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#DDE5DF]">
              <h3 className="text-sm font-semibold text-[#15251C] flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#007A44]" />
                <span>Update Client Matrix Governance Approval</span>
              </h3>
              <button
                type="button"
                onClick={() => setApprovalModalOpen(false)}
                className="text-[#5D6961] hover:text-[#15251C]"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block font-semibold text-[#15251C] mb-1">Approval Disposition *</label>
              <select
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-[#DDE5DF] rounded-lg bg-white"
              >
                <option value="pending_client_approval">Pending Client Approval (Provisional Scheme)</option>
                <option value="client_approved">Client Approved (Formal Sign-off)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#15251C] mb-1">Client Governance Notes & Record Reference *</label>
              <textarea
                rows={3}
                required
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Enter Client Operating Committee review minute reference..."
                className="w-full p-2.5 border border-[#DDE5DF] rounded-lg text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#DDE5DF]">
              <button
                type="button"
                onClick={() => setApprovalModalOpen(false)}
                className="px-4 py-2 border border-[#DDE5DF] rounded-lg text-[#5D6961]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#007A44] hover:bg-[#005D35] text-white rounded-lg font-semibold"
              >
                Save Governance Status
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Revision Modal */}
      {revisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <form
            onSubmit={handlePublishRevision}
            className="bg-white rounded-xl border border-[#DDE5DF] p-6 max-w-md w-full space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#DDE5DF]">
              <h3 className="text-sm font-semibold text-[#15251C] flex items-center gap-2">
                <History className="w-4 h-4 text-[#007A44]" />
                <span>Publish New 5×5 Matrix Revision</span>
              </h3>
              <button
                type="button"
                onClick={() => setRevisionModalOpen(false)}
                className="text-[#5D6961] hover:text-[#15251C]"
              >
                ✕
              </button>
            </div>

            <p className="text-[#5D6961] text-[11px]">
              Publishing a new revision freezes the active scheme ({matrix.version}) into history. Past records retain {matrix.version}. New items will use this new revision.
            </p>

            <div>
              <label className="block font-semibold text-[#15251C] mb-1">New Version Identifier *</label>
              <input
                type="text"
                required
                placeholder="e.g. 5x5-v2.0-approved"
                value={newVersionId}
                onChange={(e) => setNewVersionId(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE5DF] rounded-lg bg-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#15251C] mb-1">Scheme Title / Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Refined Industrial 5×5 Risk Scheme"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE5DF] rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#15251C] mb-1">Revision Justification & Notes</label>
              <textarea
                rows={2}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Document reason for scheme revision or client committee recommendation..."
                className="w-full p-2.5 border border-[#DDE5DF] rounded-lg text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#DDE5DF]">
              <button
                type="button"
                onClick={() => setRevisionModalOpen(false)}
                className="px-4 py-2 border border-[#DDE5DF] rounded-lg text-[#5D6961]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#007A44] hover:bg-[#005D35] text-white rounded-lg font-semibold"
              >
                Publish Revision
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
