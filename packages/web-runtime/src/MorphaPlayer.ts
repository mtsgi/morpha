import { MorphaRenderer } from './MorphaRenderer.js';
import {
  parseMorphaFormat,
  type MorphaFormat,
  type ParameterDefinition,
} from '@morpha/core';
import { evaluateAllTracks } from './interpolation.js';

export interface MorphaPlayerOptions {
  /** マウス追従の有効化 (head_x / head_y パラメータに反映) */
  mouseTracking?: boolean;
  /** マウス追従の強度 (0.0〜1.0) */
  mouseTrackingIntensity?: number;
  /** 自動ループ再生 */
  autoplay?: boolean;
  /** ループ再生 */
  loop?: boolean;
}

/**
 * Morpha Web 再生プレーヤー
 *
 * @example
 * ```html
 * <canvas id="morpha"></canvas>
 * <script type="module">
 *   import { MorphaPlayer } from '@morpha/web-runtime';
 *   const player = new MorphaPlayer(document.getElementById('morpha'));
 *   await player.load('/path/to/character.morpha');
 *   player.play('Idle');
 * </script>
 * ```
 */
export class MorphaPlayer {
  private canvas: HTMLCanvasElement;
  private renderer: MorphaRenderer;
  private format: MorphaFormat | null = null;
  private parameters: Record<string, number> = {};
  private paramDefs: ParameterDefinition[] = [];

  private isPlaying = false;
  private currentMotionName: string | null = null;
  private currentTime = 0;
  private loopEnabled: boolean;
  private lastTimestamp = 0;
  private animFrameId = 0;

  private mouseTrackingEnabled: boolean;
  private mouseTrackingIntensity: number;
  private onMotionEndCallbacks: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement, options: MorphaPlayerOptions = {}) {
    this.canvas = canvas;
    this.renderer = new MorphaRenderer(canvas);
    this.loopEnabled = options.loop ?? true;
    this.mouseTrackingEnabled = options.mouseTracking ?? false;
    this.mouseTrackingIntensity = options.mouseTrackingIntensity ?? 0.5;

    if (this.mouseTrackingEnabled) {
      this._setupMouseTracking();
    }
  }

  // -----------------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------------

  /**
   * .morpha ファイルを URL からロード
   */
  public async load(url: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    const json = await res.text();
    return this._applyFormat(parseMorphaFormat(json));
  }

  /**
   * .morpha ファイル (File オブジェクト) からロード
   */
  public async loadFromFile(file: File): Promise<void> {
    const json = await file.text();
    return this._applyFormat(parseMorphaFormat(json));
  }

  /**
   * JSON 文字列から直接ロード
   */
  public loadFromJSON(json: string): void {
    this._applyFormat(parseMorphaFormat(json));
  }

  private async _applyFormat(format: MorphaFormat): Promise<void> {
    this.format = format;
    this.paramDefs = format.parameters ?? [];

    // パラメータ初期化
    this.parameters = {};
    for (const def of this.paramDefs) {
      this.parameters[def.id] = def.defaultValue;
    }

    // プロジェクト互換オブジェクトに変換して Renderer に渡す
    const projectLike = {
      rig: {
        parts: format.parts,
        bones: format.bones,
      },
      assets: format.assets.map(a => ({
        id: a.id,
        type: a.type,
        data: a.url,
      })),
    };
    this.renderer.syncProject(projectLike);

    // 最初のモーションを自動再生
    if (format.animations.length > 0) {
      this._startLoop();
    }
  }

  // -----------------------------------------------------------------------
  // Playback
  // -----------------------------------------------------------------------

  /**
   * 再生開始
   * @param motionName モーション名 (省略時は最初のモーション)
   */
  public play(motionName?: string): void {
    if (!this.format) return;

    const target = motionName
      ? this.format.animations.find(a => a.name === motionName)
      : this.format.animations[0];

    if (!target) {
      console.warn(`[MorphaPlayer] Motion "${motionName}" not found`);
      return;
    }

    this.currentMotionName = target.name;
    this.currentTime = 0;
    this.isPlaying = true;
    this._startLoop();
  }

  /**
   * 一時停止
   */
  public pause(): void {
    this.isPlaying = false;
  }

  /**
   * 停止 (先頭に戻る)
   */
  public stop(): void {
    this.isPlaying = false;
    this.currentTime = 0;
    this.currentMotionName = null;
  }

  /**
   * 特定時刻にシーク
   */
  public seekTo(time: number): void {
    this.currentTime = Math.max(0, time);
  }

  // -----------------------------------------------------------------------
  // Parameters
  // -----------------------------------------------------------------------

  /**
   * パラメータ値を設定
   */
  public setParameter(id: string, value: number): void {
    this.parameters[id] = value;
  }

  /**
   * パラメータ値を取得
   */
  public getParameter(id: string): number {
    return this.parameters[id] ?? 0;
  }

  /**
   * マウス位置に応じて head_x / head_y を更新 ([-1, 1] 範囲)
   * @param x ビューポート内 X 座標 (0〜canvas.width)
   * @param y ビューポート内 Y 座標 (0〜canvas.height)
   */
  public setLookAt(x: number, y: number): void {
    const nx = ((x / this.canvas.width) * 2 - 1) * this.mouseTrackingIntensity;
    const ny = -((y / this.canvas.height) * 2 - 1) * this.mouseTrackingIntensity;
    this.parameters['head_x'] = Math.max(-1, Math.min(1, nx));
    this.parameters['head_y'] = Math.max(-1, Math.min(1, ny));
  }

  // -----------------------------------------------------------------------
  // Events
  // -----------------------------------------------------------------------

  /**
   * モーション終了時コールバックを登録
   */
  public onMotionEnd(callback: () => void): void {
    this.onMotionEndCallbacks.push(callback);
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /**
   * リソースを解放し rAF ループを停止
   */
  public dispose(): void {
    this.isPlaying = false;
    cancelAnimationFrame(this.animFrameId);
    if (this.mouseTrackingEnabled) {
      this.canvas.removeEventListener('mousemove', this._onMouseMove);
    }
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private _startLoop(): void {
    cancelAnimationFrame(this.animFrameId);
    this.lastTimestamp = 0;
    const loop = (ts: number) => {
      if (this.lastTimestamp === 0) this.lastTimestamp = ts;
      const dt = (ts - this.lastTimestamp) / 1000;
      this.lastTimestamp = ts;

      this._update(dt);
      this._draw();

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private _update(dt: number): void {
    if (!this.format || !this.currentMotionName) return;

    const motion = this.format.animations.find(a => a.name === this.currentMotionName);
    if (!motion) return;

    if (this.isPlaying) {
      this.currentTime += dt;

      // ループ / 終了処理
      if (this.currentTime >= motion.duration) {
        if (this.loopEnabled) {
          this.currentTime = this.currentTime % motion.duration;
        } else {
          this.currentTime = motion.duration;
          this.isPlaying = false;
          this.onMotionEndCallbacks.forEach(cb => cb());
        }
      }
    }

    // トラックを評価してパラメータに反映
    const evaluated = evaluateAllTracks(motion.tracks, this.currentTime);
    for (const [id, value] of Object.entries(evaluated)) {
      this.parameters[id] = value;
    }

    // パラメータを Renderer に送信
    this.renderer.updateParameters(this.parameters);
  }

  private _draw(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.renderer.resize(w, h);
    }
    this.renderer.render();
  }

  private _onMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.setLookAt(e.clientX - rect.left, e.clientY - rect.top);
  };

  private _setupMouseTracking(): void {
    this.canvas.addEventListener('mousemove', this._onMouseMove);
  }
}
