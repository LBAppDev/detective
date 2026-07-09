/**
 * Puzzle toolkit core: declarative Interaction union + Action resolver.
 *
 * Levels describe puzzles as data; this module is the only place that
 * executes them. New puzzle types = one new Interaction variant here
 * plus (optionally) one modal component — never per-room code.
 */
import { useGameStore, type GameState } from '../store/gameStore';
import type { RoomObjectConfig } from '../levels/types';
import { playSound, type SoundName } from './feedback';

/* ------------------------------------------------------------------ */
/* Actions — outcome lists shared by every puzzle type                  */
/* ------------------------------------------------------------------ */

export type Action =
  | { collect: string }
  | { flag: string; value?: boolean | number | string }
  | { toast: string }
  | { sound: SoundName }
  | { goToLevel: string }
  | { openModal: ModalSpec }
  | { closeModal: true }
  | { custom: () => void };

/** Executes any outcome list. Nothing puzzle-specific lives here. */
export function resolveActions(actions: Action[] = []) {
  const s = useGameStore.getState();
  for (const a of actions) {
    if ('collect' in a) s.addItem(a.collect);
    else if ('flag' in a) s.setFlag(a.flag, a.value ?? true);
    else if ('toast' in a) s.showToast(a.toast);
    else if ('sound' in a) playSound(a.sound);
    else if ('goToLevel' in a) s.setLevel(a.goToLevel);
    else if ('openModal' in a) s.openModal(a.openModal);
    else if ('closeModal' in a) s.closeModal();
    else if ('custom' in a) a.custom();
  }
}

/* ------------------------------------------------------------------ */
/* Modals — one activeModal slot; the host renders whichever is active  */
/* ------------------------------------------------------------------ */

export type ModalSpec =
  | { kind: 'examine'; title?: string; text: string }
  | {
      kind: 'keypad';
      title?: string;
      answer: string;
      length?: number;
      onSuccess: Action[];
      onFail?: Action[];
    }
  | {
      kind: 'cipher';
      title?: string;
      cipherText: string;
      answer: string;
      placeholder?: string;
      onSuccess: Action[];
      onFail?: Action[];
    };

/* ------------------------------------------------------------------ */
/* Interactions — the declarative replacement for onInteract callbacks  */
/* ------------------------------------------------------------------ */

export type Interaction =
  /** Show flavor/clue text in the shared Examine modal. */
  | { type: 'examine'; title?: string; text: string }
  /** Add an item/clue to the inventory (toast + notebook are automatic). */
  | { type: 'collect'; item: string; actions?: Action[] }
  /** Run a raw outcome list (flags, toasts, sounds...). */
  | { type: 'actions'; actions: Action[] }
  /** Open the shared keypad; onSuccess fires on the right code. */
  | { type: 'code'; title?: string; answer: string; length?: number; onSuccess: Action[]; onFail?: Action[] }
  /** Show encoded text + a free-text answer field. */
  | { type: 'decipher'; title?: string; cipherText: string; answer: string; placeholder?: string; onSuccess: Action[]; onFail?: Action[] }
  /** Object combination: succeeds only if the item is in the inventory. */
  | { type: 'useItem'; item: string; onSuccess: Action[]; missingText?: string }
  /**
   * Ordering puzzle. Give each hotspot its step number (1-based) and the
   * shared puzzleId/length; put onSuccess on the final step. A wrong
   * click resets progress.
   */
  | { type: 'sequence'; puzzleId: string; step: number; length: number; onSuccess?: Action[]; resetToast?: string }
  /** Escape hatch for true one-offs. */
  | { type: 'custom'; run: (state: GameState) => void };

export function runInteraction(i: Interaction) {
  const s = useGameStore.getState();
  switch (i.type) {
    case 'examine':
      s.openModal({ kind: 'examine', title: i.title, text: i.text });
      break;

    case 'collect':
      if (s.inventory.includes(i.item)) break;
      s.addItem(i.item);
      playSound('success');
      if (i.actions) resolveActions(i.actions);
      break;

    case 'actions':
      resolveActions(i.actions);
      break;

    case 'code':
      s.openModal({
        kind: 'keypad',
        title: i.title,
        answer: i.answer,
        length: i.length,
        onSuccess: i.onSuccess,
        onFail: i.onFail,
      });
      break;

    case 'decipher':
      s.openModal({
        kind: 'cipher',
        title: i.title,
        cipherText: i.cipherText,
        answer: i.answer,
        placeholder: i.placeholder,
        onSuccess: i.onSuccess,
        onFail: i.onFail,
      });
      break;

    case 'useItem':
      if (s.inventory.includes(i.item)) {
        playSound('success');
        resolveActions(i.onSuccess);
      } else {
        playSound('deny');
        s.showToast(i.missingText ?? "Something's missing for this.");
      }
      break;

    case 'sequence': {
      const progress = s.sequences[i.puzzleId] ?? 0;
      if (i.step === progress + 1) {
        const next = progress + 1;
        playSound('click');
        if (next === i.length) {
          s.setSequenceProgress(i.puzzleId, 0);
          resolveActions(i.onSuccess ?? []);
        } else {
          s.setSequenceProgress(i.puzzleId, next);
        }
      } else {
        // Wrong order — reset (clicking step 1 restarts a fresh attempt).
        s.setSequenceProgress(i.puzzleId, i.step === 1 ? 1 : 0);
        playSound('deny');
        if (i.resetToast) s.showToast(i.resetToast);
      }
      break;
    }

    case 'custom':
      i.run(s);
      break;
  }
}

/**
 * Entry point used by the renderer for any clicked object:
 * applies the shared requires/failText gate, then runs the interaction.
 */
export function interactObject(obj: RoomObjectConfig) {
  const s = useGameStore.getState();
  if (obj.requires && !obj.requires(s)) {
    playSound('deny');
    if (obj.failText) s.showToast(obj.failText);
    return;
  }
  if (obj.interaction) runInteraction(obj.interaction);
}
