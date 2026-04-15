<script setup lang="ts">
import type { AppMenuOption } from '@/types/app';
import HeaderBar from '@/components/layout/HeaderBar.vue';
import FirstLevelRailMenu from '@/components/layout/FirstLevelRailMenu.vue';
import SidebarMenu from '@/components/layout/SidebarMenu.vue';
import TabBar from '@/components/layout/TabBar.vue';
import ThemeDrawer from '@/components/layout/ThemeDrawer.vue';

const route = useRoute();
const menuStore = useMenuStore();
await menuStore.ensureLoaded();

const appStore = useAppStore();
const themeStore = useThemeStore();

function matchRoutePath(pattern: string, currentPath: string) {
  const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '[^/]+')}$`);
  return regex.test(currentPath);
}

function findMenuChain(currentPath: string, menus: AppMenuOption[], parents: AppMenuOption[] = []): AppMenuOption[] {
  for (const item of menus) {
    const currentChain = [...parents, item];

    if (matchRoutePath(item.path, currentPath)) {
      return currentChain;
    }

    if (item.children?.length) {
      const result = findMenuChain(currentPath, item.children, currentChain);
      if (result.length) {
        return result;
      }
    }
  }

  return [];
}

function stripChildren(menus: AppMenuOption[]) {
  return menus.map(item => ({
    ...item,
    children: undefined
  }));
}

function findMenuByKey(key: string, menus: AppMenuOption[]): AppMenuOption | null {
  for (const item of menus) {
    if (item.key === key) {
      return item;
    }

    if (item.children?.length) {
      const result = findMenuByKey(key, item.children);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

function findFirstLeaf(menu: AppMenuOption): AppMenuOption {
  if (!menu.children?.length) {
    return menu;
  }

  return findFirstLeaf(menu.children[0]);
}

async function handleMenuSelect(key: string) {
  const target = findMenuByKey(key, menuStore.menuOptions);
  if (!target) {
    return;
  }

  await navigateTo(findFirstLeaf(target).path);
}

const menuOptions = computed(() => menuStore.menuOptions);
const menuChain = computed(() => findMenuChain(route.path, menuOptions.value));
const selectedLeafKey = computed(() => menuChain.value.at(-1)?.key || null);
const activeFirstLevelKey = computed(() => menuChain.value[0]?.key || null);
const activeSecondLevelKey = computed(() => menuChain.value[1]?.key || null);

const activeFirstMenu = computed(() => {
  if (!activeFirstLevelKey.value) {
    return menuOptions.value[0] || null;
  }

  return findMenuByKey(activeFirstLevelKey.value, menuOptions.value);
});

const firstLevelMenus = computed(() => stripChildren(menuOptions.value));
const secondLevelMenus = computed(() => activeFirstMenu.value?.children || []);
const secondLevelSimpleMenus = computed(() => stripChildren(secondLevelMenus.value));

const activeSecondMenu = computed(() => {
  if (!activeSecondLevelKey.value) {
    return secondLevelMenus.value[0] || null;
  }

  return findMenuByKey(activeSecondLevelKey.value, secondLevelMenus.value);
});

const thirdLevelMenus = computed(() => activeSecondMenu.value?.children || []);

const isVertical = computed(() => themeStore.layoutMode === 'vertical');
const isVerticalMix = computed(() => themeStore.layoutMode === 'vertical-mix');
const isVerticalHybridHeaderFirst = computed(() => themeStore.layoutMode === 'vertical-hybrid-header-first');
const isHorizontal = computed(() => themeStore.layoutMode === 'horizontal');
const isTopHybridSidebarFirst = computed(() => themeStore.layoutMode === 'top-hybrid-sidebar-first');
const isTopHybridHeaderFirst = computed(() => themeStore.layoutMode === 'top-hybrid-header-first');

const siderWidth = computed(() => `${appStore.siderCollapsed ? themeStore.siderCollapsedWidth : themeStore.siderWidth}px`);
const mixRailWidth = computed(() => `${appStore.siderCollapsed ? themeStore.mixCollapsedWidth : themeStore.mixWidth}px`);
const childMenuWidth = computed(() => `${themeStore.mixChildMenuWidth}px`);
const standardSideWidth = computed(() => `${appStore.siderCollapsed ? themeStore.siderCollapsedWidth : themeStore.siderWidth}px`);
const showVerticalHybridRail = computed(() => secondLevelSimpleMenus.value.length > 0);
const showTopHybridHeaderSide = computed(() => secondLevelMenus.value.length > 0);
const tabStickyTop = computed(() => themeStore.headerHeight);

const showHeaderToggler = computed(() => {
  if (isVertical.value) {
    return true;
  }

  if (isTopHybridHeaderFirst.value) {
    return showTopHybridHeaderSide.value;
  }

  return false;
});
</script>

<template>
  <div class="layout-shell bg-layout">
    <template v-if="isVertical">
      <div class="layout-row">
        <div class="layout-side" :style="{ width: siderWidth }">
          <SidebarMenu
            :collapsed="appStore.siderCollapsed"
            :collapsed-width="themeStore.siderCollapsedWidth"
            :inverted="themeStore.siderInverted"
            @select="handleMenuSelect"
          />
        </div>

        <div class="layout-main">
          <HeaderBar :show-menu-toggler="showHeaderToggler" />
          <TabBar v-if="themeStore.tabVisible" />
          <div class="layout-page">
            <slot />
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="isVerticalMix">
      <div class="layout-row">
        <div class="layout-side" :style="{ width: mixRailWidth }">
          <FirstLevelRailMenu
            :menus="firstLevelMenus"
            :active-key="activeFirstLevelKey"
            :collapsed="appStore.siderCollapsed"
            :inverted="themeStore.siderInverted"
            @select="handleMenuSelect"
          />
        </div>

        <div v-if="secondLevelMenus.length" class="layout-child-side" :style="{ width: childMenuWidth }">
          <SidebarMenu :options="secondLevelMenus" :selected-key="selectedLeafKey" :show-logo="false" @select="handleMenuSelect" />
        </div>

        <div class="layout-main">
          <HeaderBar :show-menu-toggler="showHeaderToggler" />
          <TabBar v-if="themeStore.tabVisible" />
          <div class="layout-page">
            <slot />
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="isVerticalHybridHeaderFirst">
      <HeaderBar
        :show-logo="!secondLevelMenus.length"
        :show-menu-toggler="showHeaderToggler"
        show-menu
        :menu-options="firstLevelMenus"
        :menu-selected-key="activeFirstLevelKey"
        @menu-select="handleMenuSelect"
      />

      <div class="layout-row layout-row--rest">
        <div v-if="showVerticalHybridRail" class="layout-side" :style="{ width: mixRailWidth }">
          <FirstLevelRailMenu :menus="secondLevelSimpleMenus" :active-key="activeSecondLevelKey" :collapsed="appStore.siderCollapsed" :inverted="themeStore.siderInverted" :show-logo="false" @select="handleMenuSelect" />
        </div>

        <div v-if="thirdLevelMenus.length" class="layout-child-side" :style="{ width: childMenuWidth }">
          <SidebarMenu :options="thirdLevelMenus" :selected-key="selectedLeafKey" :show-logo="false" @select="handleMenuSelect" />
        </div>

        <div class="layout-main">
          <TabBar v-if="themeStore.tabVisible" :sticky-top="tabStickyTop" />
          <div class="layout-page">
            <slot />
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="isHorizontal">
      <HeaderBar
        :show-menu-toggler="showHeaderToggler"
        show-menu
        :menu-options="menuOptions"
        :menu-selected-key="selectedLeafKey"
        @menu-select="handleMenuSelect"
      />
      <TabBar v-if="themeStore.tabVisible" :sticky-top="tabStickyTop" />
      <div class="layout-page">
        <slot />
      </div>
    </template>

    <template v-else-if="isTopHybridSidebarFirst">
      <div class="layout-row">
        <div class="layout-side" :style="{ width: mixRailWidth }">
          <FirstLevelRailMenu
            :menus="firstLevelMenus"
            :active-key="activeFirstLevelKey"
            :collapsed="appStore.siderCollapsed"
            :inverted="themeStore.siderInverted"
            @select="handleMenuSelect"
          />
        </div>

        <div class="layout-main">
          <HeaderBar
            :show-menu-toggler="showHeaderToggler"
            show-menu
            :menu-options="secondLevelMenus"
            :menu-selected-key="selectedLeafKey"
            @menu-select="handleMenuSelect"
          />
          <TabBar v-if="themeStore.tabVisible" :sticky-top="tabStickyTop" />
          <div class="layout-page">
            <slot />
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <HeaderBar
        :show-menu-toggler="showHeaderToggler"
        show-menu
        :menu-options="firstLevelMenus"
        :menu-selected-key="activeFirstLevelKey"
        @menu-select="handleMenuSelect"
      />

      <div class="layout-row layout-row--rest">
        <div v-if="showTopHybridHeaderSide" class="layout-child-side" :style="{ width: standardSideWidth }">
          <SidebarMenu
            :options="secondLevelMenus"
            :selected-key="selectedLeafKey"
            :collapsed="appStore.siderCollapsed"
            :collapsed-width="themeStore.siderCollapsedWidth"
            :show-logo="false"
            @select="handleMenuSelect"
          />
        </div>

        <div class="layout-main">
          <TabBar v-if="themeStore.tabVisible" :sticky-top="tabStickyTop" />
          <div class="layout-page">
            <slot />
          </div>
        </div>
      </div>
    </template>

    <ThemeDrawer />
  </div>
</template>

<style scoped>
.layout-shell {
  display: flex;
  height: 100vh;
  min-height: 0;
  flex-direction: column;
}

.layout-row {
  display: flex;
  min-height: 0;
  flex: 1;
}

.layout-row--rest {
  min-height: 0;
}

.layout-side,
.layout-child-side {
  min-width: 0;
  flex-shrink: 0;
  border-right: 1px solid rgb(var(--border-color));
  background: rgb(var(--container-bg-color));
  transition:
    width 0.3s ease,
    border-color 0.3s ease,
    background-color 0.3s ease;
}

.layout-main {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.layout-page {
  min-height: 0;
  flex: 1;
  overflow: auto;
  background: rgb(var(--layout-bg-color));
}
</style>
