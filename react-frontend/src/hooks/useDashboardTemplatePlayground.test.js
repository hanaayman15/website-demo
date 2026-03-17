import { describe, expect, it } from 'vitest';
import {
  dashboardTemplateReducer,
  filterDashboardRows,
  buildInitialDashboardTemplateState,
} from './useDashboardTemplatePlayground';

describe('useDashboardTemplatePlayground helpers', () => {
  it('filters rows by search term', () => {
    const rows = [
      { label: 'Team Eagles', email: 'eagles@example.com', package: '25 Players', coach: 'Ahmed', status: 'Active' },
      { label: 'Client Omar', email: 'omar@example.com', package: 'Cutting', coach: 'Nour', status: 'Pending' },
    ];
    const filtered = filterDashboardRows(rows, 'eagles');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].label).toContain('Eagles');
  });

  it('updates reducer form field', () => {
    const initial = buildInitialDashboardTemplateState();
    const updated = dashboardTemplateReducer(initial, {
      type: 'UPDATE_FORM_FIELD',
      payload: { field: 'fullName', value: 'Harness User' },
    });
    expect(updated.form.fullName).toBe('Harness User');
  });
});
