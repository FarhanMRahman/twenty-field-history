import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { viewableFieldHistoryState } from '@/side-panel/pages/field-history/states/viewableFieldHistoryState';
import { t } from '@lingui/core/macro';
import { useStore } from 'jotai';
import { useCallback } from 'react';
import { SidePanelPages } from 'twenty-shared/types';
import { IconHistory } from 'twenty-ui/icon';

export const useOpenFieldHistoryInSidePanel = () => {
  const { navigateSidePanelMenu, openSidePanelMenu } = useSidePanelMenu();

  const store = useStore();

  const openFieldHistoryInSidePanel = useCallback(
    ({
      recordId,
      objectNameSingular,
      fieldMetadataId,
      fieldLabel,
    }: {
      recordId: string;
      objectNameSingular: string;
      fieldMetadataId: string;
      fieldLabel: string;
    }) => {
      store.set(viewableFieldHistoryState.atom, {
        recordId,
        objectNameSingular,
        fieldMetadataId,
      });

      openSidePanelMenu();
      navigateSidePanelMenu({
        page: SidePanelPages.ViewFieldHistory,
        pageTitle: t`${fieldLabel} history`,
        pageIcon: IconHistory,
      });
    },
    [navigateSidePanelMenu, openSidePanelMenu, store],
  );

  return { openFieldHistoryInSidePanel };
};
