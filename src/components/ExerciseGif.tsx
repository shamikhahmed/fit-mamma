import { useState } from 'react';

/* Exercise animations © Gym visual (gymvisual.com), via the Exercises Library repo — shown at the
   180×180 size they are distributed at, always with the credit. Online only (not precached). */
const BASE =
  'https://cdn.jsdelivr.net/gh/plataformafitness/exercises-library@e54213fddbff4979da0af7546048b2743e4521f9/';

export function exerciseGifUrl(media: string | null | undefined, kind: 'gif' | 'thumb' = 'gif'): string | null {
  if (!media || !/^\d{4}-[A-Za-z0-9]+$/.test(media)) return null;
  return BASE + (kind === 'thumb' ? `images/${media}.jpg` : `videos/${media}.gif`);
}

export function ExerciseGif({ media, name }: { media: string | null | undefined; name: string }) {
  const [failed, setFailed] = useState(false);
  const gif = exerciseGifUrl(media);
  if (!gif || failed) return null;
  return (
    <figure className="ex-gif">
      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet={exerciseGifUrl(media, 'thumb') ?? undefined} />
        <img src={gif} width={180} height={180} alt={`How to do ${name}`} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      </picture>
      <figcaption>© Gym visual — gymvisual.com</figcaption>
    </figure>
  );
}
