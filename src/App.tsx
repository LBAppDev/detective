import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MathUtils } from 'three';
import Toast from './components/Toast';
import Notebook from './components/Notebook';
import LightingPanel from './components/LightingPanel';
import ModalHost from './components/ModalHost';
import TitleScreen from './components/TitleScreen';
import ObjectiveHud from './components/ObjectiveHud';
import RestartButton from './components/RestartButton';
import { setAmbienceLevel } from './engine/feedback';
import { useGameStore } from './store/gameStore';
import { LEVELS, FIRST_LEVEL } from './levels';

export default function App() {
  const phase = useGameStore((s) => s.phase);
  const currentLevel = useGameStore((s) => s.currentLevel);
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const level = LEVELS[currentLevel] ?? LEVELS[FIRST_LEVEL];

  // Nights feel quieter — scale the room tone with the time-of-day slider.
  useEffect(() => {
    setAmbienceLevel(MathUtils.lerp(0.55, 1, timeOfDay));
  }, [timeOfDay]);

  if (phase === 'title') return <TitleScreen />;

  return (
    <>
    <Canvas
      shadows
      camera={{ position: [9, 7, 9], fov: 42 }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <color attach="background" args={['#1c1a22']} />

      <level.Scene />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={4}
        maxDistance={20}
        // Clamp vertical rotation: can't flip over the top...
        minPolarAngle={0.2}
        // ...and can't go below floor level.
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0, 1, 0]}
      />
    </Canvas>
    <Toast />
    <Notebook />
    <ModalHost />
    <ObjectiveHud />
    <RestartButton />
    {level.lightingPanel && <LightingPanel />}
    {level.placeholderLabel && <div className="level-label">{level.placeholderLabel}</div>}
    </>
  );
}
