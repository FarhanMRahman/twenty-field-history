import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const viewableFieldHistoryState = createAtomState<{
  recordId: string;
  objectNameSingular: string;
  fieldMetadataId: string;
}>({
  key: 'viewableFieldHistoryState',
  defaultValue: {
    recordId: '',
    objectNameSingular: '',
    fieldMetadataId: '',
  },
});
