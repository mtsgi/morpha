<template>
  <div
    class="tree-node-wrapper"
    :class="{
      'drag-before': dragOverPos === 'before',
      'drag-after': dragOverPos === 'after'
    }"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.stop="onDrop"
  >
    <div 
      class="tree-item" 
      :class="{ 
        'active': projectStore.activePartId === part.id,
        'expanded': expanded
      }"
      :style="{ paddingLeft: `${level * 16 + 8}px` }"
      @click="projectStore.setActivePart(part.id)"
      @contextmenu.prevent="openContextMenu"
      :draggable="part.id !== 'root'"
      @dragstart.stop="onDragStart"
      @dragend="onDragEnd"
    >
      <!-- ドラッグハンドル -->
      <div v-if="part.id !== 'root'" class="drag-handle">
        <GripIcon :size="12" class="icon" />
      </div>
      <div v-else class="drag-handle-spacer"></div>

      <div v-if="hasChildren" @click.stop="expanded = !expanded" class="expander-wrapper">
        <ChevronDownIcon v-if="expanded" class="expander icon" :size="14" />
        <ChevronRightIcon v-else class="expander icon" :size="14" />
      </div>
      <div v-else class="expander-wrapper">
        <ChevronRightIcon class="expander icon invisible" :size="14" />
      </div>
      
      <!-- フォルダアイコンまたはメッシュアイコン -->
      <FolderIcon v-if="part.type === 'folder'" :size="14" class="part-type-icon folder" />
      <ImageIcon v-else :size="14" class="part-type-icon mesh" />

      <span class="name">{{ part.name }}</span>
      
      <div class="actions">
        <div @click.stop="projectStore.toggleVisibility(part.id)" title="表示/非表示">
          <EyeIcon v-if="part.visible" class="icon" :size="14" />
          <EyeOffIcon v-else class="icon" :size="14" style="opacity: 0.5" />
        </div>
        <div @click.stop="projectStore.toggleLock(part.id)" title="ロック/アンロック">
          <LockIcon v-if="part.locked" class="icon" :size="14" />
          <UnlockIcon v-else class="icon" :size="14" />
        </div>
      </div>
    </div>
    
    <div v-if="hasChildren && expanded" class="children-container">
      <PartTreeItem 
        v-for="child in part.children" 
        :key="child.id" 
        :part="child" 
        :level="level + 1" 
      />
    </div>

    <!-- コンテキストメニュー -->
    <Teleport to="body">
      <div
        v-if="menuVisible"
        class="context-menu"
        :style="{ left: menuX + 'px', top: menuY + 'px' }"
        @click.stop
        v-click-outside="closeContextMenu"
      >
        <button @click="handleDuplicate">複製</button>
        <button @click="handleGroup">グループ化</button>
        <div class="menu-divider"></div>
        <button class="danger" @click="handleRemove">削除</button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useProjectStore } from '../../stores/project';
import { useEditorStore } from '../../stores/editor';
import { 
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  GripVertical as GripIcon,
  Folder as FolderIcon,
  Image as ImageIcon
} from 'lucide-vue-next';

const props = defineProps<{
  part: any;
  level: number;
}>();

const projectStore = useProjectStore();
const editorStore = useEditorStore();
const expanded = ref(true);

const hasChildren = computed(() => props.part.children && props.part.children.length > 0);

// ドラッグ＆ドロップ状態
const dragOverPos = ref<'before' | 'after' | null>(null);

function onDragStart(e: DragEvent) {
  if (props.part.id === 'root') {
    e.preventDefault();
    return;
  }
  editorStore.draggedPartId = props.part.id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', props.part.id);
  }
}

function onDragOver(e: DragEvent) {
  if (!editorStore.draggedPartId || editorStore.draggedPartId === props.part.id) return;
  
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const relativeY = e.clientY - rect.top;
  if (relativeY < rect.height / 2) {
    dragOverPos.value = 'before';
  } else {
    dragOverPos.value = 'after';
  }
}

function onDragLeave() {
  dragOverPos.value = null;
}

function onDrop() {
  const draggedId = editorStore.draggedPartId;
  const targetId = props.part.id;
  const position = dragOverPos.value;
  
  if (draggedId && targetId && position && draggedId !== targetId) {
    projectStore.reorderPart(draggedId, targetId, position);
  }
  dragOverPos.value = null;
  editorStore.draggedPartId = null;
}

function onDragEnd() {
  editorStore.draggedPartId = null;
  dragOverPos.value = null;
}

// コンテキストメニュー状態
const menuVisible = ref(false);
const menuX = ref(0);
const menuY = ref(0);

function openContextMenu(e: MouseEvent) {
  menuX.value = e.clientX;
  menuY.value = e.clientY;
  menuVisible.value = true;
}

function closeContextMenu() {
  menuVisible.value = false;
}

function handleDuplicate() {
  projectStore.duplicatePart(props.part.id);
  closeContextMenu();
}

function handleGroup() {
  const groupName = prompt('グループ名を入力してください', '新規グループ');
  if (groupName) {
    projectStore.groupParts([props.part.id], groupName);
  }
  closeContextMenu();
}

function handleRemove() {
  if (props.part.id === 'root') {
    alert('ルートフォルダは削除できません。');
    return;
  }
  if (confirm(`本当にパーツ「${props.part.name}」を削除しますか？`)) {
    projectStore.removePart(props.part.id);
  }
  closeContextMenu();
}
</script>

<style scoped lang="scss">
.tree-node-wrapper {
  position: relative;
  transition: all 0.15s ease;

  &.drag-before {
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background-color: var(--brand-purple);
      z-index: 10;
    }
  }

  &.drag-after {
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background-color: var(--brand-purple);
      z-index: 10;
    }
  }
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 100%;
  cursor: grab;
  opacity: 0;
  transition: opacity 0.15s;
  color: var(--text-muted);
  margin-right: 2px;

  &:active {
    cursor: grabbing;
  }
}

.drag-handle-spacer {
  width: 16px;
}

.part-type-icon {
  margin-right: 6px;
  flex-shrink: 0;

  &.folder {
    color: #e0a96d;
  }
  &.mesh {
    color: var(--brand-purple);
  }
}

.tree-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: background-color 0.1s;

  .expander-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    
    .expander {
      opacity: 0.6;
      
      &.invisible {
        opacity: 0;
        pointer-events: none;
      }
    }
  }

  .name {
    flex: 1;
    font-size: 12px;
    user-select: none;
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
    
    .drag-handle {
      opacity: 0.5;
    }
    
    .actions { opacity: 1; }
  }

  &.active {
    background-color: rgba(138, 79, 255, 0.15);
    color: var(--brand-purple-hover);
    
    .drag-handle {
      opacity: 0.5;
    }
    
    .actions { opacity: 1; }
  }
}

.context-menu {
  position: fixed;
  background-color: var(--bg-panel-light);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 4px 0;
  min-width: 120px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  display: flex;
  flex-direction: column;

  button {
    background: none;
    border: none;
    padding: 6px 12px;
    text-align: left;
    color: var(--text-secondary);
    font-size: 11px;
    cursor: pointer;
    width: 100%;
    transition: background-color 0.1s, color 0.1s;

    &:hover {
      background-color: var(--bg-hover);
      color: var(--text-primary);
    }

    &.danger {
      color: #ff4d4f;
      &:hover {
        background-color: rgba(255, 77, 79, 0.1);
      }
    }
  }

  .menu-divider {
    height: 1px;
    background-color: var(--border-color);
    margin: 4px 0;
  }
}
</style>
