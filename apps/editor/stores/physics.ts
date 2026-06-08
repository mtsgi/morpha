import { defineStore } from 'pinia';
import { useProjectStore } from './project';

export interface BonePhysicsSettings {
  enabled: boolean;
  mass: number;
  damping: number;     // 0.0 to 1.0
  stiffness: number;   // 0.0 to 1.0
  gravity: number;     // Gravity force factor
  wind: number;        // Wind/Noise susceptibility
}

export const usePhysicsStore = defineStore('physics', {
  state: () => ({
    /** プレビューモードなどで物理演算を有効化するかどうか */
    physicsEnabled: true,
  }),

  actions: {
    setPhysicsEnabled(boneId: string, enabled: boolean) {
      const projectStore = useProjectStore();
      if (!projectStore.project) return;
      const bone = projectStore.project.rig.bones.find(b => b.id === boneId);
      if (!bone) return;

      if (!bone.physics) {
        bone.physics = {
          enabled: false,
          mass: 1.0,
          damping: 0.1,
          stiffness: 0.1,
          gravity: 0.0,
          wind: 0.0,
        };
      }
      bone.physics.enabled = enabled;
      projectStore.markDirty();
    },

    updatePhysicsParam(boneId: string, key: keyof Omit<BonePhysicsSettings, 'enabled'>, value: number) {
      const projectStore = useProjectStore();
      if (!projectStore.project) return;
      const bone = projectStore.project.rig.bones.find(b => b.id === boneId);
      if (!bone || !bone.physics) return;

      bone.physics[key] = value;
      projectStore.markDirty();
    }
  }
});
