import { useGameStore } from '../store/gameStore';
import { startAmbience } from '../engine/feedback';
import { CASE_INFO } from '../story/case';

/**
 * Case briefing / title screen. Shown on every boot; offers "Continue"
 * when a saved investigation exists. The button click is the user
 * gesture that unlocks WebAudio, so the room tone starts here.
 */
export default function TitleScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const hasProgress = useGameStore(
    (s) => s.inventory.length > 0 || Object.keys(s.flags).length > 0 || s.currentLevel !== 'bedroom',
  );

  const begin = (fresh: boolean) => {
    if (fresh) resetGame();
    startAmbience();
    startGame();
  };

  return (
    <div className="title-screen">
      <div className="title-card">
        <div className="title-case-number">{CASE_INFO.number}</div>
        <h1 className="title-name">{CASE_INFO.title}</h1>
        <div className="title-victim">{CASE_INFO.victim}</div>
        <p className="title-verdict">{CASE_INFO.verdict}</p>
        <p className="title-briefing">{CASE_INFO.briefing}</p>
        <div className="title-actions">
          {hasProgress && (
            <button className="modal-btn" onClick={() => begin(false)}>
              Continue Investigation
            </button>
          )}
          <button
            className={hasProgress ? 'modal-btn subtle' : 'modal-btn'}
            onClick={() => begin(true)}
          >
            {hasProgress ? 'Start Over' : 'Open Investigation'}
          </button>
        </div>
      </div>
    </div>
  );
}
