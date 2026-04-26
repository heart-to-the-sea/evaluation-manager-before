<script setup lang="tsx">
import { NButton, NColorPicker, NDataTable, NInput, NModal, NPopconfirm, NSpace, NSwitch, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import type { DictValuesVo } from '@/types/app';
import { fetchDictValuesAdd, fetchDictValuesBatchSave, fetchDictValuesDelete, fetchDictValuesListByCode, fetchDictValuesUpdate } from '@/service/api';
import DictTag from '@/components/common/DictTag.vue';
import { dictColorPresetValues } from '@/constants/dict';
import { clearDictCache } from '@/composables/use-dict';
import { useTableSorter } from '@/composables/use-table-sorter';

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
const { handleSorter, getSortOrder, createSorter, createSorterRender } = useTableSorter();

const editedRows = computed(() => dataList.value.filter(item => item.isNew || item.isEditing));

function toStr(val: string | number | null | undefined): string {
  return val == null ? '0' : String(val);
}

function compareText(left?: string | null, right?: string | null) {
  return String(left || '').localeCompare(String(right || ''), 'zh-CN');
}

function compareNumber(left?: number | string | null, right?: number | string | null) {
  return Number(left || 0) - Number(right || 0);
}

const localSorterMap: Record<string, (left: RowData, right: RowData) => number> = {
  label: (left, right) => compareText(left.label, right.label),
  value: (left, right) => compareText(left.value, right.value),
  customColor: (left, right) => compareText(left.customColor, right.customColor),
  className: (left, right) => compareText(left.className, right.className),
  sort: (left, right) => compareNumber(left.sort, right.sort),
  status: (left, right) => compareText(left.status, right.status)
};

function renderColorSwatch(color?: string | null, emptyText = '-') {
  if (!color) {
    return <span class="dict-color-display__empty">{emptyText}</span>;
  }

  return (
    <span class="dict-color-display">
      <span class="dict-color-display__swatch" style={{ backgroundColor: color }}></span>
      <span class="dict-color-display__text">{color}</span>
    </span>
  );
}

function renderColorEditor(row: RowData) {
  return (
    <NColorPicker
      value={row.customColor || ''}
      showAlpha={false}
      modes={['hex']}
      swatches={dictColorPresetValues}
      onUpdateValue={value => (row.customColor = String(value || ''))}
    />
  );
}

const columns = computed<DataTableColumns<RowData>>(() => ([
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
    title: '自定义颜色',
    key: 'customColor',
    minWidth: 240,
    render: row =>
      row.isNew || row.isEditing ? (
        renderColorEditor(row)
      ) : (
        renderColorSwatch(row.customColor)
      )
  },
  {
    title: '样式类名',
    key: 'className',
    minWidth: 140,
    render: row =>
      row.isNew || row.isEditing ? (
        <NInput value={row.className || ''} placeholder="样式类名" onUpdateValue={value => (row.className = value)} />
      ) : (
        row.className || '-'
      )
  },
  {
    title: '预览',
    key: 'preview',
    minWidth: 120,
    render: row => (
      <DictTag
        dictCode={props.dictCode}
        value={row.value}
        fallbackLabel={row.label || '-'}
        customColor={row.customColor || ''}
        className={row.className || ''}
      />
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
        <NSwitch value={toStr(row.status)} checked-value="1" unchecked-value="0" onUpdateValue={value => (row.status = value)} />
      ) : (
        <DictTag dictCode="sys_normal_disable" value={row.status} />
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
].map(column => {
  const columnKey = typeof column.key === 'string' ? column.key : '';
  const sorter = localSorterMap[columnKey];
  return sorter
    ? {
        ...column,
        sorter: {
          ...createSorter(),
          compare: sorter
        },
        sortOrder: getSortOrder(columnKey),
        renderSorter: createSorterRender(columnKey)
      }
    : column;
})));

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
    customColor: '',
    className: '',
    sort: dataList.value.length + 1,
    status: '1',
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
      customColor: row.customColor || undefined,
      className: row.className || '',
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

    clearDictCache(props.dictCode);
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
  clearDictCache(props.dictCode);
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
        customColor: item.customColor || undefined,
        className: item.className || '',
        sort: item.sort,
        status: item.status
      }))
    );

    if (error) {
      return;
    }

    window.$message?.success('批量保存成功');
    clearDictCache(props.dictCode);
    await loadData();
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NModal :show="show" preset="card" title="字典值详情" :style="{ width: '1240px', maxWidth: 'calc(100vw - 32px)' }"
    :mask-closable="false" @update:show="value => !value && emit('close')">
    <NSpace vertical>
      <NSpace justify="space-between">
        <div class="text-14px text-#666">字典编码：{{ dictCode }}</div>
        <NSpace>
          <NButton type="primary" @click="handleAdd">新增字典值</NButton>
          <NButton v-if="editedRows.length" type="warning" :loading="submitting" @click="handleBatchSave">批量保存</NButton>
        </NSpace>
      </NSpace>

      <NDataTable :columns="columns" :data="dataList" :loading="loading" max-height="520" bordered @update:sorter="handleSorter" />
    </NSpace>

    <template #footer>
      <NSpace justify="end" :size="16">
        <NButton @click="emit('close')">关闭</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.dict-color-editor,
.dict-color-display {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dict-color-editor {
  flex-direction: column;
  align-items: stretch;
}

.dict-color-editor__suffix {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
}

.dict-color-display__swatch {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1px solid rgb(var(--border-color));
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 20%),
    0 1px 2px rgb(15 23 42 / 8%);
}

.dict-color-display__text {
  min-width: 0;
  color: var(--n-text-color-2);
  font-size: 12px;
  word-break: break-all;
}

.dict-color-display__empty {
  color: var(--n-text-color-3);
  font-size: 12px;
}

.dict-color-preset-inline {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.dict-color-preset-btn {
  display: inline-flex;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.dict-color-preset-btn__swatch {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 1px solid rgb(var(--border-color));
  box-shadow: 0 0 0 2px transparent;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.dict-color-preset-btn:hover .dict-color-preset-btn__swatch {
  transform: translateY(-1px);
}

.dict-color-preset-btn.is-active .dict-color-preset-btn__swatch {
  box-shadow: 0 0 0 2px rgb(var(--primary-color) / 28%);
}

:deep(.dict-color-editor__picker .n-color-picker-trigger) {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 90%);
}

:deep(.dict-color-editor__picker .n-color-picker-trigger__fill) {
  border-radius: 5px;
}
</style>
