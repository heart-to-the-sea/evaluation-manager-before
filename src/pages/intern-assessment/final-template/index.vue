<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue';
import { AddCircle } from '@vicons/ionicons5';
import { NButton, NDataTable, NGrid, NGi, NIcon, NInput, NPopconfirm, NPopover, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import DictTag from '@/components/common/DictTag.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import FinalTemplateDialog from '@/components/features/intern-assessment/FinalTemplateDialog.vue';
import { useTableSorter } from '@/composables/use-table-sorter';
import { fetchAssessmentFinalTemplateDelete, fetchAssessmentFinalTemplateList } from '@/service/api';
import type { AssessmentFinalTemplateDimensionVo, AssessmentFinalTemplateVo } from '@/types/app';

definePageMeta({
  title: '最终考核模板'
});

interface RowData extends AssessmentFinalTemplateVo {
  key: string;
}

const searchParams = ref({
  name: '',
  status: ''
});

const loading = ref(false);
const tableData = ref<RowData[]>([]);
const showDialog = ref(false);
const editData = ref<AssessmentFinalTemplateVo | null>(null);
const { handleSorter, getSortOrder, appendSorter, createSorter, createSorterRender } = useTableSorter(() => loadData());
const sortableColumnKeys = new Set(['name', 'totalScore', 'status', 'updatedAt']);

const pagination = reactive({
  page: 1,
  pageSize: 20,
  pageSizes: [20, 50, 100, 200],
  showSizePicker: true,
  itemCount: 0,
  prefix: ({ itemCount }: { itemCount: number }) => `共 ${itemCount || 0} 条`,
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
    { title: '模板名称', key: 'name', minWidth: 190, fixed: 'left' },
    {
      title: '评分结构',
      key: 'dimensions',
      minWidth: 460,
      render: row => renderDimensionOverview(row.dimensions || [])
    },
    {
      title: '总分',
      key: 'totalScore',
      width: 110,
      align: 'center',
      render: row => <NTag type="info" bordered={false}>{row.totalScore || 0}</NTag>
    },
    {
      title: '状态',
      key: 'status',
      width: 90,
      align: 'center',
      render: row => <DictTag dictCode="assessment_enable_status" value={row.status} />
    },
    { title: '说明', key: 'description', minWidth: 240, render: row => row.description || '-' },
    { title: '更新时间', key: 'updatedAt', width: 180 },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      align: 'center',
      render: row => (
        <div class="em-table-actions">
          <NButton size="small" quaternary type="primary" onClick={() => handleEdit(row)}>
            编辑
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row)}>
            {{
              trigger: () => (
                <NButton size="small" quaternary type="error">
                  删除
                </NButton>
              ),
              default: () => '确认删除该最终考核模板吗？'
            }}
          </NPopconfirm>
        </div>
      )
    }
  ] as DataTableColumns<RowData>).map(column => {
    const columnKey = typeof column.key === 'string' ? column.key : '';
    if (!sortableColumnKeys.has(columnKey)) return column;
    return {
      ...column,
      sorter: createSorter(),
      sortOrder: getSortOrder(columnKey),
      renderSorter: createSorterRender(columnKey)
    };
  })
);

onMounted(() => {
  loadData();
});

function getDimensionScore(dimension: AssessmentFinalTemplateDimensionVo) {
  return (dimension.items || []).reduce((total, item) => total + Number(item.score || 0), 0);
}

function renderDimensionOverview(dimensions: AssessmentFinalTemplateDimensionVo[]) {
  if (!dimensions.length) return '-';
  return (
    <div class="final-dimension-overview">
      {dimensions.map(dimension => (
        <NPopover trigger="hover" placement="top-start" width={460}>
          {{
            trigger: () => (
              <div class="final-dimension-chip">
                <span class="final-dimension-chip__name">{dimension.name || '-'}</span>
                <span class="final-dimension-chip__meta">{`${dimension.items?.length || 0}项 · ${getDimensionScore(dimension)}分`}</span>
              </div>
            ),
            default: () => (
              <div class="final-dimension-popover">
                <div class="final-dimension-popover__header">
                  <div class="final-dimension-popover__title">{dimension.name || '-'}</div>
                  <NTag size="small" type="info" bordered={false}>{dimension.code || '-'}</NTag>
                  <NTag size="small" type="success" bordered={false}>{`${getDimensionScore(dimension)}分`}</NTag>
                </div>
                <div class="final-dimension-popover__desc">{dimension.description || '暂无说明'}</div>
                <div class="final-score-items">
                  {(dimension.items || []).map(item => (
                    <div class="final-score-item">
                      <span>{item.name || '-'}</span>
                      <strong>{item.score || 0}分</strong>
                    </div>
                  ))}
                </div>
              </div>
            )
          }}
        </NPopover>
      ))}
    </div>
  );
}

async function loadData() {
  loading.value = true;
  try {
    const { data, error } = await fetchAssessmentFinalTemplateList(appendSorter({
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
  searchParams.value = { name: '', status: '' };
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
  const { error } = await fetchAssessmentFinalTemplateDelete(row.id);
  if (error) return;
  window.$message?.success('最终考核模板删除成功');
  await loadData();
}

async function handleDialogClose(submitted = false) {
  showDialog.value = false;
  editData.value = null;
  if (submitted) {
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
            <NInput v-model:value="searchParams.name" clearable placeholder="请输入模板名称" style="width: 220px" @keyup.enter="handleSearch" />
            <DictSelect v-model:model-value="searchParams.status" dict-code="assessment_enable_status" clearable placeholder="状态" style="width: 140px" />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <template #h-btns>
      <NButton type="primary" @click="handleAdd">
        <NIcon class="mr-6px" size="18"><AddCircle /></NIcon>
        新增最终考核模板
      </NButton>
      <div class="ml-12px text-13px text-[var(--n-text-color-2)]">用于最终考核：工作能力、工作成果、沟通表达等维度可独立配置分值。</div>
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

    <FinalTemplateDialog :show="showDialog" :data="editData" @close="handleDialogClose" />
  </SearchTablePageLayout>
</template>

<style scoped lang="scss">
.final-dimension-overview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.final-dimension-chip {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  min-width: 118px;
  padding: 8px 10px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  background: var(--table-header-color);
  cursor: pointer;
}

.final-dimension-chip__name {
  font-weight: 600;
  line-height: 1.4;
}

.final-dimension-chip__meta {
  color: var(--n-text-color-2);
  font-size: 12px;
}

.final-dimension-popover__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.final-dimension-popover__title {
  font-size: 15px;
  font-weight: 600;
}

.final-dimension-popover__desc {
  margin-bottom: 10px;
  color: var(--n-text-color-2);
}

.final-score-items {
  display: grid;
  gap: 6px;
}

.final-score-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 9px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  background: var(--container-bg-color);

  strong {
    color: var(--em-primary-color);
  }
}
</style>
