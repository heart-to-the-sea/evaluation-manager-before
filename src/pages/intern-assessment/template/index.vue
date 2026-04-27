<script setup lang="tsx">
import { computed, onActivated, onMounted, reactive, ref } from 'vue';
import { AddCircle } from '@vicons/ionicons5';
import { NButton, NDataTable, NGrid, NGi, NIcon, NInput, NPopconfirm, NPopover, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import DictTag from '@/components/common/DictTag.vue';
import MarkdownPreview from '@/components/common/MarkdownPreview.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import TemplateDialog from '@/components/features/intern-assessment/TemplateDialog.vue';
import { useTableSorter } from '@/composables/use-table-sorter';
import { fetchAssessmentFinalTemplateList, fetchAssessmentStageList, fetchAssessmentTemplateDelete, fetchAssessmentTemplateList } from '@/service/api';
import type { AssessmentFinalTemplateVo, AssessmentPathTemplateStageVo, AssessmentPathTemplateVo, AssessmentStageRuleVo, AssessmentStageVo } from '@/types/app';
import type { SelectOption } from 'naive-ui';

const TEXT = {
  title: '培训模板管理',
  templateName: '模板名称',
  stageCount: '阶段数',
  finalTemplate: '最终考核模板',
  stageOverview: '模板阶段',
  status: '状态',
  description: '说明',
  updatedAt: '更新时间',
  actions: '操作',
  enabled: '启用',
  disabled: '禁用',
  searchName: '请输入模板名称',
  search: '查询',
  reset: '重置',
  add: '新增培训模板',
  edit: '编辑',
  remove: '删除',
  confirmDelete: '确认删除该培训模板吗？',
  deleteSuccess: '培训模板删除成功',
  noDescription: '暂无说明',
  passScore: '通过分数',
  passRemark: '通过标准',
  materials: '需要完成的事项',
  rules: '考核指标',
  noMaterials: '暂未配置',
  noRules: '暂未配置',
  stageLibraryHint: '模板中的阶段来自阶段库，资料与指标在阶段中配置'
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
const finalTemplateList = ref<AssessmentFinalTemplateVo[]>([]);
const { handleSorter, getSortOrder, appendSorter, createSorter, createSorterRender } = useTableSorter(() => loadData());
const sortableColumnKeys = new Set(['name', 'finalTemplateName', 'stageCount', 'status', 'description', 'updatedAt']);

const finalTemplateOptions = computed<SelectOption[]>(() =>
  finalTemplateList.value.map(item => ({
    label: item.name || '-',
    value: item.id || ''
  }))
);

const pagination = reactive({
  page: 1,
  pageSize: 20,
  pageSizes: [20, 50, 100, 200],
  showSizePicker: true,
  itemCount: 0,
  prefix: ({ itemCount }: { itemCount: number }) => `共 ${itemCount} 条`,
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

const columns = computed<DataTableColumns<RowData>>(() =>
  ([
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
    title: TEXT.finalTemplate,
    key: 'finalTemplateName',
    minWidth: 180,
    render: row => row.finalTemplateName || '-'
  },
  {
    title: TEXT.status,
    key: 'status',
    width: 90,
    align: 'center',
    render: row => <DictTag dictCode="assessment_enable_status" value={row.status} />
  },
  {
    title: TEXT.description,
    key: 'description',
    minWidth: 260,
    render: row => <MarkdownPreview class="template-description-preview" content={row.description} compact />
  },
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
] as DataTableColumns<RowData>).map(column => {
    const columnKey = typeof column.key === 'string' ? column.key : '';
    if (!sortableColumnKeys.has(columnKey)) {
      return column;
    }
    return {
      ...column,
      sorter: createSorter(),
      sortOrder: getSortOrder(columnKey),
      renderSorter: createSorterRender(columnKey)
    };
  })
);

onMounted(async () => {
  await loadStageList();
  await loadFinalTemplateList();
  await loadData();
});

onActivated(async () => {
  await loadStageList();
  await loadFinalTemplateList();
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
        <NPopover key={stage.id || stage.stageId || stage.sort} trigger="hover" placement="top-start" width={420}>
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
                  <MarkdownPreview class="stage-popover__markdown" content={stage.stageDescription} emptyText={TEXT.noDescription} compact />
                </div>
                <div class="stage-popover__row">
                  <span class="stage-popover__label">{TEXT.passScore}：</span>
                  <span>{stage.passScore ?? '-'}</span>
                </div>
                <div class="stage-popover__row">
                  <span class="stage-popover__label">{TEXT.passRemark}：</span>
                  <MarkdownPreview class="stage-popover__markdown" content={stage.passRemark} emptyText="-" compact />
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

async function loadFinalTemplateList() {
  const { data, error } = await fetchAssessmentFinalTemplateList({
    pageNum: 1,
    pageSize: 500,
    status: '1'
  });

  if (error) {
    finalTemplateList.value = [];
    return;
  }

  finalTemplateList.value = data?.records || [];
}

async function loadData() {
  loading.value = true;
  try {
    const { data, error } = await fetchAssessmentTemplateList(appendSorter({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      name: searchParams.value.name || undefined,
      status: searchParams.value.status || undefined
    }));

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

async function handleAdd() {
  await loadFinalTemplateList();
  editData.value = null;
  showDialog.value = true;
}

async function handleEdit(row: RowData) {
  await loadFinalTemplateList();
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
    await loadFinalTemplateList();
    await loadData();
  }
}
</script>

<template>
  <SearchTablePageLayout :pagination="pagination" @refresh="loadData">
    <template #searchBox>
      <NGrid :cols="12">
        <NGi span="12">
          <NSpace justify="end">
            <NInput v-model:value="searchParams.name" clearable :placeholder="TEXT.searchName" style="width: 220px" @keyup.enter="handleSearch" />
            <DictSelect v-model:model-value="searchParams.status" dict-code="assessment_enable_status" clearable :placeholder="TEXT.status" style="width: 140px" />
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
      remote
      flex-height
      :style="{ height: '100%' }"
      @update:sorter="handleSorter"
    />

    <TemplateDialog
      :show="showDialog"
      :data="editData"
      :stage-list="stageList"
      :final-template-options="finalTemplateOptions"
      @close="handleDialogClose"
    />
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
  gap: 8px;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }
}

.stage-popover__label {
  flex-shrink: 0;
  color: var(--n-text-color-2);
}

.stage-popover__markdown,
:deep(.template-description-preview) {
  flex: 1;
  min-width: 0;
}
</style>
