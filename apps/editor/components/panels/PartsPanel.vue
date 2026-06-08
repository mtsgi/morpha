<template>
  <div class="parts-panel">
    <div class="panel-header">
      <span class="title">パーツ</span>
    </div>
    
    <div class="panel-search">
      <div class="search-box">
        <SearchIcon class="icon" :size="14" />
        <input type="text" placeholder="パーツを検索" />
      </div>
    </div>

    <div class="tree-view">
      <PartTreeItem 
        v-for="part in projectStore.partsTree" 
        :key="part.id" 
        :part="part" 
        :level="0" 
      />
    </div>

    <div class="panel-footer">
      <FolderPlusIcon class="icon" :size="16" @click="handleCreateGroup" title="新しいグループフォルダを追加" />
      <FilePlusIcon class="icon" :size="16" @click="triggerFileInput" title="画像をインポート" />
      <input type="file" ref="fileInput" accept="image/*" style="display: none;" @change="handleFileImport" />
      <CopyIcon class="icon" :size="16" @click="handleDuplicateActive" title="選択中のパーツを複製" :style="{ opacity: projectStore.activePartId ? 1 : 0.4, cursor: projectStore.activePartId ? 'pointer' : 'not-allowed' }" />
      <TrashIcon class="icon" :size="16" @click="handleRemoveActive" title="選択中のパーツを削除" :style="{ opacity: projectStore.activePartId && projectStore.activePartId !== 'root' ? 1 : 0.4, cursor: projectStore.activePartId && projectStore.activePartId !== 'root' ? 'pointer' : 'not-allowed' }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { 
  Search as SearchIcon,
  FolderPlus as FolderPlusIcon,
  FilePlus as FilePlusIcon,
  Copy as CopyIcon,
  Trash as TrashIcon
} from 'lucide-vue-next';
import PartTreeItem from './PartTreeItem.vue';
import { useProjectStore } from '../../stores/project';

const projectStore = useProjectStore();
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileImport = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    await projectStore.importImage(file);
    // 選択をリセット
    target.value = '';
  }
};

const handleCreateGroup = () => {
  const name = prompt('グループ名を入力してください', '新規グループ');
  if (name) {
    const activeId = projectStore.activePartId;
    projectStore.groupParts(activeId ? [activeId] : [], name);
  }
};

const handleDuplicateActive = () => {
  if (projectStore.activePartId) {
    projectStore.duplicatePart(projectStore.activePartId);
  }
};

const handleRemoveActive = () => {
  if (projectStore.activePartId) {
    if (projectStore.activePartId === 'root') {
      alert('ルートフォルダは削除できません。');
      return;
    }
    const part = projectStore.project?.rig.parts.find(p => p.id === projectStore.activePartId);
    if (part && confirm(`本当にパーツ「${part.name}」を削除しますか？`)) {
      projectStore.removePart(projectStore.activePartId);
    }
  }
};
</script>

<style scoped lang="scss">
.parts-panel {
  width: 240px;
  background-color: var(--bg-panel);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100%;

  .panel-header {
    height: 40px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    border-bottom: 1px solid var(--border-color);

    .title {
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .panel-search {
    padding: 12px;
    
    .search-box {
      display: flex;
      align-items: center;
      background-color: var(--bg-base);
      border-radius: 4px;
      padding: 6px 8px;
      gap: 8px;

      .icon {
        color: var(--text-muted);
      }

      input {
        background: transparent;
        border: none;
        color: var(--text-primary);
        outline: none;
        width: 100%;
        font-size: 12px;

        &::placeholder {
          color: var(--text-muted);
        }
      }
    }
  }

  .tree-view {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px;

    .tree-item {
      display: flex;
      align-items: center;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      color: var(--text-secondary);
      transition: background-color 0.1s;

      .expander {
        margin-right: 4px;
        opacity: 0.6;
      }

      .name {
        flex: 1;
        font-size: 12px;
      }

      .actions {
        display: flex;
        gap: 8px;
        opacity: 0.5;

        .icon {
          cursor: pointer;
          &:hover { color: var(--text-active); }
        }
      }

      &:hover {
        background-color: var(--bg-hover);
        color: var(--text-primary);
        .actions { opacity: 1; }
      }

      &.active {
        background-color: rgba(138, 79, 255, 0.15);
        color: var(--brand-purple-hover);
        .actions { opacity: 1; }
      }

      &.level-1 { padding-left: 16px; }
      &.level-2 { padding-left: 32px; }
    }
  }

  .panel-footer {
    height: 40px;
    border-top: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 16px;
    gap: 16px;
    color: var(--text-secondary);

    .icon {
      cursor: pointer;
      &:hover { color: var(--text-primary); }
    }
  }
}
</style>
