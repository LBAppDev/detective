/**
 * Level: The Office (Chapter 2).
 * Vera's home office — where the real work lived. This chapter is a step
 * up in difficulty from the bedroom:
 *   1. A decipher puzzle whose key is the bedroom's wall Mark (three
 *      tallies = Caesar shift of 3). Decoding it points you to the
 *      answering machine.
 *   2. A key-gated desk drawer (useItem): the brass key is taped under
 *      the chair, and the drawer holds the hidden ledger page.
 *   3. Two openable furniture pieces (desk drawer, filing cabinet).
 *   4. A chained hint: the notebook decode ("the mail") sends you to the
 *      machine for Hale's voicemail before the room will open.
 *
 * Puzzle state uses namespaced flags in the global store (office.*).
 */
import { useMemo, useRef, type ComponentType } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, MathUtils, MeshBasicMaterial, MeshStandardMaterial } from 'three';
import { useGameStore } from '../store/gameStore';
import { playSound } from '../engine/feedback';
import { useFlagTween } from '../engine/useFlagTween';
import RoomObjects from '../components/RoomObjects';
import RoomShell from '../components/RoomShell';
import type { LevelConfig, RoomObjectConfig } from './types';

const ROOM = { width: 10, depth: 10, wallHeight: 4 };

const COLORS = {
  floor: '#6f5a44',
  wallBack: '#3c4f5a',
  wallSide: '#54636b',
  desk: '#5a3b2a',
  deskTop: '#6b4a36',
  chair: '#2b2b30',
  metal: '#8a8f96',
  cabinet: '#4a4036',
  lampCord: '#2b2b30',
  lampBulb: '#ffe9b8',
  paper: '#e9e4d2',
  rug: '#7a3f46',
};

/** Namespaced puzzle flags for this room. */
const FLAGS = {
  deskDrawerOpen: 'office.deskDrawerOpen',
  filingOpen: 'office.filingOpen',
  chairChecked: 'office.chairChecked',
  safeRevealed: 'office.safeRevealed',
  safeOpen: 'office.safeOpen',
};

/** Items needed before the office door will open. */
const DOOR_REQUIRES = [
  'cipher_notebook',
  'hale_voicemail',
  'ledger_page',
  'voss_letters',
  'story_draft',
];

/** Guards against a double-click firing the level transition twice. */
let doorOpening = false;

/** Staged door logic: locked → hint → unlock + transition to Chapter 3. */
function openOfficeDoor() {
  const s = useGameStore.getState();
  if (doorOpening) return;
  const found = DOOR_REQUIRES.filter((id) => s.inventory.includes(id)).length;
  if (found < DOOR_REQUIRES.length) {
    playSound('deny');
    const left = DOOR_REQUIRES.length - found;
    s.showToast(
      `The office door is still locked from the outside. ${left} piece${
        left === 1 ? '' : 's'
      } of her work remain in here.`,
    );
    return;
  }
  doorOpening = true;
  playSound('success');
  s.showToast('The bolt slides. The stairs wait below — down to the kitchen.');
  window.setTimeout(() => {
    const now = useGameStore.getState();
    // Guard: don't warp if the player restarted mid-transition.
    if (now.phase === 'playing' && now.currentLevel === 'office') now.setLevel('kitchen');
    doorOpening = false;
  }, 900);
}

/* ------------------------------------------------------------------ */
/* Object/hotspot config                                                */
/* ------------------------------------------------------------------ */

const OBJECTS: RoomObjectConfig[] = [
  {
    id: 'notebook',
    name: 'cipher notebook',
    position: [-0.9, 1.04, -3.9],
    interactable: true,
    visible: (s) => !s.inventory.includes('cipher_notebook'),
    interaction: {
      type: 'decipher',
      title: 'Vera’s Notebook — slide each letter back three',
      cipherText: 'WKH PDLO',
      answer: 'the mail',
      placeholder: 'Decoded phrase…',
      onSuccess: [
        { collect: 'cipher_notebook' },
        { sound: 'success' },
        {
          toast:
            'Decoded: "THE MAIL." Vera wrote it twice — the next place to look is the answering machine.',
        },
      ],
      onFail: [{ toast: 'Gibberish. The bedroom’s three tallies must mean something.' }],
    },
  },
  {
    id: 'answering-machine',
    name: 'answering machine',
    position: [1.0, 1.04, -4.0],
    interactable: true,
    // The machine stays in the room; only its message is "collected".
    interaction: {
      type: 'custom',
      run: (s) => {
        if (!s.inventory.includes('hale_voicemail')) {
          s.addItem('hale_voicemail');
          playSound('success');
          s.showToast(
            'Oct 14, 7:52 PM — Marcus Hale: "Stay home tonight, I’ll come to you." He knew where she’d be.',
          );
        } else {
          s.openModal({
            kind: 'examine',
            title: 'Answering Machine',
            text: 'The tape has been played and logged. Oct 14, 7:52 PM — Marcus Hale: "Stay home tonight, I’ll come to you." He knew exactly where she’d be.',
          });
        }
      },
    },
  },
  {
    id: 'desk',
    name: 'writing desk',
    position: [0, 0, -3.8],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Writing Desk',
      text: 'Scratched oak, a cold coffee ring, a notepad with one line: "three names, one mark." The right-hand drawer has a small keyhole.',
    },
  },
  {
    id: 'desk-drawer',
    name: 'locked drawer',
    position: [0.85, 0.5, -3.28],
    interactable: true,
    requires: (s) => !s.flags[FLAGS.deskDrawerOpen],
    failText: 'The drawer is already open.',
    interaction: {
      type: 'useItem',
      item: 'drawer_key',
      missingText: 'Locked. A small, old keyhole — the key must be somewhere in this room.',
      onSuccess: [
        { flag: FLAGS.deskDrawerOpen },
        { sound: 'slide' },
        { toast: 'The drawer slides open. Inside, folded once: a torn ledger page.' },
      ],
    },
  },
  {
    id: 'drawer-key',
    name: 'small key',
    position: [0.35, 0.03, -2.05],
    interactable: true,
    // Taped under the chair — only appears once the chair has been searched.
    visible: (s) => !!s.flags[FLAGS.chairChecked] && !s.inventory.includes('drawer_key'),
    interaction: { type: 'collect', item: 'drawer_key' },
  },
  {
    id: 'chair',
    name: 'office chair',
    position: [0, 0, -2.2],
    interactable: true,
    // Searching the chair frees the taped key onto the rug beside it.
    interaction: {
      type: 'custom',
      run: (s) => {
        if (!s.flags[FLAGS.chairChecked]) {
          s.setFlag(FLAGS.chairChecked);
          playSound('slide');
          s.openModal({
            kind: 'examine',
            title: 'Office Chair',
            text: 'Pushed in neat. Underneath the seat, a strip of yellowed tape gives way at your touch — something small drops to the rug beside the chair.',
          });
        } else {
          s.openModal({
            kind: 'examine',
            title: 'Office Chair',
            text: 'Pushed in neat. Only a strip of spent tape remains under the seat.',
          });
        }
      },
    },
  },
  {
    id: 'ledger-page',
    name: 'torn ledger page',
    // Closed-tray position; the model tweens out with the drawer.
    position: [0.85, 0.32, -3.49],
    interactable: true,
    // Only visible/clickable once the desk drawer is open.
    visible: (s) => !!s.flags[FLAGS.deskDrawerOpen] && !s.inventory.includes('ledger_page'),
    interaction: { type: 'collect', item: 'ledger_page' },
  },
  {
    id: 'filing-cabinet',
    name: 'filing cabinet',
    position: [4.7, 0, 1.0],
    rotation: [0, -Math.PI / 2, 0],
    interactable: true,
    requires: (s) => !s.flags[FLAGS.filingOpen],
    failText: 'The cabinet is already open.',
    interaction: {
      type: 'actions',
      actions: [
        { flag: FLAGS.filingOpen },
        { sound: 'slide' },
        { toast: 'The top drawer rolls out. Filed under "V": three letters from Voss’s attorneys.' },
      ],
    },
  },
  {
    id: 'voss-letters',
    name: 'legal letters',
    // Closed-tray position (cabinet is rotated -90°, so the tray slides
    // toward -x); the model tweens out in sync with the drawer.
    position: [4.52, 1.06, 1.0],
    rotation: [0, -Math.PI / 2, 0],
    interactable: true,
    visible: (s) => !!s.flags[FLAGS.filingOpen] && !s.inventory.includes('voss_letters'),
    interaction: { type: 'collect', item: 'voss_letters' },
  },
  {
    id: 'bookshelf',
    name: 'bookshelf',
    position: [-4.7, 0, 2.0],
    rotation: [0, Math.PI / 2, 0],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Bookshelf',
      text: 'Reference books, a few true-crime paperbacks, and a framed press pass. She kept her sources’ names nowhere obvious.',
    },
  },
  {
    id: 'window',
    name: 'window',
    position: [-0.2, 0, -4.94],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Window',
      text: 'Overlooks the back garden. The shrubs below are trampled flat on one side — someone approached this window the night she died.',
    },
  },
  {
    id: 'wall-clock',
    name: 'wall clock',
    position: [-1.6, 3.0, -4.92],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Wall Clock',
      text: 'Stopped at 10:47. Not unplugged — the movement is jammed with five years of dust. If the original report had looked up, it would have noticed the house itself remembers when the night went quiet.',
    },
  },
  {
    id: 'calendar',
    name: 'wall calendar',
    position: [1.8, 2.4, -4.9],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Wall Calendar',
      text: 'October. The 14th is circled in red, with "B.R. 8PM" scrawled beside it — the Blue Room meeting. The 15th simply reads "finish it."',
    },
  },
  {
    id: 'press-photo',
    name: 'framed press photo',
    position: [-3.3, 2.2, -4.9],
    interactable: true,
    interaction: {
      type: 'custom',
      run: (s) => {
        if (!s.flags[FLAGS.safeRevealed]) {
          s.setFlag(FLAGS.safeRevealed);
          playSound('slide');
          s.showToast(
            'The frame swings on a hidden hinge. Set into the wall behind it: a small four-digit safe.',
          );
        } else {
          s.openModal({
            kind: 'examine',
            title: 'Framed Press Photo',
            text: 'Vera on her first byline day, grinning outside The Ledger. The frame hangs aside on its hinge — the safe behind it was her real filing system.',
          });
        }
      },
    },
  },
  {
    id: 'wall-safe',
    name: 'wall safe',
    position: [-3.0, 2.2, -4.95],
    interactable: true,
    visible: (s) => !!s.flags[FLAGS.safeRevealed],
    requires: (s) => !s.flags[FLAGS.safeOpen],
    failText: 'The safe already stands open.',
    interaction: {
      type: 'code',
      title: 'Wall Safe — four digits. "The day it ends."',
      answer: '1014',
      length: 4,
      onSuccess: [
        { flag: FLAGS.safeOpen },
        { sound: 'slide' },
        { toast: 'The lock gives on the date she died. Inside: a printed manuscript, bound with a clip.' },
      ],
      onFail: [{ toast: 'The dial resets. Everything important is dated — check what she circled.' }],
    },
  },
  {
    id: 'story-draft',
    name: 'final draft',
    position: [-3.0, 2.14, -4.78],
    interactable: true,
    visible: (s) => !!s.flags[FLAGS.safeOpen] && !s.inventory.includes('story_draft'),
    interaction: { type: 'collect', item: 'story_draft' },
  },
  {
    id: 'corkboard',
    name: 'corkboard',
    position: [4.94, 2.2, -1.6],
    rotation: [0, -Math.PI / 2, 0],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Corkboard',
      text: 'Vera’s case wall: three photos joined by red string, faces scratched out. Pinned dead center, a note in her hand: "Everything important is dated. The day it ends opens what I kept." The calendar across the room has one day circled in red.',
    },
  },
  {
    id: 'lamp',
    name: 'lamp',
    position: [0, 0, 0],
    interactable: true,
    interaction: { type: 'custom', run: () => useGameStore.getState().toggleLightPanel() },
  },
  {
    id: 'door',
    name: 'office door',
    position: [-4.96, 0, -2.4],
    rotation: [0, Math.PI / 2, 0],
    interactable: true,
    interaction: { type: 'custom', run: () => openOfficeDoor() },
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

/** Office writing desk. The animated drawer lives in its own hotspot
 *  (desk-drawer) so it can tween independently of the desk body. */
function Desk() {
  const top = 1.0;
  return (
    <group>
      {/* top */}
      <mesh position={[0, top, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.1, 1.1]} />
        <meshStandardMaterial color={COLORS.deskTop} />
      </mesh>
      {/* legs */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 1.2, top / 2, sz * 0.48]} castShadow>
            <boxGeometry args={[0.12, top, 0.12]} />
            <meshStandardMaterial color={COLORS.desk} />
          </mesh>
        )),
      )}
      {/* right pedestal (drawer housing) — inset dark front so the
          separate drawer-front hotspot reads as the real drawer */}
      <mesh position={[0.85, top / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, top, 1.0]} />
        <meshStandardMaterial color={COLORS.desk} />
      </mesh>
      <mesh position={[0.85, 0.45, 0.502]}>
        <boxGeometry args={[0.6, 0.42, 0.02]} />
        <meshStandardMaterial color="#3a2a1e" />
      </mesh>
    </group>
  );
}

/** The desk's right drawer — a full tray (front, sides, bottom, back)
 *  that slides out of the pedestal. The ledger page rides inside it. */
function DrawerFront() {
  const ref = useFlagTween(FLAGS.deskDrawerOpen, {
    position: { from: [0, 0, 0], to: [0, 0, 0.42] },
    speed: 5,
  });
  const wood = COLORS.deskTop;
  return (
    <group ref={ref}>
      {/* front panel */}
      <mesh castShadow>
        <boxGeometry args={[0.66, 0.5, 0.06]} />
        <meshStandardMaterial color={wood} />
      </mesh>
      {/* knob */}
      <mesh position={[0, 0, 0.035]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* tray sides */}
      {[-0.29, 0.29].map((x) => (
        <mesh key={x} position={[x, -0.1, -0.21]} castShadow>
          <boxGeometry args={[0.03, 0.22, 0.36]} />
          <meshStandardMaterial color={COLORS.desk} />
        </mesh>
      ))}
      {/* tray bottom */}
      <mesh position={[0, -0.2, -0.21]}>
        <boxGeometry args={[0.6, 0.03, 0.36]} />
        <meshStandardMaterial color={COLORS.desk} />
      </mesh>
      {/* tray back */}
      <mesh position={[0, -0.1, -0.39]}>
        <boxGeometry args={[0.6, 0.22, 0.03]} />
        <meshStandardMaterial color={COLORS.desk} />
      </mesh>
    </group>
  );
}

/** Office chair; the key is taped to its underside (separate hotspot). */
function Chair() {
  return (
    <group>
      {/* seat */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.6]} />
        <meshStandardMaterial color={COLORS.chair} />
      </mesh>
      {/* back */}
      <mesh position={[0, 0.85, -0.27]} castShadow>
        <boxGeometry args={[0.6, 0.7, 0.08]} />
        <meshStandardMaterial color={COLORS.chair} />
      </mesh>
      {/* legs */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.25, 0.25, sz * 0.25]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
            <meshStandardMaterial color={COLORS.metal} metalness={0.5} roughness={0.5} />
          </mesh>
        )),
      )}
    </group>
  );
}

/** Small brass key, taped under the chair. The shimmer ring lives on the
 *  unrotated outer group so it always lies flat on the floor. */
function DrawerKey() {
  return (
    <group>
      <group rotation={[Math.PI / 2, 0, 0.5]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 10]} />
          <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[-0.26, 0, 0]} castShadow>
          <torusGeometry args={[0.08, 0.03, 8, 16]} />
          <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0.14, -0.06, 0]} castShadow>
          <boxGeometry args={[0.05, 0.09, 0.05]} />
          <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.5} />
        </mesh>
      </group>
      <EvidenceShimmer radius={0.28} y={0.01} />
    </group>
  );
}

/** Cipher notebook — sits on the desk; click opens the decipher modal. */
function CipherNotebook() {
  return (
    <group rotation={[0, 0.3, 0]}>
      <mesh position={[0, 0.04, 0]} castShadow>
        <boxGeometry args={[0.32, 0.08, 0.42]} />
        <meshStandardMaterial color="#36506b" />
      </mesh>
      <mesh position={[0, 0.042, 0]}>
        <boxGeometry args={[0.3, 0.06, 0.4]} />
        <meshStandardMaterial color={COLORS.paper} />
      </mesh>
      <EvidenceShimmer radius={0.3} y={0.0} />
    </group>
  );
}

/** Torn ledger page — lies flat in the drawer tray and slides out with
 *  it (same flag + speed as the tray tween, so they stay in sync). */
function LedgerPage() {
  const ref = useFlagTween(FLAGS.deskDrawerOpen, {
    position: { from: [0, 0, 0], to: [0, 0, 0.42] },
    speed: 5,
  });
  return (
    <group ref={ref}>
      <group rotation={[0, 0.2, 0]}>
        <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <mesh castShadow>
            <planeGeometry args={[0.28, 0.32]} />
            <meshStandardMaterial color={COLORS.paper} side={2} />
          </mesh>
          {/* faint ruled lines */}
          {[-0.1, -0.03, 0.04, 0.11].map((y) => (
            <mesh key={y} position={[0, y, 0.001]}>
              <planeGeometry args={[0.22, 0.005]} />
              <meshStandardMaterial color="#b9b09a" />
            </mesh>
          ))}
        </group>
        <EvidenceShimmer radius={0.2} y={0.02} />
      </group>
    </group>
  );
}

/** Answering machine on the desk corner. The message light blinks red
 *  until the voicemail is logged, then holds a steady green. */
function AnsweringMachine() {
  const heard = useGameStore((s) => s.inventory.includes('hale_voicemail'));
  const light = useRef<MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!light.current) return;
    light.current.emissiveIntensity = heard
      ? 0.8
      : 0.25 + (Math.sin(clock.elapsedTime * 5) > 0 ? 1.2 : 0);
  });
  const color = heard ? '#4caf6d' : '#d6453a';
  return (
    <group>
      <mesh position={[0, 0.09, 0]} castShadow>
        <boxGeometry args={[0.5, 0.18, 0.32]} />
        <meshStandardMaterial color="#3a3f45" />
      </mesh>
      {/* tape reels */}
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.19, 0.0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.05, 0.015, 8, 16]} />
          <meshStandardMaterial color={COLORS.metal} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* message light */}
      <mesh position={[0, 0.2, 0.16]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial ref={light} color={color} emissive={color} emissiveIntensity={1.1} />
      </mesh>
    </group>
  );
}

/** Static room dressing: rug, desk clutter, banker's lamp, wastebasket. */
function Decor() {
  const paperBall = { color: '#ddd6c2', roughness: 1 } as const;
  return (
    <group>
      {/* area rug under the desk and chair */}
      <mesh position={[0, 0.012, -3.0]} receiveShadow>
        <cylinderGeometry args={[2.1, 2.1, 0.024, 40]} />
        <meshStandardMaterial color={COLORS.rug} roughness={1} />
      </mesh>
      <mesh position={[0, 0.02, -3.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.82, 1.95, 40]} />
        <meshStandardMaterial color="#5c2f35" roughness={1} />
      </mesh>

      {/* coffee mug + the "cold coffee ring" from the desk's examine text */}
      <group position={[-1.02, 1.05, -3.55]}>
        <mesh position={[0, 0.07, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.05, 0.14, 14]} />
          <meshStandardMaterial color="#8a3b32" roughness={0.8} />
        </mesh>
        <mesh position={[0.07, 0.07, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.035, 0.01, 8, 14]} />
          <meshStandardMaterial color="#8a3b32" roughness={0.8} />
        </mesh>
      </group>
      <mesh position={[-0.82, 1.052, -3.48]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.045, 0.06, 20]} />
        <meshStandardMaterial color="#4a3526" transparent opacity={0.55} />
      </mesh>

      {/* loose papers and a pen */}
      {[
        { p: [-0.25, 1.052, -3.6], r: 0.25 },
        { p: [-0.05, 1.054, -3.55], r: -0.4 },
        { p: [0.2, 1.056, -3.65], r: 0.1 },
      ].map(({ p, r }, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[-Math.PI / 2, 0, r]}>
          <planeGeometry args={[0.3, 0.42]} />
          <meshStandardMaterial color={i === 1 ? '#e7dcc2' : COLORS.paper} roughness={1} />
        </mesh>
      ))}
      <mesh position={[0.42, 1.062, -3.5]} rotation={[0, 0.9, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.16, 8]} />
        <meshStandardMaterial color="#1e2530" roughness={0.4} />
      </mesh>

      {/* banker's lamp at the back of the desk */}
      <group position={[0.15, 1.05, -4.15]}>
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.04, 14]} />
          <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.16, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.26, 8]} />
          <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.31, 0.05]} rotation={[0.5, 0, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.13, 0.12, 14, 1, true]} />
          <meshStandardMaterial
            color="#2e5c46"
            emissive="#3f8a63"
            emissiveIntensity={0.5}
            side={2}
          />
        </mesh>
        <pointLight position={[0, 0.26, 0.12]} intensity={1.4} distance={2.6} decay={1.8} color="#ffe9b8" />
      </group>

      {/* coat rack by the door, her trench coat still on it */}
      <group position={[-4.2, 0, -1.0]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.05, 1.8, 10]} />
          <meshStandardMaterial color="#3a2a1e" />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.22, 0.26, 0.06, 12]} />
          <meshStandardMaterial color="#3a2a1e" />
        </mesh>
        {[0.6, 2.2, 3.8].map((a) => (
          <mesh
            key={a}
            position={[Math.sin(a) * 0.14, 1.72, Math.cos(a) * 0.14]}
            rotation={[0.5 * Math.cos(a), a, -0.5 * Math.sin(a)]}
            castShadow
          >
            <cylinderGeometry args={[0.015, 0.015, 0.24, 8]} />
            <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.5} />
          </mesh>
        ))}
        {/* trench coat draped on one side */}
        <mesh position={[0.12, 1.05, 0.1]} rotation={[0, 0.4, 0.08]} castShadow>
          <boxGeometry args={[0.34, 1.15, 0.18]} />
          <meshStandardMaterial color="#6b5d43" roughness={1} />
        </mesh>
      </group>

      {/* side table with her typewriter, against the front wall */}
      <group position={[-2.6, 0, 4.2]}>
        <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.08, 0.7]} />
          <meshStandardMaterial color={COLORS.desk} />
        </mesh>
        {[-1, 1].map((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={`${sx}${sz}`} position={[sx * 0.48, 0.3, sz * 0.28]} castShadow>
              <boxGeometry args={[0.08, 0.6, 0.08]} />
              <meshStandardMaterial color={COLORS.desk} />
            </mesh>
          )),
        )}
        {/* typewriter: body, paper, keys, carriage */}
        <group position={[0, 0.66, 0]} rotation={[0, 0.15, 0]}>
          <mesh position={[0, 0.09, 0.02]} castShadow>
            <boxGeometry args={[0.5, 0.18, 0.4]} />
            <meshStandardMaterial color="#2e3138" metalness={0.3} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.21, -0.12]} castShadow>
            <boxGeometry args={[0.56, 0.07, 0.09]} />
            <meshStandardMaterial color="#22252b" metalness={0.4} roughness={0.5} />
          </mesh>
          {/* half-typed sheet still in the roller */}
          <mesh position={[0, 0.34, -0.12]} rotation={[-0.15, 0, 0.02]}>
            <planeGeometry args={[0.3, 0.26]} />
            <meshStandardMaterial color={COLORS.paper} side={2} />
          </mesh>
          {/* key rows */}
          {[0, 1, 2].map((row) =>
            Array.from({ length: 7 }, (_, i) => (
              <mesh
                key={`${row}-${i}`}
                position={[-0.15 + i * 0.05, 0.19 - row * 0.028, 0.1 + row * 0.055]}
              >
                <cylinderGeometry args={[0.014, 0.014, 0.015, 8]} />
                <meshStandardMaterial color="#d8d2c6" />
              </mesh>
            )),
          )}
        </group>
      </group>

      {/* dead potted plant in the far corner */}
      <group position={[4.3, 0, 4.3]}>
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.15, 0.44, 12]} />
          <meshStandardMaterial color="#8a5a3a" roughness={1} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 0.04, 12]} />
          <meshStandardMaterial color="#3d2f22" roughness={1} />
        </mesh>
        {[0.3, 1.6, 2.9, 4.4].map((a) => (
          <mesh
            key={a}
            position={[Math.sin(a) * 0.08, 0.75, Math.cos(a) * 0.08]}
            rotation={[0.55 * Math.cos(a), 0, -0.55 * Math.sin(a)]}
            castShadow
          >
            <cylinderGeometry args={[0.008, 0.018, 0.6, 6]} />
            <meshStandardMaterial color="#6b5d43" roughness={1} />
          </mesh>
        ))}
      </group>

      {/* overflow book stacks on the floor by the bookshelf */}
      <group position={[-4.35, 0, 3.5]}>
        {[
          { y: 0.05, s: [0.4, 0.1, 0.3], c: '#36506b', r: 0.1 },
          { y: 0.15, s: [0.36, 0.1, 0.28], c: '#7a3f46', r: -0.15 },
          { y: 0.25, s: [0.38, 0.1, 0.26], c: '#3e5c4a', r: 0.25 },
          { y: 0.35, s: [0.3, 0.1, 0.24], c: '#5a3b52', r: -0.05 },
        ].map(({ y, s, c, r }, i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[0, r, 0]} castShadow>
            <boxGeometry args={s as [number, number, number]} />
            <meshStandardMaterial color={c} />
          </mesh>
        ))}
        <mesh position={[0.5, 0.06, 0.15]} rotation={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[0.34, 0.12, 0.26]} />
          <meshStandardMaterial color="#c9a227" />
        </mesh>
      </group>

      {/* wastebasket with crumpled drafts beside the desk */}
      <group position={[1.7, 0, -3.4]}>
        <mesh position={[0, 0.19, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.13, 0.38, 14, 1, true]} />
          <meshStandardMaterial color={COLORS.metal} metalness={0.4} roughness={0.6} side={2} />
        </mesh>
        <mesh position={[0.03, 0.36, -0.02]}>
          <icosahedronGeometry args={[0.07, 0]} />
          <meshStandardMaterial {...paperBall} />
        </mesh>
        <mesh position={[-0.05, 0.33, 0.04]}>
          <icosahedronGeometry args={[0.06, 0]} />
          <meshStandardMaterial {...paperBall} />
        </mesh>
        <mesh position={[0.32, 0.05, 0.18]}>
          <icosahedronGeometry args={[0.055, 0]} />
          <meshStandardMaterial {...paperBall} />
        </mesh>
      </group>
    </group>
  );
}

/** Two-drawer filing cabinet; top drawer rolls open on a flag tween. */
function FilingCabinet() {
  const drawerRef = useFlagTween(FLAGS.filingOpen, {
    position: { from: [0, 0, 0], to: [0, 0, 0.4] },
    speed: 4,
  });
  return (
    <group>
      {/* body */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 1.6, 0.7]} />
        <meshStandardMaterial color={COLORS.cabinet} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* dark cavity plate — hidden inside the closed drawer front,
          revealed as the "hole" once the drawer rolls out */}
      <mesh position={[0, 1.25, 0.352]}>
        <planeGeometry args={[0.8, 0.48]} />
        <meshStandardMaterial color="#17191d" />
      </mesh>
      {/* top drawer (opens) — a full tray the letters ride inside */}
      <group ref={drawerRef} position={[0, 1.25, 0.35]}>
        <mesh castShadow>
          <boxGeometry args={[0.82, 0.5, 0.06]} />
          <meshStandardMaterial color={COLORS.metal} metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[0.3, 0.1, 0.04]} />
          <meshStandardMaterial color="#2b2b30" />
        </mesh>
        {/* tray sides */}
        {[-0.37, 0.37].map((x) => (
          <mesh key={x} position={[x, -0.08, -0.26]} castShadow>
            <boxGeometry args={[0.04, 0.3, 0.46]} />
            <meshStandardMaterial color="#5c554a" metalness={0.3} roughness={0.7} />
          </mesh>
        ))}
        {/* tray bottom */}
        <mesh position={[0, -0.21, -0.26]}>
          <boxGeometry args={[0.74, 0.03, 0.46]} />
          <meshStandardMaterial color="#5c554a" metalness={0.3} roughness={0.7} />
        </mesh>
        {/* tray back */}
        <mesh position={[0, -0.08, -0.49]}>
          <boxGeometry args={[0.74, 0.3, 0.04]} />
          <meshStandardMaterial color="#5c554a" metalness={0.3} roughness={0.7} />
        </mesh>
        {/* hanging folders at the back of the tray */}
        {[-0.44, -0.34].map((z, i) => (
          <mesh key={i} position={[0, -0.05, z]} castShadow>
            <boxGeometry args={[0.7, 0.24, 0.02]} />
            <meshStandardMaterial color={i === 1 ? '#8a7a5c' : '#7a6f58'} roughness={1} />
          </mesh>
        ))}
      </group>
      {/* bottom drawer (static) */}
      <mesh position={[0, 0.45, 0.35]} castShadow>
        <boxGeometry args={[0.82, 0.5, 0.06]} />
        <meshStandardMaterial color={COLORS.metal} metalness={0.4} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Voss's legal letters — stacked in the cabinet tray, sliding out with
 *  it (same flag + speed as the drawer tween). */
function VossLetters() {
  const ref = useFlagTween(FLAGS.filingOpen, {
    position: { from: [0, 0, 0], to: [0, 0, 0.4] },
    speed: 4,
  });
  return (
    <group ref={ref}>
      <group rotation={[0, -0.2, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.03 + i * 0.012, 0]} rotation={[0, i * 0.05, 0]} castShadow>
            <boxGeometry args={[0.3, 0.012, 0.22]} />
            <meshStandardMaterial color={i === 1 ? '#e7dcc2' : COLORS.paper} />
          </mesh>
        ))}
        {/* red LEGAL stamp strip on the top letter */}
        <mesh position={[0.06, 0.062, 0.04]} rotation={[-Math.PI / 2, 0, 0.3]}>
          <planeGeometry args={[0.12, 0.03]} />
          <meshStandardMaterial color="#b3362c" />
        </mesh>
        <EvidenceShimmer radius={0.2} y={0.075} />
      </group>
    </group>
  );
}

/** Office bookshelf against the left wall. */
function Bookshelf() {
  const frame = '#4a3526';
  const spines = ['#36506b', '#7a3f46', '#c9a227', '#3e5c4a', '#5a3b52', '#54636b'];
  return (
    <group>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 1.1, 0]} castShadow>
          <boxGeometry args={[0.08, 2.2, 0.32]} />
          <meshStandardMaterial color={frame} />
        </mesh>
      ))}
      <mesh position={[0, 1.1, -0.14]}>
        <boxGeometry args={[1.4, 2.2, 0.04]} />
        <meshStandardMaterial color="#3a2a1e" />
      </mesh>
      {[0.08, 0.62, 1.16, 1.7, 2.17].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <boxGeometry args={[1.4, 0.06, 0.32]} />
          <meshStandardMaterial color={frame} />
        </mesh>
      ))}
      {[0.65, 1.19, 1.73].map((shelfY, row) =>
        Array.from({ length: 8 }, (_, i) => {
          const h = 0.32 + ((i * 5 + row * 3) % 4) * 0.03;
          return (
            <mesh key={`${row}-${i}`} position={[-0.56 + i * 0.15, shelfY + h / 2, 0.02]} castShadow>
              <boxGeometry args={[0.12, h, 0.24]} />
              <meshStandardMaterial color={spines[(i + row * 2) % spines.length]} />
            </mesh>
          );
        }),
      )}
      {/* framed press pass leaning on top */}
      <mesh position={[0.4, 2.25, 0.05]} rotation={[0, 0.3, 0.05]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.03]} />
        <meshStandardMaterial color="#2b2b30" />
      </mesh>
      <mesh position={[0.4, 2.25, 0.07]} rotation={[0, 0.3, 0.05]}>
        <planeGeometry args={[0.24, 0.34]} />
        <meshStandardMaterial color="#b9c4cf" />
      </mesh>
    </group>
  );
}

/** Office window on the back wall (static glass + frame + curtains). */
function Window() {
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const sky = useMemo(
    () => new Color('#101a3a').lerp(new Color('#bcd4e8'), timeOfDay),
    [timeOfDay],
  );
  const frameWood = '#3a2a1e';
  return (
    <group position={[0, 2.1, 0]}>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[1.3, 1.5]} />
        <meshStandardMaterial color={sky} emissive={sky} emissiveIntensity={0.35} />
      </mesh>
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
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.05, 1.5, 0.05]} />
        <meshStandardMaterial color={frameWood} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[1.3, 0.05, 0.05]} />
        <meshStandardMaterial color={frameWood} />
      </mesh>
      {/* curtain, drawn to one side */}
      <mesh position={[0.95, 0.02, 0.12]} castShadow>
        <boxGeometry args={[0.4, 2.04, 0.1]} />
        <meshStandardMaterial color="#3e5c4a" roughness={1} />
      </mesh>
    </group>
  );
}

/** Framed press photo hiding the wall safe; swings aside on a hinge. */
function PressPhoto() {
  // Group origin = the hinge (left edge of the frame).
  const ref = useFlagTween(FLAGS.safeRevealed, {
    rotation: { from: [0, 0, 0], to: [0, -2.1, 0] },
    speed: 4,
  });
  return (
    <group ref={ref}>
      <mesh position={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.6, 0.75, 0.05]} />
        <meshStandardMaterial color="#3a2a1e" />
      </mesh>
      <mesh position={[0.3, 0, 0.028]}>
        <planeGeometry args={[0.5, 0.64]} />
        <meshStandardMaterial color="#b9c4cf" />
      </mesh>
      {/* figure silhouette in the photo */}
      <mesh position={[0.3, -0.08, 0.03]}>
        <planeGeometry args={[0.2, 0.34]} />
        <meshStandardMaterial color="#54636b" />
      </mesh>
      <mesh position={[0.3, 0.15, 0.032]}>
        <circleGeometry args={[0.07, 16]} />
        <meshStandardMaterial color="#54636b" />
      </mesh>
    </group>
  );
}

/** Small four-digit wall safe, revealed behind the press photo. */
function WallSafe() {
  const doorRef = useFlagTween(FLAGS.safeOpen, {
    rotation: { from: [0, 0, 0], to: [0, -1.9, 0] },
    speed: 4,
  });
  return (
    <group>
      {/* body */}
      <mesh castShadow>
        <boxGeometry args={[0.55, 0.55, 0.12]} />
        <meshStandardMaterial color="#2b2b30" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* dark cavity face, visible once the door swings */}
      <mesh position={[0, 0, 0.061]}>
        <planeGeometry args={[0.46, 0.46]} />
        <meshStandardMaterial color="#101216" />
      </mesh>
      {/* door, hinged on the left */}
      <group ref={doorRef} position={[-0.24, 0, 0.065]}>
        <mesh position={[0.24, 0, 0]} castShadow>
          <boxGeometry args={[0.48, 0.48, 0.03]} />
          <meshStandardMaterial color="#3a3f45" metalness={0.5} roughness={0.45} />
        </mesh>
        {/* dial */}
        <mesh position={[0.24, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.03, 16]} />
          <meshStandardMaterial color={COLORS.metal} metalness={0.6} roughness={0.4} />
        </mesh>
        {/* handle */}
        <mesh position={[0.4, 0, 0.02]}>
          <boxGeometry args={[0.03, 0.12, 0.03]} />
          <meshStandardMaterial color={COLORS.metal} metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/** Vera's printed final draft, jutting from the open safe. */
function StoryDraft() {
  return (
    <group>
      <group rotation={[0.08, 0.1, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, i * 0.012, 0]} castShadow>
            <boxGeometry args={[0.3, 0.012, 0.24]} />
            <meshStandardMaterial color={i === 3 ? '#e7dcc2' : COLORS.paper} />
          </mesh>
        ))}
        {/* binder clip */}
        <mesh position={[0, 0.03, -0.1]}>
          <boxGeometry args={[0.08, 0.05, 0.03]} />
          <meshStandardMaterial color="#2b2b30" metalness={0.5} roughness={0.5} />
        </mesh>
      </group>
      {/* vertical shimmer ring so it reads against the wall */}
      <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0.05]}>
        <EvidenceShimmer radius={0.24} y={0} />
      </group>
    </group>
  );
}

/** Corkboard case wall: pinned notes, photos, red string. */
function Corkboard() {
  const pin = { color: '#d6453a' } as const;
  const photos: Array<{ p: [number, number]; r: number }> = [
    { p: [-0.55, 0.32], r: 0.08 },
    { p: [0.5, 0.4], r: -0.1 },
    { p: [0.05, -0.38], r: 0.05 },
  ];
  return (
    <group>
      {/* frame + cork */}
      <mesh castShadow>
        <boxGeometry args={[1.7, 1.2, 0.05]} />
        <meshStandardMaterial color="#3a2a1e" />
      </mesh>
      <mesh position={[0, 0, 0.028]}>
        <planeGeometry args={[1.56, 1.06]} />
        <meshStandardMaterial color="#a8794f" roughness={1} />
      </mesh>
      {/* photos */}
      {photos.map(({ p, r }, i) => (
        <group key={i} position={[p[0], p[1], 0.035]} rotation={[0, 0, r]}>
          <mesh>
            <planeGeometry args={[0.3, 0.36]} />
            <meshStandardMaterial color="#dcd4c4" />
          </mesh>
          <mesh position={[0, 0.03, 0.002]}>
            <planeGeometry args={[0.24, 0.24]} />
            <meshStandardMaterial color="#54636b" />
          </mesh>
          {/* scratched-out face */}
          <mesh position={[0, 0.03, 0.004]} rotation={[0, 0, 0.7]}>
            <planeGeometry args={[0.22, 0.02]} />
            <meshStandardMaterial color="#d6453a" />
          </mesh>
          <mesh position={[0, 0.2, 0.004]}>
            <sphereGeometry args={[0.016, 8, 8]} />
            <meshStandardMaterial {...pin} />
          </mesh>
        </group>
      ))}
      {/* red string connecting the photos */}
      {[
        { a: photos[0].p, b: photos[1].p },
        { a: photos[1].p, b: photos[2].p },
        { a: photos[2].p, b: photos[0].p },
      ].map(({ a, b }, i) => {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const len = Math.hypot(dx, dy);
        return (
          <mesh
            key={i}
            position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.2, 0.045]}
            rotation={[0, 0, Math.atan2(dy, dx)]}
          >
            <planeGeometry args={[len, 0.008]} />
            <meshStandardMaterial color="#b3362c" />
          </mesh>
        );
      })}
      {/* center note */}
      <mesh position={[0.02, 0.02, 0.04]} rotation={[0, 0, -0.06]}>
        <planeGeometry args={[0.3, 0.2]} />
        <meshStandardMaterial color={COLORS.paper} />
      </mesh>
      <mesh position={[0.02, 0.1, 0.045]}>
        <sphereGeometry args={[0.016, 8, 8]} />
        <meshStandardMaterial {...pin} />
      </mesh>
    </group>
  );
}

/** Wall clock, stopped at 10:47 — the night the house went quiet. */
function WallClock() {
  const hand = { color: '#2b2b30' } as const;
  return (
    <group>
      {/* rim + face (torus already lies in the wall plane, facing +z) */}
      <mesh castShadow>
        <torusGeometry args={[0.3, 0.035, 10, 28]} />
        <meshStandardMaterial color="#3a2a1e" />
      </mesh>
      <mesh>
        <circleGeometry args={[0.3, 28]} />
        <meshStandardMaterial color={COLORS.paper} />
      </mesh>
      {/* hour ticks */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.25, Math.cos(a) * 0.25, 0.004]} rotation={[0, 0, -a]}>
            <planeGeometry args={[0.015, 0.05]} />
            <meshStandardMaterial {...hand} />
          </mesh>
        );
      })}
      {/* hour hand ~10:47 */}
      <group rotation={[0, 0, 0.65]}>
        <mesh position={[0, 0.08, 0.008]}>
          <planeGeometry args={[0.025, 0.16]} />
          <meshStandardMaterial {...hand} />
        </mesh>
      </group>
      {/* minute hand at 47 past */}
      <group rotation={[0, 0, 1.36]}>
        <mesh position={[0, 0.11, 0.01]}>
          <planeGeometry args={[0.018, 0.22]} />
          <meshStandardMaterial {...hand} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.012]}>
        <circleGeometry args={[0.02, 12]} />
        <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Wall calendar — a board with a circled date. */
function WallCalendar() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.9, 0.04]} />
        <meshStandardMaterial color="#e9e4d2" />
      </mesh>
      <mesh position={[0, 0.1, 0.021]}>
        <planeGeometry args={[0.7, 0.18]} />
        <meshStandardMaterial color="#36506b" />
      </mesh>
      {/* grid hint */}
      {[-0.25, 0, 0.25].map((y) =>
        [-0.25, 0, 0.25].map((x) => (
          <mesh key={`${x}${y}`} position={[x, y - 0.18, 0.022]}>
            <planeGeometry args={[0.12, 0.12]} />
            <meshStandardMaterial color="#cfc6b0" />
          </mesh>
        )),
      )}
      {/* circled 14th */}
      <mesh position={[0.25, -0.18, 0.024]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.09, 0.012, 8, 24]} />
        <meshStandardMaterial color="#d6453a" />
      </mesh>
    </group>
  );
}

/** Ceiling lamp — UV-capable, mirrors the bedroom's. */
function CeilingLamp() {
  const { wallHeight } = ROOM;
  const uv = useGameStore((s) => s.lampColor === 'uv');
  const bulbColor = uv ? '#6a2bd8' : COLORS.lampBulb;
  const glowColor = uv ? '#8a2bff' : '#ffd9a0';
  return (
    <group>
      <mesh position={[0, wallHeight - 0.6, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
        <meshStandardMaterial color={COLORS.lampCord} />
      </mesh>
      <mesh position={[0, wallHeight - 1.25, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={bulbColor} emissive={glowColor} emissiveIntensity={uv ? 1.4 : 0.9} />
      </mesh>
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

/** Office exit door (level transition once all four clues are held). */
function Door() {
  const doorWood = '#4a3226';
  const frameWood = '#3a2a1e';
  const brass = { color: '#c9a227', metalness: 0.4, roughness: 0.5 } as const;
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
        <meshStandardMaterial color={doorWood} />
      </mesh>
      {[1.75, 0.72].map((y) => (
        <mesh key={y} position={[0, y, 0.07]}>
          <boxGeometry args={[0.8, 0.85, 0.02]} />
          <meshStandardMaterial color="#3a2a1e" />
        </mesh>
      ))}
      <mesh position={[0.42, 1.2, 0.1]} castShadow>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial {...brass} />
      </mesh>
      {/* deadbolt — the office was locked from the outside */}
      <mesh position={[-0.42, 1.2, 0.08]}>
        <boxGeometry args={[0.12, 0.06, 0.05]} />
        <meshStandardMaterial color={COLORS.metal} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

const MODELS: Record<string, ComponentType> = {
  notebook: CipherNotebook,
  'answering-machine': AnsweringMachine,
  desk: Desk,
  'desk-drawer': DrawerFront,
  'drawer-key': DrawerKey,
  chair: Chair,
  'ledger-page': LedgerPage,
  'filing-cabinet': FilingCabinet,
  'voss-letters': VossLetters,
  bookshelf: Bookshelf,
  window: Window,
  corkboard: Corkboard,
  'wall-clock': WallClock,
  'press-photo': PressPhoto,
  'wall-safe': WallSafe,
  'story-draft': StoryDraft,
  calendar: WallCalendar,
  lamp: CeilingLamp,
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
      <directionalLight position={[6, 10, 4]} intensity={dirIntensity} color={dirColor} castShadow shadow-mapSize={[2048, 2048]} />
    </>
  );
}

function OfficeScene() {
  return (
    <group>
      <RoomLighting />
      <RoomShell
        width={ROOM.width}
        depth={ROOM.depth}
        height={ROOM.wallHeight}
        floorColor={COLORS.floor}
        ceilingColor="#d8d2c6"
        wallColors={{
          back: COLORS.wallBack,
          front: COLORS.wallBack,
          left: COLORS.wallSide,
          right: COLORS.wallSide,
        }}
      />
      <Decor />
      <RoomObjects objects={OBJECTS} models={MODELS} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Level definition                                                     */
/* ------------------------------------------------------------------ */

const office: LevelConfig = {
  id: 'office',
  name: 'The Office',
  Scene: OfficeScene,
  lightingPanel: true,
  objective: {
    text: 'Work Vera’s office. The notebook is in code, and more than one thing here is locked that shouldn’t be.',
    clueItems: DOOR_REQUIRES,
    completeWhenItems: DOOR_REQUIRES,
    completeText: 'All five pieces are in hand. The bolt on the office door is ready to slide.',
  },
};

export default office;
