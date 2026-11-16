import { computeTimelineActivityChangedFieldNames } from 'src/modules/timeline/utils/compute-timeline-activity-changed-field-names.util';

describe('computeTimelineActivityChangedFieldNames', () => {
  it('should return the diff keys', () => {
    expect(
      computeTimelineActivityChangedFieldNames({
        diff: {
          name: { before: 'Old', after: 'New' },
          companyId: { before: null, after: 'company-id' },
        },
      }),
    ).toEqual(['name', 'companyId']);
  });

  it.each([
    ['an empty diff', { diff: {} }],
    ['no diff', {}],
    ['a non-object diff', { diff: 'invalid' }],
    ['non-object properties', null],
  ])('should return null for %s', (_label, properties) => {
    expect(computeTimelineActivityChangedFieldNames(properties)).toBeNull();
  });
});
