import type { Keyframe, Track } from '@morpha/core';

/**
 * 線形補間
 */
export function interpolateLinear(v0: number, v1: number, t: number): number {
  return v0 + (v1 - v0) * t;
}

/**
 * ステップ補間（前のキーフレームの値を維持）
 */
export function interpolateStep(v0: number, _v1: number, _t: number): number {
  return v0;
}

/**
 * 3次ベジエ補間
 * controlPoints: [p1x, p1y, p2x, p2y] (CSS cubic-bezier 形式)
 */
export function interpolateBezier(
  v0: number,
  v1: number,
  t: number,
  controlPoints: [number, number, number, number]
): number {
  const [p1x, p1y, p2x, p2y] = controlPoints;
  // t を cubic-bezier でイージングしてから線形補間
  const easedT = solveCubicBezier(p1x, p1y, p2x, p2y, t);
  return v0 + (v1 - v0) * easedT;
}

/**
 * Cubic Bezier のイージング値を計算
 * Newton-Raphson 法で x から t を求め、対応する y を返す
 */
function solveCubicBezier(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  x: number
): number {
  // x=0 or x=1 のエッジケース
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  let t = x; // 初期推定

  // Newton-Raphson iterations
  for (let i = 0; i < 8; i++) {
    const bx = cubicBezierSample(p1x, p2x, t);
    const dx = x - bx;
    if (Math.abs(dx) < 1e-6) break;
    const derivative = cubicBezierDerivative(p1x, p2x, t);
    if (Math.abs(derivative) < 1e-6) break;
    t += dx / derivative;
  }

  // t をクランプ
  t = Math.max(0, Math.min(1, t));

  return cubicBezierSample(p1y, p2y, t);
}

function cubicBezierSample(p1: number, p2: number, t: number): number {
  // B(t) = 3(1-t)^2*t*p1 + 3(1-t)*t^2*p2 + t^3
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  return 3 * mt2 * t * p1 + 3 * mt * t2 * p2 + t3;
}

function cubicBezierDerivative(p1: number, p2: number, t: number): number {
  const mt = 1 - t;
  return 3 * mt * mt * p1 + 6 * mt * t * (p2 - p1) + 3 * t * t * (1 - p2);
}

/**
 * 2つのキーフレーム間を補間
 */
export function interpolateKeyframes(k0: Keyframe, k1: Keyframe, time: number): number {
  if (time <= k0.time) return k0.value;
  if (time >= k1.time) return k1.value;

  const t = (time - k0.time) / (k1.time - k0.time);
  const curve = k0.curve ?? 'linear';

  if (curve === 'step') {
    return interpolateStep(k0.value, k1.value, t);
  } else if (curve === 'linear') {
    return interpolateLinear(k0.value, k1.value, t);
  } else if (Array.isArray(curve)) {
    return interpolateBezier(k0.value, k1.value, t, curve);
  }

  return interpolateLinear(k0.value, k1.value, t);
}

/**
 * トラック上の任意時刻における値を算出
 */
export function evaluateTrack(track: Track, time: number): number | null {
  const keyframes = track.keyframes;
  if (keyframes.length === 0) return null;
  if (keyframes.length === 1) return keyframes[0].value;

  // 時刻でソート済みを前提（前から順にチェック）
  if (time <= keyframes[0].time) return keyframes[0].value;
  if (time >= keyframes[keyframes.length - 1].time) {
    return keyframes[keyframes.length - 1].value;
  }

  // 前後のキーフレームを探す
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
      return interpolateKeyframes(keyframes[i], keyframes[i + 1], time);
    }
  }

  return keyframes[keyframes.length - 1].value;
}

/**
 * 全トラックを評価して、パラメータマップを返す
 */
export function evaluateAllTracks(
  tracks: Track[],
  time: number
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const track of tracks) {
    const value = evaluateTrack(track, time);
    if (value !== null) {
      result[track.parameterId] = value;
    }
  }
  return result;
}
