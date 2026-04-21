import type { PageResult, RoleBo, RoleVo } from '@/types/app';
import { request } from '../request';
import * as URL from './url';

export function fetchRoleList(params: RoleBo) {
  return request<PageResult<RoleVo>>({ url: URL.ROLE_LIST, method: 'get', params });
}

export function fetchRoleById(id: string) {
  return request<RoleVo>({ url: URL.ROLE_GET_BY_ID, method: 'get', params: { id } });
}

export function fetchRoleAdd(data: RoleBo) {
  return request<void>({ url: URL.ROLE_ADD, method: 'post', data });
}

export function fetchRoleUpdate(data: RoleBo) {
  return request<void>({ url: URL.ROLE_UPDATE, method: 'put', data });
}

export function fetchRoleDelete(id: string) {
  return request<void>({ url: URL.ROLE_DELETE, method: 'delete', params: { id } });
}

export function fetchRoleAssignMenus(roleId: string, menuIds: string[]) {
  return request<void>({ url: URL.ROLE_ASSIGN_MENUS, method: 'post', params: { roleId }, data: menuIds });
}

export function fetchRoleMenuIds(roleId: string) {
  return request<string[]>({ url: URL.ROLE_GET_MENU_IDS, method: 'get', params: { roleId } });
}
