import React, { useMemo } from 'react';
import { PondOutline, ThemeMode, Point } from '../types';
import { pointsToSmoothSvgPath } from '../utils/geometry';

interface PondOutlineViewProps {
  outline: PondOutline;
  isSelected: boolean;
  theme: ThemeMode;
  showDepths?: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  selectedVertexIndices?: number[];
  activeDragVertexIndex?: number | null;
  onStartDragVertex?: (outlineId: string, index: number, e: React.MouseEvent) => void;
  onDeleteVertex?: (outlineId: string, index: number, e: React.MouseEvent) => void;
  onDoubleClickEdge?: (outlineId: string, pt: Point, e: React.MouseEvent) => void;
}

export const PondOutlineView: React.FC<PondOutlineViewProps> = ({
  outline,
  isSelected,
  theme,
  showDepths = true,
  onSelect,
  selectedVertexIndices = [],
  activeDragVertexIndex = null,
  onStartDragVertex,
  onDeleteVertex,
  onDoubleClickEdge,
}) => {
  const isGraphPaper = theme === 'graph_paper';
  const isDark = theme !== 'graph_paper';

  // Smooth SVG path
  const pathD = useMemo(() => {
    return pointsToSmoothSvgPath(outline.points, outline.closed);
  }, [outline.points, outline.closed]);

  // Styling based on depth and perimeter type
  const { stroke, fill, strokeWidth, strokeDasharray } = useMemo(() => {
    const isPerimeter = outline.type === 'perimeter';

    if (isGraphPaper) {
      if (isPerimeter) {
        return {
          stroke: '#000000',
          fill: isSelected ? 'rgba(0, 0, 0, 0.04)' : '#ffffff',
          strokeWidth: isSelected ? 0.09 : 0.06,
          strokeDasharray: undefined,
        };
      } else {
        // Shelf contour line in black & white drafting
        return {
          stroke: '#000000',
          fill: 'none',
          strokeWidth: isSelected ? 0.07 : 0.04,
          strokeDasharray: '0.35,0.2',
        };
      }
    } else if (theme === 'blueprint') {
      if (isPerimeter) {
        return {
          stroke: isSelected ? '#38bdf8' : '#0284c7',
          fill: 'rgba(2, 132, 199, 0.18)',
          strokeWidth: isSelected ? 0.08 : 0.05,
          strokeDasharray: undefined,
        };
      } else {
        // Shelf contour line
        const depth = Math.abs(outline.depthInches);
        const opacity = depth > 30 ? 0.45 : depth > 18 ? 0.32 : 0.22;
        return {
          stroke: isSelected ? '#38bdf8' : '#0ea5e9',
          fill: `rgba(14, 165, 233, ${opacity})`,
          strokeWidth: 0.04,
          strokeDasharray: '0.4,0.25',
        };
      }
    } else {
      // Dark CAD
      return {
        stroke: isSelected ? '#38bdf8' : '#38bdf8',
        fill: 'rgba(56, 189, 248, 0.15)',
        strokeWidth: isSelected ? 0.08 : 0.05,
        strokeDasharray: outline.type === 'shelf' ? '0.3,0.2' : undefined,
      };
    }
  }, [isGraphPaper, theme, outline.type, outline.depthInches, isSelected]);

  return (
    <g onClick={(e) => onSelect(outline.id, e)} className="cursor-pointer group select-none">
      {/* Filled body with double-click edge point insertion */}
      <path
        d={pathD}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinejoin="round"
        strokeLinecap="round"
        className="transition-all duration-150"
        onDoubleClick={(e) => {
          if (onDoubleClickEdge) {
            e.stopPropagation();
            onDoubleClickEdge(outline.id, { x: 0, y: 0 }, e);
          }
        }}
      />

      {/* Vertex control points when selected */}
      {isSelected &&
        outline.points.map((pt, i) => {
          const isSelectedVertex = selectedVertexIndices.includes(i);
          const isActivelyDragging = activeDragVertexIndex === i;

          return (
            <g
              key={i}
              className="cursor-grab active:cursor-grabbing transition-transform"
              onMouseDown={(e) => {
                e.stopPropagation();
                if (e.button === 0 && onStartDragVertex) {
                  onStartDragVertex(outline.id, i, e);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteVertex?.(outline.id, i, e);
              }}
            >
              {/* Invisible large hit-target circle for easy grabbing (r = 0.60 ft) */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="0.60"
                fill="transparent"
                className="cursor-grab active:cursor-grabbing"
              />

              {/* Pulsing selection/active drag ring */}
              {(isSelectedVertex || isActivelyDragging) && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActivelyDragging ? 0.45 : 0.35}
                  fill="rgba(245, 158, 11, 0.25)"
                  stroke={isGraphPaper ? '#000000' : '#f59e0b'}
                  strokeWidth="0.04"
                  strokeDasharray="0.1,0.08"
                />
              )}

              {/* Outer halo visible on hover */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="0.35"
                fill="none"
                stroke={isGraphPaper ? 'rgba(0, 0, 0, 0.25)' : 'rgba(56, 189, 248, 0.4)'}
                strokeWidth="0.03"
                className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
              />

              {/* Visible solid control point handle dot */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isActivelyDragging ? 0.26 : isSelectedVertex ? 0.24 : outline.type === 'shelf' ? 0.20 : 0.17}
                fill={
                  isActivelyDragging
                    ? '#f59e0b'
                    : isSelectedVertex
                    ? '#ea580c'
                    : outline.type === 'shelf'
                    ? isGraphPaper
                      ? '#0284c7'
                      : '#38bdf8'
                    : isGraphPaper
                    ? '#111827'
                    : '#0284c7'
                }
                stroke="#ffffff"
                strokeWidth={isActivelyDragging || isSelectedVertex ? 0.05 : 0.035}
                className="transition-all hover:scale-125"
              />
            </g>
          );
        })}

      {/* Depth Contour Callout Badge */}
      {showDepths && outline.points.length >= 3 && (
        <g transform={`translate(${outline.points[0].x}, ${outline.points[0].y})`} pointerEvents="none">
          <rect
            x="-1.1"
            y="-0.22"
            width="2.2"
            height="0.44"
            rx="0.04"
            fill={isGraphPaper ? '#ffffff' : isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)'}
            stroke={isGraphPaper ? '#000000' : stroke}
            strokeWidth="0.02"
          />
          <text
            x="0"
            y="0.04"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={isGraphPaper ? '#000000' : isDark ? '#e0f2fe' : '#0369a1'}
            fontSize="0.18"
            fontWeight="bold"
            fontFamily="'Chivo Mono', monospace"
          >
            {outline.depthInches === 0 ? 'RIM (0")' : `SHELF -${Math.abs(outline.depthInches)}"`}
          </text>
        </g>
      )}
    </g>
  );
};

