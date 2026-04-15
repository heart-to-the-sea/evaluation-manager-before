<template>
  <div class="blank-layout bg-layout">
    <div class="blank-layout__body">
      <div class="blank-layout__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.blank-layout {
  display: flex;
  height: 100vh;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.blank-layout__body {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.blank-layout__content {
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}
</style>
