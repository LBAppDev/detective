import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Toast from './components/Toast';
import Notebook from './components/Notebook';
import LightingPanel from './components/LightingPanel';
import DoorPrompt from './components/DoorPrompt';
import ModalHost from './components/ModalHost';
import { useGameStore } from './store/gameStore';
import { LEVELS, FIRST_LEVEL } from './levels';

export default function App() {
  const currentLevel = useGameStore((s) => s.currentLevel);
  const level = LEVELS[currentLevel] ?? LEVELS[FIRST_LEVEL];

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
    {level.lightingPanel && <LightingPanel />}
    <DoorPrompt />
    {level.placeholderLabel && <div className="level-label">{level.placeholderLabel}</div>}
    </>
  );
}
