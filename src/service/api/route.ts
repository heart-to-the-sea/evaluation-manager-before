import type { RouteItem, UserRouteResponse } from '@/types/app';
import { request } from '../request';

export function fetchGetConstantRoutes() {
  return request<RouteItem[]>({ url: '/route/getConstantRoutes' });
}

export function fetchGetUserRoutes() {
  return request<UserRouteResponse>({ url: '/route/getUserRoutes' });
}

export function fetchIsRouteExist(routeName: string) {
  return request<boolean>({ url: '/route/isRouteExist', params: { routeName } });
}
