import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

/** Small on-screen notification shown when the game state sets a toast message. */
export default function Toast() {
  const toast = useGameStore((s) => s.toast);
  const clearToast = useGameStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    // Reading time scales with length (some forensic beats run 200+ chars),
    // clamped so short toasts stay snappy and long ones never overstay.
    const duration = Math.min(1500 + toast.length * 40, 10000);
    const timer = setTimeout(clearToast, duration);
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
