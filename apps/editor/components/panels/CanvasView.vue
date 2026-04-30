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
  Maximize as MaximizeIcon
} from 'lucide-vue-next';
import { useProjectStore } from '../../stores/project';
import { MorphaRenderer } from '@morpha/web-runtime';

const projectStore = useProjectStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
let renderer: MorphaRenderer | null = null;
let animationFrameId: number;

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
    animationFrameId = requestAnimationFrame(renderLoop);
  };
  renderLoop();
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
});

// Drag to move part
let isDragging = false;
let startX = 0;
let startY = 0;

const onMouseDown = (e: MouseEvent) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
};

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging || !canvasRef.value) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  startX = e.clientX;
  startY = e.clientY;
  
  // Convert screen pixels to WebGL coordinate space
  // This is a rough estimation for the mock
  const scaleX = 3.0 / canvasRef.value.clientWidth;
  const scaleY = -3.0 / canvasRef.value.clientHeight;
  
  if (projectStore.activePartId && projectStore.project) {
    const part = projectStore.project.rig.parts.find(p => p.id === projectStore.activePartId);
    if (part && part.transform) {
      part.transform.position[0] += dx * scaleX;
      part.transform.position[1] += dy * scaleY;
    }
  }
};

const onMouseUp = () => {
  isDragging = false;
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

      .canvas-info span {
        font-size: 11px;
        margin-right: 4px;
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
    }
  }
}
</style>
