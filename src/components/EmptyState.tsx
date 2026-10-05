import React from 'react';
import { LucideIcon, Search, AlertCircle, FileQuestion, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FileQuestion,
  title,
  description,
  actionLabel,
  onAction,
  actionHref
}) => {
  return (
    <div className="py-12 px-6 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
      <div className="w-12 h-12 rounded-full bg-[#F4F8F5] border border-[#E2ECE5] flex items-center justify-center text-[#007A44]">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#15251C]">{title}</h3>
      <p className="text-xs text-[#5D6961] leading-relaxed">{description}</p>
      {(actionLabel && (onAction || actionHref)) && (
        <div className="pt-2">
          {onAction ? (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-[#DDE5DF] hover:border-[#007A44] text-[#15251C] hover:text-[#007A44] text-xs font-semibold shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{actionLabel}</span>
            </button>
          ) : (
            <a
              href={actionHref}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#007A44] hover:bg-[#005D35] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>{actionLabel}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};
