import { PondOutline, PipeRun, RockElement, BogFilterElement } from '../types';
import { calculatePolygonArea, calculatePolylineLength, getBoundingBox } from './geometry';
import { PIPE_CONFIGS, ROCK_PRESETS } from './pipeConfig';

export interface PipeCalculationItem {
  pipeType: string;
  name: string;
  color: string;
  count: number;
  linearFeet2D: number;
  verticalRiseFeet: number;
  totalWithBufferFeet: number; // includes 10% safety buffer for trench dips and fittings
  recommendedRolls50ft: number;
  estimatedCost: number;
}

export interface RockCalculationItem {
  sizeInches: number;
  label: string;
  count: number;
  totalWeightLbs: number;
  weightTons: number;
  estCoverageLinearFeet: number;
}

export interface PondBOMSummary {
  surfaceAreaSqFt: number;
  perimeterFeet: number;
  maxDepthInches: number;
  estimatedVolumeGallons: number;
  linerSize: {
    widthFt: number;
    lengthFt: number;
    totalSqFt: number;
  };
  bogAreaSqFt: number;
  bogVolumeGallons: number;
  bogToPondRatioPercent: number;
  bogGravelTonsNeeded: number;
  pipeSummary: PipeCalculationItem[];
  totalPipeFeet: number;
  totalPipeCost: number;
  rockSummary: RockCalculationItem[];
  totalRockCount: number;
  totalRockWeightTons: number;
  copingCoveragePercent: number;
}

export function calculateProjectBOM(
  outlines: PondOutline[],
  pipes: PipeRun[],
  rocks: RockElement[],
  bogs: BogFilterElement[]
): PondBOMSummary {
  // 1. Find main perimeter outline
  const perimeterOutline = outlines.find((o) => o.type === 'perimeter' && o.closed && o.points.length >= 3)
    || outlines.find((o) => o.closed && o.points.length >= 3);

  let surfaceAreaSqFt = 0;
  let perimeterFeet = 0;
  let maxDepthInches = 36; // default 3 ft

  if (perimeterOutline) {
    surfaceAreaSqFt = calculatePolygonArea(perimeterOutline.points);
    perimeterFeet = calculatePolylineLength([...perimeterOutline.points, perimeterOutline.points[0]]);
    if (perimeterOutline.depthInches !== 0) {
      maxDepthInches = Math.abs(perimeterOutline.depthInches);
    }
  }

  // Check shelves for deeper depths
  const shelfOutlines = outlines.filter((o) => o.type === 'shelf');
  for (const s of shelfOutlines) {
    if (Math.abs(s.depthInches) > maxDepthInches) {
      maxDepthInches = Math.abs(s.depthInches);
    }
  }

  // Calculate volume with shelf depth averaging (assuming ~60% average depth due to stepped shelves)
  const avgDepthFeet = (maxDepthInches / 12) * 0.65;
  const estimatedVolumeGallons = Math.round(surfaceAreaSqFt * avgDepthFeet * 7.48052);

  // Liner dimensions: Length + 2*Depth + 4ft overlap, Width + 2*Depth + 4ft overlap
  let linerWidth = 0;
  let linerLength = 0;
  if (perimeterOutline && perimeterOutline.points.length > 0) {
    const bbox = getBoundingBox(perimeterOutline.points);
    const depthAdd = (maxDepthInches / 12) * 2 + 3.0; // 3ft safety overlap for rock anchor trench
    linerWidth = Math.ceil(bbox.width + depthAdd);
    linerLength = Math.ceil(bbox.height + depthAdd);
  } else {
    linerWidth = 20;
    linerLength = 25;
  }

  // 2. Bog Filter Calculations
  let bogAreaSqFt = 0;
  for (const bog of bogs) {
    bogAreaSqFt += bog.width * bog.height * 0.88; // adjust for rounded corners
  }
  const bogVolumeGallons = Math.round(bogAreaSqFt * (14 / 12) * 7.48 * 0.45); // 45% pore water space in gravel
  const bogToPondRatioPercent = surfaceAreaSqFt > 0 ? (bogAreaSqFt / surfaceAreaSqFt) * 100 : 0;
  // Gravel weight: ~1.4 tons per cubic yard (volume in cu.yd = area * 1.167 ft depth / 27)
  const bogGravelTonsNeeded = Number(((bogAreaSqFt * 1.167 / 27) * 1.35).toFixed(1));

  // 3. Pipe Run Calculations
  const pipeTypeMap = new Map<string, { count: number; length2D: number; vertRise: number }>();

  for (const pipe of pipes) {
    const p2d = calculatePolylineLength(pipe.points);
    const vRise = pipe.verticalRiseFt ?? 4.0; // default 4 ft for pond bottom to surface/waterfall

    const existing = pipeTypeMap.get(pipe.pipeType) || { count: 0, length2D: 0, vertRise: 0 };
    existing.count += 1;
    existing.length2D += p2d;
    existing.vertRise += vRise;
    pipeTypeMap.set(pipe.pipeType, existing);
  }

  const pipeSummary: PipeCalculationItem[] = [];
  let totalPipeFeet = 0;
  let totalPipeCost = 0;

  for (const [pType, data] of pipeTypeMap.entries()) {
    const cfg = PIPE_CONFIGS[pType as keyof typeof PIPE_CONFIGS];
    if (!cfg) continue;

    const rawTotal = data.length2D + data.vertRise;
    const withBuffer = Math.ceil(rawTotal * 1.12); // +12% safety buffer for elbows and trench contours
    const rolls50 = Math.ceil(withBuffer / 50);
    const estCost = Math.round(withBuffer * cfg.costPerFootEst);

    totalPipeFeet += withBuffer;
    totalPipeCost += estCost;

    pipeSummary.push({
      pipeType: pType,
      name: cfg.name,
      color: cfg.color,
      count: data.count,
      linearFeet2D: Number(data.length2D.toFixed(1)),
      verticalRiseFeet: Number(data.vertRise.toFixed(1)),
      totalWithBufferFeet: withBuffer,
      recommendedRolls50ft: rolls50,
      estimatedCost: estCost,
    });
  }

  // 4. Rock / Flagstone Calculations
  const rockSizeMap = new Map<number, number>();
  for (const rock of rocks) {
    const sz = rock.sizeInches;
    rockSizeMap.set(sz, (rockSizeMap.get(sz) || 0) + 1);
  }

  const rockSummary: RockCalculationItem[] = [];
  let totalRockCount = 0;
  let totalRockWeightLbs = 0;
  let totalLinearCopingFt = 0;

  for (const preset of ROCK_PRESETS) {
    const count = rockSizeMap.get(preset.sizeInches) || 0;
    if (count > 0) {
      const weightLbs = count * preset.weightLbsEst;
      const weightTons = Number((weightLbs / 2000).toFixed(2));
      const linearFt = Number((count * (preset.sizeInches / 12) * 0.9).toFixed(1));

      totalRockCount += count;
      totalRockWeightLbs += weightLbs;
      totalLinearCopingFt += linearFt;

      rockSummary.push({
        sizeInches: preset.sizeInches,
        label: preset.label,
        count,
        totalWeightLbs: weightLbs,
        weightTons,
        estCoverageLinearFeet: linearFt,
      });
    }
  }

  // Check custom sizes not in preset
  for (const [sz, count] of rockSizeMap.entries()) {
    if (!ROCK_PRESETS.some((p) => p.sizeInches === sz) && count > 0) {
      const estWeightPerUnit = Math.round(Math.pow(sz / 12, 2.5) * 45);
      const weightLbs = count * estWeightPerUnit;
      const weightTons = Number((weightLbs / 2000).toFixed(2));
      const linearFt = Number((count * (sz / 12) * 0.9).toFixed(1));

      totalRockCount += count;
      totalRockWeightLbs += weightLbs;
      totalLinearCopingFt += linearFt;

      rockSummary.push({
        sizeInches: sz,
        label: `${sz}" Custom Flagstone`,
        count,
        totalWeightLbs: weightLbs,
        weightTons,
        estCoverageLinearFeet: linearFt,
      });
    }
  }

  const totalRockWeightTons = Number((totalRockWeightLbs / 2000).toFixed(2));
  const copingCoveragePercent = perimeterFeet > 0 ? Math.min(100, Math.round((totalLinearCopingFt / perimeterFeet) * 100)) : 0;

  return {
    surfaceAreaSqFt: Math.round(surfaceAreaSqFt),
    perimeterFeet: Math.round(perimeterFeet),
    maxDepthInches,
    estimatedVolumeGallons,
    linerSize: {
      widthFt: linerWidth,
      lengthFt: linerLength,
      totalSqFt: linerWidth * linerLength,
    },
    bogAreaSqFt: Math.round(bogAreaSqFt),
    bogVolumeGallons,
    bogToPondRatioPercent: Number(bogToPondRatioPercent.toFixed(1)),
    bogGravelTonsNeeded,
    pipeSummary,
    totalPipeFeet,
    totalPipeCost,
    rockSummary,
    totalRockCount,
    totalRockWeightTons,
    copingCoveragePercent,
  };
}
