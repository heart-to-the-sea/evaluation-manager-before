<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ArrowBackOutline } from '@vicons/ionicons5';
import {
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NIcon,
  NInput,
  NSpin,
  NSwitch,
  NTag
} from 'naive-ui';
import DictTag from '@/components/common/DictTag.vue';
import DictSelect from '@/components/common/DictSelect.vue';
import InfoPageLayout from '@/components/pages/InfoPageLayout.vue';
import { fetchAssessmentPaperById, fetchAssessmentPaperRegenerate, fetchAssessmentPaperReview } from '@/service/api';
import type { AssessmentPaperReviewBo, AssessmentPaperVo } from '@/types/app';

definePageMeta({
  title: '考核批阅'
});

type ReviewQuestionItem = NonNullable<AssessmentPaperVo['items']>[number] & {
  showStem?: boolean;
  showAnswer?: boolean;
  showAnalysis?: boolean;
};

type ReviewPaperDetail = Omit<AssessmentPaperVo, 'items'> & {
  items?: ReviewQuestionItem[];
};

const route = useRoute();

const loading = ref(false);
const saving = ref(false);
const submitting = ref(false);
const regenerating = ref(false);
const detail = ref<ReviewPaperDetail | null>(null);
const passFlag = ref(false);
const finalComment = ref('');

const detailDescriptionLabelStyle = { width: '108px' };
const detailDescriptionContentStyle = { minWidth: '0' };

const paperId = computed(() => String(route.params.id || ''));

watch(paperId, () => {
  loadDetail();
});

onMounted(() => {
  loadDetail();
});

async function loadDetail() {
  if (!paperId.value) {
    detail.value = null;
    return;
  }

  loading.value = true;
  try {
    const { data, error } = await fetchAssessmentPaperById(paperId.value);
    if (error) {
      detail.value = null;
      return;
    }

    detail.value = {
      ...data,
      items: (data?.items || []).map((item, index) => ({
        ...item,
        studentAnswer: item.studentAnswer || '',
        manualResult: item.manualResult || item.finalResult || '',
        reviewComment: item.reviewComment || '',
        showStem: index === 0,
        showAnswer: false,
        showAnalysis: false
      }))
    };
    passFlag.value = Boolean(data?.passFlag);
    finalComment.value = data?.finalComment || '';
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

    window.$message?.success(submitFlag ? '阶段考核已提交批阅' : '阶段考核草稿已保存');
    await loadDetail();
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

function handleRegenerate() {
  if (!detail.value?.id) {
    return;
  }

  const currentPaperId = detail.value.id;
  window.$dialog?.warning({
    title: '重新生成考卷',
    content: `确认按当前阶段规则重新生成“${detail.value.stageName || '当前阶段'}”的考卷吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      regenerating.value = true;
      try {
        const { data, error } = await fetchAssessmentPaperRegenerate({ paperId: currentPaperId });
        if (error) {
          return;
        }

        window.$message?.success('阶段考核试卷已重新生成');
        if (data && data !== currentPaperId) {
          await navigateTo(`/intern-assessment/paper/info/${data}`);
          return;
        }
        await loadDetail();
      } finally {
        regenerating.value = false;
      }
    }
  });
}

function toggleQuestionPanel(item: ReviewQuestionItem, field: 'showStem' | 'showAnswer' | 'showAnalysis') {
  item[field] = !item[field];
}
</script>

<template>
  <InfoPageLayout>
    <template #title>考核批阅</template>

    <template #actions>
      <NButton type="warning" ghost :loading="regenerating" @click="handleRegenerate">重新生成</NButton>
      <NButton :loading="saving" @click="handleSaveDraft">保存草稿</NButton>
      <NButton type="primary" :loading="submitting" @click="handleSubmitReview">提交批阅</NButton>
      <NButton @click="navigateTo('/intern-assessment/paper')">
        <template #icon>
          <NIcon><ArrowBackOutline /></NIcon>
        </template>
        返回列表
      </NButton>
    </template>

    <template #contentBox>
      <NSpin :show="loading || saving || submitting">
        <NEmpty v-if="!detail" description="暂无试卷信息" />

        <template v-else>
          <div class="detail-overview-grid">
            <div class="detail-section">
              <div class="detail-section__title">试卷信息</div>
              <NDescriptions
                bordered
                label-placement="left"
                :column="2"
                class="detail-descriptions"
                :label-style="detailDescriptionLabelStyle"
                :content-style="detailDescriptionContentStyle"
              >
                <NDescriptionsItem label="实习生">{{ detail.userName || '-' }}</NDescriptionsItem>
                <NDescriptionsItem label="培训阶段">{{ detail.stageName || '-' }}</NDescriptionsItem>
                <NDescriptionsItem label="试卷状态">
                  <DictTag dict-code="assessment_paper_status" :value="detail.status" />
                </NDescriptionsItem>
                <NDescriptionsItem label="题目总数">{{ detail.questionTotal ?? 0 }}</NDescriptionsItem>
                <NDescriptionsItem label="当前得分">{{ detail.score ?? '-' }}</NDescriptionsItem>
                <NDescriptionsItem label="已批阅时间">{{ detail.reviewedAt || '-' }}</NDescriptionsItem>
              </NDescriptions>
            </div>

            <div class="detail-section">
              <div class="detail-section__title">整卷结论</div>
              <div class="paper-review-block">
                <div class="paper-review-block__header">
                  <div class="paper-review-block__title">批阅设置</div>
                  <div class="paper-review-block__switch">
                    <span>是否通过</span>
                    <NSwitch v-model:value="passFlag" />
                  </div>
                </div>
                <NInput v-model:value="finalComment" type="textarea" :rows="3" placeholder="请输入整卷评语" />
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-section__title">逐题批阅</div>

            <div class="question-list">
              <div v-for="(item, index) in detail.items || []" :key="item.id || index" class="question-card">
                <div class="question-card__header">
                  <div class="question-card__title">
                    <span>第 {{ index + 1 }} 题</span>
                    <span class="question-card__knowledge">{{ item.knowledgePoint || '未设置知识点' }}</span>
                  </div>
                  <div class="question-card__tags">
                    <DictTag dict-code="assessment_question_type" :value="item.questionType" />
                    <DictTag dict-code="assessment_question_difficulty" :value="item.difficulty" />
                    <NTag :bordered="false" type="success">分值 {{ item.score ?? 0 }}</NTag>
                    <span class="paper-item__review-result">自动判定 <DictTag dict-code="assessment_review_result" :value="item.finalResult" /></span>
                  </div>
                </div>

                <div class="question-card__toolbar">
                  <NButton size="small" secondary :type="item.showStem ? 'primary' : 'default'" @click="toggleQuestionPanel(item, 'showStem')">
                    题目描述
                  </NButton>
                  <NButton size="small" secondary :type="item.showAnswer ? 'primary' : 'default'" @click="toggleQuestionPanel(item, 'showAnswer')">
                    答案
                  </NButton>
                  <NButton size="small" secondary :type="item.showAnalysis ? 'primary' : 'default'" @click="toggleQuestionPanel(item, 'showAnalysis')">
                    解析
                  </NButton>
                </div>

                <div v-if="item.showStem || item.showAnswer || item.showAnalysis" class="question-card__panels">
                  <div v-if="item.showStem" class="question-card__panel">
                    <div class="question-card__panel-title">题目描述</div>
                    <div class="question-card__stem">{{ item.stem || '-' }}</div>

                    <div v-if="item.options?.length" class="question-card__options">
                      <div v-for="option in item.options" :key="option.id || option.optionKey" class="question-card__option">
                        {{ option.optionKey }}. {{ option.optionLabel }}
                      </div>
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
                      placeholder="请选择批阅结果"
                    />
                  </div>
                </div>

                <div class="question-card__review">
                  <div class="question-card__field">
                    <div class="question-card__label">批阅说明</div>
                    <NInput v-model:value="item.reviewComment" type="textarea" :rows="2" placeholder="请输入批阅说明" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </NSpin>
    </template>
  </InfoPageLayout>
</template>

<style scoped lang="scss">
.detail-overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

.detail-overview-grid .detail-section {
  min-width: 0;
}

.detail-overview-grid .detail-section + .detail-section {
  margin-top: 0;
}

.detail-overview-grid + .detail-section {
  margin-top: 20px;
}

.detail-section + .detail-section {
  margin-top: 20px;
}

.detail-section__title {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.detail-section :deep(.n-descriptions) {
  margin: 0;
}

.detail-section :deep(.detail-descriptions .n-descriptions-table-header) {
  white-space: nowrap;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.paper-review-block,
.question-card {
  padding: 14px 16px;
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
}

html.dark .paper-review-block,
html.dark .question-card {
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(0 0 0 / 18%);
}

.paper-review-block__header,
.question-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.paper-review-block__title,
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

.paper-review-block__switch,
.question-card__tags {
  display: flex;
  align-items: center;
  gap: 8px;
}

.question-card__tags {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.paper-item__review-result {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

.question-card__stem {
  white-space: pre-wrap;
  line-height: 1.6;
}

.question-card__panel-content,
.question-card__value {
  white-space: pre-wrap;
  line-height: 1.6;
  word-break: break-word;
}

.question-card__options {
  display: grid;
  gap: 6px;
  margin-top: 8px;
}

.question-card__option {
  padding: 6px 10px;
  border-radius: 6px;
  background: rgb(var(--layout-bg-color));
}

.question-card__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.question-card__review {
  margin-top: 0;
}

.question-card__field {
  display: grid;
  gap: 6px;
}

.question-card__label {
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--base-text-color));
}

@media (width <= 960px) {
  .detail-overview-grid {
    grid-template-columns: 1fr;
  }

  .paper-review-block__header,
  .question-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .question-card__tags {
    justify-content: flex-start;
  }

  .question-card__summary {
    grid-template-columns: 1fr;
  }
}
</style>
