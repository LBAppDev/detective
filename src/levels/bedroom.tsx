/**
 * Level: The Bedroom.
 * Self-contained room definition — scene shell, models, object/hotspot
 * configs, puzzle logic, and the exit door. The core engine
 * (RoomObjects, Interactable, App) consumes this as data.
 *
 * Puzzle state uses namespaced flags in the global store, e.g.
 * flags['bedroom.rugMoved'], so no store changes are needed per room.
 */
import { useMemo, useRef, type ComponentType } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three';
import { useGameStore } from '../store/gameStore';
import { playSound } from '../engine/feedback';
import { useFlagTween } from '../engine/useFlagTween';
import RoomObjects from '../components/RoomObjects';
import RoomShell from '../components/RoomShell';
import type { LevelConfig, RoomObjectConfig } from './types';

const ROOM = { width: 10, depth: 10, wallHeight: 4 };

const COLORS = {
  floor: '#a8794f', // warm wood
  wallTeal: '#4f7d7a', // back wall
  wallBeige: '#d9c7a7', // side wall
  bedFrame: '#6e4a2f',
  mattress: '#e8e0d0',
  blanket: '#4e7d7a',
  pillow: '#f4efe4',
  rug: '#8a4f57',
  desk: '#7a5230',
  lampCord: '#2b2b30',
  lampBulb: '#ffe9b8',
  note: '#e9e4d2',
};

/** Namespaced puzzle flags for this room. */
const FLAGS = {
  rugMoved: 'bedroom.rugMoved',
  suitcaseOpen: 'bedroom.suitcaseOpen',
  drawerOpen: 'bedroom.drawerOpen',
  wardrobeOpen: 'bedroom.wardrobeOpen',
  curtainsClosed: 'bedroom.curtainsClosed',
};

/** Items needed before the bedroom door will open. */
const DOOR_REQUIRES = ['bedroom_key', 'wall_symbol_clue', 'matchbox', 'train_ticket'];

/** Guards against a double-click firing the level transition twice. */
let doorOpening = false;

/** Staged door logic: locked → key-but-not-done hint → unlock + transition. */
function openBedroomDoor() {
  const s = useGameStore.getState();
  if (doorOpening) return;
  if (!s.inventory.includes('bedroom_key')) {
    playSound('deny');
    s.showToast('Locked tight. The keyhole is old, polished brass.');
    return;
  }
  if (!DOOR_REQUIRES.every((id) => s.inventory.includes(id))) {
    playSound('deny');
    s.showToast("The key fits — but this room hasn't given up everything yet. Vera kept notes only she could find.");
    return;
  }
  doorOpening = true;
  playSound('success');
  s.showToast('The brass key turns. The office waits beyond.');
  // Small pause so the sound + toast land before the scene swaps.
  window.setTimeout(() => {
    useGameStore.getState().setLevel('office');
    doorOpening = false;
  }, 900);
}

/* ------------------------------------------------------------------ */
/* Object/hotspot config                                                */
/* ------------------------------------------------------------------ */

const OBJECTS: RoomObjectConfig[] = [
  {
    id: 'bed',
    name: 'bed',
    position: [1.8, 0, -3.4],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Bed',
      text: 'Neatly made, corners tucked. No one slept here that night.',
    },
  },
  {
    id: 'desk',
    name: 'desk',
    position: [-4.1, 0, 1.6],
    rotation: [0, Math.PI / 2, 0],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Desk',
      text: 'A clean rectangle in the dust where a laptop used to sit. Someone took it in a hurry.',
    },
  },
  {
    id: 'rug',
    name: 'rug',
    position: [0.6, 0, 0.8],
    interactable: true,
    interaction: {
      type: 'actions',
      actions: [{ flag: FLAGS.rugMoved }, { sound: 'slide' }],
    },
  },
  {
    id: 'lamp',
    name: 'lamp',
    position: [0.6, 0, 0.8],
    interactable: true,
    // Clicking the lamp opens/closes the lighting control panel.
    interaction: { type: 'custom', run: () => useGameStore.getState().toggleLightPanel() },
  },
  {
    id: 'hidden-box',
    name: 'matchbox',
    position: [-4.75, 0, 1.6],
    interactable: true,
    // Kicked behind the desk — its notebook entry holds the reading order
    // for the suitcase code (clock · book · shelf), not the digits.
    visible: (s) => !s.inventory.includes('matchbox'),
    interaction: { type: 'collect', item: 'matchbox' },
  },
  {
    id: 'suitcase',
    name: 'locked suitcase',
    position: [3.9, 0, -2.6],
    rotation: [0, -0.35, 0],
    interactable: true,
    requires: (s) => !s.flags[FLAGS.suitcaseOpen],
    failText: 'The suitcase is already open — the ticket was all it held.',
    interaction: {
      type: 'code',
      // The digits are scattered around the room; the matchbox flap only
      // gives the reading order: clock (4) · book (72) · shelf (9).
      title: 'Suitcase — four digits',
      answer: '4729',
      onSuccess: [
        { flag: FLAGS.suitcaseOpen },
        { collect: 'train_ticket' },
        { sound: 'success' },
      ],
      onFail: [{ toast: 'The latch refuses to budge. Clock · book · shelf — whatever that means.' }],
    },
  },
  {
    id: 'wall-symbol',
    name: 'wall symbol',
    position: [-2.2, 2.3, -4.9],
    interactable: true,
    // Stays in the scene until collected (it fades in/out with the UV lamp).
    // Its hitbox only exists under UV, so it can't be clicked while hidden.
    visible: (s) => !s.inventory.includes('wall_symbol_clue'),
    interaction: { type: 'collect', item: 'wall_symbol_clue' },
  },
  {
    id: 'bedroom-key',
    name: 'bedroom key',
    position: [0.6, 0, 0.8],
    interactable: true,
    // Hidden under the rug; disappears once collected.
    visible: (s) => !!s.flags[FLAGS.rugMoved] && !s.inventory.includes('bedroom_key'),
    interaction: { type: 'collect', item: 'bedroom_key' },
  },
  {
    id: 'door',
    name: 'bedroom door',
    position: [-4.96, 0, -2.4],
    rotation: [0, Math.PI / 2, 0],
    interactable: true,
    // Staged lock/hint/unlock logic lives in openBedroomDoor above.
    interaction: { type: 'custom', run: () => openBedroomDoor() },
  },

  /* --- Decorations (openable set dressing + flavor) --- */
  {
    id: 'window',
    name: 'window',
    position: [-0.2, 0, -4.94],
    interactable: true,
    // Clicking draws / opens the curtains; the sash itself never moves.
    interaction: {
      type: 'custom',
      run: (s) => {
        const closing = !s.flags[FLAGS.curtainsClosed];
        s.setFlag(FLAGS.curtainsClosed, closing);
        playSound('slide');
        s.showToast(
          closing
            ? 'You draw the curtains. The room falls a shade darker.'
            : 'The curtains slide back. The sash is painted shut — three floors up, no one came in this way.',
        );
      },
    },
  },
  {
    id: 'nightstand',
    name: 'nightstand',
    position: [3.9, 0, -4.35],
    interactable: true,
    // Toggles the drawer; the paperback inside carries the middle digits.
    interaction: {
      type: 'custom',
      run: (s) => {
        const opening = !s.flags[FLAGS.drawerOpen];
        s.setFlag(FLAGS.drawerOpen, opening);
        playSound('slide');
        if (opening) s.showToast('The drawer slides out. Her unfinished paperback lies inside.');
      },
    },
  },
  {
    id: 'paperback',
    name: 'paperback',
    position: [3.9, 0, -3.98],
    interactable: true,
    // Lives inside the drawer — only clickable once it's been opened.
    visible: (s) => !!s.flags[FLAGS.drawerOpen],
    interaction: {
      type: 'examine',
      title: 'Paperback — dog-eared',
      text: 'A crime novel she never finished. One corner is folded down hard, creased like she meant it to last: page 72.',
    },
  },
  {
    id: 'alarm-clock',
    name: 'alarm clock',
    position: [3.78, 0.72, -4.28],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Alarm Clock',
      text: 'Stopped dead, the hands frozen at 4 o’clock — the batteries died years ago. The single hour it will always show: 4.',
    },
  },
  {
    id: 'bookshelf',
    name: 'bookshelf',
    position: [1.2, 0, 4.68],
    rotation: [0, Math.PI, 0],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Bookshelf',
      text: 'Crime novels, city histories. One thick volume is missing from the middle shelf — and pencilled on the bare board where it stood is a single number: 9.',
    },
  },
  {
    id: 'wardrobe',
    name: 'wardrobe',
    position: [4.62, 0, 2.9],
    rotation: [0, -Math.PI / 2, 0],
    interactable: true,
    // Doors swing open/closed on a flag tween.
    interaction: {
      type: 'custom',
      run: (s) => {
        const opening = !s.flags[FLAGS.wardrobeOpen];
        s.setFlag(FLAGS.wardrobeOpen, opening);
        playSound('slide');
        if (opening)
          s.showToast(
            'The wardrobe doors swing wide. Half the hangers are bare — she packed for somewhere cold and never made the train.',
          );
      },
    },
  },
  {
    id: 'photo-frames',
    name: 'photographs',
    position: [4.94, 0, -1.9],
    rotation: [0, -Math.PI / 2, 0],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Photographs',
      text: 'Vera and her brother at the shore. A press badge photo. A newsroom party — Marcus Hale’s arm around her shoulder.',
    },
  },
  {
    id: 'dead-plant',
    name: 'potted plant',
    position: [-4.3, 0, 4.3],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Potted Plant',
      text: 'Five years without water. Nobody has lived here since.',
    },
  },
];

/* ------------------------------------------------------------------ */
/* Models (local origin — placed via the OBJECTS config)               */
/* ------------------------------------------------------------------ */

/**
 * Soft pulsing gold ring under collectible proof pieces so they read
 * as evidence, not set dressing. Raycast-disabled — purely visual.
 */
function EvidenceShimmer({ radius = 0.26, y = 0.012 }: { radius?: number; y?: number }) {
  const mat = useRef<MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current) mat.current.opacity = 0.28 + Math.sin(clock.elapsedTime * 2.6) * 0.16;
  });
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <ringGeometry args={[radius * 0.65, radius, 28]} />
      <meshBasicMaterial ref={mat} color="#e2c069" transparent opacity={0.3} depthWrite={false} />
    </mesh>
  );
}

function Bed() {
  return (
    <group>
      {/* frame */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.4, 3.2]} />
        <meshStandardMaterial color={COLORS.bedFrame} />
      </mesh>
      {/* headboard */}
      <mesh position={[0, 0.85, -1.55]} castShadow>
        <boxGeometry args={[2.4, 0.9, 0.12]} />
        <meshStandardMaterial color={COLORS.bedFrame} />
      </mesh>
      {/* mattress */}
      <mesh position={[0, 0.62, 0.05]} castShadow>
        <boxGeometry args={[2.15, 0.3, 3]} />
        <meshStandardMaterial color={COLORS.mattress} />
      </mesh>
      {/* blanket */}
      <mesh position={[0, 0.79, 0.65]} castShadow>
        <boxGeometry args={[2.16, 0.12, 1.7]} />
        <meshStandardMaterial color={COLORS.blanket} />
      </mesh>
      {/* pillow */}
      <mesh position={[0, 0.84, -1.05]} castShadow>
        <boxGeometry args={[1.1, 0.18, 0.55]} />
        <meshStandardMaterial color={COLORS.pillow} />
      </mesh>
    </group>
  );
}

function Desk() {
  return (
    <group>
      {/* desktop */}
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.12, 1]} />
        <meshStandardMaterial color={COLORS.desk} />
      </mesh>
      {/* back panel (blocks the view of what's behind the desk) */}
      <mesh position={[0, 0.55, -0.44]} castShadow>
        <boxGeometry args={[2.2, 0.9, 0.08]} />
        <meshStandardMaterial color={COLORS.desk} />
      </mesh>
      {/* legs */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 1.0, 0.5, sz * 0.42]} castShadow>
            <boxGeometry args={[0.12, 1, 0.12]} />
            <meshStandardMaterial color={COLORS.desk} />
          </mesh>
        )),
      )}
    </group>
  );
}

function Rug() {
  // Slides aside when the flag flips — no per-object animation code.
  const ref = useFlagTween(FLAGS.rugMoved, {
    position: { from: [0, 0, 0], to: [2.3, 0, 0.6] },
  });

  return (
    <group ref={ref}>
      <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.7, 32]} />
        <meshStandardMaterial color={COLORS.rug} />
      </mesh>
    </group>
  );
}

/** Locked suitcase by the bed; lid swings open via a flag tween. */
function Suitcase() {
  const lidRef = useFlagTween(FLAGS.suitcaseOpen, {
    rotation: { from: [0, 0, 0], to: [-2.0, 0, 0] },
    speed: 4,
  });
  const open = useGameStore((s) => !!s.flags[FLAGS.suitcaseOpen]);

  return (
    <group>
      {/* body */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.44, 0.7]} />
        <meshStandardMaterial color="#6b4a3a" />
      </mesh>
      {/* latches */}
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.3, 0.36]} castShadow>
          <boxGeometry args={[0.1, 0.08, 0.03]} />
          <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
      {/* lid, hinged at the back top edge */}
      <group ref={lidRef} position={[0, 0.44, -0.35]}>
        <mesh position={[0, 0.05, 0.35]} castShadow>
          <boxGeometry args={[1.1, 0.1, 0.7]} />
          <meshStandardMaterial color="#5d4033" />
        </mesh>
      </group>
      {/* interior + contents, visible once opened */}
      {open && (
        <>
          {/* fabric lining */}
          <mesh position={[0, 0.441, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.04, 0.64]} />
            <meshStandardMaterial color="#7d3b43" roughness={1} />
          </mesh>
          {/* folded clothes — she was packed and ready to leave */}
          <mesh position={[-0.26, 0.475, -0.14]} castShadow>
            <boxGeometry args={[0.44, 0.06, 0.34]} />
            <meshStandardMaterial color={COLORS.blanket} roughness={1} />
          </mesh>
          <mesh position={[-0.22, 0.53, -0.1]} rotation={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[0.36, 0.05, 0.28]} />
            <meshStandardMaterial color={COLORS.wallBeige} roughness={1} />
          </mesh>
          <mesh position={[0.28, 0.47, -0.16]} rotation={[0, -0.1, 0]} castShadow>
            <boxGeometry args={[0.38, 0.05, 0.26]} />
            <meshStandardMaterial color="#5a3b52" roughness={1} />
          </mesh>
          {/* the ticket, tucked against the clothes */}
          <group position={[0.05, 0.452, 0.12]} rotation={[-Math.PI / 2, 0, 0.25]}>
            {/* stock */}
            <mesh>
              <planeGeometry args={[0.5, 0.24]} />
              <meshStandardMaterial color="#efe7cf" />
            </mesh>
            {/* header band */}
            <mesh position={[0, 0.085, 0.001]}>
              <planeGeometry args={[0.5, 0.06]} />
              <meshStandardMaterial color={COLORS.rug} />
            </mesh>
            {/* print lines */}
            {[0.025, -0.02, -0.065].map((y) => (
              <mesh key={y} position={[-0.06, y, 0.001]}>
                <planeGeometry args={[0.3, 0.014]} />
                <meshStandardMaterial color="#5a5347" />
              </mesh>
            ))}
            {/* perforated stub divider + seat block */}
            <mesh position={[0.15, -0.02, 0.001]}>
              <planeGeometry args={[0.006, 0.16]} />
              <meshStandardMaterial color="#b8a98c" />
            </mesh>
            <mesh position={[0.2, -0.02, 0.001]}>
              <planeGeometry args={[0.055, 0.055]} />
              <meshStandardMaterial color="#2c4a6e" />
            </mesh>
          </group>
        </>
      )}
    </group>
  );
}

/** Small brass key revealed under the rug. */
function BedroomKey() {
  return (
    <group>
      {/* Tipped flat (x = π/2) so the bow ring and teeth lie on the
          floorboards instead of standing upright / clipping through. */}
      <group position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0.6]}>
        {/* shaft */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.45, 10]} />
          <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* bow (head ring) */}
        <mesh position={[-0.28, 0, 0]} castShadow>
          <torusGeometry args={[0.09, 0.035, 8, 16]} />
          <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* teeth */}
        <mesh position={[0.16, -0.07, 0]} castShadow>
          <boxGeometry args={[0.05, 0.1, 0.05]} />
          <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0.24, -0.06, 0]} castShadow>
          <boxGeometry args={[0.05, 0.08, 0.05]} />
          <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* worn leather tag tied through the bow */}
        <mesh position={[-0.44, -0.03, 0.03]} rotation={[-Math.PI / 2, 0, 0.35]} castShadow>
          <boxGeometry args={[0.17, 0.012, 0.11]} />
          <meshStandardMaterial color="#6b4a3a" roughness={0.9} />
        </mesh>
      </group>
      <EvidenceShimmer radius={0.32} />
    </group>
  );
}

function CeilingLamp() {
  const { wallHeight } = ROOM;
  const uv = useGameStore((s) => s.lampColor === 'uv');
  const bulbColor = uv ? '#6a2bd8' : COLORS.lampBulb;
  const glowColor = uv ? '#8a2bff' : '#ffd9a0';
  return (
    <group>
      {/* cord */}
      <mesh position={[0, wallHeight - 0.6, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
        <meshStandardMaterial color={COLORS.lampCord} />
      </mesh>
      {/* bulb */}
      <mesh position={[0, wallHeight - 1.25, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color={bulbColor}
          emissive={glowColor}
          emissiveIntensity={uv ? 1.4 : 0.9}
        />
      </mesh>
      {/* glow */}
      <pointLight
        position={[0, wallHeight - 1.3, 0]}
        intensity={uv ? 9 : 6}
        distance={9}
        decay={1.5}
        color={glowColor}
      />
    </group>
  );
}

/**
 * Hidden wall clue — invisible ink that only shows under UV light.
 * Reveal is driven by lerping emissiveIntensity/opacity toward the
 * lamp color state each frame.
 */
function WallClue() {
  const ref = useRef<Group>(null);
  const reveal = useRef(0);
  const uv = useGameStore((s) => s.lampColor === 'uv');

  useFrame((_, dt) => {
    reveal.current = MathUtils.damp(reveal.current, uv ? 1 : 0, 4, dt);
    ref.current?.traverse((obj) => {
      if (!(obj instanceof Mesh) || !obj.userData.isClueInk) return;
      const mat = obj.material;
      if (!(mat instanceof MeshStandardMaterial)) return;
      mat.emissiveIntensity = reveal.current * 2.2;
      mat.opacity = reveal.current;
    });
  });

  const ink = (
    <meshStandardMaterial
      color="#0d081c"
      emissive="#b18cff"
      emissiveIntensity={0}
      transparent
      opacity={0}
    />
  );

  return (
    <group ref={ref}>
      {/* Ink meshes opt out of raycasting: only the UV-gated hitbox below
          is clickable, so the hidden clue is silent until revealed. */}
      {/* circle */}
      <mesh userData={{ isClueInk: true }} raycast={() => null}>
        <torusGeometry args={[0.45, 0.05, 8, 24]} />
        {ink}
      </mesh>
      {/* cross-through bars */}
      <mesh rotation={[0, 0, Math.PI / 4]} userData={{ isClueInk: true }} raycast={() => null}>
        <boxGeometry args={[1.1, 0.07, 0.02]} />
        {ink}
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 4]} userData={{ isClueInk: true }} raycast={() => null}>
        <boxGeometry args={[1.1, 0.07, 0.02]} />
        {ink}
      </mesh>
      {/* three marks beneath */}
      {[-0.2, 0, 0.2].map((x) => (
        <mesh
          key={x}
          position={[x, -0.75, 0]}
          userData={{ isClueInk: true }}
          raycast={() => null}
        >
          <boxGeometry args={[0.06, 0.22, 0.02]} />
          {ink}
        </mesh>
      ))}
      {/* invisible hitbox — only present while the clue is revealed,
          so the hidden clue can't be hovered/clicked by accident */}
      {uv && (
        <mesh>
          <planeGeometry args={[1.4, 1.8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

/**
 * The bedroom door — the level exit, flush against the left (beige) wall.
 * Local space faces +z; the OBJECTS rotation turns it to face the room.
 */
function Door() {
  const doorWood = '#5d4033';
  const frameWood = '#4a3226';
  const brass = { color: '#c9a227', metalness: 0.4, roughness: 0.5 } as const;
  return (
    <group>
      {/* side posts */}
      {[-0.62, 0.62].map((x) => (
        <mesh key={x} position={[x, 1.28, 0.02]} castShadow>
          <boxGeometry args={[0.14, 2.56, 0.14]} />
          <meshStandardMaterial color={frameWood} />
        </mesh>
      ))}
      {/* lintel */}
      <mesh position={[0, 2.53, 0.02]} castShadow>
        <boxGeometry args={[1.38, 0.14, 0.14]} />
        <meshStandardMaterial color={frameWood} />
      </mesh>
      {/* panel */}
      <mesh position={[0, 1.23, 0.03]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 2.46, 0.07]} />
        <meshStandardMaterial color={doorWood} />
      </mesh>
      {/* inset panels (moulding detail) */}
      {[1.75, 0.72].map((y) => (
        <mesh key={y} position={[0, y, 0.07]}>
          <boxGeometry args={[0.8, 0.85, 0.02]} />
          <meshStandardMaterial color="#54392d" />
        </mesh>
      ))}
      {/* knob */}
      <mesh position={[0.42, 1.2, 0.1]} castShadow>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial {...brass} />
      </mesh>
      {/* keyhole plate */}
      <mesh position={[0.42, 1.04, 0.075]}>
        <boxGeometry args={[0.07, 0.14, 0.02]} />
        <meshStandardMaterial {...brass} />
      </mesh>
    </group>
  );
}

/** Blue Room bar matchbox, tray slid half-open, kicked behind the desk. */
function Matchbox() {
  return (
    <group>
      <group position={[0, 0.045, 0]} rotation={[0, 0.5, 0]}>
        {/* sleeve */}
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.09, 0.18]} />
          <meshStandardMaterial color="#2c4a6e" />
        </mesh>
        {/* printed label on top */}
        <mesh position={[0, 0.046, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 0.13]} />
          <meshStandardMaterial color={COLORS.note} />
        </mesh>
        {/* striker strip */}
        <mesh position={[0, 0, 0.091]}>
          <planeGeometry args={[0.22, 0.05]} />
          <meshStandardMaterial color="#3a3a3f" roughness={1} />
        </mesh>
        {/* inner tray, slid open */}
        <mesh position={[0.17, -0.005, 0]} castShadow>
          <boxGeometry args={[0.12, 0.06, 0.16]} />
          <meshStandardMaterial color={COLORS.wallBeige} />
        </mesh>
        {/* match heads peeking out */}
        {[-0.04, 0, 0.04].map((z) => (
          <mesh key={z} position={[0.19, 0.035, z]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshStandardMaterial color="#a3322b" />
          </mesh>
        ))}
      </group>
      <EvidenceShimmer radius={0.24} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Decorations (examine-only, no puzzle state)                          */
/* ------------------------------------------------------------------ */

/** Curtained window on the back wall; the pane follows the time-of-day sky. */
function Window() {
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const sky = useMemo(
    () => new Color('#101a3a').lerp(new Color('#bcd4e8'), timeOfDay),
    [timeOfDay],
  );
  const frameWood = '#4a3226';
  return (
    <group position={[0, 2.1, 0]}>
      {/* sky pane */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[1.3, 1.5]} />
        <meshStandardMaterial color={sky} emissive={sky} emissiveIntensity={0.35} />
      </mesh>
      {/* frame */}
      {[-0.68, 0.68].map((x) => (
        <mesh key={x} position={[x, 0, 0.05]} castShadow>
          <boxGeometry args={[0.1, 1.66, 0.08]} />
          <meshStandardMaterial color={frameWood} />
        </mesh>
      ))}
      {[-0.79, 0.79].map((y) => (
        <mesh key={y} position={[0, y, 0.05]} castShadow>
          <boxGeometry args={[1.46, 0.1, 0.08]} />
          <meshStandardMaterial color={frameWood} />
        </mesh>
      ))}
      {/* muntins */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.05, 1.5, 0.05]} />
        <meshStandardMaterial color={frameWood} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[1.3, 0.05, 0.05]} />
        <meshStandardMaterial color={frameWood} />
      </mesh>
      {/* sill */}
      <mesh position={[0, -0.9, 0.09]} castShadow>
        <boxGeometry args={[1.6, 0.08, 0.2]} />
        <meshStandardMaterial color={frameWood} />
      </mesh>
      {/* curtain rod + curtains that slide shut on their flag */}
      <mesh position={[0, 1.06, 0.14]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 2.5, 8]} />
        <meshStandardMaterial color={COLORS.lampCord} />
      </mesh>
      <Curtain side={-1} />
      <Curtain side={1} />
    </group>
  );
}

/** One curtain panel; slides toward the window center when drawn. */
function Curtain({ side }: { side: -1 | 1 }) {
  const ref = useFlagTween(FLAGS.curtainsClosed, {
    position: { from: [side * 0.98, 0.02, 0.12], to: [side * 0.34, 0.02, 0.12] },
    speed: 4,
  });
  return (
    <group ref={ref} position={[side * 0.98, 0.02, 0.12]}>
      <mesh castShadow>
        <boxGeometry args={[0.6, 2.04, 0.1]} />
        <meshStandardMaterial color="#5a3b52" roughness={1} />
      </mesh>
    </group>
  );
}

/** Nightstand by the bed. Its drawer slides open on a flag tween. */
function Nightstand() {
  const drawerRef = useFlagTween(FLAGS.drawerOpen, {
    position: { from: [0, 0, 0], to: [0, 0, 0.34] },
  });
  return (
    <group>
      {/* top */}
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.06, 0.5]} />
        <meshStandardMaterial color={COLORS.bedFrame} />
      </mesh>
      {/* carcass: sides, back, bottom */}
      {[-0.26, 0.26].map((x) => (
        <mesh key={x} position={[x, 0.38, 0]} castShadow>
          <boxGeometry args={[0.04, 0.42, 0.44]} />
          <meshStandardMaterial color={COLORS.desk} />
        </mesh>
      ))}
      <mesh position={[0, 0.38, -0.2]} castShadow>
        <boxGeometry args={[0.54, 0.42, 0.04]} />
        <meshStandardMaterial color={COLORS.desk} />
      </mesh>
      <mesh position={[0, 0.19, 0]} castShadow>
        <boxGeometry args={[0.54, 0.04, 0.44]} />
        <meshStandardMaterial color={COLORS.desk} />
      </mesh>
      {/* drawer: front panel, knob, tray — slides out together */}
      <group ref={drawerRef}>
        <mesh position={[0, 0.44, 0.21]} castShadow>
          <boxGeometry args={[0.5, 0.32, 0.05]} />
          <meshStandardMaterial color={COLORS.desk} />
        </mesh>
        <mesh position={[0, 0.46, 0.245]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[0.46, 0.05, 0.38]} />
          <meshStandardMaterial color="#8a6a48" />
        </mesh>
      </group>
      {/* legs */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.24, 0.09, sz * 0.19]} castShadow>
            <boxGeometry args={[0.06, 0.18, 0.06]} />
            <meshStandardMaterial color={COLORS.bedFrame} />
          </mesh>
        )),
      )}
    </group>
  );
}

/** Dead alarm clock on the nightstand — hands frozen at 4:00. */
function AlarmClock() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.16, 0.14, 0.08]} />
        <meshStandardMaterial color={COLORS.lampCord} />
      </mesh>
      {/* face */}
      <mesh position={[0, 0, 0.041]}>
        <planeGeometry args={[0.11, 0.09]} />
        <meshStandardMaterial color="#d8e2d0" emissive="#aab89a" emissiveIntensity={0.2} />
      </mesh>
      {/* minute hand — straight up (o'clock sharp) */}
      <mesh position={[0, 0.018, 0.043]}>
        <planeGeometry args={[0.006, 0.036]} />
        <meshStandardMaterial color="#2b2b30" />
      </mesh>
      {/* hour hand — pointing at 4 */}
      <mesh position={[0.009, -0.008, 0.043]} rotation={[0, 0, -2.1]}>
        <planeGeometry args={[0.005, 0.026]} />
        <meshStandardMaterial color="#2b2b30" />
      </mesh>
      {/* twin bells */}
      {[-0.045, 0.045].map((x) => (
        <mesh key={x} position={[x, 0.085, 0]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** Dog-eared paperback lying in the open nightstand drawer. */
function Paperback() {
  return (
    <group>
      <mesh position={[0, 0.38, 0]} rotation={[0, -0.25, 0]} castShadow>
        <boxGeometry args={[0.2, 0.045, 0.28]} />
        <meshStandardMaterial color={COLORS.rug} />
      </mesh>
      {/* page block */}
      <mesh position={[0, 0.38, 0]} rotation={[0, -0.25, 0]}>
        <boxGeometry args={[0.19, 0.035, 0.27]} />
        <meshStandardMaterial color={COLORS.note} />
      </mesh>
    </group>
  );
}

/** Bookshelf against the front wall, three rows of spines + a stack. */
function Bookshelf() {
  const frame = '#5d4033';
  const spines = ['#8a4f57', '#4e7d7a', '#c9a227', '#5a3b52', '#3e5c7a', '#7a5230'];
  return (
    <group>
      {/* sides */}
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 1.1, 0]} castShadow>
          <boxGeometry args={[0.08, 2.2, 0.36]} />
          <meshStandardMaterial color={frame} />
        </mesh>
      ))}
      {/* back panel */}
      <mesh position={[0, 1.1, -0.16]}>
        <boxGeometry args={[1.4, 2.2, 0.04]} />
        <meshStandardMaterial color="#4a3226" />
      </mesh>
      {/* shelves */}
      {[0.08, 0.62, 1.16, 1.7, 2.17].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <boxGeometry args={[1.4, 0.06, 0.36]} />
          <meshStandardMaterial color={frame} />
        </mesh>
      ))}
      {/* rows of spines — one slot left empty on the middle shelf */}
      {[0.65, 1.19, 1.73].map((shelfY, row) =>
        Array.from({ length: 9 }, (_, i) => {
          if (row === 1 && i === 6) return null; // the missing book
          const h = 0.34 + ((i * 7 + row * 3) % 4) * 0.03;
          return (
            <mesh
              key={`${row}-${i}`}
              position={[-0.56 + i * 0.14, shelfY + h / 2, 0.02]}
              castShadow
            >
              <boxGeometry args={[0.11, h, 0.26]} />
              <meshStandardMaterial color={spines[(i + row * 2) % spines.length]} />
            </mesh>
          );
        }),
      )}
      {/* flat stack on the bottom shelf */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[-0.3 + i * 0.02, 0.14 + i * 0.055, 0]}
          rotation={[0, i * 0.16 - 0.1, 0]}
          castShadow
        >
          <boxGeometry args={[0.32, 0.05, 0.24]} />
          <meshStandardMaterial color={spines[(i * 2 + 1) % spines.length]} />
        </mesh>
      ))}
    </group>
  );
}

/** One hinged wardrobe door; swings outward on the wardrobe flag. */
function WardrobeDoor({ side }: { side: -1 | 1 }) {
  const ref = useFlagTween(FLAGS.wardrobeOpen, {
    rotation: { from: [0, 0, 0], to: [0, side * 2.2, 0] },
    speed: 4,
  });
  return (
    <group ref={ref} position={[side * 0.71, 1.1, 0.28]}>
      <mesh position={[side * -0.355, 0, 0]} castShadow>
        <boxGeometry args={[0.71, 2.16, 0.05]} />
        <meshStandardMaterial color="#5d4033" />
      </mesh>
      {/* inset panel */}
      <mesh position={[side * -0.355, 0.05, 0.026]}>
        <planeGeometry args={[0.5, 1.7]} />
        <meshStandardMaterial color="#54392d" />
      </mesh>
      {/* handle near the seam */}
      <mesh position={[side * -0.63, 0, 0.045]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Tall two-door wardrobe; doors swing open to a half-packed interior. */
function Wardrobe() {
  return (
    <group>
      {/* carcass: sides, top, bottom, back */}
      {[-0.71, 0.71].map((x) => (
        <mesh key={x} position={[x, 1.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.08, 2.2, 0.6]} />
          <meshStandardMaterial color="#5d4033" />
        </mesh>
      ))}
      <mesh position={[0, 2.16, 0]} castShadow>
        <boxGeometry args={[1.5, 0.08, 0.6]} />
        <meshStandardMaterial color="#5d4033" />
      </mesh>
      <mesh position={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[1.5, 0.12, 0.6]} />
        <meshStandardMaterial color="#5d4033" />
      </mesh>
      <mesh position={[0, 1.1, -0.27]}>
        <boxGeometry args={[1.5, 2.2, 0.05]} />
        <meshStandardMaterial color="#3a291e" />
      </mesh>
      {/* crown */}
      <mesh position={[0, 2.24, 0]} castShadow>
        <boxGeometry args={[1.6, 0.08, 0.7]} />
        <meshStandardMaterial color="#4a3226" />
      </mesh>
      {/* interior: rail + hangers (most left bare) */}
      <mesh position={[0, 1.85, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 1.3, 8]} />
        <meshStandardMaterial color={COLORS.lampCord} />
      </mesh>
      {[-0.5, -0.32, -0.14, 0.04, 0.22, 0.44].map((x) => (
        <mesh key={x} position={[x, 1.76, 0]}>
          <boxGeometry args={[0.02, 0.16, 0.02]} />
          <meshStandardMaterial color="#8a6a48" />
        </mesh>
      ))}
      {/* the two garments she left behind */}
      <mesh position={[-0.32, 1.32, 0]} castShadow>
        <boxGeometry args={[0.28, 0.85, 0.16]} />
        <meshStandardMaterial color={COLORS.wallTeal} roughness={1} />
      </mesh>
      <mesh position={[0.44, 1.38, 0]} castShadow>
        <boxGeometry args={[0.24, 0.72, 0.14]} />
        <meshStandardMaterial color="#5a3b52" roughness={1} />
      </mesh>
      {/* folded blankets on the floor of the wardrobe */}
      <mesh position={[-0.25, 0.19, 0]} castShadow>
        <boxGeometry args={[0.5, 0.14, 0.4]} />
        <meshStandardMaterial color={COLORS.pillow} roughness={1} />
      </mesh>
      {/* doors */}
      <WardrobeDoor side={-1} />
      <WardrobeDoor side={1} />
    </group>
  );
}

/** Cluster of framed photographs on the right wall. */
function PhotoFrames() {
  const frames: { pos: [number, number, number]; size: [number, number]; photo: string }[] = [
    { pos: [-0.55, 2.3, 0], size: [0.5, 0.62], photo: '#8a97a8' },
    { pos: [0.35, 2.18, 0], size: [0.66, 0.46], photo: '#a89a7d' },
    { pos: [-0.1, 1.6, 0], size: [0.4, 0.4], photo: '#7d8a78' },
  ];
  return (
    <group>
      {frames.map((f, i) => (
        <group key={i} position={f.pos}>
          <mesh castShadow>
            <boxGeometry args={[f.size[0] + 0.08, f.size[1] + 0.08, 0.04]} />
            <meshStandardMaterial color={COLORS.lampCord} />
          </mesh>
          <mesh position={[0, 0, 0.021]}>
            <planeGeometry args={f.size} />
            <meshStandardMaterial color={f.photo} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** A houseplant, five years dead. */
function DeadPlant() {
  return (
    <group>
      {/* pot */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.18, 0.44, 12]} />
        <meshStandardMaterial color="#9c5a3c" roughness={1} />
      </mesh>
      {/* dry soil */}
      <mesh position={[0, 0.43, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.03, 12]} />
        <meshStandardMaterial color="#3e3228" roughness={1} />
      </mesh>
      {/* withered stems, slumped outward */}
      {[
        [0.35, 0.1],
        [-0.3, -0.15],
        [0.08, 0.4],
        [-0.12, -0.35],
      ].map(([lx, lz], i) => (
        <mesh key={i} position={[lx * 0.2, 0.72, lz * 0.2]} rotation={[lz, 0, lx]} castShadow>
          <cylinderGeometry args={[0.012, 0.028, 0.65, 6]} />
          <meshStandardMaterial color="#6e5c3a" roughness={1} />
        </mesh>
      ))}
      {/* dropped leaves */}
      {[
        [0.32, 0.16],
        [-0.28, 0.3],
        [0.1, 0.44],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.005, z]} rotation={[-Math.PI / 2, 0, i * 1.4]}>
          <circleGeometry args={[0.06, 6]} />
          <meshStandardMaterial color="#7a6844" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

const MODELS: Record<string, ComponentType> = {
  bed: Bed,
  desk: Desk,
  rug: Rug,
  lamp: CeilingLamp,
  suitcase: Suitcase,
  'hidden-box': Matchbox,
  'bedroom-key': BedroomKey,
  'wall-symbol': WallClue,
  door: Door,
  window: Window,
  nightstand: Nightstand,
  'alarm-clock': AlarmClock,
  paperback: Paperback,
  bookshelf: Bookshelf,
  wardrobe: Wardrobe,
  'photo-frames': PhotoFrames,
  'dead-plant': DeadPlant,
};

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

/** Ambient + directional light driven by the time-of-day slider. */
function RoomLighting() {
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const ambIntensity = MathUtils.lerp(0.14, 0.55, timeOfDay);
  const dirIntensity = MathUtils.lerp(0.15, 2, timeOfDay);
  const ambColor = useMemo(
    () => new Color('#8899cc').lerp(new Color('#ffe9cf'), timeOfDay),
    [timeOfDay],
  );
  const dirColor = useMemo(
    () => new Color('#7788dd').lerp(new Color('#ffdcb0'), timeOfDay),
    [timeOfDay],
  );
  return (
    <>
      <ambientLight intensity={ambIntensity} color={ambColor} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={dirIntensity}
        color={dirColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
    </>
  );
}

function BedroomScene() {
  return (
    <group>
      {/* Lighting (reacts to time-of-day slider) */}
      <RoomLighting />

      {/* Full room enclosure — walls/ceiling hide themselves based on camera POV */}
      <RoomShell
        width={ROOM.width}
        depth={ROOM.depth}
        height={ROOM.wallHeight}
        floorColor={COLORS.floor}
        ceilingColor="#eae2d3"
        wallColors={{
          back: COLORS.wallTeal,
          front: COLORS.wallTeal,
          left: COLORS.wallBeige,
          right: COLORS.wallBeige,
        }}
      />

      {/* Config-driven objects/hotspots */}
      <RoomObjects objects={OBJECTS} models={MODELS} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Level definition                                                     */
/* ------------------------------------------------------------------ */

const bedroom: LevelConfig = {
  id: 'bedroom',
  name: 'The Bedroom',
  Scene: BedroomScene,
  lightingPanel: true,
  objective: {
    text: 'Search the bedroom. Vera left more here than the report ever mentioned.',
    clueItems: ['bedroom_key', 'matchbox', 'train_ticket', 'wall_symbol_clue'],
    completeWhenItems: DOOR_REQUIRES,
    completeText: 'The brass key fits the bedroom door. Unlock it when you’re ready to move on.',
  },
};

export default bedroom;
