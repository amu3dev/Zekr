import { createContext, useContext } from 'react';

export type ThemeTokens = {
  id: string;
  name: string;
  displayName: string;
  preview: { count: number; target: number };
  category?: 'light' | 'dark';
  subtitle: string;
  background: string;
  backgroundStart: string;
  backgroundMid: string;
  backgroundEnd: string;
  surface: string;
  surfaceElevated: string;
  surfaceSoft: string;
  surfaceBorder: string;
  surfaceBorderActive: string;
  accent: string;
  accentMuted: string;
  accentBright: string;
  accentDeep: string;
  warm: string;
  warmBright: string;
  warmDeep: string;
  warmSurface: string;
  warmBorder: string;
  onWarm: string;
  switchActiveTrack?: string;
  switchActiveThumb?: string;
  text: string;
  textSoft: string;
  textMuted: string;
  textDim: string;
  textFaint: string;
  ringOuter: string;
  ringInner: string;
  track: string;
  trackGlow: string;
  beadInactiveHighlight: string;
  beadInactiveBase: string;
  beadInactiveShadow: string;
  beadActiveHighlight: string;
  beadActiveBase: string;
  beadActiveDeep: string;
  beadActiveShadow: string;
  beadString: string;
  /** Optional contrast treatment; dark themes retain their original bead rendering. */
  beadInactiveOpacity?: number;
  beadOutline?: string;
  modalCard: string;
  modalBorder: string;
  backdrop: string;
  dockBackground: string;
  dockBorder: string;
  dockDivider: string;
  success: string;
  successSurface: string;
  successBorder: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  icon: string;
  iconAccent: string;
  statusBarStyle: 'light' | 'dark';
};

const midnightSapphire: ThemeTokens = {
  id: 'midnightSapphire',
  name: 'Midnight Sapphire',
  displayName: 'ياقوت الليل',
  preview: { count: 12, target: 33 },
  category: 'dark',
  subtitle: 'سكينة ليلية بلون الياقوت',
  background: '#0B132B',
  backgroundStart: '#080F24',
  backgroundMid: '#0B132B',
  backgroundEnd: '#111D42',
  surface: '#1B2850',
  surfaceElevated: '#24345F',
  surfaceSoft: 'rgba(83, 105, 173, 0.13)',
  surfaceBorder: 'rgba(160, 179, 236, 0.22)',
  surfaceBorderActive: 'rgba(240, 207, 145, 0.65)',
  accent: '#5369AD',
  accentMuted: '#394B83',
  accentBright: '#9EAEEC',
  accentDeep: '#283866',
  warm: '#F0CF91',
  warmBright: '#FFE9B9',
  warmDeep: '#B38E50',
  warmSurface: 'rgba(240, 207, 145, 0.16)',
  warmBorder: 'rgba(240, 207, 145, 0.45)',
  onWarm: '#17203D',
  text: '#F7F3E9',
  textSoft: '#F2F0EA',
  textMuted: '#C6CBE0',
  textDim: '#9DA8CA',
  textFaint: '#66739B',
  ringOuter: '#101A38',
  ringInner: '#131F40',
  track: '#2A3B70',
  trackGlow: 'rgba(240, 207, 145, 0.23)',
  beadInactiveHighlight: '#7184BE',
  beadInactiveBase: '#3C4E8A',
  beadInactiveShadow: '#1C2A56',
  beadActiveHighlight: '#FFF3D0',
  beadActiveBase: '#F0CF91',
  beadActiveDeep: '#C29B5B',
  beadActiveShadow: '#76572A',
  beadString: 'rgba(158, 174, 236, 0.4)',
  modalCard: '#182448',
  modalBorder: 'rgba(240, 207, 145, 0.35)',
  backdrop: 'rgba(4, 8, 20, 0.86)',
  dockBackground: 'rgba(20, 32, 68, 0.94)',
  dockBorder: 'rgba(158, 174, 236, 0.26)',
  dockDivider: 'rgba(198, 203, 224, 0.16)',
  success: '#B9E4C9',
  successSurface: 'rgba(117, 190, 149, 0.16)',
  successBorder: 'rgba(185, 228, 201, 0.35)',
  danger: '#F4A6A6',
  dangerBg: 'rgba(244, 166, 166, 0.14)',
  dangerBorder: 'rgba(244, 166, 166, 0.38)',
  icon: '#D8DDF0',
  iconAccent: '#F0CF91',
  statusBarStyle: 'light',
};

const royalAmethyst: ThemeTokens = {
  id: 'royalAmethyst',
  name: 'Royal Amethyst',
  displayName: 'الجمشت الملكي',
  preview: { count: 12, target: 33 },
  category: 'dark',
  subtitle: 'هوية بنفسجية رقيقة ومهيبة',
  background: '#21132F',
  backgroundStart: '#1A0E27',
  backgroundMid: '#21132F',
  backgroundEnd: '#311C40',
  surface: '#392345',
  surfaceElevated: '#4A2E58',
  surfaceSoft: 'rgba(152, 111, 173, 0.15)',
  surfaceBorder: 'rgba(220, 181, 221, 0.22)',
  surfaceBorderActive: 'rgba(244, 183, 167, 0.65)',
  accent: '#986FAD',
  accentMuted: '#68497D',
  accentBright: '#C9A8D3',
  accentDeep: '#513463',
  warm: '#F4B7A7',
  warmBright: '#FFD6C9',
  warmDeep: '#B96F67',
  warmSurface: 'rgba(244, 183, 167, 0.16)',
  warmBorder: 'rgba(244, 183, 167, 0.46)',
  onWarm: '#351D36',
  text: '#FBF1F7',
  textSoft: '#F7EAF3',
  textMuted: '#D9C6D9',
  textDim: '#B799B9',
  textFaint: '#806785',
  ringOuter: '#281736',
  ringInner: '#2C1A3B',
  track: '#573666',
  trackGlow: 'rgba(244, 183, 167, 0.23)',
  beadInactiveHighlight: '#B183C0',
  beadInactiveBase: '#744C86',
  beadInactiveShadow: '#392246',
  beadActiveHighlight: '#FFE9E0',
  beadActiveBase: '#F4B7A7',
  beadActiveDeep: '#C97E7B',
  beadActiveShadow: '#7D464F',
  beadString: 'rgba(201, 168, 211, 0.4)',
  modalCard: '#321D40',
  modalBorder: 'rgba(244, 183, 167, 0.34)',
  backdrop: 'rgba(14, 7, 21, 0.86)',
  dockBackground: 'rgba(48, 27, 61, 0.95)',
  dockBorder: 'rgba(201, 168, 211, 0.28)',
  dockDivider: 'rgba(217, 198, 217, 0.16)',
  success: '#C8E5D4',
  successSurface: 'rgba(147, 205, 169, 0.15)',
  successBorder: 'rgba(200, 229, 212, 0.34)',
  danger: '#F7AAA8',
  dangerBg: 'rgba(247, 170, 168, 0.14)',
  dangerBorder: 'rgba(247, 170, 168, 0.38)',
  icon: '#E7D9E7',
  iconAccent: '#F4B7A7',
  statusBarStyle: 'light',
};

const softIvory: ThemeTokens = {
  id: 'softIvory',
  name: 'Soft Ivory',
  displayName: 'العاجي الهادئ',
  preview: { count: 12, target: 33 },
  category: 'light',
  subtitle: 'دفء هادئ وبساطة مضيئة',
  background: '#F5EFE6',
  backgroundStart: '#F1E8DC',
  backgroundMid: '#F5EFE6',
  backgroundEnd: '#F8F4ED',
  surface: '#FFF9F0',
  surfaceElevated: '#FFFFFF',
  surfaceSoft: 'rgba(199, 124, 101, 0.11)',
  surfaceBorder: 'rgba(66, 48, 68, 0.15)',
  surfaceBorderActive: 'rgba(199, 124, 101, 0.68)',
  accent: '#C77C65',
  accentMuted: '#A65E51',
  accentBright: '#E0A18B',
  accentDeep: '#82493F',
  // Deeper terracotta keeps small labels legible on translucent warm surfaces.
  warm: '#8E4B40',
  warmBright: '#A65E51',
  warmDeep: '#7E403A',
  warmSurface: 'rgba(199, 124, 101, 0.15)',
  warmBorder: 'rgba(169, 95, 82, 0.38)',
  onWarm: '#FFF9F0',
  switchActiveTrack: '#A65E51',
  switchActiveThumb: '#FFF9F0',
  text: '#423044',
  textSoft: '#513A50',
  textMuted: '#705C6D',
  textDim: '#735E6C',
  textFaint: '#75616F',
  ringOuter: '#E9DED2',
  ringInner: '#FFF9F0',
  track: '#E2D4C6',
  trackGlow: 'rgba(169, 95, 82, 0.18)',
  beadInactiveHighlight: '#F6E9DE',
  beadInactiveBase: '#E2D4C6',
  beadInactiveShadow: '#B9A596',
  beadActiveHighlight: '#FFE4D3',
  beadActiveBase: '#985447',
  beadActiveDeep: '#A05A4E',
  beadActiveShadow: '#673C3B',
  beadString: 'rgba(126, 64, 58, 0.28)',
  beadInactiveOpacity: 1,
  beadOutline: '#82493F',
  modalCard: '#FFF9F0',
  modalBorder: 'rgba(66, 48, 68, 0.14)',
  backdrop: 'rgba(49, 32, 46, 0.44)',
  dockBackground: 'rgba(255, 249, 240, 0.96)',
  dockBorder: 'rgba(66, 48, 68, 0.15)',
  dockDivider: 'rgba(66, 48, 68, 0.12)',
  success: '#39694C',
  successSurface: 'rgba(71, 122, 90, 0.12)',
  successBorder: 'rgba(71, 122, 90, 0.28)',
  danger: '#A44249',
  dangerBg: 'rgba(184, 78, 84, 0.1)',
  dangerBorder: 'rgba(184, 78, 84, 0.3)',
  icon: '#5C4557',
  iconAccent: '#A95F52',
  statusBarStyle: 'dark',
};

const obsidianEmber: ThemeTokens = {
  id: 'obsidianEmber',
  name: 'Obsidian Ember',
  displayName: 'جمر الليل',
  preview: { count: 12, target: 33 },
  category: 'dark',
  subtitle: 'حجر بركاني داكن ووهج نحاسي دافئ',
  background: '#111114',
  backgroundStart: '#0B0B0D',
  backgroundMid: '#111114',
  backgroundEnd: '#1A181E',
  surface: '#242126',
  surfaceElevated: '#302C33',
  surfaceSoft: 'rgba(255, 121, 79, 0.11)',
  surfaceBorder: 'rgba(245, 237, 231, 0.14)',
  surfaceBorderActive: 'rgba(255, 121, 79, 0.65)',
  accent: '#8E5742',
  accentMuted: '#5A3628',
  accentBright: '#FF9873',
  accentDeep: '#381F16',
  warm: '#FF794F',
  warmBright: '#FFAE94',
  warmDeep: '#C9522D',
  warmSurface: 'rgba(255, 121, 79, 0.16)',
  warmBorder: 'rgba(255, 121, 79, 0.45)',
  onWarm: '#140C08',
  switchActiveTrack: '#A84B29',
  switchActiveThumb: '#FFD2C2',
  text: '#F5EDE7',
  textSoft: '#EAE0D8',
  textMuted: '#C7BCB3',
  textDim: '#A1958C',
  textFaint: '#7D726A',
  ringOuter: '#17161B',
  ringInner: '#1D1C22',
  track: '#36313B',
  trackGlow: 'rgba(255, 121, 79, 0.20)',
  beadInactiveHighlight: '#5A5260',
  beadInactiveBase: '#332D37',
  beadInactiveShadow: '#17151A',
  beadActiveHighlight: '#FFEFE8',
  beadActiveBase: '#FF794F',
  beadActiveDeep: '#C4502B',
  beadActiveShadow: '#6B2511',
  beadString: 'rgba(221, 163, 111, 0.35)',
  modalCard: '#1A181E',
  modalBorder: 'rgba(255, 121, 79, 0.30)',
  backdrop: 'rgba(7, 7, 9, 0.88)',
  dockBackground: 'rgba(26, 24, 30, 0.95)',
  dockBorder: 'rgba(245, 237, 231, 0.15)',
  dockDivider: 'rgba(245, 237, 231, 0.12)',
  success: '#75D89F',
  successSurface: 'rgba(117, 216, 159, 0.14)',
  successBorder: 'rgba(117, 216, 159, 0.34)',
  danger: '#FF8888',
  dangerBg: 'rgba(255, 136, 136, 0.14)',
  dangerBorder: 'rgba(255, 136, 136, 0.38)',
  icon: '#E3D8D0',
  iconAccent: '#FF794F',
  statusBarStyle: 'light',
};

const glacierPrism: ThemeTokens = {
  id: 'glacierPrism',
  name: 'Glacier Prism',
  displayName: 'طيف الجليد',
  preview: { count: 12, target: 33 },
  category: 'light',
  subtitle: 'صفاء بلوري وانتعاش جليدي شفاف',
  background: '#EAF5F7',
  backgroundStart: '#E2F1F4',
  backgroundMid: '#EAF5F7',
  backgroundEnd: '#F2FAF9',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSoft: 'rgba(8, 127, 153, 0.08)',
  surfaceBorder: 'rgba(23, 54, 66, 0.14)',
  surfaceBorderActive: 'rgba(8, 127, 153, 0.65)',
  accent: '#087F99',
  accentMuted: '#3E8795',
  accentBright: '#65CBD4',
  accentDeep: '#065B6E',
  warm: '#076B82',
  warmBright: '#066378',
  warmDeep: '#054F5E',
  warmSurface: 'rgba(7, 107, 130, 0.10)',
  warmBorder: 'rgba(7, 107, 130, 0.38)',
  onWarm: '#FFFFFF',
  switchActiveTrack: '#087F99',
  switchActiveThumb: '#FFFFFF',
  text: '#173642',
  textSoft: '#234957',
  textMuted: '#355966',
  textDim: '#406775',
  textFaint: '#4A7080',
  ringOuter: '#D9ECF0',
  ringInner: '#F4FAFB',
  track: '#CCE3E7',
  trackGlow: 'rgba(8, 127, 153, 0.18)',
  beadInactiveHighlight: '#FFFFFF',
  beadInactiveBase: '#DEF0F4',
  beadInactiveShadow: '#A0CCD6',
  beadActiveHighlight: '#E4FBFC',
  beadActiveBase: '#087F99',
  beadActiveDeep: '#065B6E',
  beadActiveShadow: '#043E4B',
  beadString: 'rgba(8, 127, 153, 0.28)',
  beadInactiveOpacity: 1,
  beadOutline: '#087F99',
  modalCard: '#FFFFFF',
  modalBorder: 'rgba(23, 54, 66, 0.12)',
  backdrop: 'rgba(18, 38, 46, 0.45)',
  dockBackground: 'rgba(255, 255, 255, 0.96)',
  dockBorder: 'rgba(23, 54, 66, 0.14)',
  dockDivider: 'rgba(23, 54, 66, 0.10)',
  success: '#287C54',
  successSurface: 'rgba(40, 124, 84, 0.12)',
  successBorder: 'rgba(40, 124, 84, 0.30)',
  danger: '#B53838',
  dangerBg: 'rgba(181, 56, 56, 0.10)',
  dangerBorder: 'rgba(181, 56, 56, 0.30)',
  icon: '#2A5362',
  iconAccent: '#087F99',
  statusBarStyle: 'dark',
};

const solarPulse: ThemeTokens = {
  id: 'solarPulse',
  name: 'Solar Pulse',
  displayName: 'نبض الشمس',
  preview: { count: 12, target: 33 },
  category: 'dark',
  subtitle: 'إشراق الغروب الدافئ بعمق بنفسجي',
  background: '#251D29',
  backgroundStart: '#1D1622',
  backgroundMid: '#251D29',
  backgroundEnd: '#332335',
  surface: '#382A37',
  surfaceElevated: '#483447',
  surfaceSoft: 'rgba(255, 134, 107, 0.12)',
  surfaceBorder: 'rgba(244, 198, 109, 0.18)',
  surfaceBorderActive: 'rgba(255, 134, 107, 0.65)',
  accent: '#B35D67',
  accentMuted: '#753440',
  accentBright: '#FFA89E',
  accentDeep: '#4E1E28',
  warm: '#FF866B',
  warmBright: '#FFB299',
  warmDeep: '#CA523A',
  warmSurface: 'rgba(255, 134, 107, 0.16)',
  warmBorder: 'rgba(244, 198, 109, 0.42)',
  onWarm: '#22121E',
  switchActiveTrack: '#BF513B',
  switchActiveThumb: '#FFF0DC',
  text: '#FFF0DC',
  textSoft: '#F5E2CE',
  textMuted: '#D6BEB1',
  textDim: '#B0978C',
  textFaint: '#8A746B',
  ringOuter: '#2B202D',
  ringInner: '#322333',
  track: '#543A50',
  trackGlow: 'rgba(255, 134, 107, 0.22)',
  beadInactiveHighlight: '#86627C',
  beadInactiveBase: '#543A4E',
  beadInactiveShadow: '#2A1A27',
  beadActiveHighlight: '#FFF3D6',
  beadActiveBase: '#FF9677',
  beadActiveDeep: '#DE674D',
  beadActiveShadow: '#782718',
  beadString: 'rgba(244, 198, 109, 0.38)',
  modalCard: '#2E2130',
  modalBorder: 'rgba(255, 134, 107, 0.30)',
  backdrop: 'rgba(15, 10, 18, 0.88)',
  dockBackground: 'rgba(42, 30, 43, 0.95)',
  dockBorder: 'rgba(244, 198, 109, 0.20)',
  dockDivider: 'rgba(255, 240, 220, 0.12)',
  success: '#9CE4B4',
  successSurface: 'rgba(156, 228, 180, 0.14)',
  successBorder: 'rgba(156, 228, 180, 0.34)',
  danger: '#FF9696',
  dangerBg: 'rgba(255, 150, 150, 0.14)',
  dangerBorder: 'rgba(255, 150, 150, 0.38)',
  icon: '#E8D5C8',
  iconAccent: '#F4C66D',
  statusBarStyle: 'light',
};

// Register themes here once; IDs, validation, counts and gallery options derive from this registry.
export const THEMES = {
  midnightSapphire,
  royalAmethyst,
  softIvory,
  obsidianEmber,
  glacierPrism,
  solarPulse,
} satisfies Record<string, ThemeTokens>;

export type ThemeId = keyof typeof THEMES;
export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export const THEME_OPTIONS = THEME_IDS.map((id) => ({ ...THEMES[id], id }));
export const DEFAULT_THEME_ID: ThemeId = 'midnightSapphire';

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);
}

export type ThemeContextValue = {
  themeId: ThemeId;
  theme: ThemeTokens;
  setThemeId: (themeId: ThemeId) => void;
  isReady: boolean;
  hydration: 'loading' | 'ready' | 'error';
  saveStatus: 'saved' | 'pending' | 'saving' | 'error';
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return value;
}
