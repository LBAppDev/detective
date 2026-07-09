import { useGameStore } from '../store/gameStore';

/**
 * Lighting control panel (debug-panel style).
 * Lamp color toggle (warm / UV) and a time-of-day slider.
 * Hidden by default — toggled by clicking the room's lamp.
 */
export default function LightingPanel() {
  const open = useGameStore((s) => s.lightPanelOpen);
  const lampColor = useGameStore((s) => s.lampColor);
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const setLampColor = useGameStore((s) => s.setLampColor);
  const setTimeOfDay = useGameStore((s) => s.setTimeOfDay);
  const toggleLightPanel = useGameStore((s) => s.toggleLightPanel);

  if (!open) return null;

  return (
    <div className="light-panel">
      <div className="light-panel-title">
        LIGHTING
        <button className="light-panel-close" onClick={toggleLightPanel} title="Close">
          ✕
        </button>
      </div>

      <div className="light-row">
        <span className="light-label">Lamp color</span>
        <div className="light-toggle">
          <button
            className={lampColor === 'warm' ? 'active' : ''}
            onClick={() => setLampColor('warm')}
          >
            Warm
          </button>
          <button
            className={lampColor === 'uv' ? 'active uv' : ''}
            onClick={() => setLampColor('uv')}
          >
            UV
          </button>
        </div>
      </div>

      <div className="light-row">
        <span className="light-label">Time of day</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={timeOfDay}
          onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
        />
        <span className="light-tod">{timeOfDay < 0.5 ? '🌙' : '☀️'}</span>
      </div>
    </div>
  );
}
