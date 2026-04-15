export interface ApiResponse<T> {
  code: string;
  msg: string;
  data: T;
}

export interface RequestResult<T> {
  data: T;
  error: Error | null;
  code: string;
  msg: string;
}

export interface LoginToken {
  token: string;
  refreshToken: string;
}

export interface UserInfo {
  userId: string;
  username: string;
  roles: string[];
  buttons: string[];
}

export interface RouteMeta {
  title?: string;
  i18nKey?: string;
  layout?: string | false;
  icon?: string;
  order?: number;
  hideInMenu?: boolean;
  keepAlive?: boolean;
  constant?: boolean;
  activeMenu?: string;
}

export interface RouteItem {
  id: string;
  name: string;
  path: string;
  component?: string | null;
  meta?: RouteMeta;
  children?: RouteItem[];
}

export interface UserRouteResponse {
  home: string;
  routes: RouteItem[];
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
}

export interface DictVo {
  id?: string;
  name?: string;
  code?: string;
  description?: string;
  status?: number;
  statusLabel?: string;
  dictTemplateStr?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DictBo {
  pageNum?: number;
  pageSize?: number;
  id?: string;
  name?: string;
  code?: string;
  description?: string;
  status?: number;
  dictTemplateStr?: string;
}

export interface DictValuesVo {
  id?: string;
  dictId?: string;
  dictCode?: string;
  label?: string;
  value?: string;
  sort?: number;
  status: string;
  statusLabel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuVo {
  id?: string;
  parentId?: string;
  key?: string;
  label?: string;
  i18nKey?: string;
  routeKey?: string;
  routePath?: string;
  component?: string;
  icon?: string;
  menuType?: 'DIRECTORY' | 'MENU';
  sort?: number;
  status?: number;
  hideInMenu?: boolean;
  keepAlive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  children?: MenuVo[];
}

export interface MenuBo {
  pageNum?: number;
  pageSize?: number;
  id?: string;
  parentId?: string;
  key?: string;
  label?: string;
  i18nKey?: string;
  routeKey?: string;
  routePath?: string;
  component?: string;
  icon?: string;
  menuType?: 'DIRECTORY' | 'MENU';
  sort?: number;
  status?: number;
  hideInMenu?: boolean;
  keepAlive?: boolean;
}

export interface AppMenuOption {
  key: string;
  label: string;
  path: string;
  icon?: string;
  activeMenu?: string;
  hideInMenu?: boolean;
  keepAlive?: boolean;
  children?: AppMenuOption[];
}

export interface TabItem {
  key: string;
  path: string;
  label: string;
  closable: boolean;
}
