<template>
  <Teleport to="body">
    <div class="export-overlay" @click.self="$emit('close')">
      <div class="export-dialog">
        <div class="dialog-header">
          <DownloadIcon :size="18" class="header-icon" />
          <h2>エクスポート</h2>
          <button class="close-btn" @click="$emit('close')"><XIcon :size="16" /></button>
        </div>

        <div class="dialog-body">
          <!-- フォーマット選択 -->
          <div class="format-cards">
            <div
              class="format-card"
              :class="{ active: format === 'morpha' }"
              @click="format = 'morpha'"
            >
              <div class="card-icon morpha">
                <PackageIcon :size="20" />
              </div>
              <div class="card-info">
                <div class="card-title">.morpha ファイル</div>
                <div class="card-desc">再生専用の軽量フォーマット。MorphaPlayer で読み込み可能。</div>
              </div>
            </div>

            <div
              class="format-card"
              :class="{ active: format === 'html' }"
              @click="format = 'html'"
            >
              <div class="card-icon html">
                <Code2Icon :size="20" />
              </div>
              <div class="card-info">
                <div class="card-title">スタンドアロン HTML</div>
                <div class="card-desc">ブラウザで直接開けるHTMLファイル。埋め込み表示向け。</div>
              </div>
            </div>

            <div
              class="format-card"
              :class="{ active: format === 'proj' }"
              @click="format = 'proj'"
            >
              <div class="card-icon proj">
                <FileIcon :size="20" />
              </div>
              <div class="card-info">
                <div class="card-title">.morpha_proj ファイル</div>
                <div class="card-desc">エディタプロジェクトファイル。フル編集データを保持。</div>
              </div>
            </div>
          </div>

          <!-- オプション -->
          <div class="export-options">
            <div class="options-title">オプション</div>

            <template v-if="format === 'morpha' || format === 'html'">
              <label class="option-row">
                <input type="checkbox" v-model="embedAssets" />
                <span>アセットを埋め込む (Base64)</span>
                <span class="option-hint">オフの場合は相対パス参照</span>
              </label>

              <label class="option-row">
                <input type="checkbox" v-model="minify" />
                <span>JSON を最小化 (minify)</span>
              </label>

              <template v-if="format === 'html'">
                <label class="option-row">
                  <input type="checkbox" v-model="mouseTracking" />
                  <span>マウス追従を有効化</span>
                </label>

                <div class="option-row">
                  <span>デフォルト再生モーション</span>
                  <select class="option-select" v-model="defaultMotion">
                    <option value="">なし</option>
                    <option
                      v-for="anim in projectStore.project?.animations"
                      :key="anim.name"
                      :value="anim.name"
                    >{{ anim.name }}</option>
                  </select>
                </div>
              </template>
            </template>

            <template v-if="format === 'proj'">
              <p class="option-note">
                現在のプロジェクトをそのまま <code>.morpha_proj</code> として保存します。
              </p>
            </template>
          </div>

          <!-- プレビュー情報 -->
          <div class="export-preview" v-if="format !== 'proj'">
            <div class="preview-row">
              <span>パーツ数</span>
              <span>{{ projectStore.project?.rig.parts.length ?? 0 }}</span>
            </div>
            <div class="preview-row">
              <span>ボーン数</span>
              <span>{{ projectStore.project?.rig.bones.length ?? 0 }}</span>
            </div>
            <div class="preview-row">
              <span>モーション数</span>
              <span>{{ projectStore.project?.animations.length ?? 0 }}</span>
            </div>
            <div class="preview-row">
              <span>パラメータ数</span>
              <span>{{ projectStore.project?.parameters?.length ?? 0 }}</span>
            </div>
            <div class="preview-row">
              <span>アセット数</span>
              <span>{{ projectStore.project?.assets.length ?? 0 }}</span>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="cancel-btn" @click="$emit('close')">キャンセル</button>
          <button class="export-btn" @click="doExport" :disabled="isExporting">
            <span v-if="isExporting" class="spinner"></span>
            <DownloadIcon v-else :size="14" />
            {{ isExporting ? 'エクスポート中...' : 'エクスポート' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  X as XIcon,
  Download as DownloadIcon,
  Package as PackageIcon,
  Code2 as Code2Icon,
  File as FileIcon
} from 'lucide-vue-next';
import { useProjectStore } from '../../stores/project';
import { serializeProject } from '@morpha/core';
import { convertToMorphaFormat, serializeMorphaFormat } from '@morpha/core';

defineEmits(['close']);

const projectStore = useProjectStore();

const format = ref<'morpha' | 'html' | 'proj'>('morpha');
const embedAssets = ref(true);
const minify = ref(false);
const mouseTracking = ref(true);
const defaultMotion = ref('');
const isExporting = ref(false);

async function doExport() {
  if (!projectStore.project) return;
  isExporting.value = true;

  try {
    await new Promise(r => setTimeout(r, 50)); // UI を更新させる

    if (format.value === 'proj') {
      downloadBlob(
        serializeProject(projectStore.project),
        `${projectStore.project.meta.name}.morpha_proj`,
        'application/json'
      );
      return;
    }

    const morphaData = convertToMorphaFormat(projectStore.project);
    const json = minify.value
      ? serializeMorphaFormat(morphaData)
      : JSON.stringify(morphaData, null, 2);

    if (format.value === 'morpha') {
      downloadBlob(json, `${projectStore.project.meta.name}.morpha`, 'application/json');
      return;
    }

    if (format.value === 'html') {
      const html = generateStandaloneHtml(json, {
        mouseTracking: mouseTracking.value,
        defaultMotion: defaultMotion.value,
      });
      downloadBlob(html, `${projectStore.project.meta.name}.html`, 'text/html');
    }
  } finally {
    isExporting.value = false;
  }
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateStandaloneHtml(
  morphaJson: string,
  opts: { mouseTracking: boolean; defaultMotion: string }
) {
  const autoplay = opts.defaultMotion ? `player.play(${JSON.stringify(opts.defaultMotion)});` : '';
  const mouseTrackCode = opts.mouseTracking
    ? `canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        player.setLookAt(e.clientX - rect.left, e.clientY - rect.top);
      });`
    : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Morpha Player</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f0f13; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    canvas { max-width: 100%; max-height: 100vh; }
  </style>
</head>
<body>
  <canvas id="morpha" width="1280" height="720"></canvas>
  <script type="module">
    import { MorphaPlayer } from 'https://cdn.jsdelivr.net/npm/@morpha/web-runtime/dist/index.js';

    const canvas = document.getElementById('morpha');
    const player = new MorphaPlayer(canvas, {
      loop: true,
      mouseTracking: ${opts.mouseTracking},
    });

    const morphaData = ${morphaJson};
    player.loadFromJSON(JSON.stringify(morphaData));
    ${autoplay}
    ${mouseTrackCode}
  <\/script>
</body>
</html>`;
}
</script>

<style scoped lang="scss">
.export-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.export-dialog {
  width: 520px;
  max-height: 90vh;
  background-color: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(138, 79, 255, 0.15);

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);

    .header-icon { color: var(--brand-purple); }

    h2 {
      flex: 1;
      font-size: 15px;
      font-weight: 600;
      color: var(--text-active);
    }

    .close-btn {
      color: var(--text-muted);
      padding: 4px;
      border-radius: 4px;
      &:hover { color: var(--text-primary); background-color: var(--bg-hover); }
    }
  }

  .dialog-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .format-cards {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .format-card {
      display: flex;
      gap: 14px;
      align-items: center;
      padding: 12px 14px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover { border-color: var(--brand-purple); background-color: rgba(138, 79, 255, 0.05); }
      &.active { border-color: var(--brand-purple); background-color: rgba(138, 79, 255, 0.1); }

      .card-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &.morpha { background: linear-gradient(135deg, #00d2ff33, #8a4fff33); color: var(--brand-cyan); }
        &.html   { background: linear-gradient(135deg, #ff853333, #ff4d4d33); color: #ff8533; }
        &.proj   { background: linear-gradient(135deg, #8a4fff33, #4d4dff33); color: var(--brand-purple); }
      }

      .card-info {
        .card-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .card-desc  { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
      }
    }
  }

  .export-options {
    .options-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 10px;
    }

    .option-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      font-size: 12px;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;

      input[type="checkbox"] { accent-color: var(--brand-purple); }

      span { flex: 1; }

      .option-hint {
        flex: 0;
        white-space: nowrap;
        color: var(--text-muted);
        font-size: 10px;
      }

      .option-select {
        background-color: var(--bg-base);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 3px 6px;
        color: var(--text-secondary);
        font-size: 11px;
        outline: none;

        &:focus { border-color: var(--brand-cyan); }

        option { background-color: var(--bg-panel); color: var(--text-primary); }
      }
    }

    .option-note {
      font-size: 12px;
      color: var(--text-muted);
      padding: 10px 0;
      line-height: 1.6;

      code {
        background-color: var(--bg-active);
        padding: 1px 5px;
        border-radius: 3px;
        color: var(--brand-cyan);
        font-size: 11px;
      }
    }
  }

  .export-preview {
    background-color: var(--bg-base);
    border-radius: 6px;
    padding: 12px;

    .preview-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      padding: 4px 0;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-color);

      &:last-child { border-bottom: none; }

      span:last-child { color: var(--text-primary); font-variant-numeric: tabular-nums; }
    }
  }

  .dialog-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--border-color);
    display: flex;
    gap: 10px;
    justify-content: flex-end;

    .cancel-btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      transition: all 0.15s;

      &:hover { border-color: var(--text-muted); color: var(--text-primary); }
    }

    .export-btn {
      padding: 8px 20px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      background: linear-gradient(135deg, var(--brand-purple), #5a3fff);
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.15s;

      &:hover:not(:disabled) { filter: brightness(1.15); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }

      .spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
