import { z } from 'zod';

export const CONTENT_FORMAT = 'ankiniki-content';
export const CONTENT_FORMAT_VERSION = 1;

const identity = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/);
const text = z.string().refine(value => value.trim().length > 0, {
  message: 'Text must contain a non-whitespace character',
});
const visibility = z.enum(['public', 'private']);

/** Relative paths usable as files on Windows/Unix and as browser asset paths. */
export function isPortableContentPath(value: string): boolean {
  if (
    [...value].some(
      char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127
    )
  ) {
    return false;
  }
  return value
    .split('/')
    .every(
      segment =>
        segment.length > 0 &&
        segment !== '.' &&
        segment !== '..' &&
        !/[<>:"\\|?*#%]/.test(segment) &&
        !/[. ]$/.test(segment) &&
        !/^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(segment)
    );
}

interface PublicationDeclaration {
  visibility: 'public' | 'private';
  license?: string;
}

function checkDeclaration(value: PublicationDeclaration, ctx: z.RefinementCtx) {
  if (value.visibility === 'public' && !value.license) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['license'],
      message: 'Public content requires an explicit license declaration',
    });
  }
}

export const ContentAssetSchema = z
  .object({
    assetId: identity,
    kind: z.literal('audio'),
    path: z
      .string()
      .refine(isPortableContentPath, 'Expected a portable relative asset path'),
    mediaType: z.enum(['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg']),
    byteLength: z.number().int().safe().positive(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    visibility,
    license: text.optional(),
  })
  .strict()
  .superRefine(checkDeclaration);

export const ContentActivitySchema = z.discriminatedUnion('kind', [
  z.object({ activityId: identity, kind: z.literal('recall') }).strict(),
  z
    .object({
      activityId: identity,
      kind: z.literal('audio-response'),
      promptAudioId: identity,
      answerAudioId: identity.optional(),
      responseSeconds: z.number().finite().nonnegative(),
    })
    .strict(),
]);

export const ContentItemSchema = z
  .object({
    itemId: identity,
    prompt: text,
    answer: text,
    explanation: text.optional(),
    sourceUrl: z
      .string()
      .url()
      .regex(/^https?:\/\//i)
      .optional(),
    activities: z.array(ContentActivitySchema).min(1),
  })
  .strict();

export const ContentPackageSchema = z
  .object({
    format: z.literal(CONTENT_FORMAT),
    formatVersion: z.literal(CONTENT_FORMAT_VERSION),
    packageId: identity,
    revision: z.number().int().safe().positive(),
    title: text,
    visibility,
    license: text.optional(),
    items: z.array(ContentItemSchema).min(1),
    assets: z.array(ContentAssetSchema),
  })
  .strict()
  .superRefine((content, ctx) => {
    checkDeclaration(content, ctx);
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    const assetIds = new Set<string>();
    const assetPaths = new Set<string>();
    content.assets.forEach((asset, index) => {
      if (assetIds.has(asset.assetId)) {
        issue(['assets', index, 'assetId'], 'Duplicate asset ID');
      }
      assetIds.add(asset.assetId);
      const portablePath = asset.path.toLowerCase();
      if (assetPaths.has(portablePath)) {
        issue(
          ['assets', index, 'path'],
          'Asset paths must be unique, including case'
        );
      }
      assetPaths.add(portablePath);
    });
    const itemIds = new Set<string>();
    content.items.forEach((item, itemIndex) => {
      if (itemIds.has(item.itemId)) {
        issue(['items', itemIndex, 'itemId'], 'Duplicate item ID');
      }
      itemIds.add(item.itemId);
      const activityIds = new Set<string>();
      item.activities.forEach((activity, activityIndex) => {
        const activityPath = ['items', itemIndex, 'activities', activityIndex];
        if (activityIds.has(activity.activityId)) {
          issue(
            [...activityPath, 'activityId'],
            'Duplicate activity ID within item'
          );
        }
        activityIds.add(activity.activityId);
        if (activity.kind === 'audio-response') {
          for (const field of ['promptAudioId', 'answerAudioId'] as const) {
            const assetId = activity[field];
            if (assetId !== undefined && !assetIds.has(assetId)) {
              issue(
                [...activityPath, field],
                `Unknown audio asset: ${assetId}`
              );
            }
          }
        }
      });
    });
  });

export type ContentPackage = z.infer<typeof ContentPackageSchema>;
export type ContentItem = z.infer<typeof ContentItemSchema>;
export type ContentActivity = z.infer<typeof ContentActivitySchema>;

/** Stable across revisions and wording changes; not an Anki GUID or note ID. */
export function contentActivityKey(
  packageId: string,
  itemId: string,
  activityId: string
): string {
  return [packageId, itemId, activityId]
    .map(value => identity.parse(value))
    .join('/');
}

/** Checks declarations only. It does not establish rights or publish files. */
export function assertPublicContent(content: ContentPackage): void {
  if (content.visibility !== 'public' || !content.license) {
    throw new Error(
      'Package must be explicitly public with a license declaration'
    );
  }
  for (const asset of content.assets) {
    if (asset.visibility !== 'public' || !asset.license) {
      throw new Error(
        `Asset ${asset.assetId} must be explicitly public with a license declaration`
      );
    }
  }
}
