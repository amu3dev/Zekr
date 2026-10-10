import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../theme';

type IconProps = { size?: number; color?: string };

export function SettingsIcon({ size = 20, color = colors.icon }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="-10 -10 20 20" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round">
      <Path d="M0-8v3M0 5v3M-8 0h3M5 0h3M-5.7-5.7l2.1 2.1M3.6 3.6l2.1 2.1M5.7-5.7L3.6-3.6M-3.6 3.6l-2.1 2.1" />
      <Circle r={3.5} />
    </Svg>
  );
}

export function UndoIcon({ size = 20, color = colors.icon }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 14 4 9l5-5" />
      <Path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </Svg>
  );
}

export function ResetIcon({ size = 20, color = colors.icon }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <Path d="M3 3v5h5" />
    </Svg>
  );
}
