import Svg, { Circle, Defs, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '../theme';

type Props = {
  size: number;
  opacity?: number;
};

export function IslamicGeometryBackground({ size, opacity = 0.08 }: Props) {
  const center = size / 2;
  const radius = size * 0.45;
  const starRadiusOuter = size * 0.38;
  const starRadiusInner = size * 0.27;

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

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="ambientGoldGlow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={colors.goldLight} stopOpacity="0.22" />
          <Stop offset="45%" stopColor={colors.gold} stopOpacity="0.08" />
          <Stop offset="100%" stopColor="#050D0A" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="emeraldCenterGlow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#2F855A" stopOpacity="0.3" />
          <Stop offset="60%" stopColor="#0E2E23" stopOpacity="0.08" />
          <Stop offset="100%" stopColor="#050D0A" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Ambient background glows */}
      <Circle cx={center} cy={center} r={radius * 1.15} fill="url(#emeraldCenterGlow)" />
      <Circle cx={center} cy={center} r={radius * 0.85} fill="url(#ambientGoldGlow)" />

      <G opacity={opacity}>
        {/* Outer decorative halo */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.goldLight}
          strokeWidth={1}
          strokeDasharray="3 7"
          fill="none"
        />

        {/* Mid framing circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius * 0.9}
          stroke={colors.gold}
          strokeWidth={0.8}
          fill="none"
        />

        {/* 8-pointed Islamic Star */}
        <Path
          d={starPath}
          stroke={colors.goldLight}
          strokeWidth={1.2}
          fill={colors.gold}
          fillOpacity={0.03}
        />

        {/* Interlocking rotated square 1 */}
        <Rect
          x={center - starRadiusInner * 0.85}
          y={center - starRadiusInner * 0.85}
          width={starRadiusInner * 1.7}
          height={starRadiusInner * 1.7}
          stroke={colors.gold}
          strokeWidth={0.7}
          fill="none"
        />

        {/* Interlocking rotated square 2 (45 degrees) */}
        <Rect
          x={center - starRadiusInner * 0.85}
          y={center - starRadiusInner * 0.85}
          width={starRadiusInner * 1.7}
          height={starRadiusInner * 1.7}
          stroke={colors.gold}
          strokeWidth={0.7}
          fill="none"
          transform={`rotate(45 ${center} ${center})`}
        />

        {/* Core delicate inner medallion */}
        <Circle
          cx={center}
          cy={center}
          r={starRadiusInner * 0.5}
          stroke={colors.goldLight}
          strokeWidth={0.9}
          strokeDasharray="2 4"
          fill="none"
        />
      </G>
    </Svg>
  );
}
