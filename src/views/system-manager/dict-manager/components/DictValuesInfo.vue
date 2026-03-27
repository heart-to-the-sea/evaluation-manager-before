<script setup lang="tsx">
import { ref } from 'vue';
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';
import { NButton, NForm, NFormItem, NInput, NModal, NPopconfirm, NSelect, NSpace } from 'naive-ui';
import { type DictValuesVo, fetchDictValuesAdd, fetchDictValuesUpdate } from '@/service/api';
interface RowData extends DictValuesVo {
  key: number;
}
interface Props {
  show: boolean;
  dictKey: string;
  data: DictValuesVo | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const dataList = ref<any>(null);
const submitting = ref(false);

const columns = ref<DataTableColumns<any>>([
  {
    title: '#',
    key: 'key',
    width: 50
  },
  { title: '字典名称', key: 'name', width: 250, fixed: 'left' },
  { title: '字典编码', key: 'code', width: 250, fixed: 'left' },
  { title: '状态', key: 'code', width: 250, fixed: 'left' },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    align: 'center',
    fixed: 'right',
    render: (row: RowData) => (
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
    )
  }
]);

function handleEdit(row: RowData) {}

async function handleDelete(row: RowData) {
  if (!row.id) return;
  try {
    window.$message?.success('删除成功');
  } catch (error) {
    console.error('删除失败:', error);
  }
}

function handleClose() {
  emit('close');
}
</script>

<template>
  <NModal
    :show="props.show"
    preset="card"
    title="字典值详情"
    :style="{ width: '500px' }"
    :mask-closable="false"
    @update:show="(val: boolean) => !val && emit('close')"
  >
    <NDataTable :columns="columns" :data="dataList" flex-height />

    <template #footer>
      <NSpace justify="end">
        <NButton type="primary" :loading="submitting" @click="handleClose">关闭</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
