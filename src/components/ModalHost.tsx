/**
 * Renders whichever modal is active in the store. Puzzle logic lives in
 * the individual modal components; opening/closing is generic.
 */
import { useGameStore } from '../store/gameStore';
import ExamineModal from './modals/ExamineModal';
import KeypadModal from './modals/KeypadModal';
import CipherModal from './modals/CipherModal';

export default function ModalHost() {
  const modal = useGameStore((s) => s.activeModal);
  const closeModal = useGameStore((s) => s.closeModal);

  if (!modal) return null;

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {modal.kind === 'examine' && <ExamineModal spec={modal} />}
        {modal.kind === 'keypad' && <KeypadModal spec={modal} />}
        {modal.kind === 'cipher' && <CipherModal spec={modal} />}
      </div>
    </div>
  );
}
