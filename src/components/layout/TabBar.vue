<script setup lang="ts">
import { computed } from 'vue';
import { NButton, NSpace } from 'naive-ui';
import DarkModeContainer from '@/components/common/DarkModeContainer.vue';

interface Props {
  stickyTop?: number;
}

const props = withDefaults(defineProps<Props>(), {
  stickyTop: undefined
});

const route = useRoute();
const tabsStore = useTabsStore();
const themeStore = useThemeStore();

watch(
  () => route.fullPath,
  () => {
    tabsStore.sync(route);
  },
  { immediate: true }
);

const tabStyle = computed(() => ({
  minHeight: `${themeStore.tabHeight}px`,
  position: themeStore.fixedHeaderAndTab ? 'sticky' : 'relative',
  top: `${props.stickyTop ?? (themeStore.layoutMode === 'horizontal' ? themeStore.headerHeight + 48 : themeStore.headerHeight)}px`,
  zIndex: 27
}));

async function handleUpdate(value: string) {
  await navigateTo(value);
}

async function handleClose(path: string) {
  tabsStore.remove(path);

  if (tabsStore.activeKey !== route.path) {
    await navigateTo(tabsStore.activeKey);
  }
}
</script>

<template>
  <DarkModeContainer class="tab-bar shadow-tab" :style="tabStyle">
    <NSpace>
      <NButton
        v-for="item in tabsStore.tabs"
        :key="item.key"
        size="small"
        :type="tabsStore.activeKey === item.path ? 'primary' : 'default'"
        secondary
        @click="handleUpdate(item.path)"
      >
        {{ item.label }}
        <span v-if="item.closable" class="ml-8px cursor-pointer text-12px" @click.stop="handleClose(item.path)">×</span>
      </NButton>
    </NSpace>
  </DarkModeContainer>
</template>

<style scoped>
.tab-bar {
  padding: 8px 16px 0;
  border-bottom: 1px solid rgb(var(--border-color));
  transition:
    border-color 0.3s ease,
    background-color 0.3s ease;
}
</style>
