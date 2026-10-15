import { Command } from 'commander';
import {
  validateContentFile,
  type ContentValidationOptions,
} from '../content-files';
import { exportContentApkg, type ContentExportOptions } from '../content-apkg';

export { validateContentFile };

function fail(error: unknown, json?: boolean) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    json ? JSON.stringify({ valid: false, error: message }) : message
  );
  process.exitCode = 1;
}

export function createContentCommand(): Command {
  const command = new Command('content').description(
    'Validate and export reusable lesson content offline'
  );
  command
    .command('validate')
    .description(
      'Check a lesson manifest and the integrity of its local audio assets'
    )
    .argument('<file>', 'Path to a content.json manifest')
    .option(
      '--public',
      'Require public declarations for the package and every asset'
    )
    .option('--json', 'Write a JSON summary; failures are JSON on stderr')
    .action((filePath: string, options: ContentValidationOptions) => {
      try {
        const summary = validateContentFile(filePath, options);
        if (options.json) {
          console.log(JSON.stringify(summary, null, 2));
        } else {
          console.log(
            `Valid content: ${summary.packageId} (revision ${summary.revision})`
          );
          console.log(
            `${summary.itemCount} items, ${summary.activityCount} activities, ${summary.assetCount} verified audio assets`
          );
          if (summary.checkedForPublication) {
            console.log(
              'Public declarations checked. No files were published.'
            );
          }
        }
      } catch (error) {
        fail(error, options.json);
      }
    });
  command
    .command('export')
    .description('Generate a standalone Anki deck package from a lesson')
    .argument('<file>', 'Path to a content.json manifest')
    .argument('<output>', 'Output deck filename ending in .apkg')
    .requiredOption(
      '--modified-at <utc>',
      'Stable release modification time, YYYY-MM-DDTHH:mm:ssZ'
    )
    .option('--deck <name>', 'Deck name (default: Ankiniki::<packageId>)')
    .option(
      '--public',
      'Require public declarations for the package and every asset'
    )
    .option('--force', 'Replace an existing output file')
    .option('--json', 'Write a JSON summary; failures are JSON on stderr')
    .action(
      async (
        filePath: string,
        output: string,
        options: ContentExportOptions
      ) => {
        try {
          const summary = await exportContentApkg(filePath, output, options);
          console.log(
            options.json
              ? JSON.stringify(summary, null, 2)
              : `Exported ${summary.noteCount} notes and ${summary.mediaCount} audio files to ${summary.outputPath}`
          );
        } catch (error) {
          fail(error, options.json);
        }
      }
    );
  return command;
}
