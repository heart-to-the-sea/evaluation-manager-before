<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NCard, NColorPicker, NDivider, NDrawer, NDrawerContent, NInputNumber, NSpace, NSwitch, NTab, NTabs } from 'naive-ui';
import LayoutModeCardGroup from './LayoutModeCardGroup.vue';

const appStore = useAppStore();
const themeStore = useThemeStore();

const activeTab = ref<'appearance' | 'layout'>('appearance');
const colorPresets = ['#2080f0', '#18a058', '#f0a020', '#d03050', '#7c3aed', '#0f766e', '#2563eb', '#ea580c'];
const drawerWidth = computed(() => 400);
const isMixMode = computed(() => themeStore.layoutMode.includes('mix') || themeStore.layoutMode.includes('hybrid'));

const darkModeModel = computed({
  get: () => themeStore.darkMode,
  set: () => themeStore.toggleDarkMode()
});

const themeColorModel = computed({
  get: () => themeStore.themeColor,
  set: value => themeStore.setThemeColor(value)
});

const themeRadiusModel = computed({
  get: () => themeStore.themeRadius,
  set: value => themeStore.setThemeRadius(Number(value ?? themeStore.themeRadius))
});

const layoutModeModel = computed({
  get: () => themeStore.layoutMode,
  set: value => themeStore.setLayoutMode(value)
});

const fixedHeaderAndTabModel = computed({
  get: () => themeStore.fixedHeaderAndTab,
  set: value => themeStore.setFixedHeaderAndTab(value)
});

const headerHeightModel = computed({
  get: () => themeStore.headerHeight,
  set: value => themeStore.setHeaderHeight(Number(value ?? themeStore.headerHeight))
});

const tabVisibleModel = computed({
  get: () => themeStore.tabVisible,
  set: value => themeStore.setTabVisible(value)
});

const tabHeightModel = computed({
  get: () => themeStore.tabHeight,
  set: value => themeStore.setTabHeight(Number(value ?? themeStore.tabHeight))
});

const siderWidthModel = computed({
  get: () => themeStore.siderWidth,
  set: value => themeStore.setSiderWidth(Number(value ?? themeStore.siderWidth))
});

const siderCollapsedWidthModel = computed({
  get: () => themeStore.siderCollapsedWidth,
  set: value => themeStore.setSiderCollapsedWidth(Number(value ?? themeStore.siderCollapsedWidth))
});

const siderInvertedModel = computed({
  get: () => themeStore.siderInverted,
  set: value => themeStore.setSiderInverted(value)
});

const mixWidthModel = computed({
  get: () => themeStore.mixWidth,
  set: value => themeStore.setMixWidth(Number(value ?? themeStore.mixWidth))
});

const mixCollapsedWidthModel = computed({
  get: () => themeStore.mixCollapsedWidth,
  set: value => themeStore.setMixCollapsedWidth(Number(value ?? themeStore.mixCollapsedWidth))
});

const mixChildMenuWidthModel = computed({
  get: () => themeStore.mixChildMenuWidth,
  set: value => themeStore.setMixChildMenuWidth(Number(value ?? themeStore.mixChildMenuWidth))
});

function closeDrawer() {
  appStore.closeThemeDrawer();
}

function resetTheme() {
  themeStore.resetTheme();
}
</script>

<template>
  <NDrawer v-model:show="appStore.themeDrawerVisible" placement="right" display-directive="show" :width="drawerWidth">
    <NDrawerContent title="主题配置" :native-scrollbar="false" closable>
      <NTabs v-model:value="activeTab" type="segment" size="medium" class="mb-16px">
        <NTab name="appearance" tab="外观" />
        <NTab name="layout" tab="布局" />
      </NTabs>

      <NSpace v-if="activeTab === 'appearance'" vertical :size="16">
        <NCard :bordered="false" class="card-wrapper">
          <div class="setting-title">配色模式</div>
          <div class="setting-row">
            <span>深色模式</span>
            <NSwitch v-model:value="darkModeModel" />
          </div>
        </NCard>

        <NCard :bordered="false" class="card-wrapper">
          <div class="setting-title">主题色</div>
          <NColorPicker v-model:value="themeColorModel" :modes="['hex']" />
          <div class="mt-12px grid grid-cols-4 gap-10px">
            <button
              v-for="color in colorPresets"
              :key="color"
              type="button"
              class="color-block"
              :class="{ 'color-block--active': themeStore.themeColor === color }"
              :style="{ backgroundColor: color }"
              @click="themeStore.setThemeColor(color)"
            />
          </div>
        </NCard>

        <NCard :bordered="false" class="card-wrapper">
          <div class="setting-title">圆角</div>
          <div class="setting-row">
            <span>组件圆角</span>
            <NInputNumber v-model:value="themeRadiusModel" size="small" :min="0" :max="16" :step="1" class="w-120px" />
          </div>
        </NCard>
      </NSpace>

      <NSpace v-else vertical :size="16">
        <NCard :bordered="false" class="card-wrapper">
          <div class="setting-title">布局模式</div>
          <LayoutModeCardGroup v-model:value="layoutModeModel" />
        </NCard>

        <NCard :bordered="false" class="card-wrapper">
          <div class="setting-title">顶部区域</div>
          <div class="setting-list">
            <div class="setting-row">
              <span>固定顶部与标签栏</span>
              <NSwitch v-model:value="fixedHeaderAndTabModel" />
            </div>
            <div class="setting-row">
              <span>顶部高度</span>
              <NInputNumber v-model:value="headerHeightModel" size="small" :min="48" :max="72" :step="1" class="w-120px" />
            </div>
          </div>
        </NCard>

        <NCard :bordered="false" class="card-wrapper">
          <div class="setting-title">标签栏</div>
          <div class="setting-list">
            <div class="setting-row">
              <span>显示标签栏</span>
              <NSwitch v-model:value="tabVisibleModel" />
            </div>
            <div class="setting-row" :class="{ 'setting-row--disabled': !themeStore.tabVisible }">
              <span>标签栏高度</span>
              <NInputNumber v-model:value="tabHeightModel" size="small" :min="36" :max="56" :step="1" :disabled="!themeStore.tabVisible" class="w-120px" />
            </div>
          </div>
        </NCard>

        <NCard v-if="themeStore.layoutMode === 'vertical'" :bordered="false" class="card-wrapper">
          <div class="setting-title">侧边栏</div>
          <div class="setting-list">
            <div class="setting-row">
              <span>侧边栏宽度</span>
              <NInputNumber v-model:value="siderWidthModel" size="small" :min="200" :max="320" :step="1" class="w-120px" />
            </div>
            <div class="setting-row">
              <span>折叠宽度</span>
              <NInputNumber v-model:value="siderCollapsedWidthModel" size="small" :min="56" :max="96" :step="1" class="w-120px" />
            </div>
            <div class="setting-row">
              <span>侧边栏反转</span>
              <NSwitch v-model:value="siderInvertedModel" />
            </div>
          </div>
        </NCard>

        <NCard v-if="isMixMode" :bordered="false" class="card-wrapper">
          <div class="setting-title">混合菜单</div>
          <div class="setting-list">
            <div class="setting-row">
              <span>一级菜单宽度</span>
              <NInputNumber v-model:value="mixWidthModel" size="small" :min="72" :max="140" :step="1" class="w-120px" />
            </div>
            <div class="setting-row">
              <span>一级折叠宽度</span>
              <NInputNumber v-model:value="mixCollapsedWidthModel" size="small" :min="56" :max="96" :step="1" class="w-120px" />
            </div>
            <div class="setting-row">
              <span>子菜单宽度</span>
              <NInputNumber v-model:value="mixChildMenuWidthModel" size="small" :min="160" :max="280" :step="1" class="w-120px" />
            </div>
            <div class="setting-row">
              <span>侧边栏反转</span>
              <NSwitch v-model:value="siderInvertedModel" />
            </div>
          </div>
        </NCard>
      </NSpace>

      <template #footer>
        <NDivider class="mb-12px mt-0" />
        <div class="drawer-footer">
          <NButton @click="resetTheme">恢复默认</NButton>
          <NButton type="primary" @click="closeDrawer">完成</NButton>
        </div>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.setting-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
}

.setting-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.setting-row--disabled {
  opacity: 0.55;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.color-block {
  height: 34px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-block--active {
  border-color: rgb(var(--container-bg-color));
  box-shadow: 0 0 0 2px rgb(var(--em-primary-color-rgb, 32 128 240) / 30%);
}
</style>
