import { createContext, useContext } from 'react';

export const THEME_IDS = ['midnightSapphire', 'royalAmethyst', 'softIvory'] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type ThemeTokens = {
  id: ThemeId;
  name: string;
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
  warm: '#A95F52',
  warmBright: '#D88B73',
  warmDeep: '#7E403A',
  warmSurface: 'rgba(199, 124, 101, 0.15)',
  warmBorder: 'rgba(169, 95, 82, 0.38)',
  onWarm: '#FFF9F0',
  text: '#423044',
  textSoft: '#513A50',
  textMuted: '#705C6D',
  textDim: '#8C7583',
  textFaint: '#B5A0A8',
  ringOuter: '#E9DED2',
  ringInner: '#FFF9F0',
  track: '#E2D4C6',
  trackGlow: 'rgba(169, 95, 82, 0.18)',
  beadInactiveHighlight: '#F6E9DE',
  beadInactiveBase: '#E2D4C6',
  beadInactiveShadow: '#B9A596',
  beadActiveHighlight: '#FFE4D3',
  beadActiveBase: '#C77C65',
  beadActiveDeep: '#A05A4E',
  beadActiveShadow: '#673C3B',
  beadString: 'rgba(126, 64, 58, 0.28)',
  modalCard: '#FFF9F0',
  modalBorder: 'rgba(66, 48, 68, 0.14)',
  backdrop: 'rgba(49, 32, 46, 0.44)',
  dockBackground: 'rgba(255, 249, 240, 0.96)',
  dockBorder: 'rgba(66, 48, 68, 0.15)',
  dockDivider: 'rgba(66, 48, 68, 0.12)',
  success: '#477A5A',
  successSurface: 'rgba(71, 122, 90, 0.12)',
  successBorder: 'rgba(71, 122, 90, 0.28)',
  danger: '#B84E54',
  dangerBg: 'rgba(184, 78, 84, 0.1)',
  dangerBorder: 'rgba(184, 78, 84, 0.3)',
  icon: '#5C4557',
  iconAccent: '#A95F52',
  statusBarStyle: 'dark',
};

export const THEMES: Record<ThemeId, ThemeTokens> = {
  midnightSapphire,
  royalAmethyst,
  softIvory,
};

export const THEME_OPTIONS = THEME_IDS.map((id) => THEMES[id]);
export const DEFAULT_THEME_ID: ThemeId = 'midnightSapphire';

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);
}

export type ThemeContextValue = {
  themeId: ThemeId;
  theme: ThemeTokens;
  setThemeId: (themeId: ThemeId) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return value;
}
