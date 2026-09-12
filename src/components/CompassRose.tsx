import React from 'react';
import { ThemeMode } from '../types';

interface CompassRoseProps {
  theme?: ThemeMode;
}

export const CompassRose: React.FC<CompassRoseProps> = ({ theme = 'graph_paper' }) => {
  const isGraphPaper = theme === 'graph_paper';
  const isDark = theme !== 'graph_paper';

  const strokeColor = isGraphPaper ? '#000000' : isDark ? '#38bdf8' : '#334155';
  const textColor = isGraphPaper ? '#000000' : isDark ? '#e0f2fe' : '#1e293b';
  const secondaryColor = isGraphPaper ? 'rgba(0, 0, 0, 0.35)' : isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(71, 85, 105, 0.3)';

  return (
    <div className="flex flex-col items-center select-none pointer-events-none opacity-90">
      <svg width="68" height="68" viewBox="-34 -34 68 68" className="drop-shadow-xs">
        {/* Outer ring */}
        <circle r="30" fill="none" stroke={secondaryColor} strokeWidth="1" strokeDasharray="3,2" />
        <circle r="26" fill="none" stroke={secondaryColor} strokeWidth="0.75" />
        
        {/* Degree tick marks */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1="0"
            y1="-26"
            x2="0"
            y2={angle % 90 === 0 ? "-20" : "-23"}
            stroke={strokeColor}
            strokeWidth={angle % 90 === 0 ? "1.2" : "0.75"}
            transform={`rotate(${angle})`}
          />
        ))}

        {/* North Arrow Pointer */}
        <polygon points="0,-24 5,-2 0,-8" fill={strokeColor} />
        <polygon points="0,-24 -5,-2 0,-8" fill={isGraphPaper ? '#ffffff' : isDark ? '#0284c7' : '#94a3b8'} stroke={isGraphPaper ? '#000000' : 'none'} strokeWidth="0.5" />

        {/* South Pointer */}
        <polygon points="0,22 4,2 0,6" fill={secondaryColor} />
        <polygon points="0,22 -4,2 0,6" fill={isGraphPaper ? '#ffffff' : isDark ? 'rgba(2, 132, 199, 0.3)' : 'rgba(148, 163, 184, 0.4)'} stroke={isGraphPaper ? '#000000' : 'none'} strokeWidth="0.5" />

        {/* East & West pointers */}
        <polygon points="22,0 2,4 6,0" fill={secondaryColor} />
        <polygon points="-22,0 -2,4 -6,0" fill={secondaryColor} />

        {/* Center pivot point */}
        <circle r="2.5" fill={strokeColor} />

        {/* North label */}
        <text
          x="0"
          y="-13"
          textAnchor="middle"
          fill={textColor}
          fontSize="8"
          fontWeight="bold"
          fontFamily="'Chivo Mono', monospace"
        >
          N
        </text>
      </svg>
      <span
        className="text-[9px] font-mono tracking-widest uppercase mt-0.5 font-bold"
        style={{ color: textColor }}
      >
        TRUE NORTH
      </span>
    </div>
  );
};
