export type UnitSystem = 'imperial' | 'metric';

export type ThemeMode = 'graph_paper' | 'blueprint' | 'dark_cad';

export interface Point {
  x: number; // in grid units (feet)
  y: number; // in grid units (feet)
}

export type ToolMode = 
  | 'select'
  | 'draw_outline'
  | 'draw_shelf'
  | 'draw_pipe'
  | 'place_rock'
  | 'place_bog'
  | 'place_equipment'
  | 'measure';

export type ShelfDepth = 'shallow' | 'mid' | 'deep'; // shallow: 10"-12", mid: 18"-24", deep: 36"-48"

export interface PondOutline {
  id: string;
  points: Point[];
  closed: boolean;
  type: 'perimeter' | 'shelf';
  depthInches: number; // e.g. 0 for pond rim, -12 for shallow shelf, -24 for mid, -48 for deep
  label: string;
  color?: string;
  fillOpacity?: number;
}

export type RockMaterial = 'slate' | 'bluestone' | 'fieldstone' | 'limestone';

export interface RockElement {
  id: string;
  type: 'rock';
  sizeInches: number; // e.g., 12, 18, 24, 30, 36
  x: number; // in feet (grid units)
  y: number; // in feet (grid units)
  rotation: number; // degrees 0-360
  shapeSeed: number; // controls procedural irregular flagstone vertices
  material: RockMaterial;
  layer?: 'rim' | 'shelf' | 'waterfall' | 'stepping';
  polygon?: Point[]; // cached local vertices in feet
}

export interface BogFilterElement {
  id: string;
  type: 'bog';
  x: number;
  y: number;
  width: number; // in feet
  height: number; // in feet
  depthInches: number; // typically 12" to 18" gravel bed
  rotation: number;
  shape: 'rect' | 'oval' | 'kidney';
  hasSnorkel: boolean; // intake snorkel/centipede pipe
  plantDensity: 'light' | 'moderate' | 'dense';
  label: string;
}

export type EquipmentType = 
  | 'skimmer' 
  | 'pump_vault' 
  | 'waterfall_spillway' 
  | 'bottom_drain' 
  | 'aerator_diffuser' 
  | 'uv_clarifier';

export interface EquipmentElement {
  id: string;
  type: 'equipment';
  eqType: EquipmentType;
  x: number;
  y: number;
  rotation: number;
  label: string;
  flowRateGph?: number;
}

export type PipeType = 
  | 'flex_pvc_2' 
  | 'flex_pvc_1_5' 
  | 'rigid_pvc_2' 
  | 'bottom_drain_3' 
  | 'kinkfree_1' 
  | 'aeration_3_8';

export interface PipeTypeConfig {
  id: PipeType;
  name: string;
  diameterInches: number;
  color: string;
  dashArray?: string;
  description: string;
  recommendedUse: string;
  costPerFootEst: number;
}

export interface PipeRun {
  id: string;
  label: string;
  pipeType: PipeType;
  points: Point[];
  flowDirection?: 'forward' | 'reverse' | 'bidirectional';
  verticalRiseFt?: number; // e.g. 4ft pond depth + 2ft waterfall rise = 6ft extra
  notes?: string;
}

export interface MeasureLine {
  start: Point;
  end: Point;
}

export interface PondProject {
  title: string;
  designer: string;
  date: string;
  revision: string;
  gridWidth: number; // 20
  gridHeight: number; // 20
  gridCellFeet: number; // 1 (1 grid = 1 foot)
  outlines: PondOutline[];
  rocks: RockElement[];
  bogs: BogFilterElement[];
  equipment: EquipmentElement[];
  pipes: PipeRun[];
}
