<script setup lang="ts">
import { computed } from 'vue';
import { NTag } from 'naive-ui';
import DictTag from '@/components/common/DictTag.vue';
import type { AssessmentInternPathStageVo } from '@/types/app';

interface Props {
  stages: AssessmentInternPathStageVo[];
  currentStageId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  stages: () => [],
  currentStageId: ''
});

function parseColor(color?: string | null) {
  if (!color) return null;
  const value = color.trim();
  if (!value) return null;

  const shortHex = /^#([0-9a-f]{3})$/i.exec(value);
  if (shortHex) {
    const [red, green, blue] = shortHex[1].split('');
    return {
      red: parseInt(`${red}${red}`, 16),
      green: parseInt(`${green}${green}`, 16),
      blue: parseInt(`${blue}${blue}`, 16)
    };
  }

  const fullHex = /^#([0-9a-f]{6})$/i.exec(value);
  if (fullHex) {
    return {
      red: parseInt(fullHex[1].slice(0, 2), 16),
      green: parseInt(fullHex[1].slice(2, 4), 16),
      blue: parseInt(fullHex[1].slice(4, 6), 16)
    };
  }

  const rgb = /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/i.exec(value);
  if (rgb) {
    return {
      red: Math.min(255, Number(rgb[1])),
      green: Math.min(255, Number(rgb[2])),
      blue: Math.min(255, Number(rgb[3]))
    };
  }

  return null;
}

function toRgba(color: NonNullable<ReturnType<typeof parseColor>>, alpha: number) {
  return `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`;
}

function getTextColor(color: NonNullable<ReturnType<typeof parseColor>>) {
  const luminance = (color.red * 299 + color.green * 587 + color.blue * 114) / 1000;
  return luminance < 150 ? '#ffffff' : `rgb(${color.red}, ${color.green}, ${color.blue})`;
}

function calculateProgress(stage: AssessmentInternPathStageVo): number {
  if (stage.status === 'passed' || stage.status === 'ended') {
    return 100;
  }
  if (stage.status === 'in_progress') {
    const startedAt = stage.startedAt ? new Date(stage.startedAt) : null;
    const minDays = stage.minStudyDays || 0;
    if (!startedAt || !minDays) return 50;
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(100, Math.round((diffDays / minDays) * 100));
  }
  return 0;
}

const stageProgressList = computed(() =>
  props.stages.map(stage => {
    const color = parseColor(stage.stageColor);
    const progress = calculateProgress(stage);
    const isCurrent = stage.id === props.currentStageId || stage.stageId === props.currentStageId;

    return {
      ...stage,
      progress,
      color,
      isCurrent,
      progressBarStyle: color
        ? {
            background: toRgba(color, 0.2),
            fill: toRgba(color, 0.85),
            textColor: getTextColor(color)
          }
        : {
            background: 'rgb(var(--em-primary-color-rgb) / 0.2)',
            fill: 'var(--em-primary-color)',
            textColor: 'var(--em-primary-color)'
          }
    };
  })
);

function getStatusTagType(status?: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (status === 'passed' || status === 'ended') return 'success';
  if (status === 'in_progress') return 'warning';
  if (status === 'failed') return 'error';
  if (status === 'pending_review') return 'info';
  return 'default';
}
</script>

<template>
  <div class="workbench-stages-progress">
    <div class="stages-progress__track">
      <div
        v-for="stage in stageProgressList"
        :key="stage.id || stage.stageId"
        class="stage-progress-item"
        :class="{ 'stage-progress-item--current': stage.isCurrent }"
        :style="{
          '--item-progress-bg': stage.progressBarStyle.background,
          '--item-progress-fill': stage.progressBarStyle.fill,
          '--item-progress-text': stage.progressBarStyle.textColor
        }"
      >
        <div class="stage-progress-item__header">
          <span class="stage-progress-item__name">{{ stage.stageName || '未命名阶段' }}</span>
          <NTag
            size="small"
            :bordered="false"
            :type="getStatusTagType(stage.status)"
          >
            {{ stage.progress }}%
          </NTag>
        </div>
        <div class="stage-progress-item__bar">
          <div
            class="stage-progress-item__fill"
            :style="{ width: `${stage.progress}%` }"
          ></div>
        </div>
        <div class="stage-progress-item__meta">
          <DictTag
            dict-code="assessment_path_stage_status"
            :value="stage.status"
            :fallback-label="stage.status || '-'"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.workbench-stages-progress {
  padding: 16px;
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
}

.stages-progress__track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgb(var(--layout-bg-color));
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgb(var(--border-color));
    border-radius: 3px;
  }
}

.stage-progress-item {
  flex: 0 0 160px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  background: var(--item-progress-bg);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &--current {
    box-shadow:
      inset 0 0 0 1px var(--item-progress-fill),
      0 4px 12px rgb(var(--em-primary-color-rgb) / 12%);
    transform: scale(1.02);
  }
}

.stage-progress-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.stage-progress-item__name {
  color: var(--n-text-color-1);
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stage-progress-item__bar {
  height: 8px;
  border-radius: 4px;
  background: rgb(var(--border-color) / 60%);
  overflow: hidden;
}

.stage-progress-item__fill {
  height: 100%;
  border-radius: 4px;
  background: var(--item-progress-fill);
  transition: width 0.3s ease;
}

.stage-progress-item__meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

@media (width <= 960px) {
  .stage-progress-item {
    flex: 0 0 140px;
    padding: 12px;
  }
}
</style>
