export function normalizeAssessmentReviewResult(value?: string | null) {
  const normalized = String(value || '').trim().toUpperCase();
  if (!normalized) return '';
  if (normalized === 'CORRECT' || normalized === 'WRONG' || normalized === 'PARTIAL') {
    return normalized;
  }
  return '';
}

export function getAssessmentReviewResultLabel(value?: string | null) {
  const normalized = normalizeAssessmentReviewResult(value);
  if (normalized === 'CORRECT') return '正确';
  if (normalized === 'WRONG') return '错误';
  if (normalized === 'PARTIAL') return '部分正确';
  return '未批阅';
}

export function resolveAssessmentPassResult(status?: string | null, passFlag?: boolean | null) {
  if (status === 'pending_review') return 'pending_review';
  if (passFlag === true) return 'passed';
  if (passFlag === false) return 'failed';
  return 'pending';
}

export function getAssessmentPassResultLabel(status?: string | null, passFlag?: boolean | null) {
  const value = resolveAssessmentPassResult(status, passFlag);
  if (value === 'pending_review') return '待批阅';
  if (value === 'passed') return '通过';
  if (value === 'failed') return '未通过';
  return '待判定';
}

export function resolveAssessmentDailyReportStatus(status?: string | null, holidayFlag?: boolean | null) {
  if (status === 'submitted') return 'submitted';
  if (status === 'pending') return 'pending';
  if (status === 'upcoming') return 'upcoming';
  if (status === 'holiday' || holidayFlag) return 'holiday';
  return 'none';
}

export function getAssessmentDailyReportStatusLabel(status?: string | null, holidayFlag?: boolean | null) {
  const value = resolveAssessmentDailyReportStatus(status, holidayFlag);
  if (value === 'submitted') return '已提交';
  if (value === 'pending') return '未提交';
  if (value === 'upcoming') return '待提交';
  if (value === 'holiday') return '休息日';
  return '空白';
}
