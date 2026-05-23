export type Vector2 = [number, number];

// .morpha_proj (エディタ作業用ファイル)
export interface MorphaProject {
  formatVersion: 1;  // ファイルフォーマットバージョン（マイグレーション用）
  version: string; // e.g., "1.0.0"
  meta: { name: string; resolution: Vector2 };
  assets: Asset[]; // 画像データ(Base64)等
  rig: RigData;
  animations: MorphaMotion[];
  parameters: ParameterDefinition[]; // パラメータ定義
}

export interface ParameterDefinition {
  id: string;
  name: string;
  group: string;           // グループ名（"表情", "頭部", "体" 等）
  min: number;
  max: number;
  defaultValue: number;
  step: number;            // スライダーのステップ値
  linkedBoneId?: string;   // ボーン自動バインド用
  linkedProperty?: 'rotation' | 'positionX' | 'positionY'; // バインド先プロパティ
}

export interface Asset {
  id: string;
  type: "image" | "depth_map";
  data: string; // Base64 encoded string
}

export interface RigData {
  bones: Bone[];
  parts: Part[]; // 画像やメッシュの階層
  // 深度マップの設定値など
  depthSettings?: { intensity: number };
}

export interface Part {
  id: string;
  name: string;
  parentId: string | null; // 親の Part または Root
  boneId?: string | null; // バインドされている Bone (オプショナル)
  type: 'folder' | 'mesh';
  visible: boolean;
  locked: boolean;
  assetId?: string; // アセットへの参照
  depthAssetId?: string; // 深度マップアセットへの参照
  transform: {
    position: Vector2;
    scale: Vector2;
    rotation: number; // radians
  };
}

export interface Bone {
  id: string;
  name: string;
  parentId: string | null;
  position: Vector2;
  rotation: number;
  length: number; // ボーンの長さ（子ボーンへの接続方向を示す）
}

// .morphamotion (モーションデータ)
export interface MorphaMotion {
  name: string;
  duration: number; // seconds
  fps: number;
  tracks: Track[];
}

export interface Track {
  parameterId: string; // e.g., "Bone_Arm_L_Rot", "Depth_Face_X"
  keyframes: Keyframe[];
}

export interface Keyframe {
  time: number;
  value: number;
  curve?: "linear" | "step" | [number, number, number, number]; // Bezier points
}
