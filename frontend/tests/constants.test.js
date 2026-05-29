import { describe, it, expect } from 'vitest';
import { STATUS_MAP, STATUS_OPTIONS } from '../src/constants';

describe('constants', () => {
  it('STATUS_MAP has all required statuses', () => {
    expect(STATUS_MAP.pending).toBeDefined();
    expect(STATUS_MAP.approved).toBeDefined();
    expect(STATUS_MAP.completed).toBeDefined();
    expect(STATUS_MAP.rejected).toBeDefined();
  });

  it('STATUS_MAP labels are correct', () => {
    expect(STATUS_MAP.pending.label).toBe('待处理');
    expect(STATUS_MAP.approved.label).toBe('已审批');
    expect(STATUS_MAP.completed.label).toBe('已完成');
    expect(STATUS_MAP.rejected.label).toBe('已驳回');
  });

  it('STATUS_MAP tagTypes are valid Element Plus types', () => {
    const validTypes = ['', 'success', 'warning', 'danger', 'info'];
    Object.values(STATUS_MAP).forEach(({ tagType }) => {
      expect(validTypes).toContain(tagType);
    });
  });

  it('STATUS_OPTIONS derived from STATUS_MAP', () => {
    expect(STATUS_OPTIONS.length).toBe(Object.keys(STATUS_MAP).length);
    STATUS_OPTIONS.forEach(opt => {
      expect(opt.value).toBeDefined();
      expect(opt.label).toBe(STATUS_MAP[opt.value].label);
    });
  });
});
