import { ContentPackageSchema } from '@ankiniki/shared';
import source from '../../../docs/examples/content/basic-practice/content.json';

export const lesson = ContentPackageSchema.parse(source);
export const firstItem = lesson.items[0];
