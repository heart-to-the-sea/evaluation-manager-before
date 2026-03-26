<script lang="ts" setup>
import { ref } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { AddCircle } from '@vicons/ionicons5';
interface Props {
  show: boolean;
}
const formRef = ref<FormInst | null>(null);
const uploadFileRef = ref<HTMLInputElement | null>(null);
const formData = ref({
  account: '',
  image: '',
  username: '',
  password: '',
  deptId: '',
  jobStatus: '1',
  accountStatus: '1',
  workState: '1'
});
const props = defineProps<Props>();

const emit = defineEmits<{ close: [] }>();

const rules: FormRules = {
  account: [
    {
      required: true,
      message: '请输入账户'
    }
  ],
  image: [
    {
      required: true,
      message: '请选择头像'
    }
  ]
};

function handleClose() {
  emit('close');
}
function handleSubmit() {
  formRef.value?.validate();
}
function handleFileInputChange(e: Event) {
  const target = e.target as HTMLInputElement;
  console.log(target.files);
}
</script>

<template>
  <NModal :show="props.show">
    <NCard style="width: 700px" title="新增用户" size="huge" role="dialog" aria-modal="true">
      <template #header-extra>
        <NButton type="primary" @click="handleClose">关闭</NButton>
      </template>
      <NForm ref="formRef" label-placement="left" :model="formData" :rules="rules" :label-width="80">
        <NGrid x-gap="26" :cols="20">
          <NGi span="15">
            <NFormItem label="账户" path="account">
              <NInput v-model:value.trim="formData.account" placeholder="请输入用户名"></NInput>
            </NFormItem>

            <NFormItem label="用户名">
              <NInput v-model:value.trim="formData.image" placeholder="请输入用户名"></NInput>
            </NFormItem>

            <NFormItem label="密码">
              <NInput v-model:value.trim="formData.password" placeholder="请输入用户名"></NInput>
            </NFormItem>
          </NGi>
          <NGi span="5">
            <NFlex justify="right" align="center">
              <NFormItem label-width="0" path="image">
                <div class="img-box" @click="uploadFileRef?.click()">
                  <NIcon size="80" color="#afafaf" :component="AddCircle"></NIcon>
                </div>
                <input ref="uploadFileRef" hidden type="file" @change="handleFileInputChange" />
              </NFormItem>
            </NFlex>
          </NGi>
        </NGrid>

        <NFormItem label="部门">
          <NInput placeholder="请输入用户名"></NInput>
        </NFormItem>

        <NFormItem label="岗位状态">
          <NSelect
            v-model:value="formData.jobStatus"
            placeholder="请选择状岗位态"
            :options="[
              { label: '在职', value: '1' },
              { label: '离职', value: '2' }
            ]"
          />
        </NFormItem>
        <NFormItem label="工作状态">
          <NSelect
            v-model:value="formData.accountStatus"
            placeholder="请选择工作状态"
            :options="[
              { label: '请假', value: '1' },
              { label: '工作', value: '2' }
            ]"
          />
        </NFormItem>
        <NFormItem label="账户状态">
          <NSelect
            v-model:value="formData.accountStatus"
            placeholder="请选择状态"
            :options="[
              { label: '启用', value: '1' },
              { label: '禁用', value: '2' }
            ]"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <div style="display: flex; flex-wrap: nowrap; justify-content: flex-end">
          <NButton type="primary" style="margin-right: 10px" @click="handleSubmit">提交</NButton>
          <NButton type="default" @click="handleClose">取消</NButton>
        </div>
      </template>
    </NCard>
  </NModal>
  >
</template>

<style lang="scss" scoped>
.img-box {
  width: 130px;
  height: 150px;
  background-color: #efefef;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
}

:deep(.n-form-item-blank--error) {
  .img-box {
    background-color: #fef0f0 !important;
    border: 1px solid #d03050 !important;
  }
}

:deep(.n-form-item-blank--success) {
  .img-box {
    background-color: #e8f5e9 !important;
    border: 1px solid #00b42a !important;
  }
}
</style>
