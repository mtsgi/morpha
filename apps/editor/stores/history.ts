import { defineStore } from 'pinia';

/**
 * 汎用 Undo/Redo ストア
 *
 * 任意のアクションに対して「元に戻す」と「やり直す」を提供する。
 * スナップショット方式ではなくコマンドパターン (do/undo 関数ペア) を採用し、
 * メモリ効率を保ちながら柔軟な操作を可能にする。
 */

export interface HistoryEntry {
  /** 操作の説明 (デバッグ・UI表示用) */
  description: string;
  /** Undo: この操作を巻き戻す関数 */
  undo: () => void;
  /** Redo: この操作を再実行する関数 */
  redo: () => void;
}

const MAX_HISTORY = 100;

export const useHistoryStore = defineStore('history', {
  state: () => ({
    /** Undo スタック */
    undoStack: [] as HistoryEntry[],
    /** Redo スタック */
    redoStack: [] as HistoryEntry[],
    /** バッチ記録中かどうか */
    _batching: false as boolean,
    /** バッチ記録中のエントリ */
    _batchEntries: [] as HistoryEntry[],
    /** バッチの説明 */
    _batchDescription: '' as string,
  }),

  getters: {
    canUndo: (state) => state.undoStack.length > 0,
    canRedo: (state) => state.redoStack.length > 0,
    undoDescription: (state) =>
      state.undoStack.length > 0
        ? state.undoStack[state.undoStack.length - 1].description
        : null,
    redoDescription: (state) =>
      state.redoStack.length > 0
        ? state.redoStack[state.redoStack.length - 1].description
        : null,
  },

  actions: {
    /**
     * 操作を記録する。
     * バッチ中の場合はバッチ内に蓄積される。
     */
    record(entry: HistoryEntry) {
      if (this._batching) {
        this._batchEntries.push(entry);
        return;
      }

      this.undoStack.push(entry);
      // 新しい操作が記録されたら redo 履歴はクリア
      this.redoStack = [];

      // 履歴上限を超えたら古い方から削除
      if (this.undoStack.length > MAX_HISTORY) {
        this.undoStack.shift();
      }
    },

    /**
     * 直前の操作を元に戻す
     */
    undo() {
      const entry = this.undoStack.pop();
      if (!entry) return;

      entry.undo();
      this.redoStack.push(entry);
    },

    /**
     * やり直す
     */
    redo() {
      const entry = this.redoStack.pop();
      if (!entry) return;

      entry.redo();
      this.undoStack.push(entry);
    },

    /**
     * 複数の操作をひとつのアンドゥ単位にまとめるバッチを開始する
     */
    beginBatch(description: string) {
      this._batching = true;
      this._batchEntries = [];
      this._batchDescription = description;
    },

    /**
     * バッチを終了し、まとめて1エントリとして記録する
     */
    endBatch() {
      if (!this._batching) return;
      this._batching = false;

      const entries = [...this._batchEntries];
      this._batchEntries = [];

      if (entries.length === 0) return;

      const batchEntry: HistoryEntry = {
        description: this._batchDescription,
        undo: () => {
          // 逆順に undo
          for (let i = entries.length - 1; i >= 0; i--) {
            entries[i].undo();
          }
        },
        redo: () => {
          // 正順に redo
          for (const e of entries) {
            e.redo();
          }
        },
      };

      this.record(batchEntry);
    },

    /**
     * 履歴を全てクリアする
     */
    clear() {
      this.undoStack = [];
      this.redoStack = [];
      this._batching = false;
      this._batchEntries = [];
    },
  },
});
