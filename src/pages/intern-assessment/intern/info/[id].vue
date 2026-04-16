<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ArrowBackOutline } from '@vicons/ionicons5';
import { NButton, NCard, NDescriptions, NDescriptionsItem, NEmpty, NIcon, NSpin, NTag } from 'naive-ui';
import InfoPageLayout from '@/components/pages/InfoPageLayout.vue';
import { useDict } from '@/composables/use-dict';
import { fetchAssessmentPaperList, fetchAssessmentPathById, fetchUserById } from '@/service/api';
import type { AssessmentInternPathStageVo, AssessmentInternPathVo, AssessmentPaperVo, UserVo } from '@/types/app';

definePageMeta({
  title: '实习生详情'
});

const route = useRoute();

const loading = ref(false);
const detail = ref<AssessmentInternPathVo | null>(null);
const userDetail = ref<UserVo | null>(null);
const paperRecords = ref<AssessmentPaperVo[]>([]);

const genderDict = useDict('employee_gender');
const userTypeDict = useDict('user_type');
const positionDict = useDict('employee_position');
const jobStatusDict = useDict('employee_job_status');
const workStatusDict = useDict('employee_work_status');
const accountStatusDict = useDict('employee_account_status');
const pathStatusDict = useDict('assessment_path_status');
const stageStatusDict = useDict('assessment_path_stage_status');
const paperStatusDict = useDict('assessment_paper_status');

const pathId = computed(() => String(route.params.id || ''));

const stageRecords = computed(() => {
  const recordMap = new Map<string, AssessmentPaperVo[]>();

  for (const record of paperRecords.value) {
    const key = record.pathStageId || record.stageId || '';
    if (!key) continue;
    const list = recordMap.get(key) || [];
    list.push(record);
    recordMap.set(key, list);
  }

  return (detail.value?.stages || []).map(stage => ({
    ...stage,
    records: [...(recordMap.get(stage.id || stage.stageId || '') || [])].sort((left, right) =>
      String(right.createdAt || '').localeCompare(String(left.createdAt || ''))
    )
  }));
});

watch(pathId, () => {
  loadDetail();
});

onMounted(() => {
  loadDetail();
});

async function loadDetail() {
  if (!pathId.value) {
    detail.value = null;
    userDetail.value = null;
    paperRecords.value = [];
    return;
  }

  loading.value = true;
  try {
    const { data, error } = await fetchAssessmentPathById(pathId.value);
    if (error || !data) {
      detail.value = null;
      userDetail.value = null;
      paperRecords.value = [];
      return;
    }

    detail.value = data;

    const tasks: Promise<unknown>[] = [
      loadPaperRecords(data.id || '')
    ];

    if (data.userId) {
      tasks.push(loadUserDetail(data.userId));
    } else {
      userDetail.value = null;
    }

    await Promise.all(tasks);
  } finally {
    loading.value = false;
  }
}

async function loadUserDetail(userId: string) {
  const { data, error } = await fetchUserById(userId);
  userDetail.value = error ? null : data || null;
}

async function loadPaperRecords(currentPathId: string) {
  if (!currentPathId) {
    paperRecords.value = [];
    return;
  }

  const { data, error } = await fetchAssessmentPaperList({
    pageNum: 1,
    pageSize: 1000,
    pathId: currentPathId
  });

  paperRecords.value = error ? [] : data?.records || [];
}

function getPathStatusType(status?: string): 'default' | 'success' | 'warning' {
  if (status === 'completed') return 'success';
  if (status === 'in_progress') return 'warning';
  return 'default';
}

function getStageStatusType(status?: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (status === 'passed') return 'success';
  if (status === 'in_progress' || status === 'pending_review') return 'warning';
  if (status === 'failed') return 'error';
  if (status === 'skipped') return 'info';
  return 'default';
}

function getPaperPassType(record?: AssessmentPaperVo): 'default' | 'success' | 'error' | 'warning' {
  if (record?.passFlag === true) return 'success';
  if (record?.passFlag === false) return 'error';
  return 'warning';
}

function getStageDotClass(status?: string) {
  if (status === 'passed') return 'is-success';
  if (status === 'in_progress' || status === 'pending_review') return 'is-warning';
  if (status === 'failed') return 'is-error';
  if (status === 'skipped') return 'is-info';
  return 'is-default';
}

function getStageResultText(stage: AssessmentInternPathStageVo) {
  if (stage.latestPaperStatus === 'pending_review') return '待批阅';
  if (stage.latestPaperPassFlag === true) return '已通过';
  if (stage.latestPaperPassFlag === false) return '未通过';
  if (stage.status === 'in_progress') return '进行中';
  if (stage.status === 'skipped') return '已跳过';
  return '未开始';
}

function getRecordResultText(record: AssessmentPaperVo) {
  if (record.passFlag === true) return '通过';
  if (record.passFlag === false) return '未通过';
  return '待判定';
}

function handleViewPaper(record: AssessmentPaperVo) {
  if (!record.id) return;
  navigateTo(`/intern-assessment/paper/info/${record.id}`);
}
</script>

<template>
  <InfoPageLayout>
    <template #contentBox>
      <NCard :bordered="false" class="card-wrapper">
        <div class="page-header">
          <div class="page-header__title">实习生详情</div>
          <NButton @click="navigateTo('/intern-assessment/intern')">
            <template #icon>
              <NIcon><ArrowBackOutline /></NIcon>
            </template>
            返回列表
          </NButton>
        </div>

        <NSpin :show="loading">
          <NEmpty v-if="!detail" description="暂无实习生考核信息" />

          <template v-else>
            <div class="detail-section">
              <div class="detail-section__title">基本信息</div>
              <NDescriptions bordered label-placement="left" :column="2">
                <NDescriptionsItem label="实习生">{{ detail.userName || userDetail?.name || userDetail?.username || '-' }}</NDescriptionsItem>
                <NDescriptionsItem label="工号">{{ detail.employeeNo || userDetail?.employeeNo || '-' }}</NDescriptionsItem>
                <NDescriptionsItem label="账号">{{ userDetail?.account || '-' }}</NDescriptionsItem>
                <NDescriptionsItem label="性别">{{ genderDict.getLabel(userDetail?.gender) || '-' }}</NDescriptionsItem>
                <NDescriptionsItem label="手机号">{{ userDetail?.phone || '-' }}</NDescriptionsItem>
                <NDescriptionsItem label="邮箱">{{ userDetail?.email || '-' }}</NDescriptionsItem>
                <NDescriptionsItem label="所属部门">{{ userDetail?.departmentName || '-' }}</NDescriptionsItem>
                <NDescriptionsItem label="岗位">{{ userDetail?.positionNameLabel || positionDict.getLabel(userDetail?.positionName) || '-' }}</NDescriptionsItem>
                <NDescriptionsItem label="用户类型">{{ userDetail?.userTypeLabel || userTypeDict.getLabel(userDetail?.userType) || '-' }}</NDescriptionsItem>
                <NDescriptionsItem label="是否负责人">{{ userDetail?.leaderFlag ? '是' : '否' }}</NDescriptionsItem>
                <NDescriptionsItem label="入职状态">
                  <NTag :bordered="false" :type="userDetail?.jobStatus === '1' ? 'success' : 'warning'">
                    {{ jobStatusDict.getLabel(userDetail?.jobStatus) || '-' }}
                  </NTag>
                </NDescriptionsItem>
                <NDescriptionsItem label="工作状态">
                  <NTag :bordered="false" type="info">
                    {{ workStatusDict.getLabel(userDetail?.workStatus) || '-' }}
                  </NTag>
                </NDescriptionsItem>
                <NDescriptionsItem label="账号状态">
                  <NTag :bordered="false" :type="userDetail?.accountStatus === '1' ? 'success' : 'error'">
                    {{ accountStatusDict.getLabel(userDetail?.accountStatus) || '-' }}
                  </NTag>
                </NDescriptionsItem>
                <NDescriptionsItem label="更新时间">{{ userDetail?.updatedAt || detail.updatedAt || '-' }}</NDescriptionsItem>
              </NDescriptions>
            </div>

            <div class="detail-section">
              <div class="detail-section__title">考核概览</div>
              <NDescriptions bordered label-placement="left" :column="2">
                <NDescriptionsItem label="路径模板">{{ detail.templateName || '-' }}</NDescriptionsItem>
                <NDescriptionsItem label="当前阶段">{{ detail.currentStageName || '-' }}</NDescriptionsItem>
                <NDescriptionsItem label="整体状态">
                  <NTag :bordered="false" :type="getPathStatusType(detail.status)">
                    {{ pathStatusDict.getLabel(detail.status) || '-' }}
                  </NTag>
                </NDescriptionsItem>
                <NDescriptionsItem label="阶段数量">{{ detail.stages?.length || 0 }}</NDescriptionsItem>
                <NDescriptionsItem label="创建时间">{{ detail.createdAt || '-' }}</NDescriptionsItem>
                <NDescriptionsItem label="最近更新时间">{{ detail.updatedAt || '-' }}</NDescriptionsItem>
              </NDescriptions>
            </div>

            <div class="detail-section">
              <div class="detail-section__title">阶段与履历</div>
              <div v-if="stageRecords.length" class="stage-list">
                <div v-for="(stage, index) in stageRecords" :key="stage.id || stage.stageId || index" class="stage-item">
                  <div class="stage-item__rail">
                    <div class="stage-dot" :class="getStageDotClass(stage.status)"></div>
                    <div v-if="index < stageRecords.length - 1" class="stage-line"></div>
                  </div>

                  <div class="stage-item__body">
                    <div class="stage-item__header">
                      <div class="stage-item__title">
                        <span>{{ stage.stageName || '-' }}</span>
                        <NTag :bordered="false" :type="getStageStatusType(stage.status)">
                          {{ stageStatusDict.getLabel(stage.status) || stage.status || '-' }}
                        </NTag>
                      </div>
                      <div class="stage-item__meta">
                        <span>结果：{{ getStageResultText(stage) }}</span>
                        <span>最近考核：{{ stage.latestPaperCreatedAt || '-' }}</span>
                        <span>批阅时间：{{ stage.latestPaperReviewedAt || '-' }}</span>
                      </div>
                    </div>

                    <div class="stage-summary">
                      <div class="stage-summary__item">答对题数：{{ stage.latestPaperQuestionTotal == null ? '-' : `${stage.latestPaperCorrectTotal ?? 0} / ${stage.latestPaperQuestionTotal ?? 0}` }}</div>
                      <div class="stage-summary__item">最近得分：{{ stage.latestPaperScore ?? '-' }}</div>
                      <div class="stage-summary__item">结果说明：{{ stage.latestPaperFinalComment || '-' }}</div>
                    </div>

                    <div class="record-list">
                      <div class="record-list__title">考核记录履历</div>

                      <div v-if="stage.records.length" class="record-items">
                        <div v-for="record in stage.records" :key="record.id" class="record-item">
                          <div class="record-item__main">
                            <div class="record-item__title">
                              <span>{{ record.stageName || stage.stageName || '-' }}</span>
                              <NTag :bordered="false" :type="record.status === 'reviewed' ? 'success' : 'warning'">
                                {{ paperStatusDict.getLabel(record.status) || '-' }}
                              </NTag>
                              <NTag :bordered="false" :type="getPaperPassType(record)">
                                {{ getRecordResultText(record) }}
                              </NTag>
                            </div>

                            <div class="record-item__meta">
                              <span>考核时间：{{ record.createdAt || '-' }}</span>
                              <span>批阅时间：{{ record.reviewedAt || '-' }}</span>
                              <span>得分：{{ record.score ?? '-' }}</span>
                              <span>答对：{{ record.questionTotal == null ? '-' : `${record.correctTotal ?? 0} / ${record.questionTotal ?? 0}` }}</span>
                            </div>

                            <div class="record-item__comment">评语：{{ record.finalComment || '-' }}</div>
                          </div>

                          <div class="record-item__actions">
                            <NButton size="small" quaternary type="primary" @click="handleViewPaper(record)">查看记录</NButton>
                          </div>
                        </div>
                      </div>

                      <NEmpty v-else description="当前阶段暂无考核记录" />
                    </div>
                  </div>
                </div>
              </div>

              <NEmpty v-else description="暂无阶段信息" />
            </div>
          </template>
        </NSpin>
      </NCard>
    </template>
  </InfoPageLayout>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-header__title {
  font-size: 18px;
  font-weight: 600;
}

.detail-section + .detail-section {
  margin-top: 20px;
}

.detail-section__title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.stage-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stage-item {
  display: flex;
  gap: 14px;
}

.stage-item__rail {
  display: flex;
  width: 20px;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.stage-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgb(var(--border-color));
  background: rgb(var(--layout-bg-color));
  box-shadow:
    0 0 0 4px rgb(var(--border-color) / 18%),
    inset 0 0 0 2px rgb(var(--container-bg-color)),
    0 6px 16px rgb(15 23 42 / 10%);
}

.stage-dot.is-success {
  border-color: rgb(82 196 26 / 34%);
  background: rgb(82 196 26);
  box-shadow:
    0 0 0 4px rgb(82 196 26 / 18%),
    inset 0 0 0 2px rgb(var(--container-bg-color)),
    0 6px 16px rgb(15 23 42 / 10%);
}

.stage-dot.is-warning {
  border-color: rgb(250 173 20 / 34%);
  background: rgb(250 173 20);
  box-shadow:
    0 0 0 4px rgb(250 173 20 / 18%),
    inset 0 0 0 2px rgb(var(--container-bg-color)),
    0 6px 16px rgb(15 23 42 / 10%);
}

.stage-dot.is-error {
  border-color: rgb(245 34 45 / 34%);
  background: rgb(245 34 45);
  box-shadow:
    0 0 0 4px rgb(245 34 45 / 18%),
    inset 0 0 0 2px rgb(var(--container-bg-color)),
    0 6px 16px rgb(15 23 42 / 10%);
}

.stage-dot.is-info {
  border-color: rgb(32 128 240 / 34%);
  background: rgb(32 128 240);
  box-shadow:
    0 0 0 4px rgb(32 128 240 / 18%),
    inset 0 0 0 2px rgb(var(--container-bg-color)),
    0 6px 16px rgb(15 23 42 / 10%);
}

.stage-line {
  width: 2px;
  flex: 1;
  margin-top: 6px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgb(var(--border-color)) 0%, rgb(var(--border-color) / 38%) 100%);
}

.stage-item__body {
  flex: 1;
  min-width: 0;
  padding: 16px;
  border-radius: 14px;
  background: rgb(var(--container-bg-color));
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(31 35 41 / 4%);
}

html.dark .stage-item__body {
  box-shadow:
    inset 0 0 0 1px rgb(var(--border-color)),
    0 1px 2px rgb(0 0 0 / 18%);
}

.stage-item__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.stage-item__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.stage-item__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
  color: var(--n-text-color-3);
  font-size: 13px;
}

.stage-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stage-summary__item {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 85%);
  color: var(--n-text-color-2);
}

.record-list__title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
}

.record-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgb(var(--layout-bg-color));
  box-shadow: inset 0 0 0 1px rgb(var(--border-color) / 85%);
}

.record-item__main {
  flex: 1;
  min-width: 0;
}

.record-item__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
}

.record-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--n-text-color-3);
  font-size: 13px;
}

.record-item__comment {
  margin-top: 8px;
  color: var(--n-text-color-2);
  word-break: break-all;
}

.record-item__actions {
  flex-shrink: 0;
}

@media (width <= 960px) {
  .stage-item__header,
  .record-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .stage-item__meta {
    justify-content: flex-start;
  }

  .stage-summary {
    grid-template-columns: 1fr;
  }
}
</style>
