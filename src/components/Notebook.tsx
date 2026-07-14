import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { CASE_INFO, ITEM_DETAILS, SUSPECTS, TIMELINE } from '../story/case';
import { ITEM_PHOTOS, PHOTO_ART } from './photos';

type Tab = 'clues' | 'suspects' | 'timeline';

/**
 * Case file / notebook overlay with three tabs:
 * Evidence (collected clues), Suspects (profiles + linked evidence),
 * and Timeline (the night of Oct 14th, reconstructed as clues appear).
 */
export default function Notebook() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('clues');
  const inventory = useGameStore((s) => s.inventory);
  const openModal = useGameStore((s) => s.openModal);

  const has = (id: string) => inventory.includes(id);

  return (
    <>
      <button
        className="notebook-toggle"
        onClick={() => setOpen((o) => !o)}
        title="Case file"
      >
        📓 Case File
        {inventory.length > 0 && <span className="notebook-badge">{inventory.length}</span>}
      </button>

      {open && (
        <div className="notebook-panel">
          <div className="notebook-header">
            <h2>{CASE_INFO.title.toUpperCase()}</h2>
            <span className="notebook-sub">{CASE_INFO.number}</span>
            <button className="notebook-close" onClick={() => setOpen(false)} title="Close">
              ✕
            </button>
          </div>

          <div className="notebook-victim">
            <strong>{CASE_INFO.victim}</strong>
            <p>{CASE_INFO.verdict}</p>
          </div>

          <div className="notebook-tabs">
            {(['clues', 'suspects', 'timeline'] as Tab[]).map((t) => (
              <button
                key={t}
                className={tab === t ? 'active' : ''}
                onClick={() => setTab(t)}
              >
                {t === 'clues' ? 'Evidence' : t === 'suspects' ? 'Suspects' : 'Timeline'}
              </button>
            ))}
          </div>

          {/* ---------- Evidence ---------- */}
          {tab === 'clues' &&
            (inventory.length === 0 ? (
              <p className="notebook-empty">
                No evidence collected yet.
                <br />
                Search the room — look under things, behind things.
              </p>
            ) : (
              <ul className="notebook-list">
                {inventory.map((id) => {
                  const details = ITEM_DETAILS[id];
                  const photo = ITEM_PHOTOS[id];
                  const Art = photo ? PHOTO_ART[photo.photoId] : null;
                  return (
                    <li key={id} className="notebook-entry">
                      <span className="notebook-entry-name">{details?.name ?? id}</span>
                      <p className="notebook-entry-desc">
                        {details?.description ?? 'No notes on this item yet.'}
                      </p>
                      {photo && Art && (
                        <button
                          className="notebook-photo"
                          title="Examine the photograph"
                          onClick={() =>
                            openModal({
                              kind: 'photo',
                              photoId: photo.photoId,
                              title: details?.name,
                              caption: photo.caption,
                            })
                          }
                        >
                          <Art />
                          <span>examine</span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ))}

          {/* ---------- Suspects ---------- */}
          {tab === 'suspects' && (
            <ul className="notebook-list">
              {SUSPECTS.map((s) => {
                const evidence = s.linkedClues.filter(has);
                return (
                  <li key={s.id} className="notebook-entry">
                    <span className="notebook-entry-name">
                      {s.portrait} {s.name}
                    </span>
                    <span className="suspect-role">{s.role}</span>
                    <p className="notebook-entry-desc">{s.bio}</p>
                    <p className="suspect-evidence">
                      {evidence.length === 0
                        ? 'No evidence on file.'
                        : `On file: ${evidence
                            .map((id) => ITEM_DETAILS[id]?.name ?? id)
                            .join(' · ')}`}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          {/* ---------- Timeline ---------- */}
          {tab === 'timeline' && (
            <ul className="notebook-list timeline">
              {TIMELINE.map((entry) => {
                const revealed = entry.revealedBy.some(has);
                return (
                  <li
                    key={entry.id}
                    className={`notebook-entry timeline-entry ${revealed ? '' : 'locked'}`}
                  >
                    <span className="timeline-time">{entry.time}</span>
                    <p className="notebook-entry-desc">
                      {revealed ? entry.text : '· · · · · · · · · · · · · · ·'}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
