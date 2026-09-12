import React, { useState, useMemo, useCallback } from 'react';
import { 
  PondProject, 
  ToolMode, 
  ThemeMode, 
  PipeType, 
  RockMaterial, 
  Point, 
  RockElement, 
  PondOutline, 
  BogFilterElement, 
  EquipmentElement 
} from './types';
import { BLANK_POND_PROJECT } from './data/sampleBlueprints';
import { calculateProjectBOM } from './utils/calculations';
import { distance, offsetPolygonInward } from './utils/geometry';
import { Toolbar } from './components/Toolbar';
import { SidebarPalette } from './components/SidebarPalette';
import { BlueprintCanvas } from './components/BlueprintCanvas';
import { CalculationsModal } from './components/CalculationsModal';

export default function App() {
  // Project State (starts as an empty canvas on 20' × 20' graph paper)
  const [project, setProject] = useState<PondProject>(BLANK_POND_PROJECT);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<PondProject[]>([BLANK_POND_PROJECT]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Tool & Canvas State
  const [currentMode, setCurrentMode] = useState<ToolMode>('select');
  const [activePipeType, setActivePipeType] = useState<PipeType>('flex_pvc_2');
  const [theme, setTheme] = useState<ThemeMode>('graph_paper');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showDepths, setShowDepths] = useState<boolean>(true);
  const [isCalculationsOpen, setIsCalculationsOpen] = useState<boolean>(false);

  // Update project with undo/redo history tracking
  const updateProjectWithHistory = useCallback((updater: (prev: PondProject) => PondProject) => {
    setProject((prev) => {
      const next = updater(prev);
      setHistory((oldHistory) => {
        const sliced = oldHistory.slice(0, historyIndex + 1);
        return [...sliced, next];
      });
      setHistoryIndex((prevIdx) => prevIdx + 1);
      return next;
    });
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setProject(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setProject(history[newIndex]);
    }
  };

  const handleClear = () => {
    if (confirm('Clear the entire blueprint canvas?')) {
      updateProjectWithHistory(() => BLANK_POND_PROJECT);
    }
  };

  // Real-time project BOM calculations
  const bom = useMemo(() => {
    return calculateProjectBOM(project.outlines, project.pipes, project.rocks, project.bogs);
  }, [project.outlines, project.pipes, project.rocks, project.bogs]);

  // Drop element handler
  const handleDropItem = (itemType: string, data: Record<string, unknown>, dropPoint: Point) => {
    if (itemType === 'rock') {
      const sizeInches = (data.sizeInches as number) || 18;
      const material = (data.material as RockMaterial) || 'slate';
      const newRock: RockElement = {
        id: `rock-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'rock',
        sizeInches,
        x: dropPoint.x,
        y: dropPoint.y,
        rotation: Math.floor(Math.random() * 360),
        shapeSeed: Math.floor(Math.random() * 10000),
        material,
      };
      updateProjectWithHistory((prev) => ({
        ...prev,
        rocks: [...prev.rocks, newRock],
      }));
    } else if (itemType === 'equipment') {
      const eqType = data.eqType as EquipmentElement['eqType'];
      const label = (data.label as string) || 'Equipment';
      const newEq: EquipmentElement = {
        id: `eq-${Date.now()}`,
        type: 'equipment',
        eqType,
        x: dropPoint.x,
        y: dropPoint.y,
        rotation: 0,
        label,
      };

      updateProjectWithHistory((prev) => ({
        ...prev,
        equipment: [...prev.equipment, newEq],
      }));
    }
  };

  // Add individual rock to center (20' × 20' grid center is 10, 10)
  const handleAddRock = (sizeInches: number, material: RockMaterial) => {
    handleDropItem('rock', { sizeInches, material }, { x: 10, y: 10 });
  };

  // Add inward offset shelf tracing pond perimeter (options for 12", 18", and 24")
  const handleAddShelf = (depthInches: 12 | 18 | 24 = 12) => {
    let perimeter = project.outlines.find((o) => o.type === 'perimeter');
    if (!perimeter && project.outlines.length > 0) {
      perimeter = project.outlines[0];
    }

    if (!perimeter || perimeter.points.length < 3) {
      alert('Please draw your pond outline first with the Outline tool, then choose a shelf option to trace it!');
      setCurrentMode('draw_outline');
      return;
    }

    const insetFeet = depthInches === 12 ? 1.0 : depthInches === 18 ? 1.5 : 2.0;
    const insetPoints = offsetPolygonInward(perimeter.points, insetFeet);
    const labelTitle = depthInches === 12 
      ? 'Marginal Shelf (-12", 12" Inset)'
      : depthInches === 18
      ? 'Mid Shelf (-18", 18" Inset)'
      : 'Deep Shelf (-24", 24" Inset)';

    const newShelf: PondOutline = {
      id: `shelf-inset-${depthInches}-${Date.now()}`,
      label: labelTitle,
      type: 'shelf',
      depthInches: -depthInches,
      closed: true,
      points: insetPoints,
      color: depthInches === 12 ? '#0284c7' : depthInches === 18 ? '#0369a1' : '#075985',
    };

    updateProjectWithHistory((prev) => ({
      ...prev,
      outlines: [...prev.outlines, newShelf],
    }));

    setCurrentMode('select');
  };

  const handleAdd12InchShelf = () => handleAddShelf(12);

  // Add equipment to center
  const handleAddEquipment = (
    eqType: 'skimmer' | 'waterfall_spillway' | 'bottom_drain' | 'pump_vault' | 'aerator_diffuser',
    label: string
  ) => {
    handleDropItem('equipment', { eqType, label }, { x: 10, y: 10 });
  };

  // Auto-ring the pond perimeter with alternating 18" and 24" irregular flagstones!
  const handleAutoPerimeterRocks = () => {
    const perimeterOutline = project.outlines.find((o) => o.closed && o.points.length >= 3);
    if (!perimeterOutline) {
      alert('Please draw or place a pond perimeter outline first!');
      return;
    }

    const pts = perimeterOutline.points;
    const newRocks: RockElement[] = [];
    const spacingFt = 1.6; // ~19 inches between rock centers for tight flagstone coping

    // Walk along polygon perimeter segments
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const segLen = distance(p1, p2);
      const steps = Math.max(1, Math.round(segLen / spacingFt));

      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const rx = p1.x + (p2.x - p1.x) * t;
        const ry = p1.y + (p2.y - p1.y) * t;
        const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;

        // Alternate between 18" coping flagstone and 24" large flagstone
        const sizeInches = (newRocks.length % 2 === 0) ? 24 : 18;
        const materials: RockMaterial[] = ['slate', 'bluestone', 'fieldstone'];
        const material = materials[newRocks.length % materials.length];

        newRocks.push({
          id: `rock-auto-${Date.now()}-${newRocks.length}`,
          type: 'rock',
          sizeInches,
          x: Number(rx.toFixed(2)),
          y: Number(ry.toFixed(2)),
          rotation: Math.round(angle + 90 + (Math.random() * 20 - 10)),
          shapeSeed: 1000 + newRocks.length * 17,
          material,
        });
      }
    }

    updateProjectWithHistory((prev) => ({
      ...prev,
      rocks: [...prev.rocks, ...newRocks],
    }));
  };

  const handleLoadProjectJson = (json: string) => {
    try {
      const parsed = JSON.parse(json) as PondProject;
      if (parsed.gridWidth && parsed.outlines) {
        updateProjectWithHistory(() => parsed);
      }
    } catch (e) {
      alert('Could not load blueprint JSON');
    }
  };

  const containerBg = 'bg-neutral-200 text-neutral-900';

  return (
    <div className={`flex flex-col w-screen h-screen overflow-hidden font-sans select-none ${containerBg}`}>
      {/* Top Application Toolbar */}
      <Toolbar
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        activePipeType={activePipeType}
        onSelectPipeType={setActivePipeType}
        theme={theme}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid((prev) => !prev)}
        showDimensions={showDimensions}
        onToggleDimensions={() => setShowDimensions((prev) => !prev)}
        showDepths={showDepths}
        onToggleDepths={() => setShowDepths((prev) => !prev)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onOpenCalculations={() => setIsCalculationsOpen(true)}
        onAddShelf={handleAddShelf}
        onAdd12InchShelf={handleAdd12InchShelf}
        summaryStats={{
          volumeGal: bom.estimatedVolumeGallons,
          pipeFt: bom.totalPipeFeet,
          rockCount: bom.totalRockCount,
          bogRatio: bom.bogToPondRatioPercent,
        }}
      />

      {/* Main Workspace (Left Drag-and-Drop Palette + Center 20x15 Blueprint Canvas) */}
      <div className="flex flex-1 w-full h-full overflow-hidden relative">
        <SidebarPalette
          theme={theme}
          onAddShelf={handleAddShelf}
          onAdd12InchShelf={handleAdd12InchShelf}
          onAddRock={handleAddRock}
          onAutoPerimeterRocks={handleAutoPerimeterRocks}
          onAddEquipment={handleAddEquipment}
        />

        <main className="flex-1 h-full relative overflow-hidden flex items-center justify-center">
          <BlueprintCanvas
            project={project}
            currentMode={currentMode}
            onSetMode={setCurrentMode}
            activePipeType={activePipeType}
            theme={theme}
            snapToGrid={snapToGrid}
            showDimensions={showDimensions}
            showDepths={showDepths}
            onUpdateProject={updateProjectWithHistory}
            onDropItem={handleDropItem}
            onAddShelf={handleAddShelf}
            onAdd12InchShelf={handleAdd12InchShelf}
          />
        </main>
      </div>

      {/* Calculations & Bill of Materials Modal */}
      <CalculationsModal
        isOpen={isCalculationsOpen}
        onClose={() => setIsCalculationsOpen(false)}
        bom={bom}
        project={project}
        theme={theme}
        onLoadProjectJson={handleLoadProjectJson}
      />
    </div>
  );
}
