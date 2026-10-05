import React from 'react';

interface MetricCardProps {
  label: string;
  value: number | string;
  subtitle: string;
  isAlert?: boolean;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  isAlert = false,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-xl border bg-white transition-all ${
        onClick ? 'cursor-pointer hover:shadow-sm hover:border-[#007A44]/30' : ''
      } ${
        isAlert && Number(value) > 0
          ? 'border-[#FECDCA] bg-white'
          : 'border-[#DDE5DF]'
      }`}
    >
      <div className="text-xs font-medium text-[#5D6961] mb-2">{label}</div>
      <div
        className={`text-3xl font-medium tracking-tight mb-2 ${
          isAlert && Number(value) > 0 ? 'text-[#B42318]' : 'text-[#15251C]'
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-[#5D6961]">{subtitle}</div>
    </div>
  );
};
