<template>
  <div class="preview-panel">
    <div class="panel-header">
      <div class="tabs">
        <div class="tab" :class="{ active: activeTab === 'deformer' }" @click="activeTab = 'deformer'">デフォーマ</div>
        <div class="tab" :class="{ active: activeTab === 'inspector' }" @click="activeTab = 'inspector'">インスペクタ</div>
      </div>
    </div>

    <!-- デフォーマ (ボーン) ツリー -->
    <div v-if="activeTab === 'deformer'" class="deformer-content">
      <div v-if="bonesStore.bones.length === 0" class="empty-state">
        <BoneIcon :size="24" class="empty-icon" />
        <span>ボーンがありません</span>
      </div>

      <div v-else class="deformer-tree">
        <DeformerTreeNode
          v-for="bone in bonesStore.bonesTree"
          :key="bone.id"
          :bone="bone"
          :level="0"
          :active-id="bonesStore.activeBoneId"
          @select="bonesStore.activeBoneId = $event"
        />
      </div>

      <!-- 統計エリア -->
      <div class="stats-bar" v-if="projectStore.project">
        <div class="stat">
          <BoneIcon :size="11" />
          <span>{{ bonesStore.bones.length }} ボーン</span>
        </div>
        <div class="stat">
          <LayersIcon :size="11" />
          <span>{{ meshParts.length }} メッシュ</span>
        </div>
        <div class="stat">
          <SlidersIcon :size="11" />
          <span>{{ projectStore.project.parameters?.length ?? 0 }} パラメータ</span>
        </div>
      </div>
    </div>

    <!-- インスペクタ -->
    <div v-if="activeTab === 'inspector'" class="inspector-content">
      <div v-if="!bonesStore.activeBone && !projectStore.activePartId" class="empty-state">
        <MousePointerIcon :size="24" class="empty-icon" />
        <span>パーツまたはボーンを選択</span>
      </div>

      <!-- 選択中ボーンの詳細 -->
      <template v-if="bonesStore.activeBone">
        <div class="inspector-section">
          <div class="section-title">
            <BoneIcon :size="12" class="section-icon cyan" />
            ボーン — {{ bonesStore.activeBone.name }}
          </div>

          <div class="prop-row">
            <span class="prop-label">位置</span>
            <span class="prop-value">
              X: {{ bonesStore.activeBone.position[0].toFixed(3) }}
              Y: {{ bonesStore.activeBone.position[1].toFixed(3) }}
            </span>
          </div>
          <div class="prop-row">
            <span class="prop-label">回転</span>
            <span class="prop-value">{{ (bonesStore.activeBone.rotation * 180 / Math.PI).toFixed(1) }}°</span>
          </div>
          <div class="prop-row">
            <span class="prop-label">長さ</span>
            <span class="prop-value">{{ bonesStore.activeBone.length.toFixed(3) }}</span>
          </div>
          <div class="prop-row">
            <span class="prop-label">親</span>
            <span class="prop-value">{{ getParentBoneName(bonesStore.activeBone.parentId) }}</span>
          </div>
          <div class="prop-row">
            <span class="prop-label">子</span>
            <span class="prop-value">{{ getChildCount(bonesStore.activeBone.id) }} 件</span>
          </div>
        </div>

        <!-- バインドされたパーツ -->
        <div class="inspector-section">
          <div class="section-title">
            <LayersIcon :size="12" class="section-icon" />
            バインドパーツ
          </div>
          <div v-if="boundParts.length === 0" class="empty-bind">未バインド</div>
          <div v-for="part in boundParts" :key="part.id" class="bind-chip">
            <ImageIcon :size="11" />
            {{ part.name }}
          </div>
        </div>

        <!-- リンク済みパラメータ -->
        <div class="inspector-section">
          <div class="section-title">
            <SlidersIcon :size="12" class="section-icon" />
            リンクパラメータ
          </div>
          <div v-if="linkedParams.length === 0" class="empty-bind">なし</div>
          <div v-for="param in linkedParams" :key="param.id" class="bind-chip cyan">
            <LinkIcon :size="11" />
            {{ param.name }} ({{ param.linkedProperty }})
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent, h } from 'vue';
import {
  Bone as BoneIcon,
  Layers as LayersIcon,
  Sliders as SlidersIcon,
  MousePointer as MousePointerIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
} from 'lucide-vue-next';
import { useBonesStore } from '../../stores/bones';
import { useProjectStore } from '../../stores/project';
import type { Bone } from '@morpha/core';

const bonesStore = useBonesStore();
const projectStore = useProjectStore();

const activeTab = ref<'deformer' | 'inspector'>('deformer');

// メッシュパーツ一覧
const meshParts = computed(() =>
  projectStore.project?.rig.parts.filter(p => p.type === 'mesh') ?? []
);

// 選択中ボーンにバインドされたパーツ
const boundParts = computed(() => {
  if (!bonesStore.activeBoneId || !projectStore.project) return [];
  return projectStore.project.rig.parts.filter(p => p.boneId === bonesStore.activeBoneId);
});

// 選択中ボーンにリンクされたパラメータ
const linkedParams = computed(() => {
  if (!bonesStore.activeBoneId || !projectStore.project) return [];
  return (projectStore.project.parameters ?? []).filter(
    p => p.linkedBoneId === bonesStore.activeBoneId
  );
});

const getParentBoneName = (parentId: string | null): string => {
  if (!parentId) return 'ルート';
  const bone = bonesStore.bones.find(b => b.id === parentId);
  return bone?.name ?? parentId;
};

const getChildCount = (boneId: string): number => {
  return bonesStore.bones.filter(b => b.parentId === boneId).length;
};

// --- DeformerTreeNode (インラインコンポーネント) ---
const DeformerTreeNode = defineComponent({
  name: 'DeformerTreeNode',
  props: {
    bone: { type: Object as () => Bone & { children?: any[] }, required: true },
    level: { type: Number, default: 0 },
    activeId: { type: String as () => string | null, default: null },
  },
  emits: ['select'],
  setup(props, { emit }) {
    const expanded = ref(true);
    const hasChildren = computed(() => (props.bone.children?.length ?? 0) > 0);
    const isActive = computed(() => props.bone.id === props.activeId);

    return () => {
      const children = props.bone.children ?? [];
      return h('div', { class: 'tree-node' }, [
        h('div', {
          class: ['tree-item', { active: isActive.value }],
          style: { paddingLeft: `${props.level * 14 + 8}px` },
          onClick: () => emit('select', props.bone.id),
        }, [
          hasChildren.value
            ? h('button', {
                class: 'expand-btn',
                onClick: (e: Event) => { e.stopPropagation(); expanded.value = !expanded.value; }
              }, [
                h(expanded.value ? ChevronDownIcon : ChevronRightIcon, { size: 12 })
              ])
            : h('span', { class: 'leaf-dot' }),
          h(BoneIcon, { size: 12, class: 'bone-icon' }),
          h('span', { class: 'bone-name' }, props.bone.name),
        ]),
        expanded.value && children.length > 0
          ? h('div', { class: 'tree-children' },
              children.map((child: any) =>
                h(DeformerTreeNode, {
                  key: child.id,
                  bone: child,
                  level: props.level + 1,
                  activeId: props.activeId,
                  onSelect: (id: string) => emit('select', id),
                })
              )
            )
          : null,
      ]);
    };
  },
});
</script>

<style scoped lang="scss">
.preview-panel {
  flex: 1;
  background-color: var(--bg-panel);
  border-left: 1px solid var(--border-color);
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  .panel-header {
    height: 40px;
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;

    .tabs {
      display: flex;
      height: 100%;

      .tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.15s;

        &:hover { color: var(--text-primary); }
        &.active {
          color: var(--brand-purple);
          border-bottom-color: var(--brand-purple);
        }
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    gap: 8px;
    color: var(--text-muted);
    flex: 1;

    .empty-icon { opacity: 0.3; }
    span { font-size: 11px; }
  }

  // --- デフォーマツリー ---
  .deformer-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .deformer-tree {
    flex: 1;
    overflow-y: auto;
    padding: 6px 0;
  }

  :deep(.tree-node) {
    .tree-item {
      display: flex;
      align-items: center;
      gap: 5px;
      height: 28px;
      cursor: pointer;
      border-radius: 3px;
      margin: 1px 6px;
      transition: background-color 0.1s;
      color: var(--text-secondary);
      font-size: 12px;

      &:hover { background-color: var(--bg-hover); color: var(--text-primary); }
      &.active {
        background-color: rgba(138, 79, 255, 0.15);
        color: var(--brand-purple);
      }

      .expand-btn {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        flex-shrink: 0;
        border-radius: 2px;
        &:hover { color: var(--text-primary); }
      }

      .leaf-dot {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        &::after {
          content: '';
          display: block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: var(--text-muted);
          opacity: 0.4;
        }
      }

      .bone-icon { color: var(--brand-cyan); flex-shrink: 0; }
      .bone-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    }
  }

  .stats-bar {
    display: flex;
    gap: 12px;
    padding: 8px 12px;
    border-top: 1px solid var(--border-color);
    flex-shrink: 0;

    .stat {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      color: var(--text-muted);
    }
  }

  // --- インスペクタ ---
  .inspector-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .inspector-section {
    margin-bottom: 14px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 10px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      margin-bottom: 6px;
      padding: 0 4px;

      .section-icon { color: var(--text-muted); &.cyan { color: var(--brand-cyan); } }
    }

    .prop-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 4px;
      font-size: 11px;
      border-bottom: 1px solid var(--border-color);

      .prop-label { color: var(--text-muted); }
      .prop-value { color: var(--text-primary); font-variant-numeric: tabular-nums; }

      &:last-child { border-bottom: none; }
    }

    .empty-bind {
      font-size: 11px;
      color: var(--text-muted);
      padding: 4px 4px;
    }

    .bind-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      color: var(--text-secondary);
      background-color: var(--bg-active);
      border-radius: 4px;
      padding: 2px 6px;
      margin: 2px;

      &.cyan { color: var(--brand-cyan); background-color: rgba(0, 210, 200, 0.1); }
    }
  }
}
</style>
