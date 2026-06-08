<template>
  <header class="app-header">
    <div class="header-left">
      <div class="logo">
        <div class="logo-icon"></div>
        <span>Morpha Studio</span>
      </div>
      <FileMenu />
    </div>

    <div class="header-center">
      <div class="mode-switcher">
        <button :class="{ active: editorStore.currentMode === 'edit' }" @click="editorStore.setMode('edit')">Edit</button>
        <button :class="{ active: editorStore.currentMode === 'animate' }" @click="editorStore.setMode('animate')">Animate</button>
        <button :class="{ active: editorStore.currentMode === 'preview' }" @click="editorStore.setMode('preview')">Preview</button>
      </div>
    </div>

    <div class="header-right">
      <button class="export-btn" @click="showExport = true">
        <DownloadIcon :size="14" />
        <span>エクスポート</span>
      </button>
      <div class="playback-controls">
        <button @click="timelineStore.stop()" title="停止"><SquareIcon class="icon" :size="16" /></button>
        <button @click="timelineStore.isPlaying ? timelineStore.pause() : timelineStore.play()" :title="timelineStore.isPlaying ? '一時停止' : '再生'">
          <PauseIcon v-if="timelineStore.isPlaying" class="icon playing" :size="16" />
          <PlayIcon v-else class="icon" :size="16" />
        </button>
        <button @click="timelineStore.seekTo(timelineStore.duration)" title="末尾へ"><SkipForwardIcon class="icon" :size="16" /></button>
      </div>
      <div class="window-controls">
        <button><MaximizeIcon class="icon" :size="14" /></button>
        <div class="avatar">M</div>
      </div>
    </div>
  </header>

  <!-- Export Dialog -->
  <ExportDialog v-if="showExport" @close="showExport = false" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { 
  Play as PlayIcon,
  Pause as PauseIcon,
  Square as SquareIcon,
  SkipForward as SkipForwardIcon,
  Maximize as MaximizeIcon,
  Download as DownloadIcon
} from 'lucide-vue-next';
import FileMenu from './FileMenu.vue';
import ExportDialog from '../panels/ExportDialog.vue';
import { useEditorStore } from '../../stores/editor';
import { useTimelineStore } from '../../stores/timeline';

const editorStore = useEditorStore();
const timelineStore = useTimelineStore();
const showExport = ref(false);
</script>

<style scoped lang="scss">
.app-header {
  height: 48px;
  background-color: var(--bg-panel);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  user-select: none;

  .header-left, .header-center, .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .header-left {
    flex: 1;
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: var(--text-active);
      
      .logo-icon {
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, var(--brand-cyan), var(--brand-purple));
        border-radius: 6px;
      }
    }
  }

  .header-center {
    flex: 1;
    justify-content: center;

    .mode-switcher {
      display: flex;
      background-color: var(--bg-base);
      border-radius: 6px;
      padding: 2px;

      button {
        padding: 6px 16px;
        border-radius: 4px;
        color: var(--text-secondary);
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;

        &:hover {
          color: var(--text-primary);
        }

        &.active {
          background-color: var(--bg-panel-light);
          color: var(--brand-purple);
          border-bottom: 2px solid var(--brand-purple);
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }
      }
    }
  }

  .header-right {
    flex: 1;
    justify-content: flex-end;
    gap: 24px;

    .playback-controls {
      display: flex;
      gap: 8px;
      color: var(--text-secondary);
    }

    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--text-secondary);
      font-size: 12px;
      cursor: pointer;
    }

    .export-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      background: linear-gradient(135deg, rgba(138,79,255,0.2), rgba(0,210,255,0.1));
      border: 1px solid rgba(138,79,255,0.4);
      color: var(--brand-purple);
      transition: all 0.15s;

      &:hover {
        background: linear-gradient(135deg, rgba(138,79,255,0.35), rgba(0,210,255,0.2));
        border-color: var(--brand-purple);
      }
    }

    .window-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--text-secondary);

      .avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: var(--bg-active);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-primary);
        font-weight: 600;
        font-size: 12px;
      }
    }
  }

  .icon {
    opacity: 0.8;
  }
}
</style>
