<template>
  <div class="app-layout">
    <AppHeader />
    
    <div class="main-workspace">
      <PrimaryNav :active-nav="activeNav" @update:active-nav="activeNav = $event" />
      
      <!-- サイドバー: ナビゲーション選択に応じて切り替え -->
      <PartsPanel v-if="activeNav === 'parts'" />
      <BonesPanel v-else-if="activeNav === 'deformer'" />
      
      <div class="center-column">
        <CanvasView />
        <TimelinePanel />
      </div>

      <div class="right-column">
        <ParametersPanel />
        <PreviewPanel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useProjectStore } from './stores/project';
import { useHistoryStore } from './stores/history';

import AppHeader from './components/layout/AppHeader.vue';
import PrimaryNav from './components/layout/PrimaryNav.vue';
import PartsPanel from './components/panels/PartsPanel.vue';
import BonesPanel from './components/panels/BonesPanel.vue';
import CanvasView from './components/panels/CanvasView.vue';
import TimelinePanel from './components/panels/TimelinePanel.vue';
import ParametersPanel from './components/panels/ParametersPanel.vue';
import PreviewPanel from './components/panels/PreviewPanel.vue';

const projectStore = useProjectStore();
const historyStore = useHistoryStore();

const activeNav = ref<string>('parts');

onMounted(() => {
  projectStore.initMockProject();
});

// グローバル Undo/Redo ショートカット
const handleGlobalKeydown = (e: KeyboardEvent) => {
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      historyStore.redo();
    } else {
      historyStore.undo();
    }
  } else if (ctrl && e.key === 'y') {
    e.preventDefault();
    historyStore.redo();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<style scoped lang="scss">
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;

  .main-workspace {
    flex: 1;
    display: flex;
    overflow: hidden;

    .center-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0; // Prevent flex item from overflowing
    }

    .right-column {
      display: flex;
      flex-direction: column;
      width: 320px;
      flex-shrink: 0;
    }
  }
}
</style>
