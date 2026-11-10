import { describe, expect, it } from 'vitest';
import media from './exerciseMedia.json';
import { mediaFor } from './exerciseMedia';

describe('exercise animations', () => {
  it('shows a glute kickback for the glute kickback', () => {
    // 0860 is labelled "Cable Kickback" in the source library but shows a triceps kickback.
    expect(mediaFor('Cable glute kickback')).toBe('0228-Kpajagk');
    expect(Object.values(media as Record<string, string>)).not.toContain('0860-HEJ6DIX');
  });
});
