import { defineStore } from 'pinia';
import type { Keyframe, MorphaMotion, Track } from '@morpha/core';
import { useProjectStore } from './project';
import { useHistoryStore } from './history';
import { evaluateAllTracks } from '../utils/interpolation';

export const useTimelineStore = defineStore('timeline', {
  state: () => ({
    /** 選択中のモーションインデックス */
    activeMotionIndex: 0,
    /** 再生ヘッド位置 (秒) */
    currentTime: 0,
    /** 再生中かどうか */
    isPlaying: false,
    /** タイムラインのズームレベル (px/sec) */
    zoom: 120,
    /** 選択中のトラックインデックス */
    activeTrackIndex: null as number | null,
    /** 選択中のキーフレームインデックス */
    activeKeyframeIndex: null as number | null,
    /** requestAnimationFrame ID */
    _animFrameId: null as number | null,
    /** 前回フレームのタイムスタンプ */
    _lastTimestamp: 0,
  }),

  getters: {
    activeMotion(): MorphaMotion | null {
      const projectStore = useProjectStore();
      if (!projectStore.project) return null;
      return projectStore.project.animations[this.activeMotionIndex] ?? null;
    },

    tracks(): Track[] {
      return this.activeMotion?.tracks ?? [];
    },

    duration(): number {
      return this.activeMotion?.duration ?? 5.0;
    },

    fps(): number {
      return this.activeMotion?.fps ?? 60;
    },

    /** 現在時刻のフレーム番号 */
    currentFrame(): number {
      return Math.floor(this.currentTime * this.fps);
    },

    /** 現在時刻の全トラック評価値 */
    evaluatedValues(): Record<string, number> {
      if (!this.activeMotion) return {};
      return evaluateAllTracks(this.activeMotion.tracks, this.currentTime);
    },
  },

  actions: {
    /**
     * キーフレームを追加
     */
    addKeyframe(trackIndex: number, time: number, value: number, curve?: Keyframe['curve']) {
      const projectStore = useProjectStore();
      const historyStore = useHistoryStore();
      if (!projectStore.project || !this.activeMotion) return;

      const track = this.activeMotion.tracks[trackIndex];
      if (!track) return;

      const keyframe: Keyframe = { time, value, curve: curve ?? 'linear' };

      // 同じ時刻に既存キーフレームがあれば上書き
      const existingIndex = track.keyframes.findIndex(
        k => Math.abs(k.time - time) < 0.001
      );

      if (existingIndex !== -1) {
        const oldKf = { ...track.keyframes[existingIndex] };
        track.keyframes[existingIndex] = keyframe;
        projectStore.markDirty();

        historyStore.record({
          description: `キーフレームを更新 (${track.parameterId} @ ${time.toFixed(2)}s)`,
          undo: () => {
            const t = this.activeMotion?.tracks[trackIndex];
            if (t) t.keyframes[existingIndex] = oldKf;
          },
          redo: () => {
            const t = this.activeMotion?.tracks[trackIndex];
            if (t) t.keyframes[existingIndex] = { ...keyframe };
          },
        });
      } else {
        // 時刻順にソートして挿入
        let insertIndex = track.keyframes.findIndex(k => k.time > time);
        if (insertIndex === -1) insertIndex = track.keyframes.length;

        track.keyframes.splice(insertIndex, 0, keyframe);
        projectStore.markDirty();

        historyStore.record({
          description: `キーフレームを追加 (${track.parameterId} @ ${time.toFixed(2)}s)`,
          undo: () => {
            const t = this.activeMotion?.tracks[trackIndex];
            if (t) {
              const idx = t.keyframes.findIndex(k => Math.abs(k.time - time) < 0.001);
              if (idx !== -1) t.keyframes.splice(idx, 1);
            }
          },
          redo: () => {
            const t = this.activeMotion?.tracks[trackIndex];
            if (t) {
              let idx = t.keyframes.findIndex(k => k.time > time);
              if (idx === -1) idx = t.keyframes.length;
              t.keyframes.splice(idx, 0, { ...keyframe });
            }
          },
        });
      }
    },

    /**
     * キーフレームを削除
     */
    removeKeyframe(trackIndex: number, keyframeIndex: number) {
      const projectStore = useProjectStore();
      const historyStore = useHistoryStore();
      if (!this.activeMotion) return;

      const track = this.activeMotion.tracks[trackIndex];
      if (!track || !track.keyframes[keyframeIndex]) return;

      const removed = { ...track.keyframes[keyframeIndex] };
      track.keyframes.splice(keyframeIndex, 1);
      projectStore.markDirty();

      historyStore.record({
        description: `キーフレームを削除 (${track.parameterId})`,
        undo: () => {
          const t = this.activeMotion?.tracks[trackIndex];
          if (t) t.keyframes.splice(keyframeIndex, 0, { ...removed });
        },
        redo: () => {
          const t = this.activeMotion?.tracks[trackIndex];
          if (t && t.keyframes[keyframeIndex]) t.keyframes.splice(keyframeIndex, 1);
        },
      });
    },

    /**
     * キーフレームの時間を移動
     */
    moveKeyframe(trackIndex: number, keyframeIndex: number, newTime: number) {
      const projectStore = useProjectStore();
      const historyStore = useHistoryStore();
      if (!this.activeMotion) return;

      const track = this.activeMotion.tracks[trackIndex];
      if (!track || !track.keyframes[keyframeIndex]) return;

      const oldTime = track.keyframes[keyframeIndex].time;
      track.keyframes[keyframeIndex].time = Math.max(0, Math.min(this.duration, newTime));

      // 時刻順に再ソート
      track.keyframes.sort((a, b) => a.time - b.time);
      projectStore.markDirty();

      historyStore.record({
        description: `キーフレームを移動 (${track.parameterId})`,
        undo: () => {
          const t = this.activeMotion?.tracks[trackIndex];
          if (t) {
            const kf = t.keyframes.find(k => Math.abs(k.time - newTime) < 0.001);
            if (kf) {
              kf.time = oldTime;
              t.keyframes.sort((a, b) => a.time - b.time);
            }
          }
        },
        redo: () => {
          const t = this.activeMotion?.tracks[trackIndex];
          if (t) {
            const kf = t.keyframes.find(k => Math.abs(k.time - oldTime) < 0.001);
            if (kf) {
              kf.time = newTime;
              t.keyframes.sort((a, b) => a.time - b.time);
            }
          }
        },
      });
    },

    /**
     * トラックを追加
     */
    addTrack(parameterId: string) {
      const projectStore = useProjectStore();
      const historyStore = useHistoryStore();
      if (!this.activeMotion) return;

      // 既存チェック
      if (this.activeMotion.tracks.find(t => t.parameterId === parameterId)) return;

      const track: Track = { parameterId, keyframes: [] };
      this.activeMotion.tracks.push(track);
      projectStore.markDirty();

      historyStore.record({
        description: `トラック「${parameterId}」を追加`,
        undo: () => {
          const motion = this.activeMotion;
          if (motion) {
            const idx = motion.tracks.findIndex(t => t.parameterId === parameterId);
            if (idx !== -1) motion.tracks.splice(idx, 1);
          }
        },
        redo: () => {
          const motion = this.activeMotion;
          if (motion && !motion.tracks.find(t => t.parameterId === parameterId)) {
            motion.tracks.push({ parameterId, keyframes: [] });
          }
        },
      });
    },

    /**
     * トラックを削除
     */
    removeTrack(trackIndex: number) {
      const projectStore = useProjectStore();
      const historyStore = useHistoryStore();
      if (!this.activeMotion) return;

      const removed = { ...this.activeMotion.tracks[trackIndex] };
      removed.keyframes = [...this.activeMotion.tracks[trackIndex].keyframes.map(k => ({ ...k }))];
      this.activeMotion.tracks.splice(trackIndex, 1);
      projectStore.markDirty();

      historyStore.record({
        description: `トラック「${removed.parameterId}」を削除`,
        undo: () => {
          const motion = this.activeMotion;
          if (motion) motion.tracks.splice(trackIndex, 0, { ...removed, keyframes: removed.keyframes.map(k => ({ ...k })) });
        },
        redo: () => {
          const motion = this.activeMotion;
          if (motion && motion.tracks[trackIndex]) motion.tracks.splice(trackIndex, 1);
        },
      });
    },

    /**
     * シーク
     */
    seekTo(time: number) {
      this.currentTime = Math.max(0, Math.min(this.duration, time));
      this._applyCurrentValues();
    },

    /**
     * 再生開始
     */
    play() {
      if (this.isPlaying) return;
      this.isPlaying = true;
      this._lastTimestamp = performance.now();
      this._tick();
    },

    /**
     * 一時停止
     */
    pause() {
      this.isPlaying = false;
      if (this._animFrameId !== null) {
        cancelAnimationFrame(this._animFrameId);
        this._animFrameId = null;
      }
    },

    /**
     * 停止（先頭に戻る）
     */
    stop() {
      this.pause();
      this.currentTime = 0;
      this._applyCurrentValues();
    },

    /**
     * アニメーションフレームの更新
     */
    _tick() {
      if (!this.isPlaying) return;

      const now = performance.now();
      const delta = (now - this._lastTimestamp) / 1000;
      this._lastTimestamp = now;

      this.currentTime += delta;

      // ループ再生
      if (this.currentTime >= this.duration) {
        this.currentTime = this.currentTime % this.duration;
      }

      this._applyCurrentValues();

      this._animFrameId = requestAnimationFrame(() => this._tick());
    },

    /**
     * 現在時刻の値をプロジェクトのパラメータに反映
     */
    _applyCurrentValues() {
      if (!this.activeMotion) return;
      const projectStore = useProjectStore();
      const values = this.evaluatedValues;

      for (const [key, value] of Object.entries(values)) {
        projectStore.currentParameters[key] = value;
      }
    },

    /**
     * 現在のパラメータ値を現在時刻のキーフレームとして挿入
     */
    insertKeyframeFromCurrentParams(parameterId: string) {
      const projectStore = useProjectStore();
      if (!this.activeMotion) return;

      const trackIndex = this.activeMotion.tracks.findIndex(
        t => t.parameterId === parameterId
      );

      if (trackIndex === -1) {
        // トラックが無ければ追加
        this.addTrack(parameterId);
        const newIndex = this.activeMotion.tracks.length - 1;
        const value = projectStore.currentParameters[parameterId] ?? 0;
        this.addKeyframe(newIndex, this.currentTime, value);
      } else {
        const value = projectStore.currentParameters[parameterId] ?? 0;
        this.addKeyframe(trackIndex, this.currentTime, value);
      }
    },

    /**
     * 新しいモーションを追加
     */
    addMotion(name: string = 'New Motion', duration: number = 5.0, fps: number = 60) {
      const projectStore = useProjectStore();
      const historyStore = useHistoryStore();
      if (!projectStore.project) return;

      const motion: MorphaMotion = { name, duration, fps, tracks: [] };
      projectStore.project.animations.push(motion);
      this.activeMotionIndex = projectStore.project.animations.length - 1;
      projectStore.markDirty();

      historyStore.record({
        description: `モーション「${name}」を追加`,
        undo: () => {
          if (!projectStore.project) return;
          const idx = projectStore.project.animations.findIndex(m => m.name === name);
          if (idx !== -1) projectStore.project.animations.splice(idx, 1);
          this.activeMotionIndex = Math.max(0, this.activeMotionIndex - 1);
        },
        redo: () => {
          if (!projectStore.project) return;
          projectStore.project.animations.push({ ...motion, tracks: [] });
          this.activeMotionIndex = projectStore.project.animations.length - 1;
        },
      });
    },

    /**
     * モーションを削除
     */
    removeMotion(index: number) {
      const projectStore = useProjectStore();
      const historyStore = useHistoryStore();
      if (!projectStore.project) return;

      const removed = projectStore.project.animations[index];
      if (!removed) return;

      const removedCopy = JSON.parse(JSON.stringify(removed)) as MorphaMotion;
      projectStore.project.animations.splice(index, 1);
      this.activeMotionIndex = Math.max(0, index - 1);
      projectStore.markDirty();

      historyStore.record({
        description: `モーション「${removedCopy.name}」を削除`,
        undo: () => {
          if (!projectStore.project) return;
          projectStore.project.animations.splice(index, 0, removedCopy);
          this.activeMotionIndex = index;
        },
        redo: () => {
          if (!projectStore.project) return;
          projectStore.project.animations.splice(index, 1);
          this.activeMotionIndex = Math.max(0, index - 1);
        },
      });
    },

    /**
     * モーションをリネーム
     */
    renameMotion(index: number, newName: string) {
      const projectStore = useProjectStore();
      const historyStore = useHistoryStore();
      if (!projectStore.project) return;

      const motion = projectStore.project.animations[index];
      if (!motion) return;

      const oldName = motion.name;
      motion.name = newName;
      projectStore.markDirty();

      historyStore.record({
        description: `モーション「${oldName}」を「${newName}」にリネーム`,
        undo: () => {
          const m = projectStore.project?.animations[index];
          if (m) m.name = oldName;
        },
        redo: () => {
          const m = projectStore.project?.animations[index];
          if (m) m.name = newName;
        },
      });
    },

    /**
     * モーションを複製
     */
    duplicateMotion(index: number) {
      const projectStore = useProjectStore();
      const historyStore = useHistoryStore();
      if (!projectStore.project) return;

      const src = projectStore.project.animations[index];
      if (!src) return;

      const clone: MorphaMotion = JSON.parse(JSON.stringify(src));
      clone.name = src.name + ' コピー';
      projectStore.project.animations.splice(index + 1, 0, clone);
      this.activeMotionIndex = index + 1;
      projectStore.markDirty();

      historyStore.record({
        description: `モーション「${src.name}」を複製`,
        undo: () => {
          if (!projectStore.project) return;
          projectStore.project.animations.splice(index + 1, 1);
          this.activeMotionIndex = index;
        },
        redo: () => {
          if (!projectStore.project) return;
          projectStore.project.animations.splice(index + 1, 0, JSON.parse(JSON.stringify(clone)));
          this.activeMotionIndex = index + 1;
        },
      });
    },
  },
});
