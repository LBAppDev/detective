/**
 * Renders whichever modal is active in the store. Puzzle logic lives in
 * the individual modal components; opening/closing is generic.
 */
import { useGameStore } from '../store/gameStore';
import ExamineModal from './modals/ExamineModal';
import KeypadModal from './modals/KeypadModal';
import CipherModal from './modals/CipherModal';
import ShadowAlignModal from './modals/ShadowAlignModal';
import PhotoModal from './modals/PhotoModal';
import AccuseModal from './modals/AccuseModal';

export default function ModalHost() {
  const modal = useGameStore((s) => s.activeModal);
  const closeModal = useGameStore((s) => s.closeModal);

  if (!modal) return null;

  // The shadow puzzle is a dedicated full-screen page, not a card.
  if (modal.kind === 'shadow') return <ShadowAlignModal spec={modal} />;

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {modal.kind === 'examine' && <ExamineModal spec={modal} />}
        {modal.kind === 'keypad' && <KeypadModal spec={modal} />}
        {modal.kind === 'cipher' && <CipherModal spec={modal} />}
        {modal.kind === 'photo' && <PhotoModal spec={modal} />}
        {modal.kind === 'accuse' && <AccuseModal spec={modal} />}
      </div>
    </div>
  );
}
