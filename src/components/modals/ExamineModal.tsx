import { useGameStore } from '../../store/gameStore';
import type { ModalSpec } from '../../engine/puzzles';

type Spec = Extract<ModalSpec, { kind: 'examine' }>;

export default function ExamineModal({ spec }: { spec: Spec }) {
  const closeModal = useGameStore((s) => s.closeModal);
  return (
    <div className="examine-modal">
      {spec.title && <h3 className="modal-title">{spec.title}</h3>}
      <p className="examine-text">{spec.text}</p>
      <button className="modal-btn" onClick={closeModal}>
        Close
      </button>
    </div>
  );
}
