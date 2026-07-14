/**
 * Shadow-alignment puzzle — a dedicated full-screen page with its own
 * 3D scene (separate from the room canvas).
 *
 * Three ornaments sit on a shelf in front of a plaster wall where Vera
 * pencilled three faint outlines: a circle, a cross, three tallies —
 * the Trust's mark. A swing-arm lamp casts real shadows. The player
 * rotates each ornament and swings the lamp until every shadow settles
 * inside its pencil line. Each shape only reads correctly from one
 * angle (a ring edge-on is just a line), so the puzzle is about finding
 * the point of view the room was designed around.
 *
 * Success = lamp centered AND all three rotations within tolerance
 * (shapes are symmetric, so alignment is checked modulo 180°).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { SpotLight } from 'three';
import { useGameStore } from '../../store/gameStore';
import { resolveActions, type ModalSpec } from '../../engine/puzzles';
import { playSound } from '../../engine/feedback';

type Spec = Extract<ModalSpec, { kind: 'shadow' }>;

/* ------------------------------------------------------------------ */
/* Geometry constants                                                   */
/* ------------------------------------------------------------------ */

const WALL_Z = -1.2;
const LAMP = { y: 2.3, z: 3.4 };
const SHELF_Y = 1.15;
/** Shadow projection scale from the ornament plane (z=0) onto the wall. */
const K = (LAMP.z - WALL_Z) / LAMP.z; // ≈ 1.35
/** Wall-space y where ornament centers project when the lamp is centered. */
const OUT_Y = LAMP.y + (SHELF_Y - LAMP.y) * K;

/** Baked-in crooked mounts: slider angle + offset must hit 0 (mod π). */
const OFFSETS = { ring: 0.995, cross: 2.269, tally: 0.716 };
const TOLERANCE = 0.12; // radians
const LAMP_TOLERANCE = 0.18; // world x units

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Distance of an angle from the nearest multiple of π (shape symmetry). */
function offAxis(angle: number) {
  const m = ((angle % Math.PI) + Math.PI) % Math.PI;
  return Math.min(m, Math.PI - m);
}

/* ------------------------------------------------------------------ */
/* Scene pieces                                                         */
/* ------------------------------------------------------------------ */

const BRONZE = { color: '#4a3b28', metalness: 0.45, roughness: 0.5 } as const;

function Ring({ angle }: { angle: number }) {
  return (
    <group position={[-1.2, SHELF_Y, 0]} rotation={[0, angle, 0]}>
      <mesh castShadow>
        <torusGeometry args={[0.32, 0.045, 10, 28]} />
        <meshStandardMaterial {...BRONZE} />
      </mesh>
      <mesh position={[0, -0.36, 0]} castShadow>
        <boxGeometry args={[0.1, 0.14, 0.1]} />
        <meshStandardMaterial {...BRONZE} />
      </mesh>
    </group>
  );
}

function Cross({ angle }: { angle: number }) {
  return (
    <group position={[0, SHELF_Y, 0]} rotation={[0, angle, 0]}>
      {[Math.PI / 4, -Math.PI / 4].map((r) => (
        <mesh key={r} rotation={[0, 0, r]} castShadow>
          <boxGeometry args={[0.72, 0.09, 0.05]} />
          <meshStandardMaterial {...BRONZE} />
        </mesh>
      ))}
      <mesh position={[0, -0.36, 0]} castShadow>
        <boxGeometry args={[0.1, 0.14, 0.1]} />
        <meshStandardMaterial {...BRONZE} />
      </mesh>
    </group>
  );
}

function Tallies({ angle }: { angle: number }) {
  return (
    <group position={[1.2, SHELF_Y, 0]} rotation={[0, angle, 0]}>
      {[-0.18, 0, 0.18].map((x) => (
        <mesh key={x} position={[x, 0, 0]} castShadow>
          <boxGeometry args={[0.06, 0.5, 0.05]} />
          <meshStandardMaterial {...BRONZE} />
        </mesh>
      ))}
      <mesh position={[0, -0.32, 0]} castShadow>
        <boxGeometry args={[0.5, 0.06, 0.1]} />
        <meshStandardMaterial {...BRONZE} />
      </mesh>
    </group>
  );
}

/** Faint pencil outlines on the wall; gold once their shadow matches. */
function PencilOutlines({ hits }: { hits: { ring: boolean; cross: boolean; tally: boolean } }) {
  const mat = (hit: boolean) => (
    <meshBasicMaterial
      color={hit ? '#e2c069' : '#d8d2c6'}
      transparent
      opacity={hit ? 0.9 : 0.3}
    />
  );
  const z = WALL_Z + 0.01;
  return (
    <group position={[0, OUT_Y, z]}>
      {/* circle */}
      <mesh position={[-1.2 * K, 0, 0]}>
        <ringGeometry args={[0.4, 0.46, 32]} />
        {mat(hits.ring)}
      </mesh>
      {/* cross */}
      {[Math.PI / 4, -Math.PI / 4].map((r) => (
        <mesh key={r} rotation={[0, 0, r]}>
          <planeGeometry args={[0.98, 0.06]} />
          {mat(hits.cross)}
        </mesh>
      ))}
      {/* tallies */}
      {[-0.24, 0, 0.24].map((x) => (
        <mesh key={x} position={[1.2 * K + x, 0, 0]}>
          <planeGeometry args={[0.05, 0.68]} />
          {mat(hits.tally)}
        </mesh>
      ))}
    </group>
  );
}

function Lamp({ x }: { x: number }) {
  const ref = useRef<SpotLight>(null);
  useEffect(() => {
    const light = ref.current;
    if (!light) return;
    light.target.position.set(0, SHELF_Y - 0.2, WALL_Z);
    light.target.updateMatrixWorld();
  }, []);
  return (
    <group>
      {/* visible lamp head so the player can see what they're swinging */}
      <mesh position={[x, LAMP.y, LAMP.z]} rotation={[0.9, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.16, 0.22, 12, 1, true]} />
        <meshStandardMaterial color="#2e3138" emissive="#ffd9a0" emissiveIntensity={0.6} side={2} />
      </mesh>
      <spotLight
        ref={ref}
        position={[x, LAMP.y, LAMP.z]}
        angle={0.55}
        penumbra={0.4}
        intensity={4}
        decay={0}
        color="#ffe9c8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
    </group>
  );
}

function PuzzleScene({
  lampX,
  angles,
  hits,
}: {
  lampX: number;
  angles: { ring: number; cross: number; tally: number };
  hits: { ring: boolean; cross: boolean; tally: boolean };
}) {
  return (
    <>
      <ambientLight intensity={0.22} color="#8899cc" />
      <Lamp x={lampX} />
      {/* plaster wall */}
      <mesh position={[0, 1.5, WALL_Z]} receiveShadow>
        <planeGeometry args={[7.5, 3.8]} />
        <meshStandardMaterial color="#5d6a63" />
      </mesh>
      <PencilOutlines hits={hits} />
      {/* shelf board (doesn't cast — its shadow would drown the shapes) */}
      <mesh position={[0, SHELF_Y - 0.47, 0]} receiveShadow>
        <boxGeometry args={[4.4, 0.08, 0.6]} />
        <meshStandardMaterial color="#4a3526" />
      </mesh>
      <Ring angle={angles.ring} />
      <Cross angle={angles.cross} />
      <Tallies angle={angles.tally} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function ShadowAlignModal({ spec }: { spec: Spec }) {
  const closeModal = useGameStore((s) => s.closeModal);
  const [lamp, setLamp] = useState(62); // -100..100 → world x -2..2
  const [ring, setRing] = useState(210); // degrees
  const [cross, setCross] = useState(35);
  const [tally, setTally] = useState(300);
  const [solved, setSolved] = useState(false);

  const lampX = lamp / 50;
  const angles = useMemo(
    () => ({
      ring: rad(ring) + OFFSETS.ring,
      cross: rad(cross) + OFFSETS.cross,
      tally: rad(tally) + OFFSETS.tally,
    }),
    [ring, cross, tally],
  );

  const lampOk = Math.abs(lampX) < LAMP_TOLERANCE;
  const hits = {
    ring: lampOk && offAxis(angles.ring) < TOLERANCE,
    cross: lampOk && offAxis(angles.cross) < TOLERANCE,
    tally: lampOk && offAxis(angles.tally) < TOLERANCE,
  };
  const allAligned = hits.ring && hits.cross && hits.tally;

  // Success detection: lock the page once everything lines up.
  useEffect(() => {
    if (!allAligned || solved) return;
    setSolved(true);
    playSound('success');
  }, [allAligned, solved]);

  // Exit runs in its own effect: setting `solved` above re-runs the
  // detection effect, so a timer created there would be cleaned up
  // before it ever fired (the "stuck on the solved page" bug).
  useEffect(() => {
    if (!solved) return;
    const t = window.setTimeout(() => {
      closeModal();
      resolveActions(spec.onSuccess);
    }, 1400);
    return () => window.clearTimeout(t);
  }, [solved, closeModal, spec]);

  const control = (
    label: string,
    value: number,
    set: (v: number) => void,
    min: number,
    max: number,
    aligned: boolean,
  ) => (
    <label className="shadow-control" data-aligned={aligned}>
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={solved}
        onChange={(e) => set(Number(e.target.value))}
      />
    </label>
  );

  return (
    <div className="shadow-page">
      <div className="shadow-head">
        <h2 className="shadow-title">{spec.title ?? 'The Shelf of Oddments'}</h2>
        <p className="shadow-prompt">
          {solved
            ? 'The shadows settle into her pencil lines. The wall answers.'
            : spec.prompt ??
              'Swing the lamp and turn each piece until its shadow sits inside the pencil marks.'}
        </p>
      </div>
      <div className="shadow-canvas">
        <Canvas shadows camera={{ position: [0, 1.5, 4.6], fov: 40 }}>
          <color attach="background" args={['#100e15']} />
          <PuzzleScene lampX={lampX} angles={angles} hits={hits} />
        </Canvas>
      </div>
      <div className="shadow-controls">
        {control('Lamp arm', lamp, setLamp, -100, 100, lampOk)}
        {control('Ring', ring, setRing, 0, 360, hits.ring)}
        {control('Crossed bars', cross, setCross, 0, 360, hits.cross)}
        {control('Three pins', tally, setTally, 0, 360, hits.tally)}
        <button className="modal-btn subtle" onClick={closeModal}>
          Step away
        </button>
      </div>
    </div>
  );
}
