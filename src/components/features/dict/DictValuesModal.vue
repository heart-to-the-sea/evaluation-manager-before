<script setup lang="ts">
import { computed } from 'vue';
import { NButton, NForm, NFormItem, NInput, NInputNumber, NModal, NSelect, NSpace } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import DictTag from '@/components/common/DictTag.vue';
import type { DictValuesVo } from '@/types/app';
import { fetchDictValuesAdd, fetchDictValuesUpdate } from '@/service/api';
import { dictColorPresetOptions } from '@/constants/dict';
import { clearDictCache } from '@/composables/use-dict';

interface Props {
  show: boolean;
  dictCode: string;
  data: DictValuesVo | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);
const isEdit = computed(() => Boolean(props.data?.id));

const formData = ref({
  label: '',
  value: '',
  customColor: '',
  className: '',
  sort: 1,
  status: '1'
});

const rules: FormRules = {
  label: [{ required: true, message: '请输入标签', trigger: ['input', 'blur'] }],
  value: [{ required: true, message: '请输入值', trigger: ['input', 'blur'] }]
};

const statusOptions = [
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' }
];

watch(
  () => props.show,
  visible => {
    if (!visible) {
      return;
    }

    formData.value = {
      label: props.data?.label || '',
      value: props.data?.value || '',
      customColor: props.data?.customColor || '',
      className: props.data?.className || '',
      sort: props.data?.sort ?? 1,
      status: props.data?.status || '1'
    };
  }
);

async function handleSubmit() {
  if (!props.dictCode) {
    window.$message?.warning('缺少字典编码');
    return;
  }

  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  submitting.value = true;

  try {
    const payload: DictValuesVo = {
      id: props.data?.id,
      dictCode: props.dictCode,
      label: formData.value.label,
      value: formData.value.value,
      customColor: formData.value.customColor || undefined,
      className: formData.value.className,
      sort: formData.value.sort,
      status: formData.value.status
    };

    if (isEdit.value) {
      await fetchDictValuesUpdate(payload);
      window.$message?.success('字典值更新成功');
    } else {
      await fetchDictValuesAdd(payload);
      window.$message?.success('字典值新增成功');
    }

    clearDictCache(props.dictCode);
    emit('close');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NModal :show="show" preset="card" :title="isEdit ? '编辑字典值' : '新增字典值'" :style="{ width: '520px' }"
    :mask-closable="false" @update:show="value => !value && emit('close')">
    <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" :label-width="72">
      <NFormItem label="标签" path="label">
        <NInput v-model:value="formData.label" placeholder="请输入标签" />
      </NFormItem>
      <NFormItem label="值" path="value">
        <NInput v-model:value="formData.value" placeholder="请输入值" />
      </NFormItem>
      <NFormItem label="自定义颜色">
        <NInput v-model:value="formData.customColor" class="dict-value-color-input" placeholder="例如 #4098fc" clearable>
          <template #suffix>
            <!-- <div class="dict-value-color-input-suffix">
              <NColorPicker
                v-model:value="formData.customColor"
                class="dict-value-color-picker"
                :show-alpha="false"
                :modes="['hex']"
              />
            </div> -->
          </template>
        </NInput>
        <div class="dict-color-preset-list">
          <button v-for="preset in dictColorPresetOptions" :key="preset.value" type="button" class="dict-color-preset"
            :class="{ 'is-active': formData.customColor === preset.value }"
            @click="formData.customColor = preset.value">
            <span class="dict-color-preset__swatch" :style="{ backgroundColor: preset.value }"></span>
            <span class="dict-color-preset__text">{{ preset.label }}</span>
          </button>
        </div>
        <div class="dict-value-color-tip">可直接点选快捷色板，或手动输入颜色值。</div>
      </NFormItem>
      <NFormItem label="样式类名">
        <NInput v-model:value="formData.className" placeholder="可选，自定义 tag 类名" />
      </NFormItem>
      <NFormItem label="效果预览">
        <DictTag :dict-code="dictCode" :value="formData.value || null"
          :override-label="formData.label || formData.value || '预览标签'" :custom-color="formData.customColor || ''"
          :class-name="formData.className || ''" />
      </NFormItem>
      <NFormItem label="排序">
        <NInputNumber v-model:value="formData.sort" class="w-full" :min="0" />
      </NFormItem>
      <NFormItem label="状态">
        <NSelect v-model:value="formData.status" :options="statusOptions" placeholder="请选择状态" />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end" :size="16">
        <NButton @click="emit('close')">取消</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">确定</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.dict-value-color-input-suffix {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
}

.dict-color-preset-list {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
  margin-left: 0;
}

:deep(.dict-value-color-picker .n-color-picker-trigger) {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 90%);
}

:deep(.dict-value-color-picker .n-color-picker-trigger__fill) {
  border-radius: 5px;
}

.dict-color-preset {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  border-radius: 10px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 85%);
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.dict-color-preset:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 0 0 1px rgb(var(--primary-color) / 28%),
    0 6px 16px rgb(15 23 42 / 8%);
}

.dict-color-preset.is-active {
  box-shadow:
    inset 0 0 0 1px rgb(var(--primary-color)),
    0 6px 16px rgb(32 128 240 / 12%);
}

.dict-color-preset__swatch {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border-radius: 999px;
  border: 1px solid rgb(var(--border-color));
}

.dict-color-preset__text {
  color: var(--n-text-color-2);
  font-size: 12px;
}

.dict-value-color-tip {
  margin-top: 8px;
  color: var(--n-text-color-3);
  font-size: 12px;
  line-height: 1.5;
}

@media (width <=640px) {
  .dict-color-preset-list {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
