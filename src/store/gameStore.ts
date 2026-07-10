import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModalSpec } from '../engine/puzzles';

/** Flags can hold booleans, numbers, or strings (dial positions, codes...). */
export type FlagValue = boolean | number | string;

/** Clue/item catalog lives in the canonical case file. */
export { ITEM_DETAILS, type ItemDetails } from '../story/case';
import { ITEM_DETAILS } from '../story/case';

export type LampColor = 'warm' | 'uv';

/** Level ids are open strings — levels are defined in src/levels/. */
export type LevelId = string;

/** 'title' = case-briefing screen; 'playing' = in the 3D scene. */
export type GamePhase = 'title' | 'playing';

export type GameState = {
  /** Current app phase. Always boots to 'title' (never persisted). */
  phase: GamePhase;
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

  /** Leave the title screen and enter the scene. */
  startGame: () => void;
  /** Wipe all case progress and return to the title/briefing screen. */
  resetGame: () => void;
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

/** Fresh-investigation values, shared by the initial state and resetGame. */
const INITIAL_PROGRESS = {
  inventory: [] as string[],
  flags: {} as Record<string, FlagValue>,
  sequences: {} as Record<string, number>,
  activeModal: null,
  toast: null,
  lampColor: 'warm' as LampColor,
  timeOfDay: 1,
  currentLevel: 'bedroom' as LevelId,
  lightPanelOpen: false,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
  ...INITIAL_PROGRESS,
  phase: 'title',

  startGame: () => set({ phase: 'playing' }),

  resetGame: () => set({ ...INITIAL_PROGRESS, phase: 'title' }),

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
    }),
    {
      name: 'cold-case-save',
      // Persist only case progress — transient UI state (modals, toasts,
      // panels) and the phase always reset on load.
      partialize: (s) => ({
        inventory: s.inventory,
        flags: s.flags,
        sequences: s.sequences,
        currentLevel: s.currentLevel,
        lampColor: s.lampColor,
        timeOfDay: s.timeOfDay,
      }),
    },
  ),
);
