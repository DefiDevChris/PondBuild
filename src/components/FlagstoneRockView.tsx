import React, { useMemo } from 'react';
import { RockElement, ThemeMode } from '../types';
import { generateFlagstoneVertices } from '../utils/geometry';

interface FlagstoneRockViewProps {
  rock: RockElement;
  isSelected: boolean;
  theme: ThemeMode;
  showDimensions?: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
}

export const FlagstoneRockView: React.FC<FlagstoneRockViewProps> = ({
  rock,
  isSelected,
  theme,
  showDimensions = true,
  onSelect,
}) => {
  const isGraphPaper = theme === 'graph_paper';
  const isDark = theme !== 'graph_paper';

  // Compute vertices in feet based strictly on sizeInches
  const vertices = useMemo(() => {
    return generateFlagstoneVertices(rock.sizeInches, rock.shapeSeed);
  }, [rock.sizeInches, rock.shapeSeed]);

  // Convert vertices to SVG polygon points string
  const pointsString = useMemo(() => {
    return vertices.map((v) => `${v.x.toFixed(3)},${v.y.toFixed(3)}`).join(' ');
  }, [vertices]);

  // Inner facets / cleavage lines for natural irregular flagstone depth
  const innerCleavageLines = useMemo(() => {
    if (vertices.length < 4) return [];
    return [
      { x1: vertices[0].x * 0.7, y1: vertices[0].y * 0.7, x2: vertices[2].x * 0.65, y2: vertices[2].y * 0.65 },
      { x1: vertices[2].x * 0.65, y1: vertices[2].y * 0.65, x2: vertices[4].x * 0.7, y2: vertices[4].y * 0.7 },
      { x1: vertices[1].x * 0.6, y1: vertices[1].y * 0.6, x2: vertices[vertices.length - 1].x * 0.6, y2: vertices[vertices.length - 1].y * 0.6 },
    ];
  }, [vertices]);

  // Styling based on material & theme
  const { fill, stroke, strokeWidth, facetStroke } = useMemo(() => {
    if (isGraphPaper) {
      // Pure Architectural Black and White Graph Paper
      return {
        fill: isSelected ? '#e2e8f0' : '#ffffff',
        stroke: '#000000',
        strokeWidth: isSelected ? 0.08 : 0.045,
        facetStroke: '#4b5563',
      };
    } else if (theme === 'blueprint') {
      // Classic Blueprint cyan/navy aesthetic
      if (rock.material === 'bluestone') {
        return {
          fill: isSelected ? 'rgba(56, 189, 248, 0.45)' : 'rgba(14, 116, 144, 0.6)',
          stroke: isSelected ? '#38bdf8' : '#38bdf8',
          strokeWidth: isSelected ? 0.08 : 0.04,
          facetStroke: 'rgba(186, 230, 253, 0.4)',
        };
      } else if (rock.material === 'fieldstone') {
        return {
          fill: isSelected ? 'rgba(245, 158, 11, 0.45)' : 'rgba(180, 83, 9, 0.45)',
          stroke: isSelected ? '#fbbf24' : '#d97706',
          strokeWidth: isSelected ? 0.08 : 0.04,
          facetStroke: 'rgba(253, 230, 138, 0.35)',
        };
      } else {
        // Slate (default)
        return {
          fill: isSelected ? 'rgba(125, 211, 252, 0.4)' : 'rgba(30, 58, 95, 0.65)',
          stroke: isSelected ? '#67e8f9' : '#0284c7',
          strokeWidth: isSelected ? 0.08 : 0.04,
          facetStroke: 'rgba(125, 211, 252, 0.3)',
        };
      }
    } else {
      // Dark CAD mode
      return {
        fill: isSelected ? 'rgba(56, 189, 248, 0.35)' : '#334155',
        stroke: isSelected ? '#38bdf8' : '#64748b',
        strokeWidth: isSelected ? 0.08 : 0.04,
        facetStroke: '#475569',
      };
    }
  }, [isGraphPaper, theme, rock.material, isSelected]);

  return (
    <g
      transform={`translate(${rock.x}, ${rock.y}) rotate(${rock.rotation})`}
      onClick={(e) => onSelect(rock.id, e)}
      className="cursor-pointer group select-none"
    >
      {/* Selection halo */}
      {isSelected && (
        <circle
          r={(rock.sizeInches / 12) * 0.72}
          fill="none"
          stroke={isGraphPaper ? '#000000' : '#38bdf8'}
          strokeWidth="0.04"
          strokeDasharray="0.15,0.1"
          opacity="0.9"
        />
      )}

      {/* Main Irregular Flagstone Polygon */}
      <polygon
        points={pointsString}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        className="transition-colors duration-150 group-hover:brightness-95"
      />

      {/* Internal Facet / Natural Cleavage Lines */}
      {innerCleavageLines.map((line, idx) => (
        <line
          key={idx}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={facetStroke}
          strokeWidth="0.02"
          strokeLinecap="round"
        />
      ))}

      {/* Flagstone Dimension Callout (e.g. 18", 24") */}
      {showDimensions && (
        <text
          x="0"
          y="0.08"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isGraphPaper ? '#000000' : isDark ? '#e0f2fe' : '#1e293b'}
          fontSize={Math.max(0.24, (rock.sizeInches / 12) * 0.28)}
          fontWeight="bold"
          fontFamily="'Chivo Mono', monospace"
          pointerEvents="none"
          opacity={isSelected ? 1 : 0.9}
          transform={`rotate(${-rock.rotation})`} // keep text upright
        >
          {rock.sizeInches}&quot;
        </text>
      )}

      {/* Rotation Knob when selected */}
      {isSelected && (
        <g transform={`translate(0, ${-(rock.sizeInches / 12) * 0.85})`}>
          <line
            x1="0"
            y1="0"
            x2="0"
            y2={(rock.sizeInches / 12) * 0.3}
            stroke={isGraphPaper ? '#000000' : '#38bdf8'}
            strokeWidth="0.03"
          />
          <circle
            r="0.16"
            fill={isGraphPaper ? '#000000' : '#38bdf8'}
            stroke="#ffffff"
            strokeWidth="0.03"
            className="cursor-grab active:cursor-grabbing hover:scale-125"
          />
        </g>
      )}
    </g>
  );
};
