import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { IslamicGeometryBackground } from './IslamicGeometry';

/** Static atmosphere shared by both Free Tap presentations. Never owns touches. */
export function CountingBackdrop() {
  const { theme } = useTheme();
  return <View testID="free-tap-backdrop" pointerEvents="none" aria-hidden accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    <LinearGradient colors={[theme.backgroundStart, theme.backgroundMid, theme.backgroundEnd]} style={StyleSheet.absoluteFill} />
    <View style={{ position: 'absolute', right: -100, top: -80, width: 260, height: 260,
      borderRadius: 130, backgroundColor: theme.accent, opacity: 0.06 }} />
  </View>;
}

export function CountingGeometry({ size }: { size: number }) {
  return <View testID="free-tap-geometry" pointerEvents="none" aria-hidden accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
    <IslamicGeometryBackground size={size} opacity={0.56} />
  </View>;
}
