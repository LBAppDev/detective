/**
 * Level: The Office (placeholder).
 * Bare scene so the level transition can be verified; the "Coming Soon"
 * label renders as a DOM overlay via the placeholderLabel field.
 */
import type { LevelConfig } from './types';

function OfficeScene() {
  return (
    <group>
      <ambientLight intensity={0.35} color="#cfd4e8" />
      <directionalLight position={[6, 10, 4]} intensity={1.2} color="#dfe4f2" castShadow />

      {/* Bare floor */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[10, 0.3, 10]} />
        <meshStandardMaterial color="#6f6f78" />
      </mesh>
    </group>
  );
}

const office: LevelConfig = {
  id: 'office',
  name: 'The Office',
  Scene: OfficeScene,
  placeholderLabel: 'Office — Coming Soon',
};

export default office;
