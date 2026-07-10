import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../levels';

/**
 * Small top-left HUD: the current goal line + an "Evidence: X / N"
 * counter, driven by the level's ObjectiveConfig. Keeps the optional
 * story clues from being silently missed.
 */
export default function ObjectiveHud() {
  const currentLevel = useGameStore((s) => s.currentLevel);
  const inventory = useGameStore((s) => s.inventory);

  const objective = LEVELS[currentLevel]?.objective;
  if (!objective) return null;

  const found = objective.clueItems.filter((id) => inventory.includes(id)).length;
  const complete = objective.completeWhenItems.every((id) => inventory.includes(id));

  return (
    <div className="objective-hud">
      <div className="objective-text">{complete ? objective.completeText : objective.text}</div>
      <div className="objective-count">
        Evidence: {found} / {objective.clueItems.length}
      </div>
    </div>
  );
}
