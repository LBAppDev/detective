import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { resolveActions, type ModalSpec } from '../../engine/puzzles';
import { playSound } from '../../engine/feedback';

type Spec = Extract<ModalSpec, { kind: 'cipher' }>;

/** Shared decipher UI — encoded text + a free-text answer field. */
export default function CipherModal({ spec }: { spec: Spec }) {
  const closeModal = useGameStore((s) => s.closeModal);
  const [guess, setGuess] = useState('');
  const [shakes, setShakes] = useState(0);

  const submit = () => {
    const normalized = guess.trim().toLowerCase();
    if (normalized === spec.answer.toLowerCase()) {
      closeModal();
      playSound('success');
      resolveActions(spec.onSuccess);
    } else {
      playSound('deny');
      setShakes((n) => n + 1);
      resolveActions(spec.onFail ?? [{ toast: "That doesn't seem right." }]);
    }
  };

  return (
    <div className="cipher-modal">
      <h3 className="modal-title">{spec.title ?? 'Decipher'}</h3>
      <div className="cipher-text" key={shakes} data-shake={shakes > 0}>
        {spec.cipherText}
      </div>
      <input
        className="cipher-input"
        value={guess}
        placeholder={spec.placeholder ?? 'Your answer...'}
        onChange={(e) => setGuess(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && guess && submit()}
      />
      <div className="modal-row">
        <button className="modal-btn" onClick={submit} disabled={!guess.trim()}>
          Try it
        </button>
        <button className="modal-btn subtle" onClick={closeModal}>
          Step away
        </button>
      </div>
    </div>
  );
}
