import type { LevelConfig } from './types';
import bedroom from './bedroom';
import office from './office';
import kitchen from './kitchen';
import stairwell from './stairwell';

/**
 * Level registry. To add a room: create src/levels/<room>.tsx exporting
 * a LevelConfig, then register it here — no engine changes required.
 */
export const LEVELS: Record<string, LevelConfig> = {
  [bedroom.id]: bedroom,
  [office.id]: office,
  [kitchen.id]: kitchen,
  [stairwell.id]: stairwell,
};

export const FIRST_LEVEL = bedroom.id;
