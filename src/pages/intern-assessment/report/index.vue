<script setup lang="tsx">
import { computed, h, onMounted, ref } from 'vue';
import { NCard, NDataTable, NGrid, NGi, NStatistic, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import DictTag from '@/components/common/DictTag.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import { useTableSorter } from '@/composables/use-table-sorter';
import { fetchAssessmentReportOverview } from '@/service/api';
import type { AssessmentReportOverviewVo, AssessmentReportQuestionStatVo, AssessmentReportStageStatVo } from '@/types/app';

definePageMeta({
  title: '培训报表'
});

const loading = ref(false);
const overview = ref<AssessmentReportOverviewVo | null>(null);
const stageTableSorter = useTableSorter();
const questionTableSorter = useTableSorter();

function compareText(left?: string | null, right?: string | null) {
  return String(left || '').localeCompare(String(right || ''), 'zh-CN');
}

function compareNumber(left?: number | null, right?: number | null) {
  return Number(left || 0) - Number(right || 0);
}

const stageColumns = computed<DataTableColumns<AssessmentReportStageStatVo>>(() => ([
  { title: '阶段名称', key: 'stageName', minWidth: 180, render: row => row.stageName || '-' },
  { title: '考核人数', key: 'totalCount', width: 120, align: 'center', render: row => String(row.totalCount ?? 0) },
  { title: '通过人数', key: 'passedCount', width: 120, align: 'center', render: row => String(row.passedCount ?? 0) },
  {
    title: '通过率',
    key: 'passRate',
    width: 120,
    align: 'center',
    render: row => h(NTag, { bordered: false, type: 'success' }, { default: () => row.passRate || '0%' })
  }
] as DataTableColumns<AssessmentReportStageStatVo>).map(column => {
  const columnKey = typeof column.key === 'string' ? column.key : '';
  const sorterMap: Record<string, (left: AssessmentReportStageStatVo, right: AssessmentReportStageStatVo) => number> = {
    stageName: (left, right) => compareText(left.stageName, right.stageName),
    totalCount: (left, right) => compareNumber(left.totalCount, right.totalCount),
    passedCount: (left, right) => compareNumber(left.passedCount, right.passedCount),
    passRate: (left, right) => compareText(left.passRate, right.passRate)
  };
  const sorter = sorterMap[columnKey];
  return sorter
    ? {
        ...column,
        sorter: {
          ...stageTableSorter.createSorter(),
          compare: sorter
        },
        sortOrder: stageTableSorter.getSortOrder(columnKey),
        renderSorter: stageTableSorter.createSorterRender(columnKey)
      }
    : column;
}));

const questionColumns = computed<DataTableColumns<AssessmentReportQuestionStatVo>>(() => ([
  { title: '题干', key: 'stem', minWidth: 320, render: row => row.stem || '-' },
  { title: '题型', key: 'questionType', width: 120, render: row => <DictTag dictCode="assessment_question_type" value={row.questionType} /> },
  { title: '作答次数', key: 'totalCount', width: 120, align: 'center', render: row => String(row.totalCount ?? 0) },
  { title: '答对次数', key: 'correctCount', width: 120, align: 'center', render: row => String(row.correctCount ?? 0) },
  {
    title: '正确率',
    key: 'correctRate',
    width: 120,
    align: 'center',
    render: row => h(NTag, { bordered: false, type: 'warning' }, { default: () => row.correctRate || '0%' })
  }
] as DataTableColumns<AssessmentReportQuestionStatVo>).map(column => {
  const columnKey = typeof column.key === 'string' ? column.key : '';
  const sorterMap: Record<string, (left: AssessmentReportQuestionStatVo, right: AssessmentReportQuestionStatVo) => number> = {
    stem: (left, right) => compareText(left.stem, right.stem),
    questionType: (left, right) => compareText(left.questionType, right.questionType),
    totalCount: (left, right) => compareNumber(left.totalCount, right.totalCount),
    correctCount: (left, right) => compareNumber(left.correctCount, right.correctCount),
    correctRate: (left, right) => compareText(left.correctRate, right.correctRate)
  };
  const sorter = sorterMap[columnKey];
  return sorter
    ? {
        ...column,
        sorter: {
          ...questionTableSorter.createSorter(),
          compare: sorter
        },
        sortOrder: questionTableSorter.getSortOrder(columnKey),
        renderSorter: questionTableSorter.createSorterRender(columnKey)
      }
    : column;
}));

onMounted(() => {
  loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const { data, error } = await fetchAssessmentReportOverview();
    if (error) {
      return;
    }
    overview.value = data || null;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <SearchTablePageLayout @refresh="loadData">
    <NGrid :cols="4" :x-gap="16" :y-gap="16" class="mb-16px">
      <NGi>
        <NCard :bordered="false">
          <NStatistic label="实习生档案数" :value="overview?.internCount || 0" />
        </NCard>
      </NGi>
      <NGi>
        <NCard :bordered="false">
          <NStatistic label="阶段数" :value="overview?.stageCount || 0" />
        </NCard>
      </NGi>
      <NGi>
        <NCard :bordered="false">
          <NStatistic label="试卷总数" :value="overview?.paperCount || 0" />
        </NCard>
      </NGi>
      <NGi>
        <NCard :bordered="false">
          <NStatistic label="待批阅试卷" :value="overview?.pendingReviewCount || 0" />
        </NCard>
      </NGi>
    </NGrid>

    <div class="grid gap-16px">
      <NCard title="阶段通过率" :bordered="false">
        <NDataTable
          :bordered="false"
          :single-line="false"
          :loading="loading"
          :columns="stageColumns"
          :data="overview?.stageStats || []"
          :pagination="false"
          @update:sorter="stageTableSorter.handleSorter"
        />
      </NCard>

      <NCard title="题目正确率" :bordered="false">
        <NDataTable
          :bordered="false"
          :single-line="false"
          :loading="loading"
          :columns="questionColumns"
          :data="overview?.questionStats || []"
          :pagination="false"
          @update:sorter="questionTableSorter.handleSorter"
        />
      </NCard>
    </div>
  </SearchTablePageLayout>
</template>
