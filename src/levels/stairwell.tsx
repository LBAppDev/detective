/**
 * Level: The Stairwell (Chapter 4 — finale).
 * Where the lie was staged. The player proves the fall was theater,
 * gets the witness on the phone, and closes the case at the front door.
 * Puzzle chain:
 *   1. The stair runner at the foot of the stairs peels back → the
 *      "M.H." cufflink is wedged against the tack strip.
 *   2. The scuffed floorboards: in daylight the drag marks vanish.
 *      Slide the time-of-day to night and the raking lamplight throws
 *      them into relief — one straight run, office door to stair foot.
 *   3. With both in hand, the hall telephone (number in Vera's address
 *      book) reaches Nadia. First call she hangs up; the second time,
 *      led with the evidence, she gives the statement that names Hale.
 *   4. The front door: the final accusation. Pick the killer from the
 *      suspect roster — the right name closes Case #47-1014.
 *
 * Puzzle state uses namespaced flags in the global store (stairwell.*);
 * 'case.solved' is intentionally global.
 */
import { useMemo, useRef, type ComponentType } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial, type Group } from 'three';
import { useGameStore } from '../store/gameStore';
import { playSound } from '../engine/feedback';
import { useFlagTween } from '../engine/useFlagTween';
import RoomObjects from '../components/RoomObjects';
import RoomShell from '../components/RoomShell';
import { EPILOGUE } from '../story/case';
import type { LevelConfig, RoomObjectConfig } from './types';

const ROOM = { width: 10, depth: 10, wallHeight: 4 };

const COLORS = {
  floor: '#6b5238',
  wallBack: '#5a5462',
  wallSide: '#6a6472',
  wood: '#4a3526',
  stair: '#57402c',
  runner: '#7a2f36',
  brass: '#c9a227',
  metal: '#8a8f96',
  paper: '#e9e4d2',
  chalk: '#e8e4da',
  lampBulb: '#ffe9b8',
};

/** Namespaced puzzle flags for this room. */
const FLAGS = {
  runnerLifted: 'stairwell.runnerLifted',
  phoneTried: 'stairwell.phoneTried',
  caseSolved: 'case.solved',
};

/** The night threshold where the raking lamplight reveals the drag marks. */
const NIGHT = 0.25;

/** Items needed before the front door will take an accusation. */
const DOOR_REQUIRES = ['cufflink', 'stair_scratches', 'nadia_statement'];

/** Front door: locked → hint → the final accusation → the epilogue. */
function closeCase() {
  const s = useGameStore.getState();
  if (s.flags[FLAGS.caseSolved]) {
    s.openModal({ kind: 'examine', title: EPILOGUE.title, text: EPILOGUE.text });
    return;
  }
  const found = DOOR_REQUIRES.filter((id) => s.inventory.includes(id)).length;
  if (found < DOOR_REQUIRES.length) {
    playSound('deny');
    const left = DOOR_REQUIRES.length - found;
    s.showToast(
      `Not yet. You walk out that door with a name you can prove — the stairwell still owes you ${left} piece${
        left === 1 ? '' : 's'
      } of it.`,
    );
    return;
  }
  s.openModal({
    kind: 'accuse',
    title: 'Name the Killer',
    prompt:
      'Five years, five suspects, one visitor she poured wine for \u2014 and two of them share the initials on the cufflink. You get one accusation in front of the family. Say the wrong name, and the file closes for good.',
    culpritId: 'hale',
    failFlag: 'case.failed',
    wrongText: {
      voss:
        'Voss threatened her in writing, in public, for months — and spent the night of the 14th on a gala stage in front of four hundred witnesses. Men who write first don\u2019t poison quietly.',
      nadia:
        'Nadia was Iris. She risked everything to put the ledger page in Vera\u2019s hands — she\u2019s the reason there\u2019s a case at all. The tip line betrayed them both.',
      ashe:
        'Ashe still had a key, but every thread signs the same initial: the gift tag, the note, the voicemail, the cufflink. \u0022M\u0022 isn\u2019t Gregory.',
      harrow:
        'Harrow fits the cufflink \u2014 and nothing else. Vera would never pour two glasses for the man who hand-delivered her threats, the Blue Room meeting was set through a tip line only The Ledger could read, and \u0022I\u2019ll come to you\u0022 is on her answering machine in another man\u2019s voice. The initials match; the trust doesn\u2019t.',
    },
    onSuccess: [
      { flag: FLAGS.caseSolved },
      { sound: 'success' },
      { openModal: { kind: 'examine', title: EPILOGUE.title, text: EPILOGUE.text } },
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Object/hotspot config                                                */
/* ------------------------------------------------------------------ */

const OBJECTS: RoomObjectConfig[] = [
  {
    id: 'stairs',
    name: 'the stairs',
    position: [-2.25, 0, -4.1],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'The Stairs',
      text: 'Eight steps to the upper floor. The report says she fell from the top — but the dust on the banister is wiped in one long, unbroken smear, top to bottom. A gloved hand, steadying a heavy load on the way down.',
    },
  },
  {
    id: 'chalk-outline',
    name: 'chalk outline',
    position: [0.15, 0.02, -2.55],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Where They Found Her',
      text: 'Five years of dust haven\u2019t erased the tape shadow. She lay with her head toward the hall and her feet toward the bottom step. People who fall down stairs don\u2019t land facing back up them.',
    },
  },
  {
    id: 'runner',
    name: 'stair runner',
    position: [-0.7, 0, -2.8],
    interactable: true,
    interaction: {
      type: 'custom',
      run: (s) => {
        if (!s.flags[FLAGS.runnerLifted]) {
          s.setFlag(FLAGS.runnerLifted);
          playSound('slide');
          s.showToast('The runner peels back, stiff with age. Something small glints against the tack strip.');
        } else {
          s.openModal({
            kind: 'examine',
            title: 'Stair Runner',
            text: 'Folded back off the bottom step. The tack strip beneath has already given up what it was holding.',
          });
        }
      },
    },
  },
  {
    id: 'cufflink',
    name: 'silver cufflink',
    position: [-0.75, 0.02, -3.0],
    interactable: true,
    visible: (s) => !!s.flags[FLAGS.runnerLifted] && !s.inventory.includes('cufflink'),
    interaction: {
      type: 'collect',
      item: 'cufflink',
      actions: [
        {
          toast:
            'Silver, monogrammed "M.H." — torn loose in a struggle no accident report ever mentioned. Two men in this file wear those initials.',
        },
      ],
    },
  },
  {
    id: 'floorboards',
    name: 'scuffed floorboards',
    position: [2.1, 0.02, -1.2],
    interactable: true,
    // One hotspot, three states: logged / revealed at night / daylight hint.
    interaction: {
      type: 'custom',
      run: (s) => {
        if (s.inventory.includes('stair_scratches')) {
          s.openModal({
            kind: 'examine',
            title: 'Drag Marks',
            text: 'Logged. One straight run from the office doorway to the foot of the stairs. The scene was staged.',
          });
        } else if (s.timeOfDay <= NIGHT) {
          s.addItem('stair_scratches');
          playSound('success');
          s.showToast(
            'In the low lamplight the scratches line up — one straight run, office door to stair foot. Bodies don\u2019t fall uphill. She was placed.',
          );
        } else {
          s.openModal({
            kind: 'examine',
            title: 'Floorboards',
            text: 'Faint scuffs in the wax, crossing the hall — but the daylight flattens them to nothing. A low, raking light would throw them into relief. Kill the daylight and let the lamp do the work.',
          });
        }
      },
    },
  },
  {
    id: 'hall-table',
    name: 'telephone table',
    position: [4.6, 0, 2.6],
    rotation: [0, -Math.PI / 2, 0],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Telephone Table',
      text: 'A narrow table by the door. The dust keeps a clean rectangle beside the phone — something laptop-sized sat here for years, and left that night with someone.',
    },
  },
  {
    id: 'address-book',
    name: 'address book',
    position: [4.55, 0.815, 3.15],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Address Book',
      text: 'Vera\u2019s address book, still open by the phone. Under S: \u0022Nadia Sorel \u2014 bookkeeping, Halloway Trust,\u0022 and a number in pencil, underlined twice.',
    },
  },
  {
    id: 'phone',
    name: 'telephone',
    position: [4.55, 0.815, 2.35],
    interactable: true,
    interaction: {
      type: 'custom',
      run: (s) => {
        if (s.inventory.includes('nadia_statement')) {
          s.openModal({
            kind: 'examine',
            title: 'Telephone',
            text: 'The line stays quiet now. Nadia said the only thing she\u2019d ever say: one person at The Ledger could read the tip line. She wouldn\u2019t give the name. That part is yours.',
          });
          return;
        }
        const ready = s.inventory.includes('cufflink') && s.inventory.includes('stair_scratches');
        if (!ready) {
          playSound('deny');
          s.showToast(
            'You know who to call — but Nadia hung up on the police five years ago. Walk in with half a story and she hangs up on you too. Read the stairs first.',
          );
          return;
        }
        if (!s.flags[FLAGS.phoneTried]) {
          s.setFlag(FLAGS.phoneTried);
          playSound('click');
          s.openModal({
            kind: 'examine',
            title: 'Telephone',
            text: 'You dial the penciled number. One ring — \u0022Halloway Trust, bookkeeping.\u0022 The moment you say Vera Caldwell\u2019s name, the line goes dead. She\u2019s scared, not gone. Call back — and lead with what you\u2019re holding.',
          });
          return;
        }
        s.addItem('nadia_statement');
        playSound('success');
        s.openModal({
          kind: 'examine',
          title: 'Nadia\u2019s Statement',
          text: 'You lead with the cufflink, the photograph, the drag marks. A long silence. Then, very quietly: \u0022I was Iris. I set the Blue Room meeting through the paper\u2019s tip line — it was supposed to be safe. Only one person at The Ledger could read that tip line.\u0022 You ask who. The line clicks dead. She never says the name — she doesn\u2019t have to. Everything you\u2019ve found already does.',
        });
      },
    },
  },
  {
    id: 'stair-photos',
    name: 'framed photographs',
    position: [-2.4, 2.5, -4.94],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Framed Photographs',
      text: 'Vera\u2019s bylines climb the stair wall, framed — her first front page at the top. The third frame hangs crooked, and the plaster behind it is scuffed at shoulder height. Someone braced against this wall on the way down, carrying more than himself.',
    },
  },
  {
    id: 'coat-rack',
    name: 'coat rack',
    position: [-3.9, 0, 4.3],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Coat Rack',
      text: 'Her coat still hangs by the door, an umbrella beneath it. Her suitcase was packed, her ticket locked inside it. She never meant to be here past 11:40.',
    },
  },
  {
    id: 'mirror',
    name: 'hall mirror',
    position: [4.94, 1.7, -1.7],
    rotation: [0, -Math.PI / 2, 0],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Hall Mirror',
      text: 'A brass-framed mirror by the door. Whoever let himself out that night was the last thing it saw — straightening his cuffs, one of them suddenly bare.',
    },
  },
  {
    id: 'office-doorway',
    name: 'office doorway',
    position: [4.97, 0, 0],
    rotation: [0, -Math.PI / 2, 0],
    interactable: true,
    interaction: {
      type: 'examine',
      title: 'Office Doorway',
      text: 'The door to her office stands wide against the wall — she kept it locked, and it was found open. The drag line starts at this threshold: a scuff of shoe polish on the frame at knee height, where a heel caught on the way out.',
    },
  },
  {
    id: 'lamp',
    name: 'hall lamp',
    position: [1.2, 0, 0.6],
    interactable: true,
    interaction: { type: 'custom', run: () => useGameStore.getState().toggleLightPanel() },
  },
  {
    id: 'front-door',
    name: 'front door',
    position: [0.6, 0, 4.94],
    rotation: [0, Math.PI, 0],
    interactable: true,
    interaction: { type: 'custom', run: () => closeCase() },
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

/**
 * The staircase, in hotspot-local coordinates (origin = center of the
 * main flight at floor level): eight solid risers ascending toward the
 * left wall, a solid landing, and a second flight turning up along the
 * left wall toward the unseen upper floor. Open side faces the hall.
 */
function Stairs() {
  const steps = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <group>
      {/* main flight — solid risers */}
      {steps.map((k) => {
        const h = (k + 1) * 0.225;
        return (
          <mesh key={k} position={[1.55 - k * 0.45, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.45, h, 1.7]} />
            <meshStandardMaterial color={COLORS.stair} />
          </mesh>
        );
      })}
      {/* runner: a strip on each tread + the vertical riser face */}
      {steps.map((k) => (
        <group key={`r${k}`}>
          <mesh position={[1.55 - k * 0.45, (k + 1) * 0.225 + 0.007, 0]}>
            <boxGeometry args={[0.46, 0.012, 1.0]} />
            <meshStandardMaterial color={COLORS.runner} roughness={1} />
          </mesh>
          <mesh position={[1.55 - k * 0.45 + 0.228, (k + 0.5) * 0.225, 0]}>
            <boxGeometry args={[0.012, 0.225, 1.0]} />
            <meshStandardMaterial color={COLORS.runner} roughness={1} />
          </mesh>
        </group>
      ))}
      {/* solid landing continuing the top step to the left wall */}
      <mesh position={[-2.28, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 1.8, 1.7]} />
        <meshStandardMaterial color={COLORS.stair} />
      </mesh>
      {/* second flight turning up along the left wall */}
      {[0, 1, 2, 3].map((j) => {
        const h = (9 + j) * 0.225;
        return (
          <mesh key={`u${j}`} position={[-1.9, h / 2, 1.1 + j * 0.45]} castShadow receiveShadow>
            <boxGeometry args={[1.7, h, 0.45]} />
            <meshStandardMaterial color={COLORS.stair} />
          </mesh>
        );
      })}
      {/* newel posts: foot of the stairs + landing corner */}
      <mesh position={[1.75, 0.55, 0.85]} castShadow>
        <boxGeometry args={[0.12, 1.1, 0.12]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
      <mesh position={[1.75, 1.14, 0.85]} castShadow>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
      <mesh position={[-1.85, 2.25, 0.85]} castShadow>
        <boxGeometry args={[0.12, 0.9, 0.12]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
      <mesh position={[-1.85, 2.74, 0.85]} castShadow>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
      {/* balusters sized so each meets the sloped rail */}
      {[1, 2, 3, 4, 5, 6].map((k) => {
        const h = 0.87 - 0.031 * k;
        return (
          <mesh
            key={`b${k}`}
            position={[1.55 - k * 0.45, (k + 1) * 0.225 + h / 2, 0.85]}
            castShadow
          >
            <cylinderGeometry args={[0.025, 0.025, h, 8]} />
            <meshStandardMaterial color={COLORS.wood} />
          </mesh>
        );
      })}
      {/* main handrail, foot newel to landing newel */}
      <mesh position={[-0.05, 1.83, 0.85]} rotation={[0, 0, 1.164]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 3.95, 10]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
      {/* second-flight balusters + rail along the open side */}
      {[0, 1, 2, 3].map((j) => (
        <mesh
          key={`ub${j}`}
          position={[-1.05, (9 + j) * 0.225 + 0.425, 1.1 + j * 0.45]}
          castShadow
        >
          <cylinderGeometry args={[0.025, 0.025, 0.85, 8]} />
          <meshStandardMaterial color={COLORS.wood} />
        </mesh>
      ))}
      <mesh position={[-1.05, 3.24, 1.775]} rotation={[1.107, 0, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 1.7, 10]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
    </group>
  );
}

/** The tape shadow at the foot of the stairs — head toward the hall. */
function ChalkOutline() {
  const chalk = <meshStandardMaterial color={COLORS.chalk} transparent opacity={0.75} />;
  return (
    <group rotation={[0, 0.5, 0]}>
      {/* head (toward the hall, +z) */}
      <mesh position={[0, 0.011, 0.62]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.11, 0.14, 20]} />
        {chalk}
      </mesh>
      {/* torso */}
      {[-0.14, 0.14].map((x) => (
        <mesh key={x} position={[x, 0.011, 0.18]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.035, 0.6]} />
          {chalk}
        </mesh>
      ))}
      {/* arms, one thrown wide */}
      <mesh position={[-0.32, 0.011, 0.32]} rotation={[-Math.PI / 2, 0, 0.9]}>
        <planeGeometry args={[0.035, 0.45]} />
        {chalk}
      </mesh>
      <mesh position={[0.26, 0.011, 0.34]} rotation={[-Math.PI / 2, 0, -0.5]}>
        <planeGeometry args={[0.035, 0.4]} />
        {chalk}
      </mesh>
      {/* legs (toward the bottom step, -z) */}
      {[-0.1, 0.12].map((x, i) => (
        <mesh key={x} position={[x, 0.011, -0.35]} rotation={[-Math.PI / 2, 0, i === 0 ? 0.15 : -0.2]}>
          <planeGeometry args={[0.035, 0.55]} />
          {chalk}
        </mesh>
      ))}
    </group>
  );
}

/**
 * The runner's floor tongue, continuing the stair runner onto the hall
 * floor. Hinged against the bottom step's front edge, so on its flag it
 * peels up and folds back over the stairs instead of spinning in place.
 */
function Runner() {
  const flap = useFlagTween(FLAGS.runnerLifted, {
    rotation: { from: [0, 0, 0], to: [-2.4, 0, 0] },
    position: { from: [0, 0, 0], to: [0, 0.03, -0.02] },
    speed: 3.5,
  });
  return (
    <group>
      {/* hinge group sits on the bottom step's front edge */}
      <group position={[0, 0, -0.45]}>
        <group ref={flap}>
          <mesh position={[0, 0.02, 0.475]} castShadow>
            <boxGeometry args={[0.46, 0.02, 0.95]} />
            <meshStandardMaterial color={COLORS.runner} roughness={1} />
          </mesh>
        </group>
      </group>
      {/* tack strip revealed beneath */}
      <mesh position={[0, 0.004, -0.38]}>
        <boxGeometry args={[0.5, 0.01, 0.06]} />
        <meshStandardMaterial color="#3a2a1e" />
      </mesh>
    </group>
  );
}

/** The "M.H." cufflink against the tack strip. */
function Cufflink() {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} rotation={[0.4, 0, 0.3]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.015, 12]} />
        <meshStandardMaterial color="#c8ccd4" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0.015, 0.045, 0.01]}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshStandardMaterial color="#c8ccd4" metalness={0.85} roughness={0.25} />
      </mesh>
      <EvidenceShimmer radius={0.16} y={0.004} />
    </group>
  );
}

/**
 * Drag marks across the hall — pale scratches in the wax that damp in
 * as the daylight dies (ResidueGlow pattern, keyed on time-of-day).
 * Rendered as always-present decor; the 'floorboards' hotspot collects.
 */
function DragMarks() {
  const ref = useRef<Group>(null);
  const reveal = useRef(0);
  const night = useGameStore((s) => s.timeOfDay <= NIGHT);

  useFrame((_, dt) => {
    reveal.current = MathUtils.damp(reveal.current, night ? 1 : 0, 3.5, dt);
    ref.current?.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const mat = obj.material;
      if (mat instanceof MeshStandardMaterial) mat.opacity = reveal.current * 0.75;
    });
  });

  // Runs from the office threshold (~4.1, 0.45) to the stair foot (~0.1, -2.85).
  return (
    <group ref={ref} position={[2.1, 0.012, -1.2]} rotation={[0, 2.46, 0]}>
      {[-0.16, -0.05, 0.06, 0.16].map((z, i) => (
        <mesh key={z} position={[i * 0.12 - 0.18, 0, z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <planeGeometry args={[5.2 - i * 0.35, 0.035]} />
          <meshStandardMaterial color="#c2a878" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/** The clickable worn patch where the drag marks cross the hall. */
function Floorboards() {
  return (
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, -0.68]}>
      <planeGeometry args={[1.8, 1.2]} />
      <meshStandardMaterial color="#5a4530" transparent opacity={0.35} depthWrite={false} />
    </mesh>
  );
}

/** Narrow telephone table against the right wall. */
function HallTable() {
  return (
    <group>
      <mesh position={[0, 0.79, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.05, 0.55]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
      {[-0.65, 0.65].map((x) =>
        [-0.2, 0.2].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.39, z]} castShadow>
            <boxGeometry args={[0.06, 0.78, 0.06]} />
            <meshStandardMaterial color={COLORS.wood} />
          </mesh>
        )),
      )}
      {/* the clean rectangle in the dust where the laptop lived */}
      <mesh position={[0.35, 0.818, 0]} rotation={[-Math.PI / 2, 0, 0.06]}>
        <planeGeometry args={[0.42, 0.3]} />
        <meshStandardMaterial color="#54402f" />
      </mesh>
    </group>
  );
}

/** Rotary telephone, the receiver waiting. */
function Phone() {
  return (
    <group rotation={[0, -Math.PI / 2 + 0.2, 0]}>
      <mesh position={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[0.24, 0.12, 0.22]} />
        <meshStandardMaterial color="#20242c" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.125, 0.03]} rotation={[-0.5, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.015, 16]} />
        <meshStandardMaterial color="#e7dcc2" roughness={0.6} />
      </mesh>
      {/* handset across the cradle */}
      <mesh position={[0, 0.15, -0.06]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.03, 0.16, 4, 8]} />
        <meshStandardMaterial color="#20242c" roughness={0.4} />
      </mesh>
      <EvidenceShimmer radius={0.2} y={0.004} />
    </group>
  );
}

/** Vera's address book, open beside the phone. */
function AddressBook() {
  return (
    <group rotation={[0, 0.4, 0]}>
      <mesh position={[0, 0.015, 0]} castShadow>
        <boxGeometry args={[0.22, 0.03, 0.3]} />
        <meshStandardMaterial color="#5a3030" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.032, 0]}>
        <boxGeometry args={[0.2, 0.005, 0.28]} />
        <meshStandardMaterial color={COLORS.paper} />
      </mesh>
    </group>
  );
}

/** Framed bylines climbing the stair wall — the third one crooked. */
function StairPhotos() {
  const frames: Array<{ x: number; y: number; tilt: number }> = [
    { x: 1.5, y: -0.5, tilt: 0 },
    { x: 0.7, y: -0.15, tilt: 0 },
    { x: -0.1, y: 0.2, tilt: -0.16 },
    { x: -0.9, y: 0.55, tilt: 0 },
  ];
  return (
    <group>
      {frames.map(({ x, y, tilt }) => (
        <group key={x} position={[x, y, 0]} rotation={[0, 0, tilt]}>
          <mesh castShadow>
            <boxGeometry args={[0.34, 0.42, 0.03]} />
            <meshStandardMaterial color={COLORS.wood} />
          </mesh>
          <mesh position={[0, 0, 0.018]}>
            <planeGeometry args={[0.26, 0.34]} />
            <meshStandardMaterial color="#cfc6b2" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Coat rack by the door — her coat and umbrella, still waiting. */
function CoatRack() {
  return (
    <group>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.8, 8]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.06, 12]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
      {[0.6, 2.2, 3.8].map((r) => (
        <mesh key={r} position={[Math.cos(r) * 0.12, 1.68, Math.sin(r) * 0.12]} rotation={[0.5, r, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.22, 6]} />
          <meshStandardMaterial color={COLORS.brass} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
      {/* her coat */}
      <mesh position={[0.14, 1.15, 0.05]} rotation={[0, 0.3, 0.05]} castShadow>
        <boxGeometry args={[0.32, 0.85, 0.14]} />
        <meshStandardMaterial color="#5c4a52" roughness={1} />
      </mesh>
      {/* umbrella against the pole */}
      <group position={[-0.16, 0, 0.1]} rotation={[0, 0, 0.18]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.02, 0.8, 8]} />
          <meshStandardMaterial color="#2e3138" />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
          <meshStandardMaterial color={COLORS.wood} />
        </mesh>
      </group>
    </group>
  );
}

/** The office doorway on the right wall — where the drag line starts.
 *  The door stands wide against the wall, opening onto darkness. */
function OfficeDoorway() {
  const frameWood = '#3a2a1e';
  return (
    <group>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 1.25, 0.02]} castShadow>
          <boxGeometry args={[0.12, 2.5, 0.12]} />
          <meshStandardMaterial color={frameWood} />
        </mesh>
      ))}
      <mesh position={[0, 2.46, 0.02]} castShadow>
        <boxGeometry args={[1.22, 0.12, 0.12]} />
        <meshStandardMaterial color={frameWood} />
      </mesh>
      {/* dark opening into the office */}
      <mesh position={[0, 1.22, 0.01]}>
        <planeGeometry args={[0.98, 2.4]} />
        <meshStandardMaterial color="#14121a" />
      </mesh>
      {/* the door leaf, flat against the wall — fully open, never shut again */}
      <mesh position={[1.15, 1.22, 0.06]} castShadow>
        <boxGeometry args={[1.0, 2.4, 0.07]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
      <mesh position={[0.78, 1.2, 0.1]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color={COLORS.brass} metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Brass-framed hall mirror on the right wall. */
function HallMirror() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.7, 1.1, 0.04]} />
        <meshStandardMaterial color={COLORS.brass} metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[0.58, 0.98]} />
        <meshStandardMaterial color="#aeb6c2" metalness={0.9} roughness={0.12} />
      </mesh>
    </group>
  );
}

/** Hall pendant lamp — UV-capable, mirrors the other rooms. */
function PendantLamp() {
  const { wallHeight } = ROOM;
  const uv = useGameStore((s) => s.lampColor === 'uv');
  const bulbColor = uv ? '#6a2bd8' : COLORS.lampBulb;
  const glowColor = uv ? '#8a2bff' : '#ffd9a0';
  return (
    <group>
      <mesh position={[0, wallHeight - 0.45, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.9, 8]} />
        <meshStandardMaterial color="#2b2b30" />
      </mesh>
      {/* frosted globe shade */}
      <mesh position={[0, wallHeight - 1.0, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color={bulbColor}
          emissive={glowColor}
          emissiveIntensity={uv ? 1.3 : 0.8}
          transparent
          opacity={0.92}
        />
      </mesh>
      <pointLight
        position={[0, wallHeight - 1.15, 0]}
        intensity={uv ? 9 : 6}
        distance={10}
        decay={1.5}
        color={glowColor}
      />
    </group>
  );
}

/** The front door — the way out, and the end of the case. Swings open
 *  on its hinge once the case is closed. */
function FrontDoor() {
  const solved = useGameStore((s) => !!s.flags[FLAGS.caseSolved]);
  const swing = useFlagTween(FLAGS.caseSolved, {
    rotation: { from: [0, 0, 0], to: [0, 0.85, 0] },
    speed: 1.6,
  });
  const frameWood = '#3a2a1e';
  return (
    <group>
      {[-0.68, 0.68].map((x) => (
        <mesh key={x} position={[x, 1.35, 0.02]} castShadow>
          <boxGeometry args={[0.14, 2.7, 0.14]} />
          <meshStandardMaterial color={frameWood} />
        </mesh>
      ))}
      <mesh position={[0, 2.67, 0.02]} castShadow>
        <boxGeometry args={[1.5, 0.14, 0.14]} />
        <meshStandardMaterial color={frameWood} />
      </mesh>
      {/* dark night beyond the doorway, seen once the door swings */}
      <mesh position={[0, 1.3, -0.02]}>
        <planeGeometry args={[1.2, 2.6]} />
        <meshStandardMaterial color="#101322" />
      </mesh>
      {/* the door panel + its trim swing together on the hinge */}
      <group position={[-0.6, 0, 0.03]} ref={swing}>
        <group position={[0.6, 0, 0]}>
          <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 2.6, 0.07]} />
            <meshStandardMaterial color={COLORS.wood} />
          </mesh>
          {[1.85, 0.75].map((y) => (
            <mesh key={y} position={[0, y, 0.04]}>
              <boxGeometry args={[0.9, 0.9, 0.02]} />
              <meshStandardMaterial color={frameWood} />
            </mesh>
          ))}
          <mesh position={[0.46, 1.25, 0.07]} castShadow>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color={COLORS.brass} metalness={0.4} roughness={0.5} />
          </mesh>
          {/* mail slot */}
          <mesh position={[0, 1.02, 0.05]}>
            <boxGeometry args={[0.34, 0.07, 0.02]} />
            <meshStandardMaterial color={COLORS.brass} metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
      </group>
      {/* fanlight over the door — warms up once the case is closed */}
      <mesh position={[0, 2.74, 0.05]}>
        <ringGeometry args={[0.52, 0.6, 20, 1, 0, Math.PI]} />
        <meshStandardMaterial color={frameWood} />
      </mesh>
      <mesh position={[0, 2.74, 0.04]}>
        <circleGeometry args={[0.52, 20, 0, Math.PI]} />
        <meshStandardMaterial
          color={solved ? '#ffdf9e' : '#3c4358'}
          emissive={solved ? '#ffd27a' : '#1a2030'}
          emissiveIntensity={solved ? 0.9 : 0.3}
        />
      </mesh>
    </group>
  );
}

/** Static dressing: floorboard seams, a hall rug, skirting shadow. */
function Decor() {
  const seams = useMemo(() => {
    const list: number[] = [];
    for (let i = 0; i < 12; i++) list.push(-4.6 + i * 0.84);
    return list;
  }, []);
  return (
    <group>
      {/* floorboard seams */}
      {seams.map((x) => (
        <mesh key={x} position={[x, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.02, 10]} />
          <meshStandardMaterial color="#54402f" />
        </mesh>
      ))}
      {/* worn hall rug between door and stairs */}
      <mesh position={[0.6, 0.014, 1.6]} receiveShadow>
        <boxGeometry args={[2.2, 0.02, 3.2]} />
        <meshStandardMaterial color="#4c3f52" roughness={1} />
      </mesh>
      <mesh position={[0.6, 0.026, 1.6]}>
        <boxGeometry args={[1.9, 0.002, 2.9]} />
        <meshStandardMaterial color="#5c4a62" roughness={1} />
      </mesh>
    </group>
  );
}

const MODELS: Record<string, ComponentType> = {
  stairs: Stairs,
  'chalk-outline': ChalkOutline,
  runner: Runner,
  cufflink: Cufflink,
  floorboards: Floorboards,
  'hall-table': HallTable,
  'address-book': AddressBook,
  phone: Phone,
  'stair-photos': StairPhotos,
  'coat-rack': CoatRack,
  mirror: HallMirror,
  'office-doorway': OfficeDoorway,
  lamp: PendantLamp,
  'front-door': FrontDoor,
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
        position={[6, 10, -4]}
        intensity={dirIntensity}
        color={dirColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
    </>
  );
}

function StairwellScene() {
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
      {/* drag marks live outside the hotspot list so they can fade freely */}
      <DragMarks />
      <RoomObjects objects={OBJECTS} models={MODELS} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Level definition                                                     */
/* ------------------------------------------------------------------ */

const stairwell: LevelConfig = {
  id: 'stairwell',
  name: 'The Stairwell',
  Scene: StairwellScene,
  lightingPanel: true,
  objective: {
    text: 'This is where they found her — and where he staged it. Prove the fall was theater, then get the witness on the phone.',
    clueItems: DOOR_REQUIRES,
    completeWhenItems: DOOR_REQUIRES,
    completeText: 'Cufflink, drag marks, a named name. Close the case at the front door.',
  },
};

export default stairwell;
