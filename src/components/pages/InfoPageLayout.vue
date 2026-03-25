<script lang="tsx"></script>

<template>
  <div style="padding: 16px; height: calc(100vh - 100px); display: flex; flex-direction: column">
    <NCard style="height: 100%" class="card-wrapper" :bordered="false">
      <slot name="contentBox">123</slot>
    </NCard>
  </div>
</template>
