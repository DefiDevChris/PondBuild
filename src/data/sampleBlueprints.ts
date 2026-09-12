import { PondProject } from '../types';

/**
 * Clean 20' × 20' architectural scale grid project.
 * All preset outlines, bogs, and shelves removed.
 */
export const BLANK_POND_PROJECT: PondProject = {
  title: "Custom Pond & Water Feature Design",
  designer: "Architectural Drafter",
  date: new Date().toISOString().split('T')[0],
  revision: "Rev 1.0",
  gridWidth: 20,
  gridHeight: 20,
  gridCellFeet: 1,
  outlines: [],
  rocks: [],
  bogs: [],
  equipment: [],
  pipes: [],
};
