import React from 'react';
import { 
  MousePointer, 
  PenTool, 
  Ruler, 
  FileText, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  Layers, 
  Magnet, 
  Eye
} from 'lucide-react';
import { ToolMode, ThemeMode, PipeType } from '../types';
import { PIPE_CONFIGS } from '../utils/pipeConfig';

interface ToolbarProps {
  currentMode: ToolMode;
  onSelectMode: (mode: ToolMode) => void;
  activePipeType: PipeType;
  onSelectPipeType: (type: PipeType) => void;
  theme?: ThemeMode;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  showDimensions: boolean;
  onToggleDimensions: () => void;
  showDepths: boolean;
  onToggleDepths: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onOpenCalculations: () => void;
  onAddShelf?: (depthInches: 12 | 18 | 24) => void;
  onAdd12InchShelf: () => void;
  summaryStats: {
    volumeGal: number;
    pipeFt: number;
    rockCount: number;
    bogRatio: number;
  };
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentMode,
  onSelectMode,
  activePipeType,
  onSelectPipeType,
  theme = 'graph_paper',
  snapToGrid,
  onToggleSnap,
  showDimensions,
  onToggleDimensions,
  showDepths,
  onToggleDepths,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onOpenCalculations,
  onAddShelf,
  onAdd12InchShelf,
  summaryStats,
}) => {
  const isGraphPaper = theme === 'graph_paper';
  const isDark = theme !== 'graph_paper';

  const headerClass = isGraphPaper
    ? 'bg-white border-neutral-300 text-neutral-900 shadow-xs'
    : theme === 'blueprint'
    ? 'bg-[#08182b] border-[#1d3d63] text-slate-100 shadow-md'
    : 'bg-slate-900 border-slate-800 text-slate-100 shadow-md';

  const toolGroupBg = isGraphPaper
    ? 'bg-neutral-100 border-neutral-300'
    : 'bg-slate-950/80 border-slate-800';

  const getToolBtnClass = (mode: ToolMode) => {
    const isActive = currentMode === mode;
    if (isGraphPaper) {
      return isActive
        ? 'bg-black text-white border-black font-semibold'
        : 'bg-white hover:bg-neutral-200 text-neutral-800 border-neutral-300';
    }
    return isActive
      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border-transparent';
  };

  return (
    <header
      id="main-toolbar"
      className={`border-b px-3 py-2 flex flex-wrap items-center justify-between gap-2 select-none z-20 transition-colors ${headerClass}`}
    >
      {/* Left: Brand & Main Drafting Tool Modes */}
      <div className="flex items-center space-x-2">
        <div className={`flex items-center space-x-2 pr-3 border-r ${isGraphPaper ? 'border-neutral-300' : 'border-slate-800'}`}>
          <div
            className={`w-7 h-7 rounded-xs flex items-center justify-center font-bold font-mono text-xs ${
              isGraphPaper
                ? 'bg-black text-white'
                : 'bg-cyan-600 text-slate-950'
            }`}
          >
            20&apos;
          </div>
          <div>
            <h1 className={`text-xs font-bold tracking-wider uppercase font-mono leading-tight ${isGraphPaper ? 'text-black' : 'text-cyan-400'}`}>
              Pond Drafting CAD
            </h1>
            <span className={`text-[10px] font-mono block -mt-0.5 ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
              20&apos; × 20&apos; Scale Grid (1 sq = 1 ft)
            </span>
          </div>
        </div>

        {/* Primary Tool Buttons */}
        <div className={`flex items-center p-0.5 rounded-xs border gap-1 ${toolGroupBg}`}>
          <button
            id="tool-select"
            onClick={() => onSelectMode('select')}
            className={`px-2.5 py-1.5 rounded-xs text-xs font-mono flex items-center gap-1.5 transition-colors border ${getToolBtnClass('select')}`}
            title="Select & Move Elements"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Select</span>
          </button>

          <button
            id="tool-draw-outline"
            onClick={() => onSelectMode('draw_outline')}
            className={`px-2.5 py-1.5 rounded-xs text-xs font-mono flex items-center gap-1.5 transition-colors border ${getToolBtnClass('draw_outline')}`}
            title="Freehand Draw Pond Rim (Click, hold and drag with auto-smoothing)"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Draw Outline</span>
          </button>

          <button
            id="tool-draw-shelf"
            onClick={() => onSelectMode('draw_shelf')}
            className={`px-2.5 py-1.5 rounded-xs text-xs font-mono flex items-center gap-1.5 transition-colors border ${getToolBtnClass('draw_shelf')}`}
            title="Freehand Draw Shelf Contour (Click, hold and drag with auto-smoothing)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Draw Shelf</span>
          </button>

          {/* Shelf Inset Quick Tracing Buttons (12", 18", 24") */}
          <div className="flex items-center rounded-xs border p-0.5 gap-0.5 border-neutral-300 dark:border-slate-700">
            <span className={`text-[10px] font-mono font-bold px-1.5 flex items-center gap-1 ${
              isGraphPaper ? 'text-neutral-700' : 'text-cyan-300'
            }`}>
              <Layers className="w-3 h-3 text-cyan-500" />
              <span>Shelf:</span>
            </span>
            <button
              id="btn-add-12in-shelf"
              onClick={() => onAddShelf ? onAddShelf(12) : onAdd12InchShelf()}
              className={`px-1.5 py-1 rounded-xs text-[11px] font-mono font-bold transition-colors border ${
                isGraphPaper
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-black border-neutral-400'
                  : 'bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border-cyan-500/50'
              }`}
              title="Add Marginal Shelf (12&quot; deep, 12&quot; inset)"
            >
              +12&quot;
            </button>
            <button
              id="btn-add-18in-shelf"
              onClick={() => onAddShelf ? onAddShelf(18) : onAdd12InchShelf()}
              className={`px-1.5 py-1 rounded-xs text-[11px] font-mono font-bold transition-colors border ${
                isGraphPaper
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-black border-neutral-400'
                  : 'bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border-cyan-500/50'
              }`}
              title="Add Mid Shelf (18&quot; deep, 18&quot; inset)"
            >
              +18&quot;
            </button>
            <button
              id="btn-add-24in-shelf"
              onClick={() => onAddShelf ? onAddShelf(24) : onAdd12InchShelf()}
              className={`px-1.5 py-1 rounded-xs text-[11px] font-mono font-bold transition-colors border ${
                isGraphPaper
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-black border-neutral-400'
                  : 'bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border-cyan-500/50'
              }`}
              title="Add Deep Shelf (24&quot; deep, 24&quot; inset)"
            >
              +24&quot;
            </button>
          </div>

          <button
            id="tool-draw-pipe"
            onClick={() => onSelectMode('draw_pipe')}
            className={`px-2.5 py-1.5 rounded-xs text-xs font-mono flex items-center gap-1.5 transition-colors border ${getToolBtnClass('draw_pipe')}`}
            title="Freehand Draw Plumbing Pipe / Hose Run (Click, hold and drag)"
          >
            <span className={`w-2 h-2 rounded-full inline-block ${isGraphPaper ? (currentMode === 'draw_pipe' ? 'bg-white' : 'bg-black') : 'bg-cyan-400'}`} />
            <span>Draw Pipe</span>
          </button>

          <button
            id="tool-measure"
            onClick={() => onSelectMode('measure')}
            className={`px-2.5 py-1.5 rounded-xs text-xs font-mono flex items-center gap-1.5 transition-colors border ${getToolBtnClass('measure')}`}
            title="Measure Dimension Tool (Click 2 points)"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Measure</span>
          </button>
        </div>

        {/* If in Pipe Mode, show Active Pipe Selector */}
        {currentMode === 'draw_pipe' && (
          <div className={`flex items-center space-x-1.5 pl-2 border-l ${isGraphPaper ? 'border-neutral-300' : 'border-slate-800'}`}>
            <span className={`text-[10px] font-mono uppercase font-bold ${isGraphPaper ? 'text-neutral-700' : 'text-cyan-400'}`}>
              Pipe Type:
            </span>
            <select
              value={activePipeType}
              onChange={(e) => onSelectPipeType(e.target.value as PipeType)}
              className={`text-xs rounded-xs px-2 py-1 font-mono focus:outline-hidden ${
                isGraphPaper
                  ? 'bg-white text-black border border-neutral-400 focus:border-black'
                  : 'bg-slate-950 text-cyan-200 border border-cyan-500/50'
              }`}
            >
              {Object.values(PIPE_CONFIGS).map((cfg) => (
                <option key={cfg.id} value={cfg.id}>
                  {cfg.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Center: Live Project Engineering Metrics Bar */}
      <button
        id="btn-open-bom-header"
        onClick={onOpenCalculations}
        className={`flex items-center space-x-2 px-3 py-1 text-xs transition-colors rounded-xs border font-mono ${
          isGraphPaper
            ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-300 text-neutral-900'
            : 'bg-slate-950 hover:bg-slate-900 border-slate-700 text-slate-200'
        }`}
        title="Open Full Engineering Schedule & Bill of Materials"
      >
        <span className="font-bold text-[11px]">
          {summaryStats.volumeGal.toLocaleString()} Gal
        </span>
        <span className="text-neutral-400">|</span>
        <span className="font-semibold text-[11px]">
          {summaryStats.pipeFt}&apos; Pipe
        </span>
        <span className="text-neutral-400">|</span>
        <span className="font-semibold text-[11px]">
          {summaryStats.rockCount} Stones
        </span>
        <span className="text-neutral-400">|</span>
        <span className={`font-semibold text-[11px] ${summaryStats.bogRatio >= 15 ? 'text-emerald-700' : 'text-amber-700'}`}>
          Bog: {summaryStats.bogRatio}%
        </span>
        <FileText className="w-3.5 h-3.5 ml-1 text-neutral-500" />
      </button>

      {/* Right: View Toggles, Presets, Undo/Redo & BOM button */}
      <div className="flex items-center space-x-1.5">
        {/* Undo / Redo */}
        <div className={`flex items-center space-x-0.5 pr-2 border-r ${isGraphPaper ? 'border-neutral-300' : 'border-slate-700/60'}`}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-xs disabled:opacity-30 disabled:cursor-not-allowed ${
              isGraphPaper ? 'hover:bg-neutral-200 text-neutral-700' : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-xs disabled:opacity-30 disabled:cursor-not-allowed ${
              isGraphPaper ? 'hover:bg-neutral-200 text-neutral-700' : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="Redo"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Snap to Grid */}
        <button
          onClick={onToggleSnap}
          className={`p-1.5 rounded-xs text-xs font-mono flex items-center gap-1 border transition-colors ${
            snapToGrid
              ? isGraphPaper
                ? 'bg-neutral-200 text-black border-neutral-400 font-bold'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : isGraphPaper
              ? 'bg-transparent text-neutral-500 border-transparent hover:border-neutral-300'
              : 'text-slate-400 border-transparent hover:bg-slate-800/50'
          }`}
          title="Toggle 0.5-ft Grid Snap"
        >
          <Magnet className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden md:inline">Snap</span>
        </button>

        {/* Dimensions Toggle */}
        <button
          onClick={onToggleDimensions}
          className={`p-1.5 rounded-xs text-xs font-mono flex items-center gap-1 border transition-colors ${
            showDimensions
              ? isGraphPaper
                ? 'bg-neutral-200 text-black border-neutral-400 font-bold'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : isGraphPaper
              ? 'bg-transparent text-neutral-500 border-transparent hover:border-neutral-300'
              : 'text-slate-400 border-transparent hover:bg-slate-800/50'
          }`}
          title="Toggle Dimensions & Stone Labels"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden md:inline">Dims</span>
        </button>

        {/* Clear Canvas */}
        <button
          onClick={onClear}
          className={`p-1.5 rounded-xs transition-colors ${
            isGraphPaper
              ? 'text-neutral-500 hover:text-red-700 hover:bg-neutral-100'
              : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
          }`}
          title="Clear Canvas to Empty Graph Paper"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Full BOM & Calculations Modal Trigger */}
        <button
          id="btn-open-bom"
          onClick={onOpenCalculations}
          className={`ml-1 px-3 py-1.5 rounded-xs font-mono font-bold text-xs flex items-center gap-1.5 transition-colors border ${
            isGraphPaper
              ? 'bg-black hover:bg-neutral-800 text-white border-black'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-400'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Spec &amp; BOM</span>
        </button>
      </div>
    </header>
  );
};
