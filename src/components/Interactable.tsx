/**
 * Generic interactable wrapper: hover glow + pointer cursor + click/tap
 * handling with an orbit-drag guard. Part of the core engine — level
 * content should never need to reimplement interaction behavior.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Group, Mesh, MeshStandardMaterial } from 'three';

const HOVER_EMISSIVE = 0x4a4228;

type InteractableProps = {
  name: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  onInteract?: () => void;
  children: ReactNode;
};

export default function Interactable({
  name,
  position,
  rotation,
  onInteract,
  children,
}: InteractableProps) {
  const ref = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  // Apply / remove a subtle emissive glow on every mesh in the group.
  useEffect(() => {
    const group = ref.current;
    if (!group) return;
    group.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const mat = obj.material;
      if (!(mat instanceof MeshStandardMaterial)) return;
      if (hovered) {
        // Remember the original emissive settings once, so we can restore them.
        obj.userData.baseEmissive ??= mat.emissive.getHex();
        obj.userData.baseEmissiveIntensity ??= mat.emissiveIntensity;
        mat.emissive.setHex(HOVER_EMISSIVE);
        mat.emissiveIntensity = Math.max(0.6, obj.userData.baseEmissiveIntensity);
      } else if (obj.userData.baseEmissive !== undefined) {
        mat.emissive.setHex(obj.userData.baseEmissive);
        mat.emissiveIntensity = obj.userData.baseEmissiveIntensity;
      }
    });
  }, [hovered]);

  // Pointer cursor while hovering an interactable (desktop only, harmless on touch).
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Ignore "clicks" that were actually orbit drags/swipes.
    if (e.delta > 5) return;
    onInteract?.();
  };

  return (
    <group
      ref={ref}
      name={name}
      position={position}
      rotation={rotation}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
      onClick={handleClick}
    >
      {children}
    </group>
  );
}
