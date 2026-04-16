<script setup lang="tsx">
import { computed, h, onMounted, reactive, ref } from 'vue';
import { AddCircle } from '@vicons/ionicons5';
import { NButton, NDataTable, NGrid, NGi, NIcon, NInput, NPopconfirm, NPopover, NSpace, NSelect, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import TemplateDialog from '@/components/features/intern-assessment/TemplateDialog.vue';
import { fetchAssessmentStageList, fetchAssessmentTemplateDelete, fetchAssessmentTemplateList } from '@/service/api';
import type { AssessmentPathTemplateStageVo, AssessmentPathTemplateVo, AssessmentStageRuleVo, AssessmentStageVo } from '@/types/app';

const TEXT = {
  title: '\u8003\u6838\u6a21\u677f\u7ba1\u7406',
  templateName: '\u6a21\u677f\u540d\u79f0',
  stageCount: '\u9636\u6bb5\u6570',
  stageOverview: '\u6a21\u677f\u9636\u6bb5',
  status: '\u72b6\u6001',
  description: '\u8bf4\u660e',
  updatedAt: '\u66f4\u65b0\u65f6\u95f4',
  actions: '\u64cd\u4f5c',
  enabled: '\u542f\u7528',
  disabled: '\u7981\u7528',
  searchName: '\u8bf7\u8f93\u5165\u6a21\u677f\u540d\u79f0',
  search: '\u67e5\u8be2',
  reset: '\u91cd\u7f6e',
  add: '\u65b0\u589e\u8003\u6838\u6a21\u677f',
  edit: '\u7f16\u8f91',
  remove: '\u5220\u9664',
  confirmDelete: '\u786e\u8ba4\u5220\u9664\u8be5\u8003\u6838\u6a21\u677f\u5417\uff1f',
  deleteSuccess: '\u8003\u6838\u6a21\u677f\u5220\u9664\u6210\u529f',
  noDescription: '\u6682\u65e0\u8bf4\u660e',
  passScore: '\u901a\u8fc7\u5206\u6570',
  passRemark: '\u901a\u8fc7\u6807\u51c6',
  materials: '\u9700\u8981\u5b8c\u6210\u7684\u4e8b\u9879',
  rules: '\u8003\u6838\u6307\u6807',
  noMaterials: '\u6682\u672a\u914d\u7f6e',
  noRules: '\u6682\u672a\u914d\u7f6e',
  stageLibraryHint: '\u6a21\u677f\u4e2d\u7684\u9636\u6bb5\u6765\u81ea\u9636\u6bb5\u5e93\uff0c\u8d44\u6599\u4e0e\u6307\u6807\u5728\u9636\u6bb5\u4e2d\u914d\u7f6e'
} as const;

definePageMeta({
  title: TEXT.title
});

interface RowData extends AssessmentPathTemplateVo {
  key: string;
}

const searchParams = ref({
  name: '',
  status: ''
});

const loading = ref(false);
const tableData = ref<RowData[]>([]);
const showDialog = ref(false);
const editData = ref<AssessmentPathTemplateVo | null>(null);
const stageList = ref<AssessmentStageVo[]>([]);

const statusOptions = [
  { label: TEXT.enabled, value: '1' },
  { label: TEXT.disabled, value: '0' }
];

const pagination = reactive({
  page: 1,
  pageSize: 20,
  pageSizes: [20, 50, 100, 200],
  showSizePicker: true,
  itemCount: 0,
  onChange: (page: number) => {
    pagination.page = page;
    loadData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    loadData();
  }
});

const columns = computed<DataTableColumns<RowData>>(() => [
  {
    title: '#',
    key: 'index',
    width: 70,
    align: 'center',
    render: (_, index) => String((pagination.page - 1) * pagination.pageSize + index + 1)
  },
  { title: TEXT.templateName, key: 'name', minWidth: 180, fixed: 'left' },
  { title: TEXT.stageCount, key: 'stageCount', width: 100, align: 'center', render: row => String(row.stages?.length || 0) },
  {
    title: TEXT.stageOverview,
    key: 'stages',
    minWidth: 420,
    render: row => renderStageOverview(row.stages || [])
  },
  {
    title: TEXT.status,
    key: 'status',
    width: 90,
    align: 'center',
    render: row => h(NTag, { bordered: false, type: row.status === '1' ? 'success' : 'error' }, { default: () => (row.status === '1' ? TEXT.enabled : TEXT.disabled) })
  },
  { title: TEXT.description, key: 'description', minWidth: 240, render: row => row.description || '-' },
  { title: TEXT.updatedAt, key: 'updatedAt', width: 180 },
  {
    title: TEXT.actions,
    key: 'actions',
    width: 180,
    fixed: 'right',
    align: 'center',
    render: row => (
      <div class="em-table-actions">
        <NButton size="small" quaternary type="primary" onClick={() => handleEdit(row)}>
          {TEXT.edit}
        </NButton>
        <NPopconfirm onPositiveClick={() => handleDelete(row)}>
          {{
            trigger: () => (
              <NButton size="small" quaternary type="error">
                {TEXT.remove}
              </NButton>
            ),
            default: () => TEXT.confirmDelete
          }}
        </NPopconfirm>
      </div>
    )
  }
]);

onMounted(async () => {
  await loadStageList();
  await loadData();
});

function buildRuleText(rule: AssessmentStageRuleVo) {
  const parts = [rule.questionType, rule.difficulty, rule.knowledgePoints].filter(Boolean);
  const questionCount = rule.questionCount ? `${rule.questionCount}题` : '';
  const score = rule.score !== null && rule.score !== undefined && rule.score !== '' ? `${rule.score}分` : '';
  return [parts.join(' / '), questionCount, score].filter(Boolean).join(' · ');
}

function renderStageOverview(stages: AssessmentPathTemplateStageVo[]) {
  if (!stages.length) return '-';

  return (
    <div class="template-stage-overview">
      {stages.map(stage => (
        <NPopover trigger="hover" placement="top-start" width={420}>
          {{
            trigger: () => (
              <div class="template-stage-tag">
                <span class="template-stage-tag__name">{stage.stageNameSnapshot || '-'}</span>
                <span class="template-stage-tag__meta">{`任务${stage.materials?.length || 0} · 指标${stage.rules?.length || 0}`}</span>
              </div>
            ),
            default: () => (
              <div class="stage-popover">
                <div class="stage-popover__header">
                  <div class="stage-popover__title">{stage.stageNameSnapshot || '-'}</div>
                  <NTag size="small" type="info" bordered={false}>
                    {stage.stageCode || '-'}
                  </NTag>
                </div>
                <div class="stage-popover__row">
                  <span class="stage-popover__label">{TEXT.description}：</span>
                  <span>{stage.stageDescription || TEXT.noDescription}</span>
                </div>
                <div class="stage-popover__row">
                  <span class="stage-popover__label">{TEXT.passScore}：</span>
                  <span>{stage.passScore ?? '-'}</span>
                  <span class="stage-popover__label ml-16px">{TEXT.passRemark}：</span>
                  <span>{stage.passRemark || '-'}</span>
                </div>
                <div class="stage-popover__row">
                  <span class="stage-popover__label">{TEXT.materials}：</span>
                  <span>{stage.materials?.map(item => item.title || item.materialUrl).filter(Boolean).join('；') || TEXT.noMaterials}</span>
                </div>
                <div class="stage-popover__row">
                  <span class="stage-popover__label">{TEXT.rules}：</span>
                  <span>{stage.rules?.map(item => buildRuleText(item)).filter(Boolean).join('；') || TEXT.noRules}</span>
                </div>
              </div>
            )
          }}
        </NPopover>
      ))}
    </div>
  );
}

async function loadStageList() {
  const { data, error } = await fetchAssessmentStageList({
    pageNum: 1,
    pageSize: 500,
    status: '1'
  });

  if (error) {
    stageList.value = [];
    return;
  }

  stageList.value = data?.records || [];
}

async function loadData() {
  loading.value = true;
  try {
    const { data, error } = await fetchAssessmentTemplateList({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      name: searchParams.value.name || undefined,
      status: searchParams.value.status || undefined
    });

    if (error) return;

    tableData.value = (data?.records || []).map((item, index) => ({
      ...item,
      key: item.id || `${index}`
    }));
    pagination.itemCount = data?.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadData();
}

function handleReset() {
  searchParams.value = {
    name: '',
    status: ''
  };
  pagination.page = 1;
  loadData();
}

function handleAdd() {
  editData.value = null;
  showDialog.value = true;
}

function handleEdit(row: RowData) {
  editData.value = { ...row };
  showDialog.value = true;
}

async function handleDelete(row: RowData) {
  if (!row.id) return;

  const { error } = await fetchAssessmentTemplateDelete(row.id);
  if (error) return;

  window.$message?.success(TEXT.deleteSuccess);
  await loadData();
}

async function handleDialogClose(submitted = false) {
  showDialog.value = false;
  editData.value = null;
  if (submitted) {
    await loadStageList();
    await loadData();
  }
}
</script>

<template>
  <SearchTablePageLayout @refresh="loadData">
    <template #searchBox>
      <NGrid :cols="12">
        <NGi span="12">
          <NSpace justify="end">
            <NInput v-model:value="searchParams.name" clearable :placeholder="TEXT.searchName" style="width: 220px" @keyup.enter="handleSearch" />
            <NSelect v-model:value="searchParams.status" :options="statusOptions" clearable :placeholder="TEXT.status" style="width: 140px" />
            <NButton type="primary" @click="handleSearch">{{ TEXT.search }}</NButton>
            <NButton @click="handleReset">{{ TEXT.reset }}</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <template #h-btns>
      <NButton type="primary" @click="handleAdd">
        <NIcon class="mr-6px" size="18"><AddCircle /></NIcon>
        {{ TEXT.add }}
      </NButton>
      <div class="ml-12px text-13px text-[var(--n-text-color-2)]">{{ TEXT.stageLibraryHint }}</div>
    </template>

    <NDataTable
      :bordered="false"
      :single-line="false"
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :row-key="row => row.key"
      flex-height
      :style="{ height: '100%' }"
    />

    <TemplateDialog :show="showDialog" :data="editData" :stage-list="stageList" @close="handleDialogClose" />
  </SearchTablePageLayout>
</template>

<style scoped lang="scss">
.template-stage-overview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-stage-tag {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
  padding: 8px 10px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  background: var(--table-header-color);
  cursor: pointer;
}

.template-stage-tag__name {
  font-weight: 600;
  line-height: 1.4;
}

.template-stage-tag__meta {
  font-size: 12px;
  color: var(--n-text-color-2);
}

.stage-popover {
  line-height: 1.7;
}

.stage-popover__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.stage-popover__title {
  font-size: 15px;
  font-weight: 600;
}

.stage-popover__row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }
}

.stage-popover__label {
  flex-shrink: 0;
  color: var(--n-text-color-2);
}
</style>
