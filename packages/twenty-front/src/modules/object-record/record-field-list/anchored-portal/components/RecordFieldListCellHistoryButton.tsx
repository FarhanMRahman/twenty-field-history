import { useLingui } from '@lingui/react/macro';
import { useContext } from 'react';

import { isFieldHistoryAvailable } from '@/activities/timeline-activities/utils/isFieldHistoryAvailable';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { RecordInlineCellButton } from '@/object-record/record-inline-cell/components/RecordInlineCellEditButton';
import { useOpenFieldHistoryInSidePanel } from '@/side-panel/hooks/useOpenFieldHistoryInSidePanel';
import { StandardObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconHistory } from 'twenty-ui/icon';

export const RecordFieldListCellHistoryButton = () => {
  const { t } = useLingui();
  const { recordId, fieldDefinition } = useContext(FieldContext);
  const { openFieldHistoryInSidePanel } = useOpenFieldHistoryInSidePanel();

  const { objectMetadataItem: timelineActivityMetadata } =
    useObjectMetadataItem({
      objectNameSingular: StandardObjectNameSingular.TimelineActivity,
    });

  const objectNameSingular =
    fieldDefinition.metadata.objectMetadataNameSingular;

  const isObjectTrackedInTimeline = timelineActivityMetadata.fields.some(
    (field) =>
      isDefined(field.morphRelations) &&
      field.morphRelations.some(
        (morphRelation) =>
          morphRelation.targetObjectMetadata?.nameSingular ===
          objectNameSingular,
      ),
  );

  const relationType =
    'relationType' in fieldDefinition.metadata
      ? fieldDefinition.metadata.relationType
      : undefined;

  if (
    !isDefined(objectNameSingular) ||
    !isObjectTrackedInTimeline ||
    !isFieldHistoryAvailable({
      fieldType: fieldDefinition.type,
      fieldName: fieldDefinition.metadata.fieldName,
      relationType,
    })
  ) {
    return null;
  }

  return (
    <RecordInlineCellButton
      Icon={IconHistory}
      ariaLabel={t`View history`}
      onClick={() =>
        openFieldHistoryInSidePanel({
          recordId,
          objectNameSingular,
          fieldMetadataId: fieldDefinition.fieldMetadataId,
          fieldLabel: fieldDefinition.label,
        })
      }
    />
  );
};
