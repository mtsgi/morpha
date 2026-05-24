import type { MorphaProject, MorphaMotion, Track, Keyframe, ParameterDefinition } from './types.js';

/**
 * .morpha 再生専用フォーマット
 * - Base64 アセット等の重いデータを除去
 * - アセットは URL 参照に変換
 * - フォーマットバージョン管理
 */
export interface MorphaFormat {
  /** フォーマット識別子 */
  formatType: 'morpha';
  /** フォーマットバージョン */
  version: 1;
  /** メタ情報 */
  meta: {
    name: string;
    resolution: [number, number];
    createdAt: string;
  };
  /** パーツ定義 (アセット参照は URL) */
  parts: MorphaFormatPart[];
  /** ボーン定義 */
  bones: MorphaFormatBone[];
  /** パラメータ定義 */
  parameters: ParameterDefinition[];
  /** アニメーション */
  animations: MorphaMotion[];
  /** アセット (Base64埋め込み or 外部URL) */
  assets: MorphaFormatAsset[];
}

export interface MorphaFormatAsset {
  id: string;
  type: 'image' | 'depth_map';
  /** data: URL (埋め込み) または https:// URL (外部参照) */
  url: string;
}

export interface MorphaFormatPart {
  id: string;
  name: string;
  parentId: string | null;
  boneId?: string | null;
  type: 'folder' | 'mesh';
  visible: boolean;
  assetId?: string;
  depthAssetId?: string;
  transform: {
    position: [number, number];
    scale: [number, number];
    rotation: number;
  };
}

export interface MorphaFormatBone {
  id: string;
  name: string;
  parentId: string | null;
  position: [number, number];
  rotation: number;
  length: number;
}

/**
 * MorphaProject (.morpha_proj) を MorphaFormat (.morpha) に変換
 * アセットは dataURL のままエクスポート (埋め込みモード)
 */
export function convertToMorphaFormat(project: MorphaProject): MorphaFormat {
  const assets: MorphaFormatAsset[] = project.assets.map(a => ({
    id: a.id,
    type: a.type,
    url: a.data, // dataURL をそのまま埋め込み
  }));

  const parts: MorphaFormatPart[] = project.rig.parts.map(p => ({
    id: p.id,
    name: p.name,
    parentId: p.parentId,
    boneId: p.boneId,
    type: p.type,
    visible: p.visible,
    assetId: p.assetId,
    depthAssetId: p.depthAssetId,
    transform: p.transform,
  }));

  const bones: MorphaFormatBone[] = project.rig.bones.map(b => ({
    id: b.id,
    name: b.name,
    parentId: b.parentId,
    position: b.position,
    rotation: b.rotation,
    length: b.length,
  }));

  return {
    formatType: 'morpha',
    version: 1,
    meta: {
      name: project.meta.name,
      resolution: project.meta.resolution,
      createdAt: new Date().toISOString(),
    },
    parts,
    bones,
    parameters: project.parameters ?? [],
    animations: project.animations,
    assets,
  };
}

/**
 * JSON 文字列を MorphaFormat にパース (バリデーション付き)
 */
export function parseMorphaFormat(json: string): MorphaFormat {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON: .morphaファイルの解析に失敗しました');
  }

  const obj = raw as Record<string, unknown>;
  if (obj['formatType'] !== 'morpha') {
    throw new Error('このファイルは .morpha フォーマットではありません');
  }
  if (obj['version'] !== 1) {
    throw new Error(`未対応の .morpha バージョン: ${obj['version']}`);
  }

  return raw as MorphaFormat;
}

/**
 * MorphaFormat を JSON 文字列にシリアライズ
 */
export function serializeMorphaFormat(format: MorphaFormat): string {
  return JSON.stringify(format);
}
