<script setup lang="tsx">
import { NButton, NDataTable, NInput, NModal, NPopconfirm, NSpace, NSwitch, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import type { DictValuesVo } from '@/types/app';
import { fetchDictValuesAdd, fetchDictValuesBatchSave, fetchDictValuesDelete, fetchDictValuesListByCode, fetchDictValuesUpdate } from '@/service/api';

interface RowData extends DictValuesVo {
  key: string;
  isNew?: boolean;
  isEditing?: boolean;
}

interface Props {
  show: boolean;
  dictCode: string;
  dictId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const dataList = ref<RowData[]>([]);
const loading = ref(false);
const submitting = ref(false);
const snapshotMap = new Map<string, RowData>();

const editedRows = computed(() => dataList.value.filter(item => item.isNew || item.isEditing));

const columns = ref<DataTableColumns<RowData>>([
  { title: '#', key: 'index', width: 60, render: (_, index) => String(index + 1) },
  {
    title: '标签',
    key: 'label',
    minWidth: 180,
    render: row =>
      row.isNew || row.isEditing ? (
        <NInput value={row.label} placeholder="请输入标签" onUpdateValue={value => (row.label = value)} />
      ) : (
        row.label || '-'
      )
  },
  {
    title: '值',
    key: 'value',
    minWidth: 180,
    render: row =>
      row.isNew || row.isEditing ? (
        <NInput value={row.value} placeholder="请输入值" onUpdateValue={value => (row.value = value)} />
      ) : (
        row.value || '-'
      )
  },
  {
    title: '排序',
    key: 'sort',
    width: 100,
    render: row =>
      row.isNew || row.isEditing ? (
        <NInput value={String(row.sort ?? 0)} placeholder="排序" onUpdateValue={value => (row.sort = Number(value || 0))} />
      ) : (
        String(row.sort ?? 0)
      )
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: row =>
      row.isNew || row.isEditing ? (
        <NSwitch value={row.status} checked-value="1" unchecked-value="0" onUpdateValue={value => (row.status = value)} />
      ) : (
        <NTag type={row.status === '1' ? 'success' : 'error'} bordered={false}>{row.status === '1' ? '启用' : '禁用'}</NTag>
      )
  },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    align: 'center',
    fixed: 'right',
    render: row => (
      <div class="em-table-actions">
        {row.isNew || row.isEditing ? (
          <>
            <NButton size="small" quaternary type="primary" onClick={() => handleSave(row)}>保存</NButton>
            <NButton size="small" quaternary onClick={() => handleCancel(row)}>取消</NButton>
          </>
        ) : (
          <>
            <NButton size="small" quaternary type="primary" onClick={() => handleEdit(row)}>编辑</NButton>
            <NPopconfirm onPositiveClick={() => handleDelete(row)}>
              {{
                trigger: () => <NButton size="small" quaternary type="error">删除</NButton>,
                default: () => '确认删除这条字典值吗？'
              }}
            </NPopconfirm>
          </>
        )}
      </div>
    )
  }
]);

watch(
  () => [props.show, props.dictCode],
  ([visible, dictCode]) => {
    if (visible && dictCode) {
      loadData();
    }
  },
  { immediate: true }
);

async function loadData() {
  loading.value = true;
  try {
    const { data } = await fetchDictValuesListByCode(props.dictCode);
    dataList.value = (data || []).map((item, index) => ({ ...item, key: item.id || `${index}` }));
    snapshotMap.clear();
  } finally {
    loading.value = false;
  }
}

function handleEdit(row: RowData) {
  snapshotMap.set(row.key, { ...row });
  row.isEditing = true;
}

function handleCancel(row: RowData) {
  if (row.isNew) {
    dataList.value = dataList.value.filter(item => item.key !== row.key);
    return;
  }

  const snapshot = snapshotMap.get(row.key);
  if (!snapshot) {
    row.isEditing = false;
    return;
  }

  Object.assign(row, snapshot, { isEditing: false });
  snapshotMap.delete(row.key);
}

function handleAdd() {
  dataList.value.push({
    key: `new-${Date.now()}`,
    dictCode: props.dictCode,
    dictId: props.dictId,
    label: '',
    value: '',
    sort: dataList.value.length + 1,
    status: 1,
    isNew: true
  });
}

async function handleSave(row: RowData) {
  if (!row.label || !row.value) {
    window.$message?.error('标签和值不能为空');
    return;
  }

  submitting.value = true;
  try {
    const payload: DictValuesVo = {
      id: row.isNew ? undefined : row.id,
      dictId: props.dictId,
      dictCode: props.dictCode,
      label: row.label,
      value: row.value,
      sort: row.sort,
      status: row.status
    };

    if (row.isNew) {
      const { error } = await fetchDictValuesAdd(payload);
      if (error) return;
      window.$message?.success('字典值新增成功');
    } else {
      const { error } = await fetchDictValuesUpdate(payload);
      if (error) return;
      window.$message?.success('字典值更新成功');
    }

    await loadData();
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(row: RowData) {
  if (!row.id) {
    return;
  }

  const { error } = await fetchDictValuesDelete(row.id);
  if (error) {
    return;
  }

  window.$message?.success('字典值删除成功');
  await loadData();
}

async function handleBatchSave() {
  if (!editedRows.value.length) {
    return;
  }

  if (editedRows.value.some(item => !item.label || !item.value)) {
    window.$message?.error('标签和值不能为空');
    return;
  }

  submitting.value = true;
  try {
    const { error } = await fetchDictValuesBatchSave(
      editedRows.value.map(item => ({
        id: item.isNew ? undefined : item.id,
        dictId: props.dictId,
        dictCode: props.dictCode,
        label: item.label,
        value: item.value,
        sort: item.sort,
        status: item.status
      }))
    );

    if (error) {
      return;
    }

    window.$message?.success('批量保存成功');
    await loadData();
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NModal :show="show" preset="card" title="字典值详情" :style="{ width: '980px' }" :mask-closable="false" @update:show="value => !value && emit('close')">
    <NSpace vertical>
      <NSpace justify="space-between">
        <div class="text-14px text-#666">字典编码：{{ dictCode }}</div>
        <NSpace>
          <NButton type="primary" @click="handleAdd">新增字典值</NButton>
          <NButton v-if="editedRows.length" type="warning" :loading="submitting" @click="handleBatchSave">批量保存</NButton>
        </NSpace>
      </NSpace>

      <NDataTable :columns="columns" :data="dataList" :loading="loading" max-height="520" bordered />
    </NSpace>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="emit('close')">关闭</NButton>
      </NSpace>
    </template>
  </NModal>
</template>