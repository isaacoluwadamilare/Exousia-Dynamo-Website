import React from 'react';

interface ExousiaLogoProps {
  className?: string;
  variant?: 'full' | 'icon';
  theme?: 'light' | 'dark'; // light background vs dark background
  height?: number;
}

export const ExousiaLogo: React.FC<ExousiaLogoProps> = ({
  className = '',
  variant = 'full',
  theme = 'light',
  height = 42
}) => {
  const textColor = theme === 'dark' ? '#FFFFFF' : '#0E1712';
  const edelColor = '#0E1712';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Flame Icon with EDEL mark */}
      <svg
        width={height * 0.95}
        height={height}
        viewBox="0 0 100 115"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Outer Green Teardrop / Flame */}
        <path
          d="M48 4C48 4 10 38 10 70C10 93 28 111 52 111C68 111 81 102 88 88C90 84 87 79 83 80C75 82 66 82 58 79C45 74 38 62 38 48C38 31 46 16 48 4Z"
          fill="#00A651"
        />

        {/* Inner Red Flame */}
        <path
          d="M49 8C49 8 36 34 38 52C39 63 46 72 56 76C68 81 82 78 89 67C92 62 90 57 85 57C78 57 71 52 69 44C66 31 75 18 49 8Z"
          fill="#ED1C24"
        />

        {/* Bottom Inner Green Swirl Hook */}
        <path
          d="M45 88C40 88 32 84 28 78C26 75 22 76 22 79C22 93 36 103 49 103C64 103 76 94 77 82C77 78 73 76 70 78C64 85 55 88 45 88Z"
          fill="#00A651"
        />

        {/* Inner White Cavity for EDEL */}
        <ellipse cx="44" cy="74" rx="19" ry="15" fill="#FFFFFF" />

        {/* EDEL Bold Typography */}
        <text
          x="44"
          y="78"
          fill={edelColor}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="11"
          letterSpacing="0.08em"
          textAnchor="middle"
        >
          EDEL
        </text>
      </svg>

      {/* Brand Text: EXOUSIA DYNAMO ENERGY LTD */}
      {variant === 'full' && (
        <div className="flex flex-col tracking-tight leading-none justify-center">
          <span
            className="font-black text-[15px] tracking-wider leading-[1.05]"
            style={{ color: textColor }}
          >
            EXOUSIA
          </span>
          <span
            className="font-black text-[13px] tracking-wider leading-[1.05]"
            style={{ color: textColor }}
          >
            DYNAMO
          </span>
          <span
            className="font-black text-[13px] tracking-wider leading-[1.05]"
            style={{ color: textColor }}
          >
            ENERGY
          </span>
          <span
            className="font-bold text-[10px] tracking-widest text-[#00A651] mt-0.5 leading-[1]"
          >
            LTD
          </span>
        </div>
      )}
    </div>
  );
};
