import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExousiaLogo } from '../../components/ExousiaLogo';
import { ContractReferenceModal } from '../../components/ContractReferenceModal';
import { offshoreImg, trainingImg } from '../../assets/landingPhotos';
import {
  Shield,
  ArrowRight,
  Menu,
  X,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  ArrowUpRight,
  Building
} from 'lucide-react';

type TabKey = 'reporting' | 'inspections' | 'actions' | 'compliance';

interface TabItem {
  id: TabKey;
  label: string;
  subtitle: string;
  badge: string;
  headline: string;
  description: string;
  route: string;
  routeLabel: string;
  code: string;
  status: string;
  statusColor: string;
  sampleTitle: string;
  sampleMeta: string;
  nextStep: string;
}

const PLATFORM_TABS: TabItem[] = [
  {
    id: 'reporting',
    label: 'Field Reporting',
    subtitle: 'Incidents, near misses & hazards',
    badge: 'FRONT-LINE CAPTURE',
    headline: 'Capture reality on the ground. Make it actionable immediately.',
    description:
      'Record precise operational observations, GPS or facility locations, and instant mitigation actions. Give supervisors the context required to prevent repeat hazards.',
    route: '/app/incidents',
    routeLabel: 'Open Incident Workspace',
    code: 'HZ-2026-014',
    status: 'Awaiting review',
    statusColor: 'bg-[#EEF7F2] text-[#007A44] border-[#BDE3CE]',
    sampleTitle: 'Obstructed emergency escape walkway',
    sampleMeta: 'Operations Yard · Hazard observation · High priority',
    nextStep: 'Classify risk & assign accountable supervisor'
  },
  {
    id: 'inspections',
    label: 'Inspection Schedules',
    subtitle: 'Checklists, audits & findings',
    badge: 'SYSTEMATIC VERIFICATION',
    headline: 'Structured rounds. Direct conversion from failure to action.',
    description:
      'Eliminate loose paper clipboards and drifting spreadsheets. Dynamic Pass / Fail / NA grading instantly flags mechanical and procedural non-conformances into assigned tasks.',
    route: '/app/inspections',
    routeLabel: 'View Inspection Checklists',
    code: 'INS-2026-088',
    status: 'In progress (82%)',
    statusColor: 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]',
    sampleTitle: 'Weekly Offshore Wellhead & Flare Deck Audit',
    sampleMeta: 'Production Deck Bravo · Routine mechanical audit',
    nextStep: '2 non-conformances flagged for corrective assignment'
  },
  {
    id: 'actions',
    label: 'Corrective Actions (CAPA)',
    subtitle: 'Accountability, proof & closure',
    badge: 'TWO-PERSON RULE',
    headline: 'Enforce accountability. Close the loop with photographic proof.',
    description:
      'Every action has a single responsible owner and calendar target. Owners upload photographic evidence, but cannot self-approve; an independent HSE officer must verify closure.',
    route: '/app/actions',
    routeLabel: 'Track Action Follow-Through',
    code: 'ACT-2026-031',
    status: 'Evidence submitted',
    statusColor: 'bg-[#FEF6EE] text-[#B54708] border-[#F9DBAF]',
    sampleTitle: 'Replace degraded hydraulic hose guard on Crane 3',
    sampleMeta: 'Operations Yard · Remediated with photographic proof',
    nextStep: 'Pending independent HSE Officer verification'
  },
  {
    id: 'compliance',
    label: 'Compliance & Assurance',
    subtitle: 'Registers, audit trails & export',
    badge: 'STATUTORY AUDIT TRAILS',
    headline: 'Verified statutory posture, not calendar assumptions.',
    description:
      'Clear separation between evaluated operational compliance and renewal schedules. Generate certified management summaries, audit logs, and exportable data packages on demand.',
    route: '/app/compliance',
    routeLabel: 'Review Compliance Register',
    code: 'CMP-2026-003',
    status: 'Fully compliant',
    statusColor: 'bg-[#EEF7F2] text-[#007A44] border-[#BDE3CE]',
    sampleTitle: 'DPR / NUPRC Pressure Vessel Integrity Standard',
    sampleMeta: 'Statutory Obligation · Annual statutory certification',
    nextStep: 'All 8 supporting mechanical verification tests passed'
  }
];

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<TabKey>('reporting');
  const tabListRef = useRef<HTMLDivElement>(null);

  const currentTab = PLATFORM_TABS.find((t) => t.id === activePlatformTab) || PLATFORM_TABS[0];

  // Accessible keyboard navigation for tabs (Left/Right or Up/Down arrows)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      newIndex = (index + 1) % PLATFORM_TABS.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      newIndex = (index - 1 + PLATFORM_TABS.length) % PLATFORM_TABS.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = PLATFORM_TABS.length - 1;
    }

    if (newIndex !== index) {
      const nextTab = PLATFORM_TABS[newIndex].id;
      setActivePlatformTab(nextTab);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
      buttons?.[newIndex]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#15251C] selection:bg-[#007A44]/15 selection:text-[#007A44] font-sans antialiased">
      {/* 1. Sticky Navigation Header (Light) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2ECE5] px-6 py-4 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <ExousiaLogo variant="full" theme="light" height={38} />
              <div className="hidden sm:block h-6 w-px bg-[#E2ECE5]" />
              <span className="hidden sm:inline-block text-xs font-semibold tracking-wide text-[#5D6961]">
                HSE Platform
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#15251C]" aria-label="Main Navigation">
            <a href="#platform" className="text-[#37473F] hover:text-[#007A44] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#007A44] rounded-sm py-1">
              Platform
            </a>
            <a href="#how-it-works" className="text-[#37473F] hover:text-[#007A44] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#007A44] rounded-sm py-1">
              How it works
            </a>
            <a href="#attention" className="text-[#37473F] hover:text-[#007A44] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#007A44] rounded-sm py-1">
              Operations
            </a>
            <a href="#about" className="text-[#37473F] hover:text-[#007A44] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#007A44] rounded-sm py-1">
              About Exousia
            </a>
            <button
              onClick={() => setShowContractModal(true)}
              className="text-[#007A44] hover:text-[#005D35] flex items-center gap-1.5 font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#007A44] rounded-sm py-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Contract Scope</span>
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-3.5 py-2 text-xs font-semibold text-[#5D6961] hover:text-[#15251C] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#007A44] rounded-lg"
            >
              Sign in
            </Link>
            <Link
              to="/app"
              className="px-4 py-2 rounded-lg bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#007A44]"
            >
              View workspace
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#15251C] hover:text-[#007A44] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#007A44] rounded-lg"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-6 border-t border-[#E2ECE5] mt-3 space-y-4 text-sm animate-in fade-in duration-200">
            <a
              href="#platform"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-medium text-[#15251C] hover:text-[#007A44]"
            >
              Platform
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-medium text-[#15251C] hover:text-[#007A44]"
            >
              How it works
            </a>
            <a
              href="#attention"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-medium text-[#15251C] hover:text-[#007A44]"
            >
              Operations
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-medium text-[#15251C] hover:text-[#007A44]"
            >
              About Exousia
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowContractModal(true);
              }}
              className="block text-[#007A44] font-semibold text-left"
            >
              Contract Scope Breakdown
            </button>
            <div className="pt-3 border-t border-[#E2ECE5] flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center py-2.5 rounded-lg border border-[#DDE5DF] text-[#15251C] font-semibold text-xs"
              >
                Sign in
              </Link>
              <Link
                to="/app"
                className="w-full text-center py-2.5 rounded-lg bg-[#007A44] text-white font-semibold text-xs shadow-xs"
              >
                Enter HSE Workspace
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 1. Photographic Hero: Light with dark readable text */}
      <section className="relative pt-16 pb-28 md:pt-24 md:pb-36 px-6 overflow-hidden bg-[#F7F9F7]">
        {/* Background Image: offshoreImg from src/assets/landingPhotos.ts */}
        <div className="absolute inset-0 z-0">
          <img
            src={offshoreImg || '/offshore.webp'}
            alt="Exousia Offshore Oil and Gas Production Platform Rig"
            className="w-full h-full object-cover object-right md:object-center opacity-85"
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (e.currentTarget.src !== window.location.origin + '/offshore.webp') {
                e.currentTarget.src = '/offshore.webp';
              }
            }}
          />
          {/* Deliberate light overlay for maximum readability of dark text */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/92 to-white/40 md:from-[#F7F9F7]/98 md:via-[#F7F9F7]/85 md:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF7F2] border border-[#BDE3CE] text-xs font-bold tracking-widest text-[#007A44] uppercase">
              <span>HEALTH. SAFETY. ENVIRONMENT.</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.08] text-[#15251C]">
              Safer work. <br />
              Clearer oversight.
            </h1>

            <p className="text-base sm:text-lg text-[#37473F] max-w-xl font-normal leading-relaxed">
              Turn field observations into action. Keep every report, inspection and responsibility connected in one rigorous workspace.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Link
                to="/app"
                className="px-6 py-3.5 bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all text-center flex items-center justify-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#007A44]"
              >
                <span>View workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#platform"
                className="px-6 py-3.5 bg-white/90 hover:bg-white text-[#15251C] text-xs font-semibold border border-[#DDE5DF] rounded-lg transition-all text-center shadow-xs backdrop-blur-xs hover:border-[#007A44]/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#007A44]"
              >
                Explore the platform
              </a>
            </div>
          </div>

          {/* Hero Right: Oil-rig thumbnail card (320x180px desktop, lower-right) */}
          <div className="lg:col-span-5 relative flex justify-start sm:justify-end lg:justify-end lg:items-end mt-8 lg:mt-0 lg:pr-11 lg:pb-2">
            <div className="relative w-full max-w-[320px] sm:w-[280px] sm:h-[160px] lg:w-[320px] lg:h-[180px] h-[170px] rounded-[12px] overflow-hidden shadow-md border border-black/10 bg-[#0E1712] text-white group">
              <img
                src={offshoreImg || '/offshore.webp'}
                alt="Offshore Rig Close View"
                className="w-full h-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (e.currentTarget.src !== window.location.origin + '/offshore.webp') {
                    e.currentTarget.src = '/offshore.webp';
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E1712]/90 via-[#0E1712]/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-[18px]">
                <h3 className="text-[16px] font-semibold text-white leading-snug">
                  From the field. Through to closure.
                </h3>
                <p className="text-[13px] text-white/85 mt-1 leading-normal">
                  Explore the HSE workflow
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Centered Introduction and Three Supporting Cards: White & Subtle Pale Green */}
      <section className="py-24 md:py-32 px-6 bg-white border-t border-[#E2ECE5]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-4xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#007A44]">
              A CONNECTED APPROACH
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#15251C] leading-[1.18]">
              We bring reports, inspections and actions together, so every concern has a clear next step, an owner and a path to closure.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="p-8 md:p-10 rounded-2xl bg-[#F4F8F5] border border-[#E2ECE5] hover:border-[#007A44]/40 hover:bg-[#EEF7F2]/60 transition-all duration-200 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#5D6961] block">
                  Field reporting
                </span>
                <h3 className="text-2xl font-medium text-[#15251C] leading-snug">
                  Make concerns visible.
                </h3>
                <p className="text-sm text-[#5D6961] leading-relaxed">
                  Capture incidents, near misses and hazards in one connected workspace with objective immediate action logs and instant frontline clarity.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[#E2ECE5]/80">
                <Link to="/app/incidents" className="text-xs font-semibold text-[#007A44] hover:text-[#005D35] inline-flex items-center gap-1.5 group">
                  <span>Explore incident reporting</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            <div className="p-8 md:p-10 rounded-2xl bg-[#F4F8F5] border border-[#E2ECE5] hover:border-[#007A44]/40 hover:bg-[#EEF7F2]/60 transition-all duration-200 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#5D6961] block">
                  Operational oversight
                </span>
                <h3 className="text-2xl font-medium text-[#15251C] leading-snug">
                  Know what comes next.
                </h3>
                <p className="text-sm text-[#5D6961] leading-relaxed">
                  Plan inspections and see the findings and deadlines that need attention without searching through loose spreadsheets or scattered emails.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[#E2ECE5]/80">
                <Link to="/app/inspections" className="text-xs font-semibold text-[#007A44] hover:text-[#005D35] inline-flex items-center gap-1.5 group">
                  <span>View inspection schedules</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            <div className="p-8 md:p-10 rounded-2xl bg-[#F4F8F5] border border-[#E2ECE5] hover:border-[#007A44]/40 hover:bg-[#EEF7F2]/60 transition-all duration-200 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#5D6961] block">
                  Accountable action
                </span>
                <h3 className="text-2xl font-medium text-[#15251C] leading-snug">
                  Follow through to closure.
                </h3>
                <p className="text-sm text-[#5D6961] leading-relaxed">
                  Assign single responsibility, collect objective photographic evidence, and enforce independent HSE officer sign-off before closing records.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[#E2ECE5]/80">
                <Link to="/app/actions" className="text-xs font-semibold text-[#007A44] hover:text-[#005D35] inline-flex items-center gap-1.5 group">
                  <span>Track corrective actions</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Platform Capability Tabs: Light Neutral Surfaces */}
      <section id="platform" className="py-24 md:py-32 px-6 border-t border-[#E2ECE5] bg-[#F7F9F7]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#007A44]">
              THE PLATFORM
            </span>
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-[#15251C]">
              Every detail. A clearer picture.
            </h2>
            <p className="text-base text-[#5D6961] max-w-xl">
              Bring field safety, mechanical integrity and statutory compliance together on clean, purpose-built surfaces.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Tabs List */}
            <div
              ref={tabListRef}
              role="tablist"
              aria-label="Platform capabilities"
              className="lg:col-span-5 space-y-3"
            >
              {PLATFORM_TABS.map((tab, idx) => {
                const isActive = activePlatformTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    role="tab"
                    tabIndex={isActive ? 0 : -1}
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    onClick={() => setActivePlatformTab(tab.id)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className={`w-full text-left p-5 rounded-xl border transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#007A44] ${
                      isActive
                        ? 'bg-white border-[#007A44] shadow-sm ring-1 ring-[#007A44]/20'
                        : 'bg-white/70 border-[#E2ECE5] hover:bg-white hover:border-[#BDE3CE] text-[#5D6961]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-base font-semibold ${isActive ? 'text-[#15251C]' : 'text-[#37473F]'}`}>
                        {tab.label}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isActive ? 'text-[#007A44] translate-x-0.5' : 'text-[#8E9B93]'
                        }`}
                      />
                    </div>
                    <div className="text-xs text-[#5D6961] mt-1">
                      {tab.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Tab Panel */}
            <div
              id={`panel-${currentTab.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${currentTab.id}`}
              className="lg:col-span-7 p-8 md:p-10 rounded-2xl bg-white border border-[#E2ECE5] shadow-xs space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#E2ECE5]">
                <span className="text-xs font-bold uppercase tracking-widest text-[#007A44]">
                  {currentTab.badge}
                </span>
                <span className="text-xs font-mono text-[#5D6961] bg-[#F4F8F5] px-2.5 py-1 rounded-md border border-[#E2ECE5]">
                  Active Workflow
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#15251C] leading-snug">
                  {currentTab.headline}
                </h3>
                <p className="text-sm text-[#5D6961] mt-3 leading-relaxed">
                  {currentTab.description}
                </p>
              </div>

              {/* Sample Record Preview */}
              <div className="p-6 rounded-xl bg-[#F7F9F7] border border-[#E2ECE5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#37473F]">
                    {currentTab.code}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${currentTab.statusColor}`}>
                    {currentTab.status}
                  </span>
                </div>
                <div className="text-base font-semibold text-[#15251C]">
                  {currentTab.sampleTitle}
                </div>
                <div className="text-xs text-[#5D6961]">
                  {currentTab.sampleMeta}
                </div>
                <div className="pt-3 text-xs text-[#37473F] border-t border-[#E2ECE5] flex items-center justify-between">
                  <span><strong>Next step:</strong> {currentTab.nextStep}</span>
                  <span className="text-[#007A44] font-medium hidden sm:inline">Audit trail active</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to={currentTab.route}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>{currentTab.routeLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Report → Review → Act → Verify Workflow (White) */}
      <section id="how-it-works" className="py-24 md:py-32 px-6 border-t border-[#E2ECE5] bg-white">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#007A44]">
              THE HSE CYCLE
            </span>
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-[#15251C] leading-tight">
              A concern raised. <br />
              A responsibility owned.
            </h2>
            <p className="text-base text-[#5D6961]">
              A disciplined four-step sequence guaranteeing that observations convert into verified, documented closures.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="space-y-4 pt-5 border-t-2 border-[#007A44]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#007A44]">01</span>
                <span className="text-[11px] font-semibold text-[#5D6961] uppercase">Step One</span>
              </div>
              <h3 className="text-xl font-medium text-[#15251C]">Report</h3>
              <p className="text-sm text-[#5D6961] leading-relaxed">
                Frontline personnel record incidents, near misses and hazard conditions with location, immediate actions, and photos.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 pt-5 border-t-2 border-[#007A44]/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#007A44]">02</span>
                <span className="text-[11px] font-semibold text-[#5D6961] uppercase">Step Two</span>
              </div>
              <h3 className="text-xl font-medium text-[#15251C]">Review</h3>
              <p className="text-sm text-[#5D6961] leading-relaxed">
                Supervisors classify severity and root causes, evaluate risk matrices, and assign an individual accountable owner.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 pt-5 border-t-2 border-[#007A44]/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#007A44]">03</span>
                <span className="text-[11px] font-semibold text-[#5D6961] uppercase">Step Three</span>
              </div>
              <h3 className="text-xl font-medium text-[#15251C]">Act</h3>
              <p className="text-sm text-[#5D6961] leading-relaxed">
                Assigned teams execute corrective remediations, submit photographic proof, and log measurable work records.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-4 pt-5 border-t-2 border-[#007A44]/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#007A44]">04</span>
                <span className="text-[11px] font-semibold text-[#5D6961] uppercase">Step Four</span>
              </div>
              <h3 className="text-xl font-medium text-[#15251C]">Verify</h3>
              <p className="text-sm text-[#5D6961] leading-relaxed">
                An independent HSE officer reviews evidence, verifies field efficacy under the two-person rule, and formally closes the file.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Clearly Labelled Illustrative Attention Overview (Light) */}
      <section id="attention" className="py-24 md:py-32 px-6 border-t border-[#E2ECE5] bg-[#F7F9F7]">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#007A44]">
                DAILY OPERATIONS
              </span>
              <h2 className="text-3xl sm:text-4xl font-medium text-[#15251C] mt-2">
                Know what needs your attention.
              </h2>
              <p className="text-sm text-[#5D6961] mt-1 max-w-xl">
                A focused operational register of open actions, upcoming rounds and findings that demand prompt decisions.
              </p>
            </div>

            <Link
              to="/app"
              className="text-xs font-semibold text-[#007A44] hover:text-[#005D35] inline-flex items-center gap-1.5 shrink-0"
            >
              <span>Enter full operational dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-[#E2ECE5] bg-white p-6 md:p-8 space-y-6 shadow-xs max-w-5xl mx-auto">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-[#E2ECE5]">
              <div className="p-3.5 rounded-xl bg-[#FFF0ED] border border-[#FECDCA]">
                <div className="text-xs font-semibold text-[#B42318]">Overdue Actions</div>
                <div className="text-2xl font-bold text-[#B42318] mt-1">1</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#EFF8FF] border border-[#B2DDFF]">
                <div className="text-xs font-semibold text-[#175CD3]">Today's Inspections</div>
                <div className="text-2xl font-bold text-[#175CD3] mt-1">2</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FEF6EE] border border-[#F9DBAF]">
                <div className="text-xs font-semibold text-[#B54708]">Reviews Needed</div>
                <div className="text-2xl font-bold text-[#B54708] mt-1">1</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#EEF7F2] border border-[#BDE3CE]">
                <div className="text-xs font-semibold text-[#007A44]">Compliance Rate</div>
                <div className="text-2xl font-bold text-[#007A44] mt-1">94.8%</div>
              </div>
            </div>

            {/* List of operational items */}
            <div className="space-y-3">
              {/* Item 1 Overdue */}
              <div className="p-4.5 rounded-xl bg-[#FAFCFA] border border-[#E2ECE5] hover:border-[#FECDCA] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-[#FFF0ED] text-[#B42318] border border-[#FECDCA] mt-0.5 shrink-0">
                    Overdue
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-[#15251C]">Replace damaged hydraulic hose guard on Crane 3</h4>
                    <p className="text-xs text-[#5D6961] mt-0.5">Corrective action · Operations yard · Assigned to M. Okon</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#B42318] font-semibold shrink-0">Due 30 Sep (Overdue)</span>
              </div>

              {/* Item 2 Scheduled */}
              <div className="p-4.5 rounded-xl bg-[#FAFCFA] border border-[#E2ECE5] hover:border-[#B2DDFF] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-[#EEF7F2] text-[#007A44] border border-[#BDE3CE] mt-0.5 shrink-0">
                    Scheduled
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-[#15251C]">Weekly Rig Deck & Escape Route Audit</h4>
                    <p className="text-xs text-[#5D6961] mt-0.5">Routine inspection · Production Deck Bravo · Inspector: K. Adeyemi</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#5D6961] font-semibold shrink-0">Scheduled for today</span>
              </div>

              {/* Item 3 Review needed */}
              <div className="p-4.5 rounded-xl bg-[#FAFCFA] border border-[#E2ECE5] hover:border-[#F9DBAF] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-[#FEF6EE] text-[#B54708] border border-[#F9DBAF] mt-0.5 shrink-0">
                    Review needed
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-[#15251C]">Manual handling near miss during chemical offloading</h4>
                    <p className="text-xs text-[#5D6961] mt-0.5">Near miss report · Quayside berth · Reported by Frontline Operator</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#5D6961] font-semibold shrink-0">Reported 01 Oct</span>
              </div>

              {/* Item 4 Verified Closure */}
              <div className="p-4.5 rounded-xl bg-[#FAFCFA] border border-[#E2ECE5] hover:border-[#BDE3CE] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-[#EEF7F2] text-[#007A44] border border-[#BDE3CE] mt-0.5 shrink-0">
                    Closed & Verified
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-[#15251C]">Secondary containment drain plug re-torqued and tested</h4>
                    <p className="text-xs text-[#5D6961] mt-0.5">Verified with photo evidence · Sign-off by Lead HSE Officer</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#007A44] font-semibold shrink-0">Verified 02 Oct</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. About Exousia: Deep Forest Green #0B2418 with white headings and readable light text */}
      <section id="about" className="py-24 md:py-36 px-6 bg-[#0B2418] text-white border-t border-[#133827]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Company Training Photo: trainingImg from src/assets/landingPhotos.ts */}
          <div className="lg:col-span-6 space-y-3">
            <div className="rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#081B12] p-2.5">
              <img
                src={trainingImg || '/training.webp'}
                alt="Exousia Dynamo Energy Professional Training Delegation in Port Harcourt, Nigeria"
                className="w-full h-auto rounded-xl object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (e.currentTarget.src !== window.location.origin + '/training.webp') {
                    e.currentTarget.src = '/training.webp';
                  }
                }}
              />
            </div>
            <p className="text-xs text-[#A9BEB2] italic text-center sm:text-left px-2">
              Exousia Dynamo Energy professional training delegation & technical operations group, Port Harcourt, Nigeria.
            </p>
          </div>

          {/* Text Info */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#48CA85]">
              BY EXOUSIA DYNAMO ENERGY
            </span>
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-tight">
              Built around people. <br />
              Grounded in industry.
            </h2>
            <p className="text-base text-[#E2ECE5] leading-relaxed">
              Exousia Dynamo Energy brings together specialized energy engineering, capital project management, professional training accreditation and an unwavering commitment to frontline safety.
            </p>
            <p className="text-base text-[#A9BEB2] leading-relaxed">
              This platform translates operational discipline into a connected digital workflow—ensuring health, safety and environmental responsibilities are visible, verifiable and closed.
            </p>

            {/* Quick credentials */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/15">
              <div>
                <div className="text-2xl font-bold text-white">15+</div>
                <div className="text-xs text-[#A9BEB2] mt-0.5">Years of Energy Services Experience</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-xs text-[#A9BEB2] mt-0.5">Verifiable Closed-Loop Audit Trail</div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="mailto:info@exousiadynamoenergy.com"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#48CA85] hover:text-white transition-colors"
              >
                <span>Speak with the Exousia team</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Closing Invitation and Footer: Deep Forest Green #0B2418 with high-contrast buttons */}
      <section className="py-20 md:py-28 px-6 bg-[#0B2418] text-center border-t border-[#133827]">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-tight">
            Better visibility. <br />
            Stronger follow-through.
          </h2>
          <p className="text-base text-[#A9BEB2] max-w-xl mx-auto leading-relaxed">
            Experience how Exousia's integrated HSE workspace brings field reporting, statutory inspections and corrective actions together.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/app"
              className="w-full sm:w-auto px-7 py-4 bg-[#00A651] hover:bg-[#008C44] text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all inline-flex items-center justify-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00A651]"
            >
              <span>Enter HSE Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setShowContractModal(true)}
              className="w-full sm:w-auto px-6 py-4 bg-transparent hover:bg-white/10 text-white text-sm font-semibold rounded-lg border border-white/20 hover:border-white transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
            >
              Contract Scope Breakdown
            </button>
          </div>
        </div>
      </section>

      {/* Footer (Deep Forest Green #081B12) */}
      <footer className="border-t border-[#133827] py-14 px-6 bg-[#081B12] text-xs text-[#A9BEB2]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <ExousiaLogo variant="full" theme="dark" height={36} />
            <div className="text-[11px] text-[#A9BEB2] mt-1 text-center md:text-left">
              Integrated Health, Safety & Environment Management Platform
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[#A9BEB2]">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Notice
            </Link>
            <Link to="/help" className="hover:text-white transition-colors">
              User Guidance & Help
            </Link>
            <button
              onClick={() => setShowContractModal(true)}
              className="hover:text-white transition-colors font-medium text-left"
            >
              Contract Scope
            </button>
            <a
              href="mailto:info@exousiadynamoenergy.com"
              className="hover:text-white transition-colors"
            >
              info@exousiadynamoenergy.com
            </a>
          </div>

          <div className="text-[11px] text-[#71887B]">
            © 2026 Exousia Dynamo Energy Ltd. All rights reserved.
          </div>
        </div>
      </footer>

      <ContractReferenceModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
      />
    </div>
  );
};
