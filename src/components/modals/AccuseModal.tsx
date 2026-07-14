/**
 * Final accusation modal: the suspect roster as evidence-board cards.
 * One shot, with a two-step confirm: picking a card only *selects* the
 * suspect; the accusation fires from an explicit confirm button, so a
 * stray click can never burn the run. The right pick fires
 * spec.onSuccess (solved flag + epilogue). A confirmed wrong pick sets
 * the persisted failFlag — the accusation collapses, and the only way
 * forward is restarting the case from the beginning. The failFlag
 * survives closing the modal and page reloads, so the failure can't
 * be dodged.
 */
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { resolveActions, type ModalSpec } from '../../engine/puzzles';
import { playSound } from '../../engine/feedback';
import { SUSPECTS } from '../../story/case';

type Spec = Extract<ModalSpec, { kind: 'accuse' }>;

export default function AccuseModal({ spec }: { spec: Spec }) {
  const closeModal = useGameStore((s) => s.closeModal);
  const resetGame = useGameStore((s) => s.resetGame);
  const alreadyFailed = useGameStore((s) =>
    spec.failFlag ? !!s.flags[spec.failFlag] : false,
  );
  const [rebuttal, setRebuttal] = useState<string | null>(null);
  /** Suspect id awaiting confirmation (null = still browsing the board). */
  const [pending, setPending] = useState<string | null>(null);

  const accuse = (id: string) => {
    if (id === spec.culpritId) {
      resolveActions(spec.onSuccess);
      return;
    }
    playSound('deny');
    if (spec.failFlag) useGameStore.getState().setFlag(spec.failFlag);
    setRebuttal(
      spec.wrongText?.[id] ??
        'The evidence doesn\u2019t hold together that way \u2014 and everyone in the room knows it.',
    );
  };

  if (alreadyFailed || rebuttal) {
    return (
      <div className="accuse-modal">
        <h3 className="modal-title">The Accusation Collapses</h3>
        {rebuttal && <p className="accuse-rebuttal">{rebuttal}</p>}
        <p className="accuse-prompt">
          You said the wrong name out loud, in front of the family. The lawyers move in, the
          witnesses go quiet, and the Halloway file closes for good. If Vera gets justice now,
          it starts the way it started before: from the beginning.
        </p>
        <button className="modal-btn" onClick={resetGame}>
          Reopen the case from the beginning
        </button>
      </div>
    );
  }

  // Confirm step: the name has been picked but not yet said out loud.
  if (pending) {
    const sus = SUSPECTS.find((s) => s.id === pending);
    return (
      <div className="accuse-modal">
        <h3 className="modal-title">Are You Certain?</h3>
        <p className="accuse-prompt">
          You&rsquo;re about to name <strong>{sus?.name ?? pending}</strong> as Vera&rsquo;s killer,
          out loud, in front of the family. There is no second accusation. Say it, and it
          can&rsquo;t be unsaid.
        </p>
        <div className="modal-row">
          <button className="modal-btn" onClick={() => accuse(pending)}>
            Accuse {sus?.name ?? pending}
          </button>
          <button className="modal-btn subtle" onClick={() => setPending(null)}>
            Reconsider
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="accuse-modal">
      <h3 className="modal-title">{spec.title ?? 'Name the Killer'}</h3>
      {spec.prompt && <p className="accuse-prompt">{spec.prompt}</p>}
      <div className="suspect-grid">
        {SUSPECTS.map((sus) => (
          <button
            key={sus.id}
            className="suspect-card"
            onClick={() => {
              playSound('click');
              setPending(sus.id);
            }}
          >
            <span className="suspect-portrait">{sus.portrait}</span>
            <span className="suspect-name">{sus.name}</span>
            <span className="suspect-role">{sus.role}</span>
          </button>
        ))}
      </div>
      <button className="modal-btn subtle" onClick={closeModal}>
        Not yet
      </button>
    </div>
  );
}
