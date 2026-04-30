<template>
  <div class="timeline-panel">
    <div class="panel-header">
      <div class="tabs">
        <div class="tab active">タイムライン</div>
        <div class="tab">グラフエディタ</div>
      </div>
    </div>
    
    <div class="timeline-content">
      <!-- Tracks List (Left side) -->
      <div class="tracks-list">
        <div class="track-header">
          <div class="controls">
            <SkipBackIcon class="icon" :size="14" />
            <PlayIcon class="icon" :size="14" />
            <SkipForwardIcon class="icon" :size="14" />
          </div>
          <div class="time-display">
            <span class="time">00:01:12</span>
            <span class="frames">00172 (60 fps)</span>
          </div>
        </div>

        <div class="track-group">
          <div class="track folder">
            <ChevronDownIcon class="icon expand" :size="14" />
            <span>モーション</span>
          </div>
          <div class="track active">
            <ChevronRightIcon class="icon expand" :size="14" />
            <span>Idle</span>
            <div class="track-tools">
              <EyeOffIcon class="icon" :size="12" />
              <span>100%</span>
              <LockIcon class="icon" :size="12" />
            </div>
          </div>
        </div>

        <div class="track-group">
          <div class="track folder">
            <ChevronDownIcon class="icon expand" :size="14" />
            <span>表情レイヤー</span>
          </div>
          <div class="track">
            <ChevronRightIcon class="icon expand" :size="14" />
            <span>笑顔</span>
            <div class="track-tools">
              <EyeOffIcon class="icon" :size="12" />
              <span>100%</span>
              <LockIcon class="icon" :size="12" />
            </div>
          </div>
          <div class="track">
            <ChevronRightIcon class="icon expand" :size="14" />
            <span>まばたき</span>
            <div class="track-tools">
              <EyeOffIcon class="icon" :size="12" />
              <span>60%</span>
              <UnlockIcon class="icon" :size="12" />
            </div>
          </div>
        </div>

        <div class="track-group">
          <div class="track folder">
            <ChevronDownIcon class="icon expand" :size="14" />
            <span>パラメータ</span>
          </div>
          <div class="track">
            <MenuIcon class="icon expand" :size="12" />
            <span>目 開閉</span>
            <div class="track-tools">
              <EyeOffIcon class="icon" :size="12" />
              <LockIcon class="icon" :size="12" />
            </div>
          </div>
          <div class="track">
            <MenuIcon class="icon expand" :size="12" />
            <span>口 開閉</span>
            <div class="track-tools">
              <EyeOffIcon class="icon" :size="12" />
              <LockIcon class="icon" :size="12" />
            </div>
          </div>
          <div class="track">
            <MenuIcon class="icon expand" :size="12" />
            <span>頭の向き X</span>
            <div class="track-tools">
              <EyeOffIcon class="icon" :size="12" />
              <LockIcon class="icon" :size="12" />
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline View (Right side) -->
      <div class="timeline-view">
        <div class="ruler">
          <div class="tick">00:00</div>
          <div class="tick active">00:01</div>
          <div class="tick">00:02</div>
          <div class="tick">00:03</div>
          <div class="tick">00:04</div>
          <div class="tick">00:05</div>
        </div>
        
        <div class="playhead" style="left: 20%;">
          <div class="head"></div>
          <div class="line"></div>
        </div>

        <div class="track-data-container">
          <!-- Motion -->
          <div class="track-data folder-pad"></div>
          <div class="track-data">
            <div class="clip purple" style="left: 0%; width: 60%;">Idle</div>
          </div>
          
          <!-- Expression -->
          <div class="track-data folder-pad"></div>
          <div class="track-data">
            <div class="clip blue" style="left: 20%; width: 50%;">笑顔</div>
          </div>
          <div class="track-data">
            <div class="clip cyan" style="left: 10%; width: 70%;">まばたき</div>
          </div>

          <!-- Parameters (Keyframes) -->
          <div class="track-data folder-pad"></div>
          <div class="track-data keyframe-track">
            <div class="keyframe" style="left: 5%"></div>
            <div class="line" style="left: 5%; width: 15%"></div>
            <div class="keyframe" style="left: 20%"></div>
            <div class="line" style="left: 20%; width: 20%"></div>
            <div class="keyframe" style="left: 40%"></div>
            <div class="line" style="left: 40%; width: 30%"></div>
            <div class="keyframe" style="left: 70%"></div>
            <div class="line" style="left: 70%; width: 20%"></div>
            <div class="keyframe" style="left: 90%"></div>
          </div>
          <div class="track-data keyframe-track">
            <div class="keyframe" style="left: 10%"></div>
            <div class="line" style="left: 10%; width: 20%"></div>
            <div class="keyframe" style="left: 30%"></div>
            <div class="line" style="left: 30%; width: 30%"></div>
            <div class="keyframe" style="left: 60%"></div>
          </div>
          <div class="track-data keyframe-track">
            <div class="keyframe" style="left: 15%"></div>
            <div class="line" style="left: 15%; width: 10%"></div>
            <div class="keyframe" style="left: 25%"></div>
            <div class="line" style="left: 25%; width: 25%"></div>
            <div class="keyframe" style="left: 50%"></div>
            <div class="line" style="left: 50%; width: 35%"></div>
            <div class="keyframe" style="left: 85%"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  SkipBack as SkipBackIcon,
  Play as PlayIcon,
  SkipForward as SkipForwardIcon,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  EyeOff as EyeOffIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  Menu as MenuIcon
} from 'lucide-vue-next';
</script>

<style scoped lang="scss">
.timeline-panel {
  height: 260px;
  background-color: var(--bg-panel);
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;

  .panel-header {
    height: 32px;
    background-color: var(--bg-panel-light);
    border-bottom: 1px solid var(--border-color);

    .tabs {
      display: flex;
      height: 100%;
      
      .tab {
        padding: 0 16px;
        display: flex;
        align-items: center;
        color: var(--text-secondary);
        font-size: 11px;
        cursor: pointer;

        &.active {
          background-color: var(--bg-panel);
          color: var(--brand-purple);
          border-top: 2px solid var(--brand-purple);
        }
      }
    }
  }

  .timeline-content {
    flex: 1;
    display: flex;
    overflow: hidden;

    .tracks-list {
      width: 280px;
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      background-color: var(--bg-panel);
      overflow-y: hidden;

      .track-header {
        height: 36px;
        display: flex;
        align-items: center;
        padding: 0 12px;
        border-bottom: 1px solid var(--border-color);
        justify-content: space-between;

        .controls {
          display: flex;
          gap: 8px;
          color: var(--text-secondary);
          
          .icon {
            cursor: pointer;
            &:hover { color: var(--text-primary); }
          }
        }

        .time-display {
          display: flex;
          align-items: baseline;
          gap: 8px;

          .time {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
          }
          .frames {
            font-size: 10px;
            color: var(--text-muted);
          }
        }
      }

      .track-group {
        display: flex;
        flex-direction: column;

        .track {
          height: 28px;
          display: flex;
          align-items: center;
          padding: 0 8px;
          color: var(--text-secondary);
          font-size: 11px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);

          &:hover { background-color: var(--bg-hover); }

          &.active {
            background-color: rgba(138, 79, 255, 0.1);
            border-left: 2px solid var(--brand-purple);
          }

          &.folder {
            font-weight: 600;
            background-color: rgba(0, 0, 0, 0.1);
          }

          .expand {
            margin-right: 4px;
            opacity: 0.6;
            cursor: pointer;
          }

          span { flex: 1; }

          .track-tools {
            display: flex;
            align-items: center;
            gap: 8px;
            opacity: 0.5;

            span { font-size: 9px; width: 30px; text-align: right; }
          }

          &:hover .track-tools { opacity: 1; }
        }
      }
    }

    .timeline-view {
      flex: 1;
      background-color: var(--bg-base);
      position: relative;
      overflow-x: auto;
      overflow-y: hidden;

      .ruler {
        height: 36px;
        border-bottom: 1px solid var(--border-color);
        background-color: var(--bg-panel);
        display: flex;
        align-items: flex-end;
        position: relative;

        .tick {
          position: absolute;
          bottom: 4px;
          font-size: 9px;
          color: var(--text-muted);
          transform: translateX(-50%);

          &::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 50%;
            width: 1px;
            height: 4px;
            background-color: var(--text-muted);
          }

          &.active {
            color: var(--text-primary);
          }

          &:nth-child(1) { left: 0%; }
          &:nth-child(2) { left: 20%; }
          &:nth-child(3) { left: 40%; }
          &:nth-child(4) { left: 60%; }
          &:nth-child(5) { left: 80%; }
          &:nth-child(6) { left: 100%; }
        }
      }

      .playhead {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 1px;
        z-index: 10;
        pointer-events: none;

        .head {
          position: absolute;
          top: 16px;
          left: -4px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background-color: var(--brand-purple);
        }
        
        .line {
          position: absolute;
          top: 24px;
          bottom: 0;
          left: 0;
          width: 1px;
          background-color: var(--brand-purple);
          opacity: 0.5;
        }
      }

      .track-data-container {
        position: relative;

        .track-data {
          height: 28px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          position: relative;
          display: flex;
          align-items: center;

          &.folder-pad {
            background-color: rgba(0, 0, 0, 0.1);
          }

          .clip {
            position: absolute;
            height: 18px;
            border-radius: 2px;
            font-size: 10px;
            display: flex;
            align-items: center;
            padding: 0 8px;
            color: white;
            font-weight: 500;

            &.purple { background-color: rgba(138, 79, 255, 0.5); border: 1px solid var(--brand-purple); }
            &.blue { background-color: rgba(0, 153, 255, 0.5); border: 1px solid #0099ff; }
            &.cyan { background-color: rgba(0, 210, 255, 0.5); border: 1px solid var(--brand-cyan); color: #000; }
          }

          &.keyframe-track {
            .keyframe {
              position: absolute;
              width: 6px;
              height: 6px;
              background-color: var(--brand-cyan);
              transform: rotate(45deg) translate(-50%, -50%);
              transform-origin: 0 0;
              top: 50%;
              z-index: 2;
            }
            .line {
              position: absolute;
              height: 1px;
              background-color: rgba(0, 210, 255, 0.2);
              top: 50%;
              z-index: 1;
            }
          }
        }
      }
    }
  }
}
</style>
