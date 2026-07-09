import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

/** Small on-screen notification shown when the game state sets a toast message. */
export default function Toast() {
  const toast = useGameStore((s) => s.toast);
  const clearToast = useGameStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, 2500);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  // key={toast} re-triggers the entry animation for consecutive toasts.
  return (
    <div className="toast" key={toast}>
      {toast}
    </div>
  );
}
