import { useMemo } from 'react';

import { useTimelineActivities } from '@/activities/timeline-activities/hooks/useTimelineActivities';
import { useTimelineActivityTypes } from '@/activities/timeline-activities/hooks/useTimelineActivityTypes';
import { extractFieldChangesFromTimelineActivities } from '@/activities/timeline-activities/utils/extractFieldChangesFromTimelineActivities';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';

export const useRecordFieldHistory = ({
  recordId,
  objectNameSingular,
  fieldMetadataId,
}: {
  recordId: string;
  objectNameSingular: string;
  fieldMetadataId: string;
}) => {
  const { objectMetadataItem } = useObjectMetadataItem({ objectNameSingular });

  const { timelineActivityTypeMaps } = useTimelineActivityTypes();

  const {
    timelineActivities,
    firstQueryLoading,
    loadingMore,
    fetchMoreRecords,
  } = useTimelineActivities({
    id: recordId,
    targetObjectNameSingular: objectNameSingular,
  });

  const fieldChanges = useMemo(
    () =>
      extractFieldChangesFromTimelineActivities({
        timelineActivities,
        timelineActivityTypeMaps,
        objectFieldMetadataItems: objectMetadataItem.fields,
        fieldMetadataId,
      }),
    [
      timelineActivities,
      timelineActivityTypeMaps,
      objectMetadataItem.fields,
      fieldMetadataId,
    ],
  );

  return {
    objectMetadataItem,
    fieldChanges,
    firstQueryLoading,
    loadingMore,
    fetchMoreRecords,
  };
};
