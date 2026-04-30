<template>
  <div class="preview-panel">
    <div class="panel-header">
      <div class="tabs">
        <div class="tab active">デフォーマ</div>
        <div class="tab">ツール詳細</div>
        <div class="tab">プレビュー</div>
      </div>
    </div>

    <div class="preview-content">
      <div class="deformer-tree">
        <div class="tree-item expanded">
          <ChevronDownIcon class="icon expand" :size="14" />
          <span>Face Deformer</span>
        </div>
        <div class="tree-item expanded active level-1">
          <ChevronDownIcon class="icon expand" :size="14" />
          <span>Eye Deformer</span>
        </div>
        <div class="tree-item level-2">
          <div class="dot"></div>
          <span>Eyeball</span>
        </div>
        <div class="tree-item level-2">
          <div class="dot"></div>
          <span>Upper Lid</span>
        </div>
        <div class="tree-item level-2">
          <div class="dot"></div>
          <span>Lower Lid</span>
        </div>
        <div class="tree-item level-2">
          <div class="dot"></div>
          <span>Smile</span>
        </div>
        <div class="tree-item level-1">
          <ChevronRightIcon class="icon expand" :size="14" />
          <span>Brow Deformer</span>
        </div>
        <div class="tree-item level-1">
          <ChevronRightIcon class="icon expand" :size="14" />
          <span>Mouth Deformer</span>
        </div>
        
        <div class="tree-item expanded mt-2">
          <ChevronDownIcon class="icon expand" :size="14" />
          <span>Hair Deformer</span>
        </div>
        <div class="tree-item level-1">
          <ChevronRightIcon class="icon expand" :size="14" />
          <span>Front Hair</span>
        </div>
        
        <div class="tree-item mt-2">
          <ChevronRightIcon class="icon expand" :size="14" />
          <span>Body Deformer</span>
        </div>
      </div>

      <div class="mesh-preview">
        <div class="preview-tools">
          <MousePointer2Icon class="icon active" :size="14" />
          <div class="divider"></div>
          <GridIcon class="icon" :size="14" />
          <MaximizeIcon class="icon" :size="14" />
          <NetworkIcon class="icon" :size="14" />
          <div class="divider"></div>
          <SettingsIcon class="icon" :size="14" />
        </div>
        <div class="preview-canvas">
          <!-- Mock Eye Mesh -->
          <div class="mock-eye-mesh">
            <div class="mesh-lines"></div>
            <div class="mesh-dots"></div>
          </div>
          <div class="mesh-stats">
            <span>頂点数: 128</span>
            <span>三角形: 200</span>
            <span>描画: ON <ChevronDownIcon :size="10" style="display:inline" /></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  MousePointer2 as MousePointer2Icon,
  Grid as GridIcon,
  Maximize as MaximizeIcon,
  Network as NetworkIcon,
  Settings as SettingsIcon
} from 'lucide-vue-next';
</script>

<style scoped lang="scss">
.preview-panel {
  height: 260px;
  background-color: var(--bg-panel);
  border-top: 1px solid var(--border-color);
  border-left: 1px solid var(--border-color);
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
          color: var(--brand-cyan);
          border-top: 2px solid var(--brand-cyan);
        }
      }
    }
  }

  .preview-content {
    flex: 1;
    display: flex;
    overflow: hidden;

    .deformer-tree {
      width: 160px;
      border-right: 1px solid var(--border-color);
      padding: 8px;
      overflow-y: auto;

      .tree-item {
        display: flex;
        align-items: center;
        padding: 4px;
        color: var(--text-secondary);
        font-size: 11px;
        border-radius: 4px;
        cursor: pointer;

        &:hover { background-color: var(--bg-hover); color: var(--text-primary); }
        
        &.active {
          background-color: rgba(138, 79, 255, 0.15);
          color: var(--brand-purple-hover);
        }

        .expand {
          margin-right: 4px;
          opacity: 0.6;
        }

        .dot {
          width: 4px;
          height: 4px;
          background-color: var(--text-muted);
          border-radius: 50%;
          margin: 0 8px 0 4px;
        }

        &.level-1 { padding-left: 16px; }
        &.level-2 { padding-left: 28px; }
        &.mt-2 { margin-top: 8px; }
      }
    }

    .mesh-preview {
      flex: 1;
      display: flex;
      flex-direction: row;

      .preview-tools {
        width: 32px;
        border-right: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px 0;
        gap: 12px;
        background-color: var(--bg-base);

        .divider {
          width: 16px;
          height: 1px;
          background-color: var(--border-color);
        }

        .icon {
          color: var(--text-secondary);
          cursor: pointer;
          &:hover { color: var(--text-primary); }
          &.active { color: var(--brand-cyan); }
        }
      }

      .preview-canvas {
        flex: 1;
        background-color: #1a1a24;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;

        .mock-eye-mesh {
          width: 120px;
          height: 80px;
          border: 1px dashed rgba(0, 210, 255, 0.3);
          border-radius: 50%;
          position: relative;
          background: radial-gradient(circle at center, rgba(138, 79, 255, 0.1), transparent);

          &::before {
            content: '';
            position: absolute;
            inset: 10px;
            border: 1px solid var(--brand-purple);
            border-radius: 50%;
          }

          &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40px;
            height: 40px;
            background: rgba(0, 210, 255, 0.2);
            border: 1px solid var(--brand-cyan);
            border-radius: 50%;
            transform: translate(-50%, -50%);
          }
        }

        .mesh-stats {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 24px;
          background-color: rgba(24, 24, 31, 0.8);
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          padding: 0 12px;
          gap: 16px;
          font-size: 10px;
          color: var(--text-muted);

          span:last-child {
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }
    }
  }
}
</style>
