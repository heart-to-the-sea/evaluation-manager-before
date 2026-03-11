<script setup lang="tsx">
import { ref } from 'vue';
import { NTimeline, NTimelineItem } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';

interface RowData {
  key: number;
  name: string;
  age: number;
  evaluationManager: string;
  remark: string;
  tags: string[];
}

const data = Array.from({ length: 100 }).map((_, index) => ({
  key: index,
  name: `Edward King ${index}`,
  age: 32,
  'name-1': '2026-03-11 12:30:00',
  'name-2': '实习生培训考核',
  remark: `London, Park Lane no. ${index}London`
}));
const columns = ref<DataTableColumns<RowData>>([
  {
    type: 'selection',
    fixed: 'left',
    width: '50px'
  },
  {
    title: '姓名',
    key: 'name',
    width: 200,
    fixed: 'left'
  },
  {
    title: '入职时间',
    key: 'name-1',
    width: 200,
    fixed: 'left'
  },
  {
    title: '考核内容',
    key: 'name-2',
    width: 200,
    fixed: 'left'
  },
  {
    title: '备注',
    key: 'remark',
    width: '400px',
    fixed: 'left'
  },
  {
    title: '考核阶段',
    key: 'evaluationManager',
    align: 'left',
    render(row: RowData) {
      return (
        <div style={{ overflowX: 'auto' }}>
          <NTimeline horizontal>
            <NTimelineItem type="success" title="阶段1" />
            <NTimelineItem type="error" title="阶段2" />
            <NTimelineItem type="default" title="阶段3" />
            <NTimelineItem type="default" title="阶段4" />
          </NTimeline>
        </div>
      );
    }
  },

  {
    title: '操作',
    key: 'age',
    width: 200,
    align: 'center',
    render(row: RowData) {
      return (
        <>
          <NButton type="primary" quaternary>
            详情
          </NButton>
          <NButton type="primary" quaternary>
            编辑
          </NButton>
        </>
      );
    }
  }
]);
const pagination = { pageSize: 100 };
</script>

<template>
  <NSpace vertical>
    <NDataTable
      :key="(row: RowData) => row.key"
      :bordered="false"
      :single-line="false"
      :columns="columns"
      :data="data"
      :pagination="pagination"
      :scroll-x="1800"
      :style="{ height: `calc(100vh - 32px - 44px - 56px)` }"
      flex-height
    />
  </NSpace>
</template>
