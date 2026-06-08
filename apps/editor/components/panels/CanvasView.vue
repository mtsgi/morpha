<template>
  <div class="canvas-view">
    <div class="canvas-header">
      <div class="tabs">
        <div class="tab active">Scene</div>
      </div>
      <div class="toolbar-top">
        <div class="tools">
          <MousePointer2Icon class="icon active" :size="16" />
          <SquareIcon class="icon" :size="16" />
          <CircleIcon class="icon" :size="16" />
          <TriangleIcon class="icon" :size="16" />
          <PenToolIcon class="icon" :size="16" />
          <div class="divider"></div>
          <GridIcon class="icon" :size="16" />
          <MagnetIcon class="icon" :size="16" />
        </div>
        <div class="canvas-info">
          <span>キャンバス:</span>
          <MonitorIcon class="icon" :size="16" />
          <SmartphoneIcon class="icon" :size="16" />
          <div class="divider"></div>
          <ScanIcon class="icon" :size="16" />
          <div class="divider"></div>
          <button
            class="bone-toggle"
            :class="{ active: showBones }"
            @click="showBones = !showBones"
            title="ボーン表示切替"
          >
            <BoneIcon :size="16" />
          </button>
        </div>
      </div>
    </div>

    <div class="canvas-workspace">
      <!-- Floating Toolbar Left -->
      <div class="floating-toolbar">
        <button class="tool-btn" :class="{ active: activeTool === 'select' }" @click="activeTool = 'select'">
          <MousePointer2Icon class="icon" :size="16" />
          <span>選択</span>
        </button>
        <button class="tool-btn" :class="{ active: activeTool === 'move' }" @click="activeTool = 'move'">
          <MoveIcon class="icon" :size="16" />
          <span>移動</span>
        </button>
        <button class="tool-btn" :class="{ active: activeTool === 'rotate' }" @click="activeTool = 'rotate'">
          <RotateCwIcon class="icon" :size="16" />
          <span>回転</span>
        </button>
        <button class="tool-btn" :class="{ active: activeTool === 'scale' }" @click="activeTool = 'scale'">
          <ScalingIcon class="icon" :size="16" />
          <span>拡縮</span>
        </button>
        <button class="tool-btn" :class="{ active: activeTool === 'mesh' }" @click="activeTool = 'mesh'">
          <NetworkIcon class="icon" :size="16" />
          <span>メッシュ変形</span>
        </button>
        <button class="tool-btn" :class="{ active: activeTool === 'weight' }" @click="activeTool = 'weight'">
          <DropletIcon class="icon" :size="16" />
          <span>ウェイト</span>
        </button>
        <div class="divider"></div>
        <button class="tool-btn">
          <Settings2Icon class="icon" :size="16" />
          <span>表示設定</span>
        </button>
      </div>

      <!-- Canvas Area -->
      <div class="canvas-container" ref="containerRef">
        <canvas 
          ref="canvasRef"
        ></canvas>
        <!-- Bone Overlay Canvas -->
        <canvas 
          ref="boneCanvasRef"
          class="bone-overlay"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseUp"
          @wheel.prevent="onWheel"
        ></canvas>
      </div>

      <!-- Floating Zoom Controls Bottom -->
      <div class="floating-zoom">
        <button :class="{ active: activeTool === 'pan' }" @click="activeTool = 'pan'">
          <HandIcon class="icon" :size="16" />
        </button>
        <div class="divider"></div>
        <button @click="viewport.setZoom(viewport.zoom.value / 1.2)"><MinusIcon :size="14" /></button>
        <span @dblclick="viewport.reset()">{{ viewport.zoomPercent.value }}</span>
        <button @click="viewport.setZoom(viewport.zoom.value * 1.2)"><PlusIcon :size="14" /></button>
        <button @click="handleFitView" title="フィットビュー (F)">
          <MaximizeIcon class="icon" :size="16" />
        </button>
      </div>

      <!-- Floating Options Panel for Mesh/Weight tools -->
      <div v-if="activeTool === 'mesh' || activeTool === 'weight'" class="floating-options-panel">
        <div class="panel-title">{{ activeTool === 'mesh' ? 'メッシュ編集オプション' : 'ウェイト編集オプション' }}</div>
        <template v-if="activeTool === 'mesh'">
          <div class="option-row">
            <button class="opt-btn" @click="handleInitGridMesh(3, 3)">3x3 グリッド生成</button>
            <button class="opt-btn" @click="handleInitGridMesh(4, 4)">4x4 グリッド生成</button>
            <button class="opt-btn danger" @click="handleClearMesh">メッシュ消去</button>
          </div>
          <div class="option-desc">
            ※ 画像内をクリックしてカスタム頂点を作成・ドラッグで移動。
          </div>
        </template>
        <template v-if="activeTool === 'weight'">
          <div class="option-row select-bone-warning" v-if="!bonesStore.activeBoneId">
            ボーンを選択してください
          </div>
          <template v-else>
            <div class="option-row flex-col">
              <span class="label">ブラシ半径: {{ brushSize }}px</span>
              <input type="range" min="5" max="100" v-model.number="brushSize" class="opt-slider" />
            </div>
            <div class="option-row flex-col">
              <span class="label">ブラシ強度: {{ Math.round(brushStrength * 100) }}%</span>
              <input type="range" min="0.05" max="1" step="0.05" v-model.number="brushStrength" class="opt-slider" />
            </div>
            <div class="option-row">
              <button class="opt-btn" @click="handleApplyFullWeight" :disabled="activeVertexIndex === null">
                選択頂点に100%適用
              </button>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { 
  MousePointer2 as MousePointer2Icon,
  Square as SquareIcon,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  PenTool as PenToolIcon,
  Grid as GridIcon,
  Magnet as MagnetIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  Scan as ScanIcon,
  Move as MoveIcon,
  RotateCw as RotateCwIcon,
  Scaling as ScalingIcon,
  Network as NetworkIcon,
  Droplet as DropletIcon,
  Settings2 as Settings2Icon,
  Hand as HandIcon,
  Minus as MinusIcon,
  Plus as PlusIcon,
  Maximize as MaximizeIcon,
  Bone as BoneIcon
} from 'lucide-vue-next';
import { useProjectStore } from '../../stores/project';
import { useBonesStore } from '../../stores/bones';
import { useEditorStore } from '../../stores/editor';
import { usePhysicsStore } from '../../stores/physics';
import { useTimelineStore } from '../../stores/timeline';
import { MorphaRenderer } from '@morpha/web-runtime';
import { useViewport } from '../../composables/useViewport';

const projectStore = useProjectStore();
const bonesStore = useBonesStore();
const editorStore = useEditorStore();
const physicsStore = usePhysicsStore();
const timelineStore = useTimelineStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const boneCanvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
let renderer: MorphaRenderer | null = null;
let animationFrameId: number;

const showBones = ref(true);
const activeTool = computed({
  get: () => editorStore.activeTool,
  set: (val) => editorStore.setTool(val as any)
});
const viewport = useViewport();
let isSpaceDown = false;

// メッシュ変形・ウェイトペイント用の状態
const activeVertexIndex = ref<number | null>(null);
const brushSize = ref(30);       // ウェイトペイントブラシ半径 (px)
const brushStrength = ref(0.2);  // ウェイトペイントブラシ強度
const mouseX = ref(0);
const mouseY = ref(0);

onMounted(async () => {
  if (!canvasRef.value || !containerRef.value) return;

  // Initialize renderer
  renderer = new MorphaRenderer(canvasRef.value);

  // Resize handling
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      if (renderer) {
        renderer.resize(entry.contentRect.width, entry.contentRect.height);
      }
      // Bone overlay canvas も同じサイズに
      if (boneCanvasRef.value) {
        boneCanvasRef.value.width = entry.contentRect.width;
        boneCanvasRef.value.height = entry.contentRect.height;
      }
    }
  });
  resizeObserver.observe(containerRef.value);

  // Load sample texture
  await renderer.loadTexture('/assets/texture_00.png');

  // Keyboard listeners for space (pan mode)
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  // Animation loop
  let lastTimestamp = performance.now();
  const renderLoop = () => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastTimestamp) / 1000);
    lastTimestamp = now;

    if (renderer) {
      // Sync assets and parts from the store
      renderer.syncProject(projectStore.project);
      
      // Update params from store
      renderer.updateParameters(projectStore.currentParameters);

      // Run physics simulation if in appropriate mode and enabled
      if (editorStore.currentMode === 'preview' || (editorStore.currentMode === 'animate' && timelineStore.isPlaying)) {
        if (physicsStore.physicsEnabled) {
          renderer.updatePhysics(dt);
        }
      } else {
        renderer.resetPhysics();
        projectStore.syncLinkedParameters();
      }

      renderer.render(viewport.getViewMatrix());
    }

    // Draw bone overlay
    if (showBones.value) {
      drawBoneOverlay();
    } else if (boneCanvasRef.value) {
      const ctx = boneCanvasRef.value.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, boneCanvasRef.value.width, boneCanvasRef.value.height);
    }

    animationFrameId = requestAnimationFrame(renderLoop);
  };
  renderLoop();
});

const onKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space' && !isSpaceDown) {
    isSpaceDown = true;
    e.preventDefault();
  }
  if (e.code === 'KeyF') {
    handleFitView();
  }
};

const onKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    isSpaceDown = false;
  }
};

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  document.removeEventListener('keydown', onKeyDown);
  document.removeEventListener('keyup', onKeyUp);
});

/** ホイールでズーム */
const onWheel = (e: WheelEvent) => {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  viewport.zoomAtPoint(e.deltaY, e.clientX, e.clientY, rect);
};

const handleFitView = () => {
  if (!containerRef.value) return;
  viewport.fitToContent(containerRef.value.clientWidth, containerRef.value.clientHeight);
};

import { mat3, vec3 } from 'gl-matrix';

function getBoneWorldMatrix(boneId: string): mat3 {
  const bones = bonesStore.bones;
  const bone = bones.find(b => b.id === boneId);
  if (!bone) return mat3.create();

  const boneMat = mat3.create();
  mat3.translate(boneMat, boneMat, bone.position);
  mat3.rotate(boneMat, boneMat, bone.rotation);

  if (bone.parentId) {
    const parentMat = getBoneWorldMatrix(bone.parentId);
    mat3.multiply(boneMat, parentMat, boneMat);
  }
  return boneMat;
}

function getPartWorldMatrix(partId: string): mat3 {
  const project = projectStore.project;
  if (!project) return mat3.create();

  const part = project.rig.parts.find(p => p.id === partId);
  if (!part) return mat3.create();

  const localMat = mat3.create();

  if (part.boneId) {
    const boneMat = getBoneWorldMatrix(part.boneId);
    mat3.multiply(localMat, localMat, boneMat);
  }

  if (part.transform) {
    mat3.translate(localMat, localMat, part.transform.position);
    mat3.rotate(localMat, localMat, part.transform.rotation);
    mat3.scale(localMat, localMat, part.transform.scale);
  }

  if (part.parentId) {
    const parentWorldMat = getPartWorldMatrix(part.parentId);
    mat3.multiply(localMat, parentWorldMat, localMat);
  }

  return localMat;
}

function screenToPartLocal(mx: number, my: number, partId: string): [number, number] {
  const canvas = boneCanvasRef.value;
  if (!canvas) return [0, 0];
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2 + viewport.pan.value[0];
  const cy = h / 2 + viewport.pan.value[1];
  const scale = Math.min(w, h) * 0.75 * viewport.zoom.value;

  const wx = (mx - cx) / scale;
  const wy = (cy - my) / scale;

  const worldMat = getPartWorldMatrix(partId);
  const worldMatInv = mat3.create();
  mat3.invert(worldMatInv, worldMat);

  const pLocal = vec3.create();
  vec3.transformMat3(pLocal, vec3.fromValues(wx, wy, 1.0), worldMatInv);
  return [pLocal[0], pLocal[1]];
}

// Delaunay 三角形分割
function triangulateDelaunay(part: any) {
  const pts: { x: number; y: number; id: number }[] = [];
  for (let i = 0; i < part.vertices.length / 2; i++) {
    pts.push({ x: part.vertices[i * 2], y: part.vertices[i * 2 + 1], id: i });
  }

  const triangles: number[] = [];
  if (pts.length < 3) {
    part.triangles = [];
    return;
  }

  const inCircumcircle = (p: {x: number, y: number}, a: {x: number, y: number}, b: {x: number, y: number}, c: {x: number, y: number}) => {
    const adx = a.x - p.x, ady = a.y - p.y;
    const bdx = b.x - p.x, bdy = b.y - p.y;
    const cdx = c.x - p.x, cdy = c.y - p.y;
    const abdet = adx * bdy - bdx * ady;
    const bcdet = bdx * cdy - cdx * bdy;
    const cadet = cdx * ady - adx * cdy;
    const alift = adx * adx + ady * ady;
    const blift = bdx * bdx + bdy * bdy;
    const clift = cdx * cdx + cdy * cdy;
    return (alift * bcdet + blift * cadet + clift * abdet) > 0.00001;
  };

  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      for (let k = j + 1; k < pts.length; k++) {
        const p1 = pts[i];
        const p2 = pts[j];
        const p3 = pts[k];

        const ccw = (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y);
        if (Math.abs(ccw) < 0.0001) continue;

        const a = ccw > 0 ? p1 : p2;
        const b = ccw > 0 ? p2 : p1;
        const c = p3;

        let isDelaunay = true;
        for (let m = 0; m < pts.length; m++) {
          if (m === i || m === j || m === k) continue;
          if (inCircumcircle(pts[m], a, b, c)) {
            isDelaunay = false;
            break;
          }
        }

        if (isDelaunay) {
          triangles.push(a.id, b.id, c.id);
        }
      }
    }
  }
  part.triangles = triangles;
  projectStore.markDirty();
}

// ウェイトブラシペイント
function paintWeight(mx: number, my: number) {
  const part = projectStore.project?.rig.parts.find(p => p.id === projectStore.activePartId);
  const activeBoneId = bonesStore.activeBoneId;
  if (!part || !part.vertices || !activeBoneId) return;

  const worldMat = getPartWorldMatrix(part.id);
  const canvas = boneCanvasRef.value;
  if (!canvas) return;
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2 + viewport.pan.value[0];
  const cy = h / 2 + viewport.pan.value[1];
  const scale = Math.min(w, h) * 0.75 * viewport.zoom.value;

  const radius = brushSize.value;
  const delta = brushStrength.value;

  let updated = false;

  for (let i = 0; i < part.vertices.length / 2; i++) {
    const vx = part.vertices[i * 2];
    const vy = part.vertices[i * 2 + 1];

    const pWorld = vec3.create();
    vec3.transformMat3(pWorld, vec3.fromValues(vx, vy, 1.0), worldMat);

    const sx = cx + pWorld[0] * scale;
    const sy = cy - pWorld[1] * scale;

    const dist = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
    if (dist <= radius) {
      if (!part.skinWeights) part.skinWeights = [];
      if (!part.skinWeights[i]) {
        part.skinWeights[i] = { boneIds: [], weights: [] };
      }
      const sw = part.skinWeights[i];
      let bIdx = sw.boneIds.indexOf(activeBoneId);
      if (bIdx === -1) {
        sw.boneIds.push(activeBoneId);
        sw.weights.push(0);
        bIdx = sw.boneIds.length - 1;
      }

      sw.weights[bIdx] = Math.min(1.0, sw.weights[bIdx] + delta);

      const sumOther = sw.weights.reduce((sum, w, idx) => idx === bIdx ? sum : sum + w, 0);
      if (sumOther > 0) {
        const factor = (1.0 - sw.weights[bIdx]) / sumOther;
        for (let idx = 0; idx < sw.weights.length; idx++) {
          if (idx !== bIdx) sw.weights[idx] *= factor;
        }
      } else {
        sw.weights[bIdx] = 1.0;
      }

      for (let idx = sw.weights.length - 1; idx >= 0; idx--) {
        if (sw.weights[idx] < 0.001) {
          sw.boneIds.splice(idx, 1);
          sw.weights.splice(idx, 1);
        }
      }

      updated = true;
    }
  }

  if (updated) {
    projectStore.markDirty();
  }
}

// ウェイト色の取得 (青 -> 黄 -> 赤)
function getWeightColor(sw: any, boneId: string | null): string {
  if (!sw || !boneId) return 'rgba(138, 79, 255, 0.5)';
  const idx = sw.boneIds.indexOf(boneId);
  if (idx === -1) return 'rgba(138, 79, 255, 0.5)';
  const w = sw.weights[idx];
  if (w < 0.5) {
    const t = w / 0.5;
    const r = Math.floor(138 + (255 - 138) * t);
    const g = Math.floor(79 + (255 - 79) * t);
    const b = Math.floor(255 * (1 - t));
    return `rgba(${r}, ${g}, ${b}, 0.9)`;
  } else {
    const t = (w - 0.5) / 0.5;
    const r = 255;
    const g = Math.floor(255 * (1 - t));
    const b = 0;
    return `rgba(${r}, ${g}, ${b}, 0.9)`;
  }
}

// グリッドメッシュ生成
const handleInitGridMesh = (rows: number, cols: number) => {
  const part = projectStore.project?.rig.parts.find(p => p.id === projectStore.activePartId);
  if (!part) return;

  const vertices: number[] = [];
  const uvs: number[] = [];
  const triangles: number[] = [];
  const skinWeights: any[] = [];

  for (let r = 0; r <= rows; r++) {
    const y = -0.5 + r / rows;
    const v = 1.0 - r / rows;
    for (let c = 0; c <= cols; c++) {
      const x = -0.5 + c / cols;
      const u = c / cols;
      vertices.push(x, y);
      uvs.push(u, v);
      skinWeights.push({ boneIds: [], weights: [] });
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i0 = r * (cols + 1) + c;
      const i1 = i0 + 1;
      const i2 = i0 + (cols + 1);
      const i3 = i2 + 1;
      triangles.push(i0, i1, i2);
      triangles.push(i2, i1, i3);
    }
  }

  part.vertices = vertices;
  part.uvs = uvs;
  part.triangles = triangles;
  part.skinWeights = skinWeights;
  activeVertexIndex.value = null;
  projectStore.markDirty();
};

const handleClearMesh = () => {
  const part = projectStore.project?.rig.parts.find(p => p.id === projectStore.activePartId);
  if (part) {
    delete part.vertices;
    delete part.uvs;
    delete part.triangles;
    delete part.skinWeights;
    delete part.bindMatrices;
    activeVertexIndex.value = null;
    projectStore.markDirty();
  }
};

const handleApplyFullWeight = () => {
  const part = projectStore.project?.rig.parts.find(p => p.id === projectStore.activePartId);
  const activeBoneId = bonesStore.activeBoneId;
  if (!part || activeVertexIndex.value === null || !activeBoneId) return;

  if (!part.skinWeights) part.skinWeights = [];
  if (!part.skinWeights[activeVertexIndex.value]) {
    part.skinWeights[activeVertexIndex.value] = { boneIds: [], weights: [] };
  }
  const sw = part.skinWeights[activeVertexIndex.value];
  sw.boneIds = [activeBoneId];
  sw.weights = [1.0];
  projectStore.markDirty();
};

// ボーン ＆ メッシュ ＆ ウェイトオーバーレイ描画
function drawBoneOverlay() {
  const canvas = boneCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2 + viewport.pan.value[0];
  const cy = h / 2 + viewport.pan.value[1];
  const scale = Math.min(w, h) * 0.75 * viewport.zoom.value;

  const bones = bonesStore.bones;

  // 1. まずメッシュ描画 (選択中かつ mesh/weight ツール時)
  const activePart = projectStore.project?.rig.parts.find(p => p.id === projectStore.activePartId);
  if (activePart && activePart.vertices && activePart.triangles && (activeTool.value === 'mesh' || activeTool.value === 'weight')) {
    const worldMat = getPartWorldMatrix(activePart.id);
    const getScreenPos = (vx: number, vy: number): [number, number] => {
      const pWorld = vec3.create();
      vec3.transformMat3(pWorld, vec3.fromValues(vx, vy, 1.0), worldMat);
      return [cx + pWorld[0] * scale, cy - pWorld[1] * scale];
    };

    // ワイヤーフレーム描画
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
    ctx.lineWidth = 1;
    for (let t = 0; t < activePart.triangles.length / 3; t++) {
      const i0 = activePart.triangles[t * 3];
      const i1 = activePart.triangles[t * 3 + 1];
      const i2 = activePart.triangles[t * 3 + 2];

      const p0 = getScreenPos(activePart.vertices[i0 * 2], activePart.vertices[i0 * 2 + 1]);
      const p1 = getScreenPos(activePart.vertices[i1 * 2], activePart.vertices[i1 * 2 + 1]);
      const p2 = getScreenPos(activePart.vertices[i2 * 2], activePart.vertices[i2 * 2 + 1]);

      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();

    // 頂点描画
    ctx.save();
    for (let i = 0; i < activePart.vertices.length / 2; i++) {
      const p = getScreenPos(activePart.vertices[i * 2], activePart.vertices[i * 2 + 1]);
      const isSelected = activeVertexIndex.value === i;

      ctx.beginPath();
      ctx.arc(p[0], p[1], isSelected ? 6 : 4, 0, Math.PI * 2);

      if (activeTool.value === 'weight') {
        const sw = activePart.skinWeights?.[i];
        ctx.fillStyle = getWeightColor(sw, bonesStore.activeBoneId);
      } else {
        ctx.fillStyle = isSelected ? '#ff4d4f' : '#00d2ff';
      }

      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. 次にボーン描画
  if (bones.length > 0) {
    for (const bone of bones) {
      const isActive = bonesStore.activeBoneId === bone.id;
      const sx = cx + bone.position[0] * scale;
      const sy = cy - bone.position[1] * scale;

      const endX = sx + Math.sin(bone.rotation) * bone.length * scale;
      const endY = sy - Math.cos(bone.rotation) * bone.length * scale;

      // ボーンの「棒」を描画
      ctx.save();
      ctx.beginPath();
      
      const boneWidth = isActive ? 8 : 6;
      const perpX = Math.cos(bone.rotation) * boneWidth / 2;
      const perpY = Math.sin(bone.rotation) * boneWidth / 2;
      
      ctx.moveTo(sx - perpX, sy - perpY);
      ctx.lineTo(endX - perpX * 0.3, endY - perpY * 0.3);
      ctx.lineTo(endX + perpX * 0.3, endY + perpY * 0.3);
      ctx.lineTo(sx + perpX, sy + perpY);
      ctx.closePath();

      if (isActive) {
        ctx.fillStyle = 'rgba(0, 210, 255, 0.25)';
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = 'rgba(138, 79, 255, 0.15)';
        ctx.strokeStyle = 'rgba(138, 79, 255, 0.6)';
        ctx.lineWidth = 1;
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // ジョイント
      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, sy, isActive ? 5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#00d2ff' : '#8a4fff';
      ctx.fill();
      ctx.strokeStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.stroke();
      ctx.restore();

      // 先端
      ctx.save();
      ctx.beginPath();
      ctx.arc(endX, endY, isActive ? 3 : 2, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#00d2ff' : 'rgba(138, 79, 255, 0.8)';
      ctx.fill();
      ctx.restore();

      if (isActive) {
        ctx.save();
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#00d2ff';
        ctx.textAlign = 'left';
        ctx.fillText(bone.name, sx + 10, sy - 8);
        ctx.restore();
      }
    }

    // 親子接続線
    for (const bone of bones) {
      if (bone.parentId) {
        const parent = bones.find(b => b.id === bone.parentId);
        if (parent) {
          const parentEndX = cx + parent.position[0] * scale + Math.sin(parent.rotation) * parent.length * scale;
          const parentEndY = cy - parent.position[1] * scale - Math.cos(parent.rotation) * parent.length * scale;
          const childSX = cx + bone.position[0] * scale;
          const childSY = cy - bone.position[1] * scale;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(parentEndX, parentEndY);
          ctx.lineTo(childSX, childSY);
          ctx.strokeStyle = 'rgba(138, 79, 255, 0.25)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  // 3. ウェイトペイントブラシサークルの描画
  if (activeTool.value === 'weight' && bonesStore.activeBoneId) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(mouseX.value, mouseY.value, brushSize.value, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff4d4f';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(255, 77, 79, 0.08)';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function hitTestBone(screenX: number, screenY: number): string | null {
  const canvas = boneCanvasRef.value;
  if (!canvas) return null;

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2 + viewport.pan.value[0];
  const cy = h / 2 + viewport.pan.value[1];
  const scale = Math.min(w, h) * 0.75 * viewport.zoom.value;

  const bones = bonesStore.bones;
  const hitRadius = 10;

  for (let i = bones.length - 1; i >= 0; i--) {
    const bone = bones[i];
    const sx = cx + bone.position[0] * scale;
    const sy = cy - bone.position[1] * scale;

    const dx = screenX - sx;
    const dy = screenY - sy;
    if (Math.sqrt(dx * dx + dy * dy) < hitRadius) {
      return bone.id;
    }
  }
  return null;
}

// ドラッグ操作ロジック
let isDragging = false;
let dragTarget: 'part' | 'bone' | 'pan' | 'vertex' | 'weight' | null = null;
let startX = 0;
let startY = 0;

const onMouseDown = (e: MouseEvent) => {
  if (!boneCanvasRef.value) return;
  const rect = boneCanvasRef.value.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  mouseX.value = mx;
  mouseY.value = my;

  // Space / 中クリック -> パンモード
  if (isSpaceDown || activeTool.value === 'pan' || e.button === 1) {
    isDragging = true;
    dragTarget = 'pan';
    startX = e.clientX;
    startY = e.clientY;
    return;
  }

  // メッシュツール
  if (activeTool.value === 'mesh') {
    const part = projectStore.project?.rig.parts.find(p => p.id === projectStore.activePartId);
    if (part) {
      if (!part.vertices) {
        handleInitGridMesh(3, 3);
        return;
      }

      // 近接頂点ヒットテスト
      const cx = boneCanvasRef.value.width / 2 + viewport.pan.value[0];
      const cy = boneCanvasRef.value.height / 2 + viewport.pan.value[1];
      const scale = Math.min(boneCanvasRef.value.width, boneCanvasRef.value.height) * 0.75 * viewport.zoom.value;
      const worldMat = getPartWorldMatrix(part.id);

      let hitIdx = -1;
      let minDist = 12;

      for (let i = 0; i < part.vertices.length / 2; i++) {
        const vx = part.vertices[i * 2];
        const vy = part.vertices[i * 2 + 1];

        const pWorld = vec3.create();
        vec3.transformMat3(pWorld, vec3.fromValues(vx, vy, 1.0), worldMat);

        const sx = cx + pWorld[0] * scale;
        const sy = cy - pWorld[1] * scale;

        const d = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
        if (d < minDist) {
          minDist = d;
          hitIdx = i;
        }
      }

      if (hitIdx !== -1) {
        isDragging = true;
        dragTarget = 'vertex';
        activeVertexIndex.value = hitIdx;
      } else {
        // カスタム頂点の追加
        const local = screenToPartLocal(mx, my, part.id);
        if (!part.vertices) part.vertices = [];
        if (!part.uvs) part.uvs = [];
        part.vertices.push(local[0], local[1]);
        part.uvs.push(local[0] + 0.5, 0.5 - local[1]);
        if (!part.skinWeights) part.skinWeights = [];
        part.skinWeights.push({ boneIds: [], weights: [] });

        triangulateDelaunay(part);
        activeVertexIndex.value = part.vertices.length / 2 - 1;
      }
    }
    return;
  }

  // ウェイトペイントツール
  if (activeTool.value === 'weight') {
    if (!bonesStore.activeBoneId) return;
    
    // まずはドラッグ選択用の頂点ヒットテスト
    const part = projectStore.project?.rig.parts.find(p => p.id === projectStore.activePartId);
    if (part && part.vertices) {
      const cx = boneCanvasRef.value.width / 2 + viewport.pan.value[0];
      const cy = boneCanvasRef.value.height / 2 + viewport.pan.value[1];
      const scale = Math.min(boneCanvasRef.value.width, boneCanvasRef.value.height) * 0.75 * viewport.zoom.value;
      const worldMat = getPartWorldMatrix(part.id);

      let hitIdx = -1;
      let minDist = 12;
      for (let i = 0; i < part.vertices.length / 2; i++) {
        const vx = part.vertices[i * 2];
        const vy = part.vertices[i * 2 + 1];
        const pWorld = vec3.create();
        vec3.transformMat3(pWorld, vec3.fromValues(vx, vy, 1.0), worldMat);
        const sx = cx + pWorld[0] * scale;
        const sy = cy - pWorld[1] * scale;
        const d = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
        if (d < minDist) {
          minDist = d;
          hitIdx = i;
        }
      }
      if (hitIdx !== -1) {
        activeVertexIndex.value = hitIdx;
      }
    }

    isDragging = true;
    dragTarget = 'weight';
    paintWeight(mx, my);
    return;
  }

  // ボーンヒットテスト
  if (showBones.value) {
    const hitBoneId = hitTestBone(mx, my);
    if (hitBoneId) {
      bonesStore.setActiveBone(hitBoneId);
      isDragging = true;
      dragTarget = 'bone';
      startX = e.clientX;
      startY = e.clientY;
      return;
    }
  }

  // パーツドラッグ
  isDragging = true;
  dragTarget = 'part';
  startX = e.clientX;
  startY = e.clientY;
};

const onMouseMove = (e: MouseEvent) => {
  if (!boneCanvasRef.value) return;
  const rect = boneCanvasRef.value.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  mouseX.value = mx;
  mouseY.value = my;

  if (!isDragging) return;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  startX = e.clientX;
  startY = e.clientY;

  if (dragTarget === 'pan') {
    viewport.panBy(dx, dy);
    return;
  }

  const canvas = boneCanvasRef.value;
  const scale = Math.min(canvas.width, canvas.height) * 0.75 * viewport.zoom.value;

  if (dragTarget === 'vertex') {
    const part = projectStore.project?.rig.parts.find(p => p.id === projectStore.activePartId);
    if (part && part.vertices && activeVertexIndex.value !== null) {
      const local = screenToPartLocal(mx, my, part.id);
      part.vertices[activeVertexIndex.value * 2] = local[0];
      part.vertices[activeVertexIndex.value * 2 + 1] = local[1];
      projectStore.markDirty();
    }
  } else if (dragTarget === 'weight') {
    paintWeight(mx, my);
  } else if (dragTarget === 'bone' && bonesStore.activeBoneId) {
    const bone = bonesStore.activeBone;
    if (bone) {
      bonesStore.updateBone(bone.id, {
        position: [
          bone.position[0] + dx / scale,
          bone.position[1] - dy / scale,
        ],
      });
    }
  } else if (dragTarget === 'part') {
    const scaleX = 3.0 / (canvas.clientWidth * viewport.zoom.value);
    const scaleY = -3.0 / (canvas.clientHeight * viewport.zoom.value);
    if (projectStore.activePartId && projectStore.project) {
      const part = projectStore.project.rig.parts.find(p => p.id === projectStore.activePartId);
      if (part && part.transform) {
        part.transform.position[0] += dx * scaleX;
        part.transform.position[1] += dy * scaleY;
      }
    }
  }
};

const onMouseUp = () => {
  isDragging = false;
  dragTarget = null;
};
</script>

<style scoped lang="scss">
.canvas-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-base);
  position: relative;
  overflow: hidden;

  .canvas-header {
    background-color: var(--bg-panel);
    border-bottom: 1px solid var(--border-color);

    .tabs {
      display: flex;
      padding-top: 8px;
      padding-left: 16px;
      gap: 4px;
      
      .tab {
        padding: 6px 16px;
        background-color: var(--bg-base);
        color: var(--text-secondary);
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
        font-size: 12px;
        cursor: pointer;

        &.active {
          color: var(--brand-purple);
          border-bottom: 2px solid var(--brand-purple);
        }
      }
    }

    .toolbar-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background-color: var(--bg-base);
      border-top: 1px solid var(--border-color);

      .tools, .canvas-info {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--text-secondary);

        .icon {
          cursor: pointer;
          &:hover { color: var(--text-primary); }
          &.active { color: var(--brand-purple); }
        }

        .divider {
          width: 1px;
          height: 16px;
          background-color: var(--border-color);
        }
      }

      .canvas-info {
        span {
          font-size: 11px;
          margin-right: 4px;
        }

        .bone-toggle {
          display: flex;
          align-items: center;
          padding: 2px;
          border-radius: 3px;
          color: var(--text-secondary);
          transition: all 0.15s;

          &:hover { color: var(--text-primary); }
          &.active { color: var(--brand-cyan); }
        }
      }
    }
  }

  .canvas-workspace {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    .floating-toolbar {
      position: absolute;
      left: 16px;
      top: 16px;
      background-color: rgba(24, 24, 31, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      z-index: 10;

      .divider {
        height: 1px;
        background-color: var(--border-color);
        margin: 4px 0;
      }

      .tool-btn {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        border-radius: 6px;
        color: var(--text-secondary);
        width: 130px;
        transition: all 0.2s;

        span {
          font-size: 12px;
        }

        &:hover {
          background-color: var(--bg-hover);
          color: var(--text-primary);
        }

        &.active {
          background-color: rgba(138, 79, 255, 0.2);
          color: var(--brand-cyan);
        }
      }
    }

    .floating-zoom {
      position: absolute;
      left: 16px;
      bottom: 16px;
      background-color: rgba(24, 24, 31, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--text-secondary);
      z-index: 10;

      .divider {
        width: 1px;
        height: 14px;
        background-color: var(--border-color);
      }

      button {
        display: flex;
        align-items: center;
        justify-content: center;
        &:hover { color: var(--text-active); }
      }

      span {
        font-size: 12px;
        width: 32px;
        text-align: center;
      }
    }

    .floating-options-panel {
      position: absolute;
      right: 16px;
      top: 16px;
      background-color: rgba(24, 24, 31, 0.9);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px;
      width: 220px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 10;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);

      .panel-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--brand-cyan);
        letter-spacing: 0.05em;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 6px;
      }

      .option-row {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;

        &.flex-col {
          flex-direction: column;
          gap: 4px;
        }

        .label {
          font-size: 10px;
          color: var(--text-secondary);
        }

        .opt-slider {
          width: 100%;
          accent-color: var(--brand-purple);
          height: 4px;
          border-radius: 2px;
          outline: none;
        }

        .opt-btn {
          font-size: 11px;
          padding: 6px 10px;
          border-radius: 4px;
          background: rgba(138, 79, 255, 0.2);
          border: 1px solid rgba(138, 79, 255, 0.4);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
          flex: 1;
          text-align: center;

          &:hover:not(:disabled) {
            background: rgba(138, 79, 255, 0.4);
            border-color: var(--brand-purple);
          }

          &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          &.danger {
            background: rgba(255, 77, 79, 0.15);
            border-color: rgba(255, 77, 79, 0.3);
            color: #ff4d4f;

            &:hover {
              background: rgba(255, 77, 79, 0.3);
              border-color: #ff4d4f;
            }
          }
        }

        &.select-bone-warning {
          font-size: 11px;
          color: #ff4d4f;
          background-color: rgba(255, 77, 79, 0.1);
          padding: 6px;
          border-radius: 4px;
          justify-content: center;
        }
      }

      .option-desc {
        font-size: 9px;
        color: var(--text-muted);
        line-height: 1.3;
      }
    }

    .canvas-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background: radial-gradient(circle at center, rgba(138, 79, 255, 0.05) 0%, transparent 70%);
      
      canvas {
        display: block;
        width: 100%;
        height: 100%;
      }

      .bone-overlay {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: auto;
      }
    }
  }
}
</style>
