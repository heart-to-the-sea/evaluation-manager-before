const PUBLIC_PATHS = ['/login', '/403', '/404', '/500'];

export default defineNuxtRouteMiddleware(async to => {
  const authStore = useAuthStore();
  const menuStore = useMenuStore();
  const themeStore = useThemeStore();

  authStore.init();
  themeStore.init();

  if (to.path === '/') {
    if (authStore.isLogin) {
      await menuStore.ensureLoaded();
      return navigateTo(menuStore.homePath);
    }

    return navigateTo('/login');
  }

  if (PUBLIC_PATHS.includes(to.path)) {
    if (to.path === '/login' && authStore.isLogin) {
      await menuStore.ensureLoaded();
      return navigateTo(String(to.query.redirect || menuStore.homePath));
    }

    return;
  }

  if (!authStore.isLogin) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }

  await authStore.loadUserInfo();
  await menuStore.ensureLoaded();
  menuStore.syncRouteMeta(to);
});
