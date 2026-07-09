import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../levels';

/**
 * Generic level-exit prompt. Reads the current level's unlock config;
 * shows once all required items are collected, and advances to the
 * configured next level. No per-room logic lives here.
 */
export default function DoorPrompt() {
  const currentLevel = useGameStore((s) => s.currentLevel);
  const inventory = useGameStore((s) => s.inventory);
  const setLevel = useGameStore((s) => s.setLevel);

  const unlock = LEVELS[currentLevel]?.unlock;
  if (!unlock) return null;

  const unlocked = unlock.requiredItems.every((id) => inventory.includes(id));
  if (!unlocked) return null;

  return (
    <div className="door-prompt">
      <div className="door-prompt-title">{unlock.title}</div>
      <p className="door-prompt-text">{unlock.text}</p>
      <button className="door-prompt-btn" onClick={() => setLevel(unlock.nextLevel)}>
        {unlock.buttonLabel}
      </button>
    </div>
  );
}
