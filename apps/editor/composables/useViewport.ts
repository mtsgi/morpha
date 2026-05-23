import { ref, computed, type Ref } from 'vue';
import type { Vector2 } from '@morpha/core';

export interface ViewportState {
  /** ズーム倍率 (0.1 ~ 10.0) */
  zoom: Ref<number>;
  /** パンオフセット (px) */
  pan: Ref<Vector2>;
  /** ズーム率テキスト (e.g. "100%") */
  zoomPercent: Ref<string>;
  /** カーソル位置を中心にズーム */
  zoomAtPoint: (delta: number, screenX: number, screenY: number, containerRect: DOMRect) => void;
  /** ズーム率を変更 */
  setZoom: (value: number) => void;
  /** パンを相対移動 */
  panBy: (dx: number, dy: number) => void;
  /** コンテンツにフィット */
  fitToContent: (containerWidth: number, containerHeight: number) => void;
  /** リセット */
  reset: () => void;
  /** スクリーン座標 → ワールド座標変換 */
  screenToWorld: (screenX: number, screenY: number, containerRect: DOMRect) => Vector2;
  /** ワールド座標 → スクリーン座標変換 */
  worldToScreen: (worldX: number, worldY: number, containerRect: DOMRect) => Vector2;
  /** ビューポート行列を Float32Array として取得 (3x3) */
  getViewMatrix: () => Float32Array;
}

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 10.0;
const ZOOM_SPEED = 0.001;

export function useViewport(): ViewportState {
  const zoom = ref(1.0);
  const pan = ref<Vector2>([0, 0]);

  const zoomPercent = computed(() => `${Math.round(zoom.value * 100)}%`);

  function clampZoom(v: number): number {
    return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, v));
  }

  function zoomAtPoint(delta: number, screenX: number, screenY: number, containerRect: DOMRect) {
    const oldZoom = zoom.value;
    const newZoom = clampZoom(oldZoom * (1 - delta * ZOOM_SPEED));

    // ズーム中心をカーソル位置にするためのパン補正
    const cx = screenX - containerRect.left - containerRect.width / 2;
    const cy = screenY - containerRect.top - containerRect.height / 2;

    const scale = newZoom / oldZoom;
    pan.value = [
      pan.value[0] * scale + cx * (1 - scale),
      pan.value[1] * scale + cy * (1 - scale),
    ];

    zoom.value = newZoom;
  }

  function setZoom(value: number) {
    zoom.value = clampZoom(value);
  }

  function panBy(dx: number, dy: number) {
    pan.value = [pan.value[0] + dx, pan.value[1] + dy];
  }

  function fitToContent(containerWidth: number, containerHeight: number) {
    zoom.value = 1.0;
    pan.value = [0, 0];
  }

  function reset() {
    zoom.value = 1.0;
    pan.value = [0, 0];
  }

  function screenToWorld(screenX: number, screenY: number, containerRect: DOMRect): Vector2 {
    const cx = containerRect.width / 2;
    const cy = containerRect.height / 2;
    const scale = Math.min(containerRect.width, containerRect.height) * 0.75 * zoom.value;

    const wx = (screenX - containerRect.left - cx - pan.value[0]) / scale;
    const wy = -(screenY - containerRect.top - cy - pan.value[1]) / scale; // Y反転
    return [wx, wy];
  }

  function worldToScreen(worldX: number, worldY: number, containerRect: DOMRect): Vector2 {
    const cx = containerRect.width / 2;
    const cy = containerRect.height / 2;
    const scale = Math.min(containerRect.width, containerRect.height) * 0.75 * zoom.value;

    const sx = cx + worldX * scale + pan.value[0];
    const sy = cy - worldY * scale + pan.value[1]; // Y反転
    return [sx, sy];
  }

  function getViewMatrix(): Float32Array {
    // 3x3 行列 (列優先)
    // [zoom,   0,     0  ]
    // [0,      zoom,  0  ]
    // [panX,   panY,  1  ]
    const m = new Float32Array(9);
    m[0] = zoom.value;
    m[1] = 0;
    m[2] = 0;
    m[3] = 0;
    m[4] = zoom.value;
    m[5] = 0;
    // パンをNDC空間に変換 (px → [-1, 1] 範囲)
    m[6] = 0; // パンは投影行列側で処理するためここでは 0
    m[7] = 0;
    m[8] = 1;
    return m;
  }

  return {
    zoom,
    pan,
    zoomPercent,
    zoomAtPoint,
    setZoom,
    panBy,
    fitToContent,
    reset,
    screenToWorld,
    worldToScreen,
    getViewMatrix,
  };
}
