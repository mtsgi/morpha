import { defineStore } from 'pinia';
import type { Bone, Vector2 } from '@morpha/core';
import { useProjectStore } from './project';
import { useHistoryStore } from './history';

export const useBonesStore = defineStore('bones', {
  state: () => ({
    activeBoneId: null as string | null,
  }),

  getters: {
    bones(): Bone[] {
      const projectStore = useProjectStore();
      return projectStore.project?.rig.bones ?? [];
    },

    activeBone(): Bone | null {
      if (!this.activeBoneId) return null;
      return this.bones.find(b => b.id === this.activeBoneId) ?? null;
    },

    /**
     * ボーン階層ツリーを構築するゲッター
     */
    bonesTree(): any[] {
      const bones = this.bones;
      const buildTree = (parentId: string | null): any[] => {
        return bones
          .filter(b => b.parentId === parentId)
          .map(b => ({
            ...b,
            children: buildTree(b.id),
          }));
      };
      return buildTree(null);
    },
  },

  actions: {
    /**
     * 新しいボーンを追加
     */
    addBone(
      parentId: string | null = null,
      position: Vector2 = [0, 0],
      name?: string
    ): Bone | null {
      const projectStore = useProjectStore();
      const historyStore = useHistoryStore();
      if (!projectStore.project) return null;

      const boneId = 'bone_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const boneName = name ?? `Bone_${projectStore.project.rig.bones.length + 1}`;

      const bone: Bone = {
        id: boneId,
        name: boneName,
        parentId,
        position,
        rotation: 0,
        length: 0.15,
      };

      projectStore.project.rig.bones.push(bone);
      this.activeBoneId = boneId;
      projectStore.markDirty();

      historyStore.record({
        description: `ボーン「${boneName}」を追加`,
        undo: () => {
          if (!projectStore.project) return;
          const idx = projectStore.project.rig.bones.findIndex(b => b.id === boneId);
          if (idx !== -1) {
            projectStore.project.rig.bones.splice(idx, 1);
          }
          if (this.activeBoneId === boneId) {
            this.activeBoneId = null;
          }
        },
        redo: () => {
          if (!projectStore.project) return;
          projectStore.project.rig.bones.push({ ...bone });
          this.activeBoneId = boneId;
        },
      });

      return bone;
    },

    /**
     * ボーンを削除（子ボーンは親に再接続）
     */
    removeBone(boneId: string) {
      const projectStore = useProjectStore();
      const historyStore = useHistoryStore();
      if (!projectStore.project) return;

      const boneIndex = projectStore.project.rig.bones.findIndex(b => b.id === boneId);
      if (boneIndex === -1) return;

      const bone = { ...projectStore.project.rig.bones[boneIndex] };
      const parentId = bone.parentId;

      // 子ボーンを再接続するために変更前の状態を保存
      const childBones = projectStore.project.rig.bones.filter(b => b.parentId === boneId);
      const childOriginalParents = childBones.map(b => ({ id: b.id, parentId: b.parentId }));

      // バインドされたパーツの情報を保存
      const boundParts = projectStore.project.rig.parts.filter(p => p.boneId === boneId);
      const boundPartIds = boundParts.map(p => p.id);

      historyStore.beginBatch(`ボーン「${bone.name}」を削除`);

      // 子ボーンの親を再接続
      for (const child of childBones) {
        child.parentId = parentId;
      }

      // バインドされたパーツのバインドを解除
      for (const part of boundParts) {
        part.boneId = undefined;
      }

      // ボーンを削除
      projectStore.project.rig.bones.splice(boneIndex, 1);

      if (this.activeBoneId === boneId) {
        this.activeBoneId = null;
      }

      projectStore.markDirty();

      historyStore.record({
        description: `ボーン「${bone.name}」を削除`,
        undo: () => {
          if (!projectStore.project) return;
          // ボーンを復元
          projectStore.project.rig.bones.splice(boneIndex, 0, { ...bone });
          // 子ボーンの親を復元
          for (const orig of childOriginalParents) {
            const child = projectStore.project.rig.bones.find(b => b.id === orig.id);
            if (child) child.parentId = orig.parentId;
          }
          // パーツのバインドを復元
          for (const partId of boundPartIds) {
            const part = projectStore.project.rig.parts.find(p => p.id === partId);
            if (part) part.boneId = boneId;
          }
          this.activeBoneId = boneId;
        },
        redo: () => {
          if (!projectStore.project) return;
          const idx = projectStore.project.rig.bones.findIndex(b => b.id === boneId);
          if (idx === -1) return;
          // 子ボーンの親を再接続
          for (const child of projectStore.project.rig.bones.filter(b => b.parentId === boneId)) {
            child.parentId = parentId;
          }
          // パーツバインド解除
          for (const partId of boundPartIds) {
            const part = projectStore.project.rig.parts.find(p => p.id === partId);
            if (part) part.boneId = undefined;
          }
          projectStore.project.rig.bones.splice(idx, 1);
          if (this.activeBoneId === boneId) this.activeBoneId = null;
        },
      });

      historyStore.endBatch();
    },

    /**
     * ボーンのプロパティを更新
     */
    updateBone(boneId: string, updates: Partial<Pick<Bone, 'name' | 'position' | 'rotation' | 'length'>>) {
      const projectStore = useProjectStore();
      const historyStore = useHistoryStore();
      if (!projectStore.project) return;

      const bone = projectStore.project.rig.bones.find(b => b.id === boneId);
      if (!bone) return;

      // 変更前の値を保存
      const previous: Record<string, any> = {};
      for (const key of Object.keys(updates) as (keyof typeof updates)[]) {
        if (key === 'position') {
          previous[key] = [...bone.position];
        } else {
          previous[key] = bone[key];
        }
      }

      // 変更を適用
      if (updates.name !== undefined) bone.name = updates.name;
      if (updates.position !== undefined) {
        bone.position[0] = updates.position[0];
        bone.position[1] = updates.position[1];
      }
      if (updates.rotation !== undefined) bone.rotation = updates.rotation;
      if (updates.length !== undefined) bone.length = updates.length;

      projectStore.markDirty();

      historyStore.record({
        description: `ボーン「${bone.name}」を更新`,
        undo: () => {
          const b = projectStore.project?.rig.bones.find(b => b.id === boneId);
          if (!b) return;
          for (const key of Object.keys(previous)) {
            if (key === 'position') {
              b.position[0] = previous[key][0];
              b.position[1] = previous[key][1];
            } else {
              (b as any)[key] = previous[key];
            }
          }
        },
        redo: () => {
          const b = projectStore.project?.rig.bones.find(b => b.id === boneId);
          if (!b) return;
          if (updates.name !== undefined) b.name = updates.name;
          if (updates.position !== undefined) {
            b.position[0] = updates.position[0];
            b.position[1] = updates.position[1];
          }
          if (updates.rotation !== undefined) b.rotation = updates.rotation;
          if (updates.length !== undefined) b.length = updates.length;
        },
      });
    },

    /**
     * パーツをボーンにバインド
     */
    bindPartToBone(partId: string, boneId: string) {
      const projectStore = useProjectStore();
      const historyStore = useHistoryStore();
      if (!projectStore.project) return;

      const part = projectStore.project.rig.parts.find(p => p.id === partId);
      if (!part) return;

      const previousBoneId = part.boneId ?? null;
      part.boneId = boneId;
      projectStore.markDirty();

      historyStore.record({
        description: `パーツ「${part.name}」をボーンにバインド`,
        undo: () => {
          const p = projectStore.project?.rig.parts.find(p => p.id === partId);
          if (p) p.boneId = previousBoneId ?? undefined;
        },
        redo: () => {
          const p = projectStore.project?.rig.parts.find(p => p.id === partId);
          if (p) p.boneId = boneId;
        },
      });
    },

    /**
     * パーツのボーンバインドを解除
     */
    unbindPart(partId: string) {
      const projectStore = useProjectStore();
      const historyStore = useHistoryStore();
      if (!projectStore.project) return;

      const part = projectStore.project.rig.parts.find(p => p.id === partId);
      if (!part || !part.boneId) return;

      const previousBoneId = part.boneId;
      part.boneId = undefined;
      projectStore.markDirty();

      historyStore.record({
        description: `パーツ「${part.name}」のボーンバインドを解除`,
        undo: () => {
          const p = projectStore.project?.rig.parts.find(p => p.id === partId);
          if (p) p.boneId = previousBoneId;
        },
        redo: () => {
          const p = projectStore.project?.rig.parts.find(p => p.id === partId);
          if (p) p.boneId = undefined;
        },
      });
    },

    setActiveBone(boneId: string | null) {
      this.activeBoneId = boneId;
    },
  },
});
