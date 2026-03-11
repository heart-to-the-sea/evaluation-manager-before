<script setup lang="tsx">
import { onActivated, ref } from 'vue';
import { NButton, NGrid, NIcon, NSpace, NTimeline, NTimelineItem } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { AddCircle } from '@vicons/ionicons5';
import SearchTablePageLayout from '@/components/pages/SearchTablePageLayout.vue';

interface RowData {
  key: number;
  name: string;
  age: number;
  evaluationManager: string;
  remark: string;
  tags: string[];
}
onActivated(() => {
  console.log('111');
});
const data = Array.from({ length: 100 }).map((_, index) => ({
  key: index,
  name: `Edward King ${index}`,
  age: 32,
  'name-1': '2026-03-11 12:30:00',
  'name-2': '实习生培训考核',
  result: '通过',
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
    render(_: RowData) {
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
    title: '考核结果',
    key: 'result',
    width: 120,
    align: 'center',
    fixed: 'right'
  },
  {
    title: '操作',
    key: 'age',
    width: 200,
    align: 'center',
    fixed: 'right',
    render(_: RowData) {
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
  <SearchTablePageLayout>
    <template #searchBox>
      <NGrid x-gap="12" :cols="2">
        <NGi>
          <NButton type="primary">
            <NIcon style="margin-right: 6px" size="18"><AddCircle /></NIcon>
            新增
          </NButton>
        </NGi>
        <NGi>
          <NSpace justify="end">
            <NButton type="primary">查询</NButton>
            <NButton type="default">重置</NButton>
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
