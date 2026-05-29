export const STATUS_MAP = {
  pending: { label: '待处理', tagType: 'warning' },
  approved: { label: '已审批', tagType: 'success' },
  completed: { label: '已完成', tagType: '' },
  rejected: { label: '已驳回', tagType: 'danger' },
}

export const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([value, { label }]) => ({ label, value }))
