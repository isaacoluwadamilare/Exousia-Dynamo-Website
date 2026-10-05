import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  label?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Loading operational records...'
}) => {
  return (
    <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
      <Loader2 className="w-8 h-8 text-[#007A44] animate-spin" />
      <span className="text-xs font-medium text-[#5D6961]">{label}</span>
    </div>
  );
};
