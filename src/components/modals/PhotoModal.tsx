import { useGameStore } from '../../store/gameStore';
import type { ModalSpec } from '../../engine/puzzles';
import { PHOTO_ART } from '../photos';

type Spec = Extract<ModalSpec, { kind: 'photo' }>;

/** Photographic-evidence viewer: a bordered print + caption. */
export default function PhotoModal({ spec }: { spec: Spec }) {
  const closeModal = useGameStore((s) => s.closeModal);
  const Art = PHOTO_ART[spec.photoId];

  return (
    <div className="photo-modal">
      <h3 className="modal-title">{spec.title ?? 'Photograph'}</h3>
      <div className="photo-frame">{Art ? <Art /> : <p>The print has faded.</p>}</div>
      {spec.caption && <p className="photo-caption">{spec.caption}</p>}
      <div className="modal-row">
        <button className="modal-btn" onClick={closeModal}>
          Put it down
        </button>
      </div>
    </div>
  );
}
