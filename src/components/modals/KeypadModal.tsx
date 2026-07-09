import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { resolveActions, type ModalSpec } from '../../engine/puzzles';
import { playSound } from '../../engine/feedback';

type Spec = Extract<ModalSpec, { kind: 'keypad' }>;

/** Shared keypad — serves every safe/lock/keypad in the game. */
export default function KeypadModal({ spec }: { spec: Spec }) {
  const closeModal = useGameStore((s) => s.closeModal);
  const [entry, setEntry] = useState('');
  const [shakes, setShakes] = useState(0);

  const length = spec.length ?? spec.answer.length;

  const press = (digit: string) => {
    if (entry.length >= length) return;
    playSound('click');
    setEntry(entry + digit);
  };

  const submit = () => {
    if (entry === spec.answer) {
      closeModal();
      playSound('success');
      resolveActions(spec.onSuccess);
    } else {
      playSound('deny');
      setShakes((n) => n + 1);
      setEntry('');
      resolveActions(spec.onFail ?? [{ toast: 'Incorrect code.' }]);
    }
  };

  const display = entry.padEnd(length, '·').split('').join(' ');

  return (
    <div className="keypad-modal">
      <h3 className="modal-title">{spec.title ?? 'Enter code'}</h3>
      {/* key remounts the display to retrigger the shake animation */}
      <div className="keypad-display" key={shakes} data-shake={shakes > 0}>
        {display}
      </div>
      <div className="keypad-grid">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} onClick={() => press(d)}>
            {d}
          </button>
        ))}
        <button onClick={() => setEntry('')}>C</button>
        <button onClick={() => press('0')}>0</button>
        <button className="keypad-ok" onClick={submit} disabled={entry.length !== length}>
          ✓
        </button>
      </div>
      <button className="modal-btn subtle" onClick={closeModal}>
        Step away
      </button>
    </div>
  );
}
