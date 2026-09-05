import type { CoursePhoto } from './types';

type Landscape =
  | 'sandstone-foothills'
  | 'rolling-front-range'
  | 'red-rock-foothills'
  | 'open-prairie-preserve'
  | 'mountain-meadow'
  | 'parkland-fairway';

// Native generated originals are 1536x1024. Never advertise an enlarged size.
export function landscape(slug: Landscape, description: string): CoursePhoto {
  const base = `/illustrations/${slug}`;
  return {
    kind: 'illustration',
    src: `${base}/960.webp`,
    srcSet: `${base}/480.webp 480w, ${base}/960.webp 960w, ${base}/1536.webp 1536w`,
    width: 1536,
    height: 1024,
    alt: `AI-generated illustration of ${description}; not an actual course photograph`,
    position: 'center 55%',
  };
}
