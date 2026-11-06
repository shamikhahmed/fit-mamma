import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useT } from '../i18n/useT';

const CONFETTI = ['🌸', '✨', '💖', '⭐', '🎀', '✨', '🌼', '💫'];

/** Full-screen celebration sticker; tap anywhere or wait 2.6 s to close. */
export function StickerOverlay() {
  const sticker = useAppStore((s) => s.sticker);
  const clear = useAppStore((s) => s.celebrate);
  const t = useT();

  useEffect(() => {
    if (!sticker) return;
    try {
      navigator.vibrate?.([40, 30, 80]);
    } catch {
      /* not supported */
    }
    const id = window.setTimeout(() => clear(null), 2600);
    return () => window.clearTimeout(id);
  }, [sticker, clear]);

  if (!sticker) return null;
  return (
    <div className="sticker-overlay" role="status" aria-live="polite" onClick={() => clear(null)}>
      <div className="sticker-confetti" aria-hidden>
        {CONFETTI.map((c, i) => (
          <span key={i} style={{ ['--i' as string]: i }}>
            {c}
          </span>
        ))}
      </div>
      <div className="sticker-card">
        <div className="sticker-emoji" aria-hidden>
          {sticker.emoji}
        </div>
        <div className="sticker-title">{t(sticker.title)}</div>
        {sticker.sub && <div className="sticker-sub">{t(sticker.sub)}</div>}
      </div>
    </div>
  );
}
