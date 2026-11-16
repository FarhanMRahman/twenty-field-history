import { type TimelineActivity } from '@/activities/timeline-activities/types/TimelineActivity';
import { type TimelineActivityTypeMaps } from '@/activities/timeline-activities/types/TimelineActivityTypeMaps';
import { findFieldMetadataItemByDiffKey } from '@/activities/timeline-activities/utils/findFieldMetadataItemByDiffKey';
import { getTimelineActivityAction } from '@/activities/timeline-activities/utils/getTimelineActivityAction';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { isDefined } from 'twenty-shared/utils';

export type RecordFieldChange = {
  timelineActivity: TimelineActivity;
  diffKey: string;
  fieldDiff: { before: unknown; after: unknown };
};

export const extractFieldChangesFromTimelineActivities = ({
  timelineActivities,
  timelineActivityTypeMaps,
  objectFieldMetadataItems,
  fieldMetadataId,
}: {
  timelineActivities: TimelineActivity[];
  timelineActivityTypeMaps: TimelineActivityTypeMaps;
  objectFieldMetadataItems: FieldMetadataItem[];
  fieldMetadataId: string;
}): RecordFieldChange[] =>
  timelineActivities.flatMap((timelineActivity) => {
    // Linked activities (e.g. a note updated) carry the linked record's diff, not this record's.
    if (isDefined(timelineActivity.linkedRecordId)) {
      return [];
    }

    if (
      getTimelineActivityAction(timelineActivity, timelineActivityTypeMaps) !==
      'updated'
    ) {
      return [];
    }

    const diff = timelineActivity.properties?.diff ?? {};

    const diffKey = Object.keys(diff).find(
      (key) =>
        findFieldMetadataItemByDiffKey(objectFieldMetadataItems, key)?.id ===
        fieldMetadataId,
    );

    if (!isDefined(diffKey)) {
      return [];
    }

    return [{ timelineActivity, diffKey, fieldDiff: diff[diffKey] }];
  });
