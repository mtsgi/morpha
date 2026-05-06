import { defineStore } from 'pinia';
import type { MorphaProject, Part } from '@morpha/core';

export const useProjectStore = defineStore('project', {
  state: () => ({
    project: null as MorphaProject | null,
    activePartId: null as string | null,
    currentParameters: {
      'eye_open': 0.75,
      'eye_smile': 0.40,
      'brow_y': 0.10,
      'brow_angle': -0.20,
      'mouth_open': 0.65,
      'mouth_form': 0.30,
      'head_x': -0.10,
      'head_y': 0.30,
      'head_z': 0.00,
      'body_x': 0.00,
      'breath': 0.35
    } as Record<string, number>
  }),
  getters: {
    // 階層構造（ツリー）を構築するためのゲッター
    partsTree: (state) => {
      if (!state.project) return [];
      const parts = state.project.rig.parts;
      
      const buildTree = (parentId: string | null): any[] => {
        return parts
          .filter(p => p.parentId === parentId)
          .map(p => ({
            ...p,
            children: buildTree(p.id)
          }));
      };
      
      return buildTree(null);
    }
  },
  actions: {
    initMockProject() {
      // UIのモックと同じ構造のダミーデータを生成
      const mockPartsRaw = [
        { id: 'root', name: 'Root', parentId: null, type: 'folder', visible: true, locked: false },
        
        { id: 'face', name: 'Face', parentId: 'root', type: 'folder', visible: true, locked: false },
        { id: 'face-base', name: 'Face Base', parentId: 'face', type: 'mesh', visible: true, locked: true },
        { id: 'eye-l', name: 'Left Eye', parentId: 'face', type: 'mesh', visible: true, locked: true },
        { id: 'eye-r', name: 'Right Eye', parentId: 'face', type: 'mesh', visible: true, locked: true },
        { id: 'brow-l', name: 'Eyebrow L', parentId: 'face', type: 'mesh', visible: true, locked: true },
        { id: 'brow-r', name: 'Eyebrow R', parentId: 'face', type: 'mesh', visible: true, locked: true },
        { id: 'mouth', name: 'Mouth', parentId: 'face', type: 'mesh', visible: true, locked: true },
        { id: 'nose', name: 'Nose', parentId: 'face', type: 'mesh', visible: true, locked: true },
        { id: 'cheek', name: 'Cheek', parentId: 'face', type: 'mesh', visible: true, locked: true },

        { id: 'hair', name: 'Hair', parentId: 'root', type: 'folder', visible: true, locked: false },
        { id: 'hair-front', name: 'Front', parentId: 'hair', type: 'mesh', visible: true, locked: true },
        { id: 'hair-side-l', name: 'Side L', parentId: 'hair', type: 'mesh', visible: true, locked: true },
        { id: 'hair-side-r', name: 'Side R', parentId: 'hair', type: 'mesh', visible: true, locked: true },
        { id: 'hair-back', name: 'Back', parentId: 'hair', type: 'mesh', visible: true, locked: true },

        { id: 'body', name: 'Body', parentId: 'root', type: 'folder', visible: true, locked: false },
        { id: 'neck', name: 'Neck', parentId: 'body', type: 'mesh', visible: true, locked: true },
        { id: 'cloth', name: 'Cloth', parentId: 'body', type: 'mesh', visible: true, locked: true },
        { id: 'ribbon', name: 'Ribbon', parentId: 'body', type: 'mesh', visible: true, locked: true },
        { id: 'arm-l', name: 'Arm L', parentId: 'body', type: 'mesh', visible: true, locked: true },
        { id: 'arm-r', name: 'Arm R', parentId: 'body', type: 'mesh', visible: true, locked: true },

        { id: 'others', name: 'Others', parentId: 'root', type: 'folder', visible: true, locked: false },
        { id: 'accessory', name: 'Accessory', parentId: 'others', type: 'mesh', visible: true, locked: true },
        { id: 'physics-root', name: 'Physics Root', parentId: 'others', type: 'folder', visible: true, locked: true },
      ];

      const mockParts: Part[] = mockPartsRaw.map(p => ({
        ...p,
        transform: { position: [0, 0], scale: [1, 1], rotation: 0 }
      })) as Part[];

      this.project = {
        version: "1.0.0",
        meta: { name: "Untitled Project", resolution: [1920, 1080] },
        assets: [],
        rig: {
          bones: [], // 今回は一旦省略
          parts: mockParts
        },
        animations: [
          // UIにあるようなアニメーションデータのモック
          {
            name: "Idle",
            duration: 5.0,
            fps: 60,
            tracks: [
              { parameterId: "eye_open", keyframes: [{time: 0, value: 0.75}, {time: 5, value: 0.75}] },
              { parameterId: "mouth_open", keyframes: [{time: 0, value: 0.65}, {time: 5, value: 0.65}] }
            ]
          }
        ]
      };
      
      this.activePartId = 'eye-l'; // 初期選択状態
    },
    
    setActivePart(partId: string) {
      this.activePartId = partId;
    },

    toggleVisibility(partId: string) {
      if (!this.project) return;
      const part = this.project.rig.parts.find(p => p.id === partId);
      if (part) part.visible = !part.visible;
    },

    toggleLock(partId: string) {
      if (!this.project) return;
      const part = this.project.rig.parts.find(p => p.id === partId);
      if (part) part.locked = !part.locked;
    },

    async importImage(file: File) {
      if (!this.project) return;

      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (!this.project) return;
          const dataUrl = e.target?.result as string;
          
          const assetId = 'asset_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          this.project.assets.push({
            id: assetId,
            type: 'image',
            data: dataUrl
          });

          const partId = 'part_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          this.project.rig.parts.push({
            id: partId,
            name: file.name,
            parentId: 'root', // 直下に配置
            type: 'mesh',
            visible: true,
            locked: false,
            assetId: assetId,
            transform: { position: [0, 0], scale: [1, 1], rotation: 0 }
          });
          
          this.activePartId = partId;
          resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    async importDepthMap(file: File, partId: string) {
      if (!this.project) return;
      const part = this.project.rig.parts.find(p => p.id === partId);
      if (!part) return;

      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (!this.project) return;
          const dataUrl = e.target?.result as string;
          
          const assetId = 'asset_depth_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          this.project.assets.push({
            id: assetId,
            type: 'depth_map',
            data: dataUrl
          });

          part.depthAssetId = assetId;
          resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }
});
