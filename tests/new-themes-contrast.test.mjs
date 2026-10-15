import assert from 'node:assert/strict';
import { test } from 'node:test';
import { THEMES, THEME_IDS, THEME_OPTIONS } from '../src/theme.ts';

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

test('theme registry contains six distinct, well-configured themes', () => {
  assert.equal(THEME_IDS.length, 6);
  assert.equal(THEME_OPTIONS.length, 6);
  const expected = [
    'midnightSapphire',
    'royalAmethyst',
    'softIvory',
    'obsidianEmber',
    'glacierPrism',
    'solarPulse',
  ];
  assert.deepEqual(THEME_IDS, expected);
  for (const id of expected) {
    const theme = THEMES[id];
    assert.ok(theme, `Theme ${id} must exist in THEMES`);
    assert.equal(theme.id, id);
    assert.ok(theme.displayName.length > 0);
    assert.ok(theme.subtitle.length > 0);
    assert.equal(theme.preview.target, 33);
  }
});

test('Obsidian Ember meets text and component contrast requirements', () => {
  const t = THEMES.obsidianEmber;
  const surfaces = [t.backgroundStart, t.backgroundMid, t.backgroundEnd, t.surface, t.surfaceElevated, t.modalCard];
  for (const bg of surfaces) {
    meets(t.warmBright, bg, 3, `counter on ${bg}`);
    for (const fg of [t.text, t.textSoft, t.textMuted]) {
      meets(fg, bg, 4.5, `text ${fg} on ${bg}`);
    }
    meets(t.onWarm, t.warm, 4.5, 'button text on warm');
  }
  meets(t.warmBright, t.ringInner, 3, 'counter on ringInner');
  meets(t.beadActiveBase, t.beadInactiveBase, 3, 'active vs inactive bead bodies');
  meets(t.switchActiveThumb, t.switchActiveTrack, 3, 'switch thumb / track');
  meets(t.switchActiveTrack, t.modalCard, 3, 'switch track / modalCard');
});

test('Glacier Prism meets text and component contrast requirements', () => {
  const t = THEMES.glacierPrism;
  const surfaces = [t.backgroundStart, t.backgroundMid, t.backgroundEnd, t.surface, t.surfaceElevated, t.modalCard];
  for (const bg of surfaces) {
    meets(t.warmBright, bg, 3, `counter on ${bg}`);
    for (const fg of [t.text, t.textSoft, t.textMuted, t.textDim, t.textFaint]) {
      meets(fg, bg, 4.5, `text ${fg} on ${bg}`);
    }
    const pill = over(t.warmSurface, bg);
    meets(t.warm, pill, 4.5, `warm on pill over ${bg}`);
    meets(t.onWarm, t.warm, 4.5, 'button text on warm');
  }
  const modalSoft = over(t.surfaceSoft, t.modalCard);
  meets(t.textDim, modalSoft, 4.5, 'secondary modal surface label');
  meets(t.warmBright, t.ringInner, 3, 'counter on ringInner');
  meets(t.beadActiveBase, t.beadInactiveBase, 3, 'active vs inactive bead bodies');
  meets(t.switchActiveThumb, t.switchActiveTrack, 3, 'switch thumb / track');
  meets(t.switchActiveTrack, t.modalCard, 3, 'switch track / modalCard');
});

test('Solar Pulse meets text and component contrast requirements', () => {
  const t = THEMES.solarPulse;
  const surfaces = [t.backgroundStart, t.backgroundMid, t.backgroundEnd, t.surface, t.surfaceElevated, t.modalCard];
  for (const bg of surfaces) {
    meets(t.warmBright, bg, 3, `counter on ${bg}`);
    for (const fg of [t.text, t.textSoft, t.textMuted]) {
      meets(fg, bg, 4.5, `text ${fg} on ${bg}`);
    }
    meets(t.onWarm, t.warm, 4.5, 'button text on warm');
  }
  meets(t.warmBright, t.ringInner, 3, 'counter on ringInner');
  meets(t.beadActiveBase, t.beadInactiveBase, 3, 'active vs inactive bead bodies');
  meets(t.switchActiveThumb, t.switchActiveTrack, 3, 'switch thumb / track');
  meets(t.switchActiveTrack, t.modalCard, 3, 'switch track / modalCard');
});
