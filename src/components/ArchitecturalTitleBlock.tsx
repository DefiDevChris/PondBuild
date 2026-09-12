import React from 'react';
import { PondProject, ThemeMode } from '../types';

interface TitleBlockProps {
  project: PondProject;
  theme: ThemeMode;
  onUpdateProjectInfo?: (title: string, designer: string) => void;
}

export const ArchitecturalTitleBlock: React.FC<TitleBlockProps> = ({
  project,
  theme,
}) => {
  const isGraphPaper = theme === 'graph_paper';
  const isDark = theme !== 'graph_paper';

  const borderColor = isGraphPaper ? '#000000' : isDark ? '#0284c7' : '#94a3b8';
  const bgClass = isGraphPaper
    ? 'bg-white text-black border-black shadow-md'
    : isDark
    ? 'bg-slate-950/90 text-cyan-100 border-[#0284c7] shadow-xl'
    : 'bg-white/95 text-slate-800 border-slate-300 shadow-lg';

  const labelColor = isGraphPaper ? 'text-neutral-600' : isDark ? 'text-cyan-400/70' : 'text-slate-500';
  const valColor = isGraphPaper ? 'text-black' : isDark ? 'text-white' : 'text-slate-900';

  return (
    <div
      className={`border-2 rounded-xs text-xs font-mono select-none pointer-events-auto p-2.5 w-72 md:w-80 ${bgClass}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b pb-1.5 mb-1.5" style={{ borderColor }}>
        <div className="flex items-center space-x-1.5">
          <span className={`inline-block w-2.5 h-2.5 rounded-xs ${isGraphPaper ? 'bg-black' : 'bg-cyan-500'}`} />
          <span className="font-bold tracking-widest text-[11px] uppercase">
            ARCHITECTURAL DRAFTING
          </span>
        </div>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-xs font-semibold uppercase ${
          isGraphPaper
            ? 'bg-neutral-100 text-black border border-black'
            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        }`}>
          DWG NO. 4030-01
        </span>
      </div>

      {/* Project Title */}
      <div className="mb-2">
        <div className={`text-[9px] uppercase tracking-wider ${labelColor}`}>Project Title</div>
        <div className={`font-bold text-xs leading-snug truncate ${valColor}`}>
          {project.title || "Residential Pond & Bog Construction Plan"}
        </div>
      </div>

      {/* Grid Specification Metadata Table */}
      <div className="grid grid-cols-2 gap-1.5 text-[10px] border-t pt-1.5" style={{ borderColor }}>
        <div>
          <span className={`${labelColor} block text-[8px] uppercase`}>GRID DIMENSIONS</span>
          <span className={`font-semibold ${valColor}`}>40&apos; × 30&apos; (40×30 Scale)</span>
        </div>
        <div>
          <span className={`${labelColor} block text-[8px] uppercase`}>SCALE RATIO</span>
          <span className={`font-semibold ${valColor}`}>1 Cell = 1.0 Linear Ft</span>
        </div>
        <div>
          <span className={`${labelColor} block text-[8px] uppercase`}>DATE / REVISION</span>
          <span className={valColor}>{project.date} | {project.revision}</span>
        </div>
        <div>
          <span className={`${labelColor} block text-[8px] uppercase`}>STATUS</span>
          <span className={`font-semibold ${isGraphPaper ? 'text-black' : 'text-cyan-400'}`}>
            Issued for Design
          </span>
        </div>
      </div>
    </div>
  );
};
