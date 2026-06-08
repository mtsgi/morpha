<template>
  <div class="timeline-panel">
    <div class="panel-header">
      <div class="tabs">
        <div class="tab" :class="{ active: activeTimelineTab === 'sheet' }" @click="activeTimelineTab = 'sheet'">タイムライン</div>
        <div class="tab" :class="{ active: activeTimelineTab === 'graph' }" @click="activeTimelineTab = 'graph'">グラフエディタ</div>
      </div>
    </div>
    
    <div class="timeline-content" v-if="activeTimelineTab === 'sheet'">
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
            <div class="track-tools">
              <button class="add-track-btn" title="モーションを追加" @click="handleAddMotion">
                <PlusIcon :size="12" />
              </button>
            </div>
          </div>
          <div
            v-for="(motion, idx) in projectStore.project.animations"
            :key="idx"
            class="track"
            :class="{ active: timelineStore.activeMotionIndex === idx }"
            @click="timelineStore.activeMotionIndex = idx"
            @contextmenu.prevent="openMotionMenu($event, idx)"
          >
            <ChevronDownIcon v-if="timelineStore.activeMotionIndex === idx" class="icon expand" :size="14" />
            <ChevronRightIcon v-else class="icon expand" :size="14" />
            <!-- リネーム中 -->
            <input
              v-if="renamingMotionIndex === idx"
              class="rename-input"
              :value="motion.name"
              @blur="commitRename($event, idx)"
              @keydown.enter="commitRename($event, idx)"
              @keydown.esc="renamingMotionIndex = null"
              @click.stop
              ref="renameInputRef"
              autofocus
            />
            <span v-else>{{ motion.name }}</span>
            <div class="track-tools">
              <span>{{ motion.duration.toFixed(1) }}s</span>
            </div>
          </div>
        </div>

        <!-- モーションコンテキストメニュー -->
        <Teleport to="body">
          <div
            v-if="motionMenuVisible"
            class="context-menu"
            :style="{ left: motionMenuX + 'px', top: motionMenuY + 'px' }"
            @click.stop
            v-click-outside="closeMotionMenu"
          >
            <button @click="startRename">リネーム</button>
            <button @click="handleDuplicateMotion">複製</button>
            <div class="menu-divider"></div>
            <button class="danger" @click="handleRemoveMotion">削除</button>
          </div>
        </Teleport>

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

    <!-- Graph Editor View -->
    <div v-else-if="activeTimelineTab === 'graph'" class="graph-editor-container">
      <!-- Tracks List (Left side) -->
      <div class="tracks-list">
        <div class="track-header">
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 600; padding: 0 12px;">トラック選択</span>
        </div>
        <div class="track-group" v-if="timelineStore.activeMotion">
          <div
            v-for="(track, trackIdx) in timelineStore.tracks"
            :key="track.parameterId"
            class="track"
            :class="{ active: timelineStore.activeTrackIndex === trackIdx }"
            @click="timelineStore.activeTrackIndex = trackIdx; selectKeyframe(trackIdx, null);"
          >
            <MenuIcon class="icon expand" :size="12" />
            <span>{{ parameterDisplayName(track.parameterId) }}</span>
          </div>
        </div>
      </div>

      <!-- SVG Graph Editor (Right side) -->
      <div class="graph-canvas-container" ref="graphContainerRef">
        <div v-if="!activeTrack" class="empty-graph-state">
          <span>編集するパラメータトラックを選択してください</span>
        </div>
        <template v-else>
          <!-- Graph Toolbar / Easing selection -->
          <div class="graph-toolbar">
            <span class="active-track-name">{{ parameterDisplayName(activeTrack.parameterId) }}</span>
            <div class="divider"></div>
            <template v-if="selectedKeyframe">
              <span class="toolbar-label">補間方法:</span>
              <select :value="getInterpolationType(selectedKeyframe)" @change="handleInterpolationTypeChange" class="graph-select">
                <option value="linear">直線 (Linear)</option>
                <option value="step">ステップ (Step)</option>
                <option value="bezier">曲線 (Bezier)</option>
              </select>
              <div class="divider"></div>
              <span class="toolbar-label">Time: {{ selectedKeyframe.time.toFixed(2) }}s</span>
              <span class="toolbar-label">Value: {{ selectedKeyframe.value.toFixed(2) }}</span>
            </template>
            <span v-else class="toolbar-label">キーフレームを選択すると補間や数値を編集できます</span>
          </div>

          <!-- SVG Graph -->
          <div class="svg-wrapper" @mousemove="onGraphMouseMove" @mouseup="onGraphMouseUp" @mouseleave="onGraphMouseUp">
            <svg
              width="100%"
              height="100%"
              ref="graphSvgRef"
              class="graph-svg"
              @mousedown="onGraphBackgroundMouseDown"
            >
              <!-- Grid lines (Vertical: Time) -->
              <line
                v-for="tick in rulerTicks"
                :key="'v-' + tick.time"
                :x1="timeToPixel(tick.time)"
                y1="0"
                :x2="timeToPixel(tick.time)"
                y2="100%"
                class="grid-line"
              />
              
              <!-- Grid lines (Horizontal: Value) -->
              <line
                v-for="gridY in valueGridLines"
                :key="'h-' + gridY.val"
                x1="0"
                :y1="gridY.y"
                x2="100%"
                :y2="gridY.y"
                class="grid-line"
              />
              <text
                v-for="gridY in valueGridLines"
                :key="'lbl-' + gridY.val"
                x="10"
                :y="gridY.y - 4"
                class="grid-label"
              >{{ gridY.val.toFixed(2) }}</text>

              <!-- Time cursor (Playhead) -->
              <line
                :x1="timeToPixel(timelineStore.currentTime)"
                y1="0"
                :x2="timeToPixel(timelineStore.currentTime)"
                y2="100%"
                class="playhead-line"
              />

              <!-- Curves -->
              <path
                v-if="pathData"
                :d="pathData"
                class="graph-path"
              />

              <!-- Tangent handles -->
              <template v-if="selectedKeyframe && activeTrack">
                <!-- Left Handle (previous segment control) -->
                <line
                  v-if="leftHandleCoords"
                  :x1="timeToPixel(selectedKeyframe.time)"
                  :y1="valueToY(selectedKeyframe.value)"
                  :x2="leftHandleCoords.x"
                  :y2="leftHandleCoords.y"
                  class="tangent-line"
                />
                <circle
                  v-if="leftHandleCoords"
                  :cx="leftHandleCoords.x"
                  :cy="leftHandleCoords.y"
                  r="4"
                  class="tangent-handle left"
                  @mousedown.stop="startHandleDrag('left', $event)"
                />

                <!-- Right Handle (next segment control) -->
                <line
                  v-if="rightHandleCoords"
                  :x1="timeToPixel(selectedKeyframe.time)"
                  :y1="valueToY(selectedKeyframe.value)"
                  :x2="rightHandleCoords.x"
                  :y2="rightHandleCoords.y"
                  class="tangent-line"
                />
                <circle
                  v-if="rightHandleCoords"
                  :cx="rightHandleCoords.x"
                  :cy="rightHandleCoords.y"
                  r="4"
                  class="tangent-handle right"
                  @mousedown.stop="startHandleDrag('right', $event)"
                />
              </template>

              <!-- Keyframe Points (Diamonds) -->
              <g
                v-for="(kf, kfIdx) in activeTrack.keyframes"
                :key="kfIdx"
                class="keyframe-group"
                :class="{ selected: timelineStore.activeKeyframeIndex === kfIdx }"
                @mousedown.stop="startGraphKeyframeDrag(kfIdx, $event)"
              >
                <rect
                  :x="timeToPixel(kf.time) - 4"
                  :y="valueToY(kf.value) - 4"
                  width="8"
                  height="8"
                  transform-origin="center"
                  class="keyframe-diamond"
                />
              </g>
            </svg>
          </div>
        </template>
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

// モーション関連の状態
const renamingMotionIndex = ref<number | null>(null);
const motionMenuVisible = ref(false);
const motionMenuX = ref(0);
const motionMenuY = ref(0);
const selectedMotionIndexForMenu = ref<number | null>(null);
const renameInputRef = ref<HTMLInputElement | null>(null);


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

// モーション追加
function handleAddMotion() {
  const name = `Motion_${(projectStore.project?.animations.length ?? 0) + 1}`;
  timelineStore.addMotion(name);
}

// モーションメニュー表示
function openMotionMenu(e: MouseEvent, index: number) {
  motionMenuX.value = e.clientX;
  motionMenuY.value = e.clientY;
  selectedMotionIndexForMenu.value = index;
  motionMenuVisible.value = true;
}

// モーションメニュー閉じる
function closeMotionMenu() {
  motionMenuVisible.value = false;
}

// リネーム開始
function startRename() {
  if (selectedMotionIndexForMenu.value !== null) {
    renamingMotionIndex.value = selectedMotionIndexForMenu.value;
    closeMotionMenu();
    setTimeout(() => {
      if (renameInputRef.value) {
        renameInputRef.value.focus();
        renameInputRef.value.select();
      }
    }, 50);
  }
}

// リネーム確定
function commitRename(e: Event, index: number) {
  const input = e.target as HTMLInputElement;
  const newName = input.value.trim();
  if (newName) {
    timelineStore.renameMotion(index, newName);
  }
  renamingMotionIndex.value = null;
}

// モーション複製
function handleDuplicateMotion() {
  if (selectedMotionIndexForMenu.value !== null) {
    timelineStore.duplicateMotion(selectedMotionIndexForMenu.value);
    closeMotionMenu();
  }
}

// モーション削除
function handleRemoveMotion() {
  if (selectedMotionIndexForMenu.value !== null) {
    const motionName = projectStore.project?.animations[selectedMotionIndexForMenu.value]?.name ?? 'モーション';
    if (confirm(`本当に「${motionName}」を削除しますか？`)) {
      timelineStore.removeMotion(selectedMotionIndexForMenu.value);
    }
    closeMotionMenu();
  }
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
function selectKeyframe(trackIdx: number, kfIdx: number | null) {
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

// --- Graph Editor Logic ---
import { watch, onUnmounted } from 'vue';

const activeTimelineTab = ref<'sheet' | 'graph'>('sheet');
const svgHeight = ref(300);
const graphContainerRef = ref<HTMLElement | null>(null);
const graphSvgRef = ref<SVGElement | null>(null);

const dragMode = ref<'none' | 'keyframe' | 'handle-left' | 'handle-right'>('none');
let dragKeyframeIndex: number | null = null;
let startMouseX = 0;
let startMouseY = 0;
let startKfTime = 0;
let startKfValue = 0;

let resizeObserver: ResizeObserver | null = null;

watch(graphSvgRef, (el) => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (el) {
    svgHeight.value = el.clientHeight || 300;
    resizeObserver = new ResizeObserver(() => {
      svgHeight.value = el.clientHeight || 300;
    });
    resizeObserver.observe(el);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

const activeTrack = computed(() => {
  if (timelineStore.activeTrackIndex === null) return null;
  return timelineStore.tracks[timelineStore.activeTrackIndex] || null;
});

const activeParameter = computed(() => {
  const track = activeTrack.value;
  if (!track || !projectStore.project) return null;
  return projectStore.project.parameters.find(p => p.id === track.parameterId) || null;
});

const selectedKeyframe = computed(() => {
  const track = activeTrack.value;
  if (!track || timelineStore.activeKeyframeIndex === null) return null;
  return track.keyframes[timelineStore.activeKeyframeIndex] || null;
});

function valueToY(val: number): number {
  if (!activeParameter.value) return 0;
  const min = activeParameter.value.min;
  const max = activeParameter.value.max;
  const padding = 30;
  const h = svgHeight.value;
  const available = h - padding * 2;
  const pct = (val - min) / (max - min);
  return h - padding - pct * available;
}

function yToValue(y: number): number {
  if (!activeParameter.value) return 0;
  const min = activeParameter.value.min;
  const max = activeParameter.value.max;
  const padding = 30;
  const h = svgHeight.value;
  const available = h - padding * 2;
  const pct = (h - padding - y) / available;
  const val = min + pct * (max - min);
  return Math.max(min, Math.min(max, val));
}

const valueGridLines = computed(() => {
  if (!activeParameter.value) return [];
  const min = activeParameter.value.min;
  const max = activeParameter.value.max;
  const step = (max - min) / 4;
  const lines = [];
  for (let i = 0; i <= 4; i++) {
    const val = min + step * i;
    lines.push({ val, y: valueToY(val) });
  }
  return lines;
});

const pathData = computed(() => {
  if (!activeTrack.value || activeTrack.value.keyframes.length === 0) return '';
  const kfs = activeTrack.value.keyframes;
  let d = `M ${timeToPixel(kfs[0].time)} ${valueToY(kfs[0].value)}`;
  
  for (let i = 0; i < kfs.length - 1; i++) {
    const k0 = kfs[i];
    const k1 = kfs[i + 1];
    const curve = k0.curve ?? 'linear';
    
    const xEnd = timeToPixel(k1.time);
    const yEnd = valueToY(k1.value);
    
    if (curve === 'step') {
      d += ` L ${xEnd} ${valueToY(k0.value)} L ${xEnd} ${yEnd}`;
    } else if (curve === 'linear') {
      d += ` L ${xEnd} ${yEnd}`;
    } else if (Array.isArray(curve)) {
      const [p1x, p1y, p2x, p2y] = curve;
      const dt = k1.time - k0.time;
      const dv = k1.value - k0.value;
      const c1x = timeToPixel(k0.time + p1x * dt);
      const c1y = valueToY(k0.value + p1y * dv);
      const c2x = timeToPixel(k0.time + p2x * dt);
      const c2y = valueToY(k0.value + p2y * dv);
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${xEnd} ${yEnd}`;
    }
  }
  return d;
});

const rightHandleCoords = computed(() => {
  if (!activeTrack.value || timelineStore.activeKeyframeIndex === null) return null;
  const idx = timelineStore.activeKeyframeIndex;
  const kfs = activeTrack.value.keyframes;
  if (idx >= kfs.length - 1) return null;
  const kf = kfs[idx];
  const nextKf = kfs[idx + 1];
  if (!Array.isArray(kf.curve)) return null;
  
  const [p1x, p1y] = kf.curve;
  const dt = nextKf.time - kf.time;
  const dv = nextKf.value - kf.value;
  return {
    x: timeToPixel(kf.time + p1x * dt),
    y: valueToY(kf.value + p1y * dv)
  };
});

const leftHandleCoords = computed(() => {
  if (!activeTrack.value || timelineStore.activeKeyframeIndex === null) return null;
  const idx = timelineStore.activeKeyframeIndex;
  const kfs = activeTrack.value.keyframes;
  if (idx <= 0) return null;
  const prevKf = kfs[idx - 1];
  const kf = kfs[idx];
  if (!Array.isArray(prevKf.curve)) return null;
  
  const [, , p2x, p2y] = prevKf.curve;
  const dt = kf.time - prevKf.time;
  const dv = kf.value - prevKf.value;
  return {
    x: timeToPixel(prevKf.time + p2x * dt),
    y: valueToY(prevKf.value + p2y * dv)
  };
});

const getInterpolationType = (kf: any): string => {
  if (!kf.curve || kf.curve === 'linear') return 'linear';
  if (kf.curve === 'step') return 'step';
  if (Array.isArray(kf.curve)) return 'bezier';
  return 'linear';
};

const handleInterpolationTypeChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  const val = target.value;
  if (selectedKeyframe.value) {
    if (val === 'linear') {
      selectedKeyframe.value.curve = 'linear';
    } else if (val === 'step') {
      selectedKeyframe.value.curve = 'step';
    } else if (val === 'bezier') {
      selectedKeyframe.value.curve = [0.25, 0.25, 0.75, 0.75];
    }
    projectStore.syncLinkedParameters();
    timelineStore._applyCurrentValues();
    projectStore.markDirty();
  }
};

const startGraphKeyframeDrag = (idx: number, e: MouseEvent) => {
  if (!activeTrack.value) return;
  timelineStore.activeKeyframeIndex = idx;
  dragMode.value = 'keyframe';
  dragKeyframeIndex = idx;
  startMouseX = e.clientX;
  startMouseY = e.clientY;
  const kf = activeTrack.value.keyframes[idx];
  startKfTime = kf.time;
  startKfValue = kf.value;
  
  window.addEventListener('mousemove', onGraphMouseMove);
  window.addEventListener('mouseup', onGraphMouseUp);
};

const startHandleDrag = (side: 'left' | 'right', e: MouseEvent) => {
  dragMode.value = side === 'left' ? 'handle-left' : 'handle-right';
  startMouseX = e.clientX;
  startMouseY = e.clientY;
  
  window.addEventListener('mousemove', onGraphMouseMove);
  window.addEventListener('mouseup', onGraphMouseUp);
};

const onGraphMouseMove = (e: MouseEvent) => {
  if (dragMode.value === 'none' || !activeTrack.value || !activeParameter.value) return;
  
  const dxPix = e.clientX - startMouseX;
  const dyPix = e.clientY - startMouseY;
  
  const kfs = activeTrack.value.keyframes;
  
  if (dragMode.value === 'keyframe' && dragKeyframeIndex !== null) {
    const kf = kfs[dragKeyframeIndex];
    const dt = dxPix / timelineStore.zoom;
    let newTime = startKfTime + dt;
    
    const minTime = dragKeyframeIndex > 0 ? kfs[dragKeyframeIndex - 1].time + 0.01 : 0;
    const maxTime = dragKeyframeIndex < kfs.length - 1 ? kfs[dragKeyframeIndex + 1].time - 0.01 : timelineStore.duration;
    newTime = Math.max(minTime, Math.min(maxTime, newTime));
    
    const padding = 30;
    const h = svgHeight.value;
    const available = h - padding * 2;
    const min = activeParameter.value.min;
    const max = activeParameter.value.max;
    const dv = -(dyPix / available) * (max - min);
    let newValue = startKfValue + dv;
    newValue = Math.max(min, Math.min(max, newValue));
    
    kf.time = newTime;
    kf.value = newValue;
    
    projectStore.syncLinkedParameters();
    timelineStore._applyCurrentValues();
    projectStore.markDirty();
  }
  else if (dragMode.value === 'handle-right' && timelineStore.activeKeyframeIndex !== null) {
    const idx = timelineStore.activeKeyframeIndex;
    const kf = kfs[idx];
    const nextKf = kfs[idx + 1];
    const dt = nextKf.time - kf.time;
    const dv = nextKf.value - kf.value;
    
    const svgRect = graphSvgRef.value?.getBoundingClientRect();
    if (svgRect) {
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;
      
      const mouseTime = pixelToTime(mouseX);
      const mouseVal = yToValue(mouseY);
      
      let p1x = (mouseTime - kf.time) / dt;
      let p1y = (mouseVal - kf.value) / (dv || 0.0001);
      
      p1x = Math.max(0, Math.min(1, p1x));
      p1y = Math.max(-2, Math.min(2, p1y));
      
      kf.curve = [p1x, p1y, Array.isArray(kf.curve) ? kf.curve[2] : 0.75, Array.isArray(kf.curve) ? kf.curve[3] : 0.75];
      projectStore.syncLinkedParameters();
      timelineStore._applyCurrentValues();
      projectStore.markDirty();
    }
  }
  else if (dragMode.value === 'handle-left' && timelineStore.activeKeyframeIndex !== null) {
    const idx = timelineStore.activeKeyframeIndex;
    const prevKf = kfs[idx - 1];
    const kf = kfs[idx];
    const dt = kf.time - prevKf.time;
    const dv = kf.value - prevKf.value;
    
    const svgRect = graphSvgRef.value?.getBoundingClientRect();
    if (svgRect) {
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;
      
      const mouseTime = pixelToTime(mouseX);
      const mouseVal = yToValue(mouseY);
      
      let p2x = (mouseTime - prevKf.time) / dt;
      let p2y = (mouseVal - prevKf.value) / (dv || 0.0001);
      
      p2x = Math.max(0, Math.min(1, p2x));
      p2y = Math.max(-2, Math.min(2, p2y));
      
      prevKf.curve = [Array.isArray(prevKf.curve) ? prevKf.curve[0] : 0.25, Array.isArray(prevKf.curve) ? prevKf.curve[1] : 0.25, p2x, p2y];
      projectStore.syncLinkedParameters();
      timelineStore._applyCurrentValues();
      projectStore.markDirty();
    }
  }
};

const onGraphMouseUp = () => {
  if (dragMode.value === 'keyframe' && dragKeyframeIndex !== null && activeTrack.value) {
    activeTrack.value.keyframes.sort((a, b) => a.time - b.time);
  }
  dragMode.value = 'none';
  dragKeyframeIndex = null;
  window.removeEventListener('mousemove', onGraphMouseMove);
  window.removeEventListener('mouseup', onGraphMouseUp);
};

const onGraphBackgroundMouseDown = (e: MouseEvent) => {
  if (e.target === graphSvgRef.value || (e.target as SVGElement).classList.contains('grid-line')) {
    timelineStore.activeKeyframeIndex = null;
  }
};
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

  // --- Graph Editor Style Rules ---
  .graph-editor-container {
    display: flex;
    flex: 1;
    overflow: hidden;
    height: calc(100% - 32px);

    .tracks-list {
      width: 200px;
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      background-color: var(--bg-panel);
    }

    .graph-canvas-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background-color: var(--bg-base);
      position: relative;
      overflow: hidden;

      .empty-graph-state {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        font-size: 11px;
      }

      .graph-toolbar {
        height: 32px;
        background-color: var(--bg-panel);
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        padding: 0 12px;
        gap: 12px;
        font-size: 11px;

        .active-track-name {
          font-weight: 600;
          color: var(--brand-cyan);
        }

        .divider {
          width: 1px;
          height: 12px;
          background-color: var(--border-color);
        }

        .toolbar-label {
          color: var(--text-secondary);
        }

        .graph-select {
          background-color: var(--bg-base);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 2px 6px;
          color: var(--text-secondary);
          font-size: 11px;
          outline: none;

          &:focus {
            border-color: var(--brand-cyan);
          }
        }
      }

      .svg-wrapper {
        flex: 1;
        position: relative;
        background-color: rgba(0, 0, 0, 0.2);

        .graph-svg {
          display: block;
          width: 100%;
          height: 100%;

          .grid-line {
            stroke: rgba(255, 255, 255, 0.04);
            stroke-width: 1;
          }

          .grid-label {
            fill: var(--text-muted);
            font-size: 8px;
          }

          .playhead-line {
            stroke: rgba(255, 100, 100, 0.4);
            stroke-width: 1.5;
            stroke-dasharray: 2 2;
          }

          .graph-path {
            fill: none;
            stroke: var(--brand-purple);
            stroke-width: 2.5;
            stroke-linecap: round;
          }

          .tangent-line {
            stroke: var(--brand-cyan);
            stroke-width: 1;
            stroke-dasharray: 1 1;
          }

          .tangent-handle {
            fill: #ffffff;
            stroke: var(--brand-cyan);
            stroke-width: 1.5;
            cursor: pointer;

            &:hover {
              fill: var(--brand-cyan);
            }
          }

          .keyframe-group {
            cursor: pointer;

            .keyframe-diamond {
              fill: var(--brand-purple);
              stroke: #ffffff;
              stroke-width: 1.5;
              transform: rotate(45deg);
              transition: all 0.15s ease;
            }

            &:hover .keyframe-diamond {
              fill: #ffffff;
              stroke: var(--brand-cyan);
              filter: drop-shadow(0 0 4px var(--brand-cyan));
            }

            &.selected .keyframe-diamond {
              fill: var(--brand-cyan);
              stroke: #ffffff;
              filter: drop-shadow(0 0 6px var(--brand-cyan));
            }
          }
        }
      }
    }
  }
}
</style>
