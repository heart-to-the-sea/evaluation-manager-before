import type { PageResult, UserBo, UserOptionVo, UserVo } from '@/types/app';
import { request } from '../request';
import * as URL from './url';

export function fetchUserList(params: UserBo) {
  return request<PageResult<UserVo>>({ url: URL.USER_LIST, method: 'get', params });
}

export function fetchUserById(id: string) {
  return request<UserVo>({ url: URL.USER_GET_BY_ID, method: 'get', params: { id } });
}

export function fetchUserOptions(params?: Partial<UserBo>) {
  return request<UserOptionVo[]>({ url: URL.USER_OPTIONS, method: 'get', params });
}

export function fetchUserAdd(data: UserBo) {
  return request<void>({ url: URL.USER_ADD, method: 'post', data });
}

export function fetchUserUpdate(data: UserBo) {
  return request<void>({ url: URL.USER_UPDATE, method: 'put', data });
}

export function fetchUserDelete(id: string) {
  return request<void>({ url: URL.USER_DELETE, method: 'delete', params: { id } });
}
