<template>
  <div class="bones-panel">
    <div class="panel-header">
      <span class="title">ボーン</span>
    </div>
    
    <div class="panel-search">
      <div class="search-box">
        <SearchIcon class="icon" :size="14" />
        <input type="text" placeholder="ボーンを検索" v-model="searchQuery" />
      </div>
    </div>

    <div class="tree-view">
      <div v-if="filteredBonesTree.length === 0" class="empty-state">
        <BoneIcon class="empty-icon" :size="32" />
        <span>ボーンがありません</span>
        <span class="hint">下の「+」ボタンで追加できます</span>
      </div>
      <BoneTreeItem 
        v-for="bone in filteredBonesTree" 
        :key="bone.id" 
        :bone="bone" 
        :level="0" 
      />
    </div>

    <div class="panel-footer">
      <div class="footer-left">
        <button class="icon-btn" @click="handleAddBone" title="ルートボーンを追加">
          <PlusIcon :size="16" />
        </button>
        <button class="icon-btn" @click="handleAddChildBone" :disabled="!bonesStore.activeBoneId" title="子ボーンを追加">
          <GitBranchPlusIcon :size="16" />
        </button>
        <button class="icon-btn" @click="handleDeleteBone" :disabled="!bonesStore.activeBoneId" title="選択中のボーンを削除">
          <TrashIcon :size="16" />
        </button>
      </div>
      <div class="footer-right">
        <span v-if="bonesStore.bones.length > 0" class="bone-count">{{ bonesStore.bones.length }} bones</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  Search as SearchIcon,
  Plus as PlusIcon,
  GitBranchPlus as GitBranchPlusIcon,
  Trash as TrashIcon,
  Bone as BoneIcon
} from 'lucide-vue-next';
import BoneTreeItem from './BoneTreeItem.vue';
import { useBonesStore } from '../../stores/bones';

const bonesStore = useBonesStore();
const searchQuery = ref('');

const filteredBonesTree = computed(() => {
  if (!searchQuery.value.trim()) return bonesStore.bonesTree;
  
  const query = searchQuery.value.toLowerCase();
  const filterTree = (nodes: any[]): any[] => {
    return nodes
      .map(node => {
        const children = filterTree(node.children || []);
        if (node.name.toLowerCase().includes(query) || children.length > 0) {
          return { ...node, children };
        }
        return null;
      })
      .filter(Boolean);
  };
  return filterTree(bonesStore.bonesTree);
});

const handleAddBone = () => {
  bonesStore.addBone(null, [0, 0]);
};

const handleAddChildBone = () => {
  if (!bonesStore.activeBoneId) return;
  const parent = bonesStore.activeBone;
  if (!parent) return;
  
  // 子ボーンを親ボーンの先端付近に配置
  const offsetX = Math.sin(parent.rotation) * parent.length;
  const offsetY = -Math.cos(parent.rotation) * parent.length;
  bonesStore.addBone(
    bonesStore.activeBoneId,
    [parent.position[0] + offsetX, parent.position[1] + offsetY]
  );
};

const handleDeleteBone = () => {
  if (!bonesStore.activeBoneId) return;
  bonesStore.removeBone(bonesStore.activeBoneId);
};
</script>

<style scoped lang="scss">
.bones-panel {
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

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      gap: 8px;
      color: var(--text-muted);

      .empty-icon {
        opacity: 0.3;
        margin-bottom: 4px;
      }

      span {
        font-size: 12px;
      }

      .hint {
        font-size: 10px;
        opacity: 0.6;
      }
    }
  }

  .panel-footer {
    height: 40px;
    border-top: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;

    .footer-left {
      display: flex;
      gap: 4px;
    }

    .footer-right {
      .bone-count {
        font-size: 10px;
        color: var(--text-muted);
      }
    }

    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 4px;
      color: var(--text-secondary);
      transition: all 0.15s;

      &:hover:not(:disabled) {
        color: var(--text-primary);
        background-color: var(--bg-hover);
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }
  }
}
</style>
