<template>
  <div class="file-menu-wrapper" ref="wrapperRef">
    <div class="file-menu-trigger" @click="toggleMenu">
      <FileIcon class="icon" :size="14" />
      <span>{{ projectName }}</span>
      <span v-if="projectStore.isDirty" class="dirty-indicator">●</span>
      <ChevronDownIcon class="icon chevron" :size="14" />
    </div>

    <Transition name="menu-fade">
      <div v-if="isOpen" class="file-menu-dropdown">
        <button class="menu-item" @click="handleNew">
          <FilePlusIcon class="icon" :size="14" />
          <span>新規プロジェクト</span>
          <span class="shortcut">Ctrl+N</span>
        </button>
        <button class="menu-item" @click="handleOpen">
          <FolderOpenIcon class="icon" :size="14" />
          <span>ファイルを開く</span>
          <span class="shortcut">Ctrl+O</span>
        </button>
        <div class="menu-divider"></div>
        <button class="menu-item" @click="handleSave">
          <SaveIcon class="icon" :size="14" />
          <span>保存</span>
          <span class="shortcut">Ctrl+S</span>
        </button>
        <button class="menu-item" @click="handleSaveAs">
          <SaveIcon class="icon" :size="14" />
          <span>名前をつけて保存</span>
          <span class="shortcut">Ctrl+Shift+S</span>
        </button>
        <div class="menu-divider"></div>
        <button class="menu-item disabled" disabled>
          <UploadIcon class="icon" :size="14" />
          <span>エクスポート</span>
        </button>
      </div>
    </Transition>

    <input type="file" ref="fileInput" accept=".morpha_proj,.json" style="display: none;" @change="handleFileSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  File as FileIcon,
  ChevronDown as ChevronDownIcon,
  FilePlus as FilePlusIcon,
  FolderOpen as FolderOpenIcon,
  Save as SaveIcon,
  Upload as UploadIcon
} from 'lucide-vue-next';
import { useProjectStore } from '../../stores/project';

const projectStore = useProjectStore();

const isOpen = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const projectName = computed(() => {
  return projectStore.project?.meta.name || 'Untitled Project';
});

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

const closeMenu = () => {
  isOpen.value = false;
};

const handleNew = () => {
  if (projectStore.isDirty) {
    if (!confirm('未保存の変更があります。破棄して新規プロジェクトを作成しますか？')) {
      closeMenu();
      return;
    }
  }
  projectStore.newProject();
  closeMenu();
};

const handleOpen = () => {
  if (projectStore.isDirty) {
    if (!confirm('未保存の変更があります。破棄してファイルを開きますか？')) {
      closeMenu();
      return;
    }
  }
  fileInput.value?.click();
  closeMenu();
};

const handleSave = () => {
  projectStore.saveProject();
  closeMenu();
};

const handleSaveAs = () => {
  // 名前をつけて保存: 常にダウンロードダイアログ
  projectStore.saveProject();
  closeMenu();
};

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    try {
      await projectStore.loadProject(file);
    } catch (e: any) {
      alert(`ファイルの読み込みに失敗しました:\n${e.message}`);
    }
    target.value = '';
  }
};

// グローバルキーボードショートカット
const handleKeydown = (e: KeyboardEvent) => {
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key === 's') {
    e.preventDefault();
    if (e.shiftKey) {
      handleSaveAs();
    } else {
      handleSave();
    }
  } else if (ctrl && e.key === 'o') {
    e.preventDefault();
    handleOpen();
  } else if (ctrl && e.key === 'n') {
    e.preventDefault();
    handleNew();
  }
};

// メニュー外クリックで閉じる
const handleClickOutside = (e: MouseEvent) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    closeMenu();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped lang="scss">
.file-menu-wrapper {
  position: relative;
}

.file-menu-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }

  .dirty-indicator {
    color: var(--brand-cyan);
    font-size: 10px;
    margin-left: -2px;
  }

  .chevron {
    opacity: 0.6;
  }
}

.file-menu-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 260px;
  background-color: rgba(24, 24, 31, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 6px;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2);

  .menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 12px;
    border-radius: 4px;
    color: var(--text-secondary);
    font-size: 12px;
    transition: all 0.1s;

    .icon {
      opacity: 0.7;
      flex-shrink: 0;
    }

    span:first-of-type {
      flex: 1;
    }

    .shortcut {
      font-size: 10px;
      color: var(--text-muted);
      font-family: monospace;
    }

    &:hover:not(.disabled) {
      background-color: rgba(138, 79, 255, 0.15);
      color: var(--text-primary);

      .icon { opacity: 1; }
      .shortcut { color: var(--text-secondary); }
    }

    &.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  .menu-divider {
    height: 1px;
    background-color: var(--border-color);
    margin: 4px 8px;
  }
}

// メニューのトランジション
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
