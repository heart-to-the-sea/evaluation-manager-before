<script lang="tsx"></script>

<template>
  <div style="padding: 16px; height: calc(100vh - 100px); display: flex; flex-direction: column">
    <NCard :bordered="false" class="card-wrapper" style="margin-bottom: 16px; height: fit-content">
      <div><slot name="searchBox">123</slot></div>
    </NCard>
    <NCard style="height: 100%" class="card-wrapper" :bordered="false">
      <slot name="contentBox">123</slot>
    </NCard>
  </div>
</template>
