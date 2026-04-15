export interface PageRouteTemplate {
  label: string;
  routeKey: string;
  routePath: string;
  component?: string;
}

export const PAGE_ROUTE_TEMPLATES: PageRouteTemplate[] = [
  { label: '首页', routeKey: 'home', routePath: '/home', component: 'layout.base$view.home' },
  {
    label: '字典管理',
    routeKey: 'system_manager_dict_manager',
    routePath: '/system-manager/dict-manager',
    component: 'view.system-manager.dict-manager'
  },
  {
    label: '菜单管理',
    routeKey: 'system_manager_menu',
    routePath: '/system-manager/menu',
    component: 'view.system-manager.menu.index'
  },
  {
    label: '菜单编辑',
    routeKey: 'system_manager_menu_edit_id',
    routePath: '/system-manager/menu/edit/:id',
    component: 'view.system-manager.menu.edit'
  },
  {
    label: '用户管理',
    routeKey: 'user_manager_index',
    routePath: '/user-manager/index',
    component: 'view.user-manager.index'
  },
  {
    label: '用户详情',
    routeKey: 'user_manager_info_id',
    routePath: '/user-manager/info/:id',
    component: 'view.user-manager.info'
  },
  {
    label: '内嵌页面',
    routeKey: 'iframe_page_url',
    routePath: '/iframe-page/:url',
    component: 'layout.base$view.iframe-page'
  }
];
