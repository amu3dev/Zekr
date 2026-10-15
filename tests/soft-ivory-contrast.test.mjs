import assert from 'node:assert/strict';
import { test } from 'node:test';
import { THEMES } from '../src/theme.ts';

const t = THEMES.softIvory;
const rgb = color => color.startsWith('#')
  ? color.slice(1).match(/../g).map(channel => parseInt(channel, 16))
  : color.match(/[\d.]+/g).map(Number);
const over = (foreground, background, opacity = 1) => {
  const [r, g, b, alpha = 1] = typeof foreground === 'string' ? rgb(foreground) : foreground;
  const bg = typeof background === 'string' ? rgb(background) : background;
  return [r, g, b].map((channel, i) => channel * alpha * opacity + bg[i] * (1 - alpha * opacity));
};
const luminance = color => (typeof color === 'string' ? rgb(color) : color)
  .slice(0, 3).map(channel => channel / 255)
  .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  .reduce((sum, channel, i) => sum + channel * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => {
  const [low, high] = [luminance(a), luminance(b)].sort((a, b) => a - b);
  return (high + 0.05) / (low + 0.05);
};
function meets(foreground, background, minimum, label) {
  const ratio = contrast(foreground, background);
  assert.ok(ratio >= minimum, `${label}: ${ratio.toFixed(3)} < ${minimum}`);
}

// Numerical contrast budgets cover actual component pairings, not exact token snapshots.
test('ivory counters, labels, pills and placeholders meet their text contrast budgets', () => {
  const surfaces = [t.backgroundStart, t.backgroundMid, t.backgroundEnd, t.surface, t.surfaceElevated, t.modalCard];
  for (const bg of surfaces) {
    meets(t.warmBright, bg, 3, `large counter on ${bg}`);
    for (const fg of [t.text, t.textSoft, t.textMuted, t.textDim, t.textFaint]) {
      meets(fg, bg, 4.5, `text ${fg} on ${bg}`);
    }
    const pill = over(t.warmSurface, bg);
    meets(t.warm, pill, 4.5, 'round/category/selected pill');
    meets(t.onWarm, t.warm, 4.5, 'selected target / primary button');
  }
  const modalSoft = over(t.surfaceSoft, t.modalCard);
  meets(t.textDim, modalSoft, 4.5, 'secondary modal surface label');
  meets(t.textFaint, modalSoft, 4.5, 'input placeholder');
  // Free Tap's held surface and exit chip are both translucent.
  const held = over(t.warmSurface, t.background);
  meets(t.warmBright, held, 3, 'held Free Tap counter');
  meets(t.success, held, 4.5, 'Free Tap completion while held');
  meets(t.danger, modalSoft, 4.5, 'reset statistics link');
  meets(t.danger, over(t.dangerBg, t.modalCard), 4.5, 'danger confirmation label');
  meets(t.warm, over(t.surfaceSoft, held), 4.5, 'held Free Tap exit');
});

test('ivory progress and bead state remain identifiable', () => {
  for (const stop of [t.warmBright, t.warm, t.warmDeep]) {
    meets(stop, t.track, 3, 'progress gradient against unfilled track');
    meets(stop, t.background, 3, 'progress against ivory background');
  }
  meets(t.beadActiveBase, t.beadInactiveBase, 3, 'active vs inactive bead bodies');
  for (const bg of [t.backgroundStart, t.background, t.backgroundEnd, t.ringOuter]) {
    meets(over(t.beadOutline, bg, t.beadInactiveOpacity), bg, 3, 'inactive bead outline');
    meets(t.beadOutline, bg, 3, 'active bead outline');
  }
});

test('ivory enabled switches separate thumb, track and surface', () => {
  meets(t.switchActiveThumb, t.switchActiveTrack, 3, 'enabled switch thumb');
  meets(t.switchActiveTrack, t.modalCard, 3, 'enabled switch track');
  meets(t.textMuted, t.track, 3, 'off-state switch thumb');
});
