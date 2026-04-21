import type { MenuBo, MenuVo, PageResult } from '@/types/app';
import { request } from '../request';
import * as URL from './url';

export function fetchMenuList(params: MenuBo) {
  return request<PageResult<MenuVo>>({ url: URL.MENU_LIST, method: 'get', params });
}

export function fetchMenuTreeList(params?: Partial<MenuBo>) {
  return request<MenuVo[]>({ url: URL.MENU_TREE_LIST, method: 'get', params });
}

export function fetchMenuById(id: string) {
  return request<MenuVo>({ url: URL.MENU_GET_BY_ID, method: 'get', params: { id } });
}

export function fetchMenuAdd(data: MenuVo) {
  return request<void>({ url: URL.MENU_ADD, method: 'post', data });
}

export function fetchMenuUpdate(data: MenuVo) {
  return request<void>({ url: URL.MENU_UPDATE, method: 'put', data });
}

export function fetchMenuDelete(id: string) {
  return request<void>({ url: URL.MENU_DELETE, method: 'delete', params: { id } });
}
