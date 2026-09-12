import { PipeType, PipeTypeConfig } from '../types';

export const PIPE_CONFIGS: Record<PipeType, PipeTypeConfig> = {
  flex_pvc_2: {
    id: 'flex_pvc_2',
    name: '2" Heavy Duty Flex PVC',
    diameterInches: 2.0,
    color: '#38bdf8', // Cyan blueprint accent
    description: 'High-flow flexible PVC pipe for main pump discharge to bog filter and waterfall',
    recommendedUse: 'Main circulation & waterfall feed (up to 4,500 GPH)',
    costPerFootEst: 3.25,
  },
  flex_pvc_1_5: {
    id: 'flex_pvc_1_5',
    name: '1.5" Flexible PVC',
    diameterInches: 1.5,
    color: '#06b6d4', // Teal/cyan
    description: 'Flexible PVC for secondary returns, stream feeds, or smaller pumps',
    recommendedUse: 'Secondary return jets & skimmer lines (up to 2,400 GPH)',
    costPerFootEst: 2.45,
  },
  rigid_pvc_2: {
    id: 'rigid_pvc_2',
    name: '2" Schedule 40 Rigid PVC',
    diameterInches: 2.0,
    color: '#a78bfa', // Purple / slate
    dashArray: '8,4',
    description: 'Buried rigid trench line with high structural rigidity',
    recommendedUse: 'Underground runs outside pond perimeter',
    costPerFootEst: 1.95,
  },
  bottom_drain_3: {
    id: 'bottom_drain_3',
    name: '3" Heavy Gravity Drain',
    diameterInches: 3.0,
    color: '#f59e0b', // Amber/gold
    dashArray: '12,4',
    description: 'Sub-liner bottom suction line feeding external filtration sieve or settlement tank',
    recommendedUse: 'Bottom drain to pre-filter suction line',
    costPerFootEst: 4.80,
  },
  kinkfree_1: {
    id: 'kinkfree_1',
    name: '1" Spiral Kink-Free Tubing',
    diameterInches: 1.0,
    color: '#10b981', // Emerald
    dashArray: '4,3',
    description: 'Ultra-flexible corrugated non-kinking pond hose',
    recommendedUse: 'Skimmer overflow, UV bypass, or small spitter fountains',
    costPerFootEst: 1.65,
  },
  aeration_3_8: {
    id: 'aeration_3_8',
    name: '3/8" Weighted Aeration Airline',
    diameterInches: 0.375,
    color: '#ec4899', // Pink
    dashArray: '3,3',
    description: 'Self-sinking heavy rubber tubing that stays at the bottom without floating',
    recommendedUse: 'Air compressor to deep basin membrane diffusers',
    costPerFootEst: 1.20,
  },
};

export interface RockPreset {
  sizeInches: number;
  label: string;
  category: 'accent' | 'stepping' | 'coping' | 'boulder';
  description: string;
  weightLbsEst: number;
}

export const ROCK_PRESETS: RockPreset[] = [
  {
    sizeInches: 12,
    label: '12" Flagstone',
    category: 'accent',
    description: 'Small irregular flagstone for shallow shelf edging & crevices',
    weightLbsEst: 25,
  },
  {
    sizeInches: 18,
    label: '18" Flagstone',
    category: 'coping',
    description: 'Medium irregular flagstone for pond perimeter coping overhang',
    weightLbsEst: 65,
  },
  {
    sizeInches: 24,
    label: '24" Flagstone',
    category: 'stepping',
    description: 'Large stepping flagstone or cantilevered shelf stone',
    weightLbsEst: 140,
  },
  {
    sizeInches: 30,
    label: '30" Large Slab',
    category: 'stepping',
    description: 'Heavy architectural flagstone slab for waterfall weir / walkway',
    weightLbsEst: 260,
  },
  {
    sizeInches: 36,
    label: '36" Anchor Boulder',
    category: 'boulder',
    description: 'Irregular anchor fieldstone for corner retention and bog divider',
    weightLbsEst: 450,
  },
];
