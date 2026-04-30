<template>
  <div class="app-layout">
    <AppHeader />
    
    <div class="main-workspace">
      <PrimaryNav />
      <PartsPanel />
      
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
import { onMounted } from 'vue';
import { useProjectStore } from './stores/project';

import AppHeader from './components/layout/AppHeader.vue';
import PrimaryNav from './components/layout/PrimaryNav.vue';
import PartsPanel from './components/panels/PartsPanel.vue';
import CanvasView from './components/panels/CanvasView.vue';
import TimelinePanel from './components/panels/TimelinePanel.vue';
import ParametersPanel from './components/panels/ParametersPanel.vue';
import PreviewPanel from './components/panels/PreviewPanel.vue';

const projectStore = useProjectStore();

onMounted(() => {
  projectStore.initMockProject();
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
