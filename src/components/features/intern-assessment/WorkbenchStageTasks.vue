<script setup lang="ts">
import { computed } from 'vue';
import { NButton, NEmpty, NTag } from 'naive-ui';
import DictTag from '@/components/common/DictTag.vue';
import InfoGridCard from '@/components/common/InfoGridCard.vue';
import type { AssessmentInternPathStageVo, AssessmentStageVo } from '@/types/app';

interface Props {
  stage: AssessmentInternPathStageVo | null;
  stageDetail: AssessmentStageVo | null;
}

const props = withDefaults(defineProps<Props>(), {
  stage: null,
  stageDetail: null
});

const stageInfoItems = computed(() => {
  if (!props.stage) return [];

  const items = [
    {
      label: '阶段状态',
      dictCode: 'assessment_path_stage_status',
      dictValue: props.stage.status
    },
    {
      label: '时间状态',
      dictCode: 'assessment_stage_timing_status',
      dictValue: props.stage.timingStatus
    },
    {
      label: '学习区间',
      text: formatStudyDaysRange(props.stage.minStudyDays, props.stage.maxStudyDays)
    }
  ];

  if (props.stage.startedAt) {
    items.push({
      label: '开始时间',
      text: props.stage.startedAt?.slice(0, 10) || '-'
    });
  }

  if (props.stage.endedAt) {
    items.push({
      label: '结束时间',
      text: props.stage.endedAt?.slice(0, 10) || '-'
    });
  }

  if (props.stage.rating) {
    items.push({
      label: '阶段评级',
      text: props.stage.rating
    });
  }

  return items;
});

const learningTasks = computed(() =>
  (props.stageDetail?.materials || []).map(item => ({
    id: item.id,
    title: item.title || '未命名资料',
    type: 'material' as const,
    typeLabel: item.materialType || '学习资料',
    url: item.materialUrl,
    remark: item.remark
  }))
);

const assessmentTasks = computed(() =>
  (props.stageDetail?.rules || []).map(item => ({
    id: item.id,
    title: `${item.questionType || '考核'}-${item.difficulty || '未知难度'}`,
    type: 'assessment' as const,
    typeLabel: item.questionType || '考核',
    difficulty: item.difficulty,
    questionCount: item.questionCount,
    score: item.score
  }))
);

function formatStudyDaysRange(min?: number | null, max?: number | null) {
  if (min == null && max == null) return '未配置';
  if (min != null && max != null) return `${min}-${max}天`;
  if (min != null) return `不少于 ${min} 天`;
  return `不超过 ${max} 天`;
}

function openMaterial(url?: string | null) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function getDifficultyTagType(difficulty?: string): 'default' | 'success' | 'warning' | 'error' {
  if (difficulty === '简单') return 'success';
  if (difficulty === '中等') return 'warning';
  if (difficulty === '困难' || difficulty === '困难') return 'error';
  return 'default';
}
</script>

<template>
  <div class="workbench-stage-tasks">
    <div class="stage-tasks__section">
      <div class="stage-tasks__section-title">当前阶段信息</div>
      <InfoGridCard
        v-if="stageInfoItems.length"
        :items="stageInfoItems"
        :columns="2"
      />
      <NEmpty v-else description="暂无阶段信息" />
    </div>

    <div v-if="learningTasks.length" class="stage-tasks__section">
      <div class="stage-tasks__section-title">
        <span>学习任务</span>
        <NTag size="small" :bordered="false" type="primary">{{ learningTasks.length }}</NTag>
      </div>
      <div class="task-list">
        <div
          v-for="task in learningTasks"
          :key="task.id"
          class="task-item task-item--material"
        >
          <div class="task-item__main">
            <div class="task-item__header">
              <NTag size="small" :bordered="false" type="info">{{ task.typeLabel }}</NTag>
              <span class="task-item__title">{{ task.title }}</span>
            </div>
            <div v-if="task.remark" class="task-item__remark">{{ task.remark }}</div>
          </div>
          <NButton
            v-if="task.url"
            size="small"
            secondary
            @click="openMaterial(task.url)"
          >
            查看
          </NButton>
        </div>
      </div>
    </div>

    <div v-if="assessmentTasks.length" class="stage-tasks__section">
      <div class="stage-tasks__section-title">
        <span>考核任务</span>
        <NTag size="small" :bordered="false" type="warning">{{ assessmentTasks.length }}</NTag>
      </div>
      <div class="task-list">
        <div
          v-for="task in assessmentTasks"
          :key="task.id"
          class="task-item task-item--assessment"
        >
          <div class="task-item__main">
            <div class="task-item__header">
              <NTag size="small" :bordered="false" type="warning">{{ task.typeLabel }}</NTag>
              <NTag
                v-if="task.difficulty"
                size="small"
                :bordered="false"
                :type="getDifficultyTagType(task.difficulty)"
              >
                {{ task.difficulty }}
              </NTag>
              <span class="task-item__title">{{ task.title }}</span>
            </div>
            <div class="task-item__meta">
              <span v-if="task.questionCount">题量：{{ task.questionCount }}</span>
              <span v-if="task.score">总分：{{ task.score }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <NEmpty
      v-if="!learningTasks.length && !assessmentTasks.length"
      description="暂无任务列表"
    />
  </div>
</template>

<style scoped lang="scss">
.workbench-stage-tasks {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
}

.stage-tasks__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stage-tasks__section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--n-text-color-1);
  font-size: 14px;
  font-weight: 600;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 82%);

  &--material {
    border-left: 3px solid rgb(var(--em-primary-color-rgb) / 0.6);
  }

  &--assessment {
    border-left: 3px solid rgb(208 48 80 / 0.5);
  }
}

.task-item__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-item__header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.task-item__title {
  color: var(--n-text-color-1);
  font-size: 13px;
  font-weight: 600;
}

.task-item__remark {
  color: var(--n-text-color-3);
  font-size: 12px;
}

.task-item__meta {
  display: flex;
  gap: 12px;
  color: var(--n-text-color-3);
  font-size: 12px;
}

@media (width <= 960px) {
  .task-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
