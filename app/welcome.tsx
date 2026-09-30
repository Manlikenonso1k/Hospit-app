import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

/**
 * First-run welcome. The tenant logo + business name are white-label and come
 * from the server after sign-in (there is no unauthenticated tenant endpoint in
 * v1), so this screen is the neutral brand shell; tenant branding appears on the
 * role home once /api/me resolves.
 *
 * The CTA is a white, shadowed, gently pulsing button — high contrast against the
 * navy canvas so the next action is obvious at a glance.
 */
export default function Welcome() {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.hero}>
          <View style={styles.logoWell}>
            <Image source={require('../assets/icon.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brand}>Hospi Sales</Text>
          <Text style={styles.tagline}>
            Orders, timers and accountability for resort hospitality teams.
          </Text>
        </View>

        <View style={styles.footer}>
          <GetStartedButton onPress={() => router.push('/login')} />
          <Text style={styles.fine}>Your role and business are assigned by your manager.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function GetStartedButton({ onPress }: { onPress: () => void }) {
  // Continuous attention pulse (native driver, so it runs off the JS thread).
  const pulse = useRef(new Animated.Value(0)).current;
  // Separate press-feedback scale so the pulse and the tap don't fight.
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });

  const onPressIn = () =>
    Animated.timing(press, { toValue: 0.96, duration: 90, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.timing(press, { toValue: 1, duration: 120, useNativeDriver: true }).start();

  return (
    <View style={styles.ctaWrap}>
      {/* Soft glow ring that breathes with the pulse to pull the eye in. */}
      <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: pulseScale }] }]} />
      <Animated.View style={{ transform: [{ scale: Animated.multiply(pulseScale, press) }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel="Get started"
          style={styles.cta}
        >
          <Text style={styles.ctaLabel}>Get started</Text>
          <Ionicons name="arrow-forward" size={22} color={colors.navy} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  safe: { flex: 1, paddingHorizontal: 24 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  logoWell: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 60, height: 60 },
  brand: { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  tagline: {
    color: '#A9C7FF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  footer: { gap: 16, paddingBottom: 8 },
  ctaWrap: { alignItems: 'stretch', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: -6,
    bottom: -6,
    borderRadius: 20,
    backgroundColor: '#A9C7FF',
  },
  cta: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    // Depth so the white button clearly floats above the navy canvas.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaLabel: { color: colors.navy, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  fine: { color: '#7798D0', fontSize: 13, textAlign: 'center' },
});
