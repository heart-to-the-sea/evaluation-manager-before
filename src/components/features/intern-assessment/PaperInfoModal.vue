<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NInput,
  NModal,
  NScrollbar,
  NSpin,
  NSwitch,
  NTag
} from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import { useDict } from '@/composables/use-dict';
import { fetchAssessmentPaperById, fetchAssessmentPaperRegenerate, fetchAssessmentPaperReview } from '@/service/api';
import type { AssessmentPaperItemVo, AssessmentPaperReviewBo, AssessmentPaperVo } from '@/types/app';

type ReviewQuestionItem = AssessmentPaperItemVo & {
  showStem?: boolean;
  showAnswer?: boolean;
  showAnalysis?: boolean;
};

type ReviewPaperDetail = Omit<AssessmentPaperVo, 'items'> & {
  items?: ReviewQuestionItem[];
};

interface Props {
  show: boolean;
  paperId?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  paperId: null
});

const emit = defineEmits<{
  close: [];
  refresh: [];
}>();

const loading = ref(false);
const saving = ref(false);
const submitting = ref(false);
const regenerating = ref(false);
const detail = ref<ReviewPaperDetail | null>(null);
const passFlag = ref(false);
const finalComment = ref('');

const paperStatusDict = useDict('assessment_paper_status');
const questionTypeDict = useDict('assessment_question_type');
const difficultyDict = useDict('assessment_question_difficulty');

const title = computed(() => {
  if (!detail.value) return '考核记录';
  const stageName = detail.value.stageName || '未命名阶段';
  const userName = detail.value.userName || '实习生';
  return `${userName} - ${stageName}`;
});

watch(
  () => [props.show, props.paperId] as const,
  ([visible]) => {
    if (visible) {
      loadDetail();
    } else {
      detail.value = null;
      passFlag.value = false;
      finalComment.value = '';
    }
  },
  { immediate: true }
);

async function loadDetail() {
  if (!props.show || !props.paperId) {
    detail.value = null;
    return;
  }

  loading.value = true;
  try {
    const { data, error } = await fetchAssessmentPaperById(props.paperId);
    if (error || !data) {
      detail.value = null;
      return;
    }

    detail.value = {
      ...data,
      items: (data.items || []).map((item, index) => ({
        ...item,
        studentAnswer: item.studentAnswer || '',
        manualResult: item.manualResult || item.finalResult || '',
        reviewComment: item.reviewComment || '',
        showStem: index === 0,
        showAnswer: false,
        showAnalysis: false
      }))
    };
    passFlag.value = Boolean(data.passFlag);
    finalComment.value = data.finalComment || '';
  } finally {
    loading.value = false;
  }
}

async function submitReview(submitFlag: boolean) {
  if (!detail.value?.id) {
    return;
  }

  const payload: AssessmentPaperReviewBo = {
    paperId: detail.value.id,
    submitFlag,
    passFlag: submitFlag ? passFlag.value : undefined,
    finalComment: finalComment.value || undefined,
    items: (detail.value.items || []).map(item => ({
      id: item.id,
      studentAnswer: item.studentAnswer || undefined,
      manualResult: item.manualResult || undefined,
      reviewComment: item.reviewComment || undefined
    }))
  };

  if (submitFlag) {
    submitting.value = true;
  } else {
    saving.value = true;
  }
  try {
    const { error } = await fetchAssessmentPaperReview(payload);
    if (error) {
      return;
    }

    window.$message?.success(submitFlag ? '考核记录已提交批阅' : '考核记录已保存');
    await loadDetail();
    emit('refresh');
  } finally {
    if (submitFlag) {
      submitting.value = false;
    } else {
      saving.value = false;
    }
  }
}

function handleSaveDraft() {
  submitReview(false);
}

function handleSubmitReview() {
  submitReview(true);
}

function getStatusType(status?: string): 'default' | 'success' | 'warning' {
  return status === 'reviewed' ? 'success' : status ? 'warning' : 'default';
}

function getPassType(status?: string, pass?: boolean): 'default' | 'success' | 'error' | 'warning' {
  if (status === 'pending_review') return 'warning';
  if (pass === true) return 'success';
  if (pass === false) return 'error';
  return 'warning';
}

function getPassText(status?: string, pass?: boolean) {
  if (status === 'pending_review') return '待批阅';
  if (pass === true) return '通过';
  if (pass === false) return '未通过';
  return '待判定';
}

function getOptions(item: AssessmentPaperItemVo) {
  if (item.options?.length) {
    return item.options;
  }

  if (!item.optionSnapshot) {
    return [];
  }

  try {
    const parsed = JSON.parse(item.optionSnapshot);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function handleClose() {
  emit('close');
}

function toggleQuestionPanel(item: ReviewQuestionItem, field: 'showStem' | 'showAnswer' | 'showAnalysis') {
  item[field] = !item[field];
}

async function handleRegenerate() {
  if (!detail.value?.id) {
    return;
  }

  const currentPaperId = detail.value.id;
  regenerating.value = true;
  try {
    const { data, error } = await fetchAssessmentPaperRegenerate({ paperId: currentPaperId });
    if (error) {
      return;
    }

    window.$message?.success('考核试卷已重新生成');
    if (data && data !== currentPaperId) {
      emit('refresh');
      emit('close');
      return;
    }
    await loadDetail();
    emit('refresh');
  } finally {
    regenerating.value = false;
  }
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="title"
    :style="{ width: '1040px', maxWidth: 'calc(100vw - 32px)' }"
    class="paper-info-modal"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <NSpin :show="loading || saving || submitting || regenerating">
      <NEmpty v-if="!detail" description="暂无考核记录" />

      <NScrollbar v-else class="paper-info-modal__scroll">
        <div class="paper-info-modal__content">
          <NDescriptions bordered label-placement="left" :column="2">
            <NDescriptionsItem label="实习生">{{ detail.userName || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="考核阶段">{{ detail.stageName || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="试卷状态">
              <NTag :bordered="false" :type="getStatusType(detail.status)">
                {{ paperStatusDict.getLabel(detail.status) || '-' }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem label="考核结果">
              <NTag :bordered="false" :type="getPassType(detail.status, detail.passFlag)">
                {{ getPassText(detail.status, detail.passFlag) }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem label="题目总数">{{ detail.questionTotal ?? 0 }}</NDescriptionsItem>
            <NDescriptionsItem label="答对题数">{{ detail.correctTotal ?? 0 }}</NDescriptionsItem>
            <NDescriptionsItem label="当前得分">{{ detail.score ?? '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="批阅时间">{{ detail.reviewedAt || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="创建时间">{{ detail.createdAt || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="更新时间">{{ detail.updatedAt || '-' }}</NDescriptionsItem>
          </NDescriptions>

          <div class="paper-result">
            <div class="paper-result__header">
              <div class="paper-result__title">整卷结论</div>
              <div class="paper-result__switch">
                <span>是否通过</span>
                <NSwitch v-model:value="passFlag" />
              </div>
            </div>
            <NInput v-model:value="finalComment" type="textarea" :rows="3" placeholder="请输入整卷评语" />
          </div>

          <div v-if="detail.items?.length" class="question-list">
            <div v-for="(item, index) in detail.items" :key="item.id || index" class="question-card">
              <div class="question-card__header">
                <div class="question-card__title">
                  <span>第 {{ index + 1 }} 题</span>
                  <span class="question-card__knowledge">{{ item.knowledgePoint || '未设置知识点' }}</span>
                </div>
                <div class="question-card__tags">
                  <NTag :bordered="false" type="info">{{ questionTypeDict.getLabel(item.questionType) || '-' }}</NTag>
                  <NTag :bordered="false" type="warning">{{ difficultyDict.getLabel(item.difficulty) || '-' }}</NTag>
                  <NTag :bordered="false" type="success">分值 {{ item.score ?? 0 }}</NTag>
                  <NTag :bordered="false" type="default">自动判题 {{ item.autoCorrect == null ? '-' : item.autoCorrect ? '正确' : '错误' }}</NTag>
                </div>
              </div>

              <div class="question-card__toolbar">
                <NButton size="tiny" secondary :type="item.showStem ? 'primary' : 'default'" @click="toggleQuestionPanel(item, 'showStem')">
                  题目描述
                </NButton>
                <NButton size="tiny" secondary :type="item.showAnswer ? 'primary' : 'default'" @click="toggleQuestionPanel(item, 'showAnswer')">
                  答案
                </NButton>
                <NButton size="tiny" secondary :type="item.showAnalysis ? 'primary' : 'default'" @click="toggleQuestionPanel(item, 'showAnalysis')">
                  解析
                </NButton>
              </div>

              <div v-if="item.showStem || item.showAnswer || item.showAnalysis" class="question-card__panels">
                <div v-if="item.showStem" class="question-card__panel">
                  <div class="question-card__panel-title">题目描述</div>
                  <div class="question-card__stem">{{ item.stem || '-' }}</div>

                  <div v-if="getOptions(item).length" class="question-card__options">
                    <div v-for="option in getOptions(item)" :key="option.id || option.optionKey" class="question-option">
                      {{ option.optionKey }}. {{ option.optionLabel }}
                    </div>
                  </div>
                  <div v-else-if="item.optionSnapshot" class="question-option question-option--snapshot">
                    {{ item.optionSnapshot }}
                  </div>
                </div>

                <div v-if="item.showAnswer" class="question-card__panel">
                  <div class="question-card__panel-title">标准答案</div>
                  <div class="question-card__panel-content">{{ item.answerSnapshot || '-' }}</div>
                </div>

                <div v-if="item.showAnalysis" class="question-card__panel">
                  <div class="question-card__panel-title">题目解析</div>
                  <div class="question-card__panel-content">{{ item.analysis || '暂无解析' }}</div>
                </div>
              </div>

              <div class="question-card__summary">
                <div class="question-card__summary-item">
                  <div class="question-card__label">标准答案</div>
                  <div class="question-card__value">{{ item.answerSnapshot || '-' }}</div>
                </div>
                <div class="question-card__summary-item">
                  <div class="question-card__label">考生答案</div>
                  <div class="question-card__value">{{ item.studentAnswer || '-' }}</div>
                </div>
                <div class="question-card__summary-item">
                  <div class="question-card__label">批阅结果</div>
                  <DictSelect
                    v-model:model-value="item.manualResult"
                    dict-code="assessment_review_result"
                    clearable
                    placeholder="请选择批阅结果"
                  />
                </div>
              </div>

              <div class="question-card__comment">
                <div class="question-card__label">批阅说明</div>
                <NInput v-model:value="item.reviewComment" type="textarea" :rows="2" placeholder="请输入题目评语" />
              </div>
            </div>
          </div>

          <NEmpty v-else description="暂无题目信息" />
        </div>
      </NScrollbar>
    </NSpin>

    <template #action>
      <div class="paper-info-modal__actions">
        <NButton @click="handleClose">关闭</NButton>
        <NButton v-if="detail?.status === 'pending_review'" type="warning" ghost :loading="regenerating" @click="handleRegenerate">重新生成</NButton>
        <NButton :loading="saving" @click="handleSaveDraft">保存草稿</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmitReview">提交批阅</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.paper-info-modal :deep(.n-card) {
  display: flex;
  max-height: calc(100vh - 32px);
  flex-direction: column;
}

.paper-info-modal :deep(.n-card__content) {
  min-height: 0;
}

.paper-info-modal :deep(.n-card__action) {
  flex-shrink: 0;
}

.paper-info-modal__scroll {
  max-height: calc(100vh - 250px);
}

.paper-info-modal__content {
  padding-right: 4px;
}

.paper-result,
.question-card {
  margin-top: 14px;
  padding: 14px;
  border-radius: 12px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
}

html.dark .paper-result,
html.dark .question-card {
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(0 0 0 / 18%);
}

.paper-result__header,
.question-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.paper-info-modal__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.paper-result__title,
.question-card__title {
  font-size: 16px;
  font-weight: 600;
}

.question-card__title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.question-card__knowledge {
  font-size: 12px;
  font-weight: 500;
  color: var(--n-text-color-3);
}

.paper-result__switch,
.question-card__tags {
  display: flex;
  align-items: center;
  gap: 8px;
}

.paper-result__header {
  margin-bottom: 12px;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.question-card__tags {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.question-card__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.question-card__panels {
  display: grid;
  gap: 10px;
  margin-bottom: 10px;
}

.question-card__panel,
.question-card__summary-item {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 85%);
}

.question-card__panel-title {
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
}

.question-card__stem,
.question-card__panel-content,
.question-card__value {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.question-card__options {
  display: grid;
  gap: 6px;
  margin-top: 8px;
}

.question-option {
  padding: 6px 10px;
  border-radius: 8px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 85%);
}

.question-option--snapshot {
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.question-card__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.question-card__label {
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
}

.question-card__comment {
  margin-top: 0;
}

@media (width <= 760px) {
  .paper-result__header,
  .question-card__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .question-card__tags {
    justify-content: flex-start;
  }

  .question-card__summary {
    grid-template-columns: 1fr;
  }
}
</style>
