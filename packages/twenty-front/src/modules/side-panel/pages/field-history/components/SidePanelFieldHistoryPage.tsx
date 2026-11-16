import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';

import { CustomResolverFetchMoreLoader } from '@/activities/components/CustomResolverFetchMoreLoader';
import { SkeletonLoader } from '@/activities/components/SkeletonLoader';
import { TimelineActivityContext } from '@/activities/timeline-activities/contexts/TimelineActivityContext';
import { useRecordFieldHistory } from '@/activities/timeline-activities/hooks/useRecordFieldHistory';
import { EventRowDate } from '@/activities/timeline-activities/rows/components/EventRowDate';
import { EventRowItem } from '@/activities/timeline-activities/rows/components/EventRowItem';
import { EventFieldDiffContainer } from '@/activities/timeline-activities/rows/main-object/components/EventFieldDiffContainer';
import { getTimelineActivityAuthorFullName } from '@/activities/timeline-activities/utils/getTimelineActivityAuthorFullName';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { viewableFieldHistoryState } from '@/side-panel/pages/field-history/states/viewableFieldHistoryState';
import { AnimatedPlaceholder } from '@/ui/feedback/empty-state/components/AnimatedPlaceholder/AnimatedPlaceholder';
import { EmptyState } from '@/ui/feedback/empty-state/components/EmptyState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
  width: 100%;
`;

const StyledChangeRow = styled.div`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledChangeHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  justify-content: space-between;
`;

const StyledPlaceholderWrapper = styled.div`
  > * {
    height: auto;
    padding-top: ${themeCssVariables.spacing[8]};
  }
`;

export const SidePanelFieldHistoryPage = () => {
  const { t } = useLingui();
  const { recordId, objectNameSingular, fieldMetadataId } = useAtomStateValue(
    viewableFieldHistoryState,
  );
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);

  const {
    objectMetadataItem,
    fieldChanges,
    firstQueryLoading,
    loadingMore,
    fetchMoreRecords,
  } = useRecordFieldHistory({
    recordId,
    objectNameSingular,
    fieldMetadataId,
  });

  if (firstQueryLoading) {
    return <SkeletonLoader withSubSections />;
  }

  if (!isDefined(currentWorkspaceMember)) {
    return null;
  }

  return (
    <TimelineActivityContext.Provider value={{ recordId }}>
      <StyledContainer>
        {fieldChanges.length === 0 && !loadingMore && (
          <StyledPlaceholderWrapper>
            <EmptyState.Root>
              <AnimatedPlaceholder type="emptyTimeline" />
              <EmptyState.Content>
                <EmptyState.Title>{t`No changes recorded`}</EmptyState.Title>
                <EmptyState.Description>
                  {t`Changes to this field will appear here.`}
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          </StyledPlaceholderWrapper>
        )}
        {fieldChanges.map(({ timelineActivity, diffKey, fieldDiff }) => (
          <StyledChangeRow key={timelineActivity.id}>
            <StyledChangeHeader>
              <EventRowItem>
                {getTimelineActivityAuthorFullName(
                  timelineActivity,
                  currentWorkspaceMember,
                )}
              </EventRowItem>
              <EventRowDate happensAt={timelineActivity.happensAt} />
            </StyledChangeHeader>
            <EventFieldDiffContainer
              mainObjectMetadataItem={objectMetadataItem}
              diffKey={diffKey}
              fieldDiff={fieldDiff}
              eventId={`field-history-${timelineActivity.id}`}
              showBeforeValue
              hideLabel
            />
          </StyledChangeRow>
        ))}
        {/* Filtering is client-side, so keep paging until the sentinel leaves the viewport. */}
        <CustomResolverFetchMoreLoader
          loading={loadingMore}
          onLastRowVisible={fetchMoreRecords}
        />
      </StyledContainer>
    </TimelineActivityContext.Provider>
  );
};
