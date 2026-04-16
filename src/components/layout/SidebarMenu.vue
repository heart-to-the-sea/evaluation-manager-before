<script setup lang="ts">
import { computed, h } from 'vue';
import { NMenu } from 'naive-ui';
import type { MenuOption } from 'naive-ui';
import AppIcon from '@/components/common/AppIcon.vue';
import DarkModeContainer from '@/components/common/DarkModeContainer.vue';
import type { AppMenuOption, RouteItem } from '@/types/app';

interface Props {
  options?: AppMenuOption[];
  selectedKey?: string | null;
  collapsed?: boolean;
  collapsedWidth?: number;
  showLogo?: boolean;
  inverted?: boolean;
  rail?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  options: undefined,
  selectedKey: undefined,
  collapsed: false,
  collapsedWidth: 72,
  showLogo: true,
  inverted: false,
  rail: false
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

const menuThemeOverrides = computed(() => {
  const primaryColor = themeStore.themeColor;
  const childActiveColor = props.inverted ? '#ffffff' : primaryColor;

  return {
    itemColorActive: primaryColor,
    itemColorActiveHover: primaryColor,
    itemColorActiveCollapsed: primaryColor,
    itemTextColorActive: '#ffffff',
    itemTextColorActiveHover: '#ffffff',
    itemTextColorChildActive: childActiveColor,
    itemTextColorChildActiveHover: childActiveColor,
    itemIconColorActive: '#ffffff',
    itemIconColorActiveHover: '#ffffff',
    itemIconColorChildActive: childActiveColor,
    itemIconColorChildActiveHover: childActiveColor,
    arrowColorActive: '#ffffff',
    arrowColorActiveHover: '#ffffff',
    arrowColorChildActive: childActiveColor,
    arrowColorChildActiveHover: childActiveColor,
    itemColorActiveInverted: primaryColor,
    itemColorActiveHoverInverted: primaryColor,
    itemColorActiveCollapsedInverted: primaryColor,
    itemTextColorActiveInverted: '#ffffff',
    itemTextColorActiveHoverInverted: '#ffffff',
    itemTextColorChildActiveInverted: '#ffffff',
    itemTextColorChildActiveHoverInverted: '#ffffff',
    itemIconColorActiveInverted: '#ffffff',
    itemIconColorActiveHoverInverted: '#ffffff',
    itemIconColorChildActiveInverted: '#ffffff',
    itemIconColorChildActiveHoverInverted: '#ffffff',
    arrowColorActiveInverted: '#ffffff',
    arrowColorActiveHoverInverted: '#ffffff',
    arrowColorChildActiveInverted: '#ffffff',
    arrowColorChildActiveHoverInverted: '#ffffff'
  };
});

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
</script>

<template>
  <DarkModeContainer class="sidebar-menu shadow-sider" :inverted="inverted">
    <div v-if="showLogo" class="logo-area" :class="{ 'logo-area--inverted': inverted, 'logo-area--compact': rail }">
      <div class="logo-mark">评</div>
      <div v-if="!collapsed && !rail" class="logo-text">
        <div class="logo-title">评价管理系统</div>
        <div class="logo-desc">Nuxt 管理后台</div>
      </div>
    </div>

    <NMenu
      :value="innerSelectedKey"
      :collapsed="collapsed"
      :collapsed-width="collapsedWidth"
      :collapsed-icon-size="20"
      :inverted="inverted"
      :theme-overrides="menuThemeOverrides"
      :options="menuOptions"
      @update:value="key => emit('select', String(key))"
    />
  </DarkModeContainer>
</template>

<style scoped>
.sidebar-menu {
  display: flex;
  height: 100%;
  flex-direction: column;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid rgb(var(--border-color));
}

.logo-area--compact {
  justify-content: center;
  padding-inline: 0;
}

.logo-area--inverted {
  border-bottom-color: rgb(255 255 255 / 12%);
}

.logo-mark {
  display: flex;
  height: 40px;
  width: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--em-primary-color);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}

.logo-title {
  font-size: 15px;
  font-weight: 700;
}

.logo-desc {
  font-size: 12px;
  color: rgb(var(--muted-text-color));
}

.logo-area--inverted .logo-desc {
  color: rgb(255 255 255 / 60%);
}
</style>
