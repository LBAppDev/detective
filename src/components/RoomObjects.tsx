/**
 * Renders a level's object/hotspot config list.
 * Part of the core engine — levels supply data (configs) and models,
 * this handles visibility predicates and interaction wiring.
 */
import type { ComponentType } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../store/gameStore';
import type { RoomObjectConfig } from '../levels/types';
import { interactObject } from '../engine/puzzles';
import Interactable from './Interactable';

type RoomObjectsProps = {
  objects: RoomObjectConfig[];
  /** Maps a config id to the component that renders its geometry. */
  models: Record<string, ComponentType>;
};

export default function RoomObjects({ objects, models }: RoomObjectsProps) {
  // Subscribe only to the per-object visibility results (shallow-compared),
  // so unrelated store churn (time-of-day drags, toasts, modals...) doesn't
  // re-render every hotspot in the room.
  const visibility = useGameStore(
    useShallow((s) => objects.map((obj) => (obj.visible ? obj.visible(s) : true))),
  );

  return (
    <>
      {objects.map((obj, index) => {
        if (!visibility[index]) return null;
        const Model = models[obj.id];
        if (!Model) return null;
        return obj.interactable ? (
          <Interactable
            key={obj.id}
            name={obj.name}
            position={obj.position}
            rotation={obj.rotation}
            onInteract={() => interactObject(obj)}
          >
            <Model />
          </Interactable>
        ) : (
          <group key={obj.id} position={obj.position} rotation={obj.rotation}>
            <Model />
          </group>
        );
      })}
    </>
  );
}
