/**
 * Level: The Kitchen (Chapter 3).
 * Where Vera's last night actually happened. The visitor's traces are
 * here (two glasses, the gift bottle, the note in the bin) — and so is
 * Vera's cleverest hide. Puzzle chain:
 *   1. Two glasses on the counter → collect; then under UV light a
 *      crystalline residue appears inside glass one (the murder weapon).
 *   2. The wine bottle: examine first (the tag is turned face-down),
 *      then collect the gift tag.
 *   3. The bin: tip it over, then sift the spilled trash — two red
 *      herrings and the crumpled note.
 *   4. The shelf of oddments → dedicated full-page shadow-alignment
 *      puzzle. Solving it marks a loose wall tile, which pivots out to
 *      reveal the Blue Room photograph.
 *
 * Puzzle state uses namespaced flags in the global store (kitchen.*).
 */
import { useMemo, useRef, type ComponentType } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial, type Group } from 'three';
import { useGameStore } from '../store/gameStore';
import { playSound } from '../engine/feedback';
import { useFlagTween } from '../engine/useFlagTween';
import RoomObjects from '../components/RoomObjects';
import RoomShell from '../components/RoomShell';
import type { LevelConfig, RoomObjectConfig } from './types';

const ROOM = { width: 10, depth: 10, wallHeight: 4 };

const COLORS = {
  tileA: '#b3aa99',
  tileB: '#8f887a',
  wallBack: '#5d6a63',
  wallSide: '#6d7a72',
  counter: '#42524a',
  counterTop: '#d8d2c6',
  wood: '#4a3526',
  metal: '#8a8f96',
  paper: '#e9e4d2',
  brass: '#c9a227',
  lampBulb: '#ffe9b8',
  glass: '#cfe0e4',
};

/** Namespaced puzzle flags for this room. */
const FLAGS = {
  binTipped: 'kitchen.binTipped',
  bottleExamined: 'kitchen.bottleExamined',
  shadowSolved: 'kitchen.shadowSolved',
  tileOpen: 'kitchen.tileOpen',
};

/** Items needed before the stairwell door will open. */
const DOOR_REQUIRES = [
  'two_glasses',
  'poison_residue',
  'wine_gift',
  'crumpled_note',
  'blue_room_photo',
];

/** Guards against a double-click firing the level transition twice. */
let doorOpening = false;

/** Staged door logic: locked → hint → unlock + transition to Chapter 4. */
function openKitchenDoor() {
  const s = useGameStore.getState();
  if (doorOpening) return;
  const found = DOOR_REQUIRES.filter((id) => s.inventory.includes(id)).length;
  if (found < DOOR_REQUIRES.length) {
    playSound('deny');
    const left = DOOR_REQUIRES.length - found;
    s.showToast(
      `The stairwell door won't give. ${left} thread${
        left === 1 ? '' : 's'
      } of that night ${left === 1 ? 'is' : 'are'} still loose in this kitchen.`,
    );
    return;
  }
  doorOpening = true;
  playSound('success');
  s.showToast('The latch lifts. The stairs where they found her wait beyond.');
  window.setTimeout(() => {
    const now = useGameStore.getState();
    if (now.phase === 'playing' && now.currentLevel === 'kitchen') now.setLevel('stairwell');
    doorOpening = false;
  }, 900);
}

/* ------------------------------------------------------------------ */
/* Object/hotspot config                                                */
/* ------------------------------------------------------------------ */

const OBJECTS: RoomObjectConfig[] = [
  {
    id: 'two-glasses',
    name: 'two wine glasses',
    position: [-1.4, 0.97, -4.25],
    interactable: true,
    // The glasses stay on the counter; only the observation is logged.
    interaction: {
      type: 'custom',
      run: (s) => {
        if (!s.inventory.includes('two_glasses')) {
          s.addItem('two_glasses');
          playSound('success');
          s.showToast(
            'Two poured glasses, five years dry. No forced entry anywhere. She poured wine for whoever killed her.',
          );
        } else {
          s.openModal({
            kind: 'examine',
            title: 'Two Wine Glasses',
            text: 'Logged. Two glasses, one visitor she trusted. The dried wine has crusted black — but something about glass one catches no light at all. Maybe it would under a different light.',
          });
        }
      },
    },
  },
  {
    id: 'residue',
    name: 'residue in glass one',
    position: [-1.55, 0.97, -4.25],
    interactable: true,
    // The glow (and its hitbox) only exists under UV — see ResidueGlow.
    visible: (s) => s.inventory.includes('two_glasses') && !s.inventory.includes('poison_residue'),
    interaction: {
      type: 'collect',
      item: 'poison_residue',
      actions: [
        {
          toast:
            'Under UV: a crystalline ring inside glass one only. The fall didn’t kill her — the wine did.',
        },
      ],
    },
  },
  {
    id: 'wine-bottle',
    name: 'wine bottle',
    position: [-0.55, 0.97, -4.3],
    interactable: true,
    // Staged: first look flips the tag, second click bags it.
    interaction: {
      type: 'custom',
      run: (s) => {
        if (s.inventory.includes('wine_gift')) {
          s.openModal({
            kind: 'examine',
            title: 'Wine Bottle',
            text: 'An expensive vintage, no dust ring on her rack to match — it walked in that night. The gift tag is bagged and logged.',
          });
        } else if (!s.flags[FLAGS.bottleExamined]) {
          s.setFlag(FLAGS.bottleExamined);
          playSound('click');
          s.openModal({
            kind: 'examine',
            title: 'Wine Bottle',
            text: 'Expensive, and not from her rack — no dust ring matches it anywhere in the kitchen. A small tag hangs from the neck on a ribbon, turned face-down. Turn it over?',
          });
        } else {
          s.addItem('wine_gift');
          playSound('success');
          s.showToast('The tag, handwritten: "To the next chapter — M."');
        }
      },
    },
  },
  {
    id: 'bin',
    name: 'kitchen bin',
    position: [2.4, 0, -3.7],
    interactable: true,
    interaction: {
      type: 'custom',
      run: (s) => {
        if (!s.flags[FLAGS.binTipped]) {
          s.setFlag(FLAGS.binTipped);
          playSound('slide');
          s.showToast('The bin goes over. Five-year-old trash fans across the tile.');
        } else {
          s.openModal({
            kind: 'examine',
            title: 'Kitchen Bin',
            text: 'Tipped and emptied. Whatever this room still owes you is in the spill.',
          });
        }
      },
    },
  },
  {
    id: 'trash-receipt',
    name: 'faded receipt',
    position: [2.0, 0.02, -3.25],
    interactable: true,
    visible: (s) => !!s.flags[FLAGS.binTipped],
    interaction: {
      type: 'examine',
      title: 'Faded Receipt',
      text: 'A grocery receipt from October 13th. Coffee, bread, apples. The mundane last shopping trip of someone who expected more Tuesdays.',
    },
  },
  {
    id: 'trash-list',
    name: 'grocery list',
    position: [2.85, 0.02, -3.35],
    interactable: true,
    visible: (s) => !!s.flags[FLAGS.binTipped],
    interaction: {
      type: 'examine',
      title: 'Grocery List',
      text: 'Her handwriting: milk, bread, batteries — and "wine", crossed out hard. She didn’t buy the bottle on the counter. It was brought.',
    },
  },
  {
    id: 'trash-note',
    name: 'crumpled note',
    position: [2.45, 0.02, -2.95],
    interactable: true,
    visible: (s) => !!s.flags[FLAGS.binTipped] && !s.inventory.includes('crumpled_note'),
    interaction: {
      type: 'collect',
      item: 'crumpled_note',
      actions: [
        {
          toast:
            'Smoothed flat: "Keep the ledger page close. I’ll come to you — M." The visitor wanted the evidence waiting.',
        },
      ],
    },
  },
  {
    id: 'oddments-shelf',
    name: 'shelf of oddments',
    position: [-4.86, 1.9, 1.2],
    rotation: [0, Math.PI / 2, 0],
    interactable: true,
    // Opens the dedicated full-page shadow-alignment puzzle.
    interaction: {
      type: 'custom',
      run: (s) => {
        if (s.flags[FLAGS.shadowSolved]) {
          s.openModal({
            kind: 'examine',
            title: 'Shelf of Oddments',
            text: 'The three bronzes stand aligned, their shadows resting inside her pencil lines. The tile below the sill already gave up what it kept.',
          });
          return;
        }
        s.openModal({
          kind: 'shadow',
          title: 'The Shelf of Oddments',
          prompt:
            'Three bronzes, a swing-arm lamp, and pencil lines on the wall. Swing the lamp and turn each piece until its shadow sits inside her marks.',
          onSuccess: [
            { flag: FLAGS.shadowSolved },
            { sound: 'slide' },
            {
              toast:
                'The three tally shadows fall across one tile below the shelf — and it sits a hair proud of its neighbors.',
            },
          ],
        });
      },
    },
  },
  {
    id: 'pencil-marks',
    name: 'pencil marks',
    position: [-4.94, 1.95, 2.5],
    rotation: [0, Math.PI / 2, 0],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Pencil Marks',
      text: 'Faint pencil on the plaster: a circle, a crossed pair of lines, three short strokes — drawn at exactly the height a lamp would throw a shadow from that shelf. Not decoration. A template.',
    },
  },
  {
    id: 'loose-tile',
    name: 'loose tile',
    position: [-4.9, 0.95, 1.2],
    rotation: [0, Math.PI / 2, 0],
    interactable: true,
    visible: (s) => !!s.flags[FLAGS.shadowSolved],
    interaction: {
      type: 'custom',
      run: (s) => {
        if (!s.flags[FLAGS.tileOpen]) {
          s.setFlag(FLAGS.tileOpen);
          playSound('slide');
          s.showToast('The tile pivots out of the wall. Behind it, wrapped in wax paper: a photograph.');
        } else {
          s.openModal({
            kind: 'examine',
            title: 'Loose Tile',
            text: 'A shallow recess chiselled into the wall, sized for exactly one thing. Vera built her own evidence locker.',
          });
        }
      },
    },
  },
  {
    id: 'blue-room-photo',
    name: 'photograph',
    position: [-4.7, 0.95, 1.2],
    rotation: [0, Math.PI / 2, 0],
    interactable: true,
    visible: (s) => !!s.flags[FLAGS.tileOpen] && !s.inventory.includes('blue_room_photo'),
    interaction: {
      type: 'collect',
      item: 'blue_room_photo',
      // Show the actual print on pickup (re-viewable from the case file).
      actions: [
        {
          openModal: {
            kind: 'photo',
            photoId: 'blue_room',
            title: 'Photograph — The Blue Room',
            caption:
              '"Iris" passes the ledger page across a Blue Room table, Oct 14. In the bar mirror: Marcus Hale, half-turned away — circled in red grease pencil, in Vera\u2019s own hand. She knew she\u2019d been followed.',
          },
        },
      ],
    },
  },
  {
    id: 'sink',
    name: 'sink',
    position: [-2.5, 0, -4.35],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Sink',
      text: 'Five years dry. A dish towel hangs folded once, precisely. Vera never folded anything — someone tidied up on their way out.',
    },
  },
  {
    id: 'stove',
    name: 'stove',
    position: [1.55, 0, -4.35],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Stove',
      text: 'The kettle still sits on the back burner, half full. She was going to make coffee for the road — the 11:40 train was three stops away.',
    },
  },
  {
    id: 'fridge',
    name: 'refrigerator',
    position: [4.15, 0, -4.3],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Refrigerator',
      text: 'Under a magnet, a snapshot: Vera and her editor at a press gala, his arm around her shoulders. Marcus Hale, grinning at the camera. She kept it at eye level. She trusted him.',
    },
  },
  {
    id: 'table',
    name: 'kitchen table',
    position: [1.0, 0, 1.5],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Kitchen Table',
      text: 'One chair pulled out and angled toward the counter. The other tucked in tight, unused. The visitor never sat down — they stood, and watched her drink.',
    },
  },
  {
    id: 'window',
    name: 'window',
    position: [-2.5, 0, -4.94],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Window',
      text: 'Over the sink, looking onto the back garden. From here you can see the trampled path below the office window — whoever circled the house that night checked every room before knocking.',
    },
  },
  {
    id: 'lamp',
    name: 'pendant lamp',
    position: [1.0, 0, 1.5],
    interactable: true,
    interaction: { type: 'custom', run: () => useGameStore.getState().toggleLightPanel() },
  },
  {
    id: 'door',
    name: 'stairwell door',
    position: [4.96, 0, 1.8],
    rotation: [0, -Math.PI / 2, 0],
    interactable: true,
    interaction: { type: 'custom', run: () => openKitchenDoor() },
  },
];

/* ------------------------------------------------------------------ */
/* Models                                                               */
/* ------------------------------------------------------------------ */

/** Soft pulsing gold ring under collectible proof pieces. */
function EvidenceShimmer({ radius = 0.26, y = 0.02 }: { radius?: number; y?: number }) {
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

/** Two dried wine glasses on the counter. */
function TwoGlasses() {
  const glassMat = (
    <meshStandardMaterial color={COLORS.glass} transparent opacity={0.4} roughness={0.15} />
  );
  return (
    <group>
      {[-0.15, 0.15].map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          {/* bowl */}
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.04, 0.12, 12, 1, true]} />
            {glassMat}
          </mesh>
          {/* dried wine crust */}
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.038, 0.036, 0.02, 12]} />
            <meshStandardMaterial color={i === 0 ? '#2e1218' : '#3a1a20'} />
          </mesh>
          {/* stem + foot */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.1, 8]} />
            {glassMat}
          </mesh>
          <mesh position={[0, 0.005, 0]}>
            <cylinderGeometry args={[0.04, 0.045, 0.01, 12]} />
            {glassMat}
          </mesh>
        </group>
      ))}
      <EvidenceShimmer radius={0.3} y={0.005} />
    </group>
  );
}

/** UV-only crystalline glow inside glass one (WallClue pattern: the
 *  glow damps in with the lamp mode, and the hitbox exists only in UV). */
function ResidueGlow() {
  const ref = useRef<Group>(null);
  const reveal = useRef(0);
  const uv = useGameStore((s) => s.lampColor === 'uv');

  useFrame((_, dt) => {
    reveal.current = MathUtils.damp(reveal.current, uv ? 1 : 0, 4, dt);
    ref.current?.traverse((obj) => {
      if (!(obj instanceof Mesh) || !obj.userData.isResidue) return;
      const mat = obj.material;
      if (!(mat instanceof MeshStandardMaterial)) return;
      mat.emissiveIntensity = reveal.current * 2.4;
      mat.opacity = reveal.current;
    });
  });

  return (
    <group ref={ref}>
      <mesh position={[0, 0.14, 0]} userData={{ isResidue: true }} raycast={() => null}>
        <torusGeometry args={[0.045, 0.012, 8, 20]} />
        <meshStandardMaterial
          color="#0d1c14"
          emissive="#8affc8"
          emissiveIntensity={0}
          transparent
          opacity={0}
        />
      </mesh>
      {uv && (
        <mesh position={[0, 0.14, 0]}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

/** The gift bottle — expensive, out of place, tag on a ribbon. */
function WineBottle() {
  const tagged = useGameStore((s) => !s.inventory.includes('wine_gift'));
  return (
    <group rotation={[0, -0.4, 0]}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 0.28, 12]} />
        <meshStandardMaterial color="#1e3226" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.33, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.045, 0.12, 10]} />
        <meshStandardMaterial color="#1e3226" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.03, 8]} />
        <meshStandardMaterial color="#7a1f2b" />
      </mesh>
      {/* label */}
      <mesh position={[0, 0.14, 0.056]}>
        <planeGeometry args={[0.07, 0.12]} />
        <meshStandardMaterial color={COLORS.paper} />
      </mesh>
      {/* gift tag on a ribbon (gone once bagged) */}
      {tagged && (
        <group position={[0.06, 0.3, 0.03]} rotation={[0.2, 0, -0.5]}>
          <mesh castShadow>
            <boxGeometry args={[0.07, 0.05, 0.005]} />
            <meshStandardMaterial color="#e7dcc2" />
          </mesh>
        </group>
      )}
      <EvidenceShimmer radius={0.22} y={0.002} />
    </group>
  );
}

/** Kitchen bin — tips over on its flag (rotation tween). */
function Bin() {
  const ref = useFlagTween(FLAGS.binTipped, {
    rotation: { from: [0, 0, 0], to: [Math.PI / 2 - 0.12, 0, 0.3] },
    position: { from: [0, 0, 0], to: [0, -0.12, 0.18] },
    speed: 6,
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.19, 0.6, 14, 1, true]} />
        <meshStandardMaterial color="#5a6a5f" metalness={0.3} roughness={0.6} side={2} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.03, 14]} />
        <meshStandardMaterial color="#4a5a52" metalness={0.3} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** A crumpled paper ball in the trash spill. */
function PaperBall({ tone = '#ddd6c2', scale = 1 }: { tone?: string; scale?: number }) {
  return (
    <mesh position={[0, 0.06 * scale, 0]} castShadow scale={scale}>
      <icosahedronGeometry args={[0.07, 0]} />
      <meshStandardMaterial color={tone} roughness={1} />
    </mesh>
  );
}

function TrashReceipt() {
  return <PaperBall tone="#d8d2c6" scale={0.9} />;
}

function TrashList() {
  return <PaperBall tone="#e7dcc2" scale={0.85} />;
}

/** The crumpled note — the ball that matters gets the shimmer. */
function TrashNote() {
  return (
    <group>
      <PaperBall tone="#e9e4d2" />
      <EvidenceShimmer radius={0.18} y={0.005} />
    </group>
  );
}

/** Shelf of oddments on the left wall: three small bronzes + lamp. */
function OddmentsShelf() {
  return (
    <group>
      {/* board + brackets */}
      <mesh castShadow>
        <boxGeometry args={[1.5, 0.06, 0.32]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, -0.12, -0.1]} castShadow>
          <boxGeometry args={[0.05, 0.2, 0.1]} />
          <meshStandardMaterial color={COLORS.wood} />
        </mesh>
      ))}
      {/* ring bronze */}
      <group position={[-0.45, 0.17, 0]} rotation={[0, 0.7, 0]}>
        <mesh castShadow>
          <torusGeometry args={[0.1, 0.018, 8, 20]} />
          <meshStandardMaterial color="#4a3b28" metalness={0.45} roughness={0.5} />
        </mesh>
      </group>
      {/* crossed bars bronze */}
      <group position={[0, 0.15, 0]} rotation={[0, -0.5, 0]}>
        {[Math.PI / 4, -Math.PI / 4].map((r) => (
          <mesh key={r} rotation={[0, 0, r]} castShadow>
            <boxGeometry args={[0.22, 0.03, 0.02]} />
            <meshStandardMaterial color="#4a3b28" metalness={0.45} roughness={0.5} />
          </mesh>
        ))}
      </group>
      {/* three pins bronze */}
      <group position={[0.45, 0.14, 0]} rotation={[0, 0.9, 0]}>
        {[-0.05, 0, 0.05].map((x) => (
          <mesh key={x} position={[x, 0, 0]} castShadow>
            <boxGeometry args={[0.018, 0.16, 0.015]} />
            <meshStandardMaterial color="#4a3b28" metalness={0.45} roughness={0.5} />
          </mesh>
        ))}
      </group>
      {/* small swing-arm lamp clamped to the shelf end */}
      <group position={[0.68, 0.03, 0.08]}>
        <mesh position={[0, 0.12, 0]} rotation={[0, 0, -0.5]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.3, 8]} />
          <meshStandardMaterial color="#2e3138" />
        </mesh>
        <mesh position={[-0.09, 0.25, 0.02]} rotation={[0.7, 0, 0.5]}>
          <cylinderGeometry args={[0.04, 0.07, 0.09, 10, 1, true]} />
          <meshStandardMaterial color="#2e3138" emissive="#ffd9a0" emissiveIntensity={0.4} side={2} />
        </mesh>
      </group>
    </group>
  );
}

/** Vera's pencil template on the plaster, faint but findable. */
function PencilMarks() {
  const pencil = (
    <meshStandardMaterial color="#3d4640" transparent opacity={0.85} />
  );
  return (
    <group scale={0.55}>
      <mesh>
        <ringGeometry args={[0.4, 0.44, 28]} />
        {pencil}
      </mesh>
      {[Math.PI / 4, -Math.PI / 4].map((r) => (
        <mesh key={r} position={[1.0, 0, 0]} rotation={[0, 0, r]}>
          <planeGeometry args={[0.8, 0.05]} />
          {pencil}
        </mesh>
      ))}
      {[-0.2, 0, 0.2].map((x) => (
        <mesh key={x} position={[2.0 + x, 0, 0]}>
          <planeGeometry args={[0.045, 0.5]} />
          {pencil}
        </mesh>
      ))}
    </group>
  );
}

/** The loose tile — pivots out of the wall once the shadows mark it. */
function LooseTile() {
  const ref = useFlagTween(FLAGS.tileOpen, {
    position: { from: [0, 0, 0], to: [0.12, 0, 0.22] },
    rotation: { from: [0, 0, 0], to: [0, 0.9, 0] },
    speed: 4,
  });
  const marked = useGameStore((s) => !s.flags[FLAGS.tileOpen]);
  return (
    <group>
      {/* recess behind the tile */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[0.42, 0.42]} />
        <meshStandardMaterial color="#17191d" />
      </mesh>
      <group ref={ref}>
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.42, 0.04]} />
          <meshStandardMaterial color={COLORS.tileA} />
        </mesh>
        {/* the shadow-marked scuff on its face */}
        {marked && (
          <mesh position={[0, 0, 0.021]}>
            <planeGeometry args={[0.05, 0.3]} />
            <meshStandardMaterial color="#3d4640" transparent opacity={0.5} />
          </mesh>
        )}
      </group>
    </group>
  );
}

/** The Blue Room photograph, wrapped in wax paper inside the recess. */
function BlueRoomPhoto() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.26, 0.32, 0.01]} />
        <meshStandardMaterial color="#dcd4c4" />
      </mesh>
      <mesh position={[0, 0.02, 0.007]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshStandardMaterial color="#36506b" />
      </mesh>
      {/* vertical shimmer so it reads against the wall */}
      <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.06]}>
        <EvidenceShimmer radius={0.22} y={0} />
      </group>
    </group>
  );
}

/** Counter run along the back wall with cabinet fronts. */
function Counter() {
  return (
    <group>
      <mesh position={[-1.0, 0.46, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.6, 0.92, 0.85]} />
        <meshStandardMaterial color={COLORS.counter} />
      </mesh>
      <mesh position={[-1.0, 0.945, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.7, 0.05, 0.95]} />
        <meshStandardMaterial color={COLORS.counterTop} />
      </mesh>
      {/* cabinet fronts + knobs */}
      {[-3.2, -2.1, -1.0, 0.1, 1.2].map((x) => (
        <group key={x} position={[x, 0.45, 0.43]}>
          <mesh>
            <boxGeometry args={[0.95, 0.78, 0.02]} />
            <meshStandardMaterial color="#3a4a42" />
          </mesh>
          <mesh position={[0.35, 0, 0.02]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color={COLORS.brass} metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Sink basin set into the counter + faucet, below the window. */
function Sink() {
  return (
    <group>
      <mesh position={[0, 0.93, 0]}>
        <boxGeometry args={[0.7, 0.1, 0.5]} />
        <meshStandardMaterial color={COLORS.metal} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.96, 0]}>
        <boxGeometry args={[0.6, 0.06, 0.4]} />
        <meshStandardMaterial color="#5a5f66" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* faucet */}
      <mesh position={[0, 1.12, -0.2]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.24, 8]} />
        <meshStandardMaterial color={COLORS.metal} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.24, -0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.18, 8]} />
        <meshStandardMaterial color={COLORS.metal} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* folded dish towel */}
      <mesh position={[0.45, 0.99, 0.1]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.22, 0.02, 0.16]} />
        <meshStandardMaterial color="#7a3f46" roughness={1} />
      </mesh>
    </group>
  );
}

/** Freestanding stove with burners and a kettle. */
function Stove() {
  return (
    <group>
      <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.92, 0.85]} />
        <meshStandardMaterial color="#d8d2c6" metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.935, 0]}>
        <boxGeometry args={[1.0, 0.03, 0.85]} />
        <meshStandardMaterial color="#2e3138" metalness={0.4} roughness={0.5} />
      </mesh>
      {[-0.22, 0.22].map((x) =>
        [-0.18, 0.18].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.955, z]}>
            <cylinderGeometry args={[0.1, 0.1, 0.015, 12]} />
            <meshStandardMaterial color="#1e2125" metalness={0.4} roughness={0.6} />
          </mesh>
        )),
      )}
      {/* oven door + handle */}
      <mesh position={[0, 0.45, 0.43]}>
        <boxGeometry args={[0.8, 0.5, 0.02]} />
        <meshStandardMaterial color="#c8c2b6" metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.72, 0.45]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.7, 8]} />
        <meshStandardMaterial color={COLORS.metal} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* the kettle, still waiting */}
      <group position={[0.22, 0.96, -0.18]}>
        <mesh position={[0, 0.09, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.16, 12]} />
          <meshStandardMaterial color="#8a4f57" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.19, 0]} castShadow>
          <coneGeometry args={[0.05, 0.06, 10]} />
          <meshStandardMaterial color="#8a4f57" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0.1, 0.1, 0]} rotation={[0, 0, -0.6]} castShadow>
          <cylinderGeometry args={[0.015, 0.02, 0.1, 8]} />
          <meshStandardMaterial color="#8a4f57" metalness={0.3} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/** Refrigerator in the back-right corner, with the gala snapshot. */
function Fridge() {
  return (
    <group>
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 2.0, 0.85]} />
        <meshStandardMaterial color="#c8c2b6" metalness={0.2} roughness={0.55} />
      </mesh>
      {/* door split + handles */}
      <mesh position={[0, 1.35, 0.428]}>
        <boxGeometry args={[0.95, 0.02, 0.01]} />
        <meshStandardMaterial color="#8a8578" />
      </mesh>
      {[1.6, 1.1].map((y) => (
        <mesh key={y} position={[-0.38, y, 0.45]}>
          <boxGeometry args={[0.04, 0.25, 0.04]} />
          <meshStandardMaterial color={COLORS.metal} metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* gala snapshot under a magnet */}
      <mesh position={[0.12, 1.62, 0.432]} rotation={[0, 0, 0.08]}>
        <planeGeometry args={[0.16, 0.2]} />
        <meshStandardMaterial color="#dcd4c4" />
      </mesh>
      <mesh position={[0.12, 1.72, 0.436]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.01, 8]} />
        <meshStandardMaterial color="#d6453a" />
      </mesh>
    </group>
  );
}

/** Kitchen table + two chairs (one pulled out, one tucked). */
function Table() {
  const chair = (rot: number, pos: [number, number, number]) => (
    <group position={pos} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.42, 0.05, 0.42]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
      <mesh position={[0, 0.72, -0.19]} castShadow>
        <boxGeometry args={[0.42, 0.5, 0.05]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.17, 0.22, sz * 0.17]} castShadow>
            <boxGeometry args={[0.05, 0.44, 0.05]} />
            <meshStandardMaterial color={COLORS.wood} />
          </mesh>
        )),
      )}
    </group>
  );
  return (
    <group>
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.85, 0.85, 0.06, 20]} />
        <meshStandardMaterial color="#6b4a36" />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.76, 10]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
      {/* pulled-out chair, angled toward the counter */}
      {chair(2.6, [-0.95, 0, -0.55])}
      {/* tucked chair */}
      {chair(Math.PI, [0.4, 0, 0.95])}
      {/* dusty fruit bowl */}
      <mesh position={[0.1, 0.84, 0.1]} castShadow>
        <cylinderGeometry args={[0.18, 0.1, 0.08, 14, 1, true]} />
        <meshStandardMaterial color="#3e5c4a" side={2} />
      </mesh>
    </group>
  );
}

/** Window over the sink (sky lerps with time of day, like the office). */
function Window() {
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const sky = useMemo(
    () => new Color('#101a3a').lerp(new Color('#bcd4e8'), timeOfDay),
    [timeOfDay],
  );
  return (
    <group position={[0, 2.3, 0]}>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[1.2, 1.1]} />
        <meshStandardMaterial color={sky} emissive={sky} emissiveIntensity={0.35} />
      </mesh>
      {[-0.63, 0.63].map((x) => (
        <mesh key={x} position={[x, 0, 0.05]} castShadow>
          <boxGeometry args={[0.1, 1.26, 0.08]} />
          <meshStandardMaterial color={COLORS.wood} />
        </mesh>
      ))}
      {[-0.59, 0.59].map((y) => (
        <mesh key={y} position={[0, y, 0.05]} castShadow>
          <boxGeometry args={[1.36, 0.1, 0.08]} />
          <meshStandardMaterial color={COLORS.wood} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.05, 1.1, 0.05]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
      {/* café curtain rod + half curtain */}
      <mesh position={[0, -0.1, 0.09]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 1.24, 8]} />
        <meshStandardMaterial color={COLORS.brass} metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[-0.35, -0.35, 0.1]}>
        <boxGeometry args={[0.5, 0.5, 0.03]} />
        <meshStandardMaterial color="#7a3f46" roughness={1} />
      </mesh>
    </group>
  );
}

/** Pendant lamp over the table — UV-capable, mirrors the other rooms. */
function PendantLamp() {
  const { wallHeight } = ROOM;
  const uv = useGameStore((s) => s.lampColor === 'uv');
  const bulbColor = uv ? '#6a2bd8' : COLORS.lampBulb;
  const glowColor = uv ? '#8a2bff' : '#ffd9a0';
  return (
    <group>
      <mesh position={[0, wallHeight - 0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.0, 8]} />
        <meshStandardMaterial color="#2b2b30" />
      </mesh>
      {/* enamel shade */}
      <mesh position={[0, wallHeight - 1.05, 0]} castShadow>
        <coneGeometry args={[0.32, 0.28, 16, 1, true]} />
        <meshStandardMaterial color="#3e5c4a" side={2} />
      </mesh>
      <mesh position={[0, wallHeight - 1.15, 0]}>
        <sphereGeometry args={[0.12, 14, 14]} />
        <meshStandardMaterial color={bulbColor} emissive={glowColor} emissiveIntensity={uv ? 1.4 : 0.9} />
      </mesh>
      <pointLight
        position={[0, wallHeight - 1.25, 0]}
        intensity={uv ? 9 : 6}
        distance={9}
        decay={1.5}
        color={glowColor}
      />
    </group>
  );
}

/** Stairwell door on the right wall (level exit). */
function Door() {
  const frameWood = '#3a2a1e';
  return (
    <group>
      {[-0.62, 0.62].map((x) => (
        <mesh key={x} position={[x, 1.28, 0.02]} castShadow>
          <boxGeometry args={[0.14, 2.56, 0.14]} />
          <meshStandardMaterial color={frameWood} />
        </mesh>
      ))}
      <mesh position={[0, 2.53, 0.02]} castShadow>
        <boxGeometry args={[1.38, 0.14, 0.14]} />
        <meshStandardMaterial color={frameWood} />
      </mesh>
      <mesh position={[0, 1.23, 0.03]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 2.46, 0.07]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
      {[1.75, 0.72].map((y) => (
        <mesh key={y} position={[0, y, 0.07]}>
          <boxGeometry args={[0.8, 0.85, 0.02]} />
          <meshStandardMaterial color={frameWood} />
        </mesh>
      ))}
      <mesh position={[0.42, 1.2, 0.1]} castShadow>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={COLORS.brass} metalness={0.4} roughness={0.5} />
      </mesh>
      {/* old thumb latch above the knob */}
      <mesh position={[0.42, 1.38, 0.08]}>
        <boxGeometry args={[0.1, 0.05, 0.04]} />
        <meshStandardMaterial color={COLORS.metal} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Static dressing: checkerboard tiles, upper cabinets, pans, clutter. */
function Decor() {
  const tiles = useMemo(() => {
    const list: Array<{ x: number; z: number; c: string }> = [];
    for (let i = 0; i < 10; i++)
      for (let j = 0; j < 10; j++)
        list.push({
          x: -4.5 + i,
          z: -4.5 + j,
          c: (i + j) % 2 === 0 ? COLORS.tileA : COLORS.tileB,
        });
    return list;
  }, []);
  return (
    <group>
      {/* checkerboard floor */}
      {tiles.map(({ x, z, c }) => (
        <mesh key={`${x}${z}`} position={[x, 0.005, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[0.96, 0.96]} />
          <meshStandardMaterial color={c} roughness={0.9} />
        </mesh>
      ))}
      {/* upper cabinets flanking the window */}
      {[-4.0, -1.0].map((x) => (
        <group key={x} position={[x, 2.6, -4.7]}>
          <mesh castShadow>
            <boxGeometry args={[1.4, 0.9, 0.55]} />
            <meshStandardMaterial color={COLORS.counter} />
          </mesh>
          {[-0.34, 0.34].map((dx) => (
            <mesh key={dx} position={[dx, 0, 0.285]}>
              <boxGeometry args={[0.62, 0.82, 0.02]} />
              <meshStandardMaterial color="#3a4a42" />
            </mesh>
          ))}
          {[-0.08, 0.08].map((dx) => (
            <mesh key={dx} position={[dx, -0.15, 0.31]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color={COLORS.brass} metalness={0.4} roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
      {/* hanging pans on a rail over the stove */}
      <mesh position={[1.55, 2.15, -4.85]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 1.2, 8]} />
        <meshStandardMaterial color={COLORS.metal} metalness={0.6} roughness={0.3} />
      </mesh>
      {[-0.35, 0, 0.35].map((dx, i) => (
        <group key={dx} position={[1.55 + dx, 1.95, -4.82]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.12 + i * 0.03, 0.12 + i * 0.03, 0.05, 14]} />
            <meshStandardMaterial color="#2e3138" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.18, 6]} />
            <meshStandardMaterial color={COLORS.metal} metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* dish rack + a single clean glass (the towel's story) */}
      <group position={[-3.3, 0.97, -4.3]}>
        <mesh>
          <boxGeometry args={[0.5, 0.04, 0.35]} />
          <meshStandardMaterial color={COLORS.metal} metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0.1, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.035, 0.14, 10, 1, true]} />
          <meshStandardMaterial color={COLORS.glass} transparent opacity={0.35} roughness={0.15} side={2} />
        </mesh>
      </group>
      {/* breadbox + canisters on the far counter */}
      <group position={[0.1, 0.97, -4.3]}>
        <mesh position={[0, 0.14, 0]} castShadow>
          <boxGeometry args={[0.5, 0.28, 0.3]} />
          <meshStandardMaterial color={COLORS.wood} />
        </mesh>
        {[-0.45, -0.62].map((x, i) => (
          <mesh key={x} position={[x, 0.1 - i * 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.06 - i * 0.01, 0.06 - i * 0.01, 0.2 - i * 0.04, 10]} />
            <meshStandardMaterial color="#d8d2c6" />
          </mesh>
        ))}
      </group>
      {/* worn runner rug between counter and table */}
      <mesh position={[0, 0.014, -1.6]} receiveShadow>
        <boxGeometry args={[3.4, 0.02, 1.4]} />
        <meshStandardMaterial color="#5c4a52" roughness={1} />
      </mesh>
    </group>
  );
}

const MODELS: Record<string, ComponentType> = {
  'two-glasses': TwoGlasses,
  residue: ResidueGlow,
  'wine-bottle': WineBottle,
  bin: Bin,
  'trash-receipt': TrashReceipt,
  'trash-list': TrashList,
  'trash-note': TrashNote,
  'oddments-shelf': OddmentsShelf,
  'pencil-marks': PencilMarks,
  'loose-tile': LooseTile,
  'blue-room-photo': BlueRoomPhoto,
  sink: Sink,
  stove: Stove,
  fridge: Fridge,
  table: Table,
  window: Window,
  lamp: PendantLamp,
  door: Door,
};

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

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
        position={[-6, 10, 4]}
        intensity={dirIntensity}
        color={dirColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
    </>
  );
}

function KitchenScene() {
  return (
    <group>
      <RoomLighting />
      <RoomShell
        width={ROOM.width}
        depth={ROOM.depth}
        height={ROOM.wallHeight}
        floorColor="#847d6e"
        ceilingColor="#d8d2c6"
        wallColors={{
          back: COLORS.wallBack,
          front: COLORS.wallBack,
          left: COLORS.wallSide,
          right: COLORS.wallSide,
        }}
      />
      {/* fixed furniture that never needs a hotspot of its own */}
      <group position={[-1.0, 0, -4.35]}>
        <Counter />
      </group>
      <Decor />
      <RoomObjects objects={OBJECTS} models={MODELS} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Level definition                                                     */
/* ------------------------------------------------------------------ */

const kitchen: LevelConfig = {
  id: 'kitchen',
  name: 'The Kitchen',
  Scene: KitchenScene,
  lightingPanel: true,
  objective: {
    text: 'The kitchen is where her last night really happened. Two glasses, one visitor — and Vera hid one more thing before she answered the door.',
    clueItems: DOOR_REQUIRES,
    completeWhenItems: DOOR_REQUIRES,
    completeText: 'Five threads of that night in hand. The stairwell door is ready.',
  },
};

export default kitchen;
