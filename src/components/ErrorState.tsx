import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to display records',
  message,
  onRetry
}) => {
  return (
    <div className="p-8 text-center bg-[#FFF0ED] border border-[#FECDCA] rounded-xl max-w-lg mx-auto space-y-3">
      <div className="w-10 h-10 rounded-full bg-white border border-[#FECDCA] text-[#B42318] flex items-center justify-center mx-auto">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-[#B42318]">{title}</h3>
      <p className="text-xs text-[#5D6961] leading-relaxed">{message}</p>
      {onRetry && (
        <div className="pt-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#FECDCA] text-[#B42318] hover:bg-[#FFF0ED] text-xs font-semibold shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try again</span>
          </button>
        </div>
      )}
    </div>
  );
};
