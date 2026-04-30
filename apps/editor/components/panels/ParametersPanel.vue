<template>
  <div class="parameters-panel">
    <div class="panel-header">
      <div class="tabs">
        <div class="tab">インスペクタ</div>
        <div class="tab active">パラメータ</div>
      </div>
    </div>

    <div class="panel-search">
      <div class="search-box">
        <SearchIcon class="icon" :size="14" />
        <input type="text" placeholder="パラメータを検索" />
      </div>
    </div>

    <div class="parameters-list">
      <div class="param-group" v-if="activePart && activePart.transform">
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
            <div class="slider-track">
              <div class="slider-fill purple" style="width: 60%"></div>
              <div class="slider-thumb" style="left: 60%"></div>
            </div>
            <div class="key-nodes">
              <div class="node active" style="left: 0%"></div>
              <div class="node" style="left: 50%"></div>
              <div class="node active" style="left: 100%"></div>
            </div>
          </div>
          <span class="value">0.10</span>
        </div>

        <div class="param-item">
          <span class="label">口 開閉</span>
          <div class="slider-container">
            <div class="slider-track">
              <div class="slider-fill" style="width: 65%"></div>
              <div class="slider-thumb" style="left: 65%"></div>
            </div>
            <div class="key-nodes">
              <div class="node active" style="left: 0%"></div>
              <div class="node active" style="left: 100%"></div>
            </div>
          </div>
          <span class="value">0.65</span>
        </div>

        <div class="param-item">
          <span class="label">口 変形</span>
          <div class="slider-container">
            <div class="slider-track">
              <div class="slider-fill" style="width: 30%"></div>
              <div class="slider-thumb" style="left: 30%"></div>
            </div>
          </div>
          <span class="value">0.30</span>
        </div>
      </div>

      <!-- Group: Head -->
      <div class="param-group">
        <div class="group-title">頭部</div>
        
        <div class="param-item">
          <span class="label">頭の向き Y</span>
          <div class="slider-container">
            <div class="slider-track">
              <div class="slider-fill" style="width: 65%"></div>
              <div class="slider-thumb" style="left: 65%"></div>
            </div>
          </div>
          <span class="value">0.30</span>
        </div>

        <div class="param-item">
          <span class="label">頭の傾き Z</span>
          <div class="slider-container">
            <div class="slider-track">
              <div class="slider-fill" style="width: 50%"></div>
              <div class="slider-thumb" style="left: 50%"></div>
            </div>
          </div>
          <span class="value">0.00</span>
        </div>
      </div>

      <!-- Group: Body -->
      <div class="param-group">
        <div class="group-title">体</div>
        
        <div class="param-item">
          <span class="label">体の回転 X</span>
          <div class="slider-container">
            <div class="slider-track">
              <div class="slider-fill" style="width: 50%"></div>
              <div class="slider-thumb" style="left: 50%"></div>
            </div>
            <div class="key-nodes">
              <div class="node active" style="left: 0%"></div>
              <div class="node active" style="left: 100%"></div>
            </div>
          </div>
          <span class="value">0.00</span>
        </div>
        
        <div class="param-item">
          <span class="label">呼吸</span>
          <div class="slider-container">
            <div class="slider-track">
              <div class="slider-fill" style="width: 35%"></div>
              <div class="slider-thumb" style="left: 35%"></div>
            </div>
          </div>
          <span class="value">0.35</span>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <button class="add-btn">
        <PlusIcon :size="14" />
        パラメータを追加
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { 
  Search as SearchIcon,
  Plus as PlusIcon
} from 'lucide-vue-next';
import { useProjectStore } from '../../stores/project';

const projectStore = useProjectStore();

const activePart = computed(() => {
  if (!projectStore.project || !projectStore.activePartId) return null;
  return projectStore.project.rig.parts.find(p => p.id === projectStore.activePartId) || null;
});
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

    .param-group {
      margin-bottom: 16px;

      .group-title {
        font-size: 11px;
        color: var(--text-muted);
        margin-bottom: 8px;
        font-weight: 600;
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
