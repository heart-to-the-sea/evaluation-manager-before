<script setup lang="ts">
import AppProvider from '@/components/common/AppProvider.vue';

interface PageRouteLike {
  path: string;
  fullPath?: string;
  query?: Record<string, unknown>;
  meta?: Record<string, any>;
}

function getPageKey(pageRoute: PageRouteLike) {
  if (pageRoute.meta?.multiTab) {
    const query = pageRoute.query || {};
    const queryString = Object.keys(query)
      .sort()
      .map(key => `${key}=${query[key]}`)
      .join('&');

    return queryString ? `${pageRoute.path}?${queryString}` : pageRoute.path;
  }

  return pageRoute.path;
}
</script>

<template>
  <AppProvider>
    <NuxtLayout>
      <NuxtPage v-slot="{ Component, route }">
        <KeepAlive>
          <component :is="Component" v-if="route.meta.keepAlive" :key="getPageKey(route)" />
        </KeepAlive>

        <component :is="Component" v-if="!route.meta.keepAlive" :key="getPageKey(route)" />
      </NuxtPage>
    </NuxtLayout>
  </AppProvider>
</template>

<style>
* {
  box-sizing: border-box;
}
</style>
