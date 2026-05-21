<template>
  <nav class="primary-nav">
    <div class="nav-top">
      <div class="nav-item" :class="{ active: activeNav === 'project' }" @click="$emit('update:activeNav', 'project')">
        <FolderIcon class="icon" :size="20" />
        <span>プロジェクト</span>
      </div>
      <div class="nav-item" :class="{ active: activeNav === 'parts' }" @click="$emit('update:activeNav', 'parts')">
        <PuzzleIcon class="icon" :size="20" />
        <span>パーツ</span>
      </div>
      <div class="nav-item" :class="{ active: activeNav === 'deformer' }" @click="$emit('update:activeNav', 'deformer')">
        <Share2Icon class="icon" :size="20" />
        <span>デフォーマ</span>
      </div>
      <div class="nav-item" :class="{ active: activeNav === 'params' }" @click="$emit('update:activeNav', 'params')">
        <SlidersHorizontalIcon class="icon" :size="20" />
        <span>パラメータ</span>
      </div>
      <div class="nav-item" :class="{ active: activeNav === 'motion' }" @click="$emit('update:activeNav', 'motion')">
        <ActivityIcon class="icon" :size="20" />
        <span>モーション</span>
      </div>
      <div class="nav-item" :class="{ active: activeNav === 'expression' }" @click="$emit('update:activeNav', 'expression')">
        <SmileIcon class="icon" :size="20" />
        <span>表情</span>
      </div>
      <div class="nav-item" :class="{ active: activeNav === 'physics' }" @click="$emit('update:activeNav', 'physics')">
        <WindIcon class="icon" :size="20" />
        <span>物理演算</span>
      </div>
      <div class="nav-item" :class="{ active: activeNav === 'event' }" @click="$emit('update:activeNav', 'event')">
        <ZapIcon class="icon" :size="20" />
        <span>イベント</span>
      </div>
    </div>
    
    <div class="nav-bottom">
      <div class="nav-item" @click="$emit('update:activeNav', 'settings')">
        <SettingsIcon class="icon" :size="20" />
        <span>設定</span>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { 
  Folder as FolderIcon,
  Puzzle as PuzzleIcon,
  Share2 as Share2Icon,
  SlidersHorizontal as SlidersHorizontalIcon,
  Activity as ActivityIcon,
  Smile as SmileIcon,
  Wind as WindIcon,
  Zap as ZapIcon,
  Settings as SettingsIcon
} from 'lucide-vue-next';

defineProps<{
  activeNav: string;
}>();

defineEmits<{
  'update:activeNav': [value: string];
}>();
</script>

<style scoped lang="scss">
.primary-nav {
  width: 64px;
  background-color: var(--bg-base);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px 0;
  user-select: none;

  .nav-top, .nav-bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 56px;
    padding: 8px 0;
    border-radius: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;

    span {
      font-size: 9px;
      transform: scale(0.9);
      text-align: center;
    }

    &:hover {
      color: var(--text-primary);
      background-color: var(--bg-hover);
    }

    &.active {
      color: var(--brand-purple);
      background-color: var(--bg-panel);
      
      .icon {
        color: var(--brand-purple);
      }
    }
  }
}
</style>
