<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import DictTag from '@/components/common/DictTag.vue';

interface InfoGridCardItem {
  label: string;
  text?: string | number | null;
  dictCode?: string;
  dictValue?: string | number | null;
  fallbackLabel?: string;
}

const props = withDefaults(
  defineProps<{
    items: InfoGridCardItem[];
    columns?: number;
    autoColumns?: boolean;
    minItemWidth?: number;
    maxColumns?: number;
  }>(),
  {
    columns: 2,
    autoColumns: false,
    minItemWidth: 260,
    maxColumns: 5
  }
);

const cardRef = ref<HTMLElement | null>(null);
const autoColumnsValue = ref(Math.max(1, Number(props.columns) || 2));
let resizeObserver: ResizeObserver | null = null;

function getSafeColumnCount(value?: number) {
  return Math.max(1, Number(value) || 1);
}

function updateAutoColumns() {
  if (!props.autoColumns || !cardRef.value) {
    autoColumnsValue.value = getSafeColumnCount(props.columns);
    return;
  }

  const containerWidth = cardRef.value.clientWidth || 0;
  const gap = 12;
  const minItemWidth = Math.max(160, Number(props.minItemWidth) || 260);
  const maxColumns = Math.max(1, Number(props.maxColumns) || 5);
  const nextColumns = Math.floor((containerWidth + gap) / (minItemWidth + gap));

  autoColumnsValue.value = Math.max(1, Math.min(maxColumns, nextColumns || 1));
}

const gridStyle = computed(() => ({
  '--info-grid-columns': `repeat(${props.autoColumns ? autoColumnsValue.value : getSafeColumnCount(props.columns)}, minmax(0, 1fr))`
}));

function resolveText(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

onMounted(() => {
  updateAutoColumns();
  if (!props.autoColumns || !cardRef.value) return;

  resizeObserver = new ResizeObserver(() => {
    updateAutoColumns();
  });
  resizeObserver.observe(cardRef.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>

<template>
  <div ref="cardRef" class="info-grid-card">
    <div class="info-grid-card__grid" :style="gridStyle">
      <div v-for="item in items" :key="item.label" class="info-grid-card__item">
        <div class="info-grid-card__label">{{ item.label }}</div>
        <div class="info-grid-card__value">
          <DictTag
            v-if="item.dictCode"
            :dict-code="item.dictCode"
            :value="item.dictValue"
            :fallback-label="item.fallbackLabel || '-'"
          />
          <span v-else>{{ resolveText(item.text) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.info-grid-card {
  padding: 16px;
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
}

html.dark .info-grid-card {
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(0 0 0 / 18%);
}

.info-grid-card__grid {
  display: grid;
  grid-template-columns: var(--info-grid-columns, repeat(2, minmax(0, 1fr)));
  gap: 12px;
}

.info-grid-card__item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 12px;
  border-radius: 12px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 85%);
}

.info-grid-card__label {
  flex: 0 0 92px;
  color: var(--n-text-color-3);
  font-size: 13px;
  line-height: 1.4;
}

.info-grid-card__value {
  min-width: 0;
  color: var(--n-text-color-1);
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.info-grid-card__value :deep(.n-tag) {
  max-width: 100%;
}

@media (width <= 960px) {
  .info-grid-card__grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
