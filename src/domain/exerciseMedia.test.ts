import { describe, expect, it } from 'vitest';
import media from './exerciseMedia.json';
import { mediaFor } from './exerciseMedia';

describe('exercise animations', () => {
  it('shows a glute kickback for the glute kickback', () => {
    // 0860 is labelled "Cable Kickback" in the source library but shows a triceps kickback.
    expect(mediaFor('Cable glute kickback')).toBe('0228-Kpajagk');
    expect(Object.values(media as Record<string, string>)).not.toContain('0860-HEJ6DIX');
  });

  it('shows the movement the name says (checked by eye)', () => {
    expect(mediaFor('One-arm dumbbell row')).toBe('0292-C0MA9bC'); // one arm on a bench, not a two-arm row
    expect(mediaFor('Shoulder press machine')).toBe('0587-CggQhII');
    expect(mediaFor('Rear delt fly machine')).toBe('0602-myfUsKf');
    expect(mediaFor('Preacher curl machine')).toBe('0575-q6y3OhV');
  });
});
