import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  ContentPackageSchema,
  assertPublicContent,
  type ContentPackage,
} from '@ankiniki/shared';

interface ContentValidationOptions {
  public?: boolean;
  json?: boolean;
}

interface ContentValidationSummary {
  valid: true;
  packageId: string;
  revision: number;
  visibility: ContentPackage['visibility'];
  itemCount: number;
  activityCount: number;
  assetCount: number;
  checkedForPublication: boolean;
}

function inspectAssetFile(assetPath: string) {
  const descriptor = fs.openSync(assetPath, 'r');
  try {
    const buffer = Buffer.alloc(64 * 1024);
    const hash = createHash('sha256');
    let byteLength = 0;
    let count: number;
    while (
      (count = fs.readSync(descriptor, buffer, 0, buffer.length, null)) > 0
    ) {
      hash.update(buffer.subarray(0, count));
      byteLength += count;
    }
    return { byteLength, sha256: hash.digest('hex') };
  } finally {
    fs.closeSync(descriptor);
  }
}

export function validateContentFile(
  filePath: string,
  options: ContentValidationOptions = {}
): ContentValidationSummary {
  const manifestPath = fs.realpathSync(path.resolve(filePath));
  const root = path.dirname(manifestPath);
  const input: unknown = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const result = ContentPackageSchema.safeParse(input);
  if (!result.success) {
    throw new Error(
      `Invalid content package: ${result.error.issues
        .map(issue => `${issue.path.join('.') || 'package'}: ${issue.message}`)
        .join('; ')}`
    );
  }
  const content = result.data;
  if (options.public) {
    assertPublicContent(content);
  }
  for (const asset of content.assets) {
    const assetPath = fs.realpathSync(
      path.join(root, ...asset.path.split('/'))
    );
    const relative = path.relative(root, assetPath);
    if (
      relative === '..' ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    ) {
      throw new Error(
        `Asset ${asset.assetId} resolves outside the package directory`
      );
    }
    if (!fs.statSync(assetPath).isFile()) {
      throw new Error(`Asset ${asset.assetId} must refer to a regular file`);
    }
    const actual = inspectAssetFile(assetPath);
    if (actual.byteLength !== asset.byteLength) {
      throw new Error(
        `Asset ${asset.assetId} byte length does not match its declaration`
      );
    }
    if (actual.sha256 !== asset.sha256) {
      throw new Error(
        `Asset ${asset.assetId} SHA-256 does not match its declaration`
      );
    }
  }
  return {
    valid: true,
    packageId: content.packageId,
    revision: content.revision,
    visibility: content.visibility,
    itemCount: content.items.length,
    activityCount: content.items.reduce(
      (sum, item) => sum + item.activities.length,
      0
    ),
    assetCount: content.assets.length,
    checkedForPublication: options.public === true,
  };
}

export function createContentCommand(): Command {
  const command = new Command('content').description(
    'Validate reusable lesson content offline'
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
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          options.json
            ? JSON.stringify({ valid: false, error: message })
            : message
        );
        process.exitCode = 1;
      }
    });
  return command;
}
