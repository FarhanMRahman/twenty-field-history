import { styled } from '@linaria/react';

import { EventFieldDiffValue } from '@/activities/timeline-activities/rows/main-object/components/EventFieldDiffValue';
import { EventFieldDiffValueEffect } from '@/activities/timeline-activities/rows/main-object/components/EventFieldDiffValueEffect';
import { isFieldDiffValueEmpty } from '@/activities/timeline-activities/utils/isFieldDiffValueEmpty';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { Trans } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme';

type EventFieldDiffSideValueProps = {
  value: unknown;
  diffArtificialRecordStoreId: string;
  mainObjectMetadataItem: EnrichedObjectMetadataItem;
  fieldMetadataItem: FieldMetadataItem;
};

const StyledEmptyValue = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

export const EventFieldDiffSideValue = ({
  value,
  diffArtificialRecordStoreId,
  mainObjectMetadataItem,
  fieldMetadataItem,
}: EventFieldDiffSideValueProps) => {
  if (isFieldDiffValueEmpty(value)) {
    return (
      <StyledEmptyValue>
        <Trans>Empty</Trans>
      </StyledEmptyValue>
    );
  }

  return (
    <>
      <EventFieldDiffValueEffect
        diffArtificialRecordStoreId={diffArtificialRecordStoreId}
        mainObjectMetadataItem={mainObjectMetadataItem}
        fieldMetadataItem={fieldMetadataItem}
        diffRecord={value as Record<string, unknown>}
      />
      <EventFieldDiffValue
        diffArtificialRecordStoreId={diffArtificialRecordStoreId}
        mainObjectMetadataItem={mainObjectMetadataItem}
        fieldMetadataItem={fieldMetadataItem}
      />
    </>
  );
};
