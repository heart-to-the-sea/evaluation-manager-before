import type { LoginToken, UserInfo } from '@/types/app';
import { request } from '../request';

export function fetchLogin(username: string, password: string) {
  return request<LoginToken>({
    url: '/auth/login',
    method: 'post',
    data: { username, password }
  });
}

export function fetchGetUserInfo() {
  return request<UserInfo>({ url: '/auth/getUserInfo' });
}

export function fetchRefreshToken(refreshToken: string) {
  return request<LoginToken>({
    url: '/auth/refreshToken',
    method: 'post',
    data: { refreshToken }
  });
}

export function fetchLogout() {
  return request<void>({
    url: '/auth/logout',
    method: 'post'
  });
}
