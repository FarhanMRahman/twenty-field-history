import { isObject } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

const isScalarValueEmpty = (value: unknown): boolean =>
  !isDefined(value) || value === '';

// Not isFieldValueEmpty: diff values are raw stored JSON, not typed field values.
export const isFieldDiffValueEmpty = (value: unknown): boolean =>
  isScalarValueEmpty(value) ||
  (isObject(value) && Object.values(value).every(isScalarValueEmpty));
