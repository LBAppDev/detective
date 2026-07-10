import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Bottom-left "Restart Case" button with a two-step confirm so a stray
 * click can't wipe the investigation. Confirming resets all progress
 * and returns to the title/briefing screen.
 */
export default function RestartButton() {
  const resetGame = useGameStore((s) => s.resetGame);
  const [arming, setArming] = useState(false);
  const timer = useRef<number>();

  // The armed state disarms itself if the player hesitates.
  useEffect(() => {
    if (!arming) return;
    timer.current = window.setTimeout(() => setArming(false), 3500);
    return () => window.clearTimeout(timer.current);
  }, [arming]);

  const onClick = () => {
    if (!arming) {
      setArming(true);
      return;
    }
    resetGame();
  };

  return (
    <button
      className={`restart-btn ${arming ? 'arming' : ''}`}
      onClick={onClick}
      title="Restart the investigation from the beginning"
    >
      {arming ? 'Erase all progress? Click to confirm' : '↺ Restart Case'}
    </button>
  );
}
