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

export interface UserVo {
  id?: string;
  employeeNo?: string;
  name?: string;
  username?: string;
  gender?: string;
  birthday?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  departmentId?: string;
  departmentName?: string;
  positionName?: string;
  positionNameLabel?: string;
  leaderFlag?: boolean;
  entryDate?: string;
  jobStatus?: string;
  workStatus?: string;
  accountStatus?: string;
  account?: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserBo {
  pageNum?: number;
  pageSize?: number;
  id?: string;
  employeeNo?: string;
  name?: string;
  username?: string;
  gender?: string;
  birthday?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  departmentId?: string;
  positionName?: string;
  leaderFlag?: boolean;
  entryDate?: string;
  entryDateStart?: string;
  entryDateEnd?: string;
  jobStatus?: string;
  workStatus?: string;
  accountStatus?: string;
  account?: string;
  password?: string;
}

export interface UserOptionVo {
  id?: string;
  employeeNo?: string;
  name?: string;
  account?: string;
  departmentId?: string;
}

export interface DepartmentVo {
  id?: string;
  parentId?: string;
  name?: string;
  leaderEmployeeId?: string;
  leaderName?: string;
  sort?: number;
  status?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  children?: DepartmentVo[];
}

export interface DepartmentBo {
  id?: string;
  parentId?: string;
  name?: string;
  leaderEmployeeId?: string;
  sort?: number;
  status?: string;
  remark?: string;
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
