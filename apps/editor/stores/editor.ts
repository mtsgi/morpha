import { defineStore } from 'pinia';

export type EditorMode = 'edit' | 'animate' | 'preview';
export type ActiveTool = 'select' | 'move' | 'rotate' | 'scale' | 'mesh' | 'weight' | 'pan';

export const useEditorStore = defineStore('editor', {
  state: () => ({
    /** 現在のエディタモード */
    currentMode: 'edit' as EditorMode,
    /** 選択中のツール */
    activeTool: 'select' as ActiveTool,
    /** ボーンの表示/非表示 */
    showBones: true,
    /** グリッドの表示/非表示 */
    showGrid: false,
    /** 原点の表示/非表示 */
    showOrigin: true,
    /** 現在ドラッグ中のパーツID */
    draggedPartId: null as string | null,
  }),

  actions: {
    setMode(mode: EditorMode) {
      this.currentMode = mode;
    },
    setTool(tool: ActiveTool) {
      this.activeTool = tool;
    },
    toggleBones() {
      this.showBones = !this.showBones;
    },
    toggleGrid() {
      this.showGrid = !this.showGrid;
    },
  },
});
