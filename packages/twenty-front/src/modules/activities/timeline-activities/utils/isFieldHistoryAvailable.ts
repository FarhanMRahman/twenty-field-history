import { FieldMetadataType, RelationType } from 'twenty-shared/types';

// Mirrors what objectRecordChangedValues diffs server-side; other fields never appear in history.
const FIELD_TYPES_WITHOUT_HISTORY = new Set<FieldMetadataType>([
  FieldMetadataType.POSITION,
  FieldMetadataType.TS_VECTOR,
  FieldMetadataType.MORPH_RELATION,
]);

const FIELD_NAMES_WITHOUT_HISTORY = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'searchVector',
]);

export const isFieldHistoryAvailable = ({
  fieldType,
  fieldName,
  relationType,
}: {
  fieldType: FieldMetadataType;
  fieldName: string;
  relationType?: RelationType;
}): boolean => {
  if (
    FIELD_TYPES_WITHOUT_HISTORY.has(fieldType) ||
    FIELD_NAMES_WITHOUT_HISTORY.has(fieldName)
  ) {
    return false;
  }

  if (fieldType === FieldMetadataType.RELATION) {
    return relationType === RelationType.MANY_TO_ONE;
  }

  return true;
};
