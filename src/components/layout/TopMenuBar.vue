<script setup lang="ts">
import { h } from 'vue';
import { NMenu } from 'naive-ui';
import type { MenuOption } from 'naive-ui';
import AppIcon from '@/components/common/AppIcon.vue';
import DarkModeContainer from '@/components/common/DarkModeContainer.vue';
import type { AppMenuOption, RouteItem } from '@/types/app';

interface Props {
  options?: AppMenuOption[];
  selectedKey?: string | null;
  stickyTop?: number;
}

const props = withDefaults(defineProps<Props>(), {
  options: undefined,
  selectedKey: undefined,
  stickyTop: 56
});

const emit = defineEmits<{
  select: [key: string];
}>();

const route = useRoute();
const menuStore = useMenuStore();
const themeStore = useThemeStore();

function renderIcon(icon?: string) {
  return () => h(AppIcon, { icon, size: 18 });
}

function mapMenuOption(item: AppMenuOption): MenuOption {
  return {
    key: item.key,
    label: item.label,
    icon: item.icon ? renderIcon(item.icon) : undefined,
    children: item.children?.map(mapMenuOption)
  };
}

function matchRoutePath(pattern: string, currentPath: string) {
  const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '[^/]+')}$`);
  return regex.test(currentPath);
}

function findCurrentRoute(currentPath: string, routes: RouteItem[]): RouteItem | null {
  for (const item of routes) {
    if (matchRoutePath(item.path, currentPath)) {
      return item;
    }

    if (item.children?.length) {
      const matched = findCurrentRoute(currentPath, item.children);
      if (matched) {
        return matched;
      }
    }
  }

  return null;
}

const menuOptions = computed(() => (props.options || menuStore.menuOptions).map(mapMenuOption));

const innerSelectedKey = computed(() => {
  if (props.selectedKey !== undefined) {
    return props.selectedKey;
  }

  const matched = findCurrentRoute(route.path, menuStore.routes);
  if (!matched) {
    return null;
  }
  return matched.meta?.activeMenu || matched.name;
});

const topMenuStyle = computed(() => ({
  height: '48px',
  position: themeStore.fixedHeaderAndTab ? 'sticky' : 'relative',
  top: `${props.stickyTop}px`,
  zIndex: 28
}));
</script>

<template>
  <DarkModeContainer class="top-menu-bar shadow-tab" :style="topMenuStyle">
    <NMenu mode="horizontal" :value="innerSelectedKey" :options="menuOptions" @update:value="key => emit('select', String(key))" />
  </DarkModeContainer>
</template>

<style scoped>
.top-menu-bar {
  padding: 0 16px;
  border-bottom: 1px solid rgb(var(--border-color));
  transition:
    border-color 0.3s ease,
    background-color 0.3s ease;
}
</style>
