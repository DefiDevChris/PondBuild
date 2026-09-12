import React, { useState } from 'react';
import { 
  CircleDot, 
  Plus, 
  Info,
  RotateCcw,
  Wrench,
  Layers
} from 'lucide-react';
import { ROCK_PRESETS } from '../utils/pipeConfig';
import { RockMaterial, ThemeMode } from '../types';

interface SidebarPaletteProps {
  theme: ThemeMode;
  onAddShelf?: (depthInches: 12 | 18 | 24) => void;
  onAdd12InchShelf: () => void;
  onAddRock: (sizeInches: number, material: RockMaterial) => void;
  onAutoPerimeterRocks: () => void;
  onAddEquipment: (eqType: 'skimmer' | 'waterfall_spillway' | 'bottom_drain' | 'pump_vault' | 'aerator_diffuser', label: string) => void;
}

export const SidebarPalette: React.FC<SidebarPaletteProps> = ({
  theme,
  onAddShelf,
  onAdd12InchShelf,
  onAddRock,
  onAutoPerimeterRocks,
  onAddEquipment,
}) => {
  const [activeTab, setActiveTab] = useState<'rocks' | 'equipment'>('rocks');
  const [selectedMaterial, setSelectedMaterial] = useState<RockMaterial>('slate');

  const isGraphPaper = theme === 'graph_paper';

  const bgClass = isGraphPaper
    ? 'bg-white border-neutral-300 text-neutral-900 shadow-xs'
    : theme === 'blueprint'
    ? 'bg-[#08182b] border-[#1d3d63] text-slate-200 shadow-lg'
    : 'bg-slate-900 border-slate-800 text-slate-200 shadow-lg';

  const tabHeaderBg = isGraphPaper ? 'bg-neutral-100 border-neutral-300' : 'bg-slate-950/60 border-slate-800';

  const getTabClass = (tab: 'rocks' | 'equipment') => {
    const isActive = activeTab === tab;
    if (isGraphPaper) {
      return isActive
        ? 'bg-black text-white font-bold border border-black shadow-xs'
        : 'text-neutral-600 hover:text-black hover:bg-neutral-200/70 border border-transparent';
    }
    return isActive
      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-xs'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent';
  };

  const cardClass = isGraphPaper
    ? 'p-2.5 rounded-xs border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 cursor-grab active:cursor-grabbing transition-all flex items-center justify-between group'
    : 'p-2.5 rounded-xs border border-slate-800 hover:border-cyan-500/60 bg-slate-950/50 hover:bg-cyan-950/30 cursor-grab active:cursor-grabbing transition-all flex items-center justify-between group';

  const cardTitleClass = isGraphPaper
    ? 'font-bold text-neutral-900 group-hover:text-black text-xs'
    : 'font-bold text-slate-200 group-hover:text-cyan-300 text-xs';

  const handleDragStart = (e: React.DragEvent, itemType: string, data: Record<string, unknown>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ itemType, ...data }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside
      id="sidebar-palette"
      className={`w-80 flex flex-col border-r h-full select-none z-10 transition-colors ${bgClass}`}
    >
      {/* Palette Tab Navigation */}
      <div className={`flex border-b p-1 gap-1 ${tabHeaderBg}`}>
        <button
          id="tab-rocks"
          onClick={() => setActiveTab('rocks')}
          className={`flex-1 py-1.5 px-1 text-[11px] font-mono rounded-xs flex items-center justify-center gap-1.5 transition-all ${getTabClass('rocks')}`}
          title="Auto-scaled Flagstones, Rocks & Shelves"
        >
          <CircleDot className="w-3.5 h-3.5" />
          <span>Rocks &amp; Shelves</span>
        </button>

        <button
          id="tab-equipment"
          onClick={() => setActiveTab('equipment')}
          className={`flex-1 py-1.5 px-1 text-[11px] font-mono rounded-xs flex items-center justify-center gap-1.5 transition-all ${getTabClass('equipment')}`}
          title="Pumps, Skimmers & Spillways"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Equipment</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
        {/* ================= TAB: ROCKS & SHELVES ================= */}
        {activeTab === 'rocks' && (
          <div className="space-y-3.5">
            {/* Shelf Tiers (12", 18", 24" Inset) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className={`font-bold font-mono text-xs uppercase tracking-wide ${isGraphPaper ? 'text-black' : 'text-cyan-300'}`}>
                  Shelf Tiers (Adjustable)
                </h3>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-xs font-mono font-bold ${
                  isGraphPaper ? 'bg-black text-white' : 'bg-cyan-500 text-slate-950'
                }`}>
                  TRACED
                </span>
              </div>
              <p className={`text-[10px] mb-2 leading-relaxed ${isGraphPaper ? 'text-neutral-600' : 'text-slate-400'}`}>
                Traces pond rim with clean, well-spaced points. Click any shelf point on the blueprint to adjust or reshape it!
              </p>

              <div className="grid grid-cols-3 gap-1.5">
                {/* 12" Shelf */}
                <button
                  id="btn-sidebar-shelf-12in"
                  onClick={() => onAddShelf ? onAddShelf(12) : onAdd12InchShelf()}
                  className={`p-2 rounded-xs border text-left cursor-pointer transition-all ${
                    isGraphPaper
                      ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-300 hover:border-black'
                      : 'bg-cyan-950/40 hover:bg-cyan-950/80 border-cyan-500/50 hover:border-cyan-400'
                  }`}
                  title="Add 12&quot; Inset Marginal Shelf"
                >
                  <div className="flex items-center gap-1 font-mono font-bold text-xs mb-0.5">
                    <Layers className="w-3 h-3 text-cyan-500" />
                    <span>12&quot; Shelf</span>
                  </div>
                  <div className={`text-[9px] font-mono ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                    Depth: -12&quot;
                  </div>
                  <div className={`text-[9px] font-mono ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                    Inset: 1.0 ft
                  </div>
                </button>

                {/* 18" Shelf */}
                <button
                  id="btn-sidebar-shelf-18in"
                  onClick={() => onAddShelf ? onAddShelf(18) : onAdd12InchShelf()}
                  className={`p-2 rounded-xs border text-left cursor-pointer transition-all ${
                    isGraphPaper
                      ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-300 hover:border-black'
                      : 'bg-cyan-950/40 hover:bg-cyan-950/80 border-cyan-500/50 hover:border-cyan-400'
                  }`}
                  title="Add 18&quot; Inset Mid Shelf"
                >
                  <div className="flex items-center gap-1 font-mono font-bold text-xs mb-0.5">
                    <Layers className="w-3 h-3 text-cyan-600" />
                    <span>18&quot; Shelf</span>
                  </div>
                  <div className={`text-[9px] font-mono ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                    Depth: -18&quot;
                  </div>
                  <div className={`text-[9px] font-mono ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                    Inset: 1.5 ft
                  </div>
                </button>

                {/* 24" Shelf */}
                <button
                  id="btn-sidebar-shelf-24in"
                  onClick={() => onAddShelf ? onAddShelf(24) : onAdd12InchShelf()}
                  className={`p-2 rounded-xs border text-left cursor-pointer transition-all ${
                    isGraphPaper
                      ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-300 hover:border-black'
                      : 'bg-cyan-950/40 hover:bg-cyan-950/80 border-cyan-500/50 hover:border-cyan-400'
                  }`}
                  title="Add 24&quot; Inset Deep Shelf"
                >
                  <div className="flex items-center gap-1 font-mono font-bold text-xs mb-0.5">
                    <Layers className="w-3 h-3 text-cyan-700" />
                    <span>24&quot; Shelf</span>
                  </div>
                  <div className={`text-[9px] font-mono ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                    Depth: -24&quot;
                  </div>
                  <div className={`text-[9px] font-mono ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                    Inset: 2.0 ft
                  </div>
                </button>
              </div>
            </div>

            {/* Auto Coping Stones */}
            <div>
              <h3 className={`font-bold font-mono text-xs uppercase tracking-wide mb-1.5 ${isGraphPaper ? 'text-black' : 'text-cyan-300'}`}>
                Perimeter Auto-Coping
              </h3>
              <button
                id="btn-auto-coping"
                onClick={onAutoPerimeterRocks}
                className={`w-full py-2 px-3 rounded-xs font-mono font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                  isGraphPaper
                    ? 'bg-black hover:bg-neutral-800 text-white border-black shadow-xs'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Auto-Trace Coping Stones</span>
              </button>
              <p className={`text-[10px] mt-1 ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                Places realistically sized coping stones along the outer rim of your pond outline.
              </p>
            </div>

            {/* Material Selector */}
            <div>
              <label className={`block font-mono text-[10px] uppercase font-bold mb-1.5 ${isGraphPaper ? 'text-neutral-700' : 'text-slate-300'}`}>
                Rock Material &amp; Density
              </label>
              <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                {(
                  [
                    { id: 'slate', name: 'Charcoal Slate', density: '170 lbs/ft³' },
                    { id: 'bluestone', name: 'PA Bluestone', density: '165 lbs/ft³' },
                    { id: 'fieldstone', name: 'Moss Fieldstone', density: '160 lbs/ft³' },
                    { id: 'granite', name: 'Mountain Granite', density: '175 lbs/ft³' },
                  ] as const
                ).map((mat) => (
                  <button
                    key={mat.id}
                    onClick={() => setSelectedMaterial(mat.id)}
                    className={`py-1.5 px-2 text-left rounded-xs border transition-colors ${
                      selectedMaterial === mat.id
                        ? isGraphPaper
                          ? 'bg-neutral-200 border-black font-bold text-black'
                          : 'bg-cyan-900/60 border-cyan-400 text-cyan-200 font-bold'
                        : isGraphPaper
                        ? 'border-neutral-300 text-neutral-600 hover:border-neutral-400'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="truncate">{mat.name}</div>
                    <div className="text-[9px] opacity-75">{mat.density}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scaled Rock Elements List */}
            <div className="space-y-1.5">
              <label className={`block font-mono text-[10px] uppercase font-bold ${isGraphPaper ? 'text-neutral-700' : 'text-slate-300'}`}>
                Individual Stones (Click or Drag)
              </label>

              {ROCK_PRESETS.map((rock) => {
                const ftScale = (rock.sizeInches / 12).toFixed(1);
                return (
                  <div
                    key={rock.sizeInches}
                    id={`palette-rock-${rock.sizeInches}`}
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(e, 'rock', {
                        sizeInches: rock.sizeInches,
                        material: selectedMaterial,
                      })
                    }
                    onClick={() => onAddRock(rock.sizeInches, selectedMaterial)}
                    className={cardClass}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 flex items-center justify-center rounded-xs border ${
                        isGraphPaper ? 'bg-white border-neutral-300' : 'bg-slate-900 border-slate-700'
                      }`}>
                        <svg
                          width="26"
                          height="26"
                          viewBox="-16 -16 32 32"
                        >
                          <polygon
                            points="-11,-4 -6,-12 8,-10 13,-2 10,11 -5,12 -12,5"
                            fill={isGraphPaper ? '#ffffff' : '#1e3a5f'}
                            stroke={isGraphPaper ? '#000000' : '#38bdf8'}
                            strokeWidth="1.8"
                          />
                          <line x1="-6" y1="-3" x2="3" y2="4" stroke={isGraphPaper ? '#555555' : '#7dd3fc'} strokeWidth="1" />
                          <line x1="3" y1="4" x2="7" y2="-2" stroke={isGraphPaper ? '#555555' : '#7dd3fc'} strokeWidth="1" />
                        </svg>
                      </div>

                      <div>
                        <div className={cardTitleClass}>
                          {rock.label}
                        </div>
                        <div className={`text-[10px] font-mono ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                          Scale: {ftScale}&apos; ({rock.sizeInches}&quot;) • ~{rock.weightLbsEst} lbs
                        </div>
                      </div>
                    </div>

                    <button
                      className={`p-1 rounded-xs border transition-colors ${
                        isGraphPaper
                          ? 'bg-neutral-100 border-neutral-300 text-neutral-800 hover:bg-black hover:text-white hover:border-black'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-cyan-600 hover:text-white'
                      }`}
                      title="Add to canvas"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className={`p-2 rounded-xs border text-[11px] flex items-start gap-2 ${
              isGraphPaper
                ? 'bg-neutral-50 border-neutral-300 text-neutral-700'
                : 'bg-blue-950/30 border-blue-900/50 text-blue-300'
            }`}>
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-neutral-500" />
              <span>
                Flagstones render with natural irregular polygonal facets sized realistically on the 20&apos; × 20&apos; architectural grid.
              </span>
            </div>
          </div>
        )}

        {/* ================= TAB: EQUIPMENT ================= */}
        {activeTab === 'equipment' && (
          <div className="space-y-3">
            <div>
              <h3 className={`font-bold font-mono text-xs uppercase tracking-wide ${isGraphPaper ? 'text-black' : 'text-cyan-300'}`}>
                Plumbing &amp; Equipment
              </h3>
              <p className={`text-[11px] ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                Standard architectural MEP symbols for skimmers, spillways, drains, and pumps.
              </p>
            </div>

            <div className="space-y-2">
              {[
                {
                  type: 'skimmer',
                  name: 'Pond Skimmer Box',
                  desc: 'Houses submersible pump & mechanical leaf weir.',
                },
                {
                  type: 'waterfall_spillway',
                  name: '24" Waterfall Spillway Weir',
                  desc: 'Diffuser chamber cascading clean water return.',
                },
                {
                  type: 'bottom_drain',
                  name: '3" Aerated Bottom Drain',
                  desc: 'Draws settleable solids from deep basin.',
                },
                {
                  type: 'pump_vault',
                  name: 'External Pump Chamber',
                  desc: 'External flooded suction pump vault.',
                },
                {
                  type: 'aerator_diffuser',
                  name: 'Air Compressor Station',
                  desc: 'Diaphragm air pump feeding weighted diffuser disc.',
                },
              ].map((eq) => (
                <div
                  key={eq.type}
                  id={`palette-eq-${eq.type}`}
                  draggable
                  onDragStart={(e) =>
                    handleDragStart(e, 'equipment', { eqType: eq.type, label: eq.name })
                  }
                  onClick={() =>
                    onAddEquipment(
                      eq.type as
                        | 'skimmer'
                        | 'waterfall_spillway'
                        | 'bottom_drain'
                        | 'pump_vault'
                        | 'aerator_diffuser',
                      eq.name
                    )
                  }
                  className={cardClass}
                >
                  <div>
                    <div className={cardTitleClass}>
                      {eq.name}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isGraphPaper ? 'text-neutral-500' : 'text-slate-400'}`}>
                      {eq.desc}
                    </div>
                  </div>
                  <button className={`p-1 rounded-xs border transition-colors ${
                    isGraphPaper
                      ? 'bg-neutral-100 border-neutral-300 text-neutral-800 hover:bg-black hover:text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-cyan-600 hover:text-white'
                  }`}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
