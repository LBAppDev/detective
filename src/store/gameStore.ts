import { create } from 'zustand';
import type { ModalSpec } from '../engine/puzzles';

/** Flags can hold booleans, numbers, or strings (dial positions, codes...). */
export type FlagValue = boolean | number | string;

/** Clue/item catalog lives in the canonical case file. */
export { ITEM_DETAILS, type ItemDetails } from '../story/case';
import { ITEM_DETAILS } from '../story/case';

export type LampColor = 'warm' | 'uv';

/** Level ids are open strings — levels are defined in src/levels/. */
export type LevelId = string;

export type GameState = {
  /** Collected item ids. */
  inventory: string[];
  /** Generic per-room puzzle flags, namespaced by level (e.g. 'bedroom.rugMoved'). */
  flags: Record<string, FlagValue>;
  /** Ordering-puzzle progress, keyed by puzzle id. */
  sequences: Record<string, number>;
  /** The currently open modal (keypad, examine, cipher...), or null. */
  activeModal: ModalSpec | null;
  /** Current toast message (null = hidden). */
  toast: string | null;
  /** Ceiling lamp color mode. 'uv' reveals hidden clues. */
  lampColor: LampColor;
  /** 0 = night, 1 = day. */
  timeOfDay: number;
  /** The room/level the player is currently in. */
  currentLevel: LevelId;
  /** Whether the lighting control panel is open (toggled by clicking a lamp). */
  lightPanelOpen: boolean;

  toggleLightPanel: () => void;
  setFlag: (key: string, value?: FlagValue) => void;
  getFlag: (key: string) => boolean;
  addItem: (id: string) => void;
  hasItem: (id: string) => boolean;
  showToast: (message: string) => void;
  clearToast: () => void;
  openModal: (modal: ModalSpec) => void;
  closeModal: () => void;
  setSequenceProgress: (puzzleId: string, value: number) => void;
  setLampColor: (color: LampColor) => void;
  setTimeOfDay: (t: number) => void;
  setLevel: (level: LevelId) => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  inventory: [],
  flags: {},
  sequences: {},
  activeModal: null,
  toast: null,
  lampColor: 'warm',
  timeOfDay: 1,
  currentLevel: 'bedroom',
  lightPanelOpen: false,

  toggleLightPanel: () => set((s) => ({ lightPanelOpen: !s.lightPanelOpen })),

  setFlag: (key, value = true) =>
    set((s) => ({ flags: { ...s.flags, [key]: value } })),

  getFlag: (key) => !!get().flags[key],

  setLevel: (level) => set({ currentLevel: level }),

  setLampColor: (color) => set({ lampColor: color }),

  setTimeOfDay: (t) => set({ timeOfDay: Math.min(1, Math.max(0, t)) }),

  addItem: (id) => {
    if (get().inventory.includes(id)) return;
    const label = ITEM_DETAILS[id]?.name ?? id;
    set((s) => ({
      inventory: [...s.inventory, id],
      toast: `Found: ${label}`,
    }));
  },

  hasItem: (id) => get().inventory.includes(id),

  showToast: (message) => set({ toast: message }),

  clearToast: () => set({ toast: null }),

  openModal: (modal) => set({ activeModal: modal }),

  closeModal: () => set({ activeModal: null }),

  setSequenceProgress: (puzzleId, value) =>
    set((s) => ({ sequences: { ...s.sequences, [puzzleId]: value } })),
}));
