import { request } from '../request';
import * as URL from './url';

export interface DictVo {
  id?: string | number;
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

export interface PageDictVo {
  records: DictVo[];
  total: number;
  size: number;
  current: number;
}

export function fetchDictList(bo: DictBo) {
  return request<PageDictVo>({ url: URL.DICT_LIST, method: 'get', params: bo });
}

export function fetchDictAdd(data: DictVo) {
  return request({ url: URL.DICT_ADD, method: 'post', data });
}

export function fetchDictUpdate(data: DictVo) {
  return request({ url: URL.DICT_UPDATE, method: 'put', data });
}

export function fetchDictDelete(id: string | number) {
  return request({ url: URL.DICT_DELETE, method: 'delete', params: { id } });
}

export interface DictValuesVo {
  id?: number;
  dictId?: number;
  dictKey?: string;
  label?: string;
  value?: string;
  sort?: number;
  status?: number;
  statusLabel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DictValuesBo {
  pageNum?: number;
  pageSize?: number;
  dictId?: number;
  label?: string;
  value?: string;
}

export function fetchDictValuesAdd(data: DictValuesVo) {
  return request({ url: URL.DICT_VALUES_ADD, method: 'post', data });
}

export function fetchDictValuesUpdate(data: DictValuesVo) {
  return request({ url: URL.DICT_VALUES_UPDATE, method: 'put', data });
}

export function fetchDictValuesListByCode(dictCode: string) {
  return request<DictValuesVo[]>({ url: URL.DICT_VALUES_LIST_BY_CODE, method: 'get', params: { dictCode } });
}

export function fetchDictValuesDelete(id: number) {
  return request({ url: URL.DICT_VALUES_DELETE, method: 'delete', params: { id } });
}
