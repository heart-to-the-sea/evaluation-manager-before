import type { DepartmentBo, DepartmentVo } from '@/types/app';
import { request } from '../request';
import * as URL from './url';

export function fetchDepartmentList(params?: Partial<DepartmentBo>) {
  return request<DepartmentVo[]>({ url: URL.DEPARTMENT_LIST, method: 'get', params });
}

export function fetchDepartmentTreeList(params?: Partial<DepartmentBo>) {
  return request<DepartmentVo[]>({ url: URL.DEPARTMENT_TREE_LIST, method: 'get', params });
}

export function fetchDepartmentById(id: string) {
  return request<DepartmentVo>({ url: URL.DEPARTMENT_GET_BY_ID, method: 'get', params: { id } });
}

export function fetchDepartmentAdd(data: DepartmentBo) {
  return request<void>({ url: URL.DEPARTMENT_ADD, method: 'post', data });
}

export function fetchDepartmentUpdate(data: DepartmentBo) {
  return request<void>({ url: URL.DEPARTMENT_UPDATE, method: 'put', data });
}

export function fetchDepartmentDelete(id: string) {
  return request<void>({ url: URL.DEPARTMENT_DELETE, method: 'delete', params: { id } });
}
