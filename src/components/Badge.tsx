import React from 'react';
import { RiskBand, ActionStatus, ReportStatus, ComplianceState } from '../types/hse';
import { ShieldAlert, AlertTriangle, CheckCircle2, Shield, Info } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  size = 'md'
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  const variantStyles = {
    default: 'bg-[#EEF7F2] text-[#007A44] border-[#BDE3CE]',
    success: 'bg-[#EEF7F2] text-[#007A44] border-[#BDE3CE]',
    warning: 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]',
    danger: 'bg-[#FFF0ED] text-[#B42318] border-[#FECDCA]',
    info: 'bg-[#F0F9FF] text-[#026AA2] border-[#B9E6FE]',
    neutral: 'bg-[#F7F9F7] text-[#5D6961] border-[#DDE5DF]'
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${sizeClasses} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ActionStatus | ReportStatus | ComplianceState | string; isAction?: boolean }> = ({ status, isAction = false }) => {
  switch (status) {
    case 'open':
      return isAction ? (
        <Badge variant="neutral" className="font-semibold">Open / Assigned</Badge>
      ) : (
        <Badge variant="info">Submitted for review</Badge>
      );
    case 'submitted':
      return <Badge variant="info">Submitted for review</Badge>;
    case 'under_review':
      return <Badge variant="warning">Under technical review</Badge>;
    case 'under_investigation':
      return <Badge variant="warning">Under active investigation</Badge>;
    case 'in_progress':
    case 'actions_in_progress':
      return <Badge variant="info">In progress / executing</Badge>;
    case 'evidence_submitted':
    case 'awaiting_verification':
    case 'pending_closure_review':
      return <Badge variant="warning">Awaiting independent verification</Badge>;
    case 'closed':
    case 'completed':
    case 'compliant':
      return <Badge variant="success">Completed & Closed</Badge>;
    case 'cancelled':
      return <Badge variant="danger">Cancelled</Badge>;
    case 'non_compliant':
    case 'overdue':
      return <Badge variant="danger">Overdue / Non-compliant</Badge>;
    case 'returned_for_rework':
      return <Badge variant="danger">Returned for rework</Badge>;
    case 'scheduled':
      return <Badge variant="success">Scheduled</Badge>;
    default:
      return <Badge variant="neutral">{status.replace('_', ' ')}</Badge>;
  }
};

export const ActionStatusBadge: React.FC<{ status: ActionStatus; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  switch (status) {
    case 'open':
      return <Badge variant="neutral" size={size} className="font-semibold">Open / Assigned</Badge>;
    case 'in_progress':
      return <Badge variant="info" size={size} className="font-semibold">In Progress</Badge>;
    case 'evidence_submitted':
    case 'awaiting_verification':
      return <Badge variant="warning" size={size} className="font-semibold">Awaiting Verification</Badge>;
    case 'returned_for_rework':
      return <Badge variant="danger" size={size} className="font-semibold">Returned for Rework</Badge>;
    case 'closed':
      return <Badge variant="success" size={size} className="font-semibold">Verified & Closed</Badge>;
    default:
      return <Badge variant="neutral" size={size}>{String(status).replace('_', ' ')}</Badge>;
  }
};

export const ActionTypeBadge: React.FC<{ type: 'corrective' | 'preventive'; size?: 'sm' | 'md' }> = ({ type, size = 'sm' }) => {
  if (type === 'corrective') {
    return (
      <span className={`inline-flex items-center font-semibold rounded border border-[#FEDF89] bg-[#FFFAEB] text-[#B54708] ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'}`}>
        Corrective
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center font-semibold rounded border border-[#B9E6FE] bg-[#F0F9FF] text-[#026AA2] ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'}`}>
      Preventive
    </span>
  );
};

export const ComplianceStateBadge: React.FC<{ state: ComplianceState; size?: 'sm' | 'md' }> = ({ state, size = 'sm' }) => {
  switch (state) {
    case 'compliant':
      return <Badge variant="success" size={size} className="font-bold">COMPLIANT (Audited)</Badge>;
    case 'non_compliant':
      return <Badge variant="danger" size={size} className="font-bold">NON-COMPLIANT (Deficiency)</Badge>;
    case 'not_assessed':
      return <Badge variant="neutral" size={size} className="font-bold text-[#5D6961]">NOT ASSESSED (Pending)</Badge>;
    case 'not_applicable':
      return <Badge variant="neutral" size={size} className="font-bold">N/A</Badge>;
    default:
      return <Badge variant="neutral" size={size}>{state}</Badge>;
  }
};

export const DueDateHorizonBadge: React.FC<{ dueDate: string; referenceDate?: string; size?: 'sm' | 'md' }> = ({
  dueDate,
  referenceDate = '2026-10-02',
  size = 'sm'
}) => {
  const daysDiff = Math.floor(
    (new Date(dueDate).getTime() - new Date(referenceDate).getTime()) / (1000 * 3600 * 24)
  );

  if (daysDiff < 0) {
    return (
      <Badge variant="danger" size={size} className="font-bold">
        OVERDUE ({Math.abs(daysDiff)}d overdue)
      </Badge>
    );
  }
  if (daysDiff <= 30) {
    return (
      <Badge variant="warning" size={size} className="font-bold">
        DUE SOON ({daysDiff}d remaining)
      </Badge>
    );
  }
  return (
    <Badge variant="info" size={size} className="font-medium">
      CURRENT ({daysDiff}d horizon)
    </Badge>
  );
};

/**
 * RiskBadge provides readable text labels, numerical scores, and textual priority
 * indicators so that risk classification is NEVER communicated through color alone.
 */
export const RiskBadge: React.FC<{
  band?: RiskBand;
  score?: number;
  matrixVersion?: string;
  showDetails?: boolean;
}> = ({ band, score, matrixVersion, showDetails = false }) => {
  if (!band) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#DDE5DF] bg-[#F7F9F7] text-xs font-semibold text-[#5D6961]">
        <Info className="w-3.5 h-3.5" aria-hidden="true" />
        <span>UNCLASSIFIED (Pending HSE Review)</span>
      </span>
    );
  }

  const bandConfigs: Record<
    RiskBand,
    {
      label: string;
      textIdentifier: string;
      variant: 'danger' | 'warning' | 'success';
      icon: React.ElementType;
      badgeStyle: string;
    }
  > = {
    critical: {
      label: 'CRITICAL RISK',
      textIdentifier: '[CRITICAL - Stop Work & Immediate Escalation]',
      variant: 'danger',
      icon: ShieldAlert,
      badgeStyle: 'bg-[#FFF0ED] text-[#B42318] border-[#FECDCA]'
    },
    high: {
      label: 'HIGH RISK',
      textIdentifier: '[HIGH - Expedited Action 7 Days]',
      variant: 'danger',
      icon: AlertTriangle,
      badgeStyle: 'bg-[#FFF0ED] text-[#B42318] border-[#FECDCA]'
    },
    medium: {
      label: 'MEDIUM RISK',
      textIdentifier: '[MEDIUM - Specific Action Required]',
      variant: 'warning',
      icon: AlertTriangle,
      badgeStyle: 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]'
    },
    low: {
      label: 'LOW RISK',
      textIdentifier: '[LOW - Routine Controls]',
      variant: 'success',
      icon: CheckCircle2,
      badgeStyle: 'bg-[#EEF7F2] text-[#007A44] border-[#BDE3CE]'
    }
  };

  const config = bandConfigs[band];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border ${config.badgeStyle}`}
      title={`${config.label}: Score ${score || 'N/A'}/25 · ${config.textIdentifier}${matrixVersion ? ` (${matrixVersion})` : ''}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span className="tracking-wide">
        {config.label}
        {score !== undefined ? ` (Score: ${score}/25)` : ''}
      </span>
      {showDetails && (
        <span className="text-[10px] font-normal opacity-90 hidden sm:inline">
          · {config.textIdentifier}
        </span>
      )}
    </span>
  );
};
