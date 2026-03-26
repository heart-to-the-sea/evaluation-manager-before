<script lang="ts" setup>
interface Props {
  value: any;
}
const props = defineProps<Props>();
</script>

<template>
  <NSelect :value="props.value" />
</template>
