<script setup lang="ts">
import { LockClosedOutline, PersonOutline } from '@vicons/ionicons5';
import { NButton, NCard, NForm, NFormItem, NIcon, NInput } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';

definePageMeta({
  layout: 'blank'
});

const route = useRoute();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const formData = reactive({
  username: 'admin',
  password: 'admin123'
});

const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: ['blur', 'input'] }],
  password: [{ required: true, message: '请输入密码', trigger: ['blur', 'input'] }]
};

const loginBackground = computed(() =>
  themeStore.darkMode
    ? 'radial-gradient(circle at top left, rgb(var(--em-primary-color-rgb) / 16%), transparent 32%), linear-gradient(180deg, rgb(24 24 24) 0%, rgb(18 18 18) 100%)'
    : 'radial-gradient(circle at top left, rgb(var(--em-primary-color-rgb) / 10%), transparent 32%), linear-gradient(180deg, rgb(246 251 255) 0%, rgb(242 243 245) 100%)'
);

async function handleLogin() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  loading.value = true;
  const { error } = await authStore.login(formData.username, formData.password);

  if (!error) {
    await authStore.loadUserInfo(true);
    const menuStore = useMenuStore();
    await menuStore.ensureLoaded(true);
    window.$message?.success('登录成功');
    await navigateTo(String(route.query.redirect || menuStore.homePath));
  }

  loading.value = false;
}
</script>

<template>
  <div class="login-page" :style="{ background: loginBackground }">
    <div class="login-wave wave-left" />
    <div class="login-wave wave-right" />

    <div class="login-panel">
      <div class="login-brand">
        <div class="brand-logo">评</div>
        <div>
          <div class="brand-title">评价管理系统</div>
          <div class="brand-desc">Nuxt 3 管理后台</div>
        </div>
      </div>

      <div class="login-tip">请使用系统账号登录，当前页面已按原项目风格补齐主题切换与阴影效果。</div>

      <NCard class="login-card card-wrapper" :bordered="false">
        <template #header>
          <div class="text-center text-20px font-600">欢迎登录</div>
        </template>

        <NForm ref="formRef" :model="formData" :rules="rules" label-placement="top">
          <NFormItem label="账号" path="username">
            <NInput v-model:value="formData.username" placeholder="请输入账号">
              <template #prefix>
                <NIcon><PersonOutline /></NIcon>
              </template>
            </NInput>
          </NFormItem>

          <NFormItem label="密码" path="password">
            <NInput
              v-model:value="formData.password"
              type="password"
              show-password-on="click"
              placeholder="请输入密码"
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <NIcon><LockClosedOutline /></NIcon>
              </template>
            </NInput>
          </NFormItem>

          <NButton type="primary" block size="large" :loading="loading" @click="handleLogin">登录</NButton>
        </NForm>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: background 0.3s ease;
}

.login-panel {
  position: relative;
  z-index: 2;
  width: 420px;
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.login-card {
  border-radius: 16px;
}

.brand-logo {
  display: flex;
  height: 52px;
  width: 52px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: var(--em-primary-color);
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  box-shadow: 0 8px 20px rgb(var(--em-primary-color-rgb) / 24%);
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  color: rgb(var(--base-text-color));
}

.brand-desc,
.login-tip {
  color: rgb(var(--muted-text-color));
}

.login-tip {
  margin-bottom: 18px;
  font-size: 14px;
  line-height: 1.7;
}

.login-wave {
  position: absolute;
  border-radius: 999px;
  background: rgb(var(--em-primary-color-rgb) / 8%);
  filter: blur(2px);
}

.wave-left {
  left: -140px;
  top: -60px;
  height: 320px;
  width: 320px;
}

.wave-right {
  right: -120px;
  bottom: -80px;
  height: 280px;
  width: 280px;
}
</style>
