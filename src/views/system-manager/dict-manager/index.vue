<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NGrid, NIcon, NInput, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { AddCircle } from '@vicons/ionicons5';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';

interface DictData {
  id: number;
  label: string;
  value: string;
  sort: number;
  status: boolean;
}

interface RowData {
  key: number;
  id: number;
  name: string;
  code: string;
  description: string;
  status: boolean;
  createTime: string;
  updateTime: string;
  children?: DictData[];
}

const searchParams = ref({
  name: '',
  code: ''
});

const data = ref<RowData[]>(
  Array.from({ length: 10 }).map((_, index) => ({
    key: index,
    id: index + 1,
    name: `字典${index + 1}`,
    code: `dict_${index + 1}`,
    description: `这是字典${index + 1}的描述`,
    status: index % 2 === 0,
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:00',
    children: Array.from({ length: 3 }).map(() => ({
      id: 1,
      label: `选项${1}`,
      value: `value_${1}`,
      sort: 1,
      status: true
    }))
  }))
);

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
    title: '字典名称',
    key: 'name',
    width: 150,
    fixed: 'left'
  },
  {
    title: '字典编码',
    key: 'code',
    width: 150,
    fixed: 'left'
  },
  {
    title: '描述',
    key: 'description',
    width: 200
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row: RowData) {
      const tagType = row.status ? 'success' : 'error';
      return (
        <NTag type={tagType} bordered={false}>
          {row.status ? '启用' : '禁用'}
        </NTag>
      );
    }
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
      return (
        <NSpace justify="center" size="small">
          <NButton type="primary" quaternary size="small" onClick={() => handleEdit(row)}>
            编辑
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row)}>
            {{
              trigger: () => (
                <NButton type="error" quaternary size="small">
                  删除
                </NButton>
              ),
              default: () => '确定要删除该字典吗？'
            }}
          </NPopconfirm>
        </NSpace>
      );
    }
  }
]);

const pagination = { pageSize: 100 };

const showModal = ref(false);
const modalType = ref<'add' | 'edit'>('add');
const formData = ref<any>({
  name: '',
  code: '',
  description: '',
  status: true,
  items: [{ label: '', value: '', sort: 1, status: true }]
});

function handleSearch() {
  console.log('搜索参数:', searchParams.value);
}

function handleReset() {
  searchParams.value = { name: '', code: '' };
}

function handleAdd() {
  modalType.value = 'add';
  formData.value = {
    name: '',
    code: '',
    description: '',
    status: true,
    items: [{ label: '', value: '', sort: 1, status: true }]
  };
  showModal.value = true;
}

function handleEdit(row: RowData) {
  modalType.value = 'edit';
  formData.value = {
    name: row.name,
    code: row.code,
    description: row.description,
    status: row.status,
    items:
      row.children?.map(item => ({ label: item.label, value: item.value, sort: item.sort, status: item.status })) || []
  };
  showModal.value = true;
}

function handleDelete(row: RowData) {
  console.log('删除:', row);
}

function handleSubmit(_: any) {
  console.log('提交数据:');
}
</script>

<template>
  <SearchTablePageLayout>
    <template #searchBox>
      <NGrid :cols="12">
        <NGi span="2">
          <NButton type="primary" @click="handleAdd">
            <NIcon style="margin-right: 6px" size="18"><AddCircle /></NIcon>
            新增
          </NButton>
          <NButton type="error">批量删除</NButton>
        </NGi>
        <NGi span="10">
          <NSpace justify="end">
            <NInput
              v-model:value="searchParams.name"
              placeholder="请输入字典名称"
              clearable
              style="width: 150px"
              @keyup.enter="handleSearch"
            />
            <NInput
              v-model:value="searchParams.code"
              placeholder="请输入字典编码"
              clearable
              style="width: 150px"
              @keyup.enter="handleSearch"
            />
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
        :row-key="(row: RowData) => row.key"
      />
    </template>
  </SearchTablePageLayout>
</template>
