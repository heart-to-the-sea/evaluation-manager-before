<script setup lang="ts">
import { Icon } from '@iconify/vue';

interface Props {
  icon?: string;
  size?: number;
}

withDefaults(defineProps<Props>(), {
  icon: '',
  size: 18
});
</script>

<template>
  <Icon v-if="icon" :icon="icon" :width="size" :height="size" />
</template>
