<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ArrowBackOutline } from '@vicons/ionicons5';
import {
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NEmpty,
  NIcon,
  NInput,
  NSpin,
  NSwitch,
  NTag
} from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import InfoPageLayout from '@/components/pages/InfoPageLayout.vue';
import { useDict } from '@/composables/use-dict';
import { fetchAssessmentPaperById, fetchAssessmentPaperReview } from '@/service/api';
import type { AssessmentPaperReviewBo, AssessmentPaperVo } from '@/types/app';

definePageMeta({
  title: '考核批阅'
});

const route = useRoute();

const loading = ref(false);
const submitting = ref(false);
const detail = ref<AssessmentPaperVo | null>(null);
const passFlag = ref(false);
const finalComment = ref('');

const paperStatusDict = useDict('assessment_paper_status');
const questionTypeDict = useDict('assessment_question_type');
const difficultyDict = useDict('assessment_question_difficulty');
const reviewResultDict = useDict('assessment_review_result');

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
      items: (data?.items || []).map(item => ({
        ...item,
        studentAnswer: item.studentAnswer || '',
        manualResult: item.manualResult || item.finalResult || '',
        reviewComment: item.reviewComment || ''
      }))
    };
    passFlag.value = Boolean(data?.passFlag);
    finalComment.value = data?.finalComment || '';
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!detail.value?.id) {
    return;
  }

  const payload: AssessmentPaperReviewBo = {
    paperId: detail.value.id,
    passFlag: passFlag.value,
    finalComment: finalComment.value || undefined,
    items: (detail.value.items || []).map(item => ({
      id: item.id,
      studentAnswer: item.studentAnswer || undefined,
      manualResult: item.manualResult || undefined,
      reviewComment: item.reviewComment || undefined
    }))
  };

  submitting.value = true;
  try {
    const { error } = await fetchAssessmentPaperReview(payload);
    if (error) {
      return;
    }

    window.$message?.success('试卷批阅成功');
    await loadDetail();
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <InfoPageLayout>
    <template #contentBox>
      <NCard :bordered="false" class="card-wrapper">
        <div class="mb-16px flex items-center justify-between">
          <div class="text-18px font-600">考核批阅</div>
          <div class="flex items-center gap-12px">
            <NButton type="primary" :loading="submitting" @click="handleSubmit">保存批阅</NButton>
            <NButton @click="navigateTo('/intern-assessment/paper')">
              <template #icon>
                <NIcon><ArrowBackOutline /></NIcon>
              </template>
              返回列表
            </NButton>
          </div>
        </div>

        <NSpin :show="loading || submitting">
          <NEmpty v-if="!detail" description="暂无试卷信息" />

          <template v-else>
            <NDescriptions bordered label-placement="left" :column="2">
              <NDescriptionsItem label="实习生">{{ detail.userName || '-' }}</NDescriptionsItem>
              <NDescriptionsItem label="考核阶段">{{ detail.stageName || '-' }}</NDescriptionsItem>
              <NDescriptionsItem label="试卷状态">
                <NTag :bordered="false" type="warning">
                  {{ paperStatusDict.getLabel(detail.status) || '-' }}
                </NTag>
              </NDescriptionsItem>
              <NDescriptionsItem label="题目总数">{{ detail.questionTotal ?? 0 }}</NDescriptionsItem>
              <NDescriptionsItem label="当前得分">{{ detail.score ?? '-' }}</NDescriptionsItem>
              <NDescriptionsItem label="已批阅时间">{{ detail.reviewedAt || '-' }}</NDescriptionsItem>
            </NDescriptions>

            <div class="mt-20px rounded-8px border border-solid border-[rgb(var(--border-color))] p-16px">
              <div class="mb-12px flex items-center justify-between">
                <div class="text-16px font-600">整卷结论</div>
                <div class="flex items-center gap-8px">
                  <span>是否通过</span>
                  <NSwitch v-model:value="passFlag" />
                </div>
              </div>
              <NInput v-model:value="finalComment" type="textarea" :rows="3" placeholder="请输入整卷评语" />
            </div>

            <NDivider>逐题批阅</NDivider>

            <div v-for="(item, index) in detail.items || []" :key="item.id || index" class="mb-16px rounded-8px border border-solid border-[rgb(var(--border-color))] p-16px">
              <div class="mb-12px flex items-center justify-between">
                <div class="text-16px font-600">第 {{ index + 1 }} 题</div>
                <div class="flex items-center gap-8px">
                  <NTag :bordered="false" type="info">{{ questionTypeDict.getLabel(item.questionType) || '-' }}</NTag>
                  <NTag :bordered="false" type="warning">{{ difficultyDict.getLabel(item.difficulty) || '-' }}</NTag>
                  <NTag :bordered="false" type="success">分值 {{ item.score ?? 0 }}</NTag>
                </div>
              </div>

              <div class="mb-12px whitespace-pre-wrap leading-7">{{ item.stem || '-' }}</div>

              <div v-if="item.options?.length" class="mb-12px grid gap-8px">
                <div v-for="option in item.options" :key="option.id || option.optionKey" class="rounded-6px bg-[rgb(var(--table-header-color))] px-12px py-8px">
                  {{ option.optionKey }}. {{ option.optionLabel }}
                </div>
              </div>

              <NDescriptions bordered label-placement="left" :column="2" class="mb-12px">
                <NDescriptionsItem label="知识点">{{ item.knowledgePoint || '-' }}</NDescriptionsItem>
                <NDescriptionsItem label="标准答案">{{ item.answerSnapshot || '-' }}</NDescriptionsItem>
              </NDescriptions>

              <div class="grid grid-cols-2 gap-16px">
                <div>
                  <div class="mb-8px font-600">学生答案</div>
                  <NInput v-model:value="item.studentAnswer" type="textarea" :rows="3" placeholder="请输入学生答案" />
                </div>
                <div>
                  <div class="mb-8px font-600">批阅结果</div>
                  <DictSelect v-model:model-value="item.manualResult" dict-code="assessment_review_result" clearable placeholder="请选择批阅结果" />
                </div>
              </div>

              <div class="mt-12px">
                <div class="mb-8px font-600">题目评语</div>
                <NInput v-model:value="item.reviewComment" type="textarea" :rows="2" placeholder="请输入题目评语" />
              </div>

              <div class="mt-8px text-12px text-[rgb(var(--text-color-3))]">
                自动判题：{{ item.autoCorrect == null ? '-' : item.autoCorrect ? '正确' : '错误' }} / 最终结果：{{ reviewResultDict.getLabel(item.finalResult) || '-' }}
              </div>
            </div>
          </template>
        </NSpin>
      </NCard>
    </template>
  </InfoPageLayout>
</template>
