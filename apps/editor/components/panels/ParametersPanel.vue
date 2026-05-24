<template>
  <div class="parameters-panel">
    <div class="panel-header">
      <div class="tabs">
        <div class="tab" :class="{ active: activeTab === 'inspector' }" @click="activeTab = 'inspector'">インスペクタ</div>
        <div class="tab" :class="{ active: activeTab === 'parameters' }" @click="activeTab = 'parameters'">パラメータ</div>
      </div>
    </div>

    <!-- Inspector Tab -->
    <template v-if="activeTab === 'inspector'">
      <!-- Bone Inspector -->
      <div v-if="bonesStore.activeBone" class="parameters-list">
        <div class="param-group">
          <div class="group-title">
            <BoneIcon :size="12" class="group-icon cyan" />
            ボーン — {{ bonesStore.activeBone.name }}
          </div>

          <div class="param-item">
            <span class="label">名前</span>
            <input
              type="text"
              class="text-input"
              :value="bonesStore.activeBone.name"
              @change="handleBoneNameChange"
            />
          </div>

          <div class="param-item">
            <span class="label">位置 X</span>
            <div class="slider-container">
              <input type="range" min="-2" max="2" step="0.01" :value="bonesStore.activeBone.position[0]" class="native-slider" @input="handleBonePosX" />
              <div class="slider-track">
                <div class="slider-fill cyan" :style="{ width: `${(bonesStore.activeBone.position[0] + 2) * 25}%` }"></div>
                <div class="slider-thumb cyan" :style="{ left: `${(bonesStore.activeBone.position[0] + 2) * 25}%` }"></div>
              </div>
            </div>
            <span class="value">{{ bonesStore.activeBone.position[0].toFixed(2) }}</span>
          </div>

          <div class="param-item">
            <span class="label">位置 Y</span>
            <div class="slider-container">
              <input type="range" min="-2" max="2" step="0.01" :value="bonesStore.activeBone.position[1]" class="native-slider" @input="handleBonePosY" />
              <div class="slider-track">
                <div class="slider-fill cyan" :style="{ width: `${(bonesStore.activeBone.position[1] + 2) * 25}%` }"></div>
                <div class="slider-thumb cyan" :style="{ left: `${(bonesStore.activeBone.position[1] + 2) * 25}%` }"></div>
              </div>
            </div>
            <span class="value">{{ bonesStore.activeBone.position[1].toFixed(2) }}</span>
          </div>

          <div class="param-item">
            <span class="label">回転</span>
            <div class="slider-container">
              <input type="range" min="-3.14" max="3.14" step="0.01" :value="bonesStore.activeBone.rotation" class="native-slider" @input="handleBoneRotation" />
              <div class="slider-track">
                <div class="slider-fill cyan" :style="{ width: `${(bonesStore.activeBone.rotation + 3.14) / 6.28 * 100}%` }"></div>
                <div class="slider-thumb cyan" :style="{ left: `${(bonesStore.activeBone.rotation + 3.14) / 6.28 * 100}%` }"></div>
              </div>
            </div>
            <span class="value">{{ bonesStore.activeBone.rotation.toFixed(2) }}</span>
          </div>

          <div class="param-item">
            <span class="label">長さ</span>
            <div class="slider-container">
              <input type="range" min="0.01" max="1" step="0.01" :value="bonesStore.activeBone.length" class="native-slider" @input="handleBoneLength" />
              <div class="slider-track">
                <div class="slider-fill cyan" :style="{ width: `${bonesStore.activeBone.length * 100}%` }"></div>
                <div class="slider-thumb cyan" :style="{ left: `${bonesStore.activeBone.length * 100}%` }"></div>
              </div>
            </div>
            <span class="value">{{ bonesStore.activeBone.length.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Bone Bind Section -->
        <div class="param-group">
          <div class="group-title">バインドされたパーツ</div>
          <div v-if="boundParts.length === 0" class="empty-bind">
            <span>バインドなし</span>
          </div>
          <div v-for="part in boundParts" :key="part.id" class="bind-item">
            <PuzzleIcon :size="12" class="bind-icon" />
            <span>{{ part.name }}</span>
            <button class="unbind-btn" @click="bonesStore.unbindPart(part.id)" title="バインド解除">
              <XIcon :size="12" />
            </button>
          </div>
        </div>
      </div>

      <!-- Part Inspector -->
      <div v-else-if="activePart" class="parameters-list">
        <div class="param-group">
          <div class="group-title">{{ activePart.name }} - トランスフォーム</div>
          
          <div class="param-item">
            <span class="label">位置 X</span>
            <div class="slider-container">
              <input type="range" min="-2" max="2" step="0.01" v-model.number="activePart.transform.position[0]" class="native-slider" />
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: `${(activePart.transform.position[0] + 2) * 25}%` }"></div>
                <div class="slider-thumb" :style="{ left: `${(activePart.transform.position[0] + 2) * 25}%` }"></div>
              </div>
            </div>
            <span class="value">{{ activePart.transform.position[0].toFixed(2) }}</span>
          </div>

          <div class="param-item">
            <span class="label">位置 Y</span>
            <div class="slider-container">
              <input type="range" min="-2" max="2" step="0.01" v-model.number="activePart.transform.position[1]" class="native-slider" />
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: `${(activePart.transform.position[1] + 2) * 25}%` }"></div>
                <div class="slider-thumb" :style="{ left: `${(activePart.transform.position[1] + 2) * 25}%` }"></div>
              </div>
            </div>
            <span class="value">{{ activePart.transform.position[1].toFixed(2) }}</span>
          </div>

          <div class="param-item">
            <span class="label">スケール</span>
            <div class="slider-container">
              <input type="range" min="0.1" max="3" step="0.01" v-model.number="activePart.transform.scale[0]" class="native-slider" @input="activePart.transform.scale[1] = activePart.transform.scale[0]" />
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: `${(activePart.transform.scale[0] / 3) * 100}%` }"></div>
                <div class="slider-thumb" :style="{ left: `${(activePart.transform.scale[0] / 3) * 100}%` }"></div>
              </div>
            </div>
            <span class="value">{{ activePart.transform.scale[0].toFixed(2) }}</span>
          </div>

          <div class="param-item">
            <span class="label">回転</span>
            <div class="slider-container">
              <input type="range" min="-3.14" max="3.14" step="0.01" v-model.number="activePart.transform.rotation" class="native-slider" />
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: `${(activePart.transform.rotation + 3.14) / 6.28 * 100}%` }"></div>
                <div class="slider-thumb" :style="{ left: `${(activePart.transform.rotation + 3.14) / 6.28 * 100}%` }"></div>
              </div>
            </div>
            <span class="value">{{ activePart.transform.rotation.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Bone Bind for Part -->
        <div class="param-group" v-if="activePart.type === 'mesh'">
          <div class="group-title">ボーンバインド</div>
          <div v-if="activePart.boneId" class="param-item">
            <span class="label">バインド先</span>
            <span class="depth-status-badge">{{ getBoneName(activePart.boneId) }}</span>
            <button class="icon-btn" @click="bonesStore.unbindPart(activePart.id)" title="バインド解除">
              <XIcon :size="14" />
            </button>
          </div>
          <div v-else class="bind-select-row">
            <select class="bind-select" @change="handleBindBone" :value="''">
              <option value="" disabled>ボーンを選択...</option>
              <option v-for="bone in bonesStore.bones" :key="bone.id" :value="bone.id">{{ bone.name }}</option>
            </select>
          </div>
        </div>

        <!-- Depth Map Section -->
        <div class="param-group depth-map-section" v-if="activePart.type === 'mesh'">
          <div class="group-title">深度マップ (疑似3D)</div>
          <div v-if="activePart.depthAssetId" class="param-item">
            <span class="label">状態</span>
            <span class="depth-status-badge">設定済み</span>
            <button class="icon-btn" @click="activePart.depthAssetId = undefined" title="深度マップを削除">
              <TrashIcon :size="14" />
            </button>
          </div>
          <div v-else class="depth-import-row">
            <button class="add-btn" @click="triggerDepthInput">
              <PlusIcon :size="14" />
              画像を読み込む
            </button>
          </div>
          <input type="file" ref="depthInput" accept="image/*" style="display: none;" @change="handleDepthImport" />
        </div>
      </div>

      <!-- No selection -->
      <div v-else class="parameters-list">
        <div class="empty-inspector">
          <MousePointerIcon :size="24" class="empty-icon" />
          <span>パーツまたはボーンを選択してください</span>
        </div>
      </div>
    </template>

    <!-- Parameters Tab -->
    <template v-else>
      <div class="panel-search">
        <div class="search-box">
          <SearchIcon class="icon" :size="14" />
          <input
            type="text"
            placeholder="パラメータを検索"
            v-model="searchQuery"
          />
          <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">
            <XIcon :size="12" />
          </button>
        </div>
      </div>

      <div class="parameters-list">
        <!-- パラメータなし -->
        <div v-if="!projectStore.project?.parameters?.length" class="empty-inspector">
          <MousePointerIcon :size="24" class="empty-icon" />
          <span>パラメータがまだありません</span>
        </div>

        <!-- 検索結果なし -->
        <div v-else-if="searchQuery && !filteredParams.length" class="empty-inspector">
          <SearchIcon :size="24" class="empty-icon" />
          <span>"{{ searchQuery }}" に一致するパラメータなし</span>
        </div>

        <!-- グループ別スライダー一覧 -->
        <template v-for="(params, group) in groupedParams" :key="group">
          <div class="param-group">
            <div class="group-title">
              <span>{{ group }}</span>
              <span class="group-count">{{ params.length }}</span>
            </div>

            <div
              v-for="param in params"
              :key="param.id"
              class="param-item"
              :class="{ 'linked-bone': !!param.linkedBoneId }"
            >
              <span class="label" :title="param.id">{{ param.name }}</span>
              <div class="slider-container">
                <input
                  type="range"
                  :min="param.min"
                  :max="param.max"
                  :step="param.step"
                  class="native-slider"
                  :value="projectStore.currentParameters[param.id] ?? param.defaultValue"
                  @input="handleParamInput(param.id, $event)"
                />
                <div class="slider-track">
                  <div
                    class="slider-fill"
                    :class="{ cyan: !!param.linkedBoneId }"
                    :style="{ width: `${getSliderPercent(param)}%` }"
                  ></div>
                  <div
                    class="slider-thumb"
                    :class="{ cyan: !!param.linkedBoneId }"
                    :style="{ left: `${getSliderPercent(param)}%` }"
                  ></div>
                </div>
              </div>
              <span class="value">
                {{ (projectStore.currentParameters[param.id] ?? param.defaultValue).toFixed(2) }}
              </span>
              <!-- キーフレーム追加ボタン -->
              <button
                class="kf-btn"
                title="キーフレームを追加"
                @click="addKeyframeForParam(param.id)"
              >
                <span class="kf-diamond"></span>
              </button>
            </div>
          </div>
        </template>
      </div>

      <div class="panel-footer">
        <button class="add-btn" @click="showAddParam = !showAddParam">
          <PlusIcon :size="14" />
          パラメータを追加
        </button>
      </div>

      <!-- パラメータ追加フォーム -->
      <div v-if="showAddParam" class="add-param-form">
        <input v-model="newParamId" type="text" placeholder="ID (e.g. eye_blink_l)" class="param-input" />
        <input v-model="newParamName" type="text" placeholder="表示名" class="param-input" />
        <input v-model="newParamGroup" type="text" placeholder="グループ" class="param-input" />
        <div class="param-row">
          <span>範囲:</span>
          <input v-model.number="newParamMin" type="number" step="0.1" class="param-input-small" />
          <span>~</span>
          <input v-model.number="newParamMax" type="number" step="0.1" class="param-input-small" />
        </div>
        <div class="form-btns">
          <button class="add-btn" @click="submitAddParam">追加</button>
          <button class="cancel-btn" @click="showAddParam = false">キャンセル</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  Search as SearchIcon,
  Plus as PlusIcon,
  Trash as TrashIcon,
  Bone as BoneIcon,
  Puzzle as PuzzleIcon,
  X as XIcon,
  MousePointer as MousePointerIcon
} from 'lucide-vue-next';
import { useProjectStore } from '../../stores/project';
import { useBonesStore } from '../../stores/bones';
import { useTimelineStore } from '../../stores/timeline';
import type { ParameterDefinition } from '@morpha/core';

const projectStore = useProjectStore();
const bonesStore = useBonesStore();
const timelineStore = useTimelineStore();

const activeTab = ref<'inspector' | 'parameters'>('parameters');

const activePart = computed(() => {
  if (!projectStore.project || !projectStore.activePartId) return null;
  return projectStore.project.rig.parts.find(p => p.id === projectStore.activePartId) || null;
});

const boundParts = computed(() => {
  if (!projectStore.project || !bonesStore.activeBoneId) return [];
  return projectStore.project.rig.parts.filter(p => p.boneId === bonesStore.activeBoneId);
});

const getBoneName = (boneId: string): string => {
  const bone = bonesStore.bones.find(b => b.id === boneId);
  return bone?.name ?? boneId;
};

// --- Parameter tab ---
const searchQuery = ref('');
const showAddParam = ref(false);
const newParamId = ref('');
const newParamName = ref('');
const newParamGroup = ref('カスタム');
const newParamMin = ref(-1);
const newParamMax = ref(1);

/** 検索フィルター済みパラメータ一覧 */
const filteredParams = computed(() => {
  const defs = projectStore.project?.parameters ?? [];
  if (!searchQuery.value) return defs;
  const q = searchQuery.value.toLowerCase();
  return defs.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.group.toLowerCase().includes(q));
});

/** グループ別にまとめたパラメータ (Record<groupName, def[]>) */
const groupedParams = computed(() => {
  const result: Record<string, ParameterDefinition[]> = {};
  for (const p of filteredParams.value) {
    if (!result[p.group]) result[p.group] = [];
    result[p.group].push(p);
  }
  return result;
});

/** スライダーのパーセント位置を計算 */
const getSliderPercent = (param: ParameterDefinition) => {
  const val = projectStore.currentParameters[param.id] ?? param.defaultValue;
  return ((val - param.min) / (param.max - param.min)) * 100;
};

/** スライダー入力ハンドラー */
const handleParamInput = (id: string, e: Event) => {
  const val = parseFloat((e.target as HTMLInputElement).value);
  projectStore.currentParameters[id] = val;
};

/** キーフレームをアクティブトラックに追加 */
const addKeyframeForParam = (paramId: string) => {
  // トラックがなければ自動作成
  const existingIdx = timelineStore.tracks.findIndex(t => t.parameterId === paramId);
  let trackIdx = existingIdx;
  if (trackIdx === -1) {
    timelineStore.addTrack(paramId);
    trackIdx = timelineStore.tracks.length - 1;
  }
  const value = projectStore.currentParameters[paramId] ?? 0;
  timelineStore.addKeyframe(trackIdx, timelineStore.currentTime, value);
};

/** パラメータ追加 */
const submitAddParam = () => {
  if (!newParamId.value || !newParamName.value) return;
  projectStore.addParameter({
    id: newParamId.value,
    name: newParamName.value,
    group: newParamGroup.value,
    min: newParamMin.value,
    max: newParamMax.value,
    defaultValue: 0,
    step: 0.01,
  });
  newParamId.value = '';
  newParamName.value = '';
  showAddParam.value = false;
};

// Bone inspector handlers
const handleBoneNameChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (bonesStore.activeBoneId) {
    bonesStore.updateBone(bonesStore.activeBoneId, { name: target.value });
  }
};

const handleBonePosX = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (bonesStore.activeBone) {
    bonesStore.updateBone(bonesStore.activeBone.id, {
      position: [parseFloat(target.value), bonesStore.activeBone.position[1]],
    });
  }
};

const handleBonePosY = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (bonesStore.activeBone) {
    bonesStore.updateBone(bonesStore.activeBone.id, {
      position: [bonesStore.activeBone.position[0], parseFloat(target.value)],
    });
  }
};

const handleBoneRotation = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (bonesStore.activeBoneId) {
    bonesStore.updateBone(bonesStore.activeBoneId, { rotation: parseFloat(target.value) });
  }
};

const handleBoneLength = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (bonesStore.activeBoneId) {
    bonesStore.updateBone(bonesStore.activeBoneId, { length: parseFloat(target.value) });
  }
};

const handleBindBone = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  if (activePart.value && target.value) {
    bonesStore.bindPartToBone(activePart.value.id, target.value);
    target.value = '';
  }
};

// Depth map
const depthInput = ref<HTMLInputElement | null>(null);

const triggerDepthInput = () => {
  depthInput.value?.click();
};

const handleDepthImport = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0 && activePart.value) {
    const file = target.files[0];
    await projectStore.importDepthMap(file, activePart.value.id);
    target.value = '';
  }
};
</script>

<style scoped lang="scss">
.parameters-panel {
  width: 320px;
  background-color: var(--bg-panel);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100%;

  .panel-header {
    height: 40px;
    border-bottom: 1px solid var(--border-color);

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
        cursor: pointer;

        &.active {
          color: var(--brand-purple);
          border-bottom: 2px solid var(--brand-purple);
        }
      }
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

  .parameters-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 12px;

    .empty-inspector {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 48px 16px;
      color: var(--text-muted);

      .empty-icon {
        opacity: 0.3;
      }

      span {
        font-size: 12px;
      }
    }

    .param-group {
      margin-bottom: 16px;

      .group-title {
        font-size: 11px;
        color: var(--text-muted);
        margin-bottom: 8px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;

        .group-icon {
          &.cyan { color: var(--brand-cyan); }
        }
      }

      .text-input {
        flex: 1;
        background-color: var(--bg-base);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 4px 8px;
        color: var(--text-primary);
        font-size: 12px;
        outline: none;

        &:focus {
          border-color: var(--brand-cyan);
        }
      }

      .param-item {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        gap: 12px;

        .label {
          width: 70px;
          font-size: 11px;
          color: var(--text-secondary);
          text-align: right;
        }

        .slider-container {
          flex: 1;
          position: relative;
          height: 20px;
          display: flex;
          align-items: center;

          .native-slider {
            position: absolute;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
            z-index: 10;
            margin: 0;
          }

          .slider-track {
            width: 100%;
            height: 4px;
            background-color: var(--bg-primary);
            border-radius: 2px;
            position: relative;
            pointer-events: none;
          }

          .slider-fill {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            background-color: var(--brand-purple);
            border-radius: 2px;
            
            &.purple { background-color: var(--brand-purple); }
            &.cyan { background-color: var(--brand-cyan); }
          }

          .slider-thumb {
            position: absolute;
            top: 50%;
            width: 12px;
            height: 12px;
            background-color: var(--brand-purple);
            border: 2px solid var(--text-primary);
            border-radius: 50%;
            transform: translate(-50%, -50%);

            &.cyan { background-color: var(--brand-cyan); }
          }

          .key-nodes {
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            transform: translateY(-50%);
            pointer-events: none;

            .node {
              position: absolute;
              width: 4px;
              height: 4px;
              background-color: var(--text-muted);
              transform: translate(-50%, -50%) rotate(45deg);

              &.active {
                background-color: var(--brand-purple);
              }
            }
          }
        }

        .value {
          width: 36px;
          font-size: 11px;
          color: var(--text-secondary);
          font-variant-numeric: tabular-nums;
        }
      }

      // Bone bind section
      .empty-bind {
        padding: 8px 0;
        font-size: 11px;
        color: var(--text-muted);
        text-align: center;
      }

      .bind-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        color: var(--text-secondary);
        background-color: var(--bg-base);
        margin-bottom: 4px;

        .bind-icon {
          color: var(--brand-purple);
          flex-shrink: 0;
        }

        span { flex: 1; }

        .unbind-btn {
          display: flex;
          align-items: center;
          padding: 2px;
          border-radius: 2px;
          opacity: 0;
          transition: opacity 0.15s;
          color: var(--text-muted);

          &:hover { color: #ff6b6b; }
        }

        &:hover .unbind-btn { opacity: 1; }
      }

      .bind-select-row {
        .bind-select {
          width: 100%;
          background-color: var(--bg-base);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 6px 8px;
          color: var(--text-secondary);
          font-size: 11px;
          outline: none;

          &:focus {
            border-color: var(--brand-cyan);
          }

          option {
            background-color: var(--bg-panel);
            color: var(--text-primary);
          }
        }
      }
    }

    .depth-map-section {
      .depth-status-badge {
        flex: 1;
        font-size: 11px;
        color: var(--brand-cyan);
        background-color: rgba(0, 210, 200, 0.1);
        border: 1px solid rgba(0, 210, 200, 0.25);
        border-radius: 3px;
        padding: 2px 6px;
        text-align: center;
      }

      .icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 4px;
        border-radius: 3px;
        transition: color 0.15s, background-color 0.15s;

        &:hover {
          color: #ff6b6b;
          background-color: rgba(255, 107, 107, 0.1);
        }
      }

      .depth-import-row {
        padding: 0 0 4px;

        .add-btn {
          width: 100%;
        }
      }
    }
  }

  .panel-footer {
    padding: 12px;
    border-top: 1px solid var(--border-color);
    flex-shrink: 0;

    .add-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px 0;
      border: 1px dashed var(--border-color);
      border-radius: 4px;
      color: var(--text-secondary);
      font-size: 11px;

      &:hover {
        border-color: var(--brand-purple);
        color: var(--brand-purple);
      }
    }
  }

  // キーフレームボタン
  .kf-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    border-radius: 2px;
    opacity: 0;
    transition: opacity 0.15s;
    cursor: pointer;

    .kf-diamond {
      display: block;
      width: 7px;
      height: 7px;
      background-color: var(--brand-cyan);
      transform: rotate(45deg);
    }

    &:hover .kf-diamond {
      background-color: #fff;
      box-shadow: 0 0 6px var(--brand-cyan);
    }
  }

  .param-item:hover .kf-btn { opacity: 1; }
  .param-item.linked-bone .label { color: var(--brand-cyan); }

  // グループカウントバッジ
  .group-count {
    margin-left: auto;
    font-size: 10px;
    color: var(--text-muted);
    background-color: var(--bg-active);
    border-radius: 10px;
    padding: 0 5px;
    font-weight: 400;
  }

  // 検索クリアボタン
  .clear-search {
    display: flex;
    align-items: center;
    color: var(--text-muted);
    padding: 2px;
    border-radius: 2px;

    &:hover { color: var(--text-primary); }
  }

  // パラメータ追加フォーム
  .add-param-form {
    padding: 12px;
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 6px;
    background-color: var(--bg-base);

    .param-input {
      width: 100%;
      background-color: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 5px 8px;
      color: var(--text-primary);
      font-size: 11px;
      outline: none;

      &:focus { border-color: var(--brand-cyan); }
    }

    .param-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--text-secondary);

      .param-input-small {
        width: 60px;
        background-color: var(--bg-panel);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 4px 6px;
        color: var(--text-primary);
        font-size: 11px;
        outline: none;

        &:focus { border-color: var(--brand-cyan); }
      }
    }

    .form-btns {
      display: flex;
      gap: 8px;
      margin-top: 4px;

      .add-btn {
        flex: 1;
        padding: 5px;
        background-color: rgba(138, 79, 255, 0.2);
        border: 1px solid var(--brand-purple);
        border-radius: 4px;
        color: var(--brand-purple);
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;

        &:hover { background-color: rgba(138, 79, 255, 0.35); }
      }

      .cancel-btn {
        flex: 1;
        padding: 5px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        color: var(--text-secondary);
        font-size: 11px;
        cursor: pointer;

        &:hover { border-color: var(--text-muted); color: var(--text-primary); }
      }
    }
  }
}
</style>
