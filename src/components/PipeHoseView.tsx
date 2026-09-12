import React, { useMemo } from 'react';
import { PipeRun, ThemeMode } from '../types';
import { calculatePolylineLength, distance } from '../utils/geometry';
import { PIPE_CONFIGS } from '../utils/pipeConfig';

interface PipeHoseViewProps {
  pipe: PipeRun;
  isSelected: boolean;
  theme: ThemeMode;
  showLabels?: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
}

export const PipeHoseView: React.FC<PipeHoseViewProps> = ({
  pipe,
  isSelected,
  theme,
  showLabels = true,
  onSelect,
}) => {
  const isGraphPaper = theme === 'graph_paper';
  const isDark = theme !== 'graph_paper';
  const config = PIPE_CONFIGS[pipe.pipeType] || PIPE_CONFIGS.flex_pvc_2;

  // Total 2D length
  const length2D = useMemo(() => calculatePolylineLength(pipe.points), [pipe.points]);
  const verticalRise = pipe.verticalRiseFt ?? 4.0;
  const totalWithRise = length2D + verticalRise;
  const totalWithBuffer = Math.ceil(totalWithRise * 1.12);

  // Midpoint for placing the length callout badge
  const midPoint = useMemo(() => {
    if (pipe.points.length < 2) return null;
    const midIdx = Math.floor(pipe.points.length / 2);
    const p1 = pipe.points[midIdx - 1];
    const p2 = pipe.points[midIdx];
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }, [pipe.points]);

  // Points string for polyline
  const polylinePoints = useMemo(() => {
    return pipe.points.map((p) => `${p.x},${p.y}`).join(' ');
  }, [pipe.points]);

  // Architectural dash pattern in B&W
  const dashArray = useMemo(() => {
    if (!isGraphPaper) return config.dashArray;
    if (pipe.pipeType === 'rigid_pvc_2') return '0.5,0.2';
    if (pipe.pipeType === 'bottom_drain_3') return '0.7,0.2,0.1,0.2';
    if (pipe.pipeType === 'kinkfree_1') return '0.25,0.15';
    if (pipe.pipeType === 'aeration_3_8') return '0.08,0.08';
    return undefined; // solid line for main 2" & 1.5" flex pvc
  }, [isGraphPaper, pipe.pipeType, config.dashArray]);

  const strokeColor = isGraphPaper ? '#000000' : config.color;
  const strokeWidth = isGraphPaper
    ? pipe.pipeType === 'bottom_drain_3'
      ? 0.12
      : pipe.pipeType === 'flex_pvc_2'
      ? 0.09
      : 0.07
    : Math.max(0.08, (config.diameterInches / 12) * 0.55);

  if (pipe.points.length < 2) return null;

  return (
    <g onClick={(e) => onSelect(pipe.id, e)} className="cursor-pointer group select-none">
      {/* Invisible wider hit-testing track */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke="transparent"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Outer trench / conduit highlight when selected */}
      {isSelected && (
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={isGraphPaper ? '#000000' : '#38bdf8'}
          strokeWidth="0.32"
          strokeOpacity={isGraphPaper ? '0.2' : '0.45'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Main Pipe/Hose Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-150"
      />

      {/* Elbows / Fittings at vertices */}
      {pipe.points.map((pt, i) => (
        <circle
          key={i}
          cx={pt.x}
          cy={pt.y}
          r={isSelected ? 0.16 : 0.11}
          fill={isSelected ? '#ffffff' : strokeColor}
          stroke={isGraphPaper ? '#000000' : '#0f172a'}
          strokeWidth="0.03"
        />
      ))}

      {/* Flow Direction Arrows along segments */}
      {pipe.points.length >= 2 &&
        pipe.points.slice(0, -1).map((p1, i) => {
          const p2 = pipe.points[i + 1];
          const segDist = distance(p1, p2);
          if (segDist < 1.5) return null; // skip tiny segments

          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;
          const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;

          return (
            <g key={i} transform={`translate(${mx}, ${my}) rotate(${angle})`} pointerEvents="none">
              <polygon
                points="-0.15,-0.1 0.15,0 -0.15,0.1"
                fill={strokeColor}
                stroke={isGraphPaper ? '#ffffff' : isDark ? '#0f172a' : '#ffffff'}
                strokeWidth="0.02"
              />
            </g>
          );
        })}

      {/* Architectural Pipe Length & Spec Badge */}
      {showLabels && midPoint && (
        <g transform={`translate(${midPoint.x}, ${midPoint.y - 0.45})`} pointerEvents="none">
          <rect
            x={-1.8}
            y={-0.28}
            width={3.6}
            height={0.56}
            rx={0.04}
            fill={isGraphPaper ? '#ffffff' : isDark ? '#091524' : '#ffffff'}
            stroke={isGraphPaper ? '#000000' : config.color}
            strokeWidth={isSelected ? 0.04 : 0.02}
          />
          <text
            x={0}
            y={0.06}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={isGraphPaper ? '#000000' : config.color}
            fontSize="0.22"
            fontWeight="bold"
            fontFamily="'Chivo Mono', monospace"
          >
            {pipe.pipeType === 'flex_pvc_2' ? '2" Flex' : pipe.pipeType === 'flex_pvc_1_5' ? '1.5" Flex' : 'Pipe'}: {totalWithBuffer}&apos; ({totalWithRise.toFixed(1)}&apos; plan+{verticalRise}&apos; rise)
          </text>
        </g>
      )}
    </g>
  );
};
