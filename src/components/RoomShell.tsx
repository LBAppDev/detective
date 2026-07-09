/**
 * RoomShell — reusable room enclosure: floor slab, four walls, and a ceiling.
 *
 * Walls and ceiling are single-sided planes with their normals facing the
 * room interior. Backface culling then hides them automatically whenever the
 * camera is on their far side, so as you orbit, the walls between you and
 * the room "disappear" (dollhouse/diorama effect). The ceiling is only
 * visible when the camera drops below ceiling height (e.g. zoomed inside).
 */

type WallColors = {
  back?: string;
  front?: string;
  left?: string;
  right?: string;
};

type RoomShellProps = {
  width?: number;
  depth?: number;
  height?: number;
  floorColor?: string;
  ceilingColor?: string;
  wallColors?: WallColors;
};

export default function RoomShell({
  width = 10,
  depth = 10,
  height = 4,
  floorColor = '#a8794f',
  ceilingColor = '#eae2d3',
  wallColors = {},
}: RoomShellProps) {
  const {
    back = '#4f7d7a',
    front = '#4f7d7a',
    left = '#d9c7a7',
    right = '#d9c7a7',
  } = wallColors;

  return (
    <group>
      {/* Floor (slab, so it has visible thickness at the edges) */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[width, 0.3, depth]} />
        <meshStandardMaterial color={floorColor} />
      </mesh>

      {/* Back wall (-z), normal faces +z (inward) */}
      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={back} />
      </mesh>

      {/* Front wall (+z), normal faces -z (inward) */}
      <mesh position={[0, height / 2, depth / 2]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={front} />
      </mesh>

      {/* Left wall (-x), normal faces +x (inward) */}
      <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={left} />
      </mesh>

      {/* Right wall (+x), normal faces -x (inward) */}
      <mesh position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={right} />
      </mesh>

      {/* Ceiling (y = height), normal faces down (inward) */}
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={ceilingColor} />
      </mesh>
    </group>
  );
}
