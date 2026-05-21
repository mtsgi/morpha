<template>
  <div class="timeline-panel">
    <div class="panel-header">
      <div class="tabs">
        <div class="tab active">タイムライン</div>
        <div class="tab">グラフエディタ</div>
      </div>
    </div>
    
    <div class="timeline-content">
      <!-- Tracks List (Left side) -->
      <div class="tracks-list">
        <div class="track-header">
          <div class="controls">
            <button @click="timelineStore.stop()" title="停止">
              <SquareIcon class="icon" :size="14" />
            </button>
            <button @click="togglePlayback" :title="timelineStore.isPlaying ? '一時停止' : '再生'">
              <PauseIcon v-if="timelineStore.isPlaying" class="icon playing" :size="14" />
              <PlayIcon v-else class="icon" :size="14" />
            </button>
            <button @click="timelineStore.seekTo(timelineStore.duration)" title="末尾へ">
              <SkipForwardIcon class="icon" :size="14" />
            </button>
          </div>
          <div class="time-display">
            <span class="time">{{ formatTime(timelineStore.currentTime) }}</span>
            <span class="frames">{{ String(timelineStore.currentFrame).padStart(5, '0') }} ({{ timelineStore.fps }} fps)</span>
          </div>
        </div>

        <!-- Motion selector -->
        <div class="track-group" v-if="projectStore.project">
          <div class="track folder">
            <ChevronDownIcon class="icon expand" :size="14" />
            <span>モーション</span>
          </div>
          <div
            v-for="(motion, idx) in projectStore.project.animations"
            :key="idx"
            class="track"
            :class="{ active: timelineStore.activeMotionIndex === idx }"
            @click="timelineStore.activeMotionIndex = idx"
          >
            <ChevronDownIcon v-if="timelineStore.activeMotionIndex === idx" class="icon expand" :size="14" />
            <ChevronRightIcon v-else class="icon expand" :size="14" />
            <span>{{ motion.name }}</span>
            <div class="track-tools">
              <span>{{ motion.duration.toFixed(1) }}s</span>
            </div>
          </div>
        </div>

        <!-- Parameter tracks -->
        <div class="track-group" v-if="timelineStore.activeMotion">
          <div class="track folder">
            <ChevronDownIcon class="icon expand" :size="14" />
            <span>パラメータ</span>
            <div class="track-tools">
              <button class="add-track-btn" @click="showAddTrack = !showAddTrack" title="トラック追加">
                <PlusIcon :size="12" />
              </button>
            </div>
          </div>

          <!-- Add track dropdown -->
          <div v-if="showAddTrack" class="add-track-dropdown">
            <select @change="handleAddTrack" :value="''">
              <option value="" disabled>パラメータを選択...</option>
              <option
                v-for="param in availableParams"
                :key="param"
                :value="param"
              >{{ param }}</option>
            </select>
          </div>

          <div
            v-for="(track, trackIdx) in timelineStore.tracks"
            :key="track.parameterId"
            class="track"
            :class="{ active: timelineStore.activeTrackIndex === trackIdx }"
            @click="timelineStore.activeTrackIndex = trackIdx"
          >
            <MenuIcon class="icon expand" :size="12" />
            <span>{{ parameterDisplayName(track.parameterId) }}</span>
            <div class="track-tools">
              <span class="kf-count">{{ track.keyframes.length }}kf</span>
              <button class="remove-track-btn" @click.stop="timelineStore.removeTrack(trackIdx)" title="トラック削除">
                <XIcon :size="12" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline View (Right side) -->
      <div class="timeline-view" ref="timelineViewRef">
        <!-- Ruler -->
        <div class="ruler" @mousedown="handleRulerClick">
          <div
            v-for="tick in rulerTicks"
            :key="tick.time"
            class="tick"
            :class="{ active: Math.abs(tick.time - timelineStore.currentTime) < 0.5 }"
            :style="{ left: `${timeToPixel(tick.time)}px` }"
          >{{ tick.label }}</div>
        </div>
        
        <!-- Playhead -->
        <div class="playhead" :style="{ left: `${timeToPixel(timelineStore.currentTime)}px` }">
          <div class="head"></div>
          <div class="line"></div>
        </div>

        <div class="track-data-container">
          <!-- Motion clips -->
          <div class="track-data folder-pad"></div>
          <div
            v-for="(motion, idx) in (projectStore.project?.animations ?? [])"
            :key="'clip-' + idx"
            class="track-data"
          >
            <div
              class="clip"
              :class="{ purple: timelineStore.activeMotionIndex === idx, blue: timelineStore.activeMotionIndex !== idx }"
              :style="{ left: '0px', width: `${timeToPixel(motion.duration)}px` }"
            >{{ motion.name }}</div>
          </div>

          <!-- Parameter track spacer -->
          <div class="track-data folder-pad"></div>

          <!-- Add track spacer -->
          <div v-if="showAddTrack" class="track-data folder-pad"></div>

          <!-- Keyframe tracks -->
          <div
            v-for="(track, trackIdx) in timelineStore.tracks"
            :key="'kf-' + track.parameterId"
            class="track-data keyframe-track"
            :class="{ active: timelineStore.activeTrackIndex === trackIdx }"
            @dblclick="handleTrackDoubleClick(trackIdx, $event)"
          >
            <template v-for="(kf, kfIdx) in track.keyframes" :key="kfIdx">
              <div
                class="keyframe"
                :class="{ selected: timelineStore.activeTrackIndex === trackIdx && timelineStore.activeKeyframeIndex === kfIdx }"
                :style="{ left: `${timeToPixel(kf.time)}px` }"
                @mousedown.stop="startKeyframeDrag(trackIdx, kfIdx, $event)"
                @click.stop="selectKeyframe(trackIdx, kfIdx)"
              ></div>
              <!-- Connection line -->
              <div
                v-if="kfIdx < track.keyframes.length - 1"
                class="kf-line"
                :style="{
                  left: `${timeToPixel(kf.time)}px`,
                  width: `${timeToPixel(track.keyframes[kfIdx + 1].time) - timeToPixel(kf.time)}px`
                }"
              ></div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  SkipForward as SkipForwardIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  Square as SquareIcon,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
  Plus as PlusIcon,
  X as XIcon
} from 'lucide-vue-next';
import { useProjectStore } from '../../stores/project';
import { useTimelineStore } from '../../stores/timeline';

const projectStore = useProjectStore();
const timelineStore = useTimelineStore();
const timelineViewRef = ref<HTMLElement | null>(null);
const showAddTrack = ref(false);

// パラメータ表示名
const PARAM_NAMES: Record<string, string> = {
  'eye_open': '目 開閉',
  'eye_smile': '目 笑顔',
  'brow_y': '眉 上下',
  'brow_angle': '眉の角度',
  'mouth_open': '口 開閉',
  'mouth_form': '口 変形',
  'head_x': '頭の向き X',
  'head_y': '頭の向き Y',
  'head_z': '頭の傾き Z',
  'body_x': '体の回転 X',
  'breath': '呼吸',
};

function parameterDisplayName(id: string): string {
  return PARAM_NAMES[id] ?? id;
}

// 利用可能パラメータ（まだトラックに存在しないもの）
const availableParams = computed(() => {
  const existingIds = new Set(timelineStore.tracks.map(t => t.parameterId));
  return Object.keys(projectStore.currentParameters).filter(k => !existingIds.has(k));
});

// 時刻→ピクセル変換
function timeToPixel(time: number): number {
  return time * timelineStore.zoom;
}

// ピクセル→時刻変換
function pixelToTime(px: number): number {
  return Math.max(0, px / timelineStore.zoom);
}

// ルーラー目盛り生成
const rulerTicks = computed(() => {
  const duration = timelineStore.duration;
  const ticks: { time: number; label: string }[] = [];
  
  // ズームレベルに応じて間隔を調整
  let interval = 1;
  if (timelineStore.zoom < 60) interval = 2;
  if (timelineStore.zoom < 30) interval = 5;
  if (timelineStore.zoom > 200) interval = 0.5;

  for (let t = 0; t <= duration; t += interval) {
    const mm = Math.floor(t / 60).toString().padStart(2, '0');
    const ss = Math.floor(t % 60).toString().padStart(2, '0');
    ticks.push({ time: t, label: `${mm}:${ss}` });
  }
  return ticks;
});

// 時刻フォーマット
function formatTime(time: number): string {
  const mm = Math.floor(time / 60).toString().padStart(2, '0');
  const ss = Math.floor(time % 60).toString().padStart(2, '0');
  const ms = Math.floor((time % 1) * 100).toString().padStart(2, '0');
  return `${mm}:${ss}:${ms}`;
}

// 再生トグル
function togglePlayback() {
  if (timelineStore.isPlaying) {
    timelineStore.pause();
  } else {
    timelineStore.play();
  }
}

// ルーラークリックでシーク
function handleRulerClick(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const time = pixelToTime(e.clientX - rect.left);
  timelineStore.seekTo(time);
}

// トラック追加
function handleAddTrack(e: Event) {
  const target = e.target as HTMLSelectElement;
  if (target.value) {
    timelineStore.addTrack(target.value);
    target.value = '';
    showAddTrack.value = false;
  }
}

// トラックダブルクリックでキーフレーム追加
function handleTrackDoubleClick(trackIdx: number, e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const time = pixelToTime(e.clientX - rect.left);
  const track = timelineStore.tracks[trackIdx];
  if (track) {
    const value = projectStore.currentParameters[track.parameterId] ?? 0;
    timelineStore.addKeyframe(trackIdx, time, value);
  }
}

// キーフレーム選択
function selectKeyframe(trackIdx: number, kfIdx: number) {
  timelineStore.activeTrackIndex = trackIdx;
  timelineStore.activeKeyframeIndex = kfIdx;
}

// キーフレームドラッグ
let dragTrackIdx = -1;
let dragKfIdx = -1;
let dragStartX = 0;
let dragOriginalTime = 0;

function startKeyframeDrag(trackIdx: number, kfIdx: number, e: MouseEvent) {
  selectKeyframe(trackIdx, kfIdx);
  dragTrackIdx = trackIdx;
  dragKfIdx = kfIdx;
  dragStartX = e.clientX;
  const track = timelineStore.tracks[trackIdx];
  if (track) {
    dragOriginalTime = track.keyframes[kfIdx].time;
  }
  document.addEventListener('mousemove', onKeyframeDrag);
  document.addEventListener('mouseup', onKeyframeDragEnd);
}

function onKeyframeDrag(e: MouseEvent) {
  const dx = e.clientX - dragStartX;
  const newTime = Math.max(0, dragOriginalTime + dx / timelineStore.zoom);
  const track = timelineStore.tracks[dragTrackIdx];
  if (track && track.keyframes[dragKfIdx]) {
    track.keyframes[dragKfIdx].time = newTime;
  }
}

function onKeyframeDragEnd(_e: MouseEvent) {
  document.removeEventListener('mousemove', onKeyframeDrag);
  document.removeEventListener('mouseup', onKeyframeDragEnd);

  const track = timelineStore.tracks[dragTrackIdx];
  if (track && track.keyframes[dragKfIdx]) {
    const finalTime = track.keyframes[dragKfIdx].time;
    // ソートし直し (history record は moveKeyframe で)
    if (Math.abs(finalTime - dragOriginalTime) > 0.001) {
      // 直接ソートだけ実施（Undoは手動トラッキングになるため簡易対応）
      track.keyframes.sort((a, b) => a.time - b.time);
      useProjectStore().markDirty();
    }
  }
}
</script>

<style scoped lang="scss">
.timeline-panel {
  height: 260px;
  background-color: var(--bg-panel);
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;

  .panel-header {
    height: 32px;
    background-color: var(--bg-panel-light);
    border-bottom: 1px solid var(--border-color);

    .tabs {
      display: flex;
      height: 100%;
      
      .tab {
        padding: 0 16px;
        display: flex;
        align-items: center;
        color: var(--text-secondary);
        font-size: 11px;
        cursor: pointer;

        &.active {
          background-color: var(--bg-panel);
          color: var(--brand-purple);
          border-top: 2px solid var(--brand-purple);
        }
      }
    }
  }

  .timeline-content {
    flex: 1;
    display: flex;
    overflow: hidden;

    .tracks-list {
      width: 280px;
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      background-color: var(--bg-panel);
      overflow-y: auto;

      .track-header {
        height: 36px;
        display: flex;
        align-items: center;
        padding: 0 12px;
        border-bottom: 1px solid var(--border-color);
        justify-content: space-between;
        flex-shrink: 0;

        .controls {
          display: flex;
          gap: 4px;
          
          button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            color: var(--text-secondary);
            transition: all 0.15s;

            &:hover {
              background-color: var(--bg-hover);
              color: var(--text-primary);
            }

            .playing { color: var(--brand-cyan); }
          }
        }

        .time-display {
          display: flex;
          align-items: baseline;
          gap: 8px;

          .time {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            font-variant-numeric: tabular-nums;
          }
          .frames {
            font-size: 10px;
            color: var(--text-muted);
            font-variant-numeric: tabular-nums;
          }
        }
      }

      .track-group {
        display: flex;
        flex-direction: column;

        .add-track-dropdown {
          padding: 4px 8px;

          select {
            width: 100%;
            background-color: var(--bg-base);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 4px 6px;
            color: var(--text-secondary);
            font-size: 11px;
            outline: none;

            &:focus { border-color: var(--brand-cyan); }

            option {
              background-color: var(--bg-panel);
              color: var(--text-primary);
            }
          }
        }

        .track {
          height: 28px;
          display: flex;
          align-items: center;
          padding: 0 8px;
          color: var(--text-secondary);
          font-size: 11px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          cursor: pointer;

          &:hover { background-color: var(--bg-hover); }

          &.active {
            background-color: rgba(138, 79, 255, 0.1);
            border-left: 2px solid var(--brand-purple);
          }

          &.folder {
            font-weight: 600;
            background-color: rgba(0, 0, 0, 0.1);
          }

          .expand {
            margin-right: 4px;
            opacity: 0.6;
            cursor: pointer;
          }

          span { flex: 1; }

          .track-tools {
            display: flex;
            align-items: center;
            gap: 6px;
            opacity: 0.5;

            span { font-size: 9px; width: auto; text-align: right; }
            .kf-count { color: var(--brand-cyan); }

            .add-track-btn, .remove-track-btn {
              display: flex;
              align-items: center;
              padding: 2px;
              border-radius: 2px;
              color: var(--text-muted);
              
              &:hover { color: var(--text-primary); }
            }

            .remove-track-btn:hover { color: #ff6b6b; }
          }

          &:hover .track-tools { opacity: 1; }
        }
      }
    }

    .timeline-view {
      flex: 1;
      background-color: var(--bg-base);
      position: relative;
      overflow-x: auto;
      overflow-y: hidden;

      .ruler {
        height: 36px;
        border-bottom: 1px solid var(--border-color);
        background-color: var(--bg-panel);
        position: relative;
        cursor: pointer;
        flex-shrink: 0;

        .tick {
          position: absolute;
          bottom: 4px;
          font-size: 9px;
          color: var(--text-muted);
          transform: translateX(-50%);
          font-variant-numeric: tabular-nums;

          &::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 50%;
            width: 1px;
            height: 4px;
            background-color: var(--text-muted);
          }

          &.active {
            color: var(--text-primary);
          }
        }
      }

      .playhead {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 1px;
        z-index: 10;
        pointer-events: none;

        .head {
          position: absolute;
          top: 16px;
          left: -4px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background-color: var(--brand-purple);
        }
        
        .line {
          position: absolute;
          top: 24px;
          bottom: 0;
          left: 0;
          width: 1px;
          background-color: var(--brand-purple);
          opacity: 0.5;
        }
      }

      .track-data-container {
        position: relative;

        .track-data {
          height: 28px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          position: relative;
          display: flex;
          align-items: center;

          &.folder-pad {
            background-color: rgba(0, 0, 0, 0.1);
          }

          .clip {
            position: absolute;
            height: 18px;
            border-radius: 2px;
            font-size: 10px;
            display: flex;
            align-items: center;
            padding: 0 8px;
            color: white;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;

            &.purple { background-color: rgba(138, 79, 255, 0.5); border: 1px solid var(--brand-purple); }
            &.blue { background-color: rgba(0, 153, 255, 0.5); border: 1px solid #0099ff; }
          }

          &.keyframe-track {
            cursor: crosshair;

            &.active {
              background-color: rgba(138, 79, 255, 0.05);
            }

            .keyframe {
              position: absolute;
              width: 8px;
              height: 8px;
              background-color: var(--brand-cyan);
              transform: rotate(45deg) translate(-50%, -50%);
              transform-origin: 0 0;
              top: 50%;
              z-index: 2;
              cursor: ew-resize;
              transition: background-color 0.1s;

              &:hover {
                background-color: #ffffff;
                box-shadow: 0 0 6px var(--brand-cyan);
              }

              &.selected {
                background-color: #ffffff;
                box-shadow: 0 0 8px var(--brand-cyan);
              }
            }

            .kf-line {
              position: absolute;
              height: 1px;
              background-color: rgba(0, 210, 255, 0.2);
              top: 50%;
              z-index: 1;
            }
          }
        }
      }
    }
  }
}
</style>
