<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { CloudUploadOutline, DownloadOutline, RefreshOutline } from '@vicons/ionicons5';
import { NBadge, NButton, NDrawer, NDrawerContent, NEmpty, NIcon, NProgress, NSpace, NTag, NUpload } from 'naive-ui';
import type { UploadCustomRequestOptions } from 'naive-ui';
import type { AssessmentTaskVo } from '@/types/app';

const taskStore = useAssessmentTaskStore();

const tasks = computed(() => taskStore.sortedTasks);
const processingCount = computed(() => taskStore.processingCount);

onMounted(() => {
  taskStore.startPolling();
});

onBeforeUnmount(() => {
  taskStore.stopPolling();
});

function resolveTaskStatusType(status?: string) {
  switch (status) {
    case 'processing':
      return 'warning';
    case 'success':
      return 'success';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
}

function resolveTaskStatusText(status?: string) {
  switch (status) {
    case 'processing':
      return '进行中';
    case 'success':
      return '已完成';
    case 'failed':
      return '失败';
    default:
      return '待处理';
  }
}

function canReplaceUpload(task: AssessmentTaskVo) {
  return task.bizType === 'assessment_question' && task.taskType === 'import' && task.status !== 'success';
}

async function handleReplaceUpload(task: AssessmentTaskVo, options: UploadCustomRequestOptions) {
  const file = options.file.file;
  if (!(file instanceof File)) {
    options.onError?.();
    return;
  }
  const result = await taskStore.submitQuestionImport(file, task.id);
  if (result) {
    options.onFinish?.();
  } else {
    options.onError?.();
  }
}

async function handleRefresh() {
  await taskStore.fetchTasks(false);
}
</script>

<template>
  <NBadge :value="processingCount || undefined" :max="99" :show-zero="false">
    <NButton quaternary circle title="导入导出任务" @click="taskStore.toggleDrawer()">
      <template #icon>
        <NIcon><CloudUploadOutline /></NIcon>
      </template>
    </NButton>
  </NBadge>

  <NDrawer v-model:show="taskStore.drawerVisible" :width="420" placement="right">
    <NDrawerContent title="导入导出任务" closable>
      <template #header-extra>
        <NButton quaternary circle title="刷新" @click="handleRefresh">
          <template #icon>
            <NIcon><RefreshOutline /></NIcon>
          </template>
        </NButton>
      </template>

      <div v-if="tasks.length" class="task-list">
        <div v-for="task in tasks" :key="task.id" class="task-item">
          <div class="task-item__header">
            <div class="task-item__title">
              <span>{{ task.taskName || '任务' }}</span>
              <NTag size="small" :bordered="false" :type="resolveTaskStatusType(task.status)">
                {{ resolveTaskStatusText(task.status) }}
              </NTag>
            </div>
            <div class="task-item__time">{{ task.updatedAt || task.createdAt || '-' }}</div>
          </div>

          <div class="task-item__meta">
            <span>类型：{{ task.taskType === 'import' ? '导入' : '导出' }}</span>
            <span v-if="task.fileName">文件：{{ task.fileName }}</span>
            <span v-if="task.totalCount != null">总数：{{ task.totalCount }}</span>
          </div>

          <div v-if="task.status === 'processing'" class="task-item__progress">
            <NProgress
              type="line"
              :percentage="Number(task.progress || 0)"
              :show-indicator="false"
              :height="8"
              color="var(--em-primary-color)"
              rail-color="rgb(var(--em-primary-color-rgb) / 0.14)"
              processing
            />
            <span class="task-item__progress-text">{{ task.progress || 0 }}%</span>
          </div>

          <div class="task-item__summary">
            <span v-if="task.successCount != null">成功 {{ task.successCount || 0 }}</span>
            <span v-if="task.failCount != null">失败 {{ task.failCount || 0 }}</span>
            <span>{{ task.message || task.errorMessage || '-' }}</span>
          </div>

          <div v-if="task.errorMessage" class="task-item__error">{{ task.errorMessage }}</div>

          <NSpace justify="end" :size="12" class="task-item__actions">
            <NUpload
              v-if="canReplaceUpload(task)"
              :show-file-list="false"
              accept=".xls,.xlsx"
              :custom-request="options => handleReplaceUpload(task, options)"
            >
              <NButton size="small">
                {{ task.status === 'processing' ? '替换文件' : '重新上传' }}
              </NButton>
            </NUpload>

            <NButton v-if="task.status === 'success' && task.resultFileName" size="small" type="primary" @click="taskStore.downloadTask(task)">
              <template #icon>
                <NIcon><DownloadOutline /></NIcon>
              </template>
              下载结果
            </NButton>
          </NSpace>
        </div>
      </div>

      <NEmpty v-else description="暂无导入导出任务" />
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped lang="scss">
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  padding: 14px;
  border-radius: 14px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 85%);
}

.task-item__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.task-item__title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-weight: 600;
}

.task-item__time {
  color: var(--n-text-color-3);
  font-size: 12px;
  white-space: nowrap;
}

.task-item__meta,
.task-item__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 10px;
  color: var(--n-text-color-2);
  font-size: 13px;
}

.task-item__progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.task-item__progress :deep(.n-progress) {
  flex: 1;
}

.task-item__progress-text {
  min-width: 40px;
  color: var(--em-primary-color);
  font-weight: 600;
  text-align: right;
}

.task-item__error {
  margin-top: 10px;
  color: var(--n-error-color);
  font-size: 12px;
  line-height: 1.6;
}

.task-item__actions {
  margin-top: 12px;
}
</style>
