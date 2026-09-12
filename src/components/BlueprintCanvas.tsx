import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PondProject, 
  ToolMode, 
  PipeType, 
  ThemeMode, 
  Point, 
  RockElement, 
  PondOutline
} from '../types';
import { 
  snapPoint, 
  distance, 
  calculatePolygonArea, 
  calculatePolylineLength,
  autoSmoothClosedContour,
  autoSmoothShelfContour,
  autoSmoothOpenPolyline,
  pointsToSmoothSvgPath,
  moveSelectedVertices,
  findClosestEdgeInsertionIndex
} from '../utils/geometry';
import { PIPE_CONFIGS } from '../utils/pipeConfig';
import { PondOutlineView } from './PondOutlineView';
import { BogFilterView } from './BogFilterView';
import { EquipmentView } from './EquipmentView';
import { PipeHoseView } from './PipeHoseView';
import { FlagstoneRockView } from './FlagstoneRockView';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Trash2, 
  Check, 
  X,
  Layers
} from 'lucide-react';

interface BlueprintCanvasProps {
  project: PondProject;
  currentMode: ToolMode;
  onSetMode: (mode: ToolMode) => void;
  activePipeType: PipeType;
  theme: ThemeMode;
  snapToGrid: boolean;
  showDimensions: boolean;
  showDepths: boolean;
  onUpdateProject: (updater: (prev: PondProject) => PondProject) => void;
  onDropItem: (itemType: string, data: Record<string, unknown>, dropPoint: Point) => void;
  onAddShelf?: (depthInches: 12 | 18 | 24) => void;
  onAdd12InchShelf?: () => void;
}

interface MeasureLine {
  start: Point;
  end: Point;
}

export const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({
  project,
  currentMode,
  onSetMode,
  activePipeType,
  theme,
  snapToGrid,
  showDimensions,
  showDepths,
  onUpdateProject,
  onDropItem,
  onAddShelf,
  onAdd12InchShelf,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  // Cursor coordinates in grid feet
  const [cursorGrid, setCursorGrid] = useState<Point>({ x: 20, y: 15 });

  // Selection state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'rock' | 'bog' | 'equipment' | 'pipe' | 'outline' | null>(null);
  const [isDraggingElement, setIsDraggingElement] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });

  // Selected outline and localized vertex indices
  const [selectedOutlineId, setSelectedOutlineId] = useState<string | null>(null);
  const [selectedVertexIndices, setSelectedVertexIndices] = useState<number[]>([]);
  const [activeDragVertexIndex, setActiveDragVertexIndex] = useState<number | null>(null);

  // Dragging selected vertices
  const isDraggingVerticesRef = useRef<boolean>(false);
  const vertexDragStartPtRef = useRef<Point>({ x: 0, y: 0 });
  const originalPointsRef = useRef<Point[]>([]);
  const [isDraggingVertices, setIsDraggingVertices] = useState<boolean>(false);

  // Active drawing states
  const [activeDrawingPoints, setActiveDrawingPoints] = useState<Point[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const drawingPointsRef = useRef<Point[]>([]);
  const [activeMeasure, setActiveMeasure] = useState<MeasureLine | null>(null);

  const isGraphPaper = theme === 'graph_paper';
  const isDark = theme !== 'graph_paper';

  // Sort outlines: perimeter at base, then shallower to deeper shelves, with selected outline on top for direct grab handle access
  const sortedOutlines = useMemo(() => {
    return [...project.outlines].sort((a, b) => {
      if (a.id === selectedId) return 1;
      if (b.id === selectedId) return -1;
      if (a.type === 'perimeter' && b.type !== 'perimeter') return -1;
      if (b.type === 'perimeter' && a.type !== 'perimeter') return 1;
      return Math.abs(a.depthInches) - Math.abs(b.depthInches);
    });
  }, [project.outlines, selectedId]);

  // Screen to SVG Grid coordinates translation (20x20 scale)
  const screenToGridPoint = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const svgPoint = pt.matrixTransform(ctm.inverse());

      let finalPt: Point = {
        x: Math.max(0, Math.min(20, Number(svgPoint.x.toFixed(2)))),
        y: Math.max(0, Math.min(20, Number(svgPoint.y.toFixed(2)))),
      };

      if (snapToGrid) {
        finalPt = snapPoint(finalPt, 0.5); // snap to 6-inch / half-foot intervals
      }

      return finalPt;
    },
    [snapToGrid]
  );

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(3.5, Math.max(0.65, prev * zoomFactor)));
  };

  // Drag-and-drop from sidebar
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (!rawData) return;
      const parsed = JSON.parse(rawData);
      const dropPoint = screenToGridPoint(e.clientX, e.clientY);
      onDropItem(parsed.itemType, parsed, dropPoint);
    } catch (err) {
      console.error('Failed to parse dropped element', err);
    }
  };

  // Keyboard shortcuts (Delete, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // If specific outline vertices are selected, delete them (as long as >= 3 points remain)
        if (selectedOutlineId && selectedVertexIndices.length > 0) {
          const target = project.outlines.find((o) => o.id === selectedOutlineId);
          if (target && target.points.length - selectedVertexIndices.length >= 3) {
            const indicesSet = new Set(selectedVertexIndices);
            const newPoints = target.points.filter((_, idx) => !indicesSet.has(idx));
            onUpdateProject((prev) => ({
              ...prev,
              outlines: prev.outlines.map((o) =>
                o.id === selectedOutlineId ? { ...o, points: newPoints } : o
              ),
            }));
            setSelectedVertexIndices([]);
            originalPointsRef.current = [...newPoints];
            return;
          }
        }

        if (selectedId) {
          onUpdateProject((prev) => ({
            ...prev,
            rocks: prev.rocks.filter((r) => r.id !== selectedId),
            bogs: prev.bogs.filter((b) => b.id !== selectedId),
            equipment: prev.equipment.filter((eq) => eq.id !== selectedId),
            pipes: prev.pipes.filter((p) => p.id !== selectedId),
            outlines: prev.outlines.filter((o) => o.id !== selectedId),
          }));
          setSelectedId(null);
          setSelectedType(null);
        }
      } else if (e.key === 'Escape') {
        setActiveDrawingPoints([]);
        setActiveMeasure(null);
        setSelectedId(null);
        setSelectedType(null);
        setSelectedOutlineId(null);
        setSelectedVertexIndices([]);
        setActiveDragVertexIndex(null);
        onSetMode('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedOutlineId, selectedVertexIndices, onSetMode, onUpdateProject, project.outlines]);

  // Click on Canvas Background to Deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).id === 'grid-background') {
      if (currentMode === 'select' || currentMode === 'lasso') {
        setSelectedId(null);
        setSelectedType(null);
        setSelectedOutlineId(null);
        setSelectedVertexIndices([]);
      }
    }
  };

  // Mouse Up: auto-smooth and commit stroke if drawing, or finish lasso/vertex drag
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDraggingElement(false);

    // Commit vertex dragging
    if (isDraggingVerticesRef.current) {
      isDraggingVerticesRef.current = false;
      setIsDraggingVertices(false);
      setActiveDragVertexIndex(null);
      if (selectedOutlineId) {
        const target = project.outlines.find((o) => o.id === selectedOutlineId);
        if (target) {
          originalPointsRef.current = [...target.points];
        }
      }
    }

    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      const pts = drawingPointsRef.current;
      drawingPointsRef.current = [];
      setActiveDrawingPoints([]);

      // Auto-smooth and commit closed Outline or Shelf
      if (currentMode === 'draw_outline' || currentMode === 'draw_shelf') {
        if (pts.length >= 4) {
          const isPerimeter = currentMode === 'draw_outline';
          // Outline uses full resolution smoothing; Shelf uses reduced point density (~10-18 pts)
          const smoothed = isPerimeter ? autoSmoothClosedContour(pts) : autoSmoothShelfContour(pts);
          const newOutline: PondOutline = {
            id: `${isPerimeter ? 'outline' : 'shelf'}-${Date.now()}`,
            label: isPerimeter ? 'Water Rim (0")' : 'Pond Shelf (-18")',
            type: isPerimeter ? 'perimeter' : 'shelf',
            depthInches: isPerimeter ? 0 : -18,
            closed: true,
            points: smoothed,
            color: isPerimeter ? '#111827' : '#0369a1',
          };

          onUpdateProject((prev) => ({
            ...prev,
            outlines: [...prev.outlines, newOutline],
          }));

          // Automatically select the newly created outline so all points appear and can be adjusted immediately
          setSelectedId(newOutline.id);
          setSelectedType('outline');
          setSelectedOutlineId(newOutline.id);
          setSelectedVertexIndices([]);
          originalPointsRef.current = [...smoothed];
          onSetMode('select');
        }
      }
      // Auto-smooth and commit open Pipe polyline
      else if (currentMode === 'draw_pipe') {
        if (pts.length >= 2) {
          const smoothed = autoSmoothOpenPolyline(pts);
          const newPipe = {
            id: `pipe-${Date.now()}`,
            pipeType: activePipeType,
            points: smoothed,
            verticalRiseFt: 3.0,
            label: PIPE_CONFIGS[activePipeType].name,
          };

          onUpdateProject((prev) => ({
            ...prev,
            pipes: [...prev.pipes, newPipe],
          }));
        }
      }
    }
  }, [currentMode, activePipeType, onUpdateProject, selectedOutlineId, selectedId, project.outlines]);

  // Global window mouseup listener so dragging outside SVG finishes gracefully
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawingRef.current || isDraggingVerticesRef.current) {
        handleMouseUp();
      }
      setIsPanning(false);
      setIsDraggingElement(false);
      setIsDraggingVertices(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [handleMouseUp]);

  // Mouse Move on Canvas
  const handleMouseMove = (e: React.MouseEvent) => {
    const pt = screenToGridPoint(e.clientX, e.clientY);
    setCursorGrid(pt);

    // Pan drag
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    // Dragging selected vertices deformed in real-time
    if (isDraggingVerticesRef.current && selectedOutlineId) {
      const delta = {
        x: pt.x - vertexDragStartPtRef.current.x,
        y: pt.y - vertexDragStartPtRef.current.y,
      };
      const origPts = originalPointsRef.current;
      const deformedPts = moveSelectedVertices(origPts, selectedVertexIndices, delta, true);
      onUpdateProject((prev) => ({
        ...prev,
        outlines: prev.outlines.map((o) =>
          o.id === selectedOutlineId ? { ...o, points: deformedPts } : o
        ),
      }));
      return;
    }

    // Active click-and-hold freehand drawing
    if (isDrawingRef.current) {
      const pts = drawingPointsRef.current;
      const lastPt = pts[pts.length - 1];
      // Responsive high-resolution sampling (>= 0.10 ft) preserves every nuance of the drawn shape
      if (!lastPt || distance(lastPt, pt) >= 0.10) {
        const nextPts = [...pts, pt];
        drawingPointsRef.current = nextPts;
        setActiveDrawingPoints(nextPts);
      }
      return;
    }

    // Measure line update
    if (currentMode === 'measure' && activeMeasure) {
      setActiveMeasure((prev) => (prev ? { ...prev, end: pt } : null));
    }

    // Element Drag (moves non-outline elements)
    if (isDraggingElement && selectedId && selectedType !== 'outline') {
      const newX = Number((pt.x - dragOffset.x).toFixed(2));
      const newY = Number((pt.y - dragOffset.y).toFixed(2));

      onUpdateProject((prev) => {
        if (selectedType === 'rock') {
          return {
            ...prev,
            rocks: prev.rocks.map((r) =>
              r.id === selectedId ? { ...r, x: newX, y: newY } : r
            ),
          };
        } else if (selectedType === 'bog') {
          return {
            ...prev,
            bogs: prev.bogs.map((b) =>
              b.id === selectedId ? { ...b, x: newX, y: newY } : b
            ),
          };
        } else if (selectedType === 'equipment') {
          return {
            ...prev,
            equipment: prev.equipment.map((eq) =>
              eq.id === selectedId ? { ...eq, x: newX, y: newY } : eq
            ),
          };
        }
        return prev;
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click or Alt key for panning
    if (e.button === 1 || e.altKey || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Primary Left Click
    if (e.button === 0) {
      const pt = screenToGridPoint(e.clientX, e.clientY);

      // Check if clicking near any selected vertex to drag
      if (selectedOutlineId && selectedVertexIndices.length > 0) {
        const targetOutline = project.outlines.find((o) => o.id === selectedOutlineId);
        if (targetOutline) {
          const isNearSelected = selectedVertexIndices.some((idx) => {
            const v = targetOutline.points[idx];
            return v && distance(v, pt) <= 0.7;
          });
          if (isNearSelected) {
            isDraggingVerticesRef.current = true;
            vertexDragStartPtRef.current = pt;
            originalPointsRef.current = [...targetOutline.points];
            setIsDraggingVertices(true);
            return;
          }
        }
      }

      // Click and hold to draw
      if (currentMode === 'draw_outline' || currentMode === 'draw_shelf' || currentMode === 'draw_pipe') {
        isDrawingRef.current = true;
        drawingPointsRef.current = [pt];
        setActiveDrawingPoints([pt]);
        return;
      }

      // Measure tool
      if (currentMode === 'measure') {
        if (!activeMeasure) {
          setActiveMeasure({ start: pt, end: pt });
        } else {
          setActiveMeasure(null);
        }
      }
    }
  };

  // Element Selection
  const handleSelectElement = (
    id: string,
    type: 'rock' | 'bog' | 'equipment' | 'pipe' | 'outline',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (currentMode !== 'select') return;

    setSelectedId(id);
    setSelectedType(type);

    if (type === 'outline') {
      setSelectedOutlineId(id);
      if (selectedOutlineId !== id) {
        setSelectedVertexIndices([]);
      }
    } else {
      setSelectedOutlineId(null);
      setSelectedVertexIndices([]);
    }

    const pt = screenToGridPoint(e.clientX, e.clientY);

    // Calculate offset for smooth dragging
    if (type === 'rock') {
      const rock = project.rocks.find((r) => r.id === id);
      if (rock) {
        setDragOffset({ x: pt.x - rock.x, y: pt.y - rock.y });
        setIsDraggingElement(true);
      }
    } else if (type === 'bog') {
      const bog = project.bogs.find((b) => b.id === id);
      if (bog) {
        setDragOffset({ x: pt.x - bog.x, y: pt.y - bog.y });
        setIsDraggingElement(true);
      }
    } else if (type === 'equipment') {
      const eq = project.equipment.find((i) => i.id === id);
      if (eq) {
        setDragOffset({ x: pt.x - eq.x, y: pt.y - eq.y });
        setIsDraggingElement(true);
      }
    }
  };

  // Rotate selected element (rocks or bogs)
  const handleRotateSelected = () => {
    if (!selectedId) return;
    onUpdateProject((prev) => ({
      ...prev,
      rocks: prev.rocks.map((r) =>
        r.id === selectedId ? { ...r, rotation: (r.rotation + 45) % 360 } : r
      ),
      bogs: prev.bogs.map((b) =>
        b.id === selectedId ? { ...b, rotation: (b.rotation + 45) % 360 } : b
      ),
      equipment: prev.equipment.map((eq) =>
        eq.id === selectedId ? { ...eq, rotation: (eq.rotation + 45) % 360 } : eq
      ),
    }));
  };

  // Delete selected element
  const handleDeleteSelected = () => {
    if (!selectedId) return;
    onUpdateProject((prev) => ({
      ...prev,
      rocks: prev.rocks.filter((r) => r.id !== selectedId),
      bogs: prev.bogs.filter((b) => b.id !== selectedId),
      equipment: prev.equipment.filter((eq) => eq.id !== selectedId),
      pipes: prev.pipes.filter((p) => p.id !== selectedId),
      outlines: prev.outlines.filter((o) => o.id !== selectedId),
    }));
    setSelectedId(null);
    setSelectedType(null);
  };

  // Start dragging a specific vertex on an outline to adjust the shape
  const handleStartDragVertex = (outlineId: string, index: number, e: React.MouseEvent) => {
    const pt = screenToGridPoint(e.clientX, e.clientY);
    const outline = project.outlines.find((o) => o.id === outlineId);
    if (!outline) return;

    if (currentMode !== 'select') {
      onSetMode('select');
    }

    setSelectedId(outlineId);
    setSelectedType('outline');
    setSelectedOutlineId(outlineId);
    setSelectedVertexIndices([index]);
    setActiveDragVertexIndex(index);

    isDraggingVerticesRef.current = true;
    vertexDragStartPtRef.current = pt;
    originalPointsRef.current = [...outline.points];
    setIsDraggingVertices(true);
  };

  // Delete a specific vertex from an outline (requires at least 4 points to remain a valid polygon)
  const handleDeleteVertex = (outlineId: string, index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const outline = project.outlines.find((o) => o.id === outlineId);
    if (!outline || outline.points.length <= 3) return;

    const newPoints = outline.points.filter((_, i) => i !== index);
    onUpdateProject((prev) => ({
      ...prev,
      outlines: prev.outlines.map((o) =>
        o.id === outlineId ? { ...o, points: newPoints } : o
      ),
    }));
    setSelectedVertexIndices([]);
    originalPointsRef.current = [...newPoints];
  };

  // Insert a new vertex into an outline on double-click
  const handleDoubleClickEdge = (outlineId: string, _dummyPt: Point, e: React.MouseEvent) => {
    const pt = screenToGridPoint(e.clientX, e.clientY);
    const outline = project.outlines.find((o) => o.id === outlineId);
    if (!outline) return;

    const insertIdx = findClosestEdgeInsertionIndex(outline.points, pt);
    const newPoints = [...outline.points];
    newPoints.splice(insertIdx, 0, pt);

    onUpdateProject((prev) => ({
      ...prev,
      outlines: prev.outlines.map((o) =>
        o.id === outlineId ? { ...o, points: newPoints } : o
      ),
    }));

    setSelectedId(outlineId);
    setSelectedType('outline');
    setSelectedOutlineId(outlineId);
    setSelectedVertexIndices([insertIdx]);
    originalPointsRef.current = [...newPoints];
  };

  // Real-time length calculation for in-progress pipe
  const inProgressPipeLength = useMemo(() => {
    if (activeDrawingPoints.length < 1) return 0;
    const pts = [...activeDrawingPoints, cursorGrid];
    return calculatePolylineLength(pts);
  }, [activeDrawingPoints, cursorGrid]);

  // Real-time area calculation for in-progress outline
  const inProgressOutlineStats = useMemo(() => {
    if (activeDrawingPoints.length < 3) return { area: 0, perimeter: 0 };
    const pts = [...activeDrawingPoints, cursorGrid];
    return {
      area: Math.round(calculatePolygonArea(pts)),
      perimeter: Number(calculatePolylineLength([...pts, pts[0]]).toFixed(1)),
    };
  }, [activeDrawingPoints, cursorGrid]);

  return (
    <div
      ref={containerRef}
      id="canvas-container"
      className={`relative flex-1 w-full h-full overflow-hidden select-none flex items-center justify-center transition-colors ${
        isPanning
          ? 'cursor-grab active:cursor-grabbing'
          : isDraggingVertices
          ? 'cursor-grabbing'
          : currentMode === 'select'
          ? 'cursor-default'
          : 'cursor-crosshair'
      } ${
        isGraphPaper ? 'bg-neutral-200' : isDark ? 'bg-slate-950' : 'bg-neutral-100'
      }`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Selected Item Floating Toolbar */}
      {selectedId && currentMode === 'select' && (
        <div className={`absolute top-4 right-6 z-30 flex items-center gap-2 p-2 rounded-xs shadow-md border ${
          isGraphPaper
            ? 'bg-white border-black text-black'
            : 'bg-slate-900/95 border-cyan-500/60 text-cyan-300'
        }`}>
          <span className="text-[11px] font-mono font-bold uppercase px-1">
            {selectedType}: {selectedId.split('-')[0]}
          </span>

          {selectedType === 'outline' && (
            <>
              {/* Shelf options: 12", 18", 24" */}
              <div className="flex items-center gap-0.5 border-r border-neutral-300 dark:border-slate-700 pr-1.5">
                <span className={`text-[10px] font-mono font-bold px-1 flex items-center gap-1 ${
                  isGraphPaper ? 'text-neutral-700' : 'text-cyan-300'
                }`}>
                  <Layers className="w-3 h-3 text-cyan-500" />
                  <span>+ Shelf:</span>
                </span>
                <button
                  id="canvas-add-12in-shelf"
                  onClick={() => onAddShelf ? onAddShelf(12) : onAdd12InchShelf?.()}
                  className={`px-1.5 py-0.5 rounded-xs text-[11px] font-mono font-bold transition-colors border ${
                    isGraphPaper
                      ? 'bg-neutral-100 hover:bg-neutral-200 text-black border-neutral-300'
                      : 'bg-slate-800 hover:bg-cyan-600 text-white border-slate-700'
                  }`}
                  title="Add 12&quot; Inset Shelf"
                >
                  12&quot;
                </button>
                <button
                  id="canvas-add-18in-shelf"
                  onClick={() => onAddShelf ? onAddShelf(18) : onAdd12InchShelf?.()}
                  className={`px-1.5 py-0.5 rounded-xs text-[11px] font-mono font-bold transition-colors border ${
                    isGraphPaper
                      ? 'bg-neutral-100 hover:bg-neutral-200 text-black border-neutral-300'
                      : 'bg-slate-800 hover:bg-cyan-600 text-white border-slate-700'
                  }`}
                  title="Add 18&quot; Inset Shelf"
                >
                  18&quot;
                </button>
                <button
                  id="canvas-add-24in-shelf"
                  onClick={() => onAddShelf ? onAddShelf(24) : onAdd12InchShelf?.()}
                  className={`px-1.5 py-0.5 rounded-xs text-[11px] font-mono font-bold transition-colors border ${
                    isGraphPaper
                      ? 'bg-neutral-100 hover:bg-neutral-200 text-black border-neutral-300'
                      : 'bg-slate-800 hover:bg-cyan-600 text-white border-slate-700'
                  }`}
                  title="Add 24&quot; Inset Shelf"
                >
                  24&quot;
                </button>
              </div>

              {/* If selected outline is a shelf, offer quick depth switching */}
              {project.outlines.find((o) => o.id === selectedOutlineId)?.type === 'shelf' && (
                <div className="flex items-center gap-0.5 border-r border-neutral-300 dark:border-slate-700 pr-1.5">
                  <span className={`text-[10px] font-mono font-bold px-1 ${
                    isGraphPaper ? 'text-neutral-700' : 'text-cyan-300'
                  }`}>
                    Depth:
                  </span>
                  {([12, 18, 24] as const).map((d) => {
                    const curr = project.outlines.find((o) => o.id === selectedOutlineId);
                    const isCurrentDepth = curr && Math.abs(curr.depthInches) === d;
                    return (
                      <button
                        key={`depth-opt-${d}`}
                        onClick={() => {
                          onUpdateProject((prev) => ({
                            ...prev,
                            outlines: prev.outlines.map((o) =>
                              o.id === selectedOutlineId
                                ? {
                                    ...o,
                                    depthInches: -d,
                                    label: `${d}" Shelf (-${d}")`,
                                    color: d === 12 ? '#0284c7' : d === 18 ? '#0369a1' : '#075985',
                                  }
                                : o
                            ),
                          }));
                        }}
                        className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-bold border transition-colors ${
                          isCurrentDepth
                            ? isGraphPaper
                              ? 'bg-black text-white border-black'
                              : 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : isGraphPaper
                            ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title={`Set shelf depth to -${d}&quot;`}
                      >
                        -{d}&quot;
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedVertexIndices.length === 1 && (
                <div className="flex items-center gap-1.5 pl-1 border-l border-neutral-300">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs font-bold border ${
                    isGraphPaper
                      ? 'bg-neutral-100 border-neutral-400 text-black'
                      : 'bg-cyan-950 border-cyan-400 text-cyan-300'
                  }`}>
                    Point #{selectedVertexIndices[0] + 1}
                  </span>
                  <button
                    onClick={() => handleDeleteVertex(selectedOutlineId!, selectedVertexIndices[0])}
                    className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono border ${
                      isGraphPaper
                        ? 'bg-neutral-100 hover:bg-red-50 text-red-700 border-neutral-300 hover:border-red-300'
                        : 'bg-slate-800 hover:bg-red-950 text-red-400 border-slate-700 hover:border-red-600'
                    }`}
                    title="Remove this point (or press Delete)"
                  >
                    Delete Point
                  </button>
                  <button
                    onClick={() => setSelectedVertexIndices([])}
                    className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono border ${
                      isGraphPaper
                        ? 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800 border-neutral-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'
                    }`}
                    title="Deselect point"
                  >
                    Deselect
                  </button>
                </div>
              )}

              {selectedVertexIndices.length > 1 && (
                <div className="flex items-center gap-1 pl-1 border-l border-neutral-300">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs border font-bold ${
                    isGraphPaper
                      ? 'bg-neutral-100 border-neutral-400 text-black'
                      : 'bg-cyan-950 border-cyan-400 text-cyan-300'
                  }`}>
                    {selectedVertexIndices.length} pts selected
                  </span>
                  <button
                    onClick={() => {
                      const target = project.outlines.find((o) => o.id === selectedOutlineId);
                      if (target && target.points.length - selectedVertexIndices.length >= 3) {
                        const indicesSet = new Set(selectedVertexIndices);
                        const newPoints = target.points.filter((_, idx) => !indicesSet.has(idx));
                        onUpdateProject((prev) => ({
                          ...prev,
                          outlines: prev.outlines.map((o) =>
                            o.id === selectedOutlineId ? { ...o, points: newPoints } : o
                          ),
                        }));
                        setSelectedVertexIndices([]);
                        originalPointsRef.current = [...newPoints];
                      }
                    }}
                    className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono border ${
                      isGraphPaper
                        ? 'bg-neutral-100 hover:bg-red-50 text-red-700 border-neutral-300 hover:border-red-300'
                        : 'bg-slate-800 hover:bg-red-950 text-red-400 border-slate-700 hover:border-red-600'
                    }`}
                    title="Delete all selected points"
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedVertexIndices([])}
                    className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono border ${
                      isGraphPaper
                        ? 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800 border-neutral-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'
                    }`}
                    title="Clear selected vertices"
                  >
                    Clear
                  </button>
                </div>
              )}

              {selectedVertexIndices.length === 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs hidden sm:inline-block ${
                  isGraphPaper ? 'text-neutral-500' : 'text-slate-400'
                }`}>
                  Click &amp; drag points to adjust
                </span>
              )}
            </>
          )}

          {(selectedType === 'rock' || selectedType === 'bog' || selectedType === 'equipment') && (
            <button
              onClick={handleRotateSelected}
              className={`px-2 py-1 rounded-xs text-xs font-mono flex items-center gap-1 transition-colors border ${
                isGraphPaper
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-black border-neutral-300'
                  : 'bg-slate-800 hover:bg-cyan-600 text-white border-slate-700'
              }`}
              title="Rotate 45°"
            >
              <span>Rotate 45°</span>
            </button>
          )}

          <button
            onClick={handleDeleteSelected}
            className={`p-1 rounded-xs text-xs transition-colors border ${
              isGraphPaper
                ? 'bg-neutral-100 hover:bg-red-600 hover:text-white text-red-600 border-neutral-300'
                : 'bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border-rose-500/30'
            }`}
            title="Delete Selected Item (Del)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main SVG Blueprint Canvas (20x20 Grid with 2-foot ruler margins) */}
      <svg
        ref={svgRef}
        id="blueprint-svg"
        viewBox="-2 -2 24 24"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.05s ease-out',
        }}
        className="w-full h-full max-h-screen drop-shadow-xl"
        onClick={handleCanvasClick}
      >
        <defs>
          {/* 1. Minor 1-Foot Grid Cell Pattern */}
          <pattern
            id="grid-1ft"
            width="1"
            height="1"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="1"
              height="1"
              fill="none"
              stroke={
                isGraphPaper
                  ? 'rgba(0, 0, 0, 0.15)'
                  : theme === 'blueprint'
                  ? 'rgba(56, 189, 248, 0.12)'
                  : 'rgba(71, 85, 105, 0.18)'
              }
              strokeWidth="0.015"
            />
            {/* Fine 3-inch tick marks at corners for technical graph paper */}
            <circle
              cx="0"
              cy="0"
              r="0.02"
              fill={isGraphPaper ? '#000000' : theme === 'blueprint' ? '#38bdf8' : '#64748b'}
              opacity={isGraphPaper ? 0.35 : 0.3}
            />
          </pattern>

          {/* 2. Major 5-Foot Architectural Grid Lines */}
          <pattern
            id="grid-5ft"
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
          >
            <rect width="5" height="5" fill="url(#grid-1ft)" />
            <rect
              width="5"
              height="5"
              fill="none"
              stroke={
                isGraphPaper
                  ? 'rgba(0, 0, 0, 0.45)'
                  : theme === 'blueprint'
                  ? 'rgba(56, 189, 248, 0.35)'
                  : 'rgba(148, 163, 184, 0.35)'
              }
              strokeWidth="0.035"
            />
          </pattern>
        </defs>

        {/* Blueprint Sheet Background (20x20 Field) */}
        <rect
          id="grid-background"
          x="0"
          y="0"
          width="20"
          height="20"
          fill={
            isGraphPaper
              ? '#ffffff' // Pure crisp white graph paper
              : theme === 'blueprint'
              ? '#0b1d33' // Blueprint navy
              : '#090d16' // Dark CAD
          }
          className="transition-colors duration-200"
        />

        {/* The 20x20 Grid Lines Layer */}
        <rect
          x="0"
          y="0"
          width="20"
          height="20"
          fill="url(#grid-5ft)"
          pointerEvents="none"
        />

        {/* Outer Site Perimeter Boundary Box (20' × 20') */}
        <rect
          x="0"
          y="0"
          width="20"
          height="20"
          fill="none"
          stroke={isGraphPaper ? '#000000' : theme === 'blueprint' ? '#38bdf8' : '#64748b'}
          strokeWidth="0.10"
          pointerEvents="none"
        />

        {/* Top X-Axis Ruler (0' to 20' in 1-ft ticks and 5-ft labels) */}
        {Array.from({ length: 21 }).map((_, i) => (
          <g key={`x-${i}`} pointerEvents="none">
            <line
              x1={i}
              y1={i % 5 === 0 ? "-0.5" : "-0.3"}
              x2={i}
              y2="0"
              stroke={isGraphPaper ? '#000000' : isDark ? '#38bdf8' : '#0f172a'}
              strokeWidth={i % 5 === 0 ? '0.04' : '0.02'}
            />
            {i % 5 === 0 && (
              <text
                x={i}
                y="-0.7"
                textAnchor="middle"
                fill={isGraphPaper ? '#000000' : isDark ? '#bae6fd' : '#1e293b'}
                fontSize="0.4"
                fontWeight="bold"
                fontFamily="'Chivo Mono', monospace"
              >
                {i}&apos;
              </text>
            )}
          </g>
        ))}

        {/* Left Y-Axis Ruler (0' to 20' in 1-ft ticks and 5-ft labels) */}
        {Array.from({ length: 21 }).map((_, j) => (
          <g key={`y-${j}`} pointerEvents="none">
            <line
              x1={j % 5 === 0 ? "-0.5" : "-0.3"}
              y1={j}
              x2="0"
              y2={j}
              stroke={isGraphPaper ? '#000000' : isDark ? '#38bdf8' : '#0f172a'}
              strokeWidth={j % 5 === 0 ? '0.04' : '0.02'}
            />
            {j % 5 === 0 && (
              <text
                x="-0.75"
                y={j + 0.14}
                textAnchor="end"
                fill={isGraphPaper ? '#000000' : isDark ? '#bae6fd' : '#1e293b'}
                fontSize="0.4"
                fontWeight="bold"
                fontFamily="'Chivo Mono', monospace"
              >
                {j}&apos;
              </text>
            )}
          </g>
        ))}

        {/* ================= LAYER 1: POND OUTLINES & SHELVES ================= */}
        {sortedOutlines.map((outline) => (
          <PondOutlineView
            key={outline.id}
            outline={outline}
            isSelected={selectedId === outline.id}
            selectedVertexIndices={selectedOutlineId === outline.id ? selectedVertexIndices : []}
            activeDragVertexIndex={selectedOutlineId === outline.id ? activeDragVertexIndex : null}
            theme={theme}
            showDepths={showDepths}
            onSelect={(id, e) => handleSelectElement(id, 'outline', e)}
            onStartDragVertex={handleStartDragVertex}
            onDeleteVertex={handleDeleteVertex}
            onDoubleClickEdge={handleDoubleClickEdge}
          />
        ))}

        {/* ================= LAYER 2: FILTRATION BOGS ================= */}
        {project.bogs.map((bog) => (
          <BogFilterView
            key={bog.id}
            bog={bog}
            isSelected={selectedId === bog.id}
            theme={theme}
            onSelect={(id, e) => handleSelectElement(id, 'bog', e)}
          />
        ))}

        {/* ================= LAYER 3: EQUIPMENT ================= */}
        {project.equipment.map((eq) => (
          <EquipmentView
            key={eq.id}
            eq={eq}
            isSelected={selectedId === eq.id}
            theme={theme}
            onSelect={(id, e) => handleSelectElement(id, 'equipment', e)}
          />
        ))}

        {/* ================= LAYER 4: PIPES & HOSES ================= */}
        {project.pipes.map((pipe) => (
          <PipeHoseView
            key={pipe.id}
            pipe={pipe}
            isSelected={selectedId === pipe.id}
            theme={theme}
            showLabels={showDimensions}
            onSelect={(id, e) => handleSelectElement(id, 'pipe', e)}
          />
        ))}

        {/* ================= LAYER 5: AUTO-SCALED FLAGSTONE ROCKS ================= */}
        {project.rocks.map((rock) => (
          <FlagstoneRockView
            key={rock.id}
            rock={rock}
            isSelected={selectedId === rock.id}
            theme={theme}
            showDimensions={showDimensions}
            onSelect={(id, e) => handleSelectElement(id, 'rock', e)}
          />
        ))}

        {/* ================= LAYER 6: IN-PROGRESS DRAWING PREVIEWS ================= */}
        {/* In-progress Outline / Shelf freehand smooth stroke */}
        {(currentMode === 'draw_outline' || currentMode === 'draw_shelf') && activeDrawingPoints.length > 0 && (
          <g pointerEvents="none">
            {/* Smooth live stroke */}
            <path
              d={pointsToSmoothSvgPath(activeDrawingPoints, false)}
              fill="none"
              stroke={isGraphPaper ? '#000000' : '#38bdf8'}
              strokeWidth="0.08"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Start anchor point dot */}
            <circle
              cx={activeDrawingPoints[0].x}
              cy={activeDrawingPoints[0].y}
              r="0.16"
              fill={isGraphPaper ? '#000000' : '#38bdf8'}
              stroke="#ffffff"
              strokeWidth="0.03"
            />
            {/* Live closing contour guide */}
            {activeDrawingPoints.length >= 3 && (
              <line
                x1={activeDrawingPoints[activeDrawingPoints.length - 1].x}
                y1={activeDrawingPoints[activeDrawingPoints.length - 1].y}
                x2={activeDrawingPoints[0].x}
                y2={activeDrawingPoints[0].y}
                stroke={isGraphPaper ? 'rgba(0,0,0,0.3)' : 'rgba(56, 189, 248, 0.4)'}
                strokeWidth="0.03"
                strokeDasharray="0.15,0.1"
              />
            )}
          </g>
        )}

        {/* In-progress Pipe / Hose freehand smooth line with live length tag */}
        {currentMode === 'draw_pipe' && activeDrawingPoints.length > 0 && (
          <g pointerEvents="none">
            <path
              d={pointsToSmoothSvgPath(activeDrawingPoints, false)}
              fill="none"
              stroke={isGraphPaper ? '#000000' : PIPE_CONFIGS[activePipeType].color}
              strokeWidth="0.09"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="0.25,0.12"
            />
            <circle
              cx={activeDrawingPoints[0].x}
              cy={activeDrawingPoints[0].y}
              r="0.16"
              fill={isGraphPaper ? '#000000' : PIPE_CONFIGS[activePipeType].color}
              stroke="#ffffff"
              strokeWidth="0.03"
            />
            {/* Real-time Length Badge next to cursor */}
            <g transform={`translate(${cursorGrid.x + 0.8}, ${cursorGrid.y - 0.6})`}>
              <rect
                x="-0.2"
                y="-0.3"
                width="3.8"
                height="0.6"
                rx="0.04"
                fill={isGraphPaper ? '#ffffff' : '#091524'}
                stroke={isGraphPaper ? '#000000' : '#38bdf8'}
                strokeWidth="0.03"
              />
              <text
                x="1.7"
                y="0.06"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isGraphPaper ? '#000000' : '#38bdf8'}
                fontSize="0.25"
                fontWeight="bold"
                fontFamily="'Chivo Mono', monospace"
              >
                Pipe: {inProgressPipeLength.toFixed(1)}&apos;
              </text>
            </g>
          </g>
        )}

        {/* In-progress Tape Measurement Line */}
        {currentMode === 'measure' && activeMeasure && (
          <g pointerEvents="none">
            <line
              x1={activeMeasure.start.x}
              y1={activeMeasure.start.y}
              x2={activeMeasure.end.x}
              y2={activeMeasure.end.y}
              stroke={isGraphPaper ? '#000000' : '#fbbf24'}
              strokeWidth="0.06"
              strokeDasharray="0.15,0.1"
            />
            <circle cx={activeMeasure.start.x} cy={activeMeasure.start.y} r="0.14" fill={isGraphPaper ? '#000000' : '#fbbf24'} />
            <circle cx={activeMeasure.end.x} cy={activeMeasure.end.y} r="0.14" fill={isGraphPaper ? '#000000' : '#fbbf24'} />
            {/* Distance Text Tag */}
            <g transform={`translate(${(activeMeasure.start.x + activeMeasure.end.x) / 2}, ${(activeMeasure.start.y + activeMeasure.end.y) / 2 - 0.4})`}>
              <rect
                x="-1.5"
                y="-0.28"
                width="3.0"
                height="0.56"
                rx="0.04"
                fill={isGraphPaper ? '#ffffff' : '#1e293b'}
                stroke={isGraphPaper ? '#000000' : '#fbbf24'}
                strokeWidth="0.03"
              />
              <text
                x="0"
                y="0.05"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isGraphPaper ? '#000000' : '#fbbf24'}
                fontSize="0.24"
                fontWeight="bold"
                fontFamily="'Chivo Mono', monospace"
              >
                {distance(activeMeasure.start, activeMeasure.end).toFixed(2)} FT
              </text>
            </g>
          </g>
        )}

        {/* Point adjustment drag indicator badge */}
        {selectedOutlineId && selectedVertexIndices.length > 0 && (() => {
          const target = project.outlines.find((o) => o.id === selectedOutlineId);
          if (!target) return null;
          const firstIdx = selectedVertexIndices[0];
          const anchor = target.points[firstIdx];
          if (!anchor) return null;
          const label = selectedVertexIndices.length === 1 
            ? `POINT #${firstIdx + 1} (DRAG TO ADJUST)` 
            : `DRAG SELECTED POINTS (${selectedVertexIndices.length} PTS)`;
          return (
            <g transform={`translate(${anchor.x}, ${anchor.y - 0.7})`} pointerEvents="none">
              <rect
                x="-2.4"
                y="-0.28"
                width="4.8"
                height="0.56"
                rx="0.06"
                fill={isGraphPaper ? '#ffffff' : '#0f172a'}
                stroke={isGraphPaper ? '#000000' : '#f59e0b'}
                strokeWidth="0.03"
              />
              <text
                x="0"
                y="0.05"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isGraphPaper ? '#000000' : '#fbbf24'}
                fontSize="0.21"
                fontWeight="bold"
                fontFamily="'Chivo Mono', monospace"
              >
                {label}
              </text>
            </g>
          );
        })()}

        {/* Active Cursor Crosshairs */}
        <g pointerEvents="none" opacity="0.45">
          <line
            x1={cursorGrid.x}
            y1="0"
            x2={cursorGrid.x}
            y2="20"
            stroke={isGraphPaper ? '#000000' : '#38bdf8'}
            strokeWidth="0.015"
            strokeDasharray="0.2,0.2"
          />
          <line
            x1="0"
            y1={cursorGrid.y}
            x2="20"
            y2={cursorGrid.y}
            stroke={isGraphPaper ? '#000000' : '#38bdf8'}
            strokeWidth="0.015"
            strokeDasharray="0.2,0.2"
          />
        </g>
      </svg>

      {/* Overlay: Zoom & Pan Controls (Bottom Left) */}
      <div className={`absolute bottom-4 left-4 z-20 flex items-center gap-1 p-1 rounded-xs shadow-md border ${
        isGraphPaper
          ? 'bg-white border-neutral-300 text-black'
          : 'bg-slate-900/90 border-slate-800 text-slate-300'
      }`}>
        <button
          onClick={() => setZoom((prev) => Math.min(3.5, prev * 1.2))}
          className={`p-1.5 rounded-xs transition-colors ${
            isGraphPaper ? 'hover:bg-neutral-100 text-black' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((prev) => Math.max(0.65, prev / 1.2))}
          className={`p-1.5 rounded-xs transition-colors ${
            isGraphPaper ? 'hover:bg-neutral-100 text-black' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className={`p-1.5 rounded-xs transition-colors ${
            isGraphPaper ? 'hover:bg-neutral-100 text-black' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Reset Zoom & Pan (Fit 20x20)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <span className={`px-1.5 text-[10px] font-mono font-bold ${isGraphPaper ? 'text-black' : 'text-cyan-400'}`}>
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Overlay: Live Cursor Coordinates HUD (Bottom Center) */}
      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-xs text-[11px] font-mono shadow-xs pointer-events-none flex items-center gap-2 border ${
        isGraphPaper
          ? 'bg-white border-neutral-300 text-black'
          : 'bg-slate-950/85 border-slate-800 text-slate-300'
      }`}>
        <span className="font-bold">X: {cursorGrid.x.toFixed(1)}&apos;</span>
        <span className="text-neutral-400">|</span>
        <span className="font-bold">Y: {cursorGrid.y.toFixed(1)}&apos;</span>
        <span className="text-neutral-400">|</span>
        <span className={isGraphPaper ? 'text-neutral-600' : 'text-slate-400'}>Scale: 1 Sq = 1.0 Ft</span>
      </div>
    </div>
  );
};
