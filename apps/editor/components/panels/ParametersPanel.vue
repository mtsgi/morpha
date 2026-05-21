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
          <input type="text" placeholder="パラメータを検索" />
        </div>
      </div>

      <div class="parameters-list">
        <!-- Group: Expression -->
        <div class="param-group">
          <div class="group-title">表情</div>
          
          <div class="param-item">
            <span class="label">頭の向き X</span>
            <div class="slider-container">
              <input type="range" min="-1" max="1" step="0.01" v-model.number="projectStore.currentParameters['head_x']" class="native-slider" />
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: `${(projectStore.currentParameters['head_x'] + 1) * 50}%` }"></div>
                <div class="slider-thumb" :style="{ left: `${(projectStore.currentParameters['head_x'] + 1) * 50}%` }"></div>
              </div>
            </div>
            <span class="value">{{ projectStore.currentParameters['head_x'].toFixed(2) }}</span>
          </div>

          <div class="param-item">
            <span class="label">目 開閉</span>
            <div class="slider-container">
              <input type="range" min="0" max="1" step="0.01" v-model.number="projectStore.currentParameters['eye_open']" class="native-slider" />
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: `${projectStore.currentParameters['eye_open'] * 100}%` }"></div>
                <div class="slider-thumb" :style="{ left: `${projectStore.currentParameters['eye_open'] * 100}%` }"></div>
              </div>
            </div>
            <span class="value">{{ projectStore.currentParameters['eye_open'].toFixed(2) }}</span>
          </div>

          <div class="param-item">
            <span class="label">眉の角度</span>
            <div class="slider-container">
              <input type="range" min="-1" max="1" step="0.01" v-model.number="projectStore.currentParameters['brow_angle']" class="native-slider" />
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: `${(projectStore.currentParameters['brow_angle'] + 1) * 50}%` }"></div>
                <div class="slider-thumb" :style="{ left: `${(projectStore.currentParameters['brow_angle'] + 1) * 50}%` }"></div>
              </div>
            </div>
            <span class="value">{{ projectStore.currentParameters['brow_angle'].toFixed(2) }}</span>
          </div>

          <div class="param-item">
            <span class="label">眉 上下</span>
            <div class="slider-container">
              <input type="range" min="-1" max="1" step="0.01" v-model.number="projectStore.currentParameters['brow_y']" class="native-slider" />
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: `${(projectStore.currentParameters['brow_y'] + 1) * 50}%` }"></div>
                <div class="slider-thumb" :style="{ left: `${(projectStore.currentParameters['brow_y'] + 1) * 50}%` }"></div>
              </div>
            </div>
            <span class="value">{{ projectStore.currentParameters['brow_y'].toFixed(2) }}</span>
          </div>

          <div class="param-item">
            <span class="label">口 開閉</span>
            <div class="slider-container">
              <input type="range" min="0" max="1" step="0.01" v-model.number="projectStore.currentParameters['mouth_open']" class="native-slider" />
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: `${projectStore.currentParameters['mouth_open'] * 100}%` }"></div>
                <div class="slider-thumb" :style="{ left: `${projectStore.currentParameters['mouth_open'] * 100}%` }"></div>
              </div>
            </div>
            <span class="value">{{ projectStore.currentParameters['mouth_open'].toFixed(2) }}</span>
          </div>

          <div class="param-item">
            <span class="label">口 変形</span>
            <div class="slider-container">
              <input type="range" min="-1" max="1" step="0.01" v-model.number="projectStore.currentParameters['mouth_form']" class="native-slider" />
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: `${(projectStore.currentParameters['mouth_form'] + 1) * 50}%` }"></div>
                <div class="slider-thumb" :style="{ left: `${(projectStore.currentParameters['mouth_form'] + 1) * 50}%` }"></div>
              </div>
            </div>
            <span class="value">{{ projectStore.currentParameters['mouth_form'].toFixed(2) }}</span>
          </div>
        </div>

        <!-- Group: Head -->
        <div class="param-group">
          <div class="group-title">頭部</div>
          
          <div class="param-item">
            <span class="label">頭の向き Y</span>
            <div class="slider-container">
              <input type="range" min="-1" max="1" step="0.01" v-model.number="projectStore.currentParameters['head_y']" class="native-slider" />
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: `${(projectStore.currentParameters['head_y'] + 1) * 50}%` }"></div>
                <div class="slider-thumb" :style="{ left: `${(projectStore.currentParameters['head_y'] + 1) * 50}%` }"></div>
              </div>
            </div>
            <span class="value">{{ projectStore.currentParameters['head_y'].toFixed(2) }}</span>
          </div>

          <div class="param-item">
            <span class="label">頭の傾き Z</span>
            <div class="slider-container">
              <input type="range" min="-1" max="1" step="0.01" v-model.number="projectStore.currentParameters['head_z']" class="native-slider" />
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: `${(projectStore.currentParameters['head_z'] + 1) * 50}%` }"></div>
                <div class="slider-thumb" :style="{ left: `${(projectStore.currentParameters['head_z'] + 1) * 50}%` }"></div>
              </div>
            </div>
            <span class="value">{{ projectStore.currentParameters['head_z'].toFixed(2) }}</span>
          </div>
        </div>

        <!-- Group: Body -->
        <div class="param-group">
          <div class="group-title">体</div>
          
          <div class="param-item">
            <span class="label">体の回転 X</span>
            <div class="slider-container">
              <input type="range" min="-1" max="1" step="0.01" v-model.number="projectStore.currentParameters['body_x']" class="native-slider" />
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: `${(projectStore.currentParameters['body_x'] + 1) * 50}%` }"></div>
                <div class="slider-thumb" :style="{ left: `${(projectStore.currentParameters['body_x'] + 1) * 50}%` }"></div>
              </div>
            </div>
            <span class="value">{{ projectStore.currentParameters['body_x'].toFixed(2) }}</span>
          </div>
          
          <div class="param-item">
            <span class="label">呼吸</span>
            <div class="slider-container">
              <input type="range" min="0" max="1" step="0.01" v-model.number="projectStore.currentParameters['breath']" class="native-slider" />
              <div class="slider-track">
                <div class="slider-fill" :style="{ width: `${projectStore.currentParameters['breath'] * 100}%` }"></div>
                <div class="slider-thumb" :style="{ left: `${projectStore.currentParameters['breath'] * 100}%` }"></div>
              </div>
            </div>
            <span class="value">{{ projectStore.currentParameters['breath'].toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <button class="add-btn">
          <PlusIcon :size="14" />
          パラメータを追加
        </button>
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

const projectStore = useProjectStore();
const bonesStore = useBonesStore();

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
}
</style>
