<script setup lang="tsx">
import { h, ref } from 'vue';
import { NButton, NDatePicker, NGrid, NGridItem, NIcon, NInput, NPopconfirm, NSelect, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { AddCircle } from '@vicons/ionicons5';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';

interface RowData {
  key: number;
  id: number;
  account: string;
  nickname: string;
  birthday: string;
  gender: string;
  deptId: number;
  createTime: string;
  updateTime: string;
}

const searchParams = ref({
  account: '',
  nickname: '',
  gender: null,
  dateRange: null as [number, number] | null
});

const genderOptions = [
  { label: '男', value: '男' },
  { label: '女', value: '女' }
];

const data = Array.from({ length: 100 }).map((_, index) => ({
  key: index,
  id: index + 1,
  account: `user_${index}`,
  nickname: `用户${index}`,
  birthday: '1990-01-01',
  gender: index % 2 === 0 ? '男' : '女',
  deptId: Math.floor(Math.random() * 10) + 1,
  createTime: '2024-01-01 10:00:00',
  updateTime: '2024-01-01 10:00:00'
}));

const columns = ref<DataTableColumns<RowData>>([
  {
    type: 'selection',
    fixed: 'left',
    width: '50px'
  },
  {
    title: 'ID',
    key: 'id',
    width: 80,
    fixed: 'left'
  },
  {
    title: '账户',
    key: 'account',
    width: 150,
    fixed: 'left'
  },
  {
    title: '昵称',
    key: 'nickname',
    width: 150,
    fixed: 'left'
  },
  {
    title: '生日',
    key: 'birthday',
    width: 150
  },
  {
    title: '性别',
    key: 'gender',
    width: 100,
    render(row: RowData) {
      const tagType = row.gender === '男' ? 'info' : 'warning';
      return h(NTag, { type: tagType, bordered: false }, { default: () => row.gender });
    }
  },
  {
    title: '部门ID',
    key: 'deptId',
    width: 100
  },
  {
    title: '创建时间',
    key: 'createTime',
    width: 180
  },
  {
    title: '更新时间',
    key: 'updateTime',
    width: 180
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    align: 'center',
    fixed: 'right',
    render(row: RowData) {
      return h(
        NSpace,
        { justify: 'center', size: 'small' },
        {
          default: () => [
            h(
              NButton,
              { type: 'primary', quaternary: true, size: 'small', onClick: () => handleDetail(row) },
              { default: () => '详情' }
            ),
            h(
              NButton,
              { type: 'primary', quaternary: true, size: 'small', onClick: () => handleEdit(row) },
              { default: () => '编辑' }
            ),
            h(
              NPopconfirm,
              { onPositiveClick: () => handleDelete(row) },
              {
                trigger: () =>
                  h(NButton, { type: 'error', quaternary: true, size: 'small' }, { default: () => '删除' }),
                default: () => '确定要删除该用户吗？'
              }
            )
          ]
        }
      );
    }
  }
]);

const pagination = { pageSize: 100 };

function handleSearch() {
  console.log('搜索参数:', searchParams.value);
}

function handleReset() {
  searchParams.value = {
    account: '',
    nickname: '',
    gender: null,
    dateRange: null
  };
}

function handleDetail(row: RowData) {
  console.log('查看详情:', row);
}

function handleEdit(row: RowData) {
  console.log('编辑:', row);
}

function handleDelete(row: RowData) {
  console.log('删除:', row);
}
</script>

<template>
  <SearchTablePageLayout>
    <template #searchBox>
      <NGrid :cols="12">
        <NGi span="2">
          <NButton type="primary" style="margin-right: 6px">
            <NIcon style="margin-right: 6px" size="18"><AddCircle /></NIcon>
            新增
          </NButton>
          <NButton type="error">
            <NIcon style="margin-right: 6px" size="18"><AddCircle /></NIcon>
            批量删除
          </NButton>
        </NGi>
        <NGi span="10">
          <NSpace justify="end">
            <NInput
              v-model:value="searchParams.account"
              placeholder="请输入账户"
              clearable
              style="width: 150px"
              @keyup.enter="handleSearch"
            />
            <NInput
              v-model:value="searchParams.nickname"
              placeholder="请输入昵称"
              clearable
              style="width: 150px"
              @keyup.enter="handleSearch"
            />
            <NSelect
              v-model:value="searchParams.gender"
              placeholder="请选择性别"
              :options="genderOptions"
              clearable
              style="width: 120px"
            />
            <NDatePicker v-model:value="searchParams.dateRange" type="daterange" clearable style="width: 260px" />
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton type="default" @click="handleReset">重置</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </template>

    <template #contentBox>
      <NDataTable
        :bordered="false"
        :single-line="false"
        :columns="columns"
        :data="data"
        :pagination="pagination"
        :style="{ height: `100%` }"
        flex-height
      />
    </template>
  </SearchTablePageLayout>
</template>
