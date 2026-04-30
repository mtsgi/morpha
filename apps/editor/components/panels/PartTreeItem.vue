<template>
  <div>
    <div 
      class="tree-item" 
      :class="{ 
        'active': projectStore.activePartId === part.id,
        'level-1': level === 1,
        'level-2': level === 2,
        'expanded': expanded
      }"
      @click="projectStore.setActivePart(part.id)"
    >
      <div v-if="hasChildren" @click.stop="expanded = !expanded" class="expander-wrapper">
        <ChevronDownIcon v-if="expanded" class="expander icon" :size="14" />
        <ChevronRightIcon v-else class="expander icon" :size="14" />
      </div>
      <div v-else class="expander-wrapper">
        <ChevronRightIcon class="expander icon invisible" :size="14" />
      </div>
      
      <span class="name">{{ part.name }}</span>
      
      <div class="actions">
        <div @click.stop="projectStore.toggleVisibility(part.id)">
          <EyeIcon v-if="part.visible" class="icon" :size="14" />
          <EyeOffIcon v-else class="icon" :size="14" style="opacity: 0.5" />
        </div>
        <div @click.stop="projectStore.toggleLock(part.id)">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useProjectStore } from '../../stores/project';
import { 
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon
} from 'lucide-vue-next';

const props = defineProps<{
  part: any;
  level: number;
}>();

const projectStore = useProjectStore();
const expanded = ref(true);

const hasChildren = computed(() => props.part.children && props.part.children.length > 0);
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
    .actions { opacity: 1; }
  }

  &.active {
    background-color: rgba(138, 79, 255, 0.15);
    color: var(--brand-purple-hover);
    .actions { opacity: 1; }
  }

  &.level-1 { padding-left: 16px; }
  &.level-2 { padding-left: 32px; }
  &.level-3 { padding-left: 48px; }
}
</style>
