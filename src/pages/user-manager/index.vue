<script setup lang="tsx">
import { AddCircle, CloudDownload, CloudUploadSharp } from '@vicons/ionicons5';
import { NButton, NDataTable, NDatePicker, NGrid, NGi, NIcon, NInput, NPopconfirm, NSelect, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import AppendDialog from '@/components/features/user/AppendDialog.vue';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';

definePageMeta({
  title: '用户管理'
});

interface RowData {
  key: number;
  id: number;
  account: string;
  username: string;
  birthday: string;
  gender: string;
  deptName: string;
  createTime: string;
  updateTime: string;
}

const showAppendDialog = ref(false);
const searchParams = ref({
  account: '',
  username: '',
  gender: null as string | null,
  dateRange: null as [number, number] | null
});

const genderOptions = [
  { label: '男', value: '男' },
  { label: '女', value: '女' }
];

const tableData = ref<RowData[]>(
  Array.from({ length: 32 }).map((_, index) => ({
    key: index,
    id: index + 1,
    account: `user_${index + 1}`,
    username: `用户${index + 1}`,
    birthday: '1995-01-01',
    gender: index % 2 === 0 ? '男' : '女',
    deptName: ['研发部', '行政部', '运营部'][index % 3],
    createTime: '2026-04-14 09:00:00',
    updateTime: '2026-04-14 10:00:00'
  }))
);

const columns = ref<DataTableColumns<RowData>>([
  { type: 'selection', width: 48, fixed: 'left' },
  { title: '序号', key: 'index', width: 80, render: (_, index) => String(index + 1) },
  { title: '账户', key: 'account', width: 160, fixed: 'left' },
  { title: '用户名', key: 'username', width: 160, fixed: 'left' },
  { title: '生日', key: 'birthday', width: 140 },
  {
    title: '性别',
    key: 'gender',
    width: 90,
    render: row => h(NTag, { bordered: false, type: row.gender === '男' ? 'info' : 'warning' }, { default: () => row.gender })
  },
  { title: '部门', key: 'deptName', width: 140 },
  { title: '创建时间', key: 'createTime', width: 180 },
  { title: '更新时间', key: 'updateTime', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    align: 'center',
    fixed: 'right',
    render: row =>
      h(NSpace, { justify: 'center', size: 'small' }, {
        default: () => [
          h(
            NButton,
            { size: 'small', quaternary: true, type: 'primary', onClick: () => navigateTo(`/user-manager/info/${row.id}`) },
            { default: () => '详情' }
          ),
          h(NButton, { size: 'small', quaternary: true, type: 'primary' }, { default: () => '编辑' }),
          h(
            NPopconfirm,
            { onPositiveClick: () => window.$message?.success(`已删除演示数据：${row.username}`) },
            {
              trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' }, { default: () => '删除' }),
              default: () => '确认删除这个用户吗？'
            }
          )
        ]
      })
  }
]);

const pagination = reactive({
  page: 1,
  pageSize: 20,
  pageSizes: [20, 50, 100],
  showSizePicker: true,
  onChange: (page: number) => {
    pagination.page = page;
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
  }
});

function handleSearch() {
  window.$message?.info('演示页面暂未接入真实筛选接口');
}

function handleReset() {
  searchParams.value = {
    account: '',
    username: '',
    gender: null,
    dateRange: null
  };
}
</script>

<template>
  <SearchTablePageLayout>
    <template #searchBox>
      <NGrid :cols="12">
        <NGi span="12">
          <NSpace justify="end">
            <NInput v-model:value="searchParams.account" placeholder="请输入账户" clearable style="width: 160px" @keyup.enter="handleSearch" />
            <NInput v-model:value="searchParams.username" placeholder="请输入用户名" clearable style="width: 160px" @keyup.enter="handleSearch" />
            <NSelect v-model:value="searchParams.gender" placeholder="请选择性别" clearable :options="genderOptions" style="width: 120px" />
            <NDatePicker v-model:value="searchParams.dateRange" type="daterange" clearable style="width: 260px" />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <template #h-btns>
      <NButton type="primary" class="mr-6px" @click="showAppendDialog = true">
        <NIcon class="mr-6px" size="18"><AddCircle /></NIcon>
        新增
      </NButton>
      <NButton type="warning" class="mr-6px">
        <NIcon class="mr-6px" size="18"><CloudDownload /></NIcon>
        导出
      </NButton>
      <NButton type="success">
        <NIcon class="mr-6px" size="18"><CloudUploadSharp /></NIcon>
        导入
      </NButton>
    </template>

    <NDataTable
      :bordered="false"
      :single-line="false"
      :columns="columns"
      :data="tableData"
      :pagination="pagination"
      flex-height
      :style="{ height: '100%' }"
    />

    <AppendDialog :show="showAppendDialog" @close="showAppendDialog = false" />
  </SearchTablePageLayout>
</template>
