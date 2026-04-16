<script setup lang="tsx">
import { computed, h, onMounted, reactive, ref } from 'vue';
import { AddCircle } from '@vicons/ionicons5';
import { NButton, NDataTable, NDatePicker, NGrid, NGi, NIcon, NInput, NPopconfirm, NSpace, NTag, NTreeSelect } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import DictSelect from '@/components/common/DictSelect.vue';
import AppendDialog from '@/components/features/user/AppendDialog.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';
import { useDict } from '@/composables/use-dict';
import { fetchDepartmentTreeList, fetchUserDelete, fetchUserList } from '@/service/api';
import type { DepartmentVo, UserVo } from '@/types/app';

definePageMeta({
  title: '人员管理'
});

interface SearchParams {
  employeeNo: string;
  name: string;
  phone: string;
  departmentId: string | null;
  userType: string | null;
  jobStatus: string | null;
  workStatus: string | null;
  accountStatus: string | null;
  dateRange: [number, number] | null;
}

interface RowData extends UserVo {
  key: string;
}

const searchParams = ref<SearchParams>({
  employeeNo: '',
  name: '',
  phone: '',
  departmentId: null,
  userType: null,
  jobStatus: null,
  workStatus: null,
  accountStatus: null,
  dateRange: null
});

const loading = ref(false);
const tableData = ref<RowData[]>([]);
const showAppendDialog = ref(false);
const editData = ref<UserVo | null>(null);
const departmentTree = ref<DepartmentVo[]>([]);

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

const genderDict = useDict('employee_gender');
const userTypeDict = useDict('user_type');
const jobStatusDict = useDict('employee_job_status');
const workStatusDict = useDict('employee_work_status');
const accountStatusDict = useDict('employee_account_status');
const positionDict = useDict('employee_position');
const departmentOptions = computed(() => buildDepartmentOptions(departmentTree.value));

const columns = computed<DataTableColumns<RowData>>(() => [
  { type: 'selection', width: 48, fixed: 'left' },
  {
    title: '#',
    key: 'index',
    width: 70,
    align: 'center',
    render: (_, index) => String((pagination.page - 1) * pagination.pageSize + index + 1)
  },
  { title: '工号', key: 'employeeNo', minWidth: 120, fixed: 'left' },
  { title: '姓名', key: 'name', minWidth: 120, fixed: 'left' },
  {
    title: '用户类型',
    key: 'userType',
    width: 110,
    align: 'center',
    render: row => renderTag(row.userTypeLabel || userTypeDict.getLabel(row.userType), row.userType === 'intern' ? 'warning' : 'info')
  },
  {
    title: '性别',
    key: 'gender',
    width: 90,
    align: 'center',
    render: row => renderTag(genderDict.getLabel(row.gender), 'info')
  },
  { title: '手机号', key: 'phone', minWidth: 140 },
  { title: '所属部门', key: 'departmentName', minWidth: 140 },
  { title: '岗位名称', key: 'positionName', minWidth: 140, render: row => row.positionNameLabel || positionDict.getLabel(row.positionName) || '-' },
  {
    title: '负责人',
    key: 'leaderFlag',
    width: 90,
    align: 'center',
    render: row => renderTag(row.leaderFlag ? '是' : '否', row.leaderFlag ? 'warning' : 'default')
  },
  { title: '入职日期', key: 'entryDate', width: 120 },
  {
    title: '任职状态',
    key: 'jobStatus',
    width: 100,
    align: 'center',
    render: row => renderTag(jobStatusDict.getLabel(row.jobStatus), row.jobStatus === '1' ? 'success' : 'warning')
  },
  {
    title: '工作状态',
    key: 'workStatus',
    width: 100,
    align: 'center',
    render: row => renderTag(workStatusDict.getLabel(row.workStatus), 'info')
  },
  {
    title: '账号状态',
    key: 'accountStatus',
    width: 100,
    align: 'center',
    render: row => renderTag(accountStatusDict.getLabel(row.accountStatus), row.accountStatus === '1' ? 'success' : 'error')
  },
  { title: '创建时间', key: 'createdAt', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
    align: 'center',
    render: row => (
      <div class="em-table-actions">
        <NButton size="small" quaternary type="primary" onClick={() => navigateTo(`/user-manager/info/${row.id}`)}>
          详情
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
            default: () => '确认删除这条人员数据吗？'
          }}
        </NPopconfirm>
      </div>
    )
  }
]);

onMounted(async () => {
  await loadDepartmentTree();
  await loadData();
});

function renderTag(label: string, type: 'default' | 'success' | 'info' | 'warning' | 'error') {
  return h(NTag, { bordered: false, type }, { default: () => label || '-' });
}

function buildDepartmentOptions(list: DepartmentVo[]) {
  return (list || []).map(item => ({
    label: item.name || '未命名部门',
    value: item.id || '',
    children: item.children?.length ? buildDepartmentOptions(item.children) : undefined
  }));
}

function formatDateRange(value: [number, number] | null) {
  if (!value?.length) {
    return { start: undefined, end: undefined };
  }

  return {
    start: formatDate(value[0]),
    end: formatDate(value[1])
  };
}

function formatDate(value?: number | null) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function loadDepartmentTree() {
  const { data, error } = await fetchDepartmentTreeList({ status: '1' });
  if (error) {
    return;
  }

  departmentTree.value = data || [];
}

async function loadData() {
  loading.value = true;

  try {
    const dateRange = formatDateRange(searchParams.value.dateRange);
    const { data, error } = await fetchUserList({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      employeeNo: searchParams.value.employeeNo || undefined,
      name: searchParams.value.name || undefined,
      phone: searchParams.value.phone || undefined,
      departmentId: searchParams.value.departmentId || undefined,
      userType: searchParams.value.userType || undefined,
      jobStatus: searchParams.value.jobStatus || undefined,
      workStatus: searchParams.value.workStatus || undefined,
      accountStatus: searchParams.value.accountStatus || undefined,
      entryDateStart: dateRange.start,
      entryDateEnd: dateRange.end
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
    employeeNo: '',
    name: '',
    phone: '',
    departmentId: null,
    userType: null,
    jobStatus: null,
    workStatus: null,
    accountStatus: null,
    dateRange: null
  };
  pagination.page = 1;
  loadData();
}

function handleAdd() {
  editData.value = null;
  showAppendDialog.value = true;
}

function handleEdit(row: RowData) {
  editData.value = row;
  showAppendDialog.value = true;
}

async function handleDelete(row: RowData) {
  if (!row.id) {
    return;
  }

  const { error } = await fetchUserDelete(row.id);
  if (error) {
    return;
  }

  window.$message?.success('人员删除成功');
  await loadData();
}

async function handleDialogClose(submitted = false) {
  showAppendDialog.value = false;
  editData.value = null;

  if (submitted) {
    await loadDepartmentTree();
    await loadData();
  }
}

async function handleRefresh() {
  await loadDepartmentTree();
  await loadData();
}
</script>

<template>
  <SearchTablePageLayout @refresh="handleRefresh">
    <template #searchBox>
      <NGrid :cols="12">
        <NGi span="12">
          <NSpace justify="end">
            <NInput v-model:value="searchParams.employeeNo" clearable placeholder="请输入工号" style="width: 160px" @keyup.enter="handleSearch" />
            <NInput v-model:value="searchParams.name" clearable placeholder="请输入姓名" style="width: 160px" @keyup.enter="handleSearch" />
            <NInput v-model:value="searchParams.phone" clearable placeholder="请输入手机号" style="width: 160px" @keyup.enter="handleSearch" />
            <NTreeSelect
              v-model:value="searchParams.departmentId"
              :options="departmentOptions"
              clearable
              filterable
              default-expand-all
              key-field="value"
              label-field="label"
              children-field="children"
              placeholder="请选择部门"
              style="width: 180px"
            />
            <DictSelect v-model:model-value="searchParams.userType" dict-code="user_type" clearable placeholder="用户类型" style="width: 140px" />
            <DictSelect v-model:model-value="searchParams.jobStatus" dict-code="employee_job_status" clearable placeholder="任职状态" style="width: 140px" />
            <DictSelect v-model:model-value="searchParams.workStatus" dict-code="employee_work_status" clearable placeholder="工作状态" style="width: 140px" />
            <DictSelect
              v-model:model-value="searchParams.accountStatus"
              dict-code="employee_account_status"
              clearable
              placeholder="账号状态"
              style="width: 140px"
            />
            <NDatePicker v-model:value="searchParams.dateRange" clearable type="daterange" style="width: 260px" />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <template #h-btns>
      <NButton type="primary" @click="handleAdd">
        <NIcon class="mr-6px" size="18"><AddCircle /></NIcon>
        新增人员
      </NButton>
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

    <AppendDialog :show="showAppendDialog" :data="editData" :department-tree="departmentTree" @close="handleDialogClose" />
  </SearchTablePageLayout>
</template>
