import { styled } from '@linaria/react';

import { EventFieldDiffLabel } from '@/activities/timeline-activities/rows/main-object/components/EventFieldDiffLabel';
import { EventFieldDiffSideValue } from '@/activities/timeline-activities/rows/main-object/components/EventFieldDiffSideValue';
import { EventRelationFieldDiffValues } from '@/activities/timeline-activities/rows/main-object/components/EventRelationFieldDiffValues';
import { isRelationFieldChangeValue } from '@/activities/timeline-activities/utils/relationFieldChangeValue';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { FieldMetadataType } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme';
import { doNotTranslate } from 'twenty-shared/i18n';

type EventFieldDiffProps = {
  fieldDiff: { before: unknown; after: unknown };
  mainObjectMetadataItem: EnrichedObjectMetadataItem;
  fieldMetadataItem: FieldMetadataItem | undefined;
  diffArtificialRecordStoreId: string;
  showBeforeValue?: boolean;
  hideLabel?: boolean;
};

const StyledEventFieldDiffContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${themeCssVariables.spacing[1]};
  height: 24px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledArrowContainer = styled.span`
  color: ${themeCssVariables.font.color.secondary};
`;

const StyledBeforeValueContainer = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  min-width: 0;
  overflow: hidden;
`;

export const EventFieldDiff = ({
  fieldDiff,
  mainObjectMetadataItem,
  fieldMetadataItem,
  diffArtificialRecordStoreId,
  showBeforeValue = false,
  hideLabel = false,
}: EventFieldDiffProps) => {
  if (!fieldMetadataItem) {
    throw new Error(doNotTranslate('fieldMetadataItem is required'));
  }

  const isRelationFieldDiff =
    fieldMetadataItem.type === FieldMetadataType.RELATION &&
    (isRelationFieldChangeValue(fieldDiff.before) ||
      isRelationFieldChangeValue(fieldDiff.after));

  const label = hideLabel ? null : (
    <>
      <EventFieldDiffLabel fieldMetadataItem={fieldMetadataItem} />
      <StyledArrowContainer>→</StyledArrowContainer>
    </>
  );

  if (isRelationFieldDiff) {
    return (
      <StyledEventFieldDiffContainer>
        {label}
        <EventRelationFieldDiffValues
          fieldDiff={fieldDiff}
          fieldMetadataItem={fieldMetadataItem}
          showBeforeValue={showBeforeValue}
        />
      </StyledEventFieldDiffContainer>
    );
  }

  return (
    <StyledEventFieldDiffContainer>
      {label}
      {showBeforeValue && (
        <>
          <StyledBeforeValueContainer>
            <EventFieldDiffSideValue
              value={fieldDiff.before}
              diffArtificialRecordStoreId={`${diffArtificialRecordStoreId}--before`}
              mainObjectMetadataItem={mainObjectMetadataItem}
              fieldMetadataItem={fieldMetadataItem}
            />
          </StyledBeforeValueContainer>
          <StyledArrowContainer>→</StyledArrowContainer>
        </>
      )}
      <EventFieldDiffSideValue
        value={fieldDiff.after}
        diffArtificialRecordStoreId={diffArtificialRecordStoreId}
        mainObjectMetadataItem={mainObjectMetadataItem}
        fieldMetadataItem={fieldMetadataItem}
      />
    </StyledEventFieldDiffContainer>
  );
};
