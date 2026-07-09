import type { ComponentType } from 'react';
import type { GameState } from '../store/gameStore';
import type { Interaction } from '../engine/puzzles';

/** A single object/hotspot inside a room. */
export type RoomObjectConfig = {
  id: string;
  name: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  interactable: boolean;
  /** Declarative puzzle interaction (see engine/puzzles.ts). */
  interaction?: Interaction;
  /** Shared gate: interaction only runs while this returns true. */
  requires?: (state: GameState) => boolean;
  /** Toast shown when the requires gate fails (deny sound is automatic). */
  failText?: string;
  /** When provided, the object only renders while this returns true. */
  visible?: (state: GameState) => boolean;
};

/** How a level is completed and where it leads. */
export type UnlockConfig = {
  /** Item ids that must all be in the inventory. */
  requiredItems: string[];
  /** Level id to advance to. */
  nextLevel: string;
  title: string;
  text: string;
  buttonLabel: string;
};

/** A room/level definition. Add new rooms by creating one of these. */
export type LevelConfig = {
  id: string;
  name: string;
  /** The R3F component rendering the room's contents. */
  Scene: ComponentType;
  /** Exit condition + destination. Omit for levels with no exit yet. */
  unlock?: UnlockConfig;
  /** Whether the lamp/time-of-day lighting panel applies to this level. */
  lightingPanel?: boolean;
  /** Centered DOM overlay label (used by placeholder levels). */
  placeholderLabel?: string;
};
