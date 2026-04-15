import type { AppMenuOption, RouteItem } from '@/types/app';
import { fetchGetUserRoutes } from '@/service/api';

function sortRoutes(routes: RouteItem[]) {
  return [...routes].sort((a, b) => (a.meta?.order || 0) - (b.meta?.order || 0));
}

function matchRoutePath(pattern: string, currentPath: string) {
  const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '[^/]+')}$`);
  return regex.test(currentPath);
}

function findRouteByPath(currentPath: string, routes: RouteItem[]): RouteItem | null {
  for (const route of routes) {
    if (matchRoutePath(route.path, currentPath)) {
      return route;
    }

    if (route.children?.length) {
      const matched = findRouteByPath(currentPath, route.children);
      if (matched) {
        return matched;
      }
    }
  }

  return null;
}

function resolveLayout(component?: string | null) {
  if (!component) {
    return 'default';
  }

  if (component === 'layout.blank' || component.startsWith('layout.blank$')) {
    return 'blank';
  }

  return 'default';
}

function mapRouteToMenu(route: RouteItem): AppMenuOption | null {
  const children = sortRoutes(route.children || [])
    .map(mapRouteToMenu)
    .filter(Boolean) as AppMenuOption[];

  if (route.meta?.hideInMenu) {
    return null;
  }

  return {
    key: route.name,
    label: route.meta?.title || route.name,
    path: route.path,
    icon: route.meta?.icon,
    hideInMenu: route.meta?.hideInMenu,
    keepAlive: route.meta?.keepAlive,
    activeMenu: route.meta?.activeMenu,
    children: children.length ? children : undefined
  };
}

function collectRouteMap(routes: RouteItem[], result: Record<string, RouteItem> = {}) {
  routes.forEach(route => {
    result[route.name] = route;
    if (route.children?.length) {
      collectRouteMap(route.children, result);
    }
  });

  return result;
}

export const useMenuStore = defineStore('menu', {
  state: () => ({
    homeKey: 'home',
    routes: [] as RouteItem[],
    routeMap: {} as Record<string, RouteItem>,
    loaded: false
  }),
  getters: {
    menuOptions(state) {
      return sortRoutes(state.routes)
        .map(mapRouteToMenu)
        .filter(Boolean) as AppMenuOption[];
    },
    homePath(state) {
      return state.routeMap[state.homeKey]?.path || '/home';
    }
  },
  actions: {
    reset() {
      this.homeKey = 'home';
      this.routes = [];
      this.routeMap = {};
      this.loaded = false;
    },
    async ensureLoaded(force = false) {
      if (this.loaded && !force) {
        return;
      }

      const { data, error } = await fetchGetUserRoutes();
      if (error || !data) {
        return;
      }

      this.homeKey = data.home || 'home';
      this.routes = data.routes || [];
      this.routeMap = collectRouteMap(this.routes);
      this.loaded = true;
    },
    getMatchedRoute(path: string) {
      return findRouteByPath(path, this.routes);
    },
    syncRouteMeta(route: { path: string; meta: Record<string, any> }) {
      const matchedRoute = findRouteByPath(route.path, this.routes);
      if (!matchedRoute?.meta) {
        return null;
      }

      Object.assign(route.meta, matchedRoute.meta);
      route.meta.layout = resolveLayout(matchedRoute.component);
      return matchedRoute;
    }
  }
});
