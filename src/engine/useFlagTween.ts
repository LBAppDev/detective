/**
 * useFlagTween — bind a mesh/group transform to a store flag.
 * When the flag turns on, the object damps toward `to`; off → `from`.
 * Covers rugs, drawers, doors, lids, sliding furniture, rotating
 * mirrors... any two-state animated object, with zero per-object code.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Group } from 'three';
import { useGameStore } from '../store/gameStore';

type Vec3 = [number, number, number];

export type FlagTweenOptions = {
  position?: { from: Vec3; to: Vec3 };
  rotation?: { from: Vec3; to: Vec3 };
  /** Damping speed (higher = snappier). Default 5. */
  speed?: number;
};

export function useFlagTween(flag: string, opts: FlagTweenOptions) {
  const ref = useRef<Group>(null);
  const active = useGameStore((s) => !!s.flags[flag]);

  useFrame((_, dt) => {
    const obj = ref.current;
    if (!obj) return;
    const k = opts.speed ?? 5;
    if (opts.position) {
      const t = active ? opts.position.to : opts.position.from;
      obj.position.set(
        MathUtils.damp(obj.position.x, t[0], k, dt),
        MathUtils.damp(obj.position.y, t[1], k, dt),
        MathUtils.damp(obj.position.z, t[2], k, dt),
      );
    }
    if (opts.rotation) {
      const t = active ? opts.rotation.to : opts.rotation.from;
      obj.rotation.x = MathUtils.damp(obj.rotation.x, t[0], k, dt);
      obj.rotation.y = MathUtils.damp(obj.rotation.y, t[1], k, dt);
      obj.rotation.z = MathUtils.damp(obj.rotation.z, t[2], k, dt);
    }
  });

  return ref;
}
