import React from 'react';
import { BogFilterElement, ThemeMode } from '../types';

interface BogFilterViewProps {
  bog: BogFilterElement;
  isSelected: boolean;
  theme: ThemeMode;
  onSelect: (id: string, e: React.MouseEvent) => void;
}

export const BogFilterView: React.FC<BogFilterViewProps> = ({
  bog,
  isSelected,
  theme,
  onSelect,
}) => {
  const isGraphPaper = theme === 'graph_paper';
  const isDark = theme !== 'graph_paper';
  const halfW = bog.width / 2;
  const halfH = bog.height / 2;

  const borderColor = isGraphPaper
    ? '#000000'
    : isSelected
    ? '#38bdf8'
    : isDark
    ? '#059669'
    : '#047857';

  const fillColor = isGraphPaper
    ? isSelected
      ? 'rgba(0, 0, 0, 0.05)'
      : '#ffffff'
    : isDark
    ? 'rgba(6, 78, 59, 0.45)'
    : 'rgba(209, 250, 229, 0.7)';

  return (
    <g
      transform={`translate(${bog.x}, ${bog.y}) rotate(${bog.rotation})`}
      onClick={(e) => onSelect(bog.id, e)}
      className="cursor-pointer group select-none"
    >
      {/* Outer Wetland Excavation Boundary */}
      <rect
        x={-halfW}
        y={-halfH}
        width={bog.width}
        height={bog.height}
        rx={bog.shape === 'oval' ? halfH : 0.2}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={isSelected ? 0.08 : 0.05}
        strokeDasharray={isSelected ? '0.4,0.2' : undefined}
      />

      {/* Gravel Bed Matrix Hatching Lines */}
      <g opacity={isGraphPaper ? 0.35 : isDark ? 0.25 : 0.35} stroke={isGraphPaper ? '#000000' : isDark ? '#6ee7b7' : '#065f46'} strokeWidth="0.02">
        {Array.from({ length: Math.floor(bog.width * 2) }).map((_, i) => {
          const x = -halfW + (i + 1) * 0.5;
          return <line key={i} x1={x} y1={-halfH + 0.3} x2={x} y2={halfH - 0.3} strokeDasharray="0.1,0.2" />;
        })}
      </g>

      {/* Upflow Centipede / Snorkel Distribution Manifold */}
      {bog.hasSnorkel && (
        <g>
          {/* Main distribution trunk line */}
          <line
            x1={-halfW + 0.8}
            y1={0}
            x2={halfW - 0.8}
            y2={0}
            stroke={isGraphPaper ? '#000000' : '#f59e0b'}
            strokeWidth="0.1"
            strokeLinecap="round"
          />
          {/* Centipede lateral ribs */}
          {Array.from({ length: Math.max(3, Math.floor(bog.width * 0.8)) }).map((_, idx) => {
            const lx = -halfW + 1.2 + idx * 1.0;
            if (lx > halfW - 1.0) return null;
            return (
              <line
                key={idx}
                x1={lx}
                y1={-halfH * 0.65}
                x2={lx}
                y2={halfH * 0.65}
                stroke={isGraphPaper ? '#000000' : '#f59e0b'}
                strokeWidth="0.04"
                strokeDasharray="0.1,0.08"
                strokeLinecap="round"
              />
            );
          })}

          {/* Snorkel cleanout inspection vault chamber */}
          <circle
            cx={-halfW + 0.8}
            cy={0}
            r="0.32"
            fill={isGraphPaper ? '#ffffff' : '#0f172a'}
            stroke={isGraphPaper ? '#000000' : '#f59e0b'}
            strokeWidth="0.04"
          />
          <text
            x={-halfW + 0.8}
            y={0.05}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={isGraphPaper ? '#000000' : '#f59e0b'}
            fontSize="0.18"
            fontWeight="bold"
            fontFamily="'Chivo Mono', monospace"
          >
            S
          </text>
        </g>
      )}

      {/* Bio Wetland Label Badge */}
      <g transform={`translate(0, ${-halfH - 0.35})`} pointerEvents="none">
        <rect
          x="-2.2"
          y="-0.22"
          width="4.4"
          height="0.44"
          rx="0.04"
          fill={isGraphPaper ? '#ffffff' : isDark ? '#064e3b' : '#ecfdf5'}
          stroke={borderColor}
          strokeWidth="0.02"
        />
        <text
          x="0"
          y="0.04"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isGraphPaper ? '#000000' : isDark ? '#a7f3d0' : '#065f46'}
          fontSize="0.2"
          fontWeight="bold"
          fontFamily="'Chivo Mono', monospace"
        >
          {bog.label} ({bog.width}&apos;×{bog.height}&apos;)
        </text>
      </g>
    </g>
  );
};
