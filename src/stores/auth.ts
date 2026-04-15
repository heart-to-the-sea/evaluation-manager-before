import type { LoginToken, UserInfo } from '@/types/app';
import { fetchGetUserInfo, fetchLogin, fetchLogout } from '@/service/api';
import { useMenuStore } from '@/stores/menu';
import { useTabsStore } from '@/stores/tabs';
import { getStorage, removeStorage, setStorage } from '@/utils/storage';

const TOKEN_KEY = 'em-nuxt-token';
const REFRESH_TOKEN_KEY = 'em-nuxt-refresh-token';
const USER_INFO_KEY = 'em-nuxt-user-info';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    refreshToken: '',
    userInfo: null as UserInfo | null,
    initialized: false
  }),
  getters: {
    isLogin(state) {
      return Boolean(state.token);
    }
  },
  actions: {
    init() {
      if (this.initialized) {
        return;
      }

      this.token = getStorage<string>(TOKEN_KEY, '');
      this.refreshToken = getStorage<string>(REFRESH_TOKEN_KEY, '');
      this.userInfo = getStorage<UserInfo | null>(USER_INFO_KEY, null);
      this.initialized = true;
    },
    setAuth(payload: Partial<LoginToken>) {
      this.token = payload.token || '';
      this.refreshToken = payload.refreshToken || '';
      setStorage(TOKEN_KEY, this.token);
      setStorage(REFRESH_TOKEN_KEY, this.refreshToken);
    },
    setUserInfo(userInfo: UserInfo | null) {
      this.userInfo = userInfo;
      setStorage(USER_INFO_KEY, userInfo);
    },
    clearAuth() {
      this.token = '';
      this.refreshToken = '';
      this.userInfo = null;
      removeStorage(TOKEN_KEY);
      removeStorage(REFRESH_TOKEN_KEY);
      removeStorage(USER_INFO_KEY);
    },
    async login(username: string, password: string) {
      const { data, error } = await fetchLogin(username, password);
      if (error) {
        return { error };
      }

      this.setAuth(data);
      return { error: null };
    },
    async loadUserInfo(force = false) {
      if (this.userInfo && !force) {
        return this.userInfo;
      }

      const { data, error } = await fetchGetUserInfo();
      if (error) {
        return null;
      }

      this.setUserInfo(data);
      return data;
    },
    async logout() {
      await fetchLogout();
      this.clearAuth();
      const menuStore = useMenuStore();
      const tabsStore = useTabsStore();
      menuStore.reset();
      tabsStore.reset();
    }
  }
});
