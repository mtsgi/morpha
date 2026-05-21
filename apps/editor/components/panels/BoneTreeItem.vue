<template>
  <div>
    <div 
      class="tree-item" 
      :class="{ 
        'active': bonesStore.activeBoneId === bone.id,
        'level-1': level === 1,
        'level-2': level === 2,
        'level-3': level >= 3,
        'expanded': expanded
      }"
      @click="bonesStore.setActiveBone(bone.id)"
    >
      <div v-if="hasChildren" @click.stop="expanded = !expanded" class="expander-wrapper">
        <ChevronDownIcon v-if="expanded" class="expander icon" :size="14" />
        <ChevronRightIcon v-else class="expander icon" :size="14" />
      </div>
      <div v-else class="expander-wrapper">
        <ChevronRightIcon class="expander icon invisible" :size="14" />
      </div>
      
      <BoneIcon class="bone-icon" :size="14" />
      <span class="name">{{ bone.name }}</span>
      
      <div class="actions">
        <div @click.stop="bonesStore.removeBone(bone.id)" title="ボーンを削除">
          <TrashIcon class="icon" :size="14" />
        </div>
      </div>
    </div>
    
    <div v-if="hasChildren && expanded" class="children-container">
      <BoneTreeItem 
        v-for="child in bone.children" 
        :key="child.id" 
        :bone="child" 
        :level="level + 1" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBonesStore } from '../../stores/bones';
import { 
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  Bone as BoneIcon,
  Trash as TrashIcon
} from 'lucide-vue-next';

const props = defineProps<{
  bone: any;
  level: number;
}>();

const bonesStore = useBonesStore();
const expanded = ref(true);

const hasChildren = computed(() => props.bone.children && props.bone.children.length > 0);
</script>

<style scoped lang="scss">
.tree-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: background-color 0.1s;
  gap: 4px;

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

  .bone-icon {
    color: var(--brand-cyan);
    opacity: 0.7;
    flex-shrink: 0;
  }

  .name {
    flex: 1;
    font-size: 12px;
    user-select: none;
  }

  .actions {
    display: flex;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.15s;

    .icon {
      cursor: pointer;
      &:hover { color: #ff6b6b; }
    }
  }

  &:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
    .actions { opacity: 1; }
  }

  &.active {
    background-color: rgba(0, 210, 255, 0.12);
    color: var(--brand-cyan);
    .bone-icon { opacity: 1; }
    .actions { opacity: 1; }
  }

  &.level-1 { padding-left: 16px; }
  &.level-2 { padding-left: 32px; }
  &.level-3 { padding-left: 48px; }
}
</style>
