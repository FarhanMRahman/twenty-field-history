import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';
import { type DataSource } from 'typeorm';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { getStandardFlatEntitiesToCreateOrThrow } from 'src/database/commands/upgrade-version-command/2-10/utils/get-standard-flat-entities-to-create-or-throw.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationBuilderException } from 'src/engine/workspace-manager/workspace-migration/exceptions/workspace-migration-builder-exception';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { getWorkspaceSchemaContextForMigration } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/utils/get-workspace-schema-context-for-migration.util';

const TIMELINE_ACTIVITY = STANDARD_OBJECTS.timelineActivity;
const BACKFILL_BATCH_SIZE = 5000;

@RegisteredWorkspaceCommand('2.60.0', 1794848929000)
@Command({
  name: 'upgrade:2-60:add-timeline-activity-changed-field-names',
  description:
    'Add the timelineActivity changedFieldNames field and its GIN index, then backfill it from each activity diff. Idempotent.',
})
export class AddTimelineActivityChangedFieldNamesCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const { flatObjectMetadataMaps, flatFieldMetadataMaps, flatIndexMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
        'flatIndexMaps',
      ]);

    const timelineActivityFlatObjectMetadata =
      flatObjectMetadataMaps.byUniversalIdentifier[
        TIMELINE_ACTIVITY.universalIdentifier
      ];

    if (!isDefined(timelineActivityFlatObjectMetadata)) {
      return;
    }

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );
    const { allFlatEntityMaps: standardAllFlatEntityMaps } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now: new Date().toISOString(),
        workspaceId,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });
    const fieldsToCreate =
      getStandardFlatEntitiesToCreateOrThrow<FlatFieldMetadata>({
        standardFlatEntityMaps: standardAllFlatEntityMaps.flatFieldMetadataMaps,
        existingFlatEntityMaps: flatFieldMetadataMaps,
        universalIdentifiers: [
          TIMELINE_ACTIVITY.fields.changedFieldNames.universalIdentifier,
        ],
      });
    const indexesToCreate =
      getStandardFlatEntitiesToCreateOrThrow<FlatIndexMetadata>({
        standardFlatEntityMaps: standardAllFlatEntityMaps.flatIndexMaps,
        existingFlatEntityMaps: flatIndexMaps,
        universalIdentifiers: [
          TIMELINE_ACTIVITY.indexes.changedFieldNamesIndex.universalIdentifier,
        ],
      });

    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Would create ${fieldsToCreate.length} field(s) and ${indexesToCreate.length} index(es), then backfill timelineActivity changedFieldNames for workspace ${workspaceId}`,
      );

      return;
    }

    if (fieldsToCreate.length > 0 || indexesToCreate.length > 0) {
      const result =
        await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
          {
            shouldDeferActions: false,
            allFlatEntityOperationByMetadataName: {
              fieldMetadata: {
                flatEntityToCreate: fieldsToCreate,
                flatEntityToDelete: [],
                flatEntityToUpdate: [],
              },
              index: {
                flatEntityToCreate: indexesToCreate,
                flatEntityToDelete: [],
                flatEntityToUpdate: [],
              },
            },
            workspaceId,
            isSystemBuild: true,
            applicationUniversalIdentifier:
              twentyStandardFlatApplication.universalIdentifier,
          },
        );

      if (result.status === 'fail') {
        throw new WorkspaceMigrationBuilderException(
          result,
          `Failed to add changedFieldNames to timelineActivity for workspace ${workspaceId}`,
        );
      }
    }

    if (!isDefined(dataSource)) {
      this.logger.error(
        `Cannot backfill timelineActivity changedFieldNames for workspace ${workspaceId}: no data source. Rerun once the workspace is reachable.`,
      );

      return;
    }

    await this.backfillChangedFieldNames({
      workspaceId,
      dataSource,
      timelineActivityFlatObjectMetadata,
    });
  }

  private async backfillChangedFieldNames({
    workspaceId,
    dataSource,
    timelineActivityFlatObjectMetadata,
  }: {
    workspaceId: string;
    dataSource: DataSource;
    timelineActivityFlatObjectMetadata: FlatObjectMetadata;
  }): Promise<void> {
    const { schemaName, tableName } = getWorkspaceSchemaContextForMigration({
      workspaceId,
      objectMetadata: timelineActivityFlatObjectMetadata,
    });

    let backfilledRowCount = 0;
    let lastBatchRowCount = 0;

    // Only rows with a non-empty diff qualify, so every batch writes a non-null
    // value and an interrupted run resumes where it stopped.
    do {
      const result = await dataSource.query(
        `UPDATE "${schemaName}"."${tableName}" AS "timelineActivity"
         SET "changedFieldNames" = ARRAY(SELECT jsonb_object_keys("timelineActivity"."properties"->'diff'))
         WHERE "timelineActivity"."id" IN (
           SELECT "id" FROM "${schemaName}"."${tableName}"
           WHERE "changedFieldNames" IS NULL
             AND jsonb_typeof("properties"->'diff') = 'object'
             AND "properties"->'diff' <> '{}'::jsonb
           LIMIT $1
         )`,
        [BACKFILL_BATCH_SIZE],
      );

      lastBatchRowCount = result?.[1] ?? 0;
      backfilledRowCount += lastBatchRowCount;
    } while (lastBatchRowCount === BACKFILL_BATCH_SIZE);

    this.logger.log(
      `Backfilled changedFieldNames on ${backfilledRowCount} timelineActivity rows for workspace ${workspaceId}`,
    );
  }
}
