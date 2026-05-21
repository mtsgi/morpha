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
        <button class="tool-btn">
          <MousePointer2Icon class="icon" :size="16" />
          <span>選択</span>
        </button>
        <button class="tool-btn">
          <MoveIcon class="icon" :size="16" />
          <span>移動</span>
        </button>
        <button class="tool-btn">
          <RotateCwIcon class="icon" :size="16" />
          <span>回転</span>
        </button>
        <button class="tool-btn">
          <ScalingIcon class="icon" :size="16" />
          <span>拡縮</span>
        </button>
        <button class="tool-btn active">
          <NetworkIcon class="icon" :size="16" />
          <span>メッシュ変形</span>
        </button>
        <button class="tool-btn">
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
        ></canvas>
      </div>

      <!-- Floating Zoom Controls Bottom -->
      <div class="floating-zoom">
        <HandIcon class="icon" :size="16" />
        <div class="divider"></div>
        <button><MinusIcon :size="14" /></button>
        <span>72%</span>
        <button><PlusIcon :size="14" /></button>
        <div class="divider"></div>
        <MaximizeIcon class="icon" :size="16" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
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
import { MorphaRenderer } from '@morpha/web-runtime';

const projectStore = useProjectStore();
const bonesStore = useBonesStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const boneCanvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
let renderer: MorphaRenderer | null = null;
let animationFrameId: number;

const showBones = ref(true);

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

  // Animation loop
  const renderLoop = () => {
    if (renderer) {
      // Sync assets and parts from the store
      renderer.syncProject(projectStore.project);
      
      // Update params from store
      renderer.updateParameters(projectStore.currentParameters);
      renderer.render();
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

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
});

/**
 * ボーンをCanvas 2Dオーバーレイとして描画
 */
function drawBoneOverlay() {
  const canvas = boneCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const bones = bonesStore.bones;
  if (bones.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h) * 0.75; // WebGL の 1.5 スケールに合わせる

  for (const bone of bones) {
    const isActive = bonesStore.activeBoneId === bone.id;
    
    // ボーン位置をスクリーン座標に変換
    const sx = cx + bone.position[0] * scale;
    const sy = cy - bone.position[1] * scale; // Y軸反転

    // ボーン先端位置を計算
    const endX = sx + Math.sin(bone.rotation) * bone.length * scale;
    const endY = sy - Math.cos(bone.rotation) * bone.length * scale;

    // ボーンの「棒」を描画（台形スタイル）
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

    // 関節点（ジョイント）を描画
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, isActive ? 5 : 4, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? '#00d2ff' : '#8a4fff';
    ctx.fill();
    ctx.strokeStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.stroke();
    ctx.restore();

    // 先端点を描画
    ctx.save();
    ctx.beginPath();
    ctx.arc(endX, endY, isActive ? 3 : 2, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? '#00d2ff' : 'rgba(138, 79, 255, 0.8)';
    ctx.fill();
    ctx.restore();

    // ボーン名ラベル (選択中のみ)
    if (isActive) {
      ctx.save();
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#00d2ff';
      ctx.textAlign = 'left';
      ctx.fillText(bone.name, sx + 10, sy - 8);
      ctx.restore();
    }
  }

  // 親子ボーン接続線を描画
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

/**
 * ボーンのヒットテスト
 */
function hitTestBone(screenX: number, screenY: number): string | null {
  const canvas = boneCanvasRef.value;
  if (!canvas) return null;

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h) * 0.75;

  const bones = bonesStore.bones;
  const hitRadius = 10;

  // 逆順でチェック（前面のボーンを優先）
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

// Drag to move part or bone
let isDragging = false;
let dragTarget: 'part' | 'bone' | null = null;
let startX = 0;
let startY = 0;

const onMouseDown = (e: MouseEvent) => {
  if (!boneCanvasRef.value) return;
  const rect = boneCanvasRef.value.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // まずボーンのヒットテスト
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

  // パーツのドラッグ
  isDragging = true;
  dragTarget = 'part';
  startX = e.clientX;
  startY = e.clientY;
};

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging || !boneCanvasRef.value) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  startX = e.clientX;
  startY = e.clientY;

  const canvas = boneCanvasRef.value;
  const scale = Math.min(canvas.width, canvas.height) * 0.75;
  
  if (dragTarget === 'bone' && bonesStore.activeBoneId) {
    const bone = bonesStore.activeBone;
    if (bone) {
      bonesStore.updateBone(bone.id, {
        position: [
          bone.position[0] + dx / scale,
          bone.position[1] - dy / scale, // Y軸反転
        ],
      });
    }
  } else if (dragTarget === 'part') {
    // パーツのドラッグ（既存ロジック）
    const scaleX = 3.0 / canvas.clientWidth;
    const scaleY = -3.0 / canvas.clientHeight;
    
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
