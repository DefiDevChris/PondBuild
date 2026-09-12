import React from 'react';
import { EquipmentElement, ThemeMode } from '../types';

interface EquipmentViewProps {
  eq: EquipmentElement;
  isSelected: boolean;
  theme: ThemeMode;
  onSelect: (id: string, e: React.MouseEvent) => void;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({
  eq,
  isSelected,
  theme,
  onSelect,
}) => {
  const isGraphPaper = theme === 'graph_paper';
  const isDark = theme !== 'graph_paper';
  const strokeColor = isGraphPaper ? '#000000' : isSelected ? '#38bdf8' : isDark ? '#93c5fd' : '#1e3a8a';
  const fillColor = isGraphPaper ? '#ffffff' : isDark ? '#0f172a' : '#f8fafc';

  return (
    <g
      transform={`translate(${eq.x}, ${eq.y}) rotate(${eq.rotation})`}
      onClick={(e) => onSelect(eq.id, e)}
      className="cursor-pointer group select-none"
    >
      {/* Halo when selected */}
      {isSelected && (
        <circle
          r="1.4"
          fill="none"
          stroke={isGraphPaper ? '#000000' : '#38bdf8'}
          strokeWidth="0.04"
          strokeDasharray="0.15,0.1"
        />
      )}

      {/* Render based on equipment type */}
      {eq.eqType === 'skimmer' && (
        <g>
          {/* Skimmer box housing */}
          <rect
            x="-0.75"
            y="-0.6"
            width="1.5"
            height="1.2"
            rx="0.04"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="0.05"
          />
          {/* Skimmer weir mouth opening */}
          <path d="M-0.75,-0.3 L-1.1,-0.5 L-1.1,0.5 L-0.75,0.3" fill="none" stroke={strokeColor} strokeWidth="0.05" />
          <circle cx="0" cy="0" r="0.25" fill="none" stroke={strokeColor} strokeWidth="0.04" />
          <text
            x="0"
            y="0.05"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={strokeColor}
            fontSize="0.2"
            fontWeight="bold"
            fontFamily="'Chivo Mono', monospace"
          >
            SK
          </text>
        </g>
      )}

      {eq.eqType === 'waterfall_spillway' && (
        <g>
          {/* Spillway header tank box */}
          <rect
            x="-1.2"
            y="-0.4"
            width="2.4"
            height="0.8"
            rx="0.04"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="0.05"
          />
          {/* Spillway weir lip */}
          <line x1="-1.0" y1="0.4" x2="1.0" y2="0.4" stroke={strokeColor} strokeWidth="0.1" strokeLinecap="round" />
          {/* Water flow arrows / ripples */}
          <path d="M-0.6,0.6 L-0.6,0.85 M0,0.6 L0,0.85 M0.6,0.6 L0.6,0.85" fill="none" stroke={strokeColor} strokeWidth="0.04" />
          <text
            x="0"
            y="-0.02"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={strokeColor}
            fontSize="0.2"
            fontWeight="bold"
            fontFamily="'Chivo Mono', monospace"
          >
            SPILLWAY
          </text>
        </g>
      )}

      {eq.eqType === 'bottom_drain' && (
        <g>
          {/* Outer drain sump flange */}
          <circle cx="0" cy="0" r="0.75" fill={fillColor} stroke={strokeColor} strokeWidth="0.05" />
          <circle cx="0" cy="0" r="0.5" fill="none" stroke={strokeColor} strokeWidth="0.03" strokeDasharray="0.1,0.1" />
          <line x1="-0.75" y1="0" x2="0.75" y2="0" stroke={strokeColor} strokeWidth="0.02" />
          <line x1="0" y1="-0.75" x2="0" y2="0.75" stroke={strokeColor} strokeWidth="0.02" />
          <text
            x="0"
            y="0.05"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={strokeColor}
            fontSize="0.22"
            fontWeight="bold"
            fontFamily="'Chivo Mono', monospace"
          >
            BD
          </text>
        </g>
      )}

      {eq.eqType === 'pump_vault' && (
        <g>
          <rect
            x="-0.8"
            y="-0.8"
            width="1.6"
            height="1.6"
            rx="0.04"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="0.05"
          />
          <circle cx="0" cy="0" r="0.5" fill="none" stroke={strokeColor} strokeWidth="0.04" />
          <text
            x="0"
            y="0.05"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={strokeColor}
            fontSize="0.22"
            fontWeight="bold"
            fontFamily="'Chivo Mono', monospace"
          >
            PUMP
          </text>
        </g>
      )}

      {eq.eqType === 'aerator_diffuser' && (
        <g>
          <circle cx="0" cy="0" r="0.6" fill={fillColor} stroke={strokeColor} strokeWidth="0.04" />
          {/* Aeration bubble ripples */}
          <circle cx="0" cy="0" r="0.4" fill="none" stroke={strokeColor} strokeWidth="0.03" strokeDasharray="0.1,0.08" />
          <circle cx="0" cy="0" r="0.2" fill="none" stroke={strokeColor} strokeWidth="0.02" />
          <text
            x="0"
            y="0.04"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={strokeColor}
            fontSize="0.2"
            fontWeight="bold"
            fontFamily="'Chivo Mono', monospace"
          >
            AIR
          </text>
        </g>
      )}

      {/* Equipment Label */}
      <text
        x="0"
        y="1.15"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={strokeColor}
        fontSize="0.22"
        fontWeight="bold"
        fontFamily="'Chivo Mono', monospace"
        pointerEvents="none"
      >
        {eq.label}
      </text>
    </g>
  );
};
