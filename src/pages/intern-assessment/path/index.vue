<script setup lang="tsx">
import { computed, h, onMounted, reactive, ref, watch } from 'vue';
import { AddCircle } from '@vicons/ionicons5';
import { NButton, NDataTable, NGrid, NGi, NIcon, NPopconfirm, NSpace, NSelect, NTag } from 'naive-ui';
import type { DataTableColumns, SelectOption } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import PaperCreateDialog from '@/components/features/intern-assessment/PaperCreateDialog.vue';
import PathDialog from '@/components/features/intern-assessment/PathDialog.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import { useDict } from '@/composables/use-dict';
import { fetchAssessmentPathDelete, fetchAssessmentPathList, fetchAssessmentStageList, fetchAssessmentTemplateList, fetchUserOptions } from '@/service/api';
import type { AssessmentInternPathVo, UserOptionVo } from '@/types/app';

definePageMeta({
  title: '考核管理'
});

interface RowData extends AssessmentInternPathVo {
  key: string;
}

const route = useRoute();

const searchParams = ref({
  userId: (route.query.userId as string) || null,
  templateId: null as string | null,
  status: null as string | null
});

const loading = ref(false);
const tableData = ref<RowData[]>([]);
const showDialog = ref(false);
const showPaperDialog = ref(false);
const editData = ref<AssessmentInternPathVo | null>(null);
const defaultCreateUserId = ref<string | null>(null);
const userOptions = ref<UserOptionVo[]>([]);
const stageOptions = ref<SelectOption[]>([]);
const templateOptions = ref<SelectOption[]>([]);

const statusDict = useDict('assessment_path_status');
const stageStatusDict = useDict('assessment_path_stage_status');

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

const userSelectOptions = computed<SelectOption[]>(() =>
  userOptions.value.map(item => ({
    label: `${item.name || '-'}${item.employeeNo ? `（${item.employeeNo}）` : ''}`,
    value: item.id || ''
  }))
);

const columns = computed<DataTableColumns<RowData>>(() => [
  {
    title: '#',
    key: 'index',
    width: 70,
    align: 'center',
    render: (_, index) => String((pagination.page - 1) * pagination.pageSize + index + 1)
  },
  { title: '实习生', key: 'userName', width: 140, fixed: 'left', render: row => row.userName || '-' },
  { title: '工号', key: 'employeeNo', width: 120, render: row => row.employeeNo || '-' },
  { title: '路径模板', key: 'templateName', minWidth: 160, render: row => row.templateName || '-' },
  { title: '当前阶段', key: 'currentStageName', minWidth: 140, render: row => row.currentStageName || '-' },
  {
    title: '路径状态',
    key: 'status',
    width: 120,
    align: 'center',
    render: row => h(NTag, { bordered: false, type: row.status === 'completed' ? 'success' : 'warning' }, { default: () => statusDict.getLabel(row.status) || '-' })
  },
  {
    title: '阶段明细',
    key: 'stages',
    minWidth: 320,
    render: row =>
      (row.stages || [])
        .map(item => `${item.stageName || '-'}（${stageStatusDict.getLabel(item.status) || item.status || '-'}）`)
        .join(' / ') || '-'
  },
  { title: '更新时间', key: 'updatedAt', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 250,
    fixed: 'right',
    align: 'center',
    render: row => (
      <div class="em-table-actions">
        <NButton size="small" quaternary type="primary" onClick={() => handleCreatePaper(row)}>
          生成试卷
        </NButton>
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
            default: () => '确认删除该考核管理吗？'
          }}
        </NPopconfirm>
      </div>
    )
  }
]);

watch(
  () => route.query.userId,
  value => {
    searchParams.value.userId = (value as string) || null;
    pagination.page = 1;
    loadData();
  }
);

onMounted(async () => {
  await Promise.all([loadUsers(), loadStageOptions(), loadTemplateOptions()]);
  await loadData();
});

async function loadUsers() {
  const { data, error } = await fetchUserOptions({ userType: 'intern' });
  if (error) {
    userOptions.value = [];
    return;
  }
  userOptions.value = data || [];
}

async function loadStageOptions() {
  const { data, error } = await fetchAssessmentStageList({ pageNum: 1, pageSize: 500, status: '1' });
  if (error) {
    stageOptions.value = [];
    return;
  }
  stageOptions.value = (data?.records || []).map(item => ({
    label: `${item.name || '-'}（${item.code || '-'}）`,
    value: item.id || ''
  }));
}

async function loadTemplateOptions() {
  const { data, error } = await fetchAssessmentTemplateList({ pageNum: 1, pageSize: 500, status: '1' });
  if (error) {
    templateOptions.value = [];
    return;
  }
  templateOptions.value = (data?.records || []).map(item => ({
    label: item.name || '-',
    value: item.id || ''
  }));
}

async function loadData() {
  loading.value = true;
  try {
    const { data, error } = await fetchAssessmentPathList({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      userId: searchParams.value.userId || undefined,
      templateId: searchParams.value.templateId || undefined,
      status: searchParams.value.status || undefined
    });
    if (error) {
      return;
    }
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
    userId: null,
    templateId: null,
    status: null
  };
  pagination.page = 1;
  loadData();
}

function handleAdd() {
  editData.value = searchParams.value.userId ? ({ userId: searchParams.value.userId } as AssessmentInternPathVo) : null;
  showDialog.value = true;
}

function handleEdit(row: RowData) {
  editData.value = { ...row };
  showDialog.value = true;
}

function handleCreatePaper(row?: RowData) {
  defaultCreateUserId.value = row?.userId || searchParams.value.userId || null;
  showPaperDialog.value = true;
}

async function handleDelete(row: RowData) {
  if (!row.id) {
    return;
  }
  const { error } = await fetchAssessmentPathDelete(row.id);
  if (error) {
    return;
  }
  window.$message?.success('考核管理删除成功');
  await loadData();
}

async function handleDialogClose(submitted = false) {
  showDialog.value = false;
  editData.value = null;
  if (submitted) {
    await loadData();
  }
}

async function handlePaperDialogClose(submitted = false) {
  showPaperDialog.value = false;
  defaultCreateUserId.value = null;
  if (submitted) {
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
            <NSelect v-model:value="searchParams.userId" :options="userSelectOptions" clearable filterable placeholder="实习生" style="width: 220px" />
            <NSelect v-model:value="searchParams.templateId" :options="templateOptions" clearable placeholder="路径模板" style="width: 180px" />
            <DictSelect v-model:model-value="searchParams.status" dict-code="assessment_path_status" clearable placeholder="路径状态" style="width: 140px" />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <template #h-btns>
      <NButton type="primary" class="mr-8px" @click="handleAdd">
        <NIcon class="mr-6px" size="18"><AddCircle /></NIcon>
        新增路径
      </NButton>
      <NButton @click="handleCreatePaper()">生成试卷</NButton>
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

    <PathDialog
      :show="showDialog"
      :data="editData"
      :user-options="userOptions"
      :template-options="templateOptions"
      :stage-options="stageOptions"
      @close="handleDialogClose"
    />

    <PaperCreateDialog :show="showPaperDialog" :user-options="userOptions" :default-user-id="defaultCreateUserId" @close="handlePaperDialogClose" />
  </SearchTablePageLayout>
</template>
