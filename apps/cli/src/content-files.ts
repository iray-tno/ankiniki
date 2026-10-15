import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  ContentPackageSchema,
  assertPublicContent,
  type ContentPackage,
} from '@ankiniki/shared';

export interface ContentValidationOptions {
  public?: boolean;
  json?: boolean;
}

type Asset = ContentPackage['assets'][number];

function resolveAsset(root: string, asset: Asset): string {
  const assetPath = fs.realpathSync(path.join(root, ...asset.path.split('/')));
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
  return assetPath;
}

function checkIntegrity(asset: Asset, byteLength: number, sha256: string) {
  if (byteLength !== asset.byteLength) {
    throw new Error(
      `Asset ${asset.assetId} byte length does not match its declaration`
    );
  }
  if (sha256 !== asset.sha256) {
    throw new Error(
      `Asset ${asset.assetId} SHA-256 does not match its declaration`
    );
  }
}

export function readContentAsset(root: string, asset: Asset): Buffer {
  const bytes = fs.readFileSync(resolveAsset(root, asset));
  checkIntegrity(
    asset,
    bytes.length,
    createHash('sha256').update(bytes).digest('hex')
  );
  return bytes;
}

export function loadContentFile(
  filePath: string,
  options: ContentValidationOptions = {}
) {
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
  const assetPaths = new Map<string, string>();
  for (const asset of content.assets) {
    const assetPath = resolveAsset(root, asset);
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
      checkIntegrity(asset, byteLength, hash.digest('hex'));
    } finally {
      fs.closeSync(descriptor);
    }
    assetPaths.set(asset.assetId, assetPath);
  }
  return { content, manifestPath, root, assetPaths };
}

export function validateContentFile(
  filePath: string,
  options: ContentValidationOptions = {}
) {
  const { content } = loadContentFile(filePath, options);
  return {
    valid: true as const,
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
