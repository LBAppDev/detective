/**
 * Renders a level's object/hotspot config list.
 * Part of the core engine — levels supply data (configs) and models,
 * this handles visibility predicates and interaction wiring.
 */
import type { ComponentType } from 'react';
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
  // Subscribing to the store re-renders when object visibility changes.
  const gameState = useGameStore();

  return (
    <>
      {objects.map((obj) => {
        if (obj.visible && !obj.visible(gameState)) return null;
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
