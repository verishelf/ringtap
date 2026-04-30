import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

const DURATION_MS = 480;
const TRANSLATE_Y = 14;

type ProGateAnimatedContentProps = {
  children: React.ReactNode;
  /** Merged with base styles (e.g. `proGateStack` for centered paywall art) */
  style?: StyleProp<ViewStyle>;
};

/**
 * Fade + slight slide-in when a tab/screen with an upgrade gate gains focus.
 * Re-runs on each navigation to the screen (e.g. Map / Analytics pro gates, Upgrade / Pricing).
 */
export function ProGateAnimatedContent({ children, style }: ProGateAnimatedContentProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const translateY = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [TRANSLATE_Y, 0],
      }),
    [progress]
  );

  useFocusEffect(
    useCallback(() => {
      progress.setValue(0);
      const anim = Animated.timing(progress, {
        toValue: 1,
        duration: DURATION_MS,
        useNativeDriver: true,
      });
      anim.start();
      return () => {
        anim.stop();
      };
    }, [progress])
  );

  return (
    <Animated.View style={[{ width: '100%', opacity: progress, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
