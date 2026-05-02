<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NEmpty,
  NInput,
  NModal,
  NScrollbar,
  NSpin,
  NSwitch,
  NTabPane,
  NTabs,
  NTag
} from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import DictTag from '@/components/common/DictTag.vue';
import InfoGridCard from '@/components/common/InfoGridCard.vue';
import PaperItemReplaceDialog from '@/components/features/intern-assessment/PaperItemReplaceDialog.vue';
import { fetchAssessmentPaperById, fetchAssessmentPaperRegenerate, fetchAssessmentPaperReview } from '@/service/api';
import type { AssessmentPaperItemVo, AssessmentPaperReviewBo, AssessmentPaperVo } from '@/types/app';
import { getAssessmentPassResultLabel, resolveAssessmentPassResult } from '@/utils/assessment-dict';

type ReviewFilterKey = 'all' | 'pending' | 'correct' | 'wrong' | 'unanswered';
type DetailTabKey = 'answer' | 'analysis';

interface Props {
  show: boolean;
  paperId?: string | null;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  paperId: null,
  readonly: false
});

const emit = defineEmits<{
  close: [];
  refresh: [];
}>();

const loading = ref(false);
const saving = ref(false);
const submitting = ref(false);
const regenerating = ref(false);
const detail = ref<AssessmentPaperVo | null>(null);
const passFlag = ref(false);
const finalComment = ref('');
const showSubmitDialog = ref(false);
const readonlyMode = computed(() => props.readonly || detail.value?.status !== 'pending_review');

const questionTab = ref<ReviewFilterKey>('all');
const detailTab = ref<DetailTabKey>('answer');
const activeQuestionId = ref<string | null>(null);
const showReplaceDialog = ref(false);
const replaceTarget = ref<AssessmentPaperItemVo | null>(null);

const paperInfoItems = computed(() => [
  { label: '实习生', text: detail.value?.userName || '-' },
  { label: '培训阶段', text: detail.value?.stageName || '-' },
  { label: '试卷状态', dictCode: 'assessment_paper_status', dictValue: detail.value?.status },
  {
    label: '考核结论',
    dictCode: 'assessment_pass_result',
    dictValue: resolveAssessmentPassResult(detail.value?.status, detail.value?.passFlag),
    fallbackLabel: getPassText(detail.value?.status, detail.value?.passFlag)
  },
  { label: '题目总数', text: detail.value?.questionTotal ?? 0 },
  { label: '答对题数', text: detail.value?.correctTotal ?? 0 },
  { label: '当前得分', text: detail.value?.score ?? '-' },
  { label: '批阅时间', text: detail.value?.reviewedAt || '-' },
  { label: '创建时间', text: detail.value?.createdAt || '-' },
  { label: '更新时间', text: detail.value?.updatedAt || '-' }
]);

const title = computed(() => {
  if (!detail.value) return '阶段考核';
  const stageName = detail.value.stageName || '未命名阶段';
  const userName = detail.value.userName || '实习生';
  return `${userName} - ${stageName}`;
});

const questionTabOptions = computed(() => {
  const items = detail.value?.items || [];
  return [
    { key: 'all' as const, label: `全部 ${items.length}` },
    { key: 'pending' as const, label: `待处理 ${items.filter(item => !isReviewed(item)).length}` },
    { key: 'correct' as const, label: `正确 ${items.filter(item => resolveResultKind(item) === 'correct').length}` },
    { key: 'wrong' as const, label: `错误 ${items.filter(item => resolveResultKind(item) === 'wrong').length}` },
    { key: 'unanswered' as const, label: `未作答 ${items.filter(item => resolveResultKind(item) === 'unanswered').length}` }
  ];
});

const filteredItems = computed(() => {
  const items = detail.value?.items || [];
  if (questionTab.value === 'all') return items;
  if (questionTab.value === 'pending') return items.filter(item => !isReviewed(item));
  return items.filter(item => resolveResultKind(item) === questionTab.value);
});

const activeItem = computed(() => {
  const items = filteredItems.value;
  return items.find(item => item.id === activeQuestionId.value) || items[0] || null;
});

const activeIndex = computed(() => {
  const items = detail.value?.items || [];
  const target = activeItem.value;
  if (!target?.id) return 0;
  const index = items.findIndex(item => item.id === target.id);
  return index < 0 ? 0 : index;
});

const replaceExcludeQuestionIds = computed(() =>
  (detail.value?.items || []).map(item => item.questionId || '').filter(Boolean)
);

watch(
  () => [props.show, props.paperId] as const,
  ([visible]) => {
    if (visible) {
      loadDetail();
    } else {
      resetState();
    }
  },
  { immediate: true }
);

watch(
  () => [questionTab.value, filteredItems.value.map(item => item.id).join(',')] as const,
  () => {
    ensureActiveQuestion();
  }
);

function resetState() {
  detail.value = null;
  passFlag.value = false;
  finalComment.value = '';
  questionTab.value = 'all';
  detailTab.value = 'answer';
  activeQuestionId.value = null;
  showReplaceDialog.value = false;
  replaceTarget.value = null;
  showSubmitDialog.value = false;
}

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
      items: (data.items || []).map(item => ({
        ...item,
        studentAnswer: item.studentAnswer || '',
        manualResult: item.manualResult || '',
        reviewComment: item.reviewComment || ''
      }))
    };
    passFlag.value = Boolean(data.passFlag);
    finalComment.value = data.finalComment || '';
    ensureActiveQuestion();
  } finally {
    loading.value = false;
  }
}

function ensureActiveQuestion() {
  const items = filteredItems.value;
  if (!items.length) {
    activeQuestionId.value = null;
    return;
  }
  if (!items.some(item => item.id === activeQuestionId.value)) {
    activeQuestionId.value = items[0]?.id || null;
  }
}

async function submitReview(submitFlag: boolean) {
  if (!detail.value?.id) {
    return false;
  }

  const payload: AssessmentPaperReviewBo = {
    paperId: detail.value.id,
    submitFlag,
    passFlag: submitFlag ? passFlag.value : undefined,
    finalComment: submitFlag ? finalComment.value || undefined : undefined,
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
      return false;
    }

    window.$message?.success(submitFlag ? '阶段考核已提交批阅' : '阶段考核已保存');
    await loadDetail();
    emit('refresh');
    if (submitFlag) {
      showSubmitDialog.value = false;
      emit('close');
    }
    return true;
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
  if (!detail.value?.id) {
    return;
  }
  showSubmitDialog.value = true;
}

async function handleSubmitDialogConfirm() {
  const success = await submitReview(true);
  if (success && showSubmitDialog.value) {
    showSubmitDialog.value = false;
  }
}

function handleClose() {
  emit('close');
}

function getPassText(status?: string, pass?: boolean) {
  return getAssessmentPassResultLabel(status, pass);
}

function hasStudentAnswer(item: AssessmentPaperItemVo) {
  return Boolean(item.studentAnswer && item.studentAnswer.trim());
}

function isPractical(item: AssessmentPaperItemVo) {
  return item.questionType === 'practical';
}

function isReviewed(item: AssessmentPaperItemVo) {
  if (detail.value?.status === 'reviewed') return true;
  return Boolean(item.manualResult || item.reviewComment);
}

function resolveResultKind(item: AssessmentPaperItemVo): 'correct' | 'wrong' | 'unanswered' | 'partial' | 'pending' {
  const result = item.manualResult || item.finalResult;
  if (!isPractical(item) && !hasStudentAnswer(item)) return 'unanswered';
  if (result === 'CORRECT') return 'correct';
  if (result === 'WRONG') return 'wrong';
  if (result === 'PARTIAL') return 'partial';
  return 'pending';
}

function getResultText(item: AssessmentPaperItemVo) {
  const result = resolveResultKind(item);
  if (result === 'correct') return '正确';
  if (result === 'wrong') return '错误';
  if (result === 'partial') return '部分正确';
  if (result === 'unanswered') return '未作答';
  return '待批阅';
}

function getResultClass(item: AssessmentPaperItemVo) {
  const result = resolveResultKind(item);
  if (result === 'correct') return 'is-success';
  if (result === 'wrong') return 'is-error';
  if (result === 'partial') return 'is-warning';
  if (result === 'pending') return 'is-pending';
  return 'is-default';
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

function openReplaceDialog(item: AssessmentPaperItemVo) {
  replaceTarget.value = item;
  showReplaceDialog.value = true;
}

async function handleReplaceSuccess() {
  showReplaceDialog.value = false;
  replaceTarget.value = null;
  await loadDetail();
  emit('refresh');
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

    window.$message?.success('阶段考核试卷已重新生成');
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
    :style="{ width: '1220px', maxWidth: 'calc(100vw - 24px)' }"
    class="paper-info-modal"
    :mask-closable="false"
    @update:show="value => !value && handleClose()"
  >
    <NSpin :show="loading || saving || submitting || regenerating">
      <NEmpty v-if="!detail" description="暂无阶段考核记录" />

      <div v-else class="paper-info-modal__body">
        <div class="paper-info-modal__summary">
          <InfoGridCard :items="paperInfoItems" :plain="true" />
        </div>

        <div class="paper-workspace">
          <div class="paper-nav">
            <NTabs v-model:value="questionTab" type="segment" animated class="paper-nav__tabs">
              <NTabPane v-for="item in questionTabOptions" :key="item.key" :name="item.key" :tab="item.label" />
            </NTabs>

            <NScrollbar class="paper-nav__scroll">
              <div v-if="filteredItems.length" class="paper-nav__list">
                <button
                  v-for="(item, index) in filteredItems"
                  :key="item.id || index"
                  type="button"
                  class="paper-nav__item"
                  :class="{ 'is-active': activeItem?.id === item.id }"
                  @click="activeQuestionId = item.id || null"
                >
                  <div class="paper-nav__item-head">
                    <div class="paper-nav__item-main">
                      <span class="paper-nav__index">Q{{ (detail.items || []).findIndex(row => row.id === item.id) + 1 }}</span>
                      <span class="paper-nav__stem">{{ item.stem || '-' }}</span>
                    </div>
                    <span class="paper-nav__dot" :class="{ 'is-reviewed': isReviewed(item) }" />
                  </div>
                  <div class="paper-nav__meta">
                    <span class="paper-nav__knowledge">{{ item.knowledgePoint || '未设置知识点' }}</span>
                    <span class="paper-nav__result" :class="getResultClass(item)">{{ getResultText(item) }}</span>
                  </div>
                </button>
              </div>
              <NEmpty v-else description="当前筛选下暂无题目" class="paper-nav__empty" />
            </NScrollbar>
          </div>

          <div v-if="activeItem" class="paper-detail">
            <div class="paper-detail__header">
              <div class="paper-detail__header-main">
                <div class="paper-detail__title">第 {{ activeIndex + 1 }} 题</div>
              </div>
              <div class="paper-detail__header-actions">
                <DictTag dict-code="assessment_question_type" :value="activeItem.questionType" />
                <DictTag dict-code="assessment_question_difficulty" :value="activeItem.difficulty" />
                <NTag :bordered="false" type="default">分值 {{ activeItem.score ?? 0 }}</NTag>
                <NTag :bordered="false" type="default">
                  {{ isReviewed(activeItem) ? '已批阅' : '未批阅' }}
                </NTag>
                <NButton
                  v-if="!readonlyMode && detail.status === 'pending_review'"
                  size="small"
                  secondary
                  type="primary"
                  @click="openReplaceDialog(activeItem)"
                >
                  重新随机
                </NButton>
              </div>
            </div>

            <NScrollbar class="paper-detail__scroll">
              <div class="paper-detail__content">
                <div class="paper-panel paper-panel--fixed">
                  <div class="paper-panel__title">题目描述</div>
                  <div class="paper-panel__text">{{ activeItem.stem || '-' }}</div>
                  <div v-if="getOptions(activeItem).length" class="paper-panel__options">
                    <div v-for="option in getOptions(activeItem)" :key="option.id || option.optionKey" class="paper-option">
                      {{ option.optionKey }}. {{ option.optionLabel }}
                    </div>
                  </div>
                </div>

                <NTabs v-model:value="detailTab" type="line" animated class="paper-detail__tabs">
                  <NTabPane name="answer" tab="标准答案">
                    <div class="paper-panel">
                      <div class="paper-panel__text">{{ activeItem.answerSnapshot || '-' }}</div>
                    </div>
                  </NTabPane>
                  <NTabPane name="analysis" tab="解析">
                    <div class="paper-panel">
                      <div class="paper-panel__text">{{ activeItem.analysis || '暂无解析' }}</div>
                    </div>
                  </NTabPane>
                </NTabs>

                <div class="paper-review-grid">
                  <div v-if="!isPractical(activeItem)" class="paper-review-field">
                    <div class="paper-review-field__label">考生答案</div>
                    <div class="paper-review-field__value" :class="getResultClass(activeItem)">
                      {{ activeItem.studentAnswer || '未作答' }}
                    </div>
                  </div>

                  <div class="paper-review-field">
                    <div class="paper-review-field__label">批阅结果</div>
                    <div class="paper-review-field__value">
                      <DictSelect
                        v-model:model-value="activeItem.manualResult"
                        dict-code="assessment_review_result"
                        clearable
                        :disabled="readonlyMode"
                        placeholder="请选择批阅结果"
                      />
                    </div>
                  </div>
                </div>

                <div class="paper-review-field paper-review-field--full">
                  <div class="paper-review-field__label">批阅说明</div>
                  <NInput
                    v-model:value="activeItem.reviewComment"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入题目评语"
                    :readonly="readonlyMode"
                  />
                </div>
              </div>
            </NScrollbar>
          </div>

          <NEmpty v-else description="当前筛选下暂无题目" class="paper-detail__empty" />
        </div>
      </div>
    </NSpin>

    <template #action>
      <div class="paper-info-modal__actions">
        <NButton @click="handleClose">关闭</NButton>
        <template v-if="detail?.status === 'pending_review' && !readonlyMode">
          <NButton v-if="detail?.status === 'pending_review'" type="warning" ghost :loading="regenerating" @click="handleRegenerate">重新生成整卷</NButton>
          <NButton :loading="saving" @click="handleSaveDraft">保存草稿</NButton>
          <NButton type="primary" :loading="submitting" @click="handleSubmitReview">提交批阅</NButton>
        </template>
      </div>
    </template>
  </NModal>

  <PaperItemReplaceDialog
    :show="showReplaceDialog"
    :paper-id="detail?.id"
    :paper-item-id="replaceTarget?.id"
    :stage-id="detail?.stageId"
    :question-type="replaceTarget?.questionType"
    :current-question-id="replaceTarget?.questionId"
    :exclude-question-ids="replaceExcludeQuestionIds"
    @close="showReplaceDialog = false"
    @success="handleReplaceSuccess"
  />

  <NModal
    :show="showSubmitDialog"
    preset="card"
    title="提交批阅"
    :style="{ width: '520px', maxWidth: 'calc(100vw - 32px)' }"
    :mask-closable="false"
    @update:show="value => !value && (showSubmitDialog = false)"
  >
    <div class="paper-submit-dialog">
      <div class="paper-submit-dialog__row">
        <div>
          <div class="paper-submit-dialog__label">整卷结论</div>
          <div class="paper-submit-dialog__tip">提交后将锁定本次考核结果，并同步培训阶段状态。</div>
        </div>
        <div class="paper-submit-dialog__switch">
          <span>{{ passFlag ? '通过' : '未通过' }}</span>
          <NSwitch v-model:value="passFlag" />
        </div>
      </div>
      <NInput v-model:value="finalComment" type="textarea" :rows="4" placeholder="请输入整卷评语，可填写通过/未通过原因" />
    </div>

    <template #action>
      <div class="em-dialog-actions">
        <NButton @click="showSubmitDialog = false">取消</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmitDialogConfirm">确认提交</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.paper-info-modal :deep(.n-card) {
  display: flex;
  max-height: calc(100vh - 24px);
  flex-direction: column;
}

.paper-info-modal :deep(.n-card__content) {
  display: flex;
  min-height: 0;
  flex: 1;
  padding-bottom: 12px;
}

.paper-info-modal :deep(.n-card__action) {
  flex-shrink: 0;
}

.paper-info-modal__body {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 14px;
}

.paper-info-modal__summary {
  flex-shrink: 0;
}

.paper-nav,
.paper-detail {
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
}

html.dark .paper-nav,
html.dark .paper-detail {
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(0 0 0 / 18%);
}

.paper-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.paper-detail__title {
  font-size: 16px;
  font-weight: 600;
}

.paper-detail__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.paper-workspace {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 14px;
}

.paper-nav,
.paper-detail {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.paper-nav__tabs {
  padding: 12px 12px 0;
}

.paper-nav__tabs :deep(.n-tabs-tab.n-tabs-tab--active),
.paper-nav__tabs :deep(.n-tabs-tab.n-tabs-tab--active .n-tabs-tab__label) {
  color: var(--em-primary-color);
}

.paper-nav__tabs :deep(.n-tabs-tab-pad) {
  border: 1px solid rgb(var(--em-primary-color-rgb) / 28%);
  background-color: rgb(var(--em-primary-color-rgb) / 10%);
  box-shadow: 0 2px 8px rgb(var(--em-primary-color-rgb) / 10%);
}

.paper-nav__scroll,
.paper-detail__scroll {
  min-height: 0;
  flex: 1;
}

.paper-nav__list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.paper-nav__item {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid rgb(var(--border-color) / 80%);
  border-radius: 12px;
  background: rgb(var(--layout-bg-color));
  box-shadow: 0 1px 2px rgb(31 35 41 / 4%);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.paper-nav__item:hover {
  border-color: rgb(var(--em-primary-color-rgb) / 45%);
  background: rgb(var(--em-primary-color-rgb) / 7%);
  box-shadow: 0 4px 10px rgb(var(--em-primary-color-rgb) / 8%);
}

.paper-nav__item.is-active {
  border-color: var(--em-primary-color);
  background: rgb(var(--em-primary-color-rgb) / 10%);
  box-shadow:
    0 0 0 3px rgb(var(--em-primary-color-rgb) / 12%),
    0 6px 14px rgb(var(--em-primary-color-rgb) / 10%);
}

.paper-nav__item.is-active {
  transform: translateY(-1px);
}

.paper-nav__item.is-active .paper-nav__index,
.paper-nav__item.is-active .paper-nav__stem {
  color: var(--em-primary-color);
}

.paper-nav__item-head,
.paper-nav__meta,
.paper-nav__item-main {
  display: flex;
  align-items: center;
}

.paper-nav__item-head,
.paper-nav__meta {
  justify-content: space-between;
  gap: 10px;
}

.paper-nav__item-main {
  min-width: 0;
  flex: 1;
  gap: 8px;
}

.paper-nav__meta {
  margin-top: 8px;
}

.paper-nav__index {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--n-text-color-2);
}

.paper-nav__stem,
.paper-detail__subtitle {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paper-nav__stem {
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color-1);
}

.paper-nav__knowledge {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.paper-nav__result,
.paper-review-field__value.is-success {
  font-size: 12px;
  font-weight: 600;
}

.paper-nav__result.is-success,
.paper-review-field__value.is-success {
  color: rgb(var(--success-color));
}

.paper-nav__result.is-error,
.paper-review-field__value.is-error {
  color: rgb(var(--error-color));
}

.paper-nav__result.is-warning,
.paper-review-field__value.is-warning {
  color: rgb(var(--warning-color));
}

.paper-nav__result.is-default,
.paper-review-field__value.is-default {
  color: var(--n-text-color-1);
}

.paper-nav__result.is-pending,
.paper-review-field__value.is-pending {
  color: var(--n-text-color-3);
}

.paper-nav__dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 999px;
  background: rgb(var(--border-color));
  box-shadow: 0 0 0 3px rgb(var(--border-color) / 18%);
}

.paper-nav__dot.is-reviewed {
  background: rgb(var(--success-color));
  box-shadow: 0 0 0 3px rgb(var(--success-color) / 18%);
}

.paper-detail__header {
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgb(var(--border-color) / 70%);
}

.paper-detail__header-main {
  min-width: 0;
  flex: 1;
}

.paper-detail__subtitle {
  margin-top: 6px;
  color: var(--n-text-color-2);
}

.paper-detail__content {
  padding: 12px 16px 16px;
}

.paper-detail :deep(.n-tabs-nav) {
  margin-bottom: 8px;
}

.paper-detail :deep(.n-tabs-tab.n-tabs-tab--active .n-tabs-tab__label) {
  color: var(--em-primary-color);
}

.paper-detail :deep(.n-tabs-bar) {
  background-color: var(--em-primary-color);
}

.paper-detail__tabs {
  margin-top: 12px;
}

.paper-panel {
  padding: 12px;
  border-radius: 12px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 80%);
}

.paper-panel--fixed {
  margin-bottom: 0;
}

.paper-panel__title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color-2);
}

.paper-panel__text {
  line-height: 1.8;
  white-space: pre-wrap;
  color: var(--n-text-color-1);
}

.paper-panel__options {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.paper-option {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgb(var(--container-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 70%);
  line-height: 1.7;
}

.paper-review-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.paper-review-field {
  padding: 12px;
  border-radius: 12px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 80%);
}

.paper-review-field--full {
  margin-top: 12px;
}

.paper-review-field__label {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--n-text-color-3);
}

.paper-review-field__value {
  line-height: 1.8;
  color: var(--n-text-color-1);
  white-space: pre-wrap;
  word-break: break-word;
}

.paper-review-field__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.paper-info-modal__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
}

.paper-nav__empty,
.paper-detail__empty {
  margin-top: 56px;
}

.paper-submit-dialog {
  display: grid;
  gap: 14px;
}

.paper-submit-dialog__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 80%);
}

.paper-submit-dialog__label {
  font-size: 15px;
  font-weight: 600;
  color: var(--n-text-color-1);
}

.paper-submit-dialog__tip {
  margin-top: 4px;
  color: var(--n-text-color-3);
  font-size: 12px;
  line-height: 1.6;
}

.paper-submit-dialog__switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--n-text-color-2);
  white-space: nowrap;
}

@media (width <= 1200px) {
  .paper-workspace {
    grid-template-columns: 280px minmax(0, 1fr);
  }
}

@media (width <= 960px) {
  .paper-workspace {
    grid-template-columns: 1fr;
  }

  .paper-nav {
    max-height: 280px;
  }

  .paper-review-grid {
    grid-template-columns: 1fr;
  }
}
</style>
