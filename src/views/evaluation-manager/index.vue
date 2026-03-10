<template>
  <n-space vertical>
    <n-data-table :bordered="false" :single-line="false" :columns="columns" :data="data"
      :key="(row: RowData) => row.key" :pagination="pagination" :scroll-x="1800"
      :style="{ height: `calc(100vh - 32px - 44px - 56px - 48px)` }" flex-height />
  </n-space>
</template>

<script setup lang="ts">
import { NTimeline, NInput, NTimelineItem } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { h, ref } from 'vue'

interface RowData {
  key: number
  name: string
  age: number
  evaluationManager: string,
  address: string
  tags: string[]
}

const data = Array.from({ length: 100 }).map((_, index) => ({
  key: index,
  name: `Edward King ${index}`,
  age: 32,
  address: `London, Park Lane no. ${index}`
}))
const columns = ref<DataTableColumns<RowData>>([
  {
    type: 'selection',
    fixed: 'left',
    width: "50px"
  },
  {
    title: '考核名称',
    key: 'name',
    width: 200,
    fixed: 'left'
  },
  {
    title: '考核阶段',
    key: 'evaluationManager',
    width: "300px",
    align: "center",
    fixed: 'left',
    render(row: RowData) {
      return h('div', { style: { margin: "auto" } }, h(NTimeline, { horizontal: true }, [h(NTimelineItem, {}, { type: "success", title: "123", content: "123132", time: "123123123" }), h(NTimelineItem, {}, { type: "success", title: "123", content: "123132", time: "123123123" }), h(NTimelineItem, {}, { type: "success", title: "123", content: "123132", time: "123123123" }), h(NTimelineItem, {}, { type: "success", title: "123", content: "123132", time: "123123123" }), h(NTimelineItem, {}, { type: "success", title: "123", content: "123132", time: "123123123" }), h(NTimelineItem, {}, { type: "success", title: "123", content: "123132", time: "123123123" }),]))
    }
  },
  {
    title: '备注',
    key: 'remark',
    fixed: 'left'
  },
  {
    title: 'Age',
    key: 'age',
    width: 100,
    fixed: 'left'
  }])
const pagination = { pageSize: 100 }
</script>