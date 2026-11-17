import { Platform, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect'

/** Native glass where supported; lightweight translucent fallback elsewhere. */
export function GlassSurface() {
  if (Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable()) {
    return <GlassView pointerEvents="none" glassEffectStyle="regular" style={StyleSheet.absoluteFill} />
  }
  return <BlurView pointerEvents="none" intensity={32} tint="dark" blurMethod="none" style={StyleSheet.absoluteFill} />
}
