import { h } from 'vue';
import { NButton } from 'naive-ui';
import type { AssessmentQuestionBo, AssessmentTaskVo } from '@/types/app';
import { fetchAssessmentQuestionExport, fetchAssessmentQuestionImport, fetchAssessmentTaskDownload, fetchAssessmentTaskList } from '@/service/api';

const NOTIFY_KEY = 'assessment-task-notified';

function readNotifiedKeys() {
  if (!import.meta.client) return [] as string[];
  try {
    return JSON.parse(localStorage.getItem(NOTIFY_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

function saveNotifiedKeys(keys: string[]) {
  if (!import.meta.client) return;
  localStorage.setItem(NOTIFY_KEY, JSON.stringify(keys.slice(-200)));
}

function buildNotifyKey(task: AssessmentTaskVo) {
  return [task.id, task.runVersion, task.status, task.updatedAt].filter(Boolean).join(':');
}

export const useAssessmentTaskStore = defineStore('assessment-task', {
  state: () => ({
    drawerVisible: false,
    tasks: [] as AssessmentTaskVo[],
    pollingTimer: null as ReturnType<typeof setInterval> | null
  }),
  getters: {
    processingCount: state => state.tasks.filter(item => item.status === 'processing').length,
    sortedTasks: state =>
      [...state.tasks].sort((left, right) => String(right.updatedAt || right.createdAt || '').localeCompare(String(left.updatedAt || left.createdAt || '')))
  },
  actions: {
    openDrawer() {
      this.drawerVisible = true;
    },
    closeDrawer() {
      this.drawerVisible = false;
    },
    toggleDrawer() {
      this.drawerVisible = !this.drawerVisible;
    },
    async fetchTasks(showNotify = true) {
      const authStore = useAuthStore();
      if (!authStore.token) {
        this.tasks = [];
        return;
      }
      const { data, error } = await fetchAssessmentTaskList();
      if (error) return;
      this.tasks = data || [];
      if (showNotify) {
        this.notifyCompletedTasks();
      }
    },
    startPolling() {
      if (!import.meta.client || this.pollingTimer) return;
      void this.fetchTasks(true);
      this.pollingTimer = window.setInterval(() => {
        void this.fetchTasks(true);
      }, 5000);
    },
    stopPolling() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
      }
    },
    notifyCompletedTasks() {
      const notifiedKeys = readNotifiedKeys();
      const appended = [...notifiedKeys];
      this.tasks.forEach(task => {
        if (!task.id || !['success', 'failed'].includes(String(task.status))) return;
        const key = buildNotifyKey(task);
        if (!key || appended.includes(key)) return;

        const isSuccess = task.status === 'success';
        const title = `${task.taskName || '任务'}${isSuccess ? '已完成' : '执行失败'}`;
        const content = task.message || task.errorMessage || (isSuccess ? '处理完成' : '处理失败');

        window.$notification?.[isSuccess ? 'success' : 'error']({
          title,
          content,
          duration: isSuccess ? 5000 : 7000,
          action:
            isSuccess && task.resultFileName
              ? () =>
                  h(
                    NButton,
                    {
                      size: 'small',
                      quaternary: true,
                      type: 'primary',
                      onClick: () => void this.downloadTask(task)
                    },
                    { default: () => '下载结果' }
                  )
              : undefined
        });

        appended.push(key);
      });
      saveNotifiedKeys(appended);
    },
    async submitQuestionImport(file: File, taskId?: string) {
      const { data, error, msg } = await fetchAssessmentQuestionImport(file, taskId);
      if (error) return null;
      window.$message?.success(msg || (taskId ? '文件已替换，任务继续执行' : '导入任务已创建'));
      await this.fetchTasks(false);
      this.openDrawer();
      return data;
    },
    async submitQuestionExport(query: AssessmentQuestionBo) {
      const { data, error, msg } = await fetchAssessmentQuestionExport(query);
      if (error) return null;
      window.$message?.success(msg || '导出任务已创建');
      await this.fetchTasks(false);
      this.openDrawer();
      return data;
    },
    async downloadTask(task: AssessmentTaskVo) {
      if (!task.id) return;
      await fetchAssessmentTaskDownload(task.id, task.resultFileName || `${task.taskName || '导出结果'}.xlsx`);
    }
  }
});
