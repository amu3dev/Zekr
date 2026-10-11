import Svg, { Circle, Defs, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '../theme';

type Props = {
  size: number;
  opacity?: number;
};

export function IslamicGeometryBackground({ size, opacity = 0.85 }: Props) {
  const { theme } = useTheme();
  const center = size / 2;
  const starRadiusOuter = size * 0.46;
  const starRadiusInner = size * 0.325;

  // Generate 8-point geometric star vertices
  const points: string[] = [];
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8 - Math.PI / 2;
    const r = i % 2 === 0 ? starRadiusOuter : starRadiusInner;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const starPath = `M ${points.join(' L ')} Z`;

  // Inner star for double border effect
  const innerStarRadiusOuter = starRadiusOuter * 0.94;
  const innerStarRadiusInner = starRadiusInner * 0.94;
  const innerPoints: string[] = [];
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8 - Math.PI / 2;
    const r = i % 2 === 0 ? innerStarRadiusOuter : innerStarRadiusInner;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    innerPoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const innerStarPath = `M ${innerPoints.join(' L ')} Z`;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="starRadialGlow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={theme.accent} stopOpacity="0.36" />
          <Stop offset="60%" stopColor={theme.accentDeep} stopOpacity="0.18" />
          <Stop offset="100%" stopColor={theme.background} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="goldMedallionAura" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={theme.warmBright} stopOpacity="0.16" />
          <Stop offset="50%" stopColor={theme.warm} stopOpacity="0.06" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Atmospheric center glows */}
      <Circle cx={center} cy={center} r={starRadiusOuter * 1.08} fill="url(#starRadialGlow)" />
      <Circle cx={center} cy={center} r={starRadiusInner * 1.2} fill="url(#goldMedallionAura)" />

      <G opacity={opacity}>
        {/* Main 8-Point Star with architectural emerald backdrop fill */}
        <Path
          d={starPath}
          fill={theme.surfaceSoft}
          stroke={theme.warmBorder}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Second inner framing star */}
        <Path
          d={innerStarPath}
          fill="none"
          stroke={theme.surfaceBorder}
          strokeWidth={0.9}
          strokeLinejoin="round"
        />

        {/* Interlocking rotated square 1 */}
        <Rect
          x={center - starRadiusInner * 0.9}
          y={center - starRadiusInner * 0.9}
          width={starRadiusInner * 1.8}
          height={starRadiusInner * 1.8}
          stroke={theme.warmBorder}
          strokeWidth={0.8}
          fill="none"
          opacity={0.4}
        />

        {/* Interlocking rotated square 2 (45 degrees) */}
        <Rect
          x={center - starRadiusInner * 0.9}
          y={center - starRadiusInner * 0.9}
          width={starRadiusInner * 1.8}
          height={starRadiusInner * 1.8}
          stroke={theme.warmBorder}
          strokeWidth={0.8}
          fill="none"
          transform={`rotate(45 ${center} ${center})`}
          opacity={0.4}
        />

        {/* Decorative corner rays & star points flourishes */}
        <Circle
          cx={center}
          cy={center}
          r={starRadiusOuter * 0.72}
          stroke={theme.surfaceBorder}
          strokeWidth={0.7}
          strokeDasharray="3 5"
          fill="none"
        />
      </G>
    </Svg>
  );
}
