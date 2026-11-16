import { isNonEmptyArray, isPlainObject } from 'twenty-shared/utils';

export const computeTimelineActivityChangedFieldNames = (
  properties: unknown,
): string[] | null => {
  if (!isPlainObject(properties) || !isPlainObject(properties.diff)) {
    return null;
  }

  const changedFieldNames = Object.keys(properties.diff);

  return isNonEmptyArray(changedFieldNames) ? changedFieldNames : null;
};
