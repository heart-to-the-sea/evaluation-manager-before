<script setup lang="ts">
type LayoutMode =
  | 'vertical'
  | 'vertical-mix'
  | 'vertical-hybrid-header-first'
  | 'horizontal'
  | 'top-hybrid-sidebar-first'
  | 'top-hybrid-header-first';

interface LayoutCard {
  key: LayoutMode;
  title: string;
  desc: string;
}

interface Props {
  value: LayoutMode;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:value': [value: LayoutMode];
}>();

const cards: LayoutCard[] = [
  { key: 'vertical', title: '左侧菜单模式', desc: '经典左侧导航布局' },
  { key: 'vertical-mix', title: '左侧菜单混合模式', desc: '一级二级菜单都在左侧' },
  { key: 'vertical-hybrid-header-first', title: '左侧混合-顶部优先', desc: '一级菜单在顶部，子菜单在左侧' },
  { key: 'horizontal', title: '顶部菜单模式', desc: '菜单集中展示在顶部' },
  { key: 'top-hybrid-sidebar-first', title: '顶部混合-侧边优先', desc: '一级菜单在左侧，子菜单在顶部' },
  { key: 'top-hybrid-header-first', title: '顶部混合-顶部优先', desc: '一级菜单在顶部，子菜单在左侧' }
];
</script>

<template>
  <div class="layout-mode-grid">
    <button
      v-for="item in cards"
      :key="item.key"
      type="button"
      class="layout-mode-card"
      :class="{ 'layout-mode-card--active': value === item.key }"
      @click="emit('update:value', item.key)"
    >
      <div class="layout-mode-preview" :class="`preview--${item.key}`">
        <template v-if="item.key === 'vertical'">
          <div class="preview-sider preview-sider--primary" />
          <div class="preview-main-col">
            <div class="preview-header" />
            <div class="preview-main" />
          </div>
        </template>

        <template v-else-if="item.key === 'vertical-mix'">
          <div class="preview-sider preview-sider--primary preview-sider--thin" />
          <div class="preview-sider preview-sider--secondary" />
          <div class="preview-main-col">
            <div class="preview-header preview-header--soft" />
            <div class="preview-main" />
          </div>
        </template>

        <template v-else-if="item.key === 'vertical-hybrid-header-first'">
          <div class="preview-sider preview-sider--primary preview-sider--thin" />
          <div class="preview-sider preview-sider--secondary" />
          <div class="preview-main-col">
            <div class="preview-header" />
            <div class="preview-main" />
          </div>
        </template>

        <template v-else-if="item.key === 'horizontal'">
          <div class="preview-top-col">
            <div class="preview-header" />
            <div class="preview-main" />
          </div>
        </template>

        <template v-else-if="item.key === 'top-hybrid-sidebar-first'">
          <div class="preview-top-col">
            <div class="preview-header preview-header--soft" />
            <div class="preview-row">
              <div class="preview-sider preview-sider--primary" />
              <div class="preview-main" />
            </div>
          </div>
        </template>

        <template v-else>
          <div class="preview-top-col">
            <div class="preview-header" />
            <div class="preview-row">
              <div class="preview-sider preview-sider--secondary" />
              <div class="preview-main" />
            </div>
          </div>
        </template>
      </div>

      <div class="layout-mode-title">{{ item.title }}</div>
      <div class="layout-mode-desc">{{ item.desc }}</div>
    </button>
  </div>
</template>

<style scoped>
.layout-mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.layout-mode-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid rgb(var(--border-color));
  border-radius: 12px;
  background: rgb(var(--container-bg-color));
  padding: 10px;
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease,
    background-color 0.2s ease;
}

.layout-mode-card:hover {
  border-color: rgb(var(--em-primary-color-rgb) / 35%);
  box-shadow: 0 8px 20px rgb(15 23 42 / 8%);
  transform: translateY(-1px);
}

.layout-mode-card--active {
  border-color: rgb(var(--em-primary-color-rgb) / 55%);
  box-shadow: 0 0 0 3px rgb(var(--em-primary-color-rgb) / 14%);
}

.layout-mode-preview {
  display: flex;
  height: 68px;
  gap: 4px;
  border-radius: 10px;
  background: rgb(var(--layout-bg-color));
  padding: 6px;
}

.preview-main-col,
.preview-top-col {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.preview-row {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: 4px;
}

.preview-header,
.preview-sider,
.preview-main {
  border-radius: 6px;
}

.preview-header {
  height: 14px;
  background: rgb(var(--em-primary-color-rgb) / 0.95);
}

.preview-header--soft {
  background: rgb(var(--em-primary-color-rgb) / 0.26);
}

.preview-sider {
  width: 18px;
  flex-shrink: 0;
}

.preview-sider--thin {
  width: 10px;
}

.preview-sider--primary {
  background: rgb(var(--em-primary-color-rgb) / 0.95);
}

.preview-sider--secondary {
  background: rgb(var(--em-primary-color-rgb) / 0.26);
}

.preview-main {
  flex: 1;
  background: rgb(var(--em-primary-color-rgb) / 0.14);
}

.layout-mode-title {
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--base-text-color));
}

.layout-mode-desc {
  min-height: 32px;
  font-size: 12px;
  line-height: 1.35;
  color: rgb(var(--muted-text-color));
}
</style>
