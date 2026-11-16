import { type TimelineActivity } from '@/activities/timeline-activities/types/TimelineActivity';
import { type TimelineActivityTypeMaps } from '@/activities/timeline-activities/types/TimelineActivityTypeMaps';
import { extractFieldChangesFromTimelineActivities } from '@/activities/timeline-activities/utils/extractFieldChangesFromTimelineActivities';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { FieldMetadataType } from 'twenty-shared/types';

const UPDATED_TYPE_ID = 'updated-type-id';
const CREATED_TYPE_ID = 'created-type-id';

const buildType = (id: string, action: 'updated' | 'created') => ({
  id,
  universalIdentifier: id,
  name: id,
  label: action,
  action,
  icon: null,
  objectUniversalIdentifier: null,
  frontComponentUniversalIdentifier: null,
});

const timelineActivityTypeMaps: TimelineActivityTypeMaps = {
  byId: new Map([
    [UPDATED_TYPE_ID, buildType(UPDATED_TYPE_ID, 'updated')],
    [CREATED_TYPE_ID, buildType(CREATED_TYPE_ID, 'created')],
  ]),
  byUniversalIdentifier: new Map(),
};

const buildField = (
  id: string,
  name: string,
  type: FieldMetadataType,
): FieldMetadataItem => ({
  id,
  universalIdentifier: id,
  name,
  label: name,
  type,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
});

const JOB_TITLE_FIELD = buildField(
  'job-title-id',
  'jobTitle',
  FieldMetadataType.TEXT,
);
const COMPANY_FIELD = buildField(
  'company-id',
  'company',
  FieldMetadataType.RELATION,
);
const CITY_FIELD = buildField('city-id', 'city', FieldMetadataType.TEXT);

const OBJECT_FIELDS = [JOB_TITLE_FIELD, COMPANY_FIELD, CITY_FIELD];

const buildActivity = (
  overrides: Partial<TimelineActivity>,
): TimelineActivity =>
  ({
    id: 'activity-id',
    happensAt: '2024-01-01T00:00:00.000Z',
    timelineActivityTypeId: UPDATED_TYPE_ID,
    timelineActivityTypeSnapshot: null,
    linkedRecordId: null,
    linkedObjectMetadataId: null,
    properties: {},
    ...overrides,
  }) as TimelineActivity;

describe('extractFieldChangesFromTimelineActivities', () => {
  it('keeps only updates that touch the requested field', () => {
    const fieldChanges = extractFieldChangesFromTimelineActivities({
      timelineActivities: [
        buildActivity({
          id: 'a1',
          properties: {
            diff: {
              jobTitle: { before: 'Engineer', after: 'CTO' },
              city: { before: 'Paris', after: 'Lyon' },
            },
          },
        }),
        buildActivity({
          id: 'a2',
          properties: { diff: { city: { before: 'Lyon', after: 'Nice' } } },
        }),
      ],
      timelineActivityTypeMaps,
      objectFieldMetadataItems: OBJECT_FIELDS,
      fieldMetadataId: JOB_TITLE_FIELD.id,
    });

    expect(fieldChanges).toHaveLength(1);
    expect(fieldChanges[0].timelineActivity.id).toBe('a1');
    expect(fieldChanges[0].fieldDiff).toEqual({
      before: 'Engineer',
      after: 'CTO',
    });
  });

  it('matches relation fields through their join column diff key', () => {
    const fieldChanges = extractFieldChangesFromTimelineActivities({
      timelineActivities: [
        buildActivity({
          properties: {
            diff: { companyId: { before: { id: 'c1' }, after: { id: 'c2' } } },
          },
        }),
      ],
      timelineActivityTypeMaps,
      objectFieldMetadataItems: OBJECT_FIELDS,
      fieldMetadataId: COMPANY_FIELD.id,
    });

    expect(fieldChanges).toHaveLength(1);
    expect(fieldChanges[0].diffKey).toBe('companyId');
  });

  it('ignores non-update activities and linked-record activities', () => {
    const diff = { jobTitle: { before: 'A', after: 'B' } };

    const fieldChanges = extractFieldChangesFromTimelineActivities({
      timelineActivities: [
        buildActivity({
          timelineActivityTypeId: CREATED_TYPE_ID,
          properties: { diff },
        }),
        buildActivity({
          linkedRecordId: 'note-id',
          linkedObjectMetadataId: 'note-object-id',
          properties: { diff },
        }),
      ],
      timelineActivityTypeMaps,
      objectFieldMetadataItems: OBJECT_FIELDS,
      fieldMetadataId: JOB_TITLE_FIELD.id,
    });

    expect(fieldChanges).toEqual([]);
  });
});
