import type { MorphaProject } from './types.js';

const CURRENT_FORMAT_VERSION = 1;

/**
 * プロジェクトを JSON 文字列にシリアライズ
 */
export function serializeProject(project: MorphaProject): string {
  const data: MorphaProject = {
    ...project,
    formatVersion: CURRENT_FORMAT_VERSION,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * JSON 文字列からプロジェクトをデシリアライズ（バリデーション付き）
 */
export function deserializeProject(json: string): MorphaProject {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON: プロジェクトファイルの解析に失敗しました');
  }

  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid project: プロジェクトデータがオブジェクトではありません');
  }

  const migrated = migrateProject(raw);
  validateProject(migrated);
  return migrated;
}

/**
 * バージョン間のマイグレーション
 * 古いフォーマットを段階的に最新バージョンに変換する
 */
export function migrateProject(data: unknown): MorphaProject {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid data: マイグレーション対象がオブジェクトではありません');
  }

  const obj = data as Record<string, unknown>;

  // formatVersion がない場合 → v0 (初期フォーマット) として扱い v1 へマイグレーション
  if (!('formatVersion' in obj) || obj.formatVersion === undefined) {
    obj.formatVersion = 1;
  }

  // v1 は現在の最新バージョン — そのまま返す
  if (obj.formatVersion === CURRENT_FORMAT_VERSION) {
    // parameters フィールドがない場合はデフォルトを注入（後方互換）
    if (!Array.isArray((obj as any).parameters)) {
      (obj as any).parameters = getDefaultParameters();
    }
    return obj as unknown as MorphaProject;
  }

  throw new Error(
    `Unknown format version: ${obj.formatVersion}. このバージョンはサポートされていません。`
  );
}

/**
 * デフォルトのパラメータ定義を生成
 */
function getDefaultParameters() {
  return [
    { id: 'eye_open', name: '目 開閉', group: '表情', min: 0, max: 1, defaultValue: 0.75, step: 0.01 },
    { id: 'eye_smile', name: '目 笑顔', group: '表情', min: 0, max: 1, defaultValue: 0.40, step: 0.01 },
    { id: 'brow_y', name: '眉 上下', group: '表情', min: -1, max: 1, defaultValue: 0.10, step: 0.01 },
    { id: 'brow_angle', name: '眉の角度', group: '表情', min: -1, max: 1, defaultValue: -0.20, step: 0.01 },
    { id: 'mouth_open', name: '口 開閉', group: '表情', min: 0, max: 1, defaultValue: 0.65, step: 0.01 },
    { id: 'mouth_form', name: '口 変形', group: '表情', min: -1, max: 1, defaultValue: 0.30, step: 0.01 },
    { id: 'head_x', name: '頭の向き X', group: '頭部', min: -1, max: 1, defaultValue: -0.10, step: 0.01 },
    { id: 'head_y', name: '頭の向き Y', group: '頭部', min: -1, max: 1, defaultValue: 0.30, step: 0.01 },
    { id: 'head_z', name: '頭の傾き Z', group: '頭部', min: -1, max: 1, defaultValue: 0.00, step: 0.01 },
    { id: 'body_x', name: '体の回転 X', group: '体', min: -1, max: 1, defaultValue: 0.00, step: 0.01 },
    { id: 'breath', name: '呼吸', group: '体', min: 0, max: 1, defaultValue: 0.35, step: 0.01 },
  ];
}

/**
 * プロジェクトの必須フィールドを検証
 */
function validateProject(project: MorphaProject): void {
  const errors: string[] = [];

  if (!project.version || typeof project.version !== 'string') {
    errors.push('version フィールドが不正です');
  }

  if (!project.meta || typeof project.meta !== 'object') {
    errors.push('meta フィールドが不正です');
  } else {
    if (!project.meta.name || typeof project.meta.name !== 'string') {
      errors.push('meta.name フィールドが不正です');
    }
    if (!Array.isArray(project.meta.resolution) || project.meta.resolution.length !== 2) {
      errors.push('meta.resolution フィールドが不正です');
    }
  }

  if (!Array.isArray(project.assets)) {
    errors.push('assets フィールドが配列ではありません');
  }

  if (!project.rig || typeof project.rig !== 'object') {
    errors.push('rig フィールドが不正です');
  } else {
    if (!Array.isArray(project.rig.bones)) {
      errors.push('rig.bones フィールドが配列ではありません');
    }
    if (!Array.isArray(project.rig.parts)) {
      errors.push('rig.parts フィールドが配列ではありません');
    }
  }

  if (!Array.isArray(project.animations)) {
    errors.push('animations フィールドが配列ではありません');
  }

  if (errors.length > 0) {
    throw new Error(
      `プロジェクトファイルの検証に失敗しました:\n${errors.map(e => `  - ${e}`).join('\n')}`
    );
  }
}
