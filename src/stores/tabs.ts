import type { TabItem } from '@/types/app';

function createTab(path: string, label: string): TabItem {
  return {
    key: path,
    path,
    label,
    closable: path !== '/home'
  };
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    activeKey: '/home',
    tabs: [createTab('/home', '首页')] as TabItem[]
  }),
  actions: {
    reset() {
      this.activeKey = '/home';
      this.tabs = [createTab('/home', '首页')];
    },
    sync(route: { path: string; meta?: Record<string, any> }) {
      const path = route.path;
      const label = String(route.meta?.title || '未命名页面');
      const exists = this.tabs.find(item => item.path === path);

      if (!exists) {
        this.tabs.push(createTab(path, label));
      } else {
        exists.label = label;
      }

      this.activeKey = path;
    },
    remove(path: string) {
      this.tabs = this.tabs.filter(item => item.path !== path);
      if (this.activeKey === path) {
        this.activeKey = this.tabs[this.tabs.length - 1]?.path || '/home';
      }
    }
  }
});
