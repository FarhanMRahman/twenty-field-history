import { isFieldHistoryAvailable } from '@/activities/timeline-activities/utils/isFieldHistoryAvailable';
import { FieldMetadataType, RelationType } from 'twenty-shared/types';

describe('isFieldHistoryAvailable', () => {
  it('is available for regular tracked fields', () => {
    expect(
      isFieldHistoryAvailable({
        fieldType: FieldMetadataType.TEXT,
        fieldName: 'jobTitle',
      }),
    ).toBe(true);
  });

  it('is available for many-to-one relations only', () => {
    expect(
      isFieldHistoryAvailable({
        fieldType: FieldMetadataType.RELATION,
        fieldName: 'company',
        relationType: RelationType.MANY_TO_ONE,
      }),
    ).toBe(true);

    expect(
      isFieldHistoryAvailable({
        fieldType: FieldMetadataType.RELATION,
        fieldName: 'people',
        relationType: RelationType.ONE_TO_MANY,
      }),
    ).toBe(false);
  });

  it('is unavailable for fields the server never diffs', () => {
    expect(
      isFieldHistoryAvailable({
        fieldType: FieldMetadataType.POSITION,
        fieldName: 'position',
      }),
    ).toBe(false);

    expect(
      isFieldHistoryAvailable({
        fieldType: FieldMetadataType.DATE_TIME,
        fieldName: 'updatedAt',
      }),
    ).toBe(false);
  });
});
